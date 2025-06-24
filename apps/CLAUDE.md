# CLAUDE.md - Apps Directory Instructions
# This file contains app-specific instructions for the /apps directory only.
# For project-wide context, see /CLAUDE.md in the repository root.

# Application-Specific CLAUDE.md Files

## apps/website/CLAUDE.md

```markdown
# CLAUDE.md - Marketing Website Application

## Application Context
**Application Type:** Angular 18+ marketing website with SSR  
**Purpose:** Lead generation, ebook sales, and content marketing  
**Port:** 4200  
**Dependencies:** @amysoft/shared-ui-components, @amysoft/shared-data-access  
**Revenue Impact:** Primary conversion funnel for $24.95 foundation tier

## Development Commands
```bash
# Development server
nx serve website

# Production build with SSR
nx build website --prod

# Test website application
nx test website
nx e2e website

# Lint website code
nx lint website
```

## Architecture Patterns

**Component Structure:**
- Landing page with value proposition and social proof
- Pricing page with Stripe integration and conversion optimization
- Blog functionality for content marketing and SEO
- About and contact pages for trust building
- Lead capture forms with email marketing integration

**SEO Requirements:**
- Angular Universal implementation for server-side rendering
- Structured data markup for rich snippets
- Open Graph and Twitter Card optimization
- Core Web Vitals optimization for search ranking
- Sitemap generation and robots.txt configuration

## Revenue-Critical Features

**Conversion Optimization:**
- A/B testing framework for pricing and messaging
- Exit-intent detection with special offers
- Social proof integration with testimonials
- Mobile-optimized checkout experience
- Analytics tracking for conversion funnel analysis

**Payment Integration:**
- Stripe Elements for secure payment processing
- Coupon code validation and application
- Tax calculation for applicable jurisdictions
- Subscription management for advanced tiers
- Refund processing and customer support integration

## Prompt Templates

**Landing Page Component Creation:**
```
Create a high-converting landing page component for the "Beyond the AI Plateau" ebook.

**Requirements:**
- Hero section with compelling value proposition
- Social proof section with testimonials and metrics
- Feature highlights of the Five Elite Principles
- Clear call-to-action buttons leading to purchase
- Mobile-first responsive design using Tailwind CSS

**Conversion Elements:**
- Scarcity indicators for launch pricing
- Risk reversal with money-back guarantee
- Authority building with author credentials
- Benefit-focused messaging over feature lists

**Technical Implementation:**
- Angular standalone component with OnPush strategy
- Lazy loading for images and non-critical content
- Structured data for SEO optimization
- Analytics event tracking for user interactions
```

**SEO Optimization Implementation:**
```
Implement comprehensive SEO optimization for the marketing website.

**Meta Tag Management:**
- Dynamic title and description generation
- Open Graph tags for social media sharing
- Twitter Card implementation
- Canonical URL management
- Hreflang tags for international targeting

**Structured Data:**
- Product schema for ebook listing
- Review schema for testimonials
- Organization schema for company information
- Article schema for blog posts

**Performance Optimization:**
- Critical CSS inlining for above-the-fold content
- Image optimization with WebP format and lazy loading
- Font optimization with preload directives
- Bundle splitting for optimal loading performance
```

## Testing Priorities

**Conversion Testing:**
- Purchase flow completion without errors
- Mobile checkout experience validation
- Payment processing with Stripe test mode
- Coupon code application and calculation
- Email confirmation delivery verification

**SEO Validation:**
- Meta tag generation accuracy
- Structured data validation with Google tools
- Core Web Vitals performance benchmarks
- Mobile usability compliance
- Search console integration verification
```

## apps/pwa/CLAUDE.md

```markdown
# CLAUDE.md - Learning Platform PWA

## Application Context
**Application Type:** Ionic Angular Progressive Web App  
**Purpose:** Interactive learning platform and ebook delivery  
**Port:** 8100  
**Dependencies:** @amysoft/shared-ui-components, @amysoft/pwa-feature-libraries  
**Revenue Impact:** Core product delivery platform for content consumption

## PWA Requirements

**Progressive Web App Standards:**
- Service worker for offline content caching
- Web app manifest for installability
- Push notification capability for engagement
- Background sync for progress tracking
- Responsive design for all device types

**Offline Functionality:**
- Chapter content caching for offline reading
- Progress synchronization when connection restored
- Bookmark and note persistence in local storage
- Template library accessibility without internet
- User preference synchronization across devices

## Development Commands
```bash
# Ionic development server
nx serve pwa
ionic serve --project=pwa

