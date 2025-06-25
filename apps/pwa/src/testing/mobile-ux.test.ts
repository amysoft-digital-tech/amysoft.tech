/**
 * Mobile User Experience Testing Suite
 * Tests for touch interactions, responsive design, accessibility, and mobile-specific features
 */

import { DeviceSimulator, PerformanceTester, pwaTestSuite } from './pwa-test-utils';

describe('Mobile User Experience', () => {
  let deviceSimulator: DeviceSimulator;
  let performanceTester: PerformanceTester;

  beforeEach(() => {
    deviceSimulator = new DeviceSimulator();
    performanceTester = new PerformanceTester();
  });

  afterEach(() => {
    deviceSimulator.restore();
    performanceTester.restore();
    pwaTestSuite.reset();
  });

  describe('Touch Interactions', () => {
    beforeEach(() => {
      deviceSimulator.simulateTouchEvents();
    });

    it('should handle tap gestures correctly', () => {
      const element = document.createElement('button');
      const tapHandler = jest.fn();
      element.addEventListener('click', tapHandler);

      // Simulate touch events
      const touchStart = new TouchEvent('touchstart', {
        bubbles: true,
        cancelable: true,
        touches: [{
          identifier: 0,
          target: element,
          clientX: 100,
          clientY: 100,
          pageX: 100,
          pageY: 100,
          screenX: 100,
          screenY: 100,
          radiusX: 10,
          radiusY: 10,
          rotationAngle: 0,
          force: 1
        }] as any
      });

      const touchEnd = new TouchEvent('touchend', {
        bubbles: true,
        cancelable: true,
        changedTouches: [{
          identifier: 0,
          target: element,
          clientX: 100,
          clientY: 100,
          pageX: 100,
          pageY: 100,
          screenX: 100,
          screenY: 100,
          radiusX: 10,
          radiusY: 10,
          rotationAngle: 0,
          force: 1
        }] as any
      });

      element.dispatchEvent(touchStart);
      element.dispatchEvent(touchEnd);
      element.click(); // Simulate the resulting click

      expect(tapHandler).toHaveBeenCalled();
    });

    it('should handle swipe gestures for navigation', () => {
      const swipeDetector = {
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 0,
        threshold: 50,
        
        onTouchStart: function(e: TouchEvent) {
          const touch = e.touches[0];
          this.startX = touch.clientX;
          this.startY = touch.clientY;
        },
        
        onTouchEnd: function(e: TouchEvent) {
          const touch = e.changedTouches[0];
          this.endX = touch.clientX;
          this.endY = touch.clientY;
          return this.detectSwipe();
        },
        
        detectSwipe: function() {
          const deltaX = this.endX - this.startX;
          const deltaY = this.endY - this.startY;
          
          if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > this.threshold) {
            return deltaX > 0 ? 'swipe-right' : 'swipe-left';
          } else if (Math.abs(deltaY) > this.threshold) {
            return deltaY > 0 ? 'swipe-down' : 'swipe-up';
          }
          return null;
        }
      };

      // Simulate left swipe
      swipeDetector.onTouchStart({
        touches: [{ clientX: 200, clientY: 100 }]
      } as any);
      
      const swipeResult = swipeDetector.onTouchEnd({
        changedTouches: [{ clientX: 100, clientY: 100 }]
      } as any);

      expect(swipeResult).toBe('swipe-left');
    });

    it('should handle long press gestures', (done) => {
      const element = document.createElement('div');
      const longPressHandler = jest.fn();
      let touchStartTime = 0;
      let longPressTimer: any;

      element.addEventListener('touchstart', (e) => {
        touchStartTime = Date.now();
        longPressTimer = setTimeout(() => {
          longPressHandler('long-press');
        }, 500); // 500ms threshold
      });

      element.addEventListener('touchend', () => {
        clearTimeout(longPressTimer);
        const touchDuration = Date.now() - touchStartTime;
        if (touchDuration < 500) {
          longPressHandler('tap');
        }
      });

      // Simulate short tap
      element.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
      setTimeout(() => {
        element.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
        expect(longPressHandler).toHaveBeenCalledWith('tap');
        
        // Simulate long press
        element.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
        setTimeout(() => {
          expect(longPressHandler).toHaveBeenCalledWith('long-press');
          done();
        }, 600);
      }, 100);
    });

    it('should handle pinch-to-zoom gestures', () => {
      const pinchDetector = {
        initialDistance: 0,
        currentDistance: 0,
        scale: 1,
        
        getDistance: function(touch1: Touch, touch2: Touch) {
          const dx = touch1.clientX - touch2.clientX;
          const dy = touch1.clientY - touch2.clientY;
          return Math.sqrt(dx * dx + dy * dy);
        },
        
        onTouchStart: function(e: TouchEvent) {
          if (e.touches.length === 2) {
            this.initialDistance = this.getDistance(e.touches[0], e.touches[1]);
          }
        },
        
        onTouchMove: function(e: TouchEvent) {
          if (e.touches.length === 2) {
            this.currentDistance = this.getDistance(e.touches[0], e.touches[1]);
            this.scale = this.currentDistance / this.initialDistance;
            return this.scale;
          }
          return 1;
        }
      };

      // Simulate pinch start
      pinchDetector.onTouchStart({
        touches: [
          { clientX: 100, clientY: 100 } as Touch,
          { clientX: 200, clientY: 100 } as Touch
        ]
      } as any);

      // Simulate pinch zoom out
      const scale = pinchDetector.onTouchMove({
        touches: [
          { clientX: 120, clientY: 100 } as Touch,
          { clientX: 180, clientY: 100 } as Touch
        ]
      } as any);

      expect(scale).toBeLessThan(1); // Zoom out
      expect(scale).toBeCloseTo(0.6, 1);
    });

    it('should prevent default behavior for custom gestures', () => {
      const element = document.createElement('div');
      const preventDefaultSpy = jest.fn();
      
      element.addEventListener('touchmove', (e) => {
        // Prevent scrolling when handling custom gestures
        if (e.touches.length > 1) {
          e.preventDefault();
          preventDefaultSpy();
        }
      });

      const touchMoveEvent = new TouchEvent('touchmove', {
        bubbles: true,
        cancelable: true,
        touches: [
          { clientX: 100, clientY: 100 } as Touch,
          { clientX: 200, clientY: 100 } as Touch
        ]
      });

      const preventDefaultOriginal = touchMoveEvent.preventDefault;
      touchMoveEvent.preventDefault = preventDefaultSpy;

      element.dispatchEvent(touchMoveEvent);
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Responsive Design', () => {
    it('should adapt layout for mobile devices', () => {
      deviceSimulator.simulateMobileDevice('iphone');

      const isMobile = window.innerWidth <= 768;
      const layout = {
        columns: isMobile ? 1 : 3,
        fontSize: isModal ? '16px' : '14px',
        navigation: isModal ? 'bottom' : 'side',
        cardSize: isModal ? 'large' : 'medium'
      };

      expect(layout.columns).toBe(1);
      expect(layout.navigation).toBe('bottom');
    });

    it('should handle orientation changes', () => {
      const orientationHandler = jest.fn();
      window.addEventListener('orientationchange', orientationHandler);

      // Simulate orientation change
      const orientationEvent = new Event('orientationchange');
      window.dispatchEvent(orientationEvent);

      expect(orientationHandler).toHaveBeenCalled();
    });

    it('should optimize content for different screen sizes', () => {
      const getOptimalLayout = (width: number, height: number) => {
        if (width < 480) {
          return {
            layout: 'single-column',
            fontSize: 'large',
            spacing: 'comfortable',
            navigation: 'bottom-tabs'
          };
        } else if (width < 768) {
          return {
            layout: 'two-column',
            fontSize: 'medium',
            spacing: 'normal',
            navigation: 'side-drawer'
          };
        } else {
          return {
            layout: 'multi-column',
            fontSize: 'small',
            spacing: 'compact',
            navigation: 'top-bar'
          };
        }
      };

      // Test different screen sizes
      expect(getOptimalLayout(320, 568).layout).toBe('single-column');
      expect(getOptimalLayout(768, 1024).layout).toBe('two-column');
      expect(getOptimalLayout(1024, 768).layout).toBe('multi-column');
    });

    it('should implement safe area insets for modern devices', () => {
      // Mock CSS environment variables for safe areas
      const mockGetComputedStyle = jest.fn().mockReturnValue({
        getPropertyValue: (prop: string) => {
          switch (prop) {
            case '--safe-area-inset-top': return '44px';
            case '--safe-area-inset-bottom': return '34px';
            case '--safe-area-inset-left': return '0px';
            case '--safe-area-inset-right': return '0px';
            default: return '';
          }
        }
      });

      global.getComputedStyle = mockGetComputedStyle;

      const applySafeAreas = () => {
        const style = getComputedStyle(document.documentElement);
        return {
          paddingTop: style.getPropertyValue('--safe-area-inset-top'),
          paddingBottom: style.getPropertyValue('--safe-area-inset-bottom'),
          paddingLeft: style.getPropertyValue('--safe-area-inset-left'),
          paddingRight: style.getPropertyValue('--safe-area-inset-right')
        };
      };

      const safeAreas = applySafeAreas();
      expect(safeAreas.paddingTop).toBe('44px');
      expect(safeAreas.paddingBottom).toBe('34px');
    });
  });

  describe('Performance on Mobile Devices', () => {
    it('should optimize scroll performance', () => {
      const mockElement = {
        style: {},
        addEventListener: jest.fn()
      };

      const optimizeScrolling = (element: any) => {
        // Enable hardware acceleration
        element.style.transform = 'translateZ(0)';
        element.style.willChange = 'scroll-position';
        
        // Use passive listeners for better performance
        element.addEventListener('touchstart', () => {}, { passive: true });
        element.addEventListener('touchmove', () => {}, { passive: true });
        
        return element;
      };

      const optimizedElement = optimizeScrolling(mockElement);
      expect(optimizedElement.style.transform).toBe('translateZ(0)');
      expect(optimizedElement.addEventListener).toHaveBeenCalledWith(
        'touchstart',
        expect.any(Function),
        { passive: true }
      );
    });

    it('should implement virtual scrolling for large lists', () => {
      const virtualScrollController = {
        itemHeight: 100,
        containerHeight: 500,
        totalItems: 1000,
        scrollTop: 0,
        
        getVisibleRange: function() {
          const startIndex = Math.floor(this.scrollTop / this.itemHeight);
          const endIndex = Math.min(
            startIndex + Math.ceil(this.containerHeight / this.itemHeight) + 1,
            this.totalItems
          );
          return { startIndex, endIndex };
        },
        
        getVisibleItems: function() {
          const { startIndex, endIndex } = this.getVisibleRange();
          return Array.from({ length: endIndex - startIndex }, (_, i) => ({
            index: startIndex + i,
            top: (startIndex + i) * this.itemHeight
          }));
        }
      };

      virtualScrollController.scrollTop = 2000; // Scroll to middle
      const visibleItems = virtualScrollController.getVisibleItems();
      
      expect(visibleItems.length).toBeLessThan(virtualScrollController.totalItems);
      expect(visibleItems[0].index).toBe(20); // 2000 / 100
    });

    it('should measure and optimize frame rate', () => {
      const frameRateMonitor = {
        frames: 0,
        lastTime: 0,
        fps: 0,
        
        start: function() {
          this.lastTime = performance.now();
          this.tick();
        },
        
        tick: function() {
          const currentTime = performance.now();
          this.frames++;
          
          if (currentTime - this.lastTime >= 1000) {
            this.fps = this.frames;
            this.frames = 0;
            this.lastTime = currentTime;
          }
          
          requestAnimationFrame(() => this.tick());
        },
        
        getFPS: function() {
          return this.fps;
        }
      };

      // Mock requestAnimationFrame
      global.requestAnimationFrame = jest.fn().mockImplementation(cb => {
        setTimeout(cb, 16); // ~60fps
        return 1;
      });

      frameRateMonitor.start();
      
      // Simulate some frames
      for (let i = 0; i < 60; i++) {
        frameRateMonitor.tick();
      }

      expect(frameRateMonitor.getFPS()).toBeGreaterThan(0);
    });

    it('should implement image lazy loading with intersection observer', () => {
      const lazyImageLoader = {
        observer: null as any,
        
        init: function() {
          this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                const img = entry.target as HTMLImageElement;
                img.src = img.dataset.src || '';
                img.classList.remove('lazy');
                this.observer.unobserve(img);
              }
            });
          }, { rootMargin: '50px' });
        },
        
        observe: function(img: HTMLElement) {
          this.observer.observe(img);
        }
      };

      const mockIntersectionObserver = jest.fn().mockImplementation((callback) => ({
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn()
      }));

      global.IntersectionObserver = mockIntersectionObserver;

      lazyImageLoader.init();
      expect(mockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        { rootMargin: '50px' }
      );
    });
  });

  describe('Accessibility on Mobile', () => {
    it('should provide adequate touch target sizes', () => {
      const checkTouchTargetSize = (element: { width: number, height: number }) => {
        const minSize = 44; // Minimum 44px for iOS, 48dp for Android
        return element.width >= minSize && element.height >= minSize;
      };

      const goodButton = { width: 48, height: 48 };
      const smallButton = { width: 32, height: 32 };

      expect(checkTouchTargetSize(goodButton)).toBe(true);
      expect(checkTouchTargetSize(smallButton)).toBe(false);
    });

    it('should handle screen reader navigation', () => {
      const screenReaderSupport = {
        announcements: [] as string[],
        
        announce: function(message: string) {
          this.announcements.push(message);
          
          // Simulate ARIA live region update
          const liveRegion = document.createElement('div');
          liveRegion.setAttribute('aria-live', 'polite');
          liveRegion.textContent = message;
          document.body.appendChild(liveRegion);
          
          return message;
        },
        
        setFocus: function(element: HTMLElement) {
          element.focus();
          element.setAttribute('aria-current', 'true');
        }
      };

      const message = screenReaderSupport.announce('Chapter loading complete');
      expect(screenReaderSupport.announcements).toContain(message);
    });

    it('should support keyboard navigation on mobile keyboards', () => {
      const keyboardNavigation = {
        currentIndex: 0,
        items: ['item1', 'item2', 'item3'],
        
        handleKeydown: function(event: KeyboardEvent) {
          switch (event.key) {
            case 'ArrowDown':
            case 'Tab':
              this.currentIndex = Math.min(this.currentIndex + 1, this.items.length - 1);
              event.preventDefault();
              break;
            case 'ArrowUp':
              this.currentIndex = Math.max(this.currentIndex - 1, 0);
              event.preventDefault();
              break;
            case 'Enter':
            case ' ':
              return this.items[this.currentIndex];
          }
          return null;
        }
      };

      const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });

      keyboardNavigation.handleKeydown(downEvent);
      expect(keyboardNavigation.currentIndex).toBe(1);

      const selectedItem = keyboardNavigation.handleKeydown(enterEvent);
      expect(selectedItem).toBe('item2');
    });

    it('should implement proper focus management', () => {
      const focusManager = {
        focusableElements: [] as HTMLElement[],
        currentFocus: -1,
        
        initFocusableElements: function() {
          const selectors = [
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            'a[href]',
            '[tabindex]:not([tabindex="-1"])'
          ];
          
          this.focusableElements = Array.from(
            document.querySelectorAll(selectors.join(', '))
          ) as HTMLElement[];
        },
        
        moveFocus: function(direction: 'next' | 'previous') {
          if (direction === 'next') {
            this.currentFocus = Math.min(this.currentFocus + 1, this.focusableElements.length - 1);
          } else {
            this.currentFocus = Math.max(this.currentFocus - 1, 0);
          }
          
          this.focusableElements[this.currentFocus]?.focus();
          return this.currentFocus;
        },
        
        trapFocus: function(container: HTMLElement) {
          container.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
              e.preventDefault();
              this.moveFocus(e.shiftKey ? 'previous' : 'next');
            }
          });
        }
      };

      // Mock DOM elements
      const mockButton1 = { focus: jest.fn() } as any;
      const mockButton2 = { focus: jest.fn() } as any;
      focusManager.focusableElements = [mockButton1, mockButton2];

      const nextIndex = focusManager.moveFocus('next');
      expect(nextIndex).toBe(1);
      expect(mockButton2.focus).toHaveBeenCalled();
    });
  });

  describe('Battery and Performance Optimization', () => {
    beforeEach(() => {
      deviceSimulator.simulateBatteryAPI(0.3, false); // Low battery, not charging
    });

    it('should detect battery level and adjust performance', async () => {
      const batteryManager = await navigator.getBattery();
      
      const getPerformanceMode = (battery: any) => {
        if (battery.level < 0.2 && !battery.charging) {
          return 'power-saver';
        } else if (battery.level < 0.5 && !battery.charging) {
          return 'balanced';
        } else {
          return 'performance';
        }
      };

      const mode = getPerformanceMode(batteryManager);
      expect(mode).toBe('balanced');

      const optimizations = {
        'power-saver': {
          animationsReduced: true,
          backgroundSyncDisabled: true,
          imageQualityReduced: true
        },
        'balanced': {
          animationsReduced: false,
          backgroundSyncReduced: true,
          imageQualityReduced: false
        },
        'performance': {
          animationsReduced: false,
          backgroundSyncDisabled: false,
          imageQualityReduced: false
        }
      };

      expect(optimizations[mode as keyof typeof optimizations].backgroundSyncReduced).toBe(true);
    });

    it('should implement CPU throttling for background tasks', () => {
      const taskScheduler = {
        tasks: [] as any[],
        isThrottled: false,
        
        addTask: function(task: any, priority: 'high' | 'normal' | 'low') {
          this.tasks.push({ ...task, priority });
          this.processTasks();
        },
        
        processTasks: function() {
          const sortedTasks = this.tasks.sort((a, b) => {
            const priorities = { high: 3, normal: 2, low: 1 };
            return priorities[b.priority] - priorities[a.priority];
          });
          
          const processNext = () => {
            if (sortedTasks.length === 0) return;
            
            const task = sortedTasks.shift();
            const delay = this.isThrottled ? 100 : 16; // Throttle in low power mode
            
            setTimeout(() => {
              task.execute();
              processNext();
            }, delay);
          };
          
          processNext();
        },
        
        setThrottled: function(throttled: boolean) {
          this.isThrottled = throttled;
        }
      };

      const mockTask = { execute: jest.fn() };
      taskScheduler.setThrottled(true);
      taskScheduler.addTask(mockTask, 'low');

      setTimeout(() => {
        expect(mockTask.execute).toHaveBeenCalled();
      }, 150);
    });

    it('should reduce memory usage in low-memory situations', () => {
      const memoryManager = {
        cache: new Map(),
        maxCacheSize: 100,
        
        set: function(key: string, value: any) {
          if (this.cache.size >= this.maxCacheSize) {
            this.evictLRU();
          }
          this.cache.set(key, { value, timestamp: Date.now() });
        },
        
        get: function(key: string) {
          const item = this.cache.get(key);
          if (item) {
            item.timestamp = Date.now(); // Update LRU
            return item.value;
          }
          return null;
        },
        
        evictLRU: function() {
          let oldestKey = null;
          let oldestTime = Infinity;
          
          for (const [key, item] of this.cache.entries()) {
            if (item.timestamp < oldestTime) {
              oldestTime = item.timestamp;
              oldestKey = key;
            }
          }
          
          if (oldestKey) {
            this.cache.delete(oldestKey);
          }
        },
        
        handleMemoryPressure: function() {
          // Clear half the cache during memory pressure
          const keysToDelete = Array.from(this.cache.keys()).slice(0, Math.floor(this.cache.size / 2));
          keysToDelete.forEach(key => this.cache.delete(key));
        }
      };

      // Fill cache to capacity
      for (let i = 0; i < 105; i++) {
        memoryManager.set(`key${i}`, `value${i}`);
      }

      expect(memoryManager.cache.size).toBeLessThanOrEqual(100);
      
      // Simulate memory pressure
      memoryManager.handleMemoryPressure();
      expect(memoryManager.cache.size).toBeLessThan(50);
    });
  });

  describe('Mobile-Specific Features', () => {
    it('should handle device rotation and viewport changes', () => {
      const viewportManager = {
        currentOrientation: 'portrait',
        
        handleOrientationChange: function() {
          const isLandscape = window.innerWidth > window.innerHeight;
          this.currentOrientation = isLandscape ? 'landscape' : 'portrait';
          
          // Adjust layout based on orientation
          return {
            orientation: this.currentOrientation,
            layout: isLandscape ? 'horizontal' : 'vertical',
            readingColumns: isLandscape ? 2 : 1
          };
        }
      };

      // Simulate landscape mode
      Object.defineProperty(window, 'innerWidth', { value: 800, configurable: true });
      Object.defineProperty(window, 'innerHeight', { value: 600, configurable: true });

      const layout = viewportManager.handleOrientationChange();
      expect(layout.orientation).toBe('landscape');
      expect(layout.readingColumns).toBe(2);
    });

    it('should implement haptic feedback for touch interactions', () => {
      const hapticFeedback = {
        vibrate: jest.fn(),
        
        init: function() {
          if ('vibrate' in navigator) {
            this.vibrate = (pattern: number | number[]) => {
              navigator.vibrate(pattern);
            };
          }
        },
        
        lightTap: function() {
          this.vibrate(10);
        },
        
        mediumTap: function() {
          this.vibrate(20);
        },
        
        heavyTap: function() {
          this.vibrate([30, 10, 30]);
        },
        
        error: function() {
          this.vibrate([100, 50, 100, 50, 100]);
        }
      };

      // Mock navigator.vibrate
      Object.defineProperty(navigator, 'vibrate', {
        value: jest.fn(),
        configurable: true
      });

      hapticFeedback.init();
      hapticFeedback.lightTap();
      
      expect(navigator.vibrate).toHaveBeenCalledWith(10);
    });

    it('should handle pull-to-refresh gesture', () => {
      const pullToRefresh = {
        startY: 0,
        currentY: 0,
        threshold: 100,
        isRefreshing: false,
        
        onTouchStart: function(e: TouchEvent) {
          if (window.scrollY === 0) { // Only at top of page
            this.startY = e.touches[0].clientY;
          }
        },
        
        onTouchMove: function(e: TouchEvent) {
          if (window.scrollY === 0 && !this.isRefreshing) {
            this.currentY = e.touches[0].clientY;
            const pullDistance = this.currentY - this.startY;
            
            if (pullDistance > 0) {
              e.preventDefault(); // Prevent default scroll
              return {
                distance: pullDistance,
                shouldRefresh: pullDistance > this.threshold
              };
            }
          }
          return null;
        },
        
        onTouchEnd: function() {
          const pullDistance = this.currentY - this.startY;
          if (pullDistance > this.threshold && !this.isRefreshing) {
            this.isRefreshing = true;
            return 'refresh';
          }
          return null;
        }
      };

      // Simulate pull-to-refresh
      pullToRefresh.onTouchStart({ touches: [{ clientY: 100 }] } as any);
      const moveResult = pullToRefresh.onTouchMove({ 
        touches: [{ clientY: 220 }],
        preventDefault: jest.fn()
      } as any);
      
      expect(moveResult?.distance).toBe(120);
      expect(moveResult?.shouldRefresh).toBe(true);
      
      const endResult = pullToRefresh.onTouchEnd();
      expect(endResult).toBe('refresh');
    });

    it('should implement smart app banner for installation', () => {
      const smartBanner = {
        isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
        isAndroid: /Android/.test(navigator.userAgent),
        
        shouldShow: function() {
          // Don't show if already installed
          if (window.navigator.standalone) return false;
          
          // Don't show if dismissed recently
          const dismissed = localStorage.getItem('smart-banner-dismissed');
          if (dismissed) {
            const dismissedTime = new Date(dismissed).getTime();
            const now = Date.now();
            if (now - dismissedTime < 7 * 24 * 60 * 60 * 1000) { // 7 days
              return false;
            }
          }
          
          return this.isIOS || this.isAndroid;
        },
        
        getInstallText: function() {
          if (this.isIOS) return 'Install from App Store';
          if (this.isAndroid) return 'Get it on Google Play';
          return 'Install App';
        },
        
        dismiss: function() {
          localStorage.setItem('smart-banner-dismissed', new Date().toISOString());
        }
      };

      expect(smartBanner.getInstallText()).toContain('Install');
      
      smartBanner.dismiss();
      expect(localStorage.getItem('smart-banner-dismissed')).toBeTruthy();
    });
  });
});