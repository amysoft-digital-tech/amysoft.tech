import { Injectable } from '@angular/core';
import { BehaviorSubject, interval, fromEvent } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Platform } from '@ionic/angular';

// Privacy-compliant analytics service for PWA
@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private readonly API_BASE = '/api/analytics';
  private sessionId: string = '';
  private userId: string | null = null;
  private sessionStartTime: number = Date.now();
  private isTrackingEnabled = false;
  private pageStartTime: number = Date.now();
  private currentPage: string = '';
  
  // Privacy settings
  private privacySettings = {
    analyticsEnabled: false,
    personalizedAds: false,
    performanceTracking: true,
    errorReporting: true
  };

  // Session metrics
  private sessionMetrics = {
    pageViews: 0,
    chaptersViewed: new Set<string>(),
    templatesUsed: new Set<string>(),
    searchQueries: [] as string[],
    scrollDepth: 0,
    timeOnPage: {} as Record<string, number>,
    interactions: [] as any[]
  };

  // Learning progress tracking
  private learningMetrics = {
    chaptersStarted: new Set<string>(),
    chaptersCompleted: new Set<string>(),
    principlesMastered: new Set<string>(),
    templatesBookmarked: new Set<string>(),
    learningStreak: 0,
    timeSpentLearning: 0
  };

  // Performance metrics
  private performanceMetrics = {
    pageLoadTimes: {} as Record<string, number>,
    apiResponseTimes: {} as Record<string, number>,
    errorCount: 0,
    offlineEvents: 0,
    pwaInstalled: false,
    serviceWorkerEvents: [] as any[]
  };

  constructor(
    private http: HttpClient,
    private platform: Platform
  ) {
    this.initializeAnalytics();
  }

  // Initialize analytics with privacy controls
  private async initializeAnalytics(): Promise<void> {
    // Load privacy preferences from storage
    await this.loadPrivacySettings();
    
    // Generate session ID
    this.sessionId = this.generateSessionId();
    
    // Setup performance monitoring if enabled
    if (this.privacySettings.performanceTracking) {
      this.setupPerformanceMonitoring();
    }
    
    // Setup error tracking if enabled
    if (this.privacySettings.errorReporting) {
      this.setupErrorTracking();
    }
    
    // Track page visibility changes
    this.setupVisibilityTracking();
    
    // Setup offline/online tracking
    this.setupConnectivityTracking();
    
    // Track PWA installation
    this.setupPWATracking();
    
    console.log('[Analytics] Initialized with privacy controls');
  }

  // Privacy Control Methods
  async updatePrivacySettings(settings: Partial<typeof this.privacySettings>): Promise<void> {
    this.privacySettings = { ...this.privacySettings, ...settings };
    await this.savePrivacySettings();
    
    this.isTrackingEnabled = this.privacySettings.analyticsEnabled;
    
    if (!this.isTrackingEnabled) {
      this.clearStoredData();
    }
  }

  getPrivacySettings() {
    return { ...this.privacySettings };
  }

  // User identification (only with consent)
  setUserId(userId: string): void {
    if (this.privacySettings.analyticsEnabled) {
      this.userId = userId;
    }
  }

  // Page tracking
  trackPageView(page: string, title?: string): void {
    if (!this.isTrackingEnabled) return;

    // Record time spent on previous page
    if (this.currentPage) {
      const timeSpent = Date.now() - this.pageStartTime;
      this.sessionMetrics.timeOnPage[this.currentPage] = 
        (this.sessionMetrics.timeOnPage[this.currentPage] || 0) + timeSpent;
    }

    // Start tracking new page
    this.currentPage = page;
    this.pageStartTime = Date.now();
    this.sessionMetrics.pageViews++;

    this.trackEvent('page_view', {
      page,
      title,
      timestamp: Date.now(),
      sessionId: this.sessionId
    });
  }

  // Learning progress tracking
  trackChapterStart(chapterId: string, principle: string): void {
    if (!this.isTrackingEnabled) return;

    this.sessionMetrics.chaptersViewed.add(chapterId);
    this.learningMetrics.chaptersStarted.add(chapterId);

    this.trackEvent('chapter_start', {
      chapterId,
      principle,
      timestamp: Date.now(),
      sessionId: this.sessionId
    });
  }

  trackChapterComplete(chapterId: string, principle: string, timeSpent: number): void {
    if (!this.isTrackingEnabled) return;

    this.learningMetrics.chaptersCompleted.add(chapterId);
    this.learningMetrics.timeSpentLearning += timeSpent;

    // Check if principle is mastered (all chapters completed)
    this.checkPrincipleMastery(principle);

    this.trackEvent('chapter_complete', {
      chapterId,
      principle,
      timeSpent,
      timestamp: Date.now(),
      sessionId: this.sessionId
    });
  }

  trackTemplateUsage(templateId: string, category: string, action: 'view' | 'copy' | 'bookmark'): void {
    if (!this.isTrackingEnabled) return;

    if (action === 'copy' || action === 'bookmark') {
      this.sessionMetrics.templatesUsed.add(templateId);
    }
    
    if (action === 'bookmark') {
      this.learningMetrics.templatesBookmarked.add(templateId);
    }

    this.trackEvent('template_usage', {
      templateId,
      category,
      action,
      timestamp: Date.now(),
      sessionId: this.sessionId
    });
  }

  trackSearchQuery(query: string, resultsCount: number): void {
    if (!this.isTrackingEnabled) return;

    this.sessionMetrics.searchQueries.push(query);

    this.trackEvent('search_query', {
      query: this.sanitizeSearchQuery(query),
      resultsCount,
      timestamp: Date.now(),
      sessionId: this.sessionId
    });
  }

  // User interaction tracking
  trackInteraction(element: string, action: string, value?: any): void {
    if (!this.isTrackingEnabled) return;

    const interaction = {
      element,
      action,
      value,
      page: this.currentPage,
      timestamp: Date.now()
    };

    this.sessionMetrics.interactions.push(interaction);

    // Batch interactions to reduce API calls
    if (this.sessionMetrics.interactions.length >= 10) {
      this.flushInteractions();
    }
  }

  // Scroll depth tracking
  trackScrollDepth(depth: number): void {
    if (!this.isTrackingEnabled) return;

    if (depth > this.sessionMetrics.scrollDepth) {
      this.sessionMetrics.scrollDepth = depth;
    }

    // Track significant scroll milestones
    if (depth >= 25 && depth < 50) {
      this.trackEvent('scroll_depth', { depth: 25, page: this.currentPage });
    } else if (depth >= 50 && depth < 75) {
      this.trackEvent('scroll_depth', { depth: 50, page: this.currentPage });
    } else if (depth >= 75 && depth < 90) {
      this.trackEvent('scroll_depth', { depth: 75, page: this.currentPage });
    } else if (depth >= 90) {
      this.trackEvent('scroll_depth', { depth: 90, page: this.currentPage });
    }
  }

  // Performance tracking
  trackPerformance(metric: string, value: number, page?: string): void {
    if (!this.privacySettings.performanceTracking) return;

    const performanceData = {
      metric,
      value,
      page: page || this.currentPage,
      timestamp: Date.now(),
      sessionId: this.sessionId
    };

    if (metric.includes('page_load')) {
      this.performanceMetrics.pageLoadTimes[page || this.currentPage] = value;
    } else if (metric.includes('api_response')) {
      this.performanceMetrics.apiResponseTimes[metric] = value;
    }

    this.sendAnalyticsData('performance', performanceData);
  }

  // Error tracking
  trackError(error: any, context?: string): void {
    if (!this.privacySettings.errorReporting) return;

    this.performanceMetrics.errorCount++;

    const errorData = {
      message: error.message || 'Unknown error',
      stack: error.stack ? this.sanitizeStackTrace(error.stack) : null,
      context: context || this.currentPage,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      sessionId: this.sessionId
    };

    this.sendAnalyticsData('error', errorData);
  }

  // Conversion tracking
  trackConversion(event: string, value?: number, properties?: Record<string, any>): void {
    if (!this.isTrackingEnabled) return;

    this.trackEvent('conversion', {
      event,
      value,
      properties,
      timestamp: Date.now(),
      sessionId: this.sessionId
    });
  }

  // Core event tracking
  private trackEvent(eventType: string, data: any): void {
    const event = {
      type: eventType,
      data,
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: Date.now(),
      page: this.currentPage,
      device: this.getDeviceInfo(),
      location: this.getLocationInfo()
    };

    this.sendAnalyticsData('event', event);
  }

  // Batch send analytics data
  private sendAnalyticsData(type: string, data: any): void {
    if (!this.isTrackingEnabled && type !== 'performance' && type !== 'error') return;

    // Use sendBeacon for reliability, fallback to fetch
    const payload = JSON.stringify({
      type,
      data,
      timestamp: Date.now()
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon(`${this.API_BASE}/${type}`, payload);
    } else {
      this.http.post(`${this.API_BASE}/${type}`, data).subscribe({
        error: (error) => console.warn('[Analytics] Failed to send data:', error)
      });
    }
  }

  // Session management
  endSession(): void {
    const sessionDuration = Date.now() - this.sessionStartTime;
    
    // Record final page time
    if (this.currentPage) {
      const timeSpent = Date.now() - this.pageStartTime;
      this.sessionMetrics.timeOnPage[this.currentPage] = 
        (this.sessionMetrics.timeOnPage[this.currentPage] || 0) + timeSpent;
    }

    // Flush any remaining interactions
    this.flushInteractions();

    // Send session summary
    const sessionSummary = {
      sessionId: this.sessionId,
      userId: this.userId,
      duration: sessionDuration,
      pageViews: this.sessionMetrics.pageViews,
      chaptersViewed: Array.from(this.sessionMetrics.chaptersViewed),
      templatesUsed: Array.from(this.sessionMetrics.templatesUsed),
      searchQueriesCount: this.sessionMetrics.searchQueries.length,
      maxScrollDepth: this.sessionMetrics.scrollDepth,
      totalInteractions: this.sessionMetrics.interactions.length,
      timeOnPage: this.sessionMetrics.timeOnPage,
      learningMetrics: {
        chaptersStarted: Array.from(this.learningMetrics.chaptersStarted),
        chaptersCompleted: Array.from(this.learningMetrics.chaptersCompleted),
        principlesMastered: Array.from(this.learningMetrics.principlesMastered),
        templatesBookmarked: Array.from(this.learningMetrics.templatesBookmarked),
        timeSpentLearning: this.learningMetrics.timeSpentLearning
      },
      performanceMetrics: this.performanceMetrics,
      timestamp: Date.now()
    };

    this.sendAnalyticsData('session_end', sessionSummary);
  }

  // Device and environment detection
  private getDeviceInfo() {
    return {
      type: this.platform.is('mobile') ? 'mobile' : 
            this.platform.is('tablet') ? 'tablet' : 'desktop',
      platform: this.platform.platforms().join(','),
      screenResolution: `${screen.width}x${screen.height}`,
      userAgent: navigator.userAgent,
      isPWA: this.isPWAMode(),
      isOffline: !navigator.onLine
    };
  }

  private getLocationInfo() {
    return {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language
    };
  }

  private isPWAMode(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone ||
           document.referrer.includes('android-app://');
  }

  // Privacy and data sanitization
  private sanitizeSearchQuery(query: string): string {
    // Remove potentially sensitive information
    return query
      .toLowerCase()
      .replace(/\b\d{4,}\b/g, '[number]') // Replace long numbers
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[email]') // Replace emails
      .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[ip]'); // Replace IP addresses
  }

  private sanitizeStackTrace(stack: string): string {
    return stack
      .split('\n')
      .slice(0, 5) // Limit stack trace depth
      .map(line => line.replace(/https?:\/\/[^\s)]+/g, '[url]')) // Replace URLs
      .join('\n');
  }

  // Helper methods
  private generateSessionId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private checkPrincipleMastery(principle: string): void {
    // Logic to determine if all chapters for a principle are completed
    // This would integrate with your content structure
    // For now, simplified implementation
    this.learningMetrics.principlesMastered.add(principle);
  }

  private flushInteractions(): void {
    if (this.sessionMetrics.interactions.length === 0) return;

    this.sendAnalyticsData('interactions', {
      sessionId: this.sessionId,
      interactions: this.sessionMetrics.interactions,
      timestamp: Date.now()
    });

    this.sessionMetrics.interactions = [];
  }

  // Setup methods for different tracking types
  private setupPerformanceMonitoring(): void {
    // Navigation timing
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        this.trackPerformance('page_load_time', perfData.loadEventEnd - perfData.fetchStart);
        this.trackPerformance('dom_content_loaded', perfData.domContentLoadedEventEnd - perfData.fetchStart);
      }, 0);
    });

    // Core Web Vitals
    this.observeWebVitals();
  }

  private observeWebVitals(): void {
    // Largest Contentful Paint
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.trackPerformance('largest_contentful_paint', lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay
    new PerformanceObserver((entryList) => {
      const firstInput = entryList.getEntries()[0] as PerformanceEventTiming;
      this.trackPerformance('first_input_delay', firstInput.processingStart - firstInput.startTime);
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      this.trackPerformance('cumulative_layout_shift', clsValue);
    }).observe({ entryTypes: ['layout-shift'] });
  }

  private setupErrorTracking(): void {
    window.addEventListener('error', (event) => {
      this.trackError(event.error, 'global_error');
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(event.reason, 'unhandled_promise_rejection');
    });
  }

  private setupVisibilityTracking(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEvent('page_hidden', { page: this.currentPage });
      } else {
        this.trackEvent('page_visible', { page: this.currentPage });
      }
    });
  }

  private setupConnectivityTracking(): void {
    window.addEventListener('online', () => {
      this.trackEvent('connectivity_change', { status: 'online' });
    });

    window.addEventListener('offline', () => {
      this.performanceMetrics.offlineEvents++;
      this.trackEvent('connectivity_change', { status: 'offline' });
    });
  }

  private setupPWATracking(): void {
    window.addEventListener('beforeinstallprompt', (event) => {
      this.trackEvent('pwa_install_prompt_shown', {});
    });

    window.addEventListener('appinstalled', (event) => {
      this.performanceMetrics.pwaInstalled = true;
      this.trackEvent('pwa_installed', {});
    });
  }

  // Storage methods for privacy settings
  private async loadPrivacySettings(): Promise<void> {
    try {
      const stored = localStorage.getItem('analytics_privacy_settings');
      if (stored) {
        this.privacySettings = { ...this.privacySettings, ...JSON.parse(stored) };
      }
      this.isTrackingEnabled = this.privacySettings.analyticsEnabled;
    } catch (error) {
      console.warn('[Analytics] Failed to load privacy settings:', error);
    }
  }

  private async savePrivacySettings(): Promise<void> {
    try {
      localStorage.setItem('analytics_privacy_settings', JSON.stringify(this.privacySettings));
    } catch (error) {
      console.warn('[Analytics] Failed to save privacy settings:', error);
    }
  }

  private clearStoredData(): void {
    try {
      localStorage.removeItem('analytics_privacy_settings');
      sessionStorage.clear();
    } catch (error) {
      console.warn('[Analytics] Failed to clear stored data:', error);
    }
  }
}