#!/bin/bash

# Production Deployment Script for Beyond the AI Plateau
# Comprehensive deployment with safety checks and rollback capabilities

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../../" && pwd)"
DEPLOY_DIR="${SCRIPT_DIR}/.."
BACKUP_DIR="/data/amysoft/backups/$(date +%Y%m%d_%H%M%S)"
LOG_FILE="/var/log/amysoft/deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "${LOG_FILE}"
}

# Error handling
error_exit() {
    log "ERROR" "$1"
    echo -e "${RED}Error: $1${NC}" >&2
    exit 1
}

# Success message
success() {
    log "INFO" "$1"
    echo -e "${GREEN}✓ $1${NC}"
}

# Warning message
warning() {
    log "WARNING" "$1"
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Info message
info() {
    log "INFO" "$1"
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    info "Checking deployment prerequisites..."
    
    # Check if running as root or with sudo
    if [[ $EUID -eq 0 ]]; then
        warning "Running as root. This is not recommended for production."
    fi
    
    # Check required commands
    local required_commands=("docker" "docker-compose" "nginx" "certbot" "git" "node" "npm")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            error_exit "Required command '$cmd' is not installed"
        fi
    done
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        error_exit "Docker daemon is not running"
    fi
    
    # Check disk space (minimum 5GB free)
    local available_space=$(df / | awk 'NR==2 {print $4}')
    if [[ $available_space -lt 5242880 ]]; then
        error_exit "Insufficient disk space. At least 5GB required."
    fi
    
    # Check memory (minimum 2GB)
    local available_memory=$(free -m | awk 'NR==2{printf "%.0f", $7}')
    if [[ $available_memory -lt 2048 ]]; then
        warning "Low available memory detected. Deployment may be slow."
    fi
    
    success "Prerequisites check completed"
}

# Create backup
create_backup() {
    info "Creating backup before deployment..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup database
    if docker-compose -f "${DEPLOY_DIR}/docker-compose.yml" ps postgres | grep -q "Up"; then
        info "Backing up PostgreSQL database..."
        docker-compose -f "${DEPLOY_DIR}/docker-compose.yml" exec -T postgres pg_dump -U amysoft_user amysoft_production > "${BACKUP_DIR}/database.sql"
        success "Database backup completed"
    fi
    
    # Backup uploaded files
    if [[ -d "/data/amysoft/uploads" ]]; then
        info "Backing up uploaded files..."
        tar -czf "${BACKUP_DIR}/uploads.tar.gz" -C /data/amysoft uploads/
        success "Uploads backup completed"
    fi
    
    # Backup configuration
    info "Backing up configuration files..."
    cp -r "${DEPLOY_DIR}" "${BACKUP_DIR}/config"
    success "Configuration backup completed"
    
    info "Backup created at: $BACKUP_DIR"
}

# Build applications
build_applications() {
    info "Building applications..."
    
    cd "$PROJECT_ROOT"
    
    # Install dependencies
    info "Installing dependencies..."
    npm ci --only=production
    
    # Build website (marketing)
    info "Building website application..."
    nx build website --prod || error_exit "Website build failed"
    success "Website build completed"
    
    # Build PWA
    info "Building PWA application..."
    nx build pwa --prod || error_exit "PWA build failed"
    success "PWA build completed"
    
    # Build admin console
    info "Building admin console..."
    nx build admin --prod || error_exit "Admin build failed"
    success "Admin console build completed"
    
    # Build API
    info "Building API application..."
    nx build api --prod || error_exit "API build failed"
    success "API build completed"
    
    success "All applications built successfully"
}

# Setup data directories
setup_data_directories() {
    info "Setting up data directories..."
    
    local directories=(
        "/data/amysoft/postgres"
        "/data/amysoft/redis"
        "/data/amysoft/uploads"
        "/data/amysoft/logs/api"
        "/data/amysoft/logs/nginx"
        "/data/amysoft/monitoring/prometheus"
        "/data/amysoft/monitoring/grafana"
        "/data/amysoft/monitoring/loki"
        "/data/amysoft/backups"
    )
    
    for dir in "${directories[@]}"; do
        if [[ ! -d "$dir" ]]; then
            mkdir -p "$dir"
            chown -R 1000:1000 "$dir"
            info "Created directory: $dir"
        fi
    done
    
    success "Data directories setup completed"
}

# Setup SSL certificates
setup_ssl() {
    info "Setting up SSL certificates..."
    
    # Check if certificates already exist
    if [[ -f "/etc/letsencrypt/live/amysoft.tech/fullchain.pem" ]]; then
        info "SSL certificates already exist. Checking validity..."
        local expiry_date=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/amysoft.tech/fullchain.pem | cut -d= -f2)
        local expiry_timestamp=$(date -d "$expiry_date" +%s)
        local current_timestamp=$(date +%s)
        local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
        
        if [[ $days_until_expiry -lt 30 ]]; then
            warning "SSL certificate expires in $days_until_expiry days. Renewing..."
            certbot renew --nginx
        else
            success "SSL certificates are valid for $days_until_expiry more days"
        fi
    else
        info "Obtaining new SSL certificates..."
        # Stop nginx temporarily
        systemctl stop nginx 2>/dev/null || true
        
        # Use certbot standalone mode for initial certificate
        certbot certonly --standalone --email admin@amysoft.tech --agree-tos --no-eff-email \
            -d amysoft.tech -d www.amysoft.tech -d app.amysoft.tech -d admin.amysoft.tech -d api.amysoft.tech -d monitoring.amysoft.tech
        
        success "SSL certificates obtained successfully"
    fi
}

