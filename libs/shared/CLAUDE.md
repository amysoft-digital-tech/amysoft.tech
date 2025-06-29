# libs/shared/CLAUDE.md
## Shared Libraries - Reusable Components and Services

### Nx Context
- **Type**: Shared libraries in Nx workspace
- **Purpose**: Reusable components, services, and utilities across all applications
- **Dependencies**: None (libraries should be dependency-free from each other)

### Library Structure

#### @amysoft/shared-ui-components
- **Location**: `libs/shared/ui-components`
- **Purpose**: Reusable Angular standalone components
- **Components**: Button, Card, Input, Spinner, Modal
- **Features**: Tailwind CSS styling, accessibility support, comprehensive testing

#### @amysoft/shared-data-access
- **Location**: `libs/shared/data-access`
- **Purpose**: API services, HTTP interceptors, and data management
- **Services**: ApiService, AuthService, UserService, ContentService
- **Features**: Error handling, caching, authentication, type safety

#### @amysoft/shared-types
- **Location**: `libs/shared/types`
- **Purpose**: TypeScript type definitions and interfaces
- **Types**: User, Content, API, UI, Analytics types
- **Features**: Complete domain modeling, DTOs, enums

#### @amysoft/shared-utils
- **Location**: `libs/shared/utils`
- **Purpose**: Common utility functions and helpers
- **Utils**: Validation, date formatting, string manipulation, file handling
- **Features**: Pure functions, comprehensive testing, tree-shakeable

### Development Commands
- `nx test shared-ui-components` - Test UI components
- `nx build shared-ui-components` - Build UI components library
- `nx storybook shared-ui-components` - Start Storybook for component docs
- `nx test shared-data-access` - Test data access services
- `nx build shared-types` - Build types library
- `nx test shared-utils` - Test utility functions

### Usage Guidelines

#### Importing from Shared Libraries
```typescript
// UI Components
import { ButtonComponent, CardComponent } from '@amysoft/shared-ui-components';

// Data Access
import { ApiService, AuthService } from '@amysoft/shared-data-access';

// Types
import { User, ApiResponse } from '@amysoft/shared-types';

// Utils
import { validateEmail, formatDate } from '@amysoft/shared-utils';
```

#### Component Usage Examples
```typescript
// Button Component
<amysoft-button 
  variant="primary" 
  size="md" 
  [loading]="isLoading"
  (buttonClick)="handleClick()">
  Save Changes
</amysoft-button>

// Card Component
<amysoft-card title="User Profile" subtitle="Manage your information">
  <p>Card content goes here</p>
  <div slot="footer">
    <amysoft-button variant="secondary">Cancel</amysoft-button>
    <amysoft-button variant="primary">Save</amysoft-button>
  </div>
</amysoft-card>

// Input Component
<amysoft-input
  label="Email"
  type="email"
  placeholder="Enter your email"
  [required]="true"
  errorMessage="Please enter a valid email"
  (inputChange)="onEmailChange($event)">
</amysoft-input>
```

### Architecture Principles
- **Single Responsibility**: Each library has a focused purpose
- **Dependency Direction**: Applications depend on libraries, not vice versa
- **No Cross-Dependencies**: Shared libraries should not depend on each other
- **Barrel Exports**: Clean imports through index.ts files
- **Type Safety**: Full TypeScript support with strict typing
- **Tree Shaking**: Optimized for bundle size with selective imports

### Testing Strategy
- **Unit Tests**: All components and services have comprehensive unit tests
- **Integration Tests**: Test component interactions and service integrations
- **Visual Tests**: Storybook for component visual testing
- **Type Tests**: Ensure type definitions are correct and complete

### Quality Standards
- **Accessibility**: All UI components follow WCAG guidelines
- **Performance**: Optimized for bundle size and runtime performance
- **Documentation**: Comprehensive JSDoc comments and examples
- **Consistency**: Unified coding standards across all libraries