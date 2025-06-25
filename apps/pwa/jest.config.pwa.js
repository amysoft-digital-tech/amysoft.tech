module.exports = {
  displayName: 'pwa',
  preset: '../../jest.preset.js',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  coverageDirectory: '../../coverage/apps/pwa',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/main.ts',
    '!src/polyfills.ts',
    '!src/environments/**',
    '!src/testing/**'
  ],
  coverageReporters: ['html', 'lcov', 'text-summary'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(ts|js)',
    '<rootDir>/src/**/?(*.)(spec|test).(ts|js)'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/e2e/'
  ],
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$'
      }
    ]
  },
  transformIgnorePatterns: [
    'node_modules/(?!.*\\.mjs$|@angular|@ionic)'
  ],
  moduleNameMapping: {
    '^@amysoft/(.*)$': '<rootDir>/../../libs/$1/src/index.ts'
  },
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons']
  },
  globalSetup: '<rootDir>/src/testing/global-setup.ts',
  globalTeardown: '<rootDir>/src/testing/global-teardown.ts',
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: '../../test-results/apps/pwa',
        outputName: 'junit.xml'
      }
    ],
    [
      'jest-html-reporter',
      {
        pageTitle: 'PWA Test Results',
        outputPath: '../../test-results/apps/pwa/test-report.html',
        includeFailureMsg: true,
        includeSuiteFailure: true
      }
    ]
  ],
  // PWA-specific test configuration
  testTimeout: 30000, // Longer timeout for PWA tests
  maxWorkers: '50%', // Optimize for CI environments
  
  // Custom Jest matchers for PWA testing
  setupFiles: ['<rootDir>/src/testing/jest-setup.ts'],
  
  // Mock configurations for PWA APIs
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Performance testing configuration
  slowTestThreshold: 5000,
  
  // Snapshot testing configuration
  snapshotSerializers: [
    'jest-preset-angular/build/serializers/no-ng-attributes',
    'jest-preset-angular/build/serializers/ng-snapshot',
    'jest-preset-angular/build/serializers/html-comment'
  ]
};