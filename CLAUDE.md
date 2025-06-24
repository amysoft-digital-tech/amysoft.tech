# CLAUDE.md - Beyond the AI Plateau: Comprehensive Development Briefing

## Project Overview and Business Context

**Project Name:** Beyond the AI Plateau: Five Elite Principles That Transform LLM Code Generation from Frustrating to Phenomenal  
**Organization:** amysoft-digital-tech  
**Repository:** amysoft.tech (Nx Monorepo)  
**Launch Target:** July 1, 2025  
**Business Goal:** $250K ARR within 12 months  
**Foundation Tier Pricing:** $24.95 (primary revenue driver)  
**Content Completion Status:** 85% complete foundation content

### Strategic Product Architecture

This project implements a three-tier learning ecosystem centered on a Progressive Web Application ebook platform. The foundation tier ($24.95) contains complete content including the Five Elite Principles methodology, 100+ production-ready prompt templates, and a 12-week transformation roadmap. Advanced tiers provide architectural optimization strategies and team transformation content.

### Technical Architecture Summary

**Hybrid Nx Monorepo Structure:**
- **Apps:** website (Angular marketing), pwa (Ionic learning platform), api (NestJS backend), admin (Angular console)
- **Shared Libraries:** ui-components, data-access, utils, types
- **Feature Libraries:** Organized by application domain for optimal Claude Code context
- **Infrastructure:** VPS deployment without third-party cloud dependencies

## Nx Workspace Context and Commands

### Core Nx Workspace Information

This Nx integrated monorepo manages four primary applications with shared library architecture optimized for both development efficiency and Claude Code assistance. Each application maintains focused context boundaries while leveraging shared components and services.

### Essential Nx Commands for Development

**Application Development:**
```bash
# Serve applications in development
nx serve website              # Marketing site (port 4200)
nx serve pwa                 # Learning platform (port 8100)
nx serve api                 # Backend API (port 3000)
nx serve admin               # Admin console (port 4201)

# Build applications for production
nx build website --prod
nx build pwa --prod
nx build api --prod
nx build admin --prod

# Run applications in parallel
nx run-many --target=serve --projects=website,pwa,api
```

**Library Development:**
```bash
# Generate new shared library
nx generate @nx/angular:library shared-feature-name --publishable --importPath=@amysoft/shared-feature-name

# Generate feature library for specific app
nx generate @nx/angular:library website-feature-pricing --directory=libs/website

# Build specific library
nx build @amysoft/shared-ui-components
```

**Testing and Quality Assurance:**
```bash
# Run tests for affected projects
nx affected:test --base=main
nx affected:lint --base=main
nx affected:e2e --base=main

# Run tests for all projects
nx run-many --target=test --all
nx run-many --target=lint --all

# Run specific application tests
nx test website
nx test pwa
nx test api
nx test admin
```

**Development Workflow:**
```bash
# View dependency graph
nx graph

# Check affected projects
nx affected:graph --base=main

# Reset workspace (clean node_modules and reinstall)
nx reset
```

## Development Standards and Code Quality

### Naming Conventions

**File and Directory Naming:**
- Use kebab-case for all file and directory names: `user-profile.component.ts`
- Component files: `[name].component.ts`, `[name].component.html`, `[name].component.scss`
- Service files: `[name].service.ts`
- Pipe files: `[name].pipe.ts`
- Guard files: `[name].guard.ts`
- Interface files: `[name].interface.ts`
- Type files: `[name].types.ts`

**TypeScript and Angular Conventions:**
- Use PascalCase for classes, interfaces, types, and enums: `UserProfile`, `PaymentStatus`
- Use camelCase for variables, functions, and methods: `getCurrentUser`, `paymentAmount`
- Use SCREAMING_SNAKE_CASE for constants: `API_BASE_URL`, `DEFAULT_TIMEOUT`
- Prefix interfaces with 'I' only when needed for disambiguation: `IUserRepository`
- Use descriptive names that clearly indicate purpose: `validatePaymentAmount` not `validate`

### Code Quality Standards

**TypeScript Configuration:**
- Enable strict mode with `"strict": true`
- Use explicit return types for all public methods
- Avoid `any` type; use specific types or generics
- Implement proper error handling with typed error responses
- Use readonly properties where appropriate to prevent mutation

**Angular Best Practices:**
- Use standalone components for Angular 18+ applications
- Implement OnPush change detection strategy for performance
- Use Angular signals for reactive state management
- Implement proper component lifecycle management
- Use dependency injection patterns consistently

**Performance Optimization Requirements:**
- Implement lazy loading for all feature modules
- Use trackBy functions in ngFor loops
- Optimize bundle size with proper tree shaking
- Implement service worker for PWA caching strategies
- Use Angular Universal for server-side rendering on marketing website

## Application-Specific Context

