/**
 * Playwright Global Setup
 * Initializes the test environment for cross-browser and mobile testing
 */

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🎭 Setting up Playwright testing environment...');

  // Launch a browser instance to warm up and verify connectivity
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Verify the application is running
    console.log('🌐 Verifying application availability...');
    await page.goto('http://localhost:8100', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // Check if it's a PWA
    console.log('📱 Checking PWA capabilities...');
    const isServiceWorkerRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          return !!registration;
        } catch (error) {
          return false;
        }
      }
      return false;
    });

    if (isServiceWorkerRegistered) {
      console.log('✅ Service Worker detected');
    } else {
      console.log('⚠️ Service Worker not registered');
    }

    // Check for manifest
    const hasManifest = await page.evaluate(() => {
      const manifestLink = document.querySelector('link[rel="manifest"]');
      return !!manifestLink;
    });

    if (hasManifest) {
      console.log('✅ Web App Manifest detected');
    } else {
      console.log('⚠️ Web App Manifest not found');
    }

    // Check for offline capability
    console.log('🔌 Testing offline capability...');
    await page.context().setOffline(true);
    
    try {
      await page.reload({ waitUntil: 'networkidle', timeout: 10000 });
      console.log('✅ Application works offline');
    } catch (error) {
      console.log('⚠️ Offline functionality limited');
    }

    await page.context().setOffline(false);

    // Test responsiveness
    console.log('📐 Testing responsive design...');
    const viewports = [
      { width: 320, height: 568, name: 'iPhone SE' },
      { width: 768, height: 1024, name: 'iPad' },
      { width: 1920, height: 1080, name: 'Desktop' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForLoadState('networkidle');
      
      const isResponsive = await page.evaluate(() => {
        const body = document.body;
        return body.scrollWidth <= window.innerWidth;
      });

      if (isResponsive) {
        console.log(`✅ Responsive at ${viewport.name} (${viewport.width}x${viewport.height})`);
      } else {
        console.log(`⚠️ Layout issues at ${viewport.name} (${viewport.width}x${viewport.height})`);
      }
    }

    // Test accessibility basics
    console.log('♿ Testing basic accessibility...');
    const hasLangAttribute = await page.evaluate(() => {
      return document.documentElement.hasAttribute('lang');
    });

    const hasTitle = await page.evaluate(() => {
      return document.title && document.title.length > 0;
    });

    const hasMetaDescription = await page.evaluate(() => {
      const metaDescription = document.querySelector('meta[name="description"]');
      return metaDescription && metaDescription.getAttribute('content');
    });

    if (hasLangAttribute) console.log('✅ Language attribute found');
    if (hasTitle) console.log('✅ Page title found');
    if (hasMetaDescription) console.log('✅ Meta description found');

    // Test performance basics
    console.log('⚡ Testing basic performance...');
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });

    console.log(`📊 Performance metrics:
      - DOM Content Loaded: ${performanceMetrics.domContentLoaded}ms
      - Load Complete: ${performanceMetrics.loadComplete}ms
      - First Paint: ${performanceMetrics.firstPaint}ms
      - First Contentful Paint: ${performanceMetrics.firstContentfulPaint}ms`);

    // Test touch capabilities on mobile
    console.log('👆 Testing touch capabilities...');
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone size
    
    const supportsTouchEvents = await page.evaluate(() => {
      return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    });

    if (supportsTouchEvents) {
      console.log('✅ Touch events supported');
    }

    // Test storage capabilities
    console.log('💾 Testing storage capabilities...');
    const storageSupport = await page.evaluate(async () => {
      const support = {
        localStorage: false,
        sessionStorage: false,
        indexedDB: false,
        cacheAPI: false
      };

      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        support.localStorage = true;
      } catch (e) {}

      try {
        sessionStorage.setItem('test', 'test');
        sessionStorage.removeItem('test');
        support.sessionStorage = true;
      } catch (e) {}

      try {
        support.indexedDB = 'indexedDB' in window;
      } catch (e) {}

      try {
        support.cacheAPI = 'caches' in window;
      } catch (e) {}

      return support;
    });

    Object.entries(storageSupport).forEach(([key, supported]) => {
      if (supported) {
        console.log(`✅ ${key} supported`);
      } else {
        console.log(`⚠️ ${key} not supported`);
      }
    });

    console.log('✅ Playwright setup complete!');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;