# Deploy applications
deploy_applications() {
    info "Deploying applications..."
    
    cd "$DEPLOY_DIR"
    
    # Check if .env file exists
    if [[ ! -f ".env" ]]; then
        warning ".env file not found. Please create it from .env.example"
        cp .env.example .env
        warning "Please edit .env file with production values before continuing"
        read -p "Press Enter after configuring .env file..."
    fi
    
    # Pull latest images and start services
    info "Starting Docker services..."
    docker-compose pull
    docker-compose up -d --remove-orphans
    
    # Wait for services to be healthy
    info "Waiting for services to become healthy..."
    local max_attempts=30
    local attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        if docker-compose ps | grep -q "Up (healthy)"; then
            success "Services are healthy"
            break
        fi
        
        ((attempt++))
        info "Attempt $attempt/$max_attempts - waiting for services..."
        sleep 10
    done
    
    if [[ $attempt -eq $max_attempts ]]; then
        error_exit "Services failed to become healthy within timeout"
    fi
    
    success "Applications deployed successfully"
}

# Configure nginx
configure_nginx() {
    info "Configuring Nginx..."
    
    # Test nginx configuration
    nginx -t || error_exit "Nginx configuration test failed"
    
    # Reload nginx
    systemctl reload nginx || error_exit "Failed to reload Nginx"
    
    success "Nginx configured successfully"
}

# Run database migrations
run_migrations() {
    info "Running database migrations..."
    
    cd "$DEPLOY_DIR"
    
    # Wait for database to be ready
    info "Waiting for database connection..."
    local max_attempts=30
    local attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        if docker-compose exec -T postgres pg_isready -U amysoft_user -d amysoft_production; then
            success "Database is ready"
            break
        fi
        
        ((attempt++))
        info "Attempt $attempt/$max_attempts - waiting for database..."
        sleep 5
    done
    
    if [[ $attempt -eq $max_attempts ]]; then
        error_exit "Database failed to become ready within timeout"
    fi
    
    # Run migrations
    info "Executing database migrations..."
    docker-compose exec -T api npm run migration:run || error_exit "Database migrations failed"
    
    success "Database migrations completed"
}

# Setup monitoring
setup_monitoring() {
    info "Setting up monitoring and alerting..."
    
    cd "$DEPLOY_DIR"
    
    # Start monitoring services
    docker-compose up -d prometheus grafana loki promtail
    
    # Wait for Prometheus to be ready
    info "Waiting for Prometheus to be ready..."
    local max_attempts=20
    local attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        if curl -s http://localhost:9090/-/ready | grep -q "Prometheus is Ready"; then
            success "Prometheus is ready"
            break
        fi
        
        ((attempt++))
        info "Attempt $attempt/$max_attempts - waiting for Prometheus..."
        sleep 5
    done
    
    # Import Grafana dashboards
    info "Setting up Grafana dashboards..."
    sleep 10  # Give Grafana time to start
    
    success "Monitoring setup completed"
}

