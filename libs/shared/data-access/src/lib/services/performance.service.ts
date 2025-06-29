import { Injectable, inject } from '@angular/core';
import { AnalyticsService } from './analytics.service';

export interface PerformanceMetrics {
  navigation: PerformanceNavigationTiming | null;
  paint: PerformancePaintTiming[];
  resources: PerformanceResourceTiming[];
  coreWebVitals: {
    lcp: number | null; // Largest Contentful Paint
    fid: number | null; // First Input Delay
    cls: number | null; // Cumulative Layout Shift
  };
  customMetrics: Record<string, number>;
}

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  private analyticsService = inject(AnalyticsService);
  
  private metrics: PerformanceMetrics = {
    navigation: null,
    paint: [],
    resources: [],
    coreWebVitals: {
      lcp: null,
      fid: null,
      cls: null
    },
    customMetrics: {}
  };

  private performanceObserver?: PerformanceObserver;

  constructor() {
    this.initializePerformanceMonitoring();
  }

  /**
   * Initialize performance monitoring
   */
  private initializePerformanceMonitoring(): void {
    // Wait for page load to complete
    if (document.readyState === 'complete') {
      this.collectInitialMetrics();
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => this.collectInitialMetrics(), 100);
      });
    }

    this.observeCoreWebVitals();
  }

  /**
   * Collect initial performance metrics
   */
  private collectInitialMetrics(): void {
    // Get navigation timing
    const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (navigationEntries.length > 0) {
      this.metrics.navigation = navigationEntries[0];
      this.trackNavigationMetrics(navigationEntries[0]);
    }

    // Get paint timing
    const paintEntries = performance.getEntriesByType('paint') as PerformancePaintTiming[];
    this.metrics.paint = paintEntries;
    this.trackPaintMetrics(paintEntries);

    // Get resource timing
    const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    this.metrics.resources = resourceEntries;
    this.analyzeResourcePerformance(resourceEntries);
  }

  /**
   * Track navigation timing metrics
   */
  private trackNavigationMetrics(navigation: PerformanceNavigationTiming): void {
    const metrics = {
      dns_lookup: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcp_connection: navigation.connectEnd - navigation.connectStart,
      tls_handshake: navigation.secureConnectionStart > 0 ? 
        navigation.connectEnd - navigation.secureConnectionStart : 0,
      server_response: navigation.responseStart - navigation.requestStart,
      dom_processing: navigation.domContentLoadedEventStart - navigation.responseStart,
      resource_loading: navigation.loadEventStart - navigation.domContentLoadedEventStart,
      total_load_time: navigation.loadEventEnd - navigation.navigationStart,
      time_to_first_byte: navigation.responseStart - navigation.navigationStart,
      dom_interactive: navigation.domInteractive - navigation.navigationStart,
      dom_complete: navigation.domComplete - navigation.navigationStart
    };

    // Track each metric
    Object.entries(metrics).forEach(([name, value]) => {
      if (value > 0) {
        this.analyticsService.trackPerformance(name, Math.round(value));
        this.metrics.customMetrics[name] = value;
      }
    });
  }

  /**
   * Track paint timing metrics
   */
  private trackPaintMetrics(paintEntries: PerformancePaintTiming[]): void {
    paintEntries.forEach(entry => {
      const metricName = entry.name.replace('-', '_');
      this.analyticsService.trackPerformance(metricName, Math.round(entry.startTime));
      this.metrics.customMetrics[metricName] = entry.startTime;
    });
  }

  /**
   * Analyze resource performance
   */
  private analyzeResourcePerformance(resources: PerformanceResourceTiming[]): void {
    const resourcesByType = this.groupResourcesByType(resources);
    
    Object.entries(resourcesByType).forEach(([type, entries]) => {
      const stats = this.calculateResourceStats(entries);
      
      this.analyticsService.trackPerformance(`${type}_count`, entries.length, 'count');
      this.analyticsService.trackPerformance(`${type}_avg_duration`, Math.round(stats.avgDuration));
      this.analyticsService.trackPerformance(`${type}_total_size`, Math.round(stats.totalSize), 'bytes');
      
      // Track slow resources
      const slowResources = entries.filter(entry => entry.duration > 1000);
      if (slowResources.length > 0) {
        this.analyticsService.trackPerformance(`${type}_slow_count`, slowResources.length, 'count');
      }
    });
  }

  /**
   * Group resources by type
   */
  private groupResourcesByType(resources: PerformanceResourceTiming[]): Record<string, PerformanceResourceTiming[]> {
    return resources.reduce((groups, resource) => {
      const type = this.getResourceType(resource);
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(resource);
      return groups;
    }, {} as Record<string, PerformanceResourceTiming[]>);
  }

  /**
   * Get resource type from URL or initiator type
   */
  private getResourceType(resource: PerformanceResourceTiming): string {
    // Check initiator type first
    if (resource.initiatorType) {
      return resource.initiatorType;
    }

    // Fallback to URL analysis
    const url = resource.name.toLowerCase();
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font';
    if (url.includes('/api/')) return 'api';
    
    return 'other';
  }

  /**
   * Calculate statistics for a group of resources
   */
  private calculateResourceStats(resources: PerformanceResourceTiming[]): {
    avgDuration: number;
    totalSize: number;
    maxDuration: number;
  } {
    if (resources.length === 0) {
      return { avgDuration: 0, totalSize: 0, maxDuration: 0 };
    }

    const totalDuration = resources.reduce((sum, r) => sum + r.duration, 0);
    const totalSize = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
    const maxDuration = Math.max(...resources.map(r => r.duration));

    return {
      avgDuration: totalDuration / resources.length,
      totalSize,
      maxDuration
    };
  }

  /**
   * Observe Core Web Vitals
   */
  private observeCoreWebVitals(): void {
    if (!('PerformanceObserver' in window)) {
      console.warn('PerformanceObserver not supported');
      return;
    }

    // Observe LCP (Largest Contentful Paint)
    this.observeMetric('largest-contentful-paint', (entry: any) => {
      const lcp = Math.round(entry.startTime);
      this.metrics.coreWebVitals.lcp = lcp;
      this.analyticsService.trackPerformance('lcp', lcp);
      
      // Track LCP score based on thresholds
      const score = lcp <= 2500 ? 'good' : lcp <= 4000 ? 'needs_improvement' : 'poor';
      this.analyticsService.trackEvent('core_web_vitals', { metric: 'lcp', value: lcp, score });
    });

    // Observe FID (First Input Delay)
    this.observeMetric('first-input', (entry: any) => {
      const fid = Math.round(entry.processingStart - entry.startTime);
      this.metrics.coreWebVitals.fid = fid;
      this.analyticsService.trackPerformance('fid', fid);
      
      const score = fid <= 100 ? 'good' : fid <= 300 ? 'needs_improvement' : 'poor';
      this.analyticsService.trackEvent('core_web_vitals', { metric: 'fid', value: fid, score });
    });

    // Observe CLS (Cumulative Layout Shift)
    this.observeMetric('layout-shift', (entry: any) => {
      if (!entry.hadRecentInput) {
        const cls = entry.value;
        this.metrics.coreWebVitals.cls = (this.metrics.coreWebVitals.cls || 0) + cls;
        
        // Track CLS periodically
        setTimeout(() => {
          const totalCls = this.metrics.coreWebVitals.cls || 0;
          this.analyticsService.trackPerformance('cls', totalCls * 1000, 'score'); // Convert to easier tracking
          
          const score = totalCls <= 0.1 ? 'good' : totalCls <= 0.25 ? 'needs_improvement' : 'poor';
          this.analyticsService.trackEvent('core_web_vitals', { metric: 'cls', value: totalCls, score });
        }, 5000);
      }
    });
  }

  /**
   * Observe specific performance metric
   */
  private observeMetric(entryType: string, callback: (entry: any) => void): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          callback(entry);
        }
      });
      
      observer.observe({ entryTypes: [entryType] });
    } catch (error) {
      console.warn(`Could not observe ${entryType}:`, error);
    }
  }

  /**
   * Mark a custom performance timing
   */
  markTiming(name: string): void {
    if ('performance' in window && performance.mark) {
      performance.mark(name);
    }
  }

  /**
   * Measure time between two marks
   */
  measureTiming(name: string, startMark: string, endMark?: string): number | null {
    if (!('performance' in window && performance.measure)) {
      return null;
    }

    try {
      if (endMark) {
        performance.measure(name, startMark, endMark);
      } else {
        performance.measure(name, startMark);
      }

      const measures = performance.getEntriesByName(name, 'measure');
      if (measures.length > 0) {
        const duration = measures[0].duration;
        this.analyticsService.trackPerformance(name, Math.round(duration));
        return duration;
      }
    } catch (error) {
      console.warn(`Could not measure ${name}:`, error);
    }

    return null;
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Export performance report
   */
  exportReport(): string {
    const report = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      metrics: this.getMetrics(),
      recommendations: this.generateRecommendations()
    };

    return JSON.stringify(report, null, 2);
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const metrics = this.getMetrics();

    // LCP recommendations
    if (metrics.coreWebVitals.lcp && metrics.coreWebVitals.lcp > 2500) {
      recommendations.push('Optimize Largest Contentful Paint by compressing images and reducing server response times');
    }

    // FID recommendations
    if (metrics.coreWebVitals.fid && metrics.coreWebVitals.fid > 100) {
      recommendations.push('Improve First Input Delay by reducing JavaScript execution time');
    }

    // CLS recommendations
    if (metrics.coreWebVitals.cls && metrics.coreWebVitals.cls > 0.1) {
      recommendations.push('Reduce Cumulative Layout Shift by setting explicit dimensions for images and ads');
    }

    // TTFB recommendations
    if (metrics.customMetrics.time_to_first_byte > 800) {
      recommendations.push('Improve Time to First Byte by optimizing server performance or using a CDN');
    }

    return recommendations;
  }
}