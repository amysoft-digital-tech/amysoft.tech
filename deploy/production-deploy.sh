#!/bin/bash

# Production Deployment Script for Amysoft.tech
# This script handles the complete production deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOYMENT_ENV="production"
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
LOG_FILE="./logs/deployment_$(date +%Y%m%d_%H%M%S).log"
HEALTH_CHECK_TIMEOUT=300
ROLLBACK_ENABLED=true

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a "$LOG_FILE"
}

# Pre-deployment checks
pre_deployment_checks() {
    log "Starting pre-deployment checks..."
    
    # Check if required files exist
    if [[ ! -f ".env.prod" ]]; then
        error "Production environment file (.env.prod) not found"
        exit 1
    fi
    
    if [[ ! -f "docker-compose.prod.yml" ]]; then
        error "Production docker-compose file not found"
        exit 1
    fi
    
    # Check Docker and Docker Compose
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check disk space (require at least 5GB free)
    AVAILABLE_SPACE=$(df / | tail -1 | awk '{print $4}')
    if [[ $AVAILABLE_SPACE -lt 5242880 ]]; then
        error "Insufficient disk space. At least 5GB required."
        exit 1
    fi
    
    # Check if ports are available
    for port in 80 443 4200 4201 3000 8100 5432 6379 9090 3002; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
            warning "Port $port is already in use"
        fi
    done
    
    log "Pre-deployment checks completed successfully"
}

# Create backup
create_backup() {
    log "Creating backup..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup database if it exists
    if docker ps | grep -q "postgres"; then
        log "Creating database backup..."
        docker exec amysoft-postgres-prod pg_dump -U postgres amysoft_prod > "$BACKUP_DIR/database_backup.sql"
    fi
    
    # Backup application data
    if [[ -d "data" ]]; then
        log "Creating application data backup..."
        cp -r data "$BACKUP_DIR/data_backup"
    fi
    
    # Backup configuration files
    cp .env.prod "$BACKUP_DIR/env_backup"
    cp docker-compose.prod.yml "$BACKUP_DIR/docker-compose_backup.yml"
    
    log "Backup created at $BACKUP_DIR"
}

# Build and test applications
build_and_test() {
    log "Building and testing applications..."
    
    # Run comprehensive tests
    log "Running admin console tests..."
    if ! nx test admin --watchAll=false --coverage; then
        error "Admin console tests failed"
        exit 1
    fi
    
    log "Running end-to-end tests..."
    if ! nx e2e admin --headless; then
        error "E2E tests failed"
        exit 1
    fi
    
    # Build all applications
    log "Building production images..."
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    log "Build and test completed successfully"
}

# Deploy services
deploy_services() {
    log "Starting service deployment..."
    
    # Stop existing services gracefully
    log "Stopping existing services..."
    docker-compose -f docker-compose.prod.yml down --timeout 30
    
    # Remove unused images and volumes
    docker system prune -f --volumes
    
    # Start infrastructure services first
    log "Starting infrastructure services..."
    docker-compose -f docker-compose.prod.yml up -d postgres redis
    
    # Wait for database to be ready
    log "Waiting for database to be ready..."
    for i in {1..30}; do
        if docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U postgres; then
            break
        fi
        sleep 5
    done
    
    # Start application services
    log "Starting application services..."
    docker-compose -f docker-compose.prod.yml up -d api
    
    # Wait for API to be ready
    log "Waiting for API to be ready..."
    for i in {1..30}; do
        if curl -f http://localhost:3000/health &>/dev/null; then
            break
        fi
        sleep 5
    done
    
    # Start frontend services
    log "Starting frontend services..."
    docker-compose -f docker-compose.prod.yml up -d admin website pwa
    
    # Start monitoring and proxy services
    log "Starting monitoring and proxy services..."
    docker-compose -f docker-compose.prod.yml up -d nginx prometheus grafana
    
    log "All services deployed successfully"
}

