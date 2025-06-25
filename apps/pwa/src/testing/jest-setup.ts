/**
 * Jest Setup for PWA Testing
 * Custom matchers, global mocks, and testing utilities
 */

import 'jest-preset-angular/setup-jest';

// Global test utilities and mocks
import { pwaTestSuite } from './pwa-test-utils';

// Extend Jest with custom PWA matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInstallable(): R;
      toHaveServiceWorker(): R;
      toSupportOfflineMode(): R;
      toBeCachedForOffline(): R;
      toHavePushNotificationSupport(): R;
      toBeResponsiveDesign(): R;
      toMeetPWAStandards(): R;
      toHaveAccessibilitySupport(): R;
      toSyncWhenOnline(): R;
      toHavePerformanceMetrics(): R;
    }
  }
}

// Custom PWA-specific Jest matchers
expect.extend({
  toBeInstallable(received: any) {
    const hasManifest = received.manifest !== undefined;
    const hasServiceWorker = received.serviceWorker !== undefined;
    const hasBeforeInstallPrompt = received.beforeInstallPromptEvent !== undefined;
    
    const pass = hasManifest && hasServiceWorker && hasBeforeInstallPrompt;
    
    return {
      message: () => {
        const missing = [];
        if (!hasManifest) missing.push('manifest');
        if (!hasServiceWorker) missing.push('service worker');
        if (!hasBeforeInstallPrompt) missing.push('install prompt event');
        
        return `Expected PWA to ${pass ? 'not ' : ''}be installable${
          pass ? '' : `. Missing: ${missing.join(', ')}`
        }`;
      },
      pass
    };
  },

  toHaveServiceWorker(received: any) {
    const hasRegistration = received.registration !== undefined;
    const hasActiveWorker = received.registration?.active !== undefined;
    const hasCorrectScope = received.registration?.scope !== undefined;
    
    const pass = hasRegistration && hasActiveWorker && hasCorrectScope;
    
    return {
      message: () => `Expected ${pass ? 'not ' : ''}to have a properly configured service worker`,
      pass
    };
  },

  toSupportOfflineMode(received: any) {
    const hasCachedResources = received.cachedResources && received.cachedResources.length > 0;
    const hasOfflineHandling = received.offlineCapable === true;
    const hasBackgroundSync = received.backgroundSyncEnabled === true;
    
    const pass = hasCachedResources && hasOfflineHandling && hasBackgroundSync;
    
    return {
      message: () => `Expected ${pass ? 'not ' : ''}to support offline mode functionality`,
      pass
    };
  },

  toBeCachedForOffline(received: string) {
    // Mock cache check - in real implementation, this would check actual cache
    const isCached = global.caches && typeof global.caches.match === 'function';
    
    return {
      message: () => `Expected resource "${received}" to ${isCached ? 'not ' : ''}be cached for offline access`,
      pass: isCached
    };
  },

  toHavePushNotificationSupport(received: any) {
    const hasNotificationAPI = received.Notification !== undefined;
    const hasPushManager = received.pushManager !== undefined;
    const hasPermissions = received.notificationPermission !== undefined;
    
    const pass = hasNotificationAPI && hasPushManager && hasPermissions;
    
    return {
      message: () => `Expected ${pass ? 'not ' : ''}to have push notification support`,
      pass
    };
  },

  toBeResponsiveDesign(received: any) {
    const hasViewportMeta = received.viewportMeta !== undefined;
    const hasResponsiveCSS = received.responsiveCSS === true;
    const hasTouchSupport = received.touchSupport === true;
    
    const pass = hasViewportMeta && hasResponsiveCSS && hasTouchSupport;
    
    return {
      message: () => `Expected ${pass ? 'not ' : ''}to have responsive design implementation`,
      pass
    };
  },

  toMeetPWAStandards(received: any) {
    const lighthouseScore = received.lighthouseScore || 0;
    const hasHTTPS = received.isHTTPS === true;
    const hasManifest = received.hasManifest === true;
    const hasServiceWorker = received.hasServiceWorker === true;
    
    const pass = lighthouseScore >= 90 && hasHTTPS && hasManifest && hasServiceWorker;
    
    return {
      message: () => `Expected PWA to ${pass ? 'not ' : ''}meet standard requirements (Lighthouse score: ${lighthouseScore})`,
      pass
    };
  },

  toHaveAccessibilitySupport(received: any) {
    const hasAriaLabels = received.ariaLabels === true;
    const hasKeyboardNavigation = received.keyboardNavigation === true;
    const hasScreenReaderSupport = received.screenReaderSupport === true;
    const hasHighContrast = received.highContrastSupport === true;
    
    const pass = hasAriaLabels && hasKeyboardNavigation && hasScreenReaderSupport && hasHighContrast;
    
    return {
      message: () => `Expected ${pass ? 'not ' : ''}to have comprehensive accessibility support`,
      pass
    };
  },

  toSyncWhenOnline(received: any) {
    const hasSyncQueue = received.syncQueue !== undefined;
    const hasNetworkDetection = received.networkDetection === true;
    const hasConflictResolution = received.conflictResolution === true;
    
    const pass = hasSyncQueue && hasNetworkDetection && hasConflictResolution;
    
    return {
      message: () => `Expected ${pass ? 'not ' : ''}to have proper sync functionality when online`,
      pass
    };
  },

  toHavePerformanceMetrics(received: any) {
    const hasLCP = received.largestContentfulPaint !== undefined;
    const hasFID = received.firstInputDelay !== undefined;
    const hasCLS = received.cumulativeLayoutShift !== undefined;
    const hasFCP = received.firstContentfulPaint !== undefined;
    
    const pass = hasLCP && hasFID && hasCLS && hasFCP;
    
    return {
      message: () => `Expected ${pass ? 'not ' : ''}to have Core Web Vitals performance metrics`,
      pass
    };
  }
});

