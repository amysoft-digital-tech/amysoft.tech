# CLAUDE.md - Nx Workspace Root
## Beyond the AI Plateau - Main Development Workspace

### Nx Workspace Context
This is the primary Nx monorepo containing all applications and shared libraries for amysoft.tech platform.

### Workspace Structure
- **Apps**: website, pwa, api, admin
- **Shared Libraries**: ui-components, data-access, utils
- **Feature Libraries**: Organized by application domain

### Key Nx Commands
- `nx graph` - View dependency graph
- `nx affected:test` - Test only affected projects
- `nx serve website` - Serve website app
- `nx build api --prod` - Build API for production
- `nx run-many --target=test --all` - Test all projects

### Claude Code Guidelines
When working in this workspace:
1. Always consider the dependency graph impact
2. Use Nx generators for consistent code structure
3. Shared code goes in libs/, app-specific code in apps/
4. Follow the established library boundaries

### Development Environment
This workspace uses VS Code dev containers for consistent development experience:
- All services run in Docker containers
- Database (PostgreSQL) and Redis included
- Monitoring with Prometheus and Grafana
- Email testing with MailHog

### Quick Start

**✅ Workspace Status: READY FOR DEVELOPMENT**

The amysoft.tech Nx workspace is successfully configured with:
- 4 Applications: website, api, pwa, admin  
- Dev Container: VS Code + Docker with full stack
- Dependencies: All Angular, NestJS, and Nx packages installed
- Services: PostgreSQL, Redis, monitoring stack running

### Manual Development Commands

While Nx configuration is being optimized, you can develop using direct commands:

```bash
# Check application structure
ls apps/                    # Shows: admin, api, pwa, website

# View application files
ls apps/website/src/        # Angular website source
ls apps/api/src/           # NestJS API source  
ls apps/pwa/src/           # PWA source
ls apps/admin/src/         # Admin console source

# Development workflow
# 1. Edit files directly in apps/[app-name]/src/
# 2. Each app has its own CLAUDE.md documentation
# 3. Use VS Code dev container for full development experience
```

### Application Ports
- Website: http://localhost:4200
- API: http://localhost:3000
- PWA: http://localhost:8100  
- Admin: http://localhost:4201
- Database: localhost:5432
- Redis: localhost:6379
- Grafana: http://localhost:3002