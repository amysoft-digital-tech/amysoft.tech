# Beyond the AI Plateau

**Five Elite Principles That Transform LLM Code Generation from Frustrating to Phenomenal**

> A comprehensive learning ecosystem built with Nx Monorepo, featuring Angular marketing website, Ionic PWA, NestJS API, and Angular admin console.

## Project Overview

This project implements a three-tier learning ecosystem centered on a Progressive Web Application ebook platform. The foundation tier ($24.95) contains complete content including the Five Elite Principles methodology, 100+ production-ready prompt templates, and a 12-week transformation roadmap.

### Technical Architecture

**Hybrid Nx Monorepo Structure:**
- **Apps:** website (Angular marketing), pwa (Ionic learning platform), api (NestJS backend), admin (Angular console)
- **Shared Libraries:** ui-components, data-access, utils, types
- **Feature Libraries:** Organized by application domain for optimal Claude Code context
- **Infrastructure:** VPS deployment without third-party cloud dependencies

## Quick Start

```bash
# Install dependencies
npm install

# Start development servers
npm run dev

# Or start individual apps
npm run serve:website    # Port 4200
npm run serve:pwa       # Port 8100
npm run serve:api       # Port 3000
npm run serve:admin     # Port 4201
```

## Development

### Prerequisites

- Node.js 18+ 
- npm 9+
- Nx CLI globally installed: `npm install -g nx`

### Essential Commands

```bash
# Serve applications
nx serve website              # Marketing site
nx serve pwa                 # Learning platform
nx serve api                 # Backend API
nx serve admin               # Admin console

# Build applications
nx build website --prod
nx build pwa --prod
nx build api --prod
nx build admin --prod

# Run tests
nx test website
nx test pwa
nx test api
nx test admin

# Run all tests
nx run-many --target=test --all

# Lint code
nx lint website
nx run-many --target=lint --all
```

## Project Structure

```
amysoft.tech/
├── apps/
│   ├── website/          # Angular marketing website
│   ├── pwa/             # Ionic learning platform
│   ├── api/             # NestJS backend API
│   └── admin/           # Angular admin console
├── libs/
│   └── shared/
│       ├── ui-components/   # Reusable UI components
│       ├── data-access/     # Services and data access
│       ├── utils/           # Utility functions
│       └── types/           # TypeScript type definitions
├── docs/               # Documentation
└── tools/              # Build tools and scripts
```

## Business Context

**Launch Target:** July 1, 2025  
**Business Goal:** $250K ARR within 12 months  
**Foundation Tier Pricing:** $24.95 (primary revenue driver)  
**Content Completion Status:** 85% complete foundation content

## Contributing

1. Create feature branch: `git checkout -b feat/your-feature`
2. Follow commit conventions: `feat(scope): description`
3. Run tests: `nx affected:test --base=main`
4. Create pull request with proper labels

## License

MIT License - see LICENSE file for details.

---

**Organization:** amysoft-digital-tech  
**Repository:** https://github.com/amysoft-digital-tech/amysoft.tech