import { defineConfig } from 'cypress';
import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';

export default defineConfig({
  e2e: {
    ...nxE2EPreset(__filename, {
      cypressDir: 'src',
      webServerCommands: { 
        default: 'nx run admin:serve',
        production: 'nx run admin:preview' 
      },
      ciWebServerCommand: 'nx run admin:serve-static'
    }),
    baseUrl: 'http://localhost:4201',
    video: true,
    screenshotOnRunFailure: true,
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    env: {
      adminBaseUrl: 'http://localhost:4201',
      apiBaseUrl: 'http://localhost:3000',
      testUser: {
        email: 'admin@amysoft.tech',
        password: 'test-password-123'
      },
      testUserRoles: {
        superAdmin: 'super-admin@amysoft.tech',
        contentAdmin: 'content-admin@amysoft.tech',
        supportAgent: 'support@amysoft.tech',
        viewer: 'viewer@amysoft.tech'
      }
    },
    retries: {
      runMode: 2,
      openMode: 0
    },
    setupNodeEvents(on, config) {
      // Code coverage collection
      require('@cypress/code-coverage/task')(on, config);
      
      // RBAC testing utilities
      on('task', {
        'rbac:createTestUser': (userData) => {
          // Create test users with specific roles
          return require('./src/support/rbac-utils').createTestUser(userData);
        },
        'rbac:validatePermissions': (rolePermissions) => {
          // Validate role-based permissions
          return require('./src/support/rbac-utils').validatePermissions(rolePermissions);
        },
        'db:seed': () => {
          // Seed test database with admin data
          return require('./src/support/db-utils').seedAdminData();
        },
        'db:cleanup': () => {
          // Clean up test data
          return require('./src/support/db-utils').cleanupTestData();
        },
        'security:checkVulnerabilities': (target) => {
          // Run security scans
          return require('./src/support/security-utils').runSecurityScan(target);
        }
      });

      return config;
    }
  }
});