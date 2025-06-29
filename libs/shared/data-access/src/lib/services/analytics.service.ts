import { Injectable, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface AnalyticsEvent {
  type: string;
  properties: Record<string, any>;
  userId?: string;
  sessionId: string;
  timestamp: Date;
  page?: string;
  userAgent?: string;
  referrer?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private router = inject(Router);
  private apiService = inject(ApiService);
  
  private sessionId: string;
  private userId?: string;
  private eventQueue: AnalyticsEvent[] = [];
  private flushInterval = 10000; // 10 seconds
  private maxQueueSize = 50;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializePageTracking();
    this.startEventFlushTimer();
  }

  /**
   * Set the current user ID for tracking
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Clear the user ID (on logout)
   */
  clearUserId(): void {
    this.userId = undefined;
  }

  /**
   * Track a custom event
   */
  trackEvent(type: string, properties: Record<string, any> = {}): void {
    const event: AnalyticsEvent = {
      type,
      properties,
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date(),
      page: this.getCurrentPage(),
      userAgent: navigator.userAgent,
      referrer: document.referrer
    };

    this.queueEvent(event);
  }

  /**
   * Track page view
   */
  trackPageView(page: string, properties: Record<string, any> = {}): void {
    this.trackEvent('page_view', {
      page,
      title: document.title,
      ...properties
    });
  }

  /**
   * Track form submission
   */
  trackFormSubmission(formName: string, properties: Record<string, any> = {}): void {
    this.trackEvent('form_submit', {
      form_name: formName,
      ...properties
    });
  }

  /**
   * Track conversion events (leads, purchases, etc.)
   */
  trackConversion(conversionType: string, value?: number, properties: Record<string, any> = {}): void {
    this.trackEvent('conversion', {
      conversion_type: conversionType,
      value,
      currency: 'USD',
      ...properties
    });
  }

  /**
   * Track button clicks
   */
  trackButtonClick(buttonName: string, properties: Record<string, any> = {}): void {
    this.trackEvent('button_click', {
      button_name: buttonName,
      ...properties
    });
  }

  /**
   * Track video interactions
   */
  trackVideoEvent(action: 'play' | 'pause' | 'complete', videoId: string, progress?: number): void {
    this.trackEvent('video_interaction', {
      action,
      video_id: videoId,
      progress: progress || 0
    });
  }

  /**
   * Track search events
   */
  trackSearch(query: string, results: number, properties: Record<string, any> = {}): void {
    this.trackEvent('search', {
      query,
      results_count: results,
      ...properties
    });
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metricName: string, value: number, unit: string = 'ms'): void {
    this.trackEvent('performance', {
      metric_name: metricName,
      value,
      unit
    });
  }

  /**
   * Track errors
   */
  trackError(errorType: string, message: string, properties: Record<string, any> = {}): void {
    this.trackEvent('error', {
      error_type: errorType,
      message,
      stack: properties.stack,
      ...properties
    });
  }

  /**
   * Get Core Web Vitals and track them
   */
  trackCoreWebVitals(): void {
    // Track Largest Contentful Paint (LCP)
    this.observePerformanceEntry('largest-contentful-paint', (entry: any) => {
      this.trackPerformance('lcp', Math.round(entry.startTime));
    });

    // Track First Input Delay (FID)
    this.observePerformanceEntry('first-input', (entry: any) => {
      this.trackPerformance('fid', Math.round(entry.processingStart - entry.startTime));
    });

    // Track Cumulative Layout Shift (CLS)
    this.observePerformanceEntry('layout-shift', (entry: any) => {
      if (!entry.hadRecentInput) {
        this.trackPerformance('cls', entry.value, 'score');
      }
    });
  }

  /**
   * Flush events immediately
   */
  flush(): void {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    this.apiService.post('/api/analytics/events', { events }).subscribe({
      error: (error) => {
        console.error('Failed to send analytics events:', error);
        // Re-queue events if API call fails
        this.eventQueue.unshift(...events);
      }
    });
  }

  /**
   * Initialize automatic page view tracking
   */
  private initializePageTracking(): void {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.trackPageView(event.urlAfterRedirects);
      });
  }

  /**
   * Queue an event for batch sending
   */
  private queueEvent(event: AnalyticsEvent): void {
    this.eventQueue.push(event);

    // Flush immediately if queue is full
    if (this.eventQueue.length >= this.maxQueueSize) {
      this.flush();
    }
  }

  /**
   * Start timer to flush events periodically
   */
  private startEventFlushTimer(): void {
    setInterval(() => {
      this.flush();
    }, this.flushInterval);

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flush();
    });
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get the current page path
   */
  private getCurrentPage(): string {
    return window.location.pathname;
  }

  /**
   * Observe performance entries for Core Web Vitals
   */
  private observePerformanceEntry(entryType: string, callback: (entry: any) => void): void {
    if ('PerformanceObserver' in window) {
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
  }
}