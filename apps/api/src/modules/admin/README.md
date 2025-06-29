# Administrative API Module

## Overview

Comprehensive administrative API endpoints for business operations, customer management, content administration, and customer support workflows with proper authorization and audit capabilities.

## Features

### 🔐 Authentication & Security
- JWT-based admin authentication
- Role-based access control (RBAC)
- Granular permission system
- Comprehensive audit logging
- Session management with enhanced security

### 👥 Customer Administration
- Advanced customer search with filters and pagination
- Detailed customer profiles with activity tracking
- Subscription management and billing modifications
- Customer communication and message history
- Support ticket integration and resolution tracking
- Customer analytics with churn risk assessment

### 📝 Content Management
- Content creation, editing, publishing, and archiving
- Version control and approval workflows
- Template library management with categorization
- Content analytics and performance tracking
- Bulk operations and content organization

### 📊 Business Intelligence
- Real-time revenue analytics with forecasting
- Customer acquisition and retention analysis
- Operational metrics and system health monitoring
- Executive reporting with KPI dashboards
- Competitive analysis and market positioning

### 📋 Audit & Compliance
- Complete audit trail of all administrative actions
- Compliance reporting for regulatory requirements
- Security event detection and monitoring
- Admin activity summaries and access patterns

## API Endpoints

### Authentication
```
POST /api/admin/auth/login - Admin authentication
```

### Customer Management
```
GET    /api/admin/customers/search - Advanced customer search
GET    /api/admin/customers/:id - Customer details
PUT    /api/admin/customers/:id - Update customer profile
POST   /api/admin/customers/:id/subscription - Update subscription
POST   /api/admin/customers/:id/subscription/cancel - Cancel subscription
POST   /api/admin/customers/:id/message - Send customer message
GET    /api/admin/customers/:id/activity - Customer activity history
POST   /api/admin/customers/bulk-action - Bulk operations
GET    /api/admin/customers/analytics/segments - Customer segmentation
GET    /api/admin/customers/analytics/churn-risk - Churn risk analysis
```

### Content Management
```
GET    /api/admin/content/search - Content search with filters
GET    /api/admin/content/:id - Content details
POST   /api/admin/content - Create new content
PUT    /api/admin/content/:id - Update content
POST   /api/admin/content/:id/publish - Publish content
POST   /api/admin/content/:id/archive - Archive content
DELETE /api/admin/content/:id - Delete content
POST   /api/admin/content/bulk-action - Bulk content operations
GET    /api/admin/content/:id/versions - Version history
GET    /api/admin/content/:id/analytics - Content analytics
GET    /api/admin/content/templates/library - Template library
POST   /api/admin/content/templates/:id/approve - Approve template
GET    /api/admin/content/categories - Content categories
GET    /api/admin/content/analytics/performance - Content performance
```

### Business Intelligence
```
GET /api/admin/analytics/metrics - Business metrics overview
GET /api/admin/analytics/revenue - Revenue analytics
GET /api/admin/analytics/customers - Customer analytics
GET /api/admin/analytics/operational - Operational metrics
GET /api/admin/analytics/executive-report - Executive summary
GET /api/admin/analytics/revenue/forecast - Revenue forecast
GET /api/admin/analytics/customers/cohorts - Cohort analysis
GET /api/admin/analytics/conversion-funnel - Conversion funnel
GET /api/admin/analytics/kpi-dashboard - KPI dashboard
GET /api/admin/analytics/competitive-analysis - Competitive analysis
GET /api/admin/analytics/export - Export analytics data
```

### Audit & Security
```
GET /api/admin/audit/logs - Audit logs with filters
GET /api/admin/audit/admin/:id/activity - Admin activity summary
GET /api/admin/audit/compliance-report - Compliance reporting
GET /api/admin/audit/security-events - Security event monitoring
GET /api/admin/audit/access-patterns - Access pattern analysis
GET /api/admin/audit/data-access-report - Data access report
```

## Permission System

