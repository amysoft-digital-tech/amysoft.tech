import { Injectable, ErrorHandler } from '@angular/core';
import { AnalyticsService } from '@amysoft/shared-data-access';

export interface ErrorMonitoringConfig {
  environment: 'development' | 'staging' | 'production';
  apiEndpoint: string;
  enableSourceMaps: boolean;
  enableUserContext: boolean;
  enablePerformanceMonitoring: boolean;
  enableNetworkMonitoring: boolean;
  sampleRate: number;
  ignoreErrors: (string | RegExp)[];
  alertThresholds: AlertThreshold[];
}

export interface AlertThreshold {
  id: string;
  name: string;
  metric: 'error_rate' | 'response_time' | 'availability' | 'core_web_vitals';
  threshold: number;
  timeWindow: number; // minutes
  severity: 'low' | 'medium' | 'high' | 'critical';
  notificationChannels: NotificationChannel[];
}

export interface NotificationChannel {
  type: 'email' | 'slack' | 'webhook' | 'sms';
  config: Record<string, any>;
  enabled: boolean;
}

export interface ErrorReport {
  id: string;
  timestamp: Date;
  message: string;
  stack: string;
  url: string;
  userAgent: string;
  userId?: string;
  sessionId: string;
  errorType: 'javascript' | 'network' | 'csp' | 'unhandled_promise';
  severity: 'error' | 'warning' | 'info';
  context: ErrorContext;
  breadcrumbs: Breadcrumb[];
}

export interface ErrorContext {
  componentName?: string;
  routePath?: string;
  userTier?: string;
  experimentVariant?: string;
  deviceInfo: DeviceInfo;
  performanceMetrics: PerformanceMetrics;
}

export interface DeviceInfo {
  screenResolution: string;
  viewportSize: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  browserName: string;
  browserVersion: string;
  osName: string;
  osVersion: string;
}

export interface PerformanceMetrics {
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;
}

export interface Breadcrumb {
  timestamp: Date;
  category: 'navigation' | 'user_action' | 'api_call' | 'console' | 'dom';
  message: string;
  data?: Record<string, any>;
}

