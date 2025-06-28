# apps/website/CLAUDE.md
## Website Application - Marketing Site

### Nx Context
- **Type**: Angular application in Nx workspace
- **Dependencies**: @amysoft/shared-ui, @amysoft/shared-data-access
- **Purpose**: Marketing website for ebook sales

### Development Commands
- `nx serve website` - Start development server
- `nx test website` - Run unit tests
- `nx build website --prod` - Production build
- `nx lint website` - Lint application

### Architecture
- Uses shared UI components from libs/shared/ui-components
- Integrates with API through libs/shared/data-access
- SEO-optimized with Angular Universal