### apps/website (Angular Marketing Site)
- **Purpose:** Lead generation, ebook sales, and content marketing
- **Port:** 4200
- **Key Features:** Landing pages, pricing, blog, SEO optimization
- **Revenue Impact:** Primary conversion funnel for $24.95 foundation tier

### apps/pwa (Ionic Learning Platform)
- **Purpose:** Interactive learning platform and ebook delivery
- **Port:** 8100
- **Key Features:** Chapter navigation, offline reading, progress tracking
- **Revenue Impact:** Core product delivery platform

### apps/api (NestJS Backend)
- **Purpose:** API services for authentication, content delivery, and payments
- **Port:** 3000
- **Key Features:** User management, payment processing, content API
- **Revenue Impact:** Critical infrastructure for user management

### apps/admin (Angular Admin Console)
- **Purpose:** Content management, user administration, and business analytics
- **Port:** 4201
- **Key Features:** Content editing, user management, analytics dashboard
- **Revenue Impact:** Operations support for content updates

## Shared Libraries

### @amysoft/shared-ui-components
- Reusable UI components across all applications
- Design system implementation with Tailwind CSS
- Accessibility-first component development

### @amysoft/shared-data-access
- Common services and data access patterns
- API client implementations
- State management utilities

### @amysoft/shared-utils
- Common utility functions
- Helper methods and constants
- Shared business logic

### @amysoft/shared-types
- TypeScript type definitions
- Interfaces and enums
- API response types

## Development Workflow

### Git Workflow and Commit Standards

**Commit Message Format:**
```
type(scope): brief description

Detailed explanation if needed

Breaking changes: [if applicable]
Closes #issue-number
```

**Commit Types:**
- `feat`: New feature implementation
- `fix`: Bug fix
- `docs`: Documentation updates
- `style`: Formatting changes
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD configuration changes

### GitHub Issues Workflow

**Context**: Starting work on next assigned GitHub issue in amysoft.tech repository following established Nx monorepo workflow procedures.

**Objective**: Pull next assigned issue and begin implementation following the project's standard development workflow.

**Workflow Steps to Execute**:

1. **Retrieve Next Issue**:
   ```bash
   gh issue list --assignee @me --state open --limit 1
   ```

2. **Get Issue Details**:
   ```bash
   gh issue view [ISSUE_NUMBER] --comments
   ```

3. **Create Feature Branch**:
   - Branch naming: `feature/[descriptive-name-based-on-issue]`
   - Use kebab-case following project conventions
   ```bash
   git checkout -b feature/[branch-name]
   git push -u origin feature/[branch-name]
   ```

4. **Update Issue Status**:
   ```bash
   gh issue comment [ISSUE_NUMBER] --body "Starting implementation. Created feature branch: feature/[branch-name]"
   ```

5. **Begin Implementation**:
   - Follow CLAUDE.md development standards (kebab-case naming, TypeScript strict mode, Angular best practices)
   - Use TodoWrite tool to track implementation tasks if complex
   - Ensure code quality standards and Nx workspace conventions
   - Target appropriate application: website (marketing), pwa (learning platform), api (backend), or admin (console)

6. **Track Progress with Commits**:
   - Use conventional commit format: `type(scope): description`
   - Reference issue number in commits
   - Include "Closes #[ISSUE_NUMBER]" in final commit

**Project Context**:
- Repository: amysoft.tech (Beyond the AI Plateau Nx monorepo)
- Applications: website (Angular), pwa (Ionic), api (NestJS), admin (Angular)
- Content tiers: foundation ($24.95), advanced, elite
- Launch target: July 1, 2025
- Revenue goal: $250K ARR within 12 months
- Quality standards: Enterprise-grade TypeScript with strict mode

### Testing Standards

**Unit Testing Requirements:**
- Maintain minimum 80% code coverage across all applications
- Test all public methods and edge cases
- Use descriptive test names that explain the scenario and expected outcome
- Mock external dependencies and services properly

**Integration Testing Standards:**
- Test API endpoints with real database connections in test environment
- Validate authentication and authorization flows end-to-end
- Test payment processing with Stripe test mode
- Verify PWA offline functionality and data synchronization

### Performance Requirements

**Frontend Performance Targets:**
- Lighthouse Performance Score: >90
- First Contentful Paint: <1.5 seconds
- Largest Contentful Paint: <2.5 seconds
- Cumulative Layout Shift: <0.1

**Backend Performance Requirements:**
- API response times: <200ms for most endpoints
- Database query optimization with proper indexing
- Caching strategies for frequently accessed content
- Rate limiting implementation for API protection

### Security Standards

**Security Implementation Requirements:**
- OWASP Top 10 vulnerability prevention
- Input validation and sanitization for all user inputs
- JWT token security with proper expiration and rotation
- HTTPS enforcement with proper security headers
- Rate limiting and DDoS protection

This comprehensive briefing document provides the foundation for effective Claude Code assistance throughout the development lifecycle.