### Admin Roles
- `SUPER_ADMIN` - Full system access
- `ADMIN` - Most administrative functions
- `CUSTOMER_SUPPORT` - Customer management only
- `CONTENT_MANAGER` - Content management only
- `BUSINESS_ANALYST` - Analytics and reporting only

### Permissions
- **Customer Management**: `VIEW_CUSTOMERS`, `EDIT_CUSTOMERS`, `MANAGE_SUBSCRIPTIONS`
- **Content Management**: `VIEW_CONTENT`, `CREATE_CONTENT`, `EDIT_CONTENT`, `DELETE_CONTENT`, `PUBLISH_CONTENT`
- **Business Intelligence**: `VIEW_REVENUE`, `VIEW_ANALYTICS`, `EXPORT_REPORTS`, `VIEW_BUSINESS_METRICS`
- **System Administration**: `VIEW_AUDIT_LOGS`, `MANAGE_ADMIN_USERS`, `CONFIGURE_SYSTEM`

## Usage Examples

### Authentication
```typescript
// Login
const response = await fetch('/api/admin/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@amysoft.tech',
    password: 'SecurePassword123!'
  })
});

const { accessToken } = await response.json();
```

### Customer Search
```typescript
// Search customers
const customers = await fetch('/api/admin/customers/search?query=john&subscriptionStatus=active&limit=10', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});
```

### Content Management
```typescript
// Create content
const content = await fetch('/api/admin/content', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'New Article',
    type: 'chapter',
    body: { content: 'Article content...' },
    tags: ['ai', 'productivity'],
    categoryId: 'tech'
  })
});
```

### Business Analytics
```typescript
// Get revenue analytics
const revenue = await fetch('/api/admin/analytics/revenue?dateFrom=2024-01-01&dateTo=2024-12-31&groupBy=month', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});
```

## Database Schema

### User Entity Enhancements
```sql
ALTER TABLE users ADD COLUMN isAdmin boolean DEFAULT false;
ALTER TABLE users ADD COLUMN adminRole varchar;
ALTER TABLE users ADD COLUMN lastLogin timestamp;
```

### Required Indexes
```sql
CREATE INDEX IDX_users_isAdmin ON users (isAdmin);
CREATE INDEX IDX_users_adminRole ON users (adminRole);
```

## Security Considerations

### Authentication
- JWT tokens expire after 8 hours
- Secure password requirements enforced
- Account lockout after failed attempts

### Authorization
- Every endpoint requires specific permissions
- Permission checks at both guard and service levels
- Role-based access control with inheritance

### Audit Logging
- All administrative actions logged
- IP address and user agent tracking
- Immutable audit trail
- Compliance reporting capabilities

### Data Protection
- Sensitive data access logged
- Export capabilities restricted
- Data retention policies enforced

## Error Handling

### Standard Error Responses
```typescript
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Invalid or expired token"
}

{
  "statusCode": 403,
  "message": "Forbidden",
  "error": "Insufficient permissions"
}

{
  "statusCode": 404,
  "message": "Not Found",
  "error": "Customer not found"
}
```

## Performance Considerations

### Database Optimization
- Proper indexing for search queries
- Query optimization with selective loading
- Pagination for large datasets
- Connection pooling for concurrent requests

### Caching Strategy
- Business metrics cached with TTL
- Session caching for frequently accessed data
- Query result caching for expensive operations

### Rate Limiting
- Per-admin user rate limiting
- Bulk operation throttling
- Export operation queuing

## Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis (optional, for caching)

### Installation
```bash
# Install dependencies
npm install

# Run database migrations
npm run migration:run

# Start development server
npm run dev
```

### Testing
```bash
# Run unit tests
npm run test

# Run integration tests
npm run test:e2e

# Run specific test suite
npm run test -- --testPathPattern=admin
```

## Future Enhancements

See [TODO.md](./TODO.md) for planned improvements and missing features.

## Support

For questions or issues related to the admin module:
1. Check the TODO.md for known limitations
2. Review the audit logs for debugging
3. Contact the development team for assistance