# Health checks
health_checks() {
    log "Performing health checks..."
    
    local start_time=$(date +%s)
    local timeout=$HEALTH_CHECK_TIMEOUT
    
    # Define services and their health check URLs
    declare -A services=(
        ["admin"]="http://localhost:4201/health"
        ["website"]="http://localhost:4200/health"
        ["api"]="http://localhost:3000/health"
        ["pwa"]="http://localhost:8100/health"
    )
    
    for service in "${!services[@]}"; do
        local url="${services[$service]}"
        local current_time=$(date +%s)
        
        if [[ $((current_time - start_time)) -gt $timeout ]]; then
            error "Health check timeout exceeded"
            return 1
        fi
        
        log "Checking health of $service..."
        for i in {1..20}; do
            if curl -f "$url" &>/dev/null; then
                log "$service is healthy"
                break
            fi
            
            if [[ $i -eq 20 ]]; then
                error "$service health check failed"
                return 1
            fi
            
            sleep 10
        done
    done
    
    # Check database connectivity
    log "Checking database connectivity..."
    if ! docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U postgres; then
        error "Database health check failed"
        return 1
    fi
    
    # Check Redis connectivity
    log "Checking Redis connectivity..."
    if ! docker-compose -f docker-compose.prod.yml exec -T redis redis-cli ping | grep -q "PONG"; then
        error "Redis health check failed"
        return 1
    fi
    
    log "All health checks passed"
}

# Setup monitoring
setup_monitoring() {
    log "Setting up production monitoring..."
    
    # Wait for Prometheus to be ready
    for i in {1..30}; do
        if curl -f http://localhost:9090/-/ready &>/dev/null; then
            break
        fi
        sleep 5
    done
    
    # Wait for Grafana to be ready
    for i in {1..30}; do
        if curl -f http://localhost:3002/api/health &>/dev/null; then
            break
        fi
        sleep 5
    done
    
    # Configure Grafana dashboards (if needed)
    log "Configuring monitoring dashboards..."
    
    log "Monitoring setup completed"
}

# Post-deployment tasks
post_deployment_tasks() {
    log "Performing post-deployment tasks..."
    
    # Run database migrations if needed
    log "Running database migrations..."
    docker-compose -f docker-compose.prod.yml exec -T api npm run migrate
    
    # Warm up caches
    log "Warming up application caches..."
    curl -s http://localhost:4201/ > /dev/null
    curl -s http://localhost:4200/ > /dev/null
    curl -s http://localhost:3000/health > /dev/null
    
    # Send deployment notification
    log "Sending deployment notification..."
    # Add notification logic here (Slack, email, etc.)
    
    log "Post-deployment tasks completed"
}

# Rollback function
rollback() {
    error "Deployment failed. Starting rollback..."
    
    if [[ "$ROLLBACK_ENABLED" == "true" && -d "$BACKUP_DIR" ]]; then
        log "Rolling back to previous version..."
        
        # Stop current services
        docker-compose -f docker-compose.prod.yml down
        
        # Restore database backup if exists
        if [[ -f "$BACKUP_DIR/database_backup.sql" ]]; then
            log "Restoring database backup..."
            docker-compose -f docker-compose.prod.yml up -d postgres
            sleep 10
            docker exec -i amysoft-postgres-prod psql -U postgres amysoft_prod < "$BACKUP_DIR/database_backup.sql"
        fi
        
        # Restore configuration
        cp "$BACKUP_DIR/env_backup" .env.prod
        cp "$BACKUP_DIR/docker-compose_backup.yml" docker-compose.prod.yml
        
        # Start services with previous configuration
        docker-compose -f docker-compose.prod.yml up -d
        
        log "Rollback completed"
    else
        warning "Rollback not available or disabled"
    fi
}

# Main deployment function
main() {
    log "Starting production deployment for Amysoft.tech"
    log "Deployment environment: $DEPLOYMENT_ENV"
    
    # Create log directory
    mkdir -p logs
    
    # Trap errors for rollback
    trap rollback ERR
    
    # Execute deployment steps
    pre_deployment_checks
    create_backup
    build_and_test
    deploy_services
    health_checks
    setup_monitoring
    post_deployment_tasks
    
    log "Production deployment completed successfully!"
    log "Admin Console: http://localhost:4201"
    log "Website: http://localhost:4200"
    log "API: http://localhost:3000"
    log "PWA: http://localhost:8100"
    log "Monitoring: http://localhost:3002"
    
    info "Deployment log saved to: $LOG_FILE"
    info "Backup created at: $BACKUP_DIR"
}

# Script execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi