# CLAUDE.md - Backend API Application

## Application Context
**Application Type:** NestJS backend with PostgreSQL and Redis  
**Purpose:** API services for authentication, content delivery, payments, and business operations  
**Port:** 3000  
**Dependencies:** TypeORM, Stripe SDK, JWT authentication, Redis, PostgreSQL  
**Revenue Impact:** Critical infrastructure enabling all revenue-generating platform functionality  
**Target Metrics:** <200ms API response time, >99.9% uptime, support 10,000+ concurrent users

## Database Architecture

### Core Entities and Relationships
- **Users:** Authentication credentials, profiles, subscription status, preferences
- **Content:** Chapters, principles, templates, progress tracking, versioning
- **Payments:** Transactions, subscriptions, refunds, billing cycles, invoices
- **Analytics:** User engagement, content performance, business metrics, A/B test results
- **Administrative:** Content management, user administration, audit logs, system settings

### Performance Optimization Strategies
- **Database Indexing:** Composite indexes on frequently queried fields and foreign keys
- **Connection Pooling:** Optimized pool size for concurrent request handling
- **Query Optimization:** Efficient joins, proper pagination, and result set management
- **Caching Layer:** Redis integration for session management and computed results
- **Background Processing:** Asynchronous job queuing for heavy operations and batch processing

### Data Consistency and Integrity
- **ACID Transactions:** Proper transaction boundaries for data consistency
- **Foreign Key Constraints:** Referential integrity with cascading rules
- **Data Validation:** Multi-layer validation at database, service, and API levels
- **Audit Trails:** Comprehensive logging for all data modifications
- **Backup Strategy:** Automated backups with point-in-time recovery capabilities

## Development Commands
```bash
# API development server with hot reload
nx serve api

# Database operations and migrations
npm run db:migrate
npm run db:rollback
npm run db:seed
npm run db:reset
npm run db:backup

# Testing suite execution
nx test api
npm run test:e2e:api
npm run test:integration:api
npm run test:load:api

# API documentation generation
npm run docs:generate
npm run docs:serve

# Database management
npm run db:studio
npm run db:inspect
npm run db:optimize

# Performance monitoring
npm run perf:monitor
npm run perf:profile
```

## Authentication and Security

### JWT Implementation Architecture
- **Access Tokens:** 15-minute expiration with role-based claims and permissions
- **Refresh Tokens:** 7-day expiration with secure rotation and device tracking
- **Token Security:** RS256 signing with proper key rotation and validation
- **Device Management:** Multi-device session tracking with concurrent session limits
- **Token Cleanup:** Automatic removal of expired tokens and blacklist management

### Comprehensive Security Measures
- **Rate Limiting:** Intelligent throttling with 100 requests/minute baseline and burst allowance
- **Input Validation:** class-validator decorators with custom validation rules
- **SQL Injection Prevention:** Parameterized queries and ORM-level protection
- **XSS Protection:** Content sanitization and proper header configuration
- **CORS Management:** Whitelist-based origin control for frontend applications

### Advanced Security Features
- **Multi-Factor Authentication:** TOTP support with backup codes and recovery options
- **Account Security:** Brute force protection with progressive lockout policies
- **Password Security:** bcrypt hashing with salt rounds and complexity requirements
- **Session Security:** Secure cookie configuration with proper SameSite attributes
- **API Security:** Request signing and integrity verification for sensitive operations

## Prompt Templates

### API Endpoint Creation
```
Create a comprehensive API endpoint for [specific functionality] following NestJS enterprise patterns.

**Endpoint Architecture:**
- Controller: [ControllerName]Controller with proper routing and middleware
- Route: /api/v1/[resource]/[action] with RESTful conventions
- HTTP Method: [GET/POST/PUT/DELETE] with appropriate status codes
- Authentication: JWT guard with role-based authorization middleware
- Validation: DTO classes with comprehensive input validation and sanitization

**Request/Response Design:**
- Create strongly-typed DTO classes for request validation with custom decorators
- Define response interfaces with proper TypeScript typing and documentation
- Implement comprehensive error handling with appropriate HTTP status codes
- Add Swagger/OpenAPI documentation with examples and schema definitions
- Include request/response interceptors for logging and transformation

**Business Logic Implementation:**
- Service layer with dependency injection and business logic separation
- Repository pattern with TypeORM integration for data access abstraction
- Transaction management with proper rollback handling for data consistency
- Error logging with structured information and correlation IDs
- Performance monitoring with execution time tracking and alerting

**Security and Compliance:**
- Input sanitization and validation with security-focused custom validators
- Authorization guards with role and permission-based access control
- Rate limiting with endpoint-specific thresholds and burst handling
- Audit logging for all data modifications with user attribution
- Data encryption for sensitive information with proper key management

**Testing Implementation:**
- Unit tests for controller methods with comprehensive mock scenarios
- Integration tests with real database connections and transaction isolation
- End-to-end tests covering complete request/response workflows
- Security testing for authentication and authorization scenarios
- Performance testing with load simulation and bottleneck identification
```

