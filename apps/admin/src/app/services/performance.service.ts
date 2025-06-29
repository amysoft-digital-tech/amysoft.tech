import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';

export interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
  domContentLoaded: number;
  loadComplete: number;
  memoryUsage?: MemoryInfo;
  navigationTiming: PerformanceNavigationTiming;
}

export interface ComponentPerformance {
  componentName: string;
  renderTime: number;
  changeDetectionTime: number;
  memoryDelta: number;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  private metricsSubject = new BehaviorSubject<Partial<PerformanceMetrics>>({});
  private componentMetrics: ComponentPerformance[] = [];
  private performanceObserver?: PerformanceObserver;

  public metrics$ = this.metricsSubject.asObservable();

  constructor() {
    this.initializePerformanceMonitoring();
    this.observeWebVitals();
  }

  /**
   * Initialize performance monitoring
   */
  private initializePerformanceMonitoring(): void {
    // Monitor navigation timing
    if (performance.getEntriesByType) {
      this.collectNavigationTiming();
    }

    // Monitor resource loading
    this.observeResourceTiming();

    // Monitor long tasks
    this.observeLongTasks();
  }

  /**
   * Collect Web Vitals metrics
   */
  private observeWebVitals(): void {
    if (!window.PerformanceObserver) {
      console.warn('PerformanceObserver not supported');
      return;
    }

    // First Contentful Paint
    this.observeMetric('paint', (entries) => {
      const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        this.updateMetrics({ fcp: fcpEntry.startTime });
      }
    });

    // Largest Contentful Paint
    this.observeMetric('largest-contentful-paint', (entries) => {
      const latestEntry = entries[entries.length - 1];
      if (latestEntry) {
        this.updateMetrics({ lcp: latestEntry.startTime });
      }
    });

    // First Input Delay
    this.observeMetric('first-input', (entries) => {
      const fidEntry = entries[0];
      if (fidEntry) {
        this.updateMetrics({ fid: fidEntry.processingStart - fidEntry.startTime });
      }
    });

