# API App

NestJS backend with PostgreSQL and Redis for authentication, content delivery, and payments.

**Port:** 3000  
**Purpose:** API services for authentication, content delivery, and payments  
**Revenue Impact:** Critical infrastructure for user management and payment processing

## Features

- JWT authentication with refresh token rotation
- User management and subscription handling
- Content delivery API with caching
- Stripe payment processing integration
- PostgreSQL database with TypeORM
- Redis caching and session management

## Development

```bash
# Serve in development
nx serve api

# Build for production
nx build api --prod

# Run tests
nx test api

# Run e2e tests
npm run test:e2e:api

# Database operations
npm run db:migrate
npm run db:seed
npm run db:reset
```