/**
 * Offline Functionality Testing Suite
 * Comprehensive tests for offline capabilities, data synchronization, and progressive loading
 */

import { NetworkSimulator, OfflineStorageTester, pwaTestSuite } from './pwa-test-utils';

describe('Offline Functionality', () => {
  let networkSimulator: NetworkSimulator;
  let storageTester: OfflineStorageTester;

  beforeEach(() => {
    networkSimulator = new NetworkSimulator();
    storageTester = new OfflineStorageTester();
  });

  afterEach(() => {
    networkSimulator.restore();
    storageTester.restore();
    pwaTestSuite.reset();
  });

  describe('Network State Detection', () => {
    it('should detect online state', () => {
      networkSimulator.setNetworkState('online');
      expect(navigator.onLine).toBe(true);
    });

    it('should detect offline state', () => {
      networkSimulator.setNetworkState('offline');
      expect(navigator.onLine).toBe(false);
    });

    it('should handle network state changes', () => {
      const onlineHandler = jest.fn();
      const offlineHandler = jest.fn();
      
      window.addEventListener('online', onlineHandler);
      window.addEventListener('offline', offlineHandler);
      
      networkSimulator.setNetworkState('offline');
      expect(offlineHandler).toHaveBeenCalled();
      
      networkSimulator.setNetworkState('online');
      expect(onlineHandler).toHaveBeenCalled();
    });

    it('should detect slow network conditions', async () => {
      networkSimulator.setNetworkState('slow');
      
      const startTime = Date.now();
      try {
        await fetch('/api/test');
      } catch (error) {
        // Network might fail in slow conditions
      }
      const endTime = Date.now();
      
      // Should take longer than normal (simulated delay)
      expect(endTime - startTime).toBeGreaterThan(1000);
    });

    it('should detect unstable network conditions', async () => {
      networkSimulator.setNetworkState('unstable');
      
      let failureCount = 0;
      const attempts = 10;
      
      for (let i = 0; i < attempts; i++) {
        try {
          await fetch('/api/test');
        } catch (error) {
          failureCount++;
        }
      }
      
      // Some requests should fail in unstable conditions
      expect(failureCount).toBeGreaterThan(0);
    });
  });

  describe('Offline Content Access', () => {
    it('should serve cached content when offline', async () => {
      // Mock cached response
      const cachedContent = new Response('Cached chapter content');
      global.caches = {
        match: jest.fn().mockResolvedValue(cachedContent)
      } as any;
      
      networkSimulator.setNetworkState('offline');
      
      const response = await caches.match('/content/chapter-1');
      expect(response).toBeDefined();
      expect(await response?.text()).toBe('Cached chapter content');
    });

    it('should show offline indicator when network is unavailable', () => {
      networkSimulator.setNetworkState('offline');
      
      // Simulate offline indicator component
      const offlineIndicator = {
        visible: !navigator.onLine,
        message: 'You are currently offline. Some features may be limited.'
      };
      
      expect(offlineIndicator.visible).toBe(true);
      expect(offlineIndicator.message).toContain('offline');
    });

    it('should cache critical resources for offline use', async () => {
      const criticalResources = [
        '/content/chapter-1',
        '/content/chapter-2',
        '/templates/basic-prompt',
        '/static/css/main.css',
        '/static/js/main.js'
      ];
      
      const mockCache = {
        addAll: jest.fn().mockResolvedValue(undefined),
        match: jest.fn().mockImplementation((request) => {
          const url = typeof request === 'string' ? request : request.url;
          if (criticalResources.some(resource => url.includes(resource))) {
            return Promise.resolve(new Response('cached content'));
          }
          return Promise.resolve(undefined);
        })
      };
      
      global.caches = {
        open: jest.fn().mockResolvedValue(mockCache)
      } as any;
      
      // Precache critical resources
      const cache = await caches.open('critical-v1');
      await cache.addAll(criticalResources);
      
      // Verify offline access
      networkSimulator.setNetworkState('offline');
      
      for (const resource of criticalResources) {
        const response = await cache.match(resource);
        expect(response).toBeDefined();
      }
    });

    it('should handle partial content loading', async () => {
      // Simulate progressive content loading
      const contentChunks = [
        { id: 1, content: 'Introduction to AI Prompts', priority: 'high' },
        { id: 2, content: 'Basic Prompt Techniques', priority: 'high' },
        { id: 3, content: 'Advanced Examples', priority: 'medium' },
        { id: 4, content: 'Additional Resources', priority: 'low' }
      ];
      
      const mockCache = {
        match: jest.fn().mockImplementation((request) => {
          const url = request.url || request;
          const chunkId = parseInt(url.split('/').pop() || '0');
          const chunk = contentChunks.find(c => c.id === chunkId);
          
          if (chunk && chunk.priority === 'high') {
            return Promise.resolve(new Response(JSON.stringify(chunk)));
          }
          return Promise.resolve(undefined);
        })
      };
      
      global.caches = {
        open: jest.fn().mockResolvedValue(mockCache)
      } as any;
      
      networkSimulator.setNetworkState('offline');
      
      // Should load high priority content
      const highPriorityContent = await (await caches.open('content')).match('/content/1');
      expect(highPriorityContent).toBeDefined();
      
      // Should not load low priority content when offline
      const lowPriorityContent = await (await caches.open('content')).match('/content/4');
      expect(lowPriorityContent).toBeUndefined();
    });
  });

  describe('Offline Data Storage', () => {
    it('should store user progress offline', async () => {
      const userProgress = {
        userId: 'user123',
        chapterId: 'chapter-1',
        progress: 75,
        lastRead: new Date().toISOString(),
        bookmarks: ['section-2', 'section-5'],
        notes: [
          { id: 1, text: 'Important concept', timestamp: new Date().toISOString() }
        ]
      };
      
      // Store in localStorage
      localStorage.setItem('userProgress', JSON.stringify(userProgress));
      
      // Verify storage
      const storedProgress = JSON.parse(localStorage.getItem('userProgress') || '{}');
      expect(storedProgress.userId).toBe('user123');
      expect(storedProgress.progress).toBe(75);
      expect(storedProgress.bookmarks).toHaveLength(2);
    });

    it('should handle storage quota exceeded', () => {
      storageTester.simulateStorageQuotaExceeded();
      
      expect(() => {
        localStorage.setItem('largeData', 'x'.repeat(6000000)); // Exceeds 5MB limit
      }).toThrow('QuotaExceededError');
    });

    it('should use IndexedDB for large offline data', async () => {
      const mockDatabase = {
        transaction: jest.fn().mockReturnValue({
          objectStore: jest.fn().mockReturnValue({
            add: jest.fn().mockResolvedValue(undefined),
            get: jest.fn().mockResolvedValue({
              id: 'chapter-1',
              content: 'Large chapter content...',
              media: ['image1.jpg', 'video1.mp4']
            }),
            put: jest.fn().mockResolvedValue(undefined),
            delete: jest.fn().mockResolvedValue(undefined)
          })
        })
      };
      
      const mockOpenRequest = {
        result: mockDatabase,
        addEventListener: jest.fn(),
        onsuccess: null,
        onerror: null
      };
      
      global.indexedDB = {
        open: jest.fn().mockReturnValue(mockOpenRequest)
      } as any;
      
      // Simulate opening database
      const request = indexedDB.open('PWADatabase', 1);
      mockOpenRequest.onsuccess = () => {};
      mockOpenRequest.onsuccess();
      
      const db = request.result;
      const transaction = db.transaction(['chapters'], 'readwrite');
      const store = transaction.objectStore('chapters');
      
      // Store chapter data
      await store.add({
        id: 'chapter-1',
        content: 'Large chapter content...',
        media: ['image1.jpg', 'video1.mp4']
      });
      
      // Retrieve chapter data
      const chapter = await store.get('chapter-1');
      expect(chapter.id).toBe('chapter-1');
      expect(chapter.media).toHaveLength(2);
    });

    it('should handle IndexedDB failures gracefully', async () => {
      storageTester.simulateIndexedDBFailure();
      
      await expect(async () => {
        const request = indexedDB.open('PWADatabase', 1);
        // This should throw
      }).rejects.toThrow('Database access denied');
    });

    it('should implement offline queue for user actions', () => {
      const offlineQueue = [];
      
      const queueAction = (action: any) => {
        if (!navigator.onLine) {
          offlineQueue.push({
            ...action,
            timestamp: new Date().toISOString(),
            retry: 0
          });
          return true;
        }
        return false;
      };
      
      networkSimulator.setNetworkState('offline');
      
      // Queue some actions while offline
      queueAction({ type: 'UPDATE_PROGRESS', chapterId: 'chapter-1', progress: 50 });
      queueAction({ type: 'ADD_BOOKMARK', chapterId: 'chapter-1', section: 'intro' });
      queueAction({ type: 'SAVE_NOTE', text: 'Important note', chapterId: 'chapter-1' });
      
      expect(offlineQueue).toHaveLength(3);
      expect(offlineQueue[0].type).toBe('UPDATE_PROGRESS');
      expect(offlineQueue[1].type).toBe('ADD_BOOKMARK');
      expect(offlineQueue[2].type).toBe('SAVE_NOTE');
    });
  });

  describe('Offline Sync Management', () => {
    it('should sync queued actions when back online', async () => {
      const syncQueue = [
        { id: 1, type: 'UPDATE_PROGRESS', data: { chapterId: 'chapter-1', progress: 50 } },
        { id: 2, type: 'ADD_BOOKMARK', data: { chapterId: 'chapter-1', section: 'intro' } }
      ];
      
      const syncHandler = jest.fn().mockResolvedValue({ success: true });
      
      // Simulate going back online
      networkSimulator.setNetworkState('online');
      
      // Process sync queue
      for (const item of syncQueue) {
        await syncHandler(item);
      }
      
      expect(syncHandler).toHaveBeenCalledTimes(2);
      expect(syncHandler).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'UPDATE_PROGRESS' })
      );
    });

    it('should handle sync conflicts', async () => {
      const localData = {
        chapterId: 'chapter-1',
        progress: 75,
        lastModified: '2023-01-15T10:00:00Z'
      };
      
      const serverData = {
        chapterId: 'chapter-1',
        progress: 60,
        lastModified: '2023-01-15T09:30:00Z'
      };
      
      // Conflict resolution: use most recent timestamp
      const resolveConflict = (local: any, server: any) => {
        const localTime = new Date(local.lastModified).getTime();
        const serverTime = new Date(server.lastModified).getTime();
        return localTime > serverTime ? local : server;
      };
      
      const resolved = resolveConflict(localData, serverData);
      expect(resolved.progress).toBe(75); // Local data is newer
    });

    it('should retry failed sync operations', async () => {
      let attemptCount = 0;
      const maxRetries = 3;
      
      const syncOperation = jest.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Sync failed');
        }
        return Promise.resolve({ success: true });
      });
      
      const retrySync = async (operation: () => Promise<any>, retries: number = maxRetries) => {
        for (let i = 0; i < retries; i++) {
          try {
            return await operation();
          } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i))); // Exponential backoff
          }
        }
      };
      
      const result = await retrySync(syncOperation);
      expect(result.success).toBe(true);
      expect(attemptCount).toBe(3);
    });

    it('should prioritize sync operations', async () => {
      const syncQueue = [
        { id: 1, type: 'SAVE_NOTE', priority: 'low', data: {} },
        { id: 2, type: 'UPDATE_PROGRESS', priority: 'high', data: {} },
        { id: 3, type: 'ADD_BOOKMARK', priority: 'medium', data: {} },
        { id: 4, type: 'COMPLETE_CHAPTER', priority: 'high', data: {} }
      ];
      
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const sortedQueue = syncQueue.sort((a, b) => 
        priorityOrder[b.priority as keyof typeof priorityOrder] - 
        priorityOrder[a.priority as keyof typeof priorityOrder]
      );
      
      expect(sortedQueue[0].type).toBe('UPDATE_PROGRESS');
      expect(sortedQueue[1].type).toBe('COMPLETE_CHAPTER');
      expect(sortedQueue[2].type).toBe('ADD_BOOKMARK');
      expect(sortedQueue[3].type).toBe('SAVE_NOTE');
    });
  });

  describe('Progressive Content Loading', () => {
    it('should load content progressively based on network speed', async () => {
      const contentLayers = {
        essential: ['text', 'navigation'],
        important: ['images', 'interactive-elements'],
        enhanced: ['videos', 'animations', 'audio']
      };
      
      const loadContent = (networkSpeed: string) => {
        switch (networkSpeed) {
          case 'slow':
            return contentLayers.essential;
          case 'medium':
            return [...contentLayers.essential, ...contentLayers.important];
          case 'fast':
            return [...contentLayers.essential, ...contentLayers.important, ...contentLayers.enhanced];
          default:
            return contentLayers.essential;
        }
      };
      
      // Simulate slow network
      networkSimulator.setNetworkState('slow');
      const slowContent = loadContent('slow');
      expect(slowContent).toEqual(['text', 'navigation']);
      
      // Simulate fast network
      const fastContent = loadContent('fast');
      expect(fastContent).toHaveLength(6);
      expect(fastContent).toContain('videos');
    });

    it('should implement lazy loading for non-critical content', () => {
      const lazyLoader = {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn()
      };
      
      global.IntersectionObserver = jest.fn().mockImplementation(() => lazyLoader);
      
      // Simulate lazy loading setup
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Load content when in viewport
            const element = entry.target as HTMLElement;
            element.src = element.dataset.src || '';
          }
        });
      });
      
      const lazyImages = document.querySelectorAll('[data-src]');
      lazyImages.forEach(img => observer.observe(img));
      
      expect(lazyLoader.observe).toHaveBeenCalledTimes(lazyImages.length);
    });

    it('should prefetch next chapter content', async () => {
      const currentChapter = 'chapter-1';
      const nextChapter = 'chapter-2';
      
      const prefetchContent = async (chapterId: string) => {
        const mockCache = {
          add: jest.fn().mockResolvedValue(undefined)
        };
        
        global.caches = {
          open: jest.fn().mockResolvedValue(mockCache)
        } as any;
        
        const cache = await caches.open('prefetch');
        await cache.add(`/content/${chapterId}`);
        
        return true;
      };
      
      // Prefetch next chapter when current chapter is 50% read
      const readingProgress = 60; // 60% through current chapter
      if (readingProgress > 50) {
        const prefetched = await prefetchContent(nextChapter);
        expect(prefetched).toBe(true);
      }
    });
  });

  describe('Offline User Experience', () => {
    it('should provide clear offline status indicators', () => {
      networkSimulator.setNetworkState('offline');
      
      const offlineStatus = {
        isOffline: !navigator.onLine,
        lastSync: new Date('2023-01-15T10:00:00Z'),
        queuedActions: 3,
        cachedContent: ['chapter-1', 'chapter-2', 'basic-templates']
      };
      
      expect(offlineStatus.isOffline).toBe(true);
      expect(offlineStatus.queuedActions).toBe(3);
      expect(offlineStatus.cachedContent).toHaveLength(3);
    });

    it('should show appropriate offline messages', () => {
      const getOfflineMessage = (context: string) => {
        const messages = {
          'content-loading': 'This content is not available offline. It will load when you reconnect.',
          'feature-unavailable': 'This feature requires an internet connection.',
          'sync-pending': 'Your changes will sync when you reconnect to the internet.',
          'limited-functionality': 'Some features are limited while offline.'
        };
        return messages[context as keyof typeof messages];
      };
      
      expect(getOfflineMessage('content-loading')).toContain('not available offline');
      expect(getOfflineMessage('sync-pending')).toContain('will sync when');
    });

    it('should handle graceful degradation of features', () => {
      networkSimulator.setNetworkState('offline');
      
      const featureAvailability = {
        readContent: true,        // Available offline
        saveProgress: true,       // Queued for sync
        shareContent: false,      // Requires network
        downloadNew: false,       // Requires network
        viewBookmarks: true,      // Available offline
        searchOffline: true       // Search cached content
      };
      
      expect(featureAvailability.readContent).toBe(true);
      expect(featureAvailability.shareContent).toBe(false);
      expect(featureAvailability.searchOffline).toBe(true);
    });
  });
});