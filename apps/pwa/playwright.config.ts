import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for PWA Cross-Browser Testing
 * Comprehensive testing across desktop and mobile browsers
 */

export default defineConfig({
  testDir: './src/testing/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'cross-browser-reports/html' }],
    ['json', { outputFile: 'cross-browser-reports/results.json' }],
    ['junit', { outputFile: 'cross-browser-reports/junit.xml' }],
    ['line']
  ],
  use: {
    baseURL: 'http://localhost:8100',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000
  },

  projects: [
    // Desktop Browsers
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        launchOptions: {
          args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
        }
      }
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 }
      }
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 }
      }
    },
    {
      name: 'edge',
      use: { 
        ...devices['Desktop Edge'],
        viewport: { width: 1920, height: 1080 }
      }
    },

    // Mobile Browsers
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        isMobile: true,
        hasTouch: true
      }
    },
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 13'],
        isMobile: true,
        hasTouch: true
      }
    },

    // Tablet Browsers
    {
      name: 'iPad',
      use: { 
        ...devices['iPad Pro'],
        isMobile: false,
        hasTouch: true
      }
    },

    // Custom PWA Testing Configurations
    {
      name: 'PWA Desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        launchOptions: {
          args: [
            '--disable-web-security',
            '--enable-features=VizDisplayCompositor',
            '--app=http://localhost:8100',
            '--window-size=1280,720'
          ]
        }
      }
    },
    {
      name: 'PWA Mobile',
      use: {
        ...devices['Pixel 5'],
        launchOptions: {
          args: [
            '--disable-web-security',
            '--app=http://localhost:8100'
          ]
        }
      }
    },

    // Accessibility Testing
    {
      name: 'Accessibility Chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        reducedMotion: 'reduce',
        forcedColors: 'active'
      }
    },

    // Performance Testing
    {
      name: 'Performance Slow Network',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        launchOptions: {
          args: [
            '--disable-web-security',
            '--throttling.cpuSlowdownMultiplier=4',
            '--throttling.requestLatencyMs=300'
          ]
        }
      }
    }
  ],

  webServer: {
    command: 'npx nx serve pwa',
    port: 8100,
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  },

  expect: {
    timeout: 10000,
    toHaveScreenshot: {
      mode: 'css',
      animations: 'disabled'
    }
  },

  globalSetup: require.resolve('./src/testing/playwright-global-setup.ts'),
  globalTeardown: require.resolve('./src/testing/playwright-global-teardown.ts')
});