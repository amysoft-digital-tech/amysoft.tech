# CLAUDE.md - Marketing Website Application

## Application Context
**Application Type:** Angular 18+ marketing website with Server-Side Rendering  
**Purpose:** Lead generation, ebook sales, and content marketing  
**Port:** 4200  
**Dependencies:** @amysoft/shared-ui-components, @amysoft/shared-data-access  
**Revenue Impact:** Primary conversion funnel for $24.95 foundation tier  
**Target Metrics:** >90 Lighthouse Performance, 3-5% conversion rate, <2.5s LCP

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

# Performance audit
lighthouse http://localhost:4200 --view
npm run audit:performance

# SEO validation
npm run seo:validate
```

## Architecture Patterns

### Component Structure
- **Landing Page:** Hero section with value proposition, social proof, and conversion optimization
- **Pricing Page:** Tier comparison with Stripe integration and conversion psychology
- **Blog Platform:** Content marketing with SEO optimization and lead generation
- **About/Contact Pages:** Trust building with credibility indicators and support channels
- **Checkout Flow:** Optimized payment experience with abandonment prevention

### SEO Requirements
- **Angular Universal:** Complete SSR implementation for search engine crawlability
- **Structured Data:** Product, Review, Organization, and Article schemas
- **Meta Management:** Dynamic title/description generation with Open Graph optimization
- **Core Web Vitals:** LCP <2.5s, FID <100ms, CLS <0.1 compliance
- **Technical SEO:** Sitemap generation, robots.txt, canonical URLs, breadcrumbs

### Performance Standards
- **Bundle Optimization:** Tree shaking, code splitting, dynamic imports
- **Image Optimization:** WebP format, responsive sizing, lazy loading
- **Caching Strategy:** Service worker implementation with cache-first strategies
- **CDN Integration:** Global content delivery with edge caching

## Revenue-Critical Features

### Conversion Optimization
- **A/B Testing Framework:** Optimizely/Google Optimize integration for data-driven optimization
- **Exit-Intent Detection:** Modal triggers with special offers and retention strategies
- **Social Proof Integration:** Dynamic testimonials, user counts, and credibility indicators
- **Mobile Optimization:** Touch-friendly design with thumb-zone navigation
- **Analytics Tracking:** Enhanced ecommerce events and conversion funnel analysis

### Payment Integration
- **Stripe Elements:** Secure payment processing with 3D Secure compliance
- **Subscription Management:** Multi-tier support with prorations and upgrades
- **Coupon System:** Percentage and fixed discounts with usage tracking
- **Tax Calculation:** Automatic tax handling for applicable jurisdictions
- **Refund Processing:** Customer service integration with reason tracking

### Lead Generation
- **Email Marketing:** Newsletter integration with segmentation and automation
- **Content Gating:** Strategic content offers for email capture
- **Retargeting Setup:** Pixel implementation for advertising platform integration
- **Customer Journey Mapping:** Funnel optimization from awareness to purchase

## Prompt Templates

### Landing Page Component Creation
```
Create a high-converting landing page component for the "Beyond the AI Plateau" ebook.

**Requirements:**
- Hero section with compelling value proposition addressing AI productivity plateau
- Social proof section with testimonials, user metrics, and credibility indicators
- Feature highlights of the Five Elite Principles with benefit-focused messaging
- Multiple call-to-action buttons strategically placed throughout the page
- Mobile-first responsive design using Tailwind CSS with conversion optimization

**Conversion Elements:**
- Scarcity indicators for launch pricing with countdown timers
- Risk reversal with 30-day money-back guarantee prominently displayed
- Authority building with author credentials and methodology validation
- Benefit-focused messaging emphasizing productivity gains over feature lists
- Exit-intent detection with special offer modal

**Technical Implementation:**
- Angular standalone component with OnPush change detection strategy
- Lazy loading for images and non-critical content below the fold
- Structured data markup for enhanced search result appearance
- Analytics event tracking for user interactions and conversion points
- Core Web Vitals optimization with critical CSS inlining
```

### SEO Optimization Implementation
```
Implement comprehensive SEO optimization for the marketing website.

**Meta Tag Management:**
- Dynamic title and description generation based on page content
- Open Graph tags for optimized social media sharing with custom images
- Twitter Card implementation with summary_large_image format
- Canonical URL management to prevent duplicate content penalties
- Hreflang tags preparation for future international market expansion

**Structured Data Implementation:**
- Product schema for ebook listing with pricing and availability
- Review schema for customer testimonials with aggregated ratings
- Organization schema for company information and contact details
- Article schema for blog posts with author and publication data
- FAQ schema for common questions and optimized answer snippets