# Build PWA with service worker
nx build pwa --prod
ionic build --project=pwa --prod

# PWA audit and testing
lighthouse http://localhost:8100 --view
npm run pwa-audit

# Device testing
ionic capacitor run ios
ionic capacitor run android
```

## Content Delivery Architecture

**Chapter Navigation System:**
- Progressive content unlocking based on user tier
- Chapter completion tracking with visual progress
- Cross-references between principles and examples
- Search functionality across all available content
- Bookmark system with personal organization

**Template Library Management:**
- 100+ prompt templates organized by principle
- Copy-to-clipboard functionality with formatting
- Usage tracking for popular templates
- Personal template collection and favorites
- Integration with development environments

## Prompt Templates

**Offline Caching Implementation:**
```
Implement comprehensive offline caching for the PWA learning platform.

**Service Worker Requirements:**
- Cache chapter content for offline reading
- Implement background sync for user progress
- Handle cache versioning for content updates
- Provide fallback pages for uncached content
- Optimize cache storage with size limitations

**Content Caching Strategy:**
- Cache critical app shell components
- Store chapter content with metadata
- Cache template library for offline access
- Implement selective caching based on user tier
- Provide cache management interface for users

**Sync Implementation:**
- Queue progress updates when offline
- Sync bookmarks and notes on reconnection
- Handle conflict resolution for simultaneous edits
- Implement exponential backoff for failed syncs
- Provide user feedback for sync status
```

**Progress Tracking System:**
```
Create comprehensive progress tracking for the learning platform.

**Tracking Components:**
- Chapter completion percentage calculation
- Time spent tracking for engagement analytics
- Template usage statistics and favorites
- Learning path progression through principles
- Achievement system for milestone completion

**Visual Progress Indicators:**
- Progress bars for individual chapters
- Overall completion dashboard
- Principle mastery visualization
- Streak tracking for daily engagement
- Personal learning analytics dashboard

**Data Persistence:**
- Local storage for offline progress tracking
- Server synchronization for cross-device access
- Export functionality for personal records
- Privacy controls for progress sharing
- Integration with calendar for learning schedules
```

## Performance Optimization

**Mobile Performance Targets:**
- Initial load time under 3 seconds on 3G networks
- Smooth 60fps scrolling and navigation
- Efficient memory usage for long reading sessions
- Battery optimization for extended use
- Efficient data usage for mobile connections

**Content Optimization:**
- Image compression and WebP format usage
- Text content optimization for readability
- Code example syntax highlighting performance
- Search index optimization for quick results
- Template library lazy loading implementation
```

## apps/api/CLAUDE.md

```markdown
# CLAUDE.md - Backend API Application

## Application Context
**Application Type:** NestJS backend with PostgreSQL and Redis  
**Purpose:** API services for authentication, content delivery, and payments  
**Port:** 3000  
**Dependencies:** TypeORM, Stripe SDK, JWT authentication  
**Revenue Impact:** Critical infrastructure for user management and payment processing

## Database Architecture

**Core Entities:**
- Users (authentication, profiles, subscriptions)
- Content (chapters, principles, templates, progress)
- Payments (transactions, subscriptions, refunds)
- Analytics (engagement, conversion, retention metrics)
- Admin (content management, user administration)

**Performance Optimization:**
- Database indexing for frequently queried fields
- Connection pooling for concurrent request handling
- Query optimization with proper joins and filtering
- Caching layer with Redis for session management
- Background job processing for heavy operations

## Development Commands
```bash
# API development server
nx serve api

# Database operations
npm run db:migrate
npm run db:seed
npm run db:reset

# API testing
nx test api
npm run test:e2e:api

# API documentation
npm run docs:generate
```

## Authentication and Security

**JWT Implementation:**
- Access tokens with 15-minute expiration
- Refresh tokens with 7-day expiration
- Secure token rotation on refresh
- Device-specific token tracking
- Automatic cleanup of expired tokens

**Security Measures:**
- Rate limiting on all endpoints (100 requests/minute)
- Input validation with class-validator decorators
- SQL injection prevention with parameterized queries
- XSS protection with content sanitization
- CORS configuration for frontend applications

## Prompt Templates

**API Endpoint Creation:**
```
Create a new API endpoint for [specific functionality] following NestJS best practices.

