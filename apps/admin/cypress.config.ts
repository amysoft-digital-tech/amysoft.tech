import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4201',
    supportFile: 'apps/admin/cypress/support/e2e.ts',
    specPattern: 'apps/admin/cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    fixturesFolder: 'apps/admin/cypress/fixtures',
    videosFolder: 'apps/admin/cypress/videos',
    screenshotsFolder: 'apps/admin/cypress/screenshots',
    
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    
    // Security and admin testing configuration
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    viewportWidth: 1280,
    viewportHeight: 720,
    
    // Environment variables for testing
    env: {
      admin_username: 'admin@amysoft.tech',
      admin_password: 'admin123',
      test_user_username: 'test@amysoft.tech',
      test_user_password: 'test123'
    }
  },

  component: {
    devServer: {
      framework: 'angular',
      bundler: 'webpack',
    },
    specPattern: '**/*.cy.ts'
  },
});