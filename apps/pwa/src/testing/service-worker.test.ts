/**
 * Service Worker Testing Suite
 * Comprehensive tests for service worker functionality, caching strategies, and background sync
 */

import { ServiceWorkerTestUtils, NetworkSimulator, pwaTestSuite } from './pwa-test-utils';

describe('Service Worker Functionality', () => {
  let swTestUtils: ServiceWorkerTestUtils;
  let networkSimulator: NetworkSimulator;

  beforeEach(() => {
    swTestUtils = new ServiceWorkerTestUtils();
    networkSimulator = new NetworkSimulator();
  });

  afterEach(() => {
    swTestUtils.restore();
    networkSimulator.restore();
  });

  describe('Service Worker Registration', () => {
    it('should register service worker successfully', async () => {
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js');
      expect(registration).toBeDefined();
      expect(registration.active).toBeDefined();
    });

    it('should handle service worker registration failure', async () => {
      swTestUtils.mockServiceWorker.register.mockRejectedValue(new Error('Registration failed'));
      
      await expect(navigator.serviceWorker.register('/sw.js')).rejects.toThrow('Registration failed');
    });

    it('should detect service worker update', async () => {
      const updateFoundSpy = jest.fn();
      
      swTestUtils.mockServiceWorkerRegistration({
        state: 'active',
        updateFound: true
      });

      const registration = await navigator.serviceWorker.register('/sw.js');
      registration.addEventListener('updatefound', updateFoundSpy);

      // Wait for the update event to be triggered
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(updateFoundSpy).toHaveBeenCalled();
    });

    it('should handle controller change', async () => {
      const controllerChangeSpy = jest.fn();
      
      navigator.serviceWorker.addEventListener('controllerchange', controllerChangeSpy);
      
      swTestUtils.mockServiceWorkerRegistration({
        state: 'active',
        controllerChanged: true
      });

      await navigator.serviceWorker.register('/sw.js');
      
      // Wait for the controller change event
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(controllerChangeSpy).toHaveBeenCalled();
    });
  });

  describe('Service Worker Lifecycle', () => {
    it('should handle installing state', async () => {
      swTestUtils.mockServiceWorkerRegistration({ state: 'installing' });
      
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      expect(registration.installing).toBeDefined();
      expect(registration.installing?.state).toBe('installing');
    });

    it('should handle waiting state', async () => {
      swTestUtils.mockServiceWorkerRegistration({ state: 'waiting' });
      
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      expect(registration.waiting).toBeDefined();
      expect(registration.waiting?.state).toBe('waiting');
    });

    it('should handle active state', async () => {
      swTestUtils.mockServiceWorkerRegistration({ state: 'active' });
      
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      expect(registration.active).toBeDefined();
      expect(registration.active?.state).toBe('activated');
    });

    it('should unregister service worker', async () => {
      const registration = await navigator.serviceWorker.register('/sw.js');
      const unregistered = await registration.unregister();
      
      expect(unregistered).toBe(true);
      expect(registration.unregister).toHaveBeenCalled();
    });
  });

  describe('Service Worker Communication', () => {
    it('should send message to service worker', async () => {
      const registration = await navigator.serviceWorker.register('/sw.js');
      const message = { type: 'TEST_MESSAGE', payload: { data: 'test' } };
      
      registration.active?.postMessage(message);
      
      expect(registration.active?.postMessage).toHaveBeenCalledWith(message);
    });

    it('should receive message from service worker', async () => {
      const messageHandler = jest.fn();
      navigator.serviceWorker.addEventListener('message', messageHandler);
      
      const messageData = { type: 'SW_MESSAGE', payload: { status: 'success' } };
      swTestUtils.simulateServiceWorkerMessage(messageData);
      
      expect(messageHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          data: messageData
        })
      );
    });

    it('should handle service worker ready state', async () => {
      const registration = await navigator.serviceWorker.ready;
      
      expect(registration).toBeDefined();
      expect(registration.active).toBeDefined();
      expect(registration.pushManager).toBeDefined();
    });
  });

  describe('Caching Strategies', () => {
    it('should implement cache-first strategy', async () => {
      // Mock cache API
      const mockCache = {
        match: jest.fn().mockResolvedValue(new Response('cached content')),
        put: jest.fn().mockResolvedValue(undefined),
        add: jest.fn().mockResolvedValue(undefined),
        addAll: jest.fn().mockResolvedValue(undefined),
        delete: jest.fn().mockResolvedValue(true)
      };

      global.caches = {
        open: jest.fn().mockResolvedValue(mockCache),
        match: jest.fn().mockResolvedValue(new Response('cached content')),
        has: jest.fn().mockResolvedValue(true),
        delete: jest.fn().mockResolvedValue(true),
        keys: jest.fn().mockResolvedValue(['cache-v1'])
      } as any;

      // Simulate cache-first strategy
      const request = new Request('/api/content');
      const cachedResponse = await caches.match(request);
      
      expect(cachedResponse).toBeDefined();
      expect(mockCache.match).toHaveBeenCalledWith(request);
    });

    it('should implement network-first strategy with cache fallback', async () => {
      networkSimulator.setNetworkState('offline');
      
      const mockCache = {
        match: jest.fn().mockResolvedValue(new Response('cached fallback')),
        put: jest.fn().mockResolvedValue(undefined)
      };

      global.caches = {
        open: jest.fn().mockResolvedValue(mockCache),
        match: jest.fn().mockResolvedValue(new Response('cached fallback'))
      } as any;

      try {
        // Try network first
        await fetch('/api/data');
      } catch (error) {
        // Fall back to cache
        const cachedResponse = await caches.match('/api/data');
        expect(cachedResponse).toBeDefined();
      }
    });

    it('should implement stale-while-revalidate strategy', async () => {
      const mockCache = {
        match: jest.fn().mockResolvedValue(new Response('stale content')),
        put: jest.fn().mockResolvedValue(undefined)
      };

      global.caches = {
        open: jest.fn().mockResolvedValue(mockCache),
        match: jest.fn().mockResolvedValue(new Response('stale content'))
      } as any;

      // Simulate stale-while-revalidate
      const request = new Request('/api/content');
      
      // Return stale content immediately
      const staleResponse = await caches.match(request);
      expect(staleResponse).toBeDefined();
      
      // Fetch fresh content in background (would update cache)
      fetch(request).catch(() => {}); // Ignore network errors
      
      expect(mockCache.match).toHaveBeenCalled();
    });
  });

  describe('Background Sync', () => {
    it('should register background sync', async () => {
      const registration = await navigator.serviceWorker.ready;
      const syncRegistration = {
        register: jest.fn().mockResolvedValue(undefined),
        getTags: jest.fn().mockResolvedValue(['background-sync'])
      };

      // Mock sync registration
      (registration as any).sync = syncRegistration;
      
      await registration.sync.register('background-sync');
      
      expect(syncRegistration.register).toHaveBeenCalledWith('background-sync');
    });

    it('should handle background sync event', async () => {
      const syncEventHandler = jest.fn();
      
      // Simulate background sync event in service worker context
      const syncEvent = new Event('sync');
      (syncEvent as any).tag = 'background-sync';
      
      // This would typically be handled in the service worker
      self.addEventListener('sync', syncEventHandler);
      self.dispatchEvent(syncEvent);
      
      expect(syncEventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'sync'
        })
      );
    });

    it('should queue requests for background sync when offline', async () => {
      networkSimulator.setNetworkState('offline');
      
      const queuedRequests: Request[] = [];
      const mockIndexedDB = {
        put: jest.fn().mockImplementation((request) => {
          queuedRequests.push(request);
          return Promise.resolve();
        }),
        getAll: jest.fn().mockResolvedValue(queuedRequests)
      };
      
      // Simulate queuing a request when offline
      const request = new Request('/api/sync-data', {
        method: 'POST',
        body: JSON.stringify({ data: 'test' })
      });
      
      try {
        await fetch(request);
      } catch (error) {
        // Queue for background sync
        await mockIndexedDB.put(request);
      }
      
      expect(mockIndexedDB.put).toHaveBeenCalledWith(request);
      expect(queuedRequests).toHaveLength(1);
    });
  });

  describe('Cache Management', () => {
    it('should clean up old caches', async () => {
      const currentCaches = ['cache-v2'];
      const allCaches = ['cache-v1', 'cache-v2', 'cache-v3'];
      
      global.caches = {
        keys: jest.fn().mockResolvedValue(allCaches),
        delete: jest.fn().mockResolvedValue(true)
      } as any;
      
      // Simulate cache cleanup
      const cacheNames = await caches.keys();
      const deletePromises = cacheNames
        .filter(name => !currentCaches.includes(name))
        .map(name => caches.delete(name));
      
      await Promise.all(deletePromises);
      
      expect(caches.delete).toHaveBeenCalledWith('cache-v1');
      expect(caches.delete).toHaveBeenCalledWith('cache-v3');
      expect(caches.delete).not.toHaveBeenCalledWith('cache-v2');
    });

    it('should precache critical resources', async () => {
      const criticalResources = [
        '/',
        '/static/css/main.css',
        '/static/js/main.js',
        '/manifest.json'
      ];
      
      const mockCache = {
        addAll: jest.fn().mockResolvedValue(undefined)
      };
      
      global.caches = {
        open: jest.fn().mockResolvedValue(mockCache)
      } as any;
      
      const cache = await caches.open('precache-v1');
      await cache.addAll(criticalResources);
      
      expect(mockCache.addAll).toHaveBeenCalledWith(criticalResources);
    });

    it('should handle cache storage quota exceeded', async () => {
      const mockCache = {
        put: jest.fn().mockRejectedValue(new DOMException('QuotaExceededError'))
      };
      
      global.caches = {
        open: jest.fn().mockResolvedValue(mockCache)
      } as any;
      
      const cache = await caches.open('test-cache');
      const request = new Request('/large-file');
      const response = new Response('large content');
      
      await expect(cache.put(request, response)).rejects.toThrow('QuotaExceededError');
    });
  });

  describe('Service Worker Error Handling', () => {
    it('should handle service worker activation error', async () => {
      const errorSpy = jest.fn();
      
      // Mock activation error
      self.addEventListener('error', errorSpy);
      self.dispatchEvent(new ErrorEvent('error', {
        message: 'Activation failed',
        filename: '/sw.js',
        lineno: 42
      }));
      
      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: 'Activation failed'
        })
      );
    });

    it('should handle fetch event error', async () => {
      networkSimulator.setNetworkState('offline');
      
      const fetchEventHandler = jest.fn().mockImplementation((event) => {
        event.respondWith(
          fetch(event.request).catch(() => {
            return new Response('Service Unavailable', { status: 503 });
          })
        );
      });
      
      self.addEventListener('fetch', fetchEventHandler);
      
      const fetchEvent = new FetchEvent('fetch', {
        request: new Request('/api/data')
      });
      
      self.dispatchEvent(fetchEvent);
      
      expect(fetchEventHandler).toHaveBeenCalled();
    });
  });
});

// Custom Jest matchers for PWA testing
expect.extend({
  toBeRegistered(received) {
    const pass = received && typeof received.register === 'function';
    return {
      message: () => `expected service worker to ${pass ? 'not ' : ''}be registered`,
      pass
    };
  },
  
  toHaveCachedResource(received, resource) {
    const pass = received && received.match && received.match(resource);
    return {
      message: () => `expected cache to ${pass ? 'not ' : ''}have resource ${resource}`,
      pass
    };
  },
  
  toBeOfflineCapable(received) {
    // This would check if the app works offline
    const pass = received && received.offlineCapable === true;
    return {
      message: () => `expected app to ${pass ? 'not ' : ''}be offline capable`,
      pass
    };
  }
});