**Endpoint Specifications:**
- Controller: [ControllerName]Controller
- Route: /api/[resource]/[action]
- HTTP Method: [GET/POST/PUT/DELETE]
- Authentication: Required with JWT guard
- Authorization: [Role-based permissions if applicable]

**Request/Response Types:**
- Create DTO classes for request validation
- Define response interfaces with proper typing
- Implement error handling with appropriate HTTP codes
- Add Swagger documentation decorators

**Business Logic Implementation:**
- Service layer for business logic separation
- Repository pattern for data access
- Transaction handling for data consistency
- Error logging with structured information
- Performance monitoring with execution time tracking

**Testing Requirements:**
- Unit tests for controller and service methods
- Integration tests with test database
- Mock external service dependencies
- Test authentication and authorization scenarios
- Validate request/response data transformation
```

**Database Migration Creation:**
```
Create a database migration for [schema changes] using TypeORM.

**Migration Requirements:**
- Follow naming convention: timestamp-descriptive-name
- Include both up and down migration methods
- Handle data migration if existing data affected
- Add appropriate indexes for query performance
- Include foreign key constraints and cascading rules

**Schema Considerations:**
- Maintain backward compatibility where possible
- Document breaking changes in migration comments
- Include default values for new required fields
- Consider impact on existing application functionality
- Plan rollback strategy for migration failures

**Testing Protocol:**
- Test migration on development database copy
- Verify data integrity after migration
- Test application functionality with new schema
- Document any required application code changes
- Create rollback procedure documentation
```

## Payment Processing

**Stripe Integration:**
- Webhook endpoint for payment status updates
- Subscription management for tier upgrades
- Refund processing with reason tracking
- Failed payment retry logic
- Tax calculation for applicable jurisdictions

**Revenue Analytics:**
- Daily, weekly, monthly revenue reporting
- Customer lifetime value calculation
- Churn rate analysis and prediction
- Conversion funnel optimization metrics
- A/B testing result analysis and implementation
```

## apps/admin/CLAUDE.md

```markdown
# CLAUDE.md - Admin Console Application

## Application Context
**Application Type:** Angular 18+ administrative dashboard  
**Purpose:** Content management, user administration, and business analytics  
**Port:** 4201  
**Dependencies:** @amysoft/shared-ui-components, Chart.js, Angular Material  
**Revenue Impact:** Operations support for content updates and customer management

## Administrative Functions

**Content Management:**
- Chapter creation and editing with rich text editor
- Template library organization and categorization
- Content versioning and publication workflow
- SEO metadata management for marketing content
- Media library management with optimization

**User Administration:**
- User account management and support tools
- Subscription status tracking and modification
- Payment history and refund processing
- Customer support ticket management
- User engagement analytics and insights

## Development Commands
```bash
# Admin console development
nx serve admin

# Build admin application
nx build admin --prod

# Admin-specific testing
nx test admin
nx e2e admin

# Role-based testing
npm run test:admin:roles
```

## Role-Based Access Control

**Admin Roles:**
- Super Admin: Full system access and configuration
- Content Manager: Content creation and editing permissions
- Customer Support: User management and support tools
- Analytics Viewer: Read-only access to business metrics
- Marketing Manager: Campaign management and lead tracking

**Permission System:**
- Route-based access control with role guards
- Component-level permission validation
- API endpoint authorization verification
- Audit logging for all administrative actions
- Session management with role-specific timeouts

## Prompt Templates

**Analytics Dashboard Creation:**
```
Create a comprehensive analytics dashboard for business intelligence.

**Dashboard Components:**
- Revenue tracking with trend analysis
- User engagement metrics and retention rates
- Content performance analytics
- Conversion funnel visualization
- Customer lifetime value calculations

**Chart Implementation:**
- Use Chart.js for interactive data visualization
- Implement real-time data updates with WebSocket
- Export functionality for reports (PDF, CSV)
- Date range filtering and comparison tools
- Drill-down capability for detailed analysis

**Performance Requirements:**
- Efficient data aggregation for large datasets
- Caching for frequently accessed metrics
- Progressive loading for complex visualizations
- Mobile-responsive chart layouts
- Accessibility compliance for screen readers
```

**Content Management Interface:**
```
Build a comprehensive content management system for ebook content.

**Editor Requirements:**
- Rich text editor with markdown support
- Code syntax highlighting for technical content
- Image upload with automatic optimization
- Preview functionality matching PWA styling
- Version control with change tracking

