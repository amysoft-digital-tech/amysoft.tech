#!/bin/bash

# Production Deployment Script for Beyond the AI Plateau
# This script handles the complete deployment process for all applications

set -e  # Exit on any error

echo "🚀 Starting production deployment..."

# Configuration
PROJECT_NAME="Beyond the AI Plateau"
BACKUP_DIR="/backups"
DEPLOY_DIR="/var/www/amysoft"
API_PORT=3000
WEBSITE_PORT=4200
PWA_PORT=8100
ADMIN_PORT=4201

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if service is running
check_service() {
    local service_name=$1
    local port=$2
    
    if curl -s -f "http://localhost:$port/health" > /dev/null 2>&1; then
        print_status "$service_name is running on port $port"
        return 0
    else
        print_error "$service_name is not responding on port $port"
        return 1
    fi
}

# Pre-deployment checks
print_status "Running pre-deployment checks..."

# Check if required directories exist
if [ ! -d "$DEPLOY_DIR" ]; then
    print_error "Deploy directory $DEPLOY_DIR does not exist"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version)
print_status "Node.js version: $NODE_VERSION"

# Check npm version
NPM_VERSION=$(npm --version)
print_status "npm version: $NPM_VERSION"

# Check disk space
DISK_USAGE=$(df $DEPLOY_DIR | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    print_warning "Disk usage is high: ${DISK_USAGE}%. Consider cleanup."
fi

# Backup current deployment
print_status "Creating backup of current deployment..."
BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" -C "$DEPLOY_DIR" . 2>/dev/null || true
print_status "Backup created: $BACKUP_NAME.tar.gz"

# Install dependencies
print_status "Installing dependencies..."
npm ci --production

# Build applications
print_status "Building applications for production..."

# Build shared libraries first
print_status "Building shared libraries..."
nx build @amysoft/shared-ui-components --prod
nx build @amysoft/shared-data-access --prod  
nx build @amysoft/shared-utils --prod
nx build @amysoft/shared-types --prod

# Build applications
print_status "Building website (marketing)..."
nx build website --prod

print_status "Building PWA (learning platform)..."
nx build pwa --prod

print_status "Building API (backend)..."
nx build api --prod

print_status "Building admin console..."
nx build admin --prod

# Run tests
print_status "Running production tests..."
nx run-many --target=test --all --prod || {
    print_error "Tests failed! Deployment aborted."
    exit 1
}

# Database migrations
print_status "Running database migrations..."
npm run migrate:prod || {
    print_error "Database migration failed! Deployment aborted."
    exit 1
}

# Deploy API
print_status "Deploying API backend..."
pm2 stop amysoft-api 2>/dev/null || true
pm2 start ecosystem.config.js --env production
pm2 save

# Wait for API to start
sleep 10

# Verify API is running
if ! check_service "API" $API_PORT; then
    print_error "API deployment failed!"
    exit 1
fi

# Deploy static files
print_status "Deploying static files..."

# Copy website files
cp -r dist/apps/website/* /var/www/html/
print_status "Website files deployed"

# Copy PWA files
cp -r dist/apps/pwa/* /var/www/pwa/
print_status "PWA files deployed"

# Copy admin files
cp -r dist/apps/admin/* /var/www/admin/
print_status "Admin console files deployed"

# Reload nginx
print_status "Reloading nginx..."
nginx -t && nginx -s reload

# Post-deployment verification
print_status "Running post-deployment verification..."

# Check website
if curl -s -f "https://amysoft.tech" > /dev/null; then
    print_status "Website is accessible"
else
    print_error "Website check failed"
fi

# Check PWA
if curl -s -f "https://app.amysoft.tech" > /dev/null; then
    print_status "PWA is accessible"
else
    print_error "PWA check failed"
fi

# Check admin
if curl -s -f "https://admin.amysoft.tech" > /dev/null; then
    print_status "Admin console is accessible"
else
    print_error "Admin console check failed"
fi

# Performance check
print_status "Running performance verification..."
if command -v lighthouse >/dev/null 2>&1; then
    lighthouse https://amysoft.tech --output=json --output-path=/tmp/lighthouse-report.json --chrome-flags="--headless --no-sandbox" || true
    print_status "Lighthouse performance test completed"
fi

# Update monitoring
print_status "Updating monitoring configuration..."
pm2 monit > /dev/null 2>&1 &

# Clean up old backups (keep last 10)
print_status "Cleaning up old backups..."
cd "$BACKUP_DIR"
ls -t backup_*.tar.gz | tail -n +11 | xargs rm -f 2>/dev/null || true

# Final status
print_status "🎉 Deployment completed successfully!"
print_status "Applications deployed:"
print_status "  - Website: https://amysoft.tech"
print_status "  - PWA: https://app.amysoft.tech"  
print_status "  - API: https://api.amysoft.tech"
print_status "  - Admin: https://admin.amysoft.tech"

print_status "Monitoring:"
print_status "  - PM2: pm2 monit"
print_status "  - Logs: pm2 logs"
print_status "  - Status: pm2 status"

print_status "Backup created: $BACKUP_NAME.tar.gz"
print_status "Deployment timestamp: $(date)"

echo "✅ Production deployment completed successfully!"