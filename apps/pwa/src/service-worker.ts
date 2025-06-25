// Production Service Worker for Beyond the AI Plateau PWA
// Advanced caching strategies, offline functionality, and performance optimization

/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

// Cache Configuration
const CACHE_CONFIG = {
  APP_SHELL: 'amysoft-app-shell-v1.2.0',
  CONTENT: 'amysoft-content-v1.2.0',
  IMAGES: 'amysoft-images-v1.2.0',
  API: 'amysoft-api-v1.2.0',
  FONTS: 'amysoft-fonts-v1.2.0',
  TEMPLATES: 'amysoft-templates-v1.2.0'
};

// Cache Strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
};

// Resource Patterns
const RESOURCE_PATTERNS = {
  APP_SHELL: [
    '/',
    '/index.html',
    '/manifest.json',
    '/assets/icons/',
    '/assets/css/main.css',
    '/assets/js/main.js'
  ],
  CONTENT: [
    '/api/content/chapters/',
    '/api/content/principles/',
    '/content/',
    '/chapters/'
  ],
  IMAGES: [
    '/assets/images/',
    '/uploads/images/',
    '.jpg',
    '.jpeg',
    '.png',
    '.webp',
    '.svg'
  ],
  API_CACHE: [
    '/api/user/profile',
    '/api/user/progress',
    '/api/templates/',
    '/api/content/static'
  ],
  API_NETWORK: [
    '/api/auth/',
    '/api/payment/',
    '/api/analytics/',
    '/api/admin/'
  ],
  FONTS: [
    '/assets/fonts/',
    'fonts.googleapis.com',
    'fonts.gstatic.com'
  ]
};

// Performance Metrics
interface PerformanceMetrics {
  cacheHits: number;
  cacheMisses: number;
  networkRequests: number;
  offlineRequests: number;
  syncQueue: number;
}

let performanceMetrics: PerformanceMetrics = {
  cacheHits: 0,
  cacheMisses: 0,
  networkRequests: 0,
  offlineRequests: 0,
  syncQueue: 0
};

// Background Sync Queue
interface SyncItem {
  id: string;
  url: string;
  method: string;
  body?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
}

let syncQueue: SyncItem[] = [];

// Install Event - Cache App Shell and Critical Resources
self.addEventListener('install', (event: ExtendableEvent) => {
  console.log('[ServiceWorker] Installing...');
  
  event.waitUntil(
    Promise.all([
      cacheAppShell(),
      cacheCriticalContent(),
      cacheFonts(),
      cacheTemplates()
    ]).then(() => {
      console.log('[ServiceWorker] Installation complete');
      return self.skipWaiting();
    }).catch(error => {
      console.error('[ServiceWorker] Installation failed:', error);
    })
  );
});

// Activate Event - Clean Old Caches and Update
self.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('[ServiceWorker] Activating...');
  
  event.waitUntil(
    Promise.all([
      cleanOldCaches(),
      self.clients.claim(),
      setupBackgroundSync(),
      initializeAnalytics()
    ]).then(() => {
      console.log('[ServiceWorker] Activation complete');
    }).catch(error => {
      console.error('[ServiceWorker] Activation failed:', error);
    })
  );
});

// Fetch Event - Route Requests with Appropriate Strategies
self.addEventListener('fetch', (event: FetchEvent) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip non-GET requests for caching
  if (request.method !== 'GET') {
    return handleNonGetRequest(event);
  }
  
  // Determine caching strategy based on resource type
  const strategy = determineCachingStrategy(url, request);
  
  event.respondWith(
    executeStrategy(request, strategy)
      .then(response => {
        updatePerformanceMetrics(strategy, response);
        return response;
      })
      .catch(error => {
        console.error('[ServiceWorker] Fetch failed:', error);
        return handleFetchError(request, error);
      })
  );
});

// Background Sync Event - Handle Offline Queue
self.addEventListener('sync', (event: any) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(processSyncQueue());
  }
});

// Push Event - Handle Push Notifications
self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;
  
  const data = event.data.json();
  
  const options: NotificationOptions = {
    body: data.body,
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/badge-72x72.png',
    data: data.data,
    actions: data.actions || [],
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
    vibrate: data.vibrate || [100, 50, 100]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification Click Event
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data;
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      // Focus existing client or open new window
      if (clients.length > 0) {
        return clients[0].focus();
      } else {
        return self.clients.openWindow(data.url || '/');
      }
    })
  );
});