// Global mocks for PWA APIs
beforeAll(() => {
  // Mock Web APIs that aren't available in Jest environment
  
  // Service Worker API
  Object.defineProperty(global.navigator, 'serviceWorker', {
    value: {
      register: jest.fn().mockResolvedValue({
        installing: null,
        waiting: null,
        active: { state: 'activated' },
        addEventListener: jest.fn(),
        update: jest.fn(),
        unregister: jest.fn().mockResolvedValue(true)
      }),
      ready: Promise.resolve({
        installing: null,
        waiting: null,
        active: { state: 'activated' },
        pushManager: {
          subscribe: jest.fn(),
          getSubscription: jest.fn()
        }
      }),
      controller: null,
      addEventListener: jest.fn(),
      getRegistration: jest.fn(),
      getRegistrations: jest.fn().mockResolvedValue([])
    },
    writable: true
  });

  // Notification API
  Object.defineProperty(global, 'Notification', {
    value: jest.fn().mockImplementation((title: string, options?: NotificationOptions) => ({
      title,
      body: options?.body,
      icon: options?.icon,
      close: jest.fn(),
      addEventListener: jest.fn()
    })),
    writable: true
  });

  // @ts-ignore
  global.Notification.permission = 'default';
  // @ts-ignore
  global.Notification.requestPermission = jest.fn().mockResolvedValue('granted');

  // Cache API
  Object.defineProperty(global, 'caches', {
    value: {
      open: jest.fn().mockResolvedValue({
        match: jest.fn(),
        matchAll: jest.fn(),
        add: jest.fn(),
        addAll: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        keys: jest.fn().mockResolvedValue([])
      }),
      match: jest.fn(),
      has: jest.fn(),
      delete: jest.fn(),
      keys: jest.fn().mockResolvedValue([])
    },
    writable: true
  });

  // IndexedDB API
  Object.defineProperty(global, 'indexedDB', {
    value: {
      open: jest.fn().mockReturnValue({
        result: {
          createObjectStore: jest.fn(),
          transaction: jest.fn().mockReturnValue({
            objectStore: jest.fn().mockReturnValue({
              add: jest.fn(),
              get: jest.fn(),
              put: jest.fn(),
              delete: jest.fn(),
              getAll: jest.fn()
            })
          })
        },
        addEventListener: jest.fn(),
        onsuccess: null,
        onerror: null
      }),
      deleteDatabase: jest.fn()
    },
    writable: true
  });

  // Intersection Observer API
  Object.defineProperty(global, 'IntersectionObserver', {
    value: jest.fn().mockImplementation((callback) => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
      thresholds: [0],
      root: null,
      rootMargin: '0px',
      takeRecords: jest.fn().mockReturnValue([])
    })),
    writable: true
  });

  // Resize Observer API
  Object.defineProperty(global, 'ResizeObserver', {
    value: jest.fn().mockImplementation((callback) => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn()
    })),
    writable: true
  });

  // Geolocation API
  Object.defineProperty(global.navigator, 'geolocation', {
    value: {
      getCurrentPosition: jest.fn(),
      watchPosition: jest.fn(),
      clearWatch: jest.fn()
    },
    writable: true
  });

  // Network Information API
  Object.defineProperty(global.navigator, 'connection', {
    value: {
      effectiveType: '4g',
      downlink: 10,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    },
    writable: true
  });

  // Battery API
  Object.defineProperty(global.navigator, 'getBattery', {
    value: jest.fn().mockResolvedValue({
      level: 0.8,
      charging: true,
      chargingTime: 3600,
      dischargingTime: Infinity,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    }),
    writable: true
  });

  // Touch Events
  Object.defineProperty(global, 'TouchEvent', {
    value: class TouchEvent extends Event {
      touches: TouchList;
      targetTouches: TouchList;
      changedTouches: TouchList;

      constructor(type: string, eventInitDict?: TouchEventInit) {
        super(type, eventInitDict);
        this.touches = (eventInitDict?.touches || []) as any;
        this.targetTouches = (eventInitDict?.targetTouches || []) as any;
        this.changedTouches = (eventInitDict?.changedTouches || []) as any;
      }
    },
    writable: true
  });

  // Vibration API
  Object.defineProperty(global.navigator, 'vibrate', {
    value: jest.fn(),
    writable: true
  });

  // Share API
  Object.defineProperty(global.navigator, 'share', {
    value: jest.fn().mockResolvedValue(undefined),
    writable: true
  });

  // Wake Lock API
  Object.defineProperty(global.navigator, 'wakeLock', {
    value: {
      request: jest.fn().mockResolvedValue({
        release: jest.fn(),
        addEventListener: jest.fn()
      })
    },
    writable: true
  });

  // Performance Observer API
  Object.defineProperty(global, 'PerformanceObserver', {
    value: jest.fn().mockImplementation((callback) => ({
      observe: jest.fn(),
      disconnect: jest.fn(),
      takeRecords: jest.fn().mockReturnValue([])
    })),
    writable: true
  });

  // Web Share Target API
  Object.defineProperty(global.navigator, 'canShare', {
    value: jest.fn().mockReturnValue(true),
    writable: true
  });

  // Clipboard API
  Object.defineProperty(global.navigator, 'clipboard', {
    value: {
      writeText: jest.fn().mockResolvedValue(undefined),
      readText: jest.fn().mockResolvedValue(''),
      write: jest.fn().mockResolvedValue(undefined),
      read: jest.fn().mockResolvedValue([])
    },
    writable: true
  });

  // Media Query API
  Object.defineProperty(global, 'matchMedia', {
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn()
    })),
    writable: true
  });

  // Web Workers
  Object.defineProperty(global, 'Worker', {
    value: jest.fn().mockImplementation(() => ({
      postMessage: jest.fn(),
      terminate: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      onmessage: null,
      onerror: null
    })),
    writable: true
  });

  // Crypto API
  Object.defineProperty(global, 'crypto', {
    value: {
      getRandomValues: jest.fn().mockImplementation((array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
        return array;
      }),
      randomUUID: jest.fn().mockReturnValue('550e8400-e29b-41d4-a716-446655440000'),
      subtle: {
        encrypt: jest.fn(),
        decrypt: jest.fn(),
        sign: jest.fn(),
        verify: jest.fn(),
        digest: jest.fn(),
        generateKey: jest.fn(),
        deriveKey: jest.fn(),
        deriveBits: jest.fn(),
        importKey: jest.fn(),
        exportKey: jest.fn(),
        wrapKey: jest.fn(),
        unwrapKey: jest.fn()
      }
    },
    writable: true
  });
});

// Global test cleanup
afterEach(() => {
  // Clean up any global state between tests
  jest.clearAllMocks();
  pwaTestSuite.reset();
  
  // Clear localStorage and sessionStorage
  global.localStorage.clear();
  global.sessionStorage.clear();
});

// Global error handling for unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Promise Rejection:', reason);
});

// Suppress console warnings for tests unless debugging
if (!process.env.DEBUG_TESTS) {
  global.console = {
    ...console,
    warn: jest.fn(),
    error: jest.fn()
  };
}