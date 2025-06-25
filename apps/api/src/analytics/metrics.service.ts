import { Injectable, Logger } from '@nestjs/common';
import { register, collectDefaultMetrics, Counter, Histogram, Gauge, Summary } from 'prom-client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  // HTTP Request Metrics
  private readonly httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code', 'user_agent_type']
  });

  private readonly httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
  });

  // Business Metrics
  private readonly subscriptionActiveTotal = new Gauge({
    name: 'subscription_active_total',
    help: 'Total number of active subscriptions',
    labelNames: ['tier']
  });

  private readonly revenueTotal = new Counter({
    name: 'revenue_total',
    help: 'Total revenue generated',
    labelNames: ['tier', 'channel', 'currency']
  });

  private readonly userRegistrationsTotal = new Counter({
    name: 'user_registrations_total',
    help: 'Total number of user registrations',
    labelNames: ['source', 'tier']
  });

  private readonly subscriptionPurchasesTotal = new Counter({
    name: 'subscription_purchases_total',
    help: 'Total number of subscription purchases',
    labelNames: ['tier', 'channel']
  });

  private readonly subscriptionCancellationsTotal = new Counter({
    name: 'subscription_cancellations_total',
    help: 'Total number of subscription cancellations',
    labelNames: ['tier', 'reason']
  });

  private readonly paymentSuccessfulTotal = new Counter({
    name: 'payment_successful_total',
    help: 'Total number of successful payments',
    labelNames: ['tier', 'method']
  });

  private readonly paymentFailedTotal = new Counter({
    name: 'payment_failed_total',
    help: 'Total number of failed payments',
    labelNames: ['tier', 'error_code']
  });

  private readonly refundProcessedTotal = new Counter({
    name: 'refund_processed_total',
    help: 'Total number of refunds processed',
    labelNames: ['tier', 'reason']
  });

  // User Engagement Metrics
  private readonly userSessionsTotal = new Counter({
    name: 'user_sessions_total',
    help: 'Total number of user sessions',
    labelNames: ['device', 'is_pwa', 'location']
  });

  private readonly chapterCompletionsTotal = new Counter({
    name: 'chapter_completions_total',
    help: 'Total number of chapter completions',
    labelNames: ['chapter', 'principle', 'difficulty']
  });

  private readonly chapterStartsTotal = new Counter({
    name: 'chapter_starts_total',
    help: 'Total number of chapter starts',
    labelNames: ['chapter', 'principle', 'difficulty']
  });

  private readonly templateUsageTotal = new Counter({
    name: 'template_usage_total',
    help: 'Total template usage count',
    labelNames: ['template_id', 'category', 'principle']
  });

  private readonly pwaSessionsTotal = new Counter({
    name: 'pwa_sessions_total',
    help: 'Total PWA sessions',
    labelNames: ['install_source', 'offline_mode']
  });

  private readonly sessionDuration = new Histogram({
    name: 'session_duration_seconds',
    help: 'User session duration in seconds',
    labelNames: ['user_tier', 'device_type'],
    buckets: [60, 300, 600, 1200, 1800, 3600, 7200, 14400]
  });

  // Content Performance Metrics
  private readonly contentDeliveryFailuresTotal = new Counter({
    name: 'content_delivery_failures_total',
    help: 'Total content delivery failures',
    labelNames: ['content_type', 'error_type']
  });

  private readonly contentLoadTime = new Histogram({
    name: 'content_load_time_seconds',
    help: 'Content loading time in seconds',
    labelNames: ['content_type', 'delivery_method'],
    buckets: [0.5, 1, 2, 3, 5, 8, 13, 21]
  });

  // PWA-specific Metrics
  private readonly pwaOfflineSuccessRate = new Gauge({
    name: 'pwa_offline_success_rate',
    help: 'PWA offline functionality success rate'
  });

  private readonly serviceWorkerUpdateFailuresTotal = new Counter({
    name: 'service_worker_update_failures_total',
    help: 'Total service worker update failures',
    labelNames: ['error_type', 'browser']
  });

  private readonly pwaInstallationsTotal = new Counter({
    name: 'pwa_installations_total',
    help: 'Total PWA installations',
    labelNames: ['platform', 'source']
  });

  private readonly pushNotificationEngagement = new Counter({
    name: 'push_notification_engagement_total',
    help: 'Push notification engagement events',
    labelNames: ['action', 'type']
  });

  // Learning Analytics Metrics
  private readonly learningProgressTotal = new Counter({
    name: 'learning_progress_total',
    help: 'Learning progress events',
    labelNames: ['event_type', 'content_id', 'user_tier']
  });

  private readonly learningTimeSpent = new Counter({
    name: 'learning_time_spent_seconds_total',
    help: 'Total time spent learning in seconds',
    labelNames: ['content_type', 'principle', 'difficulty']
  });

  private readonly learningEffectiveness = new Histogram({
    name: 'learning_effectiveness_score',
    help: 'Learning effectiveness score distribution',
    labelNames: ['content_id', 'user_tier'],
    buckets: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  });

  // System Performance Metrics
  private readonly databaseQueryDuration = new Histogram({
    name: 'database_query_duration_seconds',
    help: 'Database query duration in seconds',
    labelNames: ['query_type', 'table'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5]
  });

  private readonly cacheHitRate = new Gauge({
    name: 'cache_hit_rate',
    help: 'Cache hit rate percentage',
    labelNames: ['cache_type']
  });

  private readonly activeConnections = new Gauge({
    name: 'active_connections_total',
    help: 'Total number of active connections',
    labelNames: ['connection_type']
  });

  // Security Metrics
  private readonly failedLoginAttemptsTotal = new Counter({
    name: 'failed_login_attempts_total',
    help: 'Total failed login attempts',
    labelNames: ['source_ip', 'user_agent_type']
  });

  private readonly rateLimitExceededTotal = new Counter({
    name: 'rate_limit_exceeded_total',
    help: 'Total rate limit exceeded events',
    labelNames: ['endpoint', 'user_type']
  });

  private readonly suspiciousActivityTotal = new Counter({
    name: 'suspicious_activity_total',
    help: 'Total suspicious activity events',
    labelNames: ['activity_type', 'severity']
  });

  // Customer Success Metrics
  private readonly customerLifetimeValue = new Histogram({
    name: 'customer_lifetime_value',
    help: 'Customer lifetime value distribution',
    labelNames: ['acquisition_channel', 'tier'],
    buckets: [10, 25, 50, 100, 250, 500, 1000, 2500, 5000]
  });

  private readonly customerAcquisitionCost = new Histogram({
    name: 'customer_acquisition_cost',
    help: 'Customer acquisition cost distribution',
    labelNames: ['channel', 'campaign'],
    buckets: [1, 5, 10, 25, 50, 100, 250, 500]
  });

  private readonly npsScore = new Histogram({
    name: 'nps_score',
    help: 'Net Promoter Score distribution',
    labelNames: ['user_tier', 'survey_context'],
    buckets: [-10, -5, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  });

  private readonly customerHealthScore = new Histogram({
    name: 'customer_health_score',
    help: 'Customer health score distribution',
    labelNames: ['tier', 'segment'],
    buckets: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
  });

  // Website Analytics Metrics
  private readonly websiteVisitorsTotal = new Counter({
    name: 'website_visitors_total',
    help: 'Total website visitors',
    labelNames: ['source', 'medium', 'campaign']
  });

  private readonly conversionFunnelEvents = new Counter({
    name: 'conversion_funnel_events_total',
    help: 'Conversion funnel events',
    labelNames: ['step', 'source', 'device_type']
  });

  private readonly bounceRate = new Gauge({
    name: 'bounce_rate_percentage',
    help: 'Website bounce rate percentage',
    labelNames: ['page', 'source']
  });

  // Core Web Vitals Metrics
  private readonly largestContentfulPaint = new Histogram({
    name: 'largest_contentful_paint_seconds',
    help: 'Largest Contentful Paint in seconds',
    labelNames: ['page', 'device_type'],
    buckets: [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6]
  });

  private readonly firstInputDelay = new Histogram({
    name: 'first_input_delay_milliseconds',
    help: 'First Input Delay in milliseconds',
    labelNames: ['page', 'device_type'],
    buckets: [10, 25, 50, 100, 200, 300, 500, 1000]
  });

  private readonly cumulativeLayoutShift = new Histogram({
    name: 'cumulative_layout_shift_score',
    help: 'Cumulative Layout Shift score',
    labelNames: ['page', 'device_type'],
    buckets: [0.01, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.5]
  });

  constructor(private readonly configService: ConfigService) {
    // Enable default system metrics collection
    collectDefaultMetrics({
      prefix: 'amysoft_',
      gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5]
    });

    this.logger.log('Prometheus metrics initialized successfully');
  }

  // HTTP Request Tracking
  recordHttpRequest(method: string, route: string, statusCode: number, duration: number, userAgent?: string): void {
    const userAgentType = this.categorizeUserAgent(userAgent);
    
    this.httpRequestsTotal
      .labels(method, route, statusCode.toString(), userAgentType)
      .inc();
    
    this.httpRequestDuration
      .labels(method, route, statusCode.toString())
      .observe(duration);
  }

  // Business Metrics
  recordRevenue(amount: number, tier: string, channel: string, currency: string = 'USD'): void {
    this.revenueTotal.labels(tier, channel, currency).inc(amount);
  }

  recordSubscription(tier: string, action: 'purchase' | 'cancel', channel?: string, reason?: string): void {
    if (action === 'purchase') {
      this.subscriptionPurchasesTotal.labels(tier, channel || 'unknown').inc();
    } else if (action === 'cancel') {
      this.subscriptionCancellationsTotal.labels(tier, reason || 'unknown').inc();
    }
  }

  updateActiveSubscriptions(tier: string, count: number): void {
    this.subscriptionActiveTotal.labels(tier).set(count);
  }

  recordPayment(success: boolean, tier: string, method?: string, errorCode?: string): void {
    if (success) {
      this.paymentSuccessfulTotal.labels(tier, method || 'unknown').inc();
    } else {
      this.paymentFailedTotal.labels(tier, errorCode || 'unknown').inc();
    }
  }

  recordRefund(tier: string, reason: string): void {
    this.refundProcessedTotal.labels(tier, reason).inc();
  }

  recordUserRegistration(source: string, tier: string): void {
    this.userRegistrationsTotal.labels(source, tier).inc();
  }

  // User Engagement Metrics
  recordUserSession(device: string, isPWA: boolean, location?: string): void {
    this.userSessionsTotal
      .labels(device, isPWA.toString(), location || 'unknown')
      .inc();
  }

  recordSessionDuration(duration: number, userTier: string, deviceType: string): void {
    this.sessionDuration.labels(userTier, deviceType).observe(duration);
  }

  recordChapterProgress(action: 'start' | 'complete', chapter: string, principle: string, difficulty: string): void {
    if (action === 'start') {
      this.chapterStartsTotal.labels(chapter, principle, difficulty).inc();
    } else if (action === 'complete') {
      this.chapterCompletionsTotal.labels(chapter, principle, difficulty).inc();
    }
  }

  recordTemplateUsage(templateId: string, category: string, principle: string): void {
    this.templateUsageTotal.labels(templateId, category, principle).inc();
  }

  recordLearningProgress(eventType: string, contentId: string, userTier: string): void {
    this.learningProgressTotal.labels(eventType, contentId, userTier).inc();
  }

  recordLearningTime(seconds: number, contentType: string, principle: string, difficulty: string): void {
    this.learningTimeSpent.labels(contentType, principle, difficulty).inc(seconds);
  }

  recordLearningEffectiveness(score: number, contentId: string, userTier: string): void {
    this.learningEffectiveness.labels(contentId, userTier).observe(score);
  }

  // PWA Metrics
  recordPWASession(installSource: string, offlineMode: boolean): void {
    this.pwaSessionsTotal.labels(installSource, offlineMode.toString()).inc();
  }

  recordPWAInstallation(platform: string, source: string): void {
    this.pwaInstallationsTotal.labels(platform, source).inc();
  }

  recordServiceWorkerUpdate(success: boolean, errorType?: string, browser?: string): void {
    if (!success) {
      this.serviceWorkerUpdateFailuresTotal
        .labels(errorType || 'unknown', browser || 'unknown')
        .inc();
    }
  }

  updatePWAOfflineSuccessRate(rate: number): void {
    this.pwaOfflineSuccessRate.set(rate);
  }

  recordPushNotificationEngagement(action: string, type: string): void {
    this.pushNotificationEngagement.labels(action, type).inc();
  }

  // Content Performance
  recordContentDeliveryFailure(contentType: string, errorType: string): void {
    this.contentDeliveryFailuresTotal.labels(contentType, errorType).inc();
  }

  recordContentLoadTime(duration: number, contentType: string, deliveryMethod: string): void {
    this.contentLoadTime.labels(contentType, deliveryMethod).observe(duration);
  }

  // System Performance
  recordDatabaseQuery(duration: number, queryType: string, table: string): void {
    this.databaseQueryDuration.labels(queryType, table).observe(duration);
  }

  updateCacheHitRate(rate: number, cacheType: string): void {
    this.cacheHitRate.labels(cacheType).set(rate);
  }

  updateActiveConnections(count: number, connectionType: string): void {
    this.activeConnections.labels(connectionType).set(count);
  }

  // Security Metrics
  recordFailedLoginAttempt(sourceIp: string, userAgent?: string): void {
    const userAgentType = this.categorizeUserAgent(userAgent);
    this.failedLoginAttemptsTotal.labels(sourceIp, userAgentType).inc();
  }

  recordRateLimitExceeded(endpoint: string, userType: string): void {
    this.rateLimitExceededTotal.labels(endpoint, userType).inc();
  }

  recordSuspiciousActivity(activityType: string, severity: string): void {
    this.suspiciousActivityTotal.labels(activityType, severity).inc();
  }

  // Customer Success Metrics
  recordCustomerLifetimeValue(value: number, acquisitionChannel: string, tier: string): void {
    this.customerLifetimeValue.labels(acquisitionChannel, tier).observe(value);
  }

  recordCustomerAcquisitionCost(cost: number, channel: string, campaign: string): void {
    this.customerAcquisitionCost.labels(channel, campaign).observe(cost);
  }

  recordNPSScore(score: number, userTier: string, surveyContext: string): void {
    this.npsScore.labels(userTier, surveyContext).observe(score);
  }

  recordCustomerHealthScore(score: number, tier: string, segment: string): void {
    this.customerHealthScore.labels(tier, segment).observe(score);
  }

  // Website Analytics
  recordWebsiteVisitor(source: string, medium: string, campaign?: string): void {
    this.websiteVisitorsTotal.labels(source, medium, campaign || 'none').inc();
  }

  recordConversionFunnelEvent(step: string, source: string, deviceType: string): void {
    this.conversionFunnelEvents.labels(step, source, deviceType).inc();
  }

  updateBounceRate(rate: number, page: string, source: string): void {
    this.bounceRate.labels(page, source).set(rate);
  }

  // Core Web Vitals
  recordLargestContentfulPaint(duration: number, page: string, deviceType: string): void {
    this.largestContentfulPaint.labels(page, deviceType).observe(duration);
  }

  recordFirstInputDelay(delay: number, page: string, deviceType: string): void {
    this.firstInputDelay.labels(page, deviceType).observe(delay);
  }

  recordCumulativeLayoutShift(score: number, page: string, deviceType: string): void {
    this.cumulativeLayoutShift.labels(page, deviceType).observe(score);
  }

  // Utility Methods
  incrementCounter(name: string, labels?: Record<string, string>): void {
    const metric = register.getSingleMetric(name) as Counter<string>;
    if (metric) {
      metric.inc(labels);
    }
  }

  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    const metric = register.getSingleMetric(name) as Gauge<string>;
    if (metric) {
      metric.set(labels, value);
    }
  }

  observeHistogram(name: string, value: number, labels?: Record<string, string>): void {
    const metric = register.getSingleMetric(name) as Histogram<string>;
    if (metric) {
      metric.observe(labels, value);
    }
  }

  // Get metrics for Prometheus endpoint
  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  // Get metrics registry
  getRegistry() {
    return register;
  }

  // Reset all metrics (for testing)
  resetMetrics(): void {
    register.resetMetrics();
  }

  // Clear all metrics
  clearMetrics(): void {
    register.clear();
  }

  // Helper method to categorize user agents
  private categorizeUserAgent(userAgent?: string): string {
    if (!userAgent) return 'unknown';
    
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return 'mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'tablet';
    } else if (ua.includes('bot') || ua.includes('crawler') || ua.includes('spider')) {
      return 'bot';
    } else {
      return 'desktop';
    }
  }
}