    // Cumulative Layout Shift
    this.observeMetric('layout-shift', (entries) => {
      let cls = 0;
      entries.forEach(entry => {
        if (!entry.hadRecentInput) {
          cls += entry.value;
        }
      });
      this.updateMetrics({ cls });
    });
  }

  /**
   * Observe specific performance metric
   */
  private observeMetric(type: string, callback: (entries: any[]) => void): void {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      observer.observe({ type, buffered: true });
    } catch (error) {
      console.warn(`Failed to observe ${type} metrics:`, error);
    }
  }

  /**
   * Collect navigation timing metrics
   */
  private collectNavigationTiming(): void {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        const metrics: Partial<PerformanceMetrics> = {
          ttfb: navigation.responseStart - navigation.requestStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
          loadComplete: navigation.loadEventEnd - navigation.navigationStart,
          navigationTiming: navigation
        };

        this.updateMetrics(metrics);
      }
    });
  }

  /**
   * Monitor resource loading performance
   */
  private observeResourceTiming(): void {
    this.observeMetric('resource', (entries) => {
      // Track slow-loading resources
      const slowResources = entries.filter(entry => entry.duration > 1000);
      if (slowResources.length > 0) {
        console.warn('Slow loading resources detected:', slowResources);
      }
    });
  }

  /**
   * Monitor long tasks that block the main thread
   */
  private observeLongTasks(): void {
    this.observeMetric('longtask', (entries) => {
      entries.forEach(entry => {
        console.warn(`Long task detected: ${entry.duration}ms`, entry);
      });
    });
  }

  /**
   * Measure component performance
   */
  measureComponent<T>(
    componentName: string,
    operation: () => T,
    trackMemory: boolean = false
  ): T {
    const startTime = performance.now();
    const startMemory = trackMemory ? this.getMemoryUsage() : 0;

    const result = operation();

    const endTime = performance.now();
    const endMemory = trackMemory ? this.getMemoryUsage() : 0;

    const metrics: ComponentPerformance = {
      componentName,
      renderTime: endTime - startTime,
      changeDetectionTime: 0, // Would be set separately for change detection
      memoryDelta: endMemory - startMemory,
      timestamp: Date.now()
    };

    this.componentMetrics.push(metrics);
    
    // Keep only last 100 measurements
    if (this.componentMetrics.length > 100) {
      this.componentMetrics = this.componentMetrics.slice(-100);
    }

    return result;
  }

  /**
   * Measure async operation performance
   */
  async measureAsync<T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      
      console.log(`${operationName} completed in ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`${operationName} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(newMetrics: Partial<PerformanceMetrics>): void {
    const currentMetrics = this.metricsSubject.value;
    
    // Add memory usage if available
    if ('memory' in performance) {
      newMetrics.memoryUsage = (performance as any).memory;
    }

    this.metricsSubject.next({ ...currentMetrics, ...newMetrics });
  }

  /**
   * Get component performance statistics
   */
  getComponentStats(componentName?: string): ComponentPerformance[] {
    if (componentName) {
      return this.componentMetrics.filter(m => m.componentName === componentName);
    }
    return [...this.componentMetrics];
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    averageRenderTime: number;
    slowestComponent: string;
    memoryTrend: 'increasing' | 'stable' | 'decreasing';
    webVitalsScore: 'good' | 'needs-improvement' | 'poor';
  } {
    const currentMetrics = this.metricsSubject.value;
    
    // Calculate average render time
    const renderTimes = this.componentMetrics.map(m => m.renderTime);
    const averageRenderTime = renderTimes.length > 0 
      ? renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length 
      : 0;

    // Find slowest component
    const slowestMetric = this.componentMetrics.reduce((slowest, current) => 
      current.renderTime > slowest.renderTime ? current : slowest, 
      { renderTime: 0, componentName: 'none' } as ComponentPerformance
    );

    // Analyze memory trend
    const recentMemoryDeltas = this.componentMetrics.slice(-10).map(m => m.memoryDelta);
    const memoryTrend = this.analyzeMemoryTrend(recentMemoryDeltas);

    // Calculate Web Vitals score
    const webVitalsScore = this.calculateWebVitalsScore(currentMetrics);

    return {
      averageRenderTime,
      slowestComponent: slowestMetric.componentName,
      memoryTrend,
      webVitalsScore
    };
  }

  /**
   * Analyze memory usage trend
   */
  private analyzeMemoryTrend(deltas: number[]): 'increasing' | 'stable' | 'decreasing' {
    if (deltas.length < 3) return 'stable';
    
    const averageDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
    
    if (averageDelta > 1000000) return 'increasing'; // 1MB increase
    if (averageDelta < -1000000) return 'decreasing'; // 1MB decrease
    return 'stable';
  }

  /**
   * Calculate Web Vitals score
   */
  private calculateWebVitalsScore(metrics: Partial<PerformanceMetrics>): 'good' | 'needs-improvement' | 'poor' {
    const { fcp = 0, lcp = 0, fid = 0, cls = 0 } = metrics;
    
    let score = 0;
    
    // FCP scoring
    if (fcp <= 1800) score += 25;
    else if (fcp <= 3000) score += 15;
    
    // LCP scoring
    if (lcp <= 2500) score += 25;
    else if (lcp <= 4000) score += 15;
    
    // FID scoring
    if (fid <= 100) score += 25;
    else if (fid <= 300) score += 15;
    
    // CLS scoring
    if (cls <= 0.1) score += 25;
    else if (cls <= 0.25) score += 15;
    
    if (score >= 75) return 'good';
    if (score >= 50) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Export performance data for analysis
   */
  exportPerformanceData(): {
    metrics: Partial<PerformanceMetrics>;
    componentMetrics: ComponentPerformance[];
    summary: any;
    timestamp: number;
  } {
    return {
      metrics: this.metricsSubject.value,
      componentMetrics: this.componentMetrics,
      summary: this.getPerformanceSummary(),
      timestamp: Date.now()
    };
  }

  /**
   * Clear performance data
   */
  clearData(): void {
    this.componentMetrics = [];
    this.metricsSubject.next({});
  }
}