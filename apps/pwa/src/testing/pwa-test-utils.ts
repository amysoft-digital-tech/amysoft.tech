/**
 * PWA Testing Utilities
 * Comprehensive testing helpers for PWA functionality, service workers, and offline capabilities
 */

// Service Worker Test Utilities
export class ServiceWorkerTestUtils {
  private mockServiceWorker: any;
  private originalServiceWorker: any;

  constructor() {
    this.setupServiceWorkerMock();
  }

  private setupServiceWorkerMock(): void {
    this.originalServiceWorker = (global as any).navigator?.serviceWorker;
    
    this.mockServiceWorker = {
      register: jest.fn().mockResolvedValue({
        installing: null,
        waiting: null,
        active: {
          state: 'activated',
          postMessage: jest.fn()
        },
        addEventListener: jest.fn(),
        update: jest.fn().mockResolvedValue(undefined),
        unregister: jest.fn().mockResolvedValue(true)
      }),
      ready: Promise.resolve({
        installing: null,
        waiting: null,
        active: {
          state: 'activated',
          postMessage: jest.fn()
        },
        pushManager: {
          subscribe: jest.fn(),
          getSubscription: jest.fn()
        }
      }),
      controller: {
        state: 'activated',
        postMessage: jest.fn()
      },
      addEventListener: jest.fn(),
      getRegistration: jest.fn(),
      getRegistrations: jest.fn().mockResolvedValue([])
    };

    Object.defineProperty(global.navigator, 'serviceWorker', {
      value: this.mockServiceWorker,
      writable: true
    });
  }

  mockServiceWorkerRegistration(options: {
    state?: 'installing' | 'waiting' | 'active';
    updateFound?: boolean;
    controllerChanged?: boolean;
  } = {}): void {
    const registration = {
      installing: options.state === 'installing' ? { state: 'installing' } : null,
      waiting: options.state === 'waiting' ? { state: 'waiting' } : null,
      active: options.state === 'active' ? { state: 'activated' } : null,
      addEventListener: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
      unregister: jest.fn().mockResolvedValue(true)
    };

    this.mockServiceWorker.register.mockResolvedValue(registration);

    if (options.updateFound) {
      setTimeout(() => {
        const event = new Event('updatefound');
        registration.addEventListener.mock.calls
          .filter(call => call[0] === 'updatefound')
          .forEach(call => call[1](event));
      }, 100);
    }

    if (options.controllerChanged) {
      setTimeout(() => {
        const event = new Event('controllerchange');
        this.mockServiceWorker.addEventListener.mock.calls
          .filter(call => call[0] === 'controllerchange')
          .forEach(call => call[1](event));
      }, 100);
    }
  }

  simulateServiceWorkerMessage(data: any): void {
    const event = new MessageEvent('message', { data });
    this.mockServiceWorker.addEventListener.mock.calls
      .filter(call => call[0] === 'message')
      .forEach(call => call[1](event));
  }

  reset(): void {
    jest.clearAllMocks();
    this.setupServiceWorkerMock();
  }

  restore(): void {
    if (this.originalServiceWorker) {
      Object.defineProperty(global.navigator, 'serviceWorker', {
        value: this.originalServiceWorker,
        writable: true
      });
    }
  }
}

// Network Simulation Utilities
export class NetworkSimulator {
  private originalFetch: any;
  private networkState: 'online' | 'offline' | 'slow' | 'unstable' = 'online';
  private requestInterceptors: Array<(request: Request) => Promise<Response> | Response | null> = [];

  constructor() {
    this.originalFetch = global.fetch;
    this.setupNetworkMock();
  }

  private setupNetworkMock(): void {
    global.fetch = jest.fn().mockImplementation(this.mockFetch.bind(this));
    
    Object.defineProperty(global.navigator, 'onLine', {
      get: () => this.networkState !== 'offline',
      configurable: true
    });
  }

  private async mockFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const request = new Request(input, init);

    // Check interceptors first
    for (const interceptor of this.requestInterceptors) {
      const response = await interceptor(request);
      if (response) return response;
    }

    switch (this.networkState) {
      case 'offline':
        throw new TypeError('Network request failed');
      
      case 'slow':
        await this.delay(2000 + Math.random() * 3000); // 2-5 second delay
        break;
      
      case 'unstable':
        if (Math.random() < 0.3) { // 30% chance of failure
          throw new TypeError('Network request failed');
        }
        await this.delay(500 + Math.random() * 2000); // 0.5-2.5 second delay
        break;
    }