export interface PerformanceAlert {
  id: string;
  timestamp: Date;
  metric: string;
  value: number;
  threshold: number;
  severity: string;
  affectedUsers: number;
  context: Record<string, any>;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorMonitoringService implements ErrorHandler {
  
  private config: ErrorMonitoringConfig = {
    environment: 'production',
    apiEndpoint: '/api/errors',
    enableSourceMaps: true,
    enableUserContext: true,
    enablePerformanceMonitoring: true,
    enableNetworkMonitoring: true,
    sampleRate: 1.0,
    ignoreErrors: [
      // Common non-critical errors to ignore
      /Non-Error promise rejection captured/i,
      /ResizeObserver loop limit exceeded/i,
      /Script error/i,
      /Network request failed/i,
      /Loading chunk \d+ failed/i,
      /ChunkLoadError/i,
      /Loading CSS chunk/i,
      /Uncaught ReferenceError: gtag is not defined/i
    ],
    alertThresholds: [
      {
        id: 'high_error_rate',
        name: 'High JavaScript Error Rate',
        metric: 'error_rate',
        threshold: 5, // 5% error rate
        timeWindow: 10,
        severity: 'high',
        notificationChannels: [
          {
            type: 'email',
            config: { recipients: ['alerts@amysoft.tech'] },
            enabled: true
          },
          {
            type: 'slack',
            config: { 
              webhook: process.env['SLACK_WEBHOOK_URL'],
              channel: '#alerts'
            },
            enabled: true
          }
        ]
      },
      {
        id: 'slow_response_time',
        name: 'Slow API Response Time',
        metric: 'response_time',
        threshold: 2000, // 2 seconds
        timeWindow: 5,
        severity: 'medium',
        notificationChannels: [
          {
            type: 'email',
            config: { recipients: ['performance@amysoft.tech'] },
            enabled: true
          }
        ]
      },
      {
        id: 'poor_core_web_vitals',
        name: 'Poor Core Web Vitals',
        metric: 'core_web_vitals',
        threshold: 2500, // LCP > 2.5s
        timeWindow: 15,
        severity: 'medium',
        notificationChannels: [
          {
            type: 'slack',
            config: { 
              webhook: process.env['SLACK_WEBHOOK_URL'],
              channel: '#performance'
            },
            enabled: true
          }
        ]
      },
      {
        id: 'low_availability',
        name: 'Low Website Availability',
        metric: 'availability',
        threshold: 99, // Below 99% availability
        timeWindow: 30,
        severity: 'critical',
        notificationChannels: [
          {
            type: 'email',
            config: { recipients: ['critical@amysoft.tech'] },
            enabled: true
          },
          {
            type: 'sms',
            config: { numbers: ['+1234567890'] },
            enabled: true
          }
        ]
      }
    ]
  };

  private breadcrumbs: Breadcrumb[] = [];
  private sessionId: string;
  private performanceObserver?: PerformanceObserver;

  constructor(private analyticsService: AnalyticsService) {
    this.sessionId = this.generateSessionId();
    this.initializeMonitoring();
  }

  handleError(error: any): void {
    console.error('Unhandled error:', error);
    
    if (this.shouldIgnoreError(error)) {
      return;
    }

    const errorReport = this.createErrorReport(error);
    this.reportError(errorReport);
  }

  private initializeMonitoring(): void {
    this.setupGlobalErrorHandlers();
    this.setupPerformanceMonitoring();
    this.setupNetworkMonitoring();
    this.setupPromiseRejectionHandler();
  }

  private setupGlobalErrorHandlers(): void {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      const errorReport = this.createErrorReport({
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
      this.reportError(errorReport);
    });

    // CSP violations
    window.addEventListener('securitypolicyviolation', (event) => {
      const errorReport = this.createErrorReport({
        message: `CSP Violation: ${event.violatedDirective}`,
        filename: event.sourceFile,
        lineno: event.lineNumber,
        error: {
          blockedURI: event.blockedURI,
          violatedDirective: event.violatedDirective,
          originalPolicy: event.originalPolicy
        }
      });
      errorReport.errorType = 'csp';
      this.reportError(errorReport);
    });
  }

  private setupPromiseRejectionHandler(): void {
    window.addEventListener('unhandledrejection', (event) => {
      const errorReport = this.createErrorReport({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        error: event.reason
      });
      errorReport.errorType = 'unhandled_promise';
      this.reportError(errorReport);
    });
  }

  private setupPerformanceMonitoring(): void {
    if (!this.config.enablePerformanceMonitoring) return;

    // Core Web Vitals monitoring
    this.observeWebVitals();
    
    // Resource timing monitoring
    this.monitorResourceTiming();
    
    // Navigation timing monitoring
    this.monitorNavigationTiming();
  }

  private observeWebVitals(): void {
    // LCP (Largest Contentful Paint)
    this.observeMetric('largest-contentful-paint', (entry: any) => {
      const lcp = Math.round(entry.startTime);
      this.trackPerformanceMetric('lcp', lcp);
      
      if (lcp > 2500) {
        this.triggerPerformanceAlert('lcp', lcp, 2500);
      }
    });

    // FID (First Input Delay)
    this.observeMetric('first-input', (entry: any) => {
      const fid = Math.round(entry.processingStart - entry.startTime);
      this.trackPerformanceMetric('fid', fid);
      
      if (fid > 100) {
        this.triggerPerformanceAlert('fid', fid, 100);
      }
    });

    // CLS (Cumulative Layout Shift)
    this.observeMetric('layout-shift', (entry: any) => {
      if (!entry.hadRecentInput) {
        const cls = entry.value;
        this.trackPerformanceMetric('cls', cls);
        
        if (cls > 0.1) {
          this.triggerPerformanceAlert('cls', cls, 0.1);
        }
      }
    });
  }

  private observeMetric(entryType: string, callback: (entry: any) => void): void {
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(callback);
      });
      observer.observe({ entryTypes: [entryType] });
    } catch (error) {
      console.warn(`Performance observer for ${entryType} not supported:`, error);
    }
  }

  private monitorResourceTiming(): void {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        const resource = entry as PerformanceResourceTiming;
        
        // Alert on slow resources
        if (resource.responseEnd - resource.requestStart > 5000) {
          this.addBreadcrumb({
            timestamp: new Date(),
            category: 'api_call',
            message: `Slow resource: ${resource.name}`,
            data: {
              duration: resource.responseEnd - resource.requestStart,
              size: resource.transferSize
            }
          });
        }
      });
    });
    
    observer.observe({ entryTypes: ['resource'] });
  }

  private monitorNavigationTiming(): void {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        const metrics = {
          loadTime: navigation.loadEventEnd - navigation.navigationStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
          firstByte: navigation.responseStart - navigation.navigationStart
        };
        
        // Alert on slow page loads
        if (metrics.loadTime > 3000) {
          this.triggerPerformanceAlert('page_load', metrics.loadTime, 3000);
        }
        
        this.trackPerformanceMetric('page_load_metrics', metrics);
      }, 0);
    });
  }

  private setupNetworkMonitoring(): void {
    if (!this.config.enableNetworkMonitoring) return;

    // Monitor fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.addBreadcrumb({
          timestamp: new Date(),
          category: 'api_call',
          message: `Fetch: ${args[0]}`,
          data: {
            status: response.status,
            duration: duration,
            url: args[0]
          }
        });
        
        // Alert on slow API calls
        if (duration > 2000) {
          this.triggerPerformanceAlert('api_response_time', duration, 2000);
        }
        
        return response;
      } catch (error) {
        this.addBreadcrumb({
          timestamp: new Date(),
          category: 'api_call',
          message: `Fetch Error: ${args[0]}`,
          data: {
            error: error,
            url: args[0]
          }
        });
        throw error;
      }
    };
  }

  private createErrorReport(error: any): ErrorReport {
    return {
      id: this.generateErrorId(),
      timestamp: new Date(),
      message: error.message || 'Unknown error',
      stack: error.stack || error.error?.stack || '',
      url: window.location.href,
      userAgent: navigator.userAgent,
      sessionId: this.sessionId,
      errorType: 'javascript',
      severity: 'error',
      context: this.gatherContext(),
      breadcrumbs: [...this.breadcrumbs]
    };
  }

  private gatherContext(): ErrorContext {
    const deviceInfo = this.getDeviceInfo();
    const performanceMetrics = this.getPerformanceMetrics();
    
    return {
      routePath: window.location.pathname,
      deviceInfo,
      performanceMetrics
    };
  }

  private getDeviceInfo(): DeviceInfo {
    const userAgent = navigator.userAgent;
    
    return {
      screenResolution: `${screen.width}x${screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      deviceType: this.getDeviceType(),
      browserName: this.getBrowserName(userAgent),
      browserVersion: this.getBrowserVersion(userAgent),
      osName: this.getOSName(userAgent),
      osVersion: this.getOSVersion(userAgent)
    };
  }

  private getPerformanceMetrics(): PerformanceMetrics {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    return {
      loadTime: navigation ? navigation.loadEventEnd - navigation.navigationStart : 0,
      firstContentfulPaint: this.getMetricValue('first-contentful-paint'),
      largestContentfulPaint: this.getMetricValue('largest-contentful-paint'),
      firstInputDelay: this.getMetricValue('first-input'),
      cumulativeLayoutShift: this.getMetricValue('layout-shift'),
      timeToInteractive: this.getMetricValue('time-to-interactive') || 0
    };
  }

  private getMetricValue(metricName: string): number {
    try {
      const entries = performance.getEntriesByType('measure').filter(e => e.name.includes(metricName));
      return entries.length > 0 ? entries[0].duration : 0;
    } catch {
      return 0;
    }
  }

  private shouldIgnoreError(error: any): boolean {
    const message = error.message || error.toString();
    return this.config.ignoreErrors.some(pattern => {
      if (pattern instanceof RegExp) {
        return pattern.test(message);
      }
      return message.includes(pattern);
    });
  }

  private reportError(errorReport: ErrorReport): void {
    // Sample based on configuration
    if (Math.random() > this.config.sampleRate) {
      return;
    }

    // Send to backend
    this.sendErrorReport(errorReport);
    
    // Track in analytics
    this.analyticsService.trackEvent('error_occurred', {
      error_id: errorReport.id,
      error_type: errorReport.errorType,
      error_message: errorReport.message,
      url: errorReport.url,
      user_agent: errorReport.userAgent,
      severity: errorReport.severity
    });
  }

  private async sendErrorReport(errorReport: ErrorReport): Promise<void> {
    try {
      await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorReport)
      });
    } catch (error) {
      console.error('Failed to send error report:', error);
    }
  }

  private trackPerformanceMetric(metric: string, value: any): void {
    this.analyticsService.trackEvent('performance_metric', {
      metric_name: metric,
      metric_value: value,
      url: window.location.href,
      timestamp: new Date().toISOString()
    });
  }

  private triggerPerformanceAlert(metric: string, value: number, threshold: number): void {
    const alert: PerformanceAlert = {
      id: this.generateAlertId(),
      timestamp: new Date(),
      metric,
      value,
      threshold,
      severity: 'medium',
      affectedUsers: 1,
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        sessionId: this.sessionId
      }
    };

    this.sendPerformanceAlert(alert);
  }

  private async sendPerformanceAlert(alert: PerformanceAlert): Promise<void> {
    try {
      await fetch('/api/alerts/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(alert)
      });
    } catch (error) {
      console.error('Failed to send performance alert:', error);
    }
  }

  addBreadcrumb(breadcrumb: Breadcrumb): void {
    this.breadcrumbs.push(breadcrumb);
    
    // Keep only last 50 breadcrumbs
    if (this.breadcrumbs.length > 50) {
      this.breadcrumbs = this.breadcrumbs.slice(-50);
    }
  }

  setUserContext(userId: string, userTier: string): void {
    this.addBreadcrumb({
      timestamp: new Date(),
      category: 'user_action',
      message: 'User context updated',
      data: { userId, userTier }
    });
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private getBrowserName(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getBrowserVersion(userAgent: string): string {
    const match = userAgent.match(/(Chrome|Firefox|Safari|Edge)\/(\d+)/);
    return match ? match[2] : 'Unknown';
  }

  private getOSName(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Macintosh')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
    if (userAgent.includes('Android')) return 'Android';
    return 'Unknown';
  }

  private getOSVersion(userAgent: string): string {
    // Simplified OS version detection
    const windowsMatch = userAgent.match(/Windows NT (\d+\.\d+)/);
    if (windowsMatch) return windowsMatch[1];
    
    const macMatch = userAgent.match(/Mac OS X (\d+_\d+)/);
    if (macMatch) return macMatch[1].replace('_', '.');
    
    return 'Unknown';
  }

  getConfig(): ErrorMonitoringConfig {
    return this.config;
  }

  updateConfig(config: Partial<ErrorMonitoringConfig>): void {
    this.config = { ...this.config, ...config };
  }
}