import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface WebVitalsMetrics {
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
}

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  private metrics: WebVitalsMetrics = {};
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  initializeWebVitals(): void {
    if (!this.isBrowser) return;

    // Measure Time to First Byte (TTFB)
    if ('navigation' in window.performance && window.performance.navigation) {
      const navigationTiming = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationTiming) {
        this.metrics.ttfb = navigationTiming.responseStart - navigationTiming.fetchStart;
      }
    }

    // Use Web Vitals library if available
    this.loadWebVitalsLibrary();

    // Fallback measurements
    this.measureFCP();
    this.measureLCP();
    this.measureCLS();
  }

  private async loadWebVitalsLibrary(): Promise<void> {
    try {
      // Dynamically import web-vitals if available
      const webVitals = await import('web-vitals');
      
      if ('onCLS' in webVitals) {
        webVitals.onCLS((metric) => {
          this.metrics.cls = metric.value;
          this.sendMetric('CLS', metric.value);
        });
      }

      if ('onFCP' in webVitals) {
        webVitals.onFCP((metric) => {
          this.metrics.fcp = metric.value;
          this.sendMetric('FCP', metric.value);
        });
      }

      // FID has been deprecated in favor of INP
      if ('onINP' in webVitals) {
        (webVitals as any).onINP((metric: any) => {
          this.metrics.fid = metric.value;
          this.sendMetric('INP', metric.value);
        });
      }

      if ('onLCP' in webVitals) {
        webVitals.onLCP((metric) => {
          this.metrics.lcp = metric.value;
          this.sendMetric('LCP', metric.value);
        });
      }

      if ('onTTFB' in webVitals) {
        webVitals.onTTFB((metric) => {
          this.metrics.ttfb = metric.value;
          this.sendMetric('TTFB', metric.value);
        });
      }

    } catch (error) {
      console.warn('Web Vitals library not available, using fallback measurements');
    }
  }

  private measureFCP(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
      
      if (fcpEntry && !this.metrics.fcp) {
        this.metrics.fcp = fcpEntry.startTime;
        this.sendMetric('FCP', fcpEntry.startTime);
        observer.disconnect();
      }
    });

    observer.observe({ entryTypes: ['paint'] });
  }

  private measureLCP(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      if (lastEntry) {
        this.metrics.lcp = lastEntry.startTime;
        this.sendMetric('LCP', lastEntry.startTime);
      }
    });

    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  }

  private measureCLS(): void {
    if (!('PerformanceObserver' in window)) return;

    let clsValue = 0;
    let clsEntries: PerformanceEntry[] = [];
    let sessionValue = 0;
    let sessionEntries: PerformanceEntry[] = [];

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as any[];

      for (const entry of entries) {
        if (!entry.hadRecentInput) {
          const firstSessionEntry = sessionEntries[0];
          const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

          if (sessionValue &&
              entry.startTime - lastSessionEntry.startTime < 1000 &&
              entry.startTime - firstSessionEntry.startTime < 5000) {
            sessionValue += entry.value;
            sessionEntries.push(entry);
          } else {
            sessionValue = entry.value;
            sessionEntries = [entry];
          }

          if (sessionValue > clsValue) {
            clsValue = sessionValue;
            clsEntries = [...sessionEntries];
            this.metrics.cls = clsValue;
            this.sendMetric('CLS', clsValue);
          }
        }
      }
    });

    observer.observe({ entryTypes: ['layout-shift'] });
  }

  private sendMetric(name: string, value: number): void {
    // Send to analytics service (implement based on your analytics provider)
    console.log(`Performance Metric - ${name}: ${value}ms`);
    
    // Example: Send to Google Analytics 4
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', name, {
        event_category: 'Web Vitals',
        value: Math.round(value),
        non_interaction: true,
      });
    }
  }

  getMetrics(): WebVitalsMetrics {
    return { ...this.metrics };
  }

  // Additional performance monitoring methods
  measureResourceTiming(): void {
    if (!this.isBrowser || !('performance' in window)) return;

    const resources = window.performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const slowResources = resources.filter(resource => resource.duration > 1000);
    
    if (slowResources.length > 0) {
      console.warn('Slow loading resources detected:', slowResources);
    }
  }

  measureMemoryUsage(): void {
    if (!this.isBrowser || !('memory' in window.performance)) return;

    const memory = (window.performance as any).memory;
    console.log('Memory Usage:', {
      used: Math.round(memory.usedJSHeapSize / 1048576) + ' MB',
      total: Math.round(memory.totalJSHeapSize / 1048576) + ' MB',
      limit: Math.round(memory.jsHeapSizeLimit / 1048576) + ' MB'
    });
  }

  // Preload critical resources
  preloadCriticalResources(): void {
    if (!this.isBrowser) return;

    const criticalResources = [
      '/assets/fonts/primary-font.woff2',
      '/assets/images/hero-bg.webp',
      '/assets/css/critical.css'
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      
      if (resource.includes('.woff2')) {
        link.as = 'font';
        link.type = 'font/woff2';
        link.crossOrigin = 'anonymous';
      } else if (resource.includes('.webp') || resource.includes('.jpg') || resource.includes('.png')) {
        link.as = 'image';
      } else if (resource.includes('.css')) {
        link.as = 'style';
      }
      
      document.head.appendChild(link);
    });
  }

  // Lazy load non-critical resources
  lazyLoadImages(): void {
    if (!this.isBrowser || !('IntersectionObserver' in window)) return;

    const lazyImages = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset['src'] || '';
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      });
    });

    lazyImages.forEach(img => imageObserver.observe(img));
  }

  // Monitor long tasks that block the main thread
  monitorLongTasks(): void {
    if (!this.isBrowser || !('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (entry.duration > 50) {
          console.warn('Long task detected:', {
            duration: entry.duration,
            startTime: entry.startTime
          });
        }
      });
    });

    observer.observe({ entryTypes: ['longtask'] });
  }
}