    return this.originalFetch(input, init);
  }

  setNetworkState(state: 'online' | 'offline' | 'slow' | 'unstable'): void {
    this.networkState = state;
    
    // Dispatch online/offline events
    if (state === 'offline') {
      window.dispatchEvent(new Event('offline'));
    } else if (this.networkState === 'offline') {
      window.dispatchEvent(new Event('online'));
    }
  }

  addRequestInterceptor(interceptor: (request: Request) => Promise<Response> | Response | null): void {
    this.requestInterceptors.push(interceptor);
  }

  clearInterceptors(): void {
    this.requestInterceptors = [];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  restore(): void {
    global.fetch = this.originalFetch;
    this.clearInterceptors();
  }
}

// PWA Installation Testing
export class PWAInstallationTester {
  private beforeInstallPromptEvent: any;

  constructor() {
    this.setupInstallationMocks();
  }

  private setupInstallationMocks(): void {
    this.beforeInstallPromptEvent = {
      prompt: jest.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
      preventDefault: jest.fn()
    };
  }

  simulateInstallPrompt(): void {
    window.dispatchEvent(
      Object.assign(new Event('beforeinstallprompt'), this.beforeInstallPromptEvent)
    );
  }

  simulateInstallChoice(outcome: 'accepted' | 'dismissed'): void {
    this.beforeInstallPromptEvent.userChoice = Promise.resolve({
      outcome,
      platform: 'web'
    });
  }

  simulateAppInstalled(): void {
    window.dispatchEvent(new Event('appinstalled'));
  }

  getPromptEvent(): any {
    return this.beforeInstallPromptEvent;
  }
}

// Offline Storage Testing
export class OfflineStorageTester {
  private originalIndexedDB: any;
  private originalLocalStorage: any;
  private originalSessionStorage: any;
  private indexedDBMock: any;

  constructor() {
    this.setupStorageMocks();
  }

  private setupStorageMocks(): void {
    // Mock IndexedDB
    this.originalIndexedDB = global.indexedDB;
    this.indexedDBMock = {
      open: jest.fn().mockImplementation(() => ({
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
        onerror: null,
        onsuccess: null
      })),
      deleteDatabase: jest.fn()
    };
    global.indexedDB = this.indexedDBMock;

    // Mock localStorage/sessionStorage quota
    this.setupStorageQuotaMocks();
  }

  private setupStorageQuotaMocks(): void {
    const createStorageMock = (originalStorage: Storage) => ({
      ...originalStorage,
      setItem: jest.fn().mockImplementation((key: string, value: string) => {
        if (value.length > 5000000) { // 5MB limit simulation
          throw new DOMException('QuotaExceededError');
        }
        originalStorage.setItem(key, value);
      }),
      getItem: jest.fn().mockImplementation((key: string) => originalStorage.getItem(key)),
      removeItem: jest.fn().mockImplementation((key: string) => originalStorage.removeItem(key)),
      clear: jest.fn().mockImplementation(() => originalStorage.clear())
    });

    Object.defineProperty(global, 'localStorage', {
      value: createStorageMock(global.localStorage),
      writable: true
    });

    Object.defineProperty(global, 'sessionStorage', {
      value: createStorageMock(global.sessionStorage),
      writable: true
    });
  }

  simulateStorageQuotaExceeded(): void {
    const mockSetItem = jest.fn().mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });
    
    Object.defineProperty(global.localStorage, 'setItem', { value: mockSetItem });
    Object.defineProperty(global.sessionStorage, 'setItem', { value: mockSetItem });
  }

  simulateIndexedDBFailure(): void {
    this.indexedDBMock.open.mockImplementation(() => {
      throw new DOMException('Database access denied');
    });
  }

  restore(): void {
    if (this.originalIndexedDB) {
      global.indexedDB = this.originalIndexedDB;
    }
  }
}

// Push Notification Testing
export class PushNotificationTester {
  private originalNotification: any;
  private originalPushManager: any;
  private notificationMock: any;

  constructor() {
    this.setupNotificationMocks();
  }

