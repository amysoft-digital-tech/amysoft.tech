# apps/api/CLAUDE.md
## API Application - NestJS Backend

### Nx Context
- **Type**: NestJS application in Nx workspace
- **Dependencies**: @amysoft/shared-data-access, @amysoft/shared-utils
- **Purpose**: Backend API for all applications

### Development Commands
- `nx serve api` - Start development server
- `nx test api` - Run unit tests
- `nx build api --prod` - Production build
- `nx lint api` - Lint application

### Architecture
- RESTful API with NestJS framework
- PostgreSQL database with TypeORM
- Redis for caching and sessions
- JWT authentication
- Swagger documentation

### Endpoints
- `GET /` - API health check
- `GET /health` - Detailed health status