### Database Migration Creation
```
Create a robust database migration for [schema changes] using TypeORM with enterprise standards.

**Migration Requirements:**
- Naming convention: timestamp-descriptive-action format for chronological ordering
- Include both up and down migration methods with complete reversibility
- Handle existing data migration with proper backup and validation procedures
- Add appropriate indexes for query performance optimization
- Include foreign key constraints with proper cascading rules and integrity checks

**Schema Design Considerations:**
- Maintain backward compatibility where possible with deprecated field handling
- Document breaking changes in migration comments with upgrade instructions
- Include default values for new required fields with business logic consideration
- Consider impact on existing application functionality with rollout planning
- Plan comprehensive rollback strategy for migration failures with data recovery

**Data Migration Strategy:**
- Batch processing for large dataset modifications with progress tracking
- Validation scripts to ensure data integrity after migration completion
- Backup procedures with point-in-time recovery capabilities
- Performance testing with production-like data volumes and load simulation
- Monitoring and alerting for migration progress and error detection

**Testing and Validation Protocol:**
- Test migration on production database copy with realistic data volumes
- Verify data integrity and business logic compliance after migration
- Test application functionality with new schema and updated business logic
- Document any required application code changes with deployment coordination
- Create detailed rollback procedures with testing and validation requirements

**Production Deployment:**
- Maintenance window planning with stakeholder communication
- Database backup verification before migration execution
- Migration execution monitoring with real-time progress tracking
- Post-migration validation with comprehensive functionality testing
- Documentation updates including schema changes and API modifications
```

### Stripe Payment Integration
```
Implement comprehensive Stripe payment processing with enterprise-grade reliability.

**Payment Processing Architecture:**
- Payment Intent API integration with 3D Secure authentication support
- Webhook endpoint implementation with signature verification and idempotency
- Subscription lifecycle management with prorations and tier upgrade handling
- Failed payment recovery with intelligent retry logic and customer communication
- Multi-currency support with automatic currency conversion and localization

**Subscription Management System:**
- Flexible subscription creation with trial periods and promotional pricing
- Real-time subscription modification with immediate and scheduled changes
- Cancellation workflow with retention strategies and win-back campaigns
- Billing cycle customization with custom billing dates and payment methods
- Invoice generation with automatic payment retry and dunning management

**Revenue Optimization Features:**
- Coupon and discount system with usage tracking and expiration management
- Pricing experimentation with A/B testing integration and conversion tracking
- Revenue recognition compliance with proper accounting integration
- Chargeback management with dispute handling and prevention strategies
- Tax calculation with regional compliance and automatic tax collection

**Financial Operations Integration:**
- Comprehensive transaction logging with audit trails and reconciliation
- Real-time revenue reporting with business intelligence dashboard integration
- Customer lifetime value calculation with predictive analytics
- Refund processing with customer service integration and approval workflows
- Financial compliance with fraud detection and risk management integration

**Monitoring and Analytics:**
- Payment success rate monitoring with alerting for degraded performance
- Revenue analytics with cohort analysis and customer segmentation
- Conversion funnel optimization with payment flow analytics
- Customer behavior analysis with payment method preferences and patterns
- Business intelligence integration with executive dashboard and reporting
```

## Payment Processing

### Stripe Integration Architecture
- **Webhook Management:** Secure endpoint with signature verification and idempotency handling
- **Subscription Lifecycle:** Complete management from creation to cancellation with retention strategies
- **Payment Methods:** Support for cards, digital wallets, and alternative payment methods
- **Revenue Recovery:** Intelligent retry logic for failed payments with customer communication
- **Compliance:** PCI DSS adherence through Stripe's infrastructure with audit capabilities

### Financial Operations
- **Transaction Logging:** Comprehensive audit trails with reconciliation capabilities
- **Revenue Analytics:** Real-time reporting with business intelligence integration
- **Tax Management:** Automatic calculation and collection for applicable jurisdictions
- **Refund Processing:** Customer service integration with approval workflows
- **Fraud Protection:** Stripe Radar integration with custom risk scoring

## Content Management APIs