  private setupNotificationMocks(): void {
    this.originalNotification = global.Notification;
    
    this.notificationMock = jest.fn().mockImplementation((title: string, options?: NotificationOptions) => ({
      title,
      body: options?.body,
      icon: options?.icon,
      tag: options?.tag,
      close: jest.fn(),
      addEventListener: jest.fn(),
      onclick: null,
      onclose: null,
      onerror: null,
      onshow: null
    }));

    this.notificationMock.permission = 'default';
    this.notificationMock.requestPermission = jest.fn().mockResolvedValue('granted');

    global.Notification = this.notificationMock;

    // Mock PushManager
    this.originalPushManager = global.PushManager;
    global.PushManager = jest.fn();
  }

  setNotificationPermission(permission: 'granted' | 'denied' | 'default'): void {
    this.notificationMock.permission = permission;
  }

  simulateNotificationClick(notification: any): void {
    if (notification.onclick) {
      notification.onclick(new Event('click'));
    }
  }

  simulateNotificationClose(notification: any): void {
    if (notification.onclose) {
      notification.onclose(new Event('close'));
    }
  }

  simulatePushEvent(data: any): void {
    const event = new MessageEvent('push', { data });
    // This would typically be handled by the service worker
    self.dispatchEvent(event);
  }

  restore(): void {
    if (this.originalNotification) {
      global.Notification = this.originalNotification;
    }
    if (this.originalPushManager) {
      global.PushManager = this.originalPushManager;
    }
  }
}

// Performance Testing Utilities
export class PerformanceTester {
  private performanceEntries: PerformanceEntry[] = [];
  private originalPerformance: any;

  constructor() {
    this.setupPerformanceMocks();
  }

  private setupPerformanceMocks(): void {
    this.originalPerformance = global.performance;
    
    const mockPerformance = {
      ...global.performance,
      mark: jest.fn().mockImplementation((name: string) => {
        const entry = {
          name,
          entryType: 'mark',
          startTime: performance.now(),
          duration: 0
        } as PerformanceEntry;
        this.performanceEntries.push(entry);
        return entry;
      }),
      measure: jest.fn().mockImplementation((name: string, startMark?: string, endMark?: string) => {
        const startTime = startMark ? 
          this.performanceEntries.find(e => e.name === startMark)?.startTime || 0 : 0;
        const endTime = endMark ? 
          this.performanceEntries.find(e => e.name === endMark)?.startTime || performance.now() : performance.now();
        
        const entry = {
          name,
          entryType: 'measure',
          startTime,
          duration: endTime - startTime
        } as PerformanceEntry;
        this.performanceEntries.push(entry);
        return entry;
      }),
      getEntriesByName: jest.fn().mockImplementation((name: string) => 
        this.performanceEntries.filter(e => e.name === name)
      ),
      getEntriesByType: jest.fn().mockImplementation((type: string) => 
        this.performanceEntries.filter(e => e.entryType === type)
      ),
      clearMarks: jest.fn().mockImplementation((name?: string) => {
        if (name) {
          this.performanceEntries = this.performanceEntries.filter(e => 
            !(e.entryType === 'mark' && e.name === name)
          );
        } else {
          this.performanceEntries = this.performanceEntries.filter(e => e.entryType !== 'mark');
        }
      }),
      clearMeasures: jest.fn().mockImplementation((name?: string) => {
        if (name) {
          this.performanceEntries = this.performanceEntries.filter(e => 
            !(e.entryType === 'measure' && e.name === name)
          );
        } else {
          this.performanceEntries = this.performanceEntries.filter(e => e.entryType !== 'measure');
        }
      })
    };

    global.performance = mockPerformance;
  }

  simulateSlowPerformance(delay: number = 1000): void {
    const originalNow = performance.now;
    let currentTime = 0;
    
    jest.spyOn(performance, 'now').mockImplementation(() => {
      currentTime += delay;
      return currentTime;
    });
  }

  getPerformanceEntries(): PerformanceEntry[] {
    return [...this.performanceEntries];
  }

  reset(): void {
    this.performanceEntries = [];
    jest.clearAllMocks();
  }

  restore(): void {
    if (this.originalPerformance) {
      global.performance = this.originalPerformance;
    }
  }
}

// Device Simulation Utilities
export class DeviceSimulator {
  private originalUserAgent: string;
  private originalScreen: Screen;
  private originalViewport: { width: number; height: number };

  constructor() {
    this.originalUserAgent = navigator.userAgent;
    this.originalScreen = window.screen;
    this.originalViewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
  }

