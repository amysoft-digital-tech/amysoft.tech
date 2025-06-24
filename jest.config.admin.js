const { createGlobPatternsForDependencies } = require('@nx/angular/tailwind');

module.exports = {
  displayName: 'admin',
  preset: './jest.preset.js',
  setupFilesAfterEnv: ['<rootDir>/apps/admin/src/app/testing/test-setup.ts'],
  coverageDirectory: '../../coverage/apps/admin',
  collectCoverageFrom: [
    'apps/admin/src/**/*.{ts,js}',
    '!apps/admin/src/**/*.d.ts',
    '!apps/admin/src/**/index.ts',
    '!apps/admin/src/**/*.stories.ts',
    '!apps/admin/src/**/*.spec.ts',
    '!apps/admin/src/main.ts',
    '!apps/admin/src/polyfills.ts'
  ],
  coverageReporters: ['html', 'lcov', 'text-summary', 'cobertura'],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80
    },
    'apps/admin/src/app/features/': {
      statements: 85,
      branches: 80,
      functions: 85,
      lines: 85
    },
    'apps/admin/src/app/core/': {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90
    }
  },
  testMatch: [
    '<rootDir>/apps/admin/src/**/__tests__/**/*.[jt]s?(x)',
    '<rootDir>/apps/admin/src/**/*(*.)@(spec|test).[jt]s?(x)'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/apps/admin/src/**/*.e2e.spec.ts',
    '<rootDir>/apps/admin/src/**/*.integration.spec.ts'
  ],
  moduleNameMapping: {
    '^@admin/(.*)$': '<rootDir>/apps/admin/src/app/$1',
    '^@shared/(.*)$': '<rootDir>/libs/shared/$1',
    '^@testing/(.*)$': '<rootDir>/apps/admin/src/app/testing/$1'
  },
  transformIgnorePatterns: [
    'node_modules/(?!.*\\.mjs$|@angular|@ngrx|rxjs|@nx)'
  ],
  snapshotSerializers: [
    'jest-preset-angular/build/serializers/no-ng-attributes',
    'jest-preset-angular/build/serializers/ng-snapshot',
    'jest-preset-angular/build/serializers/html-comment'
  ],
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/apps/admin/tsconfig.spec.json',
      stringifyContentPathRegex: '\\.(html|svg)$'
    }
  },
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons']
  },
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: './reports/junit',
      outputName: 'admin-test-results.xml',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      ancestorSeparator: ' › ',
      usePathForSuiteName: true
    }],
    ['jest-html-reporters', {
      publicPath: './reports/html',
      filename: 'admin-test-report.html',
      expand: true,
      hideIcon: false,
      pageTitle: 'Admin Console Test Report'
    }]
  ],
  collectCoverageFrom: [
    'apps/admin/src/**/*.{ts,js}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/vendor/**'
  ],
  // Performance testing configuration
  maxWorkers: '50%',
  workerIdleMemoryLimit: '1GB',
  // Security testing helpers
  testTimeout: 30000,
  // Custom matchers for admin-specific testing
  setupFilesAfterEnv: [
    '<rootDir>/apps/admin/src/app/testing/test-setup.ts',
    '<rootDir>/apps/admin/src/app/testing/custom-matchers.ts'
  ]
};