### Content Delivery System
- **Chapter Management:** Hierarchical content structure with version control
- **Template Library:** 100+ prompt templates with categorization and search
- **Progress Tracking:** User progress persistence with cross-device synchronization
- **Content Versioning:** Change tracking with rollback capabilities
- **Access Control:** Subscription-based content unlocking with tier validation

### Search and Discovery
- **Full-Text Search:** Elasticsearch integration with relevance scoring
- **Content Filtering:** Advanced filtering by principle, difficulty, and content type
- **Recommendation Engine:** Machine learning-based content suggestions
- **Related Content:** Dynamic cross-referencing and content relationships
- **Personalization:** User behavior-based content customization

## User Management and Analytics

### User Lifecycle Management
- **Registration and Onboarding:** Streamlined user creation with email verification
- **Profile Management:** Comprehensive user data with preference handling
- **Subscription Management:** Tier-based access control with upgrade workflows
- **Progress Tracking:** Learning analytics with engagement measurement
- **Customer Support:** Integrated support ticketing with user context

### Business Intelligence APIs
- **User Analytics:** Engagement metrics with cohort analysis and retention tracking
- **Content Performance:** Usage statistics with effectiveness measurement
- **Revenue Analytics:** Real-time financial reporting with forecasting capabilities
- **Conversion Optimization:** A/B testing results with statistical significance validation
- **Customer Success:** Health scoring with churn prediction and intervention triggers

## Performance and Scalability

### Caching Strategy
- **Redis Integration:** Multi-level caching with intelligent invalidation policies
- **Session Management:** Distributed session storage with failover capabilities
- **Content Caching:** Dynamic content caching with edge distribution
- **Query Optimization:** Database query result caching with TTL management
- **API Response Caching:** Endpoint-specific caching with conditional headers

### Load Balancing and Scaling
- **Horizontal Scaling:** Stateless architecture with load balancer integration
- **Database Optimization:** Read replicas with query routing and connection pooling
- **Background Jobs:** Distributed task processing with queue management
- **Resource Monitoring:** Real-time performance metrics with auto-scaling triggers
- **Capacity Planning:** Predictive scaling based on usage patterns and growth projections

## Security and Compliance

### Data Protection Framework
- **Encryption Standards:** AES-256 encryption for data at rest with key rotation
- **API Security:** Request signing and integrity verification for sensitive operations
- **Access Control:** Role-based permissions with fine-grained resource access
- **Audit Logging:** Comprehensive activity tracking with tamper-proof storage
- **Vulnerability Management:** Regular security scanning with automated patching

### Regulatory Compliance
- **GDPR Implementation:** Complete data subject rights with automated compliance tools
- **PCI DSS Compliance:** Payment card data protection through Stripe integration
- **SOC 2 Compliance:** Security framework with annual auditing and certification
- **Data Retention:** Automated data lifecycle management with regulatory compliance
- **Privacy Controls:** User-controlled data sharing with granular permissions

## Testing and Quality Assurance

### Comprehensive Testing Strategy
- **Unit Testing:** Service and controller layer testing with high coverage requirements
- **Integration Testing:** Database and external service integration validation
- **End-to-End Testing:** Complete API workflow testing with realistic scenarios
- **Load Testing:** Performance validation under high concurrent user load
- **Security Testing:** Penetration testing and vulnerability assessment

### Continuous Integration
- **Automated Testing:** CI/CD pipeline integration with quality gates
- **Code Quality:** Static analysis with SonarQube integration and quality metrics
- **Performance Monitoring:** Continuous performance benchmarking with regression detection
- **Security Scanning:** Automated vulnerability detection with dependency checking
- **Documentation Generation:** Automatic API documentation updates with deployment

## Monitoring and Operations

### Application Monitoring
- **Performance Metrics:** Response time tracking with percentile analysis
- **Error Tracking:** Comprehensive error logging with alert management
- **Business Metrics:** Revenue and user engagement monitoring with executive dashboards
- **Infrastructure Monitoring:** Server health with resource utilization tracking
- **Custom Metrics:** Business-specific KPI tracking with trend analysis

### Operational Excellence
- **Health Checks:** Comprehensive endpoint monitoring with dependency validation
- **Logging Strategy:** Structured logging with correlation IDs and distributed tracing
- **Backup and Recovery:** Automated backup procedures with disaster recovery testing
- **Incident Response:** Comprehensive incident management with escalation procedures
- **Documentation:** Operational runbooks with troubleshooting guides and escalation paths

This backend API serves as the foundational infrastructure for the entire Beyond the AI Plateau platform, providing secure, scalable, and reliable services that enable the $250K ARR business objective through robust user management, content delivery, and payment processing capabilities.