  simulateMobileDevice(device: 'iphone' | 'android' | 'tablet' = 'iphone'): void {
    const devices = {
      iphone: {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
        screen: { width: 375, height: 812, availWidth: 375, availHeight: 812 },
        viewport: { width: 375, height: 667 }
      },
      android: {
        userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
        screen: { width: 360, height: 800, availWidth: 360, availHeight: 800 },
        viewport: { width: 360, height: 640 }
      },
      tablet: {
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
        screen: { width: 768, height: 1024, availWidth: 768, availHeight: 1024 },
        viewport: { width: 768, height: 1024 }
      }
    };

    const deviceConfig = devices[device];

    // Mock user agent
    Object.defineProperty(navigator, 'userAgent', {
      value: deviceConfig.userAgent,
      configurable: true
    });

    // Mock screen properties
    Object.defineProperties(window.screen, {
      width: { value: deviceConfig.screen.width, configurable: true },
      height: { value: deviceConfig.screen.height, configurable: true },
      availWidth: { value: deviceConfig.screen.availWidth, configurable: true },
      availHeight: { value: deviceConfig.screen.availHeight, configurable: true }
    });

    // Mock viewport
    Object.defineProperties(window, {
      innerWidth: { value: deviceConfig.viewport.width, configurable: true },
      innerHeight: { value: deviceConfig.viewport.height, configurable: true }
    });
  }

  simulateTouchEvents(): void {
    const touchEventInit = {
      bubbles: true,
      cancelable: true,
      touches: [],
      targetTouches: [],
      changedTouches: []
    };

    // Add touch event constructors if not present
    if (!global.TouchEvent) {
      global.TouchEvent = class extends Event {
        touches: TouchList;
        targetTouches: TouchList;
        changedTouches: TouchList;

        constructor(type: string, eventInitDict?: TouchEventInit) {
          super(type, eventInitDict);
          this.touches = (eventInitDict?.touches || []) as any;
          this.targetTouches = (eventInitDict?.targetTouches || []) as any;
          this.changedTouches = (eventInitDict?.changedTouches || []) as any;
        }
      };
    }
  }

  simulateBatteryAPI(level: number = 0.5, charging: boolean = true): void {
    const batteryMock = {
      level,
      charging,
      chargingTime: charging ? 3600 : Infinity,
      dischargingTime: charging ? Infinity : 7200,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };

    Object.defineProperty(navigator, 'getBattery', {
      value: jest.fn().mockResolvedValue(batteryMock),
      configurable: true
    });
  }

  restore(): void {
    Object.defineProperty(navigator, 'userAgent', {
      value: this.originalUserAgent,
      configurable: true
    });

    Object.defineProperties(window, {
      innerWidth: { value: this.originalViewport.width, configurable: true },
      innerHeight: { value: this.originalViewport.height, configurable: true }
    });
  }
}

// Comprehensive PWA Test Suite Manager
export class PWATestSuite {
  public serviceWorker: ServiceWorkerTestUtils;
  public network: NetworkSimulator;
  public installation: PWAInstallationTester;
  public storage: OfflineStorageTester;
  public notifications: PushNotificationTester;
  public performance: PerformanceTester;
  public device: DeviceSimulator;

  constructor() {
    this.serviceWorker = new ServiceWorkerTestUtils();
    this.network = new NetworkSimulator();
    this.installation = new PWAInstallationTester();
    this.storage = new OfflineStorageTester();
    this.notifications = new PushNotificationTester();
    this.performance = new PerformanceTester();
    this.device = new DeviceSimulator();
  }

  async runOfflineScenario(): Promise<void> {
    this.network.setNetworkState('offline');
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  async runSlowNetworkScenario(): Promise<void> {
    this.network.setNetworkState('slow');
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  async runInstallationFlow(): Promise<void> {
    this.installation.simulateInstallPrompt();
    this.installation.simulateInstallChoice('accepted');
    this.installation.simulateAppInstalled();
  }

  reset(): void {
    this.serviceWorker.reset();
    this.network.setNetworkState('online');
    this.network.clearInterceptors();
    this.performance.reset();
  }

  cleanup(): void {
    this.serviceWorker.restore();
    this.network.restore();
    this.storage.restore();
    this.notifications.restore();
    this.performance.restore();
    this.device.restore();
  }
}

// Export default instance for convenience
export const pwaTestSuite = new PWATestSuite();