/**
 * Global Test Setup for PWA Testing Suite
 * Initializes test environment and shared resources
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

export default async function globalSetup() {
  console.log('🚀 Setting up PWA testing environment...');

  // Create test output directories
  const testDirs = [
    'test-results/apps/pwa',
    'coverage/apps/pwa',
    'lighthouse-reports/apps/pwa',
    'performance-reports/apps/pwa'
  ];

  testDirs.forEach(dir => {
    const fullPath = join(process.cwd(), '../../', dir);
    if (!existsSync(fullPath)) {
      mkdirSync(fullPath, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });

  // Initialize test database
  try {
    console.log('🗄️ Initializing test database...');
    // In a real implementation, this would set up a test database
    const testDbConfig = {
      host: 'localhost',
      port: 5432,
      database: 'pwa_test',
      user: 'test_user',
      password: 'test_password'
    };

    // Mock database initialization
    writeFileSync(
      join(process.cwd(), 'test-db-config.json'),
      JSON.stringify(testDbConfig, null, 2)
    );
    console.log('✅ Test database configuration created');
  } catch (error) {
    console.warn('⚠️ Test database setup failed:', error);
  }

  // Initialize test server
  try {
    console.log('🌐 Starting test server...');
    // In a real implementation, this would start a test server
    const testServerConfig = {
      port: 3001,
      host: 'localhost',
      protocol: 'http',
      apiEndpoints: {
        auth: '/api/auth',
        content: '/api/content',
        progress: '/api/progress',
        sync: '/api/sync'
      }
    };

    writeFileSync(
      join(process.cwd(), 'test-server-config.json'),
      JSON.stringify(testServerConfig, null, 2)
    );
    console.log('✅ Test server configuration created');
  } catch (error) {
    console.warn('⚠️ Test server setup failed:', error);
  }

  // Set up service worker test environment
  try {
    console.log('⚙️ Setting up Service Worker test environment...');
    
    // Create mock service worker for testing
    const mockServiceWorker = `
      // Mock Service Worker for Testing
      self.addEventListener('install', (event) => {
        console.log('Mock SW: Install event');
        self.skipWaiting();
      });

      self.addEventListener('activate', (event) => {
        console.log('Mock SW: Activate event');
        event.waitUntil(self.clients.claim());
      });

      self.addEventListener('fetch', (event) => {
        console.log('Mock SW: Fetch event for', event.request.url);
        
        // Mock response for testing
        if (event.request.url.includes('/api/test')) {
          event.respondWith(
            new Response(JSON.stringify({ message: 'Mock API response' }), {
              headers: { 'Content-Type': 'application/json' }
            })
          );
        }
      });

      self.addEventListener('sync', (event) => {
        console.log('Mock SW: Background sync event', event.tag);
      });

      self.addEventListener('push', (event) => {
        console.log('Mock SW: Push event', event.data?.text());
      });
    `;

    writeFileSync(
      join(process.cwd(), 'src/mock-sw.js'),
      mockServiceWorker
    );
    console.log('✅ Mock service worker created');
  } catch (error) {
    console.warn('⚠️ Service worker setup failed:', error);
  }

  // Initialize performance monitoring
  try {
    console.log('📊 Setting up performance monitoring...');
    
    const performanceConfig = {
      thresholds: {
        lcp: 2500, // Largest Contentful Paint
        fid: 100,  // First Input Delay
        cls: 0.1,  // Cumulative Layout Shift
        fcp: 1800, // First Contentful Paint
        ttfb: 600  // Time to First Byte
      },
      lighthouse: {
        performance: 90,
        accessibility: 95,
        bestPractices: 90,
        seo: 90,
        pwa: 90
      }
    };

    writeFileSync(
      join(process.cwd(), 'performance-config.json'),
      JSON.stringify(performanceConfig, null, 2)
    );
    console.log('✅ Performance monitoring configuration created');
  } catch (error) {
    console.warn('⚠️ Performance monitoring setup failed:', error);
  }

  // Set up accessibility testing
  try {
    console.log('♿ Setting up accessibility testing...');
    
    const a11yConfig = {
      rules: {
        'color-contrast': { enabled: true, level: 'AA' },
        'keyboard-navigation': { enabled: true },
        'aria-labels': { enabled: true },
        'focus-management': { enabled: true },
        'screen-reader': { enabled: true }
      },
      tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
      exclude: [
        '[data-testid="ignore-a11y"]'
      ]
    };

    writeFileSync(
      join(process.cwd(), 'a11y-config.json'),
      JSON.stringify(a11yConfig, null, 2)
    );
    console.log('✅ Accessibility testing configuration created');
  } catch (error) {
    console.warn('⚠️ Accessibility testing setup failed:', error);
  }

  // Initialize mock data
  try {
    console.log('📝 Setting up test data...');
    
    const mockData = {
      users: [
        {
          id: 'test-user-1',
          email: 'test1@example.com',
          subscriptionTier: 'foundation',
          progress: {},
          bookmarks: [],
          notes: [],
          preferences: {
            theme: 'light',
            fontSize: 'medium',
            notifications: true
          }
        },
        {
          id: 'test-user-2',
          email: 'test2@example.com',
          subscriptionTier: 'advanced',
          progress: {
            'chapter-1': { completed: true, percentage: 100 }
          },
          bookmarks: [
            {
              id: 'bookmark-1',
              chapterId: 'chapter-1',
              title: 'Test bookmark',
              position: 100
            }
          ],
          notes: [],
          preferences: {
            theme: 'dark',
            fontSize: 'large',
            notifications: false
          }
        }
      ],
      chapters: [
        {
          id: 'chapter-1',
          title: 'Foundation Principles',
          tier: 'foundation',
          content: 'Test chapter content...',
          sections: [
            { id: 'intro', title: 'Introduction' },
            { id: 'concepts', title: 'Core Concepts' }
          ]
        },
        {
          id: 'chapter-2',
          title: 'Advanced Techniques',
          tier: 'advanced',
          content: 'Advanced chapter content...',
          sections: [
            { id: 'overview', title: 'Overview' },
            { id: 'implementation', title: 'Implementation' }
          ]
        }
      ],
      templates: [
        {
          id: 'template-1',
          title: 'Code Review Template',
          category: 'development',
          principle: 'foundation',
          content: 'Please review this {{language}} code...',
          variables: [
            { name: 'language', type: 'select', options: ['JavaScript', 'Python', 'TypeScript'] },
            { name: 'code', type: 'multiline', required: true }
          ]
        }
      ]
    };

    writeFileSync(
      join(process.cwd(), 'test-data.json'),
      JSON.stringify(mockData, null, 2)
    );
    console.log('✅ Test data created');
  } catch (error) {
    console.warn('⚠️ Test data setup failed:', error);
  }

  // Set environment variables for testing
  process.env.NODE_ENV = 'test';
  process.env.PWA_TEST_MODE = 'true';
  process.env.API_BASE_URL = 'http://localhost:3001';
  process.env.ENABLE_MOCK_SERVICE_WORKER = 'true';

  console.log('✅ PWA testing environment setup complete!');
  console.log('📋 Test configuration summary:');
  console.log('   - Test database: configured');
  console.log('   - Test server: configured');
  console.log('   - Service worker: mocked');
  console.log('   - Performance monitoring: enabled');
  console.log('   - Accessibility testing: enabled');
  console.log('   - Mock data: loaded');
  console.log('🧪 Ready to run PWA tests!');
}