**Performance Optimization:**
- Critical CSS inlining for above-the-fold content rendering
- Image optimization with WebP format and progressive JPEG fallbacks
- Font optimization with preload directives and font-display: swap
- Bundle splitting with route-based lazy loading for optimal performance
- Service worker implementation for offline functionality and caching
```

### Stripe Payment Integration
```
Implement secure Stripe payment processing with conversion optimization.

**Payment Flow Requirements:**
- Stripe Elements integration with custom styling matching brand design
- Single-page checkout process to minimize abandonment opportunities
- Multiple payment method support including cards and digital wallets
- Real-time form validation with clear error messaging and guidance
- Order summary with transparent pricing and tax calculation

**Security Implementation:**
- PCI DSS compliance through Stripe's secure payment infrastructure
- 3D Secure authentication for enhanced fraud protection
- SSL certificate enforcement with proper security headers
- Webhook signature verification for payment status updates
- Secure customer data handling with minimal PII storage

**Conversion Optimization:**
- Guest checkout option with optional account creation post-purchase
- Progress indicators showing checkout completion steps
- Trust badges and security assurance messaging
- Abandoned cart recovery with email follow-up sequences
- Upselling prompts for tier upgrades during checkout process
```

## Testing Priorities

### Conversion Testing
- **Purchase Flow:** Complete end-to-end transaction testing with Stripe test mode
- **Mobile Experience:** Touch interaction testing across various device sizes
- **Payment Processing:** Multiple payment method validation and error handling
- **Coupon System:** Discount application and calculation accuracy verification
- **Email Delivery:** Transactional email testing for confirmations and receipts

### SEO Validation
- **Meta Tag Accuracy:** Dynamic generation testing across all page types
- **Structured Data:** Google Rich Results validation and Search Console integration
- **Core Web Vitals:** Performance benchmarking with real device testing
- **Mobile Usability:** Google Mobile-Friendly test compliance
- **Crawlability:** Search console indexing verification and sitemap validation

### Performance Testing
- **Lighthouse Audits:** Automated CI/CD integration with performance budgets
- **Real User Metrics:** Core Web Vitals monitoring with field data collection
- **Load Testing:** Stress testing for traffic spikes during launch campaigns
- **Cross-Browser Testing:** Compatibility verification across major browsers
- **Accessibility Testing:** WCAG 2.1 AA compliance with automated and manual testing

## Content Marketing Strategy

### Blog Platform Requirements
- **Content Management:** Rich text editor with markdown support for technical content
- **SEO Optimization:** Automatic meta tag generation and internal linking suggestions
- **Social Sharing:** Optimized sharing buttons with click tracking
- **Newsletter Integration:** Content-based email capture and segmentation
- **Analytics Integration:** Content performance tracking and engagement metrics

### Content Categories
- **AI Development Tips:** Practical tutorials and best practices
- **Productivity Strategies:** Workflow optimization and tool recommendations
- **Industry Insights:** Market trends and technology analysis
- **Case Studies:** Real-world implementation examples and results
- **Template Showcases:** Featured prompt templates with usage examples

## Analytics and Optimization

### Tracking Implementation
- **Google Analytics 4:** Enhanced ecommerce tracking with custom events
- **Conversion Funnel:** Multi-step funnel analysis from landing to purchase
- **User Behavior:** Heatmap integration and session recording for optimization insights
- **A/B Testing:** Statistical significance tracking and result implementation
- **Attribution Modeling:** Marketing channel effectiveness and ROI calculation

### Key Performance Indicators
- **Conversion Rate:** Target 3-5% from qualified traffic sources
- **Average Order Value:** Tier upgrade optimization and bundle promotions
- **Customer Acquisition Cost:** Marketing channel efficiency measurement
- **Page Performance:** Core Web Vitals compliance across all critical pages
- **SEO Rankings:** Keyword position tracking and organic traffic growth

## Security and Compliance

### Data Protection
- **GDPR Compliance:** Cookie consent management and data subject rights
- **Privacy Policy:** Transparent data collection and usage documentation
- **Security Headers:** Content Security Policy and HSTS implementation
- **Form Security:** Input validation and CSRF protection
- **Payment Security:** PCI DSS compliance through Stripe integration

### Monitoring and Maintenance
- **Security Scanning:** Automated vulnerability detection and patching
- **Performance Monitoring:** Real-time alerting for performance degradation
- **Uptime Monitoring:** 24/7 availability tracking with incident response
- **Backup Strategy:** Automated daily backups with tested restoration procedures
- **Update Management:** Regular dependency updates and security patches

This marketing website serves as the primary revenue driver for the Beyond the AI Plateau project, requiring exceptional attention to conversion optimization, performance, and SEO to achieve the $250K ARR target.