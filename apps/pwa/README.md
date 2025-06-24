# PWA App

Ionic Angular Progressive Web App for interactive learning platform and ebook delivery.

**Port:** 8100  
**Purpose:** Interactive learning platform and ebook delivery  
**Revenue Impact:** Core product delivery platform for content consumption

## Features

- Progressive Web App with offline functionality
- Chapter navigation with progress tracking
- Template library with 100+ prompt templates
- Bookmark system and personal notes
- Cross-device synchronization

## Development

```bash
# Serve in development
nx serve pwa

# Build for production
nx build pwa --prod

# Run tests
nx test pwa

# PWA audit
lighthouse http://localhost:8100 --view

# Device testing
ionic capacitor run ios
ionic capacitor run android
```