// Message Event - Handle Client Messages
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'GET_METRICS':
      event.ports[0].postMessage(performanceMetrics);
      break;
    case 'CACHE_CONTENT':
      event.waitUntil(cacheSpecificContent(data.urls));
      break;
    case 'CLEAR_CACHE':
      event.waitUntil(clearSpecificCache(data.cacheName));
      break;
    case 'SYNC_DATA':
      event.waitUntil(addToSyncQueue(data));
      break;
    default:
      console.warn('[ServiceWorker] Unknown message type:', type);
  }
});

// Cache App Shell Resources
async function cacheAppShell(): Promise<void> {
  const cache = await caches.open(CACHE_CONFIG.APP_SHELL);
  
  const shellResources = [
    '/',
    '/index.html',
    '/manifest.json',
    '/assets/css/main.css',
    '/assets/js/main.js',
    '/assets/js/ionic.js',
    '/assets/icons/icon-192x192.png',
    '/assets/icons/icon-512x512.png'
  ];
  
  return cache.addAll(shellResources);
}

// Cache Critical Content
async function cacheCriticalContent(): Promise<void> {
  const cache = await caches.open(CACHE_CONFIG.CONTENT);
  
  try {
    // Cache principle overview and first chapter
    const criticalContent = [
      '/api/content/principles/overview',
      '/api/content/chapters/principle-1-introduction',
      '/api/templates/categories',
      '/api/user/progress'
    ];
    
    await Promise.allSettled(
      criticalContent.map(async url => {
        try {
          const response = await fetch(url);
          if (response.ok) {
            await cache.put(url, response);
          }
        } catch (error) {
          console.warn(`[ServiceWorker] Failed to cache ${url}:`, error);
        }
      })
    );
  } catch (error) {
    console.error('[ServiceWorker] Critical content caching failed:', error);
  }
}

// Cache Fonts
async function cacheFonts(): Promise<void> {
  const cache = await caches.open(CACHE_CONFIG.FONTS);
  
  const fontUrls = [
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
    'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap'
  ];
  
  await Promise.allSettled(
    fontUrls.map(async url => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
        }
      } catch (error) {
        console.warn(`[ServiceWorker] Failed to cache font ${url}:`, error);
      }
    })
  );
}

// Cache Templates
async function cacheTemplates(): Promise<void> {
  const cache = await caches.open(CACHE_CONFIG.TEMPLATES);
  
  try {
    const templatesResponse = await fetch('/api/templates/popular');
    if (templatesResponse.ok) {
      await cache.put('/api/templates/popular', templatesResponse.clone());
      
      const templates = await templatesResponse.json();
      await Promise.allSettled(
        templates.slice(0, 20).map(async (template: any) => {
          try {
            const response = await fetch(`/api/templates/${template.id}`);
            if (response.ok) {
              await cache.put(`/api/templates/${template.id}`, response);
            }
          } catch (error) {
            console.warn(`[ServiceWorker] Failed to cache template ${template.id}:`, error);
          }
        })
      );
    }
  } catch (error) {
    console.error('[ServiceWorker] Template caching failed:', error);
  }
}

// Determine Caching Strategy
function determineCachingStrategy(url: URL, request: Request): string {
  const { pathname, hostname } = url;
  
  // App Shell - Cache First
  if (isAppShell(pathname)) {
    return CACHE_STRATEGIES.CACHE_FIRST;
  }
  
  // Static Content - Stale While Revalidate
  if (isStaticContent(pathname)) {
    return CACHE_STRATEGIES.STALE_WHILE_REVALIDATE;
  }
  
  // User-specific API - Network First
  if (isUserSpecificAPI(pathname)) {
    return CACHE_STRATEGIES.NETWORK_FIRST;
  }
  
  // Authentication/Payment - Network Only
  if (isCriticalAPI(pathname)) {
    return CACHE_STRATEGIES.NETWORK_ONLY;
  }
  
  // Images - Cache First
  if (isImage(pathname)) {
    return CACHE_STRATEGIES.CACHE_FIRST;
  }
  
  // Templates and Static API - Stale While Revalidate
  if (isTemplateAPI(pathname) || isStaticAPI(pathname)) {
    return CACHE_STRATEGIES.STALE_WHILE_REVALIDATE;
  }
  
  // Default - Network First
  return CACHE_STRATEGIES.NETWORK_FIRST;
}

// Execute Caching Strategy
async function executeStrategy(request: Request, strategy: string): Promise<Response> {
  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return cacheFirst(request);
    case CACHE_STRATEGIES.NETWORK_FIRST:
      return networkFirst(request);
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return staleWhileRevalidate(request);
    case CACHE_STRATEGIES.NETWORK_ONLY:
      return networkOnly(request);
    case CACHE_STRATEGIES.CACHE_ONLY:
      return cacheOnly(request);
    default:
      return networkFirst(request);
  }
}