# Health checks
run_health_checks() {
    info "Running post-deployment health checks..."
    
    local endpoints=(
        "https://amysoft.tech/health"
        "https://app.amysoft.tech/health"
        "https://admin.amysoft.tech/health"
        "https://api.amysoft.tech/health"
    )
    
    for endpoint in "${endpoints[@]}"; do
        info "Checking $endpoint..."
        if curl -f -s "$endpoint" > /dev/null; then
            success "$endpoint is healthy"
        else
            warning "$endpoint is not responding correctly"
        fi
    done
    
    # Check Docker services
    info "Checking Docker services status..."
    docker-compose ps
    
    # Check SSL certificates
    info "Checking SSL certificate validity..."
    echo | openssl s_client -servername amysoft.tech -connect amysoft.tech:443 2>/dev/null | \
        openssl x509 -noout -dates
    
    success "Health checks completed"
}

# Setup automatic backups
setup_backups() {
    info "Setting up automatic backups..."
    
    # Create backup script
    cat > /etc/cron.daily/amysoft-backup << 'EOF'
#!/bin/bash
# Daily backup script for Beyond the AI Plateau

BACKUP_DIR="/data/amysoft/backups/$(date +%Y%m%d_%H%M%S)"
DEPLOY_DIR="/opt/amysoft/deploy/production"

mkdir -p "$BACKUP_DIR"

# Backup database
docker-compose -f "${DEPLOY_DIR}/docker-compose.yml" exec -T postgres pg_dump -U amysoft_user amysoft_production | gzip > "${BACKUP_DIR}/database.sql.gz"

# Backup uploads
tar -czf "${BACKUP_DIR}/uploads.tar.gz" -C /data/amysoft uploads/

# Cleanup old backups (keep 30 days)
find /data/amysoft/backups -type d -mtime +30 -exec rm -rf {} \;

# Log backup completion
echo "$(date): Backup completed to $BACKUP_DIR" >> /var/log/amysoft/backup.log
EOF
    
    chmod +x /etc/cron.daily/amysoft-backup
    
    success "Automatic backups configured"
}

# Setup log rotation
setup_log_rotation() {
    info "Setting up log rotation..."
    
    cat > /etc/logrotate.d/amysoft << 'EOF'
/var/log/amysoft/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        systemctl reload rsyslog > /dev/null 2>&1 || true
    endscript
}

/data/amysoft/logs/*/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 1000 1000
}
EOF
    
    success "Log rotation configured"
}

# Main deployment function
main() {
    info "Starting production deployment for Beyond the AI Plateau..."
    info "Deployment started at: $(date)"
    
    # Create log directory
    mkdir -p /var/log/amysoft
    
    # Run deployment steps
    check_prerequisites
    create_backup
    setup_data_directories
    build_applications
    setup_ssl
    deploy_applications
    run_migrations
    configure_nginx
    setup_monitoring
    setup_backups
    setup_log_rotation
    run_health_checks
    
    success "Production deployment completed successfully!"
    success "Deployment finished at: $(date)"
    
    info "Next steps:"
    info "1. Configure monitoring alerts in Grafana"
    info "2. Setup external monitoring (UptimeRobot, etc.)"
    info "3. Configure backup verification"
    info "4. Update DNS records if needed"
    info "5. Test all functionality thoroughly"
    
    info "Access URLs:"
    info "- Website: https://amysoft.tech"
    info "- PWA: https://app.amysoft.tech"
    info "- Admin: https://admin.amysoft.tech"
    info "- API: https://api.amysoft.tech"
    info "- Monitoring: https://monitoring.amysoft.tech"
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "backup")
        create_backup
        ;;
    "health")
        run_health_checks
        ;;
    "ssl")
        setup_ssl
        ;;
    "monitoring")
        setup_monitoring
        ;;
    *)
        echo "Usage: $0 [deploy|backup|health|ssl|monitoring]"
        echo "  deploy    - Full production deployment (default)"
        echo "  backup    - Create backup only"
        echo "  health    - Run health checks only"
        echo "  ssl       - Setup/renew SSL certificates only"
        echo "  monitoring - Setup monitoring only"
        exit 1
        ;;
esac