**Content Organization:**
- Hierarchical content structure management
- Drag-and-drop reordering capability
- Bulk operations for content updates
- Search and filtering across all content
- Publishing workflow with approval process

**Technical Implementation:**
- Auto-save functionality to prevent data loss
- Collaborative editing with conflict resolution
- Content validation before publication
- SEO optimization tools and recommendations
- Integration with content delivery API
```

## Business Intelligence

**Revenue Analytics:**
- Real-time revenue tracking and projections
- Customer acquisition cost and lifetime value
- Churn analysis with intervention strategies
- A/B testing result analysis and implementation
- Seasonal trend analysis and forecasting

**Operational Metrics:**
- System performance monitoring and alerts
- User support ticket resolution tracking
- Content engagement and completion rates
- Marketing campaign effectiveness measurement
- Resource utilization and capacity planning
```

## libs/shared/ui-components/CLAUDE.md

```markdown
# CLAUDE.md - Shared UI Components Library

## Library Context
**Library Type:** Angular standalone component library  
**Purpose:** Reusable UI components across all applications  
**Import Path:** @amysoft/shared-ui-components  
**Dependencies:** Tailwind CSS, Angular CDK, Lucide Angular icons  

## Component Architecture

**Design System Principles:**
- Consistent visual language across applications
- Accessibility-first component development
- Mobile-responsive design patterns
- Themeable components with CSS custom properties
- Performance-optimized with OnPush change detection

**Component Categories:**
- Form Controls: Input, Select, Checkbox, Radio, TextArea
- Navigation: Button, Link, Breadcrumb, Pagination
- Feedback: Alert, Toast, Loading, Progress
- Layout: Card, Modal, Drawer, Grid
- Data Display: Table, List, Badge, Avatar

## Development Commands
```bash
# Build shared component library
nx build @amysoft/shared-ui-components

# Run component tests
nx test shared-ui-components

# Launch Storybook for component development
nx storybook shared-ui-components

# Lint component library
nx lint shared-ui-components
```

## Component Development Standards

**Component Structure:**
- Standalone component with proper imports
- Input validation with TypeScript interfaces
- Output events with descriptive names
- Comprehensive JSDoc documentation
- Accessibility attributes and ARIA labels

**Styling Guidelines:**
- Tailwind CSS utility classes for styling
- CSS custom properties for theming
- Responsive design with mobile-first approach
- Focus management for keyboard navigation
- High contrast mode compatibility

## Prompt Templates

**New Component Creation:**
```
Create a new reusable component for [component name] in the shared UI library.

**Component Requirements:**
- Angular standalone component with OnPush strategy
- TypeScript interface for component inputs
- Proper event emission for user interactions
- Comprehensive accessibility implementation
- Responsive design using Tailwind CSS

**Input Properties:**
- [List required and optional inputs with types]
- Default values for optional properties
- Input validation and error handling

**Output Events:**
- [Specify events the component should emit]
- Event payload types and documentation
- Proper event naming conventions

**Accessibility Requirements:**
- ARIA labels and descriptions
- Keyboard navigation support
- Screen reader compatibility
- Focus management and visual indicators
- Color contrast compliance

**Testing Implementation:**
- Unit tests for all component functionality
- Accessibility testing with automated tools
- Visual regression tests for design consistency
- User interaction testing scenarios
```

**Storybook Story Creation:**
```
Create comprehensive Storybook stories for [component name] demonstrating all usage patterns.

**Story Requirements:**
- Default story with standard configuration
- All variants and states demonstration
- Interactive controls for property testing
- Accessibility addon integration
- Responsive viewport testing

**Story Categories:**
- Basic Usage: Standard implementation examples
- Variants: Different visual styles and configurations
- States: Loading, error, disabled, and active states
- Interactions: User interaction demonstrations
- Edge Cases: Boundary conditions and error scenarios

**Documentation:**
- Component description and usage guidelines
- Property documentation with examples
- Event documentation with payload details
- Accessibility notes and considerations
- Design token usage and customization options
```

## Testing Standards

**Component Testing:**
- Render testing with Angular Testing Library
- User interaction simulation and verification
- Accessibility testing with jest-axe
- Visual regression testing with Chromatic
- Performance testing for complex components

**Storybook Integration:**
- Interactive component documentation
- Automated accessibility scanning
- Cross-browser compatibility testing
- Design token validation
- Component API documentation generation
```