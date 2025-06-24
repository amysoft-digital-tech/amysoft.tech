import { Injectable } from '@angular/core';
import { BehaviorSubject, interval, Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  networkLatency: number;
  cacheHitRate: number;
  errorRate: number;
  userInteractionDelay: number;
}

export interface CoreWebVitals {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
}

export interface PerformanceThresholds {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  networkLatency: number;
  lcp: number;
  fid: number;
  cls: number;
}

@Injectable({
  providedIn: 'root'
})
export class PerformanceMonitorService {
  private metricsSubject = new BehaviorSubject<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    networkLatency: 0,
    cacheHitRate: 0,
    errorRate: 0,
    userInteractionDelay: 0
  });

  private webVitalsSubject = new BehaviorSubject<CoreWebVitals>({
    lcp: 0,
    fid: 0,
    cls: 0,
    fcp: 0,
    ttfb: 0
  });

  private thresholds: PerformanceThresholds = {
    loadTime: 3000, // 3 seconds
    renderTime: 16, // 60fps = 16ms per frame
    memoryUsage: 100 * 1024 * 1024, // 100MB
    networkLatency: 200, // 200ms
    lcp: 2500, // 2.5 seconds
    fid: 100, // 100ms
    cls: 0.1 // 0.1 CLS score
  };

  private performanceObserver?: PerformanceObserver;
  private navigationTiming?: PerformanceNavigationTiming;
  private resourceTimings: PerformanceResourceTiming[] = [];
  private interactionTimings: number[] = [];

  constructor() {
    this.initializePerformanceMonitoring();
    this.startMetricsCollection();
  }

  private initializePerformanceMonitoring(): void {
    if (typeof window !== 'undefined' && 'performance' in window) {
      this.setupPerformanceObserver();
      this.measureNavigationTiming();
      this.setupWebVitalsCollection();
      this.monitorUserInteractions();
    }
  }

  private setupPerformanceObserver(): void {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach(entry => {
          switch (entry.entryType) {
            case 'navigation':
              this.handleNavigationEntry(entry as PerformanceNavigationTiming);
              break;
            case 'resource':
              this.handleResourceEntry(entry as PerformanceResourceTiming);
              break;
            case 'measure':
              this.handleMeasureEntry(entry);
              break;
            case 'paint':
              this.handlePaintEntry(entry);
              break;
          }
        });
      });

      try {
        this.performanceObserver.observe({ 
          entryTypes: ['navigation', 'resource', 'measure', 'paint'] 
        });
      } catch (error) {
        console.warn('Performance Observer setup failed:', error);
      }
    }
  }

  private setupWebVitalsCollection(): void {
    // Largest Contentful Paint
    this.observeWebVital('largest-contentful-paint', (entry: any) => {
      this.updateWebVital('lcp', entry.startTime);
    });

    // First Input Delay
    this.observeWebVital('first-input', (entry: any) => {
      const fid = entry.processingStart - entry.startTime;
      this.updateWebVital('fid', fid);
    });

    // Cumulative Layout Shift
    this.observeWebVital('layout-shift', (entry: any) => {
      if (!entry.hadRecentInput) {
        const currentCLS = this.webVitalsSubject.value.cls;
        this.updateWebVital('cls', currentCLS + entry.value);
      }
    });

    // First Contentful Paint
    this.observeWebVital('paint', (entry: any) => {
      if (entry.name === 'first-contentful-paint') {
        this.updateWebVital('fcp', entry.startTime);
      }
    });
  }

  private observeWebVital(type: string, callback: (entry: any) => void): void {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach(callback);
        });
        observer.observe({ entryTypes: [type] });
      } catch (error) {
        console.warn(`Failed to observe ${type}:`, error);
      }
    }
  }

  private measureNavigationTiming(): void {
    if (window.performance && window.performance.getEntriesByType) {
      const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.navigationTiming = navigation;
        this.updateWebVital('ttfb', navigation.responseStart - navigation.fetchStart);
      }
    }
  }

  private monitorUserInteractions(): void {
    const events = ['click', 'keydown', 'scroll', 'input'];
    
    events.forEach(eventType => {
      document.addEventListener(eventType, (event) => {
        const start = performance.now();
        
        // Use requestAnimationFrame to measure interaction delay
        requestAnimationFrame(() => {
          const delay = performance.now() - start;
          this.interactionTimings.push(delay);
          
          // Keep only last 100 measurements
          if (this.interactionTimings.length > 100) {
            this.interactionTimings = this.interactionTimings.slice(-100);
          }
        });
      }, { passive: true });
    });
  }

  private startMetricsCollection(): void {
    // Collect metrics every 5 seconds
    interval(5000).pipe(
      startWith(0),
      map(() => this.collectCurrentMetrics())
    ).subscribe(metrics => {
      this.metricsSubject.next(metrics);
    });
  }

  private collectCurrentMetrics(): PerformanceMetrics {
    const loadTime = this.calculateLoadTime();
    const renderTime = this.calculateAverageFrameTime();
    const memoryUsage = this.getMemoryUsage();
    const networkLatency = this.calculateNetworkLatency();
    const cacheHitRate = this.calculateCacheHitRate();
    const errorRate = this.calculateErrorRate();
    const userInteractionDelay = this.calculateAverageInteractionDelay();

    return {
      loadTime,
      renderTime,
      memoryUsage,
      networkLatency,
      cacheHitRate,
      errorRate,
      userInteractionDelay
    };
  }

  private calculateLoadTime(): number {
    if (this.navigationTiming) {
      return this.navigationTiming.loadEventEnd - this.navigationTiming.fetchStart;
    }
    return 0;
  }

  private calculateAverageFrameTime(): number {
    // Estimate based on animation frame timing
    if (window.performance && window.performance.now) {
      const start = performance.now();
      requestAnimationFrame(() => {
        const frameTime = performance.now() - start;
        return frameTime;
      });
    }
    return 16; // Default to 60fps target
  }

  private getMemoryUsage(): number {
    if ('memory' in window.performance) {
      const memory = (window.performance as any).memory;
      return memory.usedJSHeapSize || 0;
    }
    return 0;
  }

  private calculateNetworkLatency(): number {
    if (this.resourceTimings.length > 0) {
      const latencies = this.resourceTimings.map(timing => 
        timing.responseStart - timing.requestStart
      ).filter(latency => latency > 0);
      
      if (latencies.length > 0) {
        return latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length;
      }
    }
    return 0;
  }

  private calculateCacheHitRate(): number {
    if (this.resourceTimings.length === 0) return 0;
    
    const cachedResources = this.resourceTimings.filter(timing => 
      timing.transferSize === 0 && timing.decodedBodySize > 0
    );
    
    return (cachedResources.length / this.resourceTimings.length) * 100;
  }

  private calculateErrorRate(): number {
    // This would typically be calculated based on error tracking
    // For now, return 0 as a placeholder
    return 0;
  }

  private calculateAverageInteractionDelay(): number {
    if (this.interactionTimings.length === 0) return 0;
    
    const sum = this.interactionTimings.reduce((acc, timing) => acc + timing, 0);
    return sum / this.interactionTimings.length;
  }

  private handleNavigationEntry(entry: PerformanceNavigationTiming): void {
    this.navigationTiming = entry;
  }

  private handleResourceEntry(entry: PerformanceResourceTiming): void {
    this.resourceTimings.push(entry);
    
    // Keep only last 100 resource timings
    if (this.resourceTimings.length > 100) {
      this.resourceTimings = this.resourceTimings.slice(-100);
    }
  }

  private handleMeasureEntry(entry: PerformanceEntry): void {
    console.log('Custom measure:', entry.name, entry.duration);
  }

  private handlePaintEntry(entry: PerformanceEntry): void {
    if (entry.name === 'first-contentful-paint') {
      this.updateWebVital('fcp', entry.startTime);
    }
  }

  private updateWebVital(vital: keyof CoreWebVitals, value: number): void {
    const currentVitals = this.webVitalsSubject.value;
    this.webVitalsSubject.next({
      ...currentVitals,
      [vital]: value
    });
  }

  // Public API
  getMetrics(): Observable<PerformanceMetrics> {
    return this.metricsSubject.asObservable();
  }

  getWebVitals(): Observable<CoreWebVitals> {
    return this.webVitalsSubject.asObservable();
  }

  getCurrentMetrics(): PerformanceMetrics {
    return this.metricsSubject.value;
  }

  getCurrentWebVitals(): CoreWebVitals {
    return this.webVitalsSubject.value;
  }

  isPerformanceGood(): boolean {
    const metrics = this.getCurrentMetrics();
    const vitals = this.getCurrentWebVitals();

    return (
      metrics.loadTime <= this.thresholds.loadTime &&
      metrics.renderTime <= this.thresholds.renderTime &&
      metrics.memoryUsage <= this.thresholds.memoryUsage &&
      metrics.networkLatency <= this.thresholds.networkLatency &&
      vitals.lcp <= this.thresholds.lcp &&
      vitals.fid <= this.thresholds.fid &&
      vitals.cls <= this.thresholds.cls
    );
  }

  getPerformanceScore(): number {
    const metrics = this.getCurrentMetrics();
    const vitals = this.getCurrentWebVitals();
    
    let score = 100;
    
    // Deduct points for poor metrics
    if (metrics.loadTime > this.thresholds.loadTime) score -= 20;
    if (metrics.renderTime > this.thresholds.renderTime) score -= 10;
    if (metrics.memoryUsage > this.thresholds.memoryUsage) score -= 15;
    if (metrics.networkLatency > this.thresholds.networkLatency) score -= 10;
    if (vitals.lcp > this.thresholds.lcp) score -= 20;
    if (vitals.fid > this.thresholds.fid) score -= 15;
    if (vitals.cls > this.thresholds.cls) score -= 10;
    
    return Math.max(0, score);
  }

  mark(name: string): void {
    if (window.performance && window.performance.mark) {
      window.performance.mark(name);
    }
  }

  measure(name: string, startMark: string, endMark?: string): number {
    if (window.performance && window.performance.measure && window.performance.getEntriesByName) {
      try {
        if (endMark) {
          window.performance.measure(name, startMark, endMark);
        } else {
          window.performance.measure(name, startMark);
        }
        
        const measures = window.performance.getEntriesByName(name, 'measure');
        return measures.length > 0 ? measures[measures.length - 1].duration : 0;
      } catch (error) {
        console.warn('Performance measure failed:', error);
        return 0;
      }
    }
    return 0;
  }

  clearMarks(name?: string): void {
    if (window.performance && window.performance.clearMarks) {
      window.performance.clearMarks(name);
    }
  }

  clearMeasures(name?: string): void {
    if (window.performance && window.performance.clearMeasures) {
      window.performance.clearMeasures(name);
    }
  }

  updateThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  getThresholds(): PerformanceThresholds {
    return { ...this.thresholds };
  }

  generatePerformanceReport(): any {
    const metrics = this.getCurrentMetrics();
    const vitals = this.getCurrentWebVitals();
    const score = this.getPerformanceScore();
    
    return {
      timestamp: new Date().toISOString(),
      score,
      metrics,
      vitals,
      thresholds: this.thresholds,
      recommendations: this.generateRecommendations(metrics, vitals)
    };
  }

  private generateRecommendations(metrics: PerformanceMetrics, vitals: CoreWebVitals): string[] {
    const recommendations: string[] = [];
    
    if (metrics.loadTime > this.thresholds.loadTime) {
      recommendations.push('Consider implementing code splitting and lazy loading');
    }
    
    if (metrics.memoryUsage > this.thresholds.memoryUsage) {
      recommendations.push('Optimize memory usage by implementing proper cleanup and avoiding memory leaks');
    }
    
    if (vitals.lcp > this.thresholds.lcp) {
      recommendations.push('Optimize Largest Contentful Paint by preloading critical resources');
    }
    
    if (vitals.fid > this.thresholds.fid) {
      recommendations.push('Improve First Input Delay by reducing JavaScript execution time');
    }
    
    if (vitals.cls > this.thresholds.cls) {
      recommendations.push('Reduce Cumulative Layout Shift by specifying image dimensions and avoiding dynamic content insertion');
    }
    
    if (metrics.cacheHitRate < 80) {
      recommendations.push('Improve caching strategy to increase cache hit rate');
    }
    
    return recommendations;
  }

  ngOnDestroy(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
  }
}