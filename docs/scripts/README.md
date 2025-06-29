# Content Migration Setup Script

## Overview

The `content-migration-setup.sh` script provides automated implementation of the comprehensive content migration strategy for the "Beyond the AI Plateau" project in an existing Nx workspace.

## What This Script Does

### 🎼 The Conductor's Method Implementation

This script orchestrates the transformation of your existing Nx workspace by:

1. **Content Repository Integration**: Adds the amysoftai-content repository as a git submodule
2. **Dependency Management**: Installs required packages for content processing
3. **Shared Library Generation**: Creates missing Nx shared libraries for consistent code organization
4. **API Enhancement**: Extends the existing API with content models, migration service, and endpoints
5. **PWA Enhancement**: Adds content service and chapter display components to the PWA
6. **Development Workflow**: Configures scripts for parallel development and content migration

### 📚 Content Capabilities Added

- **Database Schema**: Complete Prisma models for ContentTier, Chapter, PromptTemplate, CaseStudy, and Asset
- **Migration Service**: Automated content extraction from markdown files with frontmatter parsing
- **Content API**: RESTful endpoints for content retrieval, filtering, and search
- **Angular Service**: Frontend content service with caching and offline support
- **Ionic Components**: Responsive chapter display with tier-based styling
- **Search & Analytics**: Template usage tracking and content relationship management

## Prerequisites

Before running this script, ensure:

- You're in the root of your amysoft.tech Nx workspace
- PostgreSQL database is running and accessible
- Node.js and npm are installed
- Git is configured and you have access to the amysoftai-content repository

## Usage

```bash
# Make the script executable (if not already)
chmod +x docs/scripts/content-migration-setup.sh

# Run from the workspace root
./docs/scripts/content-migration-setup.sh
```

## What Gets Created

### New Directories
```
├── content-source/                    # Git submodule to amysoftai-content
├── libs/
│   ├── shared-types/                  # TypeScript interfaces
│   ├── shared-utils/                  # Utility functions
│   ├── shared-ui/                     # Angular UI components
│   └── shared-data-access/            # Data access patterns
├── apps/api/src/app/
│   ├── content-migration/             # Migration service and controller
│   └── content/                       # Content API endpoints
└── apps/pwa/src/app/
    ├── services/content.service.ts    # Frontend content service
    └── chapters/                      # Chapter display page
```

### Enhanced Files
- `apps/api/prisma/schema.prisma`: Extended with content models
- `apps/pwa/src/environments/`: Updated environment configurations
- `package.json`: Added content migration scripts

### New Scripts
- `npm run content:migrate`: Execute content migration
- `npm run content:status`: Check migration status
- `npm run dev:full`: Start API and PWA in parallel
- `npm run build:affected`: Build only affected projects
- `npm run test:affected`: Test only affected projects

## Post-Setup Workflow

After running the script:

1. **Start Development Environment**
   ```bash
   npm run dev:full
   ```

2. **Run Content Migration**
   ```bash
   npm run content:migrate
   ```

3. **Check Migration Status**
   ```bash
   npm run content:status
   ```

4. **Access Content**
   - API: http://localhost:3000/api/content/chapters
   - PWA: http://localhost:4200/chapters

## Content Structure Supported

The script handles content migration from the amysoftai-content repository structure:

```
content-source/
└── content/
    └── principles/
        ├── ch01-context-mastery/
        │   └── README.md              # Chapter content with frontmatter
        ├── ch02-dynamic-planning/
        └── ...
```

### Frontmatter Support

The migration service processes frontmatter in chapter files:

```yaml
---
title: "Context Mastery"
subtitle: "The Foundation of Effective AI Interaction"
description: "Learn to provide precise context for optimal AI responses"
tier: foundation
sortOrder: 1
tags: ["context-mastery", "foundation"]
isPublished: true
completionStatus: complete
---
```

## Multi-Tier Content System

Content is automatically organized into pricing tiers:

- **Foundation** ($24.95): Chapters 1-2, basic principles
- **Advanced** ($97.00): Chapters 3-7, advanced techniques  
- **Elite** ($297.00): Chapters 8-9, transformation mastery

## Error Handling

The script includes comprehensive error handling:

- **Prerequisites Check**: Validates Nx workspace structure
- **Backup Creation**: Backs up existing Prisma schema
- **Migration Logging**: Tracks migration success/failure for each content piece
- **Graceful Degradation**: Continues processing if individual files fail

## Customization

### Content Source Location
To use a different content repository:

```bash
# Edit the script to change the repository URL
git submodule add https://github.com/your-org/your-content.git content-source
```

### Tier Configuration
Modify tier pricing and descriptions in the migration service:

```typescript
const tiers = [
  { name: 'foundation', price: 24.95, description: 'Foundation principles', sortOrder: 1 },
  { name: 'advanced', price: 97.00, description: 'Advanced techniques', sortOrder: 2 },
  { name: 'elite', price: 297.00, description: 'Elite transformation', sortOrder: 3 },
];
```

## Troubleshooting

### Common Issues

1. **Submodule Access Denied**
   ```bash
   # Use HTTPS instead of SSH
   git config --global url."https://github.com/".insteadOf git@github.com:
   ```

2. **Prisma Migration Fails**
   ```bash
   # Use database push instead of migration
   npx prisma db push
   ```

3. **Content Not Found**
   ```bash
   # Update submodule to latest
   git submodule update --remote content-source
   ```

### Validation

Verify setup success:

```bash
# Check if content tiers exist
curl http://localhost:3000/api/content/tiers

# Check if chapters are migrated
curl http://localhost:3000/api/content/chapters

# Check migration logs in database
npx prisma studio
```

## Performance Considerations

- **Incremental Migration**: The service only processes changed files on subsequent runs
- **Database Indexing**: Proper indexes on slug and tier fields for fast queries
- **Caching Strategy**: Angular service includes BehaviorSubject caching for offline support
- **Parallel Processing**: Development environment runs API and PWA concurrently

## Security Features

- **Content Validation**: Markdown content is sanitized before storage
- **Access Control**: Published flag controls content visibility
- **Tier Restrictions**: Content access based on subscription tier
- **Error Logging**: Migration errors are logged without exposing sensitive paths

---

This script transforms your existing Nx workspace into a powerful content management and delivery platform while maintaining your established development patterns and infrastructure choices.