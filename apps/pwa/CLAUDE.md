# apps/pwa/CLAUDE.md
## PWA Application - Interactive Learning Platform

### Nx Context
- **Type**: Angular Progressive Web App in Nx workspace
- **Dependencies**: @amysoft/shared-ui, @amysoft/shared-data-access
- **Purpose**: Mobile-first learning platform with offline capabilities

### Development Commands
- `nx serve pwa` - Start development server (port 8100)
- `nx test pwa` - Run unit tests
- `nx build pwa --prod` - Production build with service worker
- `nx lint pwa` - Lint application

### PWA Features
- Service Worker for offline functionality
- App manifest for installation
- Mobile-responsive design
- Push notifications (future)
- Background sync (future)

### Architecture
- Standalone Angular components
- Service worker integration
- Progressive enhancement
- Mobile-first responsive design