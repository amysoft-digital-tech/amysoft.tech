# Production Deployment Guide

## Overview
This guide covers the complete production deployment process for the Beyond the AI Plateau project, including all four applications and shared libraries.

## Pre-Deployment Checklist

### Environment Preparation
- [ ] Production VPS server configured with required specifications
- [ ] SSL certificates installed and configured
- [ ] Domain DNS records pointing to production server
- [ ] Database server configured with production settings
- [ ] Environment variables configured for production

### Application Builds
```bash
# Build all applications for production
nx build website --prod
nx build pwa --prod
nx build api --prod
nx build admin --prod

# Build shared libraries
nx build @amysoft/shared-ui-components
nx build @amysoft/shared-data-access
nx build @amysoft/shared-utils
nx build @amysoft/shared-types
```

### Quality Assurance
```bash
# Run comprehensive tests
nx run-many --target=test --all
nx run-many --target=lint --all
nx run-many --target=e2e --all

# Performance testing
npm run lighthouse:prod
```

## Deployment Process

### 1. Database Migration
```bash
# Run database migrations
npm run migrate:prod

# Verify database schema
npm run db:verify
```

### 2. Application Deployment
```bash
# Deploy API backend first
pm2 start dist/apps/api/main.js --name "amysoft-api"

# Deploy website (marketing)
nginx -s reload  # Reload nginx with new static files

# Deploy PWA (learning platform)
# PWA files served through nginx with service worker

# Deploy admin console
# Admin files served through nginx with authentication
```

### 3. Service Configuration
```bash
# Configure PM2 for Node.js processes
pm2 startup
pm2 save

# Configure nginx for static file serving
sudo systemctl reload nginx

# Configure SSL renewal
sudo certbot renew --dry-run
```

## Monitoring Setup

### Application Monitoring
- PM2 monitoring for Node.js processes
- Nginx access and error logs
- Database performance monitoring
- Application error tracking

### Performance Monitoring
- Lighthouse CI for performance metrics
- Core Web Vitals tracking
- API response time monitoring
- Database query performance

## Backup Procedures

### Database Backups
```bash
# Daily automated backups
pg_dump amysoft_prod > backup_$(date +%Y%m%d).sql

# Weekly full system backup
tar -czf system_backup_$(date +%Y%m%d).tar.gz /var/www/amysoft
```

### File System Backups
- Static assets backup
- Configuration files backup
- SSL certificates backup

## Rollback Procedures

### Quick Rollback
```bash
# Rollback to previous version
git checkout [previous-tag]
npm run build:prod
pm2 restart all
```

### Database Rollback
```bash
# Restore from backup if needed
psql amysoft_prod < backup_[date].sql
```

## Post-Deployment Verification

### Health Checks
- [ ] All applications loading successfully
- [ ] API endpoints responding correctly
- [ ] Database connections working
- [ ] SSL certificates valid
- [ ] Performance metrics within targets

### Functional Testing
- [ ] User registration and login
- [ ] Payment processing
- [ ] Content delivery
- [ ] Admin functions
- [ ] PWA offline functionality

## Support and Maintenance

### Daily Monitoring
- Check application logs
- Verify backup completion
- Monitor performance metrics
- Review error reports

### Weekly Tasks
- Update dependencies
- Review security patches
- Analyze performance trends
- Update documentation

### Monthly Tasks
- Full system backup verification
- SSL certificate renewal check
- Performance optimization review
- Security audit