// Cache First Strategy
async function cacheFirst(request: Request): Promise<Response> {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    performanceMetrics.cacheHits++;
    return cachedResponse;
  }
  
  performanceMetrics.cacheMisses++;
  
  try {
    const networkResponse = await fetch(request);
    performanceMetrics.networkRequests++;
    
    if (networkResponse.ok) {
      const cache = await getAppropriateCache(request.url);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    performanceMetrics.offlineRequests++;
    return createOfflineResponse(request);
  }
}

// Network First Strategy
async function networkFirst(request: Request): Promise<Response> {
  try {
    const networkResponse = await fetch(request);
    performanceMetrics.networkRequests++;
    
    if (networkResponse.ok) {
      const cache = await getAppropriateCache(request.url);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    performanceMetrics.offlineRequests++;
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      performanceMetrics.cacheHits++;
      return cachedResponse;
    }
    
    performanceMetrics.cacheMisses++;
    return createOfflineResponse(request);
  }
}

// Stale While Revalidate Strategy
async function staleWhileRevalidate(request: Request): Promise<Response> {
  const cachedResponse = await caches.match(request);
  
  // Start network request for update
  const networkUpdate = fetch(request).then(async networkResponse => {
    if (networkResponse.ok) {
      const cache = await getAppropriateCache(request.url);
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(error => {
    console.warn('[ServiceWorker] Network update failed:', error);
  });
  
  if (cachedResponse) {
    performanceMetrics.cacheHits++;
    // Return cached version immediately, update in background
    networkUpdate;
    return cachedResponse;
  }
  
  performanceMetrics.cacheMisses++;
  
  try {
    const networkResponse = await networkUpdate;
    performanceMetrics.networkRequests++;
    return networkResponse;
  } catch (error) {
    performanceMetrics.offlineRequests++;
    return createOfflineResponse(request);
  }
}

// Network Only Strategy
async function networkOnly(request: Request): Promise<Response> {
  performanceMetrics.networkRequests++;
  return fetch(request);
}

// Cache Only Strategy
async function cacheOnly(request: Request): Promise<Response> {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    performanceMetrics.cacheHits++;
    return cachedResponse;
  }
  
  performanceMetrics.cacheMisses++;
  return createOfflineResponse(request);
}

// Get Appropriate Cache
async function getAppropriateCache(url: string): Promise<Cache> {
  if (isImage(url)) {
    return caches.open(CACHE_CONFIG.IMAGES);
  } else if (isTemplateAPI(url)) {
    return caches.open(CACHE_CONFIG.TEMPLATES);
  } else if (url.includes('/api/')) {
    return caches.open(CACHE_CONFIG.API);
  } else if (url.includes('fonts')) {
    return caches.open(CACHE_CONFIG.FONTS);
  } else {
    return caches.open(CACHE_CONFIG.CONTENT);
  }
}

// Resource Type Checkers
function isAppShell(pathname: string): boolean {
  return RESOURCE_PATTERNS.APP_SHELL.some(pattern => pathname.includes(pattern)) ||
         pathname === '/' || pathname === '/index.html';
}

function isStaticContent(pathname: string): boolean {
  return pathname.includes('/assets/') || 
         pathname.includes('/content/') ||
         pathname.endsWith('.css') ||
         pathname.endsWith('.js') ||
         pathname.endsWith('.json');
}

function isUserSpecificAPI(pathname: string): boolean {
  return pathname.includes('/api/user/') ||
         pathname.includes('/api/progress/') ||
         pathname.includes('/api/bookmarks/');
}

function isCriticalAPI(pathname: string): boolean {
  return RESOURCE_PATTERNS.API_NETWORK.some(pattern => pathname.includes(pattern));
}

function isImage(pathname: string): boolean {
  return RESOURCE_PATTERNS.IMAGES.some(pattern => pathname.includes(pattern));
}

function isTemplateAPI(pathname: string): boolean {
  return pathname.includes('/api/templates/');
}

function isStaticAPI(pathname: string): boolean {
  return RESOURCE_PATTERNS.API_CACHE.some(pattern => pathname.includes(pattern));
}

// Handle Non-GET Requests
function handleNonGetRequest(event: FetchEvent): void {
  const request = event.request;
  
  // Handle offline POST/PUT/DELETE requests
  if (!navigator.onLine) {
    event.respondWith(
      addToSyncQueue({
        url: request.url,
        method: request.method,
        body: request.body,
        headers: Object.fromEntries(request.headers.entries())
      }).then(() => {
        return new Response(JSON.stringify({ queued: true }), {
          status: 202,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }
  
  // Forward online requests normally
  event.respondWith(fetch(request));
}

// Create Offline Response
function createOfflineResponse(request: Request): Response {
  const url = new URL(request.url);
  
  if (url.pathname.includes('/api/')) {
    return new Response(JSON.stringify({
      error: 'offline',
      message: 'This feature requires an internet connection'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Return offline page for navigation requests
  if (request.mode === 'navigate') {
    return caches.match('/offline.html').then(response => {
      return response || new Response('Offline', { status: 503 });
    });
  }
  
  return new Response('Offline', { status: 503 });
}

// Background Sync Queue Management
async function addToSyncQueue(data: Partial<SyncItem>): Promise<void> {
  const item: SyncItem = {
    id: generateId(),
    url: data.url || '',
    method: data.method || 'POST',
    body: data.body,
    headers: data.headers || {},
    timestamp: Date.now(),
    retryCount: 0
  };
  
  syncQueue.push(item);
  performanceMetrics.syncQueue = syncQueue.length;
  
  // Trigger background sync if available
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    try {
      await self.registration.sync.register('background-sync');
    } catch (error) {
      console.warn('[ServiceWorker] Background sync registration failed:', error);
    }
  }
}

async function processSyncQueue(): Promise<void> {
  const itemsToProcess = [...syncQueue];
  syncQueue = [];
  performanceMetrics.syncQueue = 0;
  
  for (const item of itemsToProcess) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        body: item.body,
        headers: item.headers
      });
      
      if (!response.ok && item.retryCount < 3) {
        item.retryCount++;
        syncQueue.push(item);
      }
    } catch (error) {
      if (item.retryCount < 3) {
        item.retryCount++;
        syncQueue.push(item);
      }
    }
  }
  
  performanceMetrics.syncQueue = syncQueue.length;
}

// Clean Old Caches
async function cleanOldCaches(): Promise<void> {
  const cacheNames = await caches.keys();
  const currentCaches = Object.values(CACHE_CONFIG);
  
  const deletePromises = cacheNames
    .filter(cacheName => !currentCaches.includes(cacheName))
    .map(cacheName => caches.delete(cacheName));
  
  await Promise.all(deletePromises);
}

// Setup Background Sync
async function setupBackgroundSync(): Promise<void> {
  // Initialize sync queue from persistent storage if available
  try {
    // Implementation for loading saved sync queue
  } catch (error) {
    console.warn('[ServiceWorker] Failed to load sync queue:', error);
  }
}

// Initialize Analytics
async function initializeAnalytics(): Promise<void> {
  // Send performance metrics to analytics endpoint
  setInterval(() => {
    if (navigator.onLine) {
      sendMetricsToAnalytics();
    }
  }, 300000); // Every 5 minutes
}

// Send Metrics to Analytics
async function sendMetricsToAnalytics(): Promise<void> {
  try {
    await fetch('/api/analytics/service-worker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metrics: performanceMetrics,
        timestamp: Date.now(),
        version: CACHE_CONFIG.APP_SHELL
      })
    });
  } catch (error) {
    console.warn('[ServiceWorker] Failed to send metrics:', error);
  }
}

// Update Performance Metrics
function updatePerformanceMetrics(strategy: string, response: Response): void {
  // Track cache effectiveness and performance
  if (response.headers.get('X-Cache-Status') === 'HIT') {
    performanceMetrics.cacheHits++;
  }
}

// Cache Specific Content
async function cacheSpecificContent(urls: string[]): Promise<void> {
  const cache = await caches.open(CACHE_CONFIG.CONTENT);
  
  await Promise.allSettled(
    urls.map(async url => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
        }
      } catch (error) {
        console.warn(`[ServiceWorker] Failed to cache ${url}:`, error);
      }
    })
  );
}

// Clear Specific Cache
async function clearSpecificCache(cacheName: string): Promise<void> {
  await caches.delete(cacheName);
}

// Generate Unique ID
function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Handle Fetch Error
function handleFetchError(request: Request, error: any): Response {
  console.error('[ServiceWorker] Fetch error:', error);
  return createOfflineResponse(request);
}

// Export for debugging
(self as any).swDebug = {
  metrics: () => performanceMetrics,
  queue: () => syncQueue,
  caches: () => caches.keys(),
  config: CACHE_CONFIG
};

console.log('[ServiceWorker] Loaded successfully');