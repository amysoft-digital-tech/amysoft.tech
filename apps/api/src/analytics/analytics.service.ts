import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MetricsService } from './metrics.service';

// Analytics entities
export interface UserAnalytics {
  userId: string;
  sessionId: string;
  device: DeviceInfo;
  location: LocationInfo;
  engagement: EngagementMetrics;
  learning: LearningMetrics;
  conversion: ConversionMetrics;
  timestamp: Date;
}

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet';
  os: string;
  browser: string;
  screenResolution: string;
  userAgent: string;
  isPWA: boolean;
  isOffline: boolean;
}

export interface LocationInfo {
  country?: string;
  region?: string;
  city?: string;
  timezone: string;
  language: string;
}

export interface EngagementMetrics {
  sessionDuration: number;
  pageViews: number;
  chaptersViewed: string[];
  templatesUsed: string[];
  searchQueries: string[];
  scrollDepth: number;
  timeOnPage: Record<string, number>;
  interactions: InteractionEvent[];
}

export interface LearningMetrics {
  chaptersStarted: string[];
  chaptersCompleted: string[];
  principlesMastered: string[];
  templatesBookmarked: string[];
  progressPercentage: number;
  learningStreak: number;
  timeSpentLearning: number;
  difficultyCovered: string[];
}

export interface ConversionMetrics {
  source: string;
  medium: string;
  campaign?: string;
  referrer?: string;
  landingPage: string;
  conversionFunnel: FunnelStep[];
  purchaseIntent: number;
  abandonmentPoint?: string;
}

export interface InteractionEvent {
  type: 'click' | 'scroll' | 'focus' | 'blur' | 'download' | 'share' | 'feedback';
  element: string;
  value?: string;
  timestamp: Date;
}

export interface FunnelStep {
  step: string;
  timestamp: Date;
  completed: boolean;
  duration?: number;
}

export interface BusinessMetrics {
  revenue: RevenueMetrics;
  users: UserMetrics;
  content: ContentMetrics;
  performance: PerformanceMetrics;
  retention: RetentionMetrics;
}

export interface RevenueMetrics {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  averageRevenuePerUser: number;
  customerLifetimeValue: number;
  churnRate: number;
  conversionRate: number;
  refundRate: number;
  revenueByTier: Record<string, number>;
  revenueByChannel: Record<string, number>;
}

export interface UserMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  returningUsers: number;
  userGrowthRate: number;
  engagementRate: number;
  sessionDuration: number;
  netPromoterScore: number;
}

export interface ContentMetrics {
  chapterCompletionRates: Record<string, number>;
  templateUsageStats: Record<string, number>;
  contentEngagement: Record<string, number>;
  searchTerms: Record<string, number>;
  feedbackScores: Record<string, number>;
  learningPathEffectiveness: Record<string, number>;
}

export interface PerformanceMetrics {
  pageLoadTimes: Record<string, number>;
  apiResponseTimes: Record<string, number>;
  errorRates: Record<string, number>;
  uptimePercentage: number;
  coreWebVitals: CoreWebVitalsMetrics;
  pwaMetrics: PWAMetrics;
}

export interface CoreWebVitals {
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  firstContentfulPaint: number;
  timeToInteractive: number;
}

export interface CoreWebVitalsMetrics {
  lcp: CoreWebVitalDistribution;
  fid: CoreWebVitalDistribution;
  cls: CoreWebVitalDistribution;
  fcp: CoreWebVitalDistribution;
  tti: CoreWebVitalDistribution;
}

export interface CoreWebVitalDistribution {
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
}

export interface PWAMetrics {
  installationRate: number;
  offlineUsage: number;
  pushNotificationEngagement: number;
  serviceWorkerCacheHitRate: number;
  backgroundSyncSuccess: number;
}

export interface RetentionMetrics {
  day1Retention: number;
  day7Retention: number;
  day30Retention: number;
  cohortAnalysis: CohortData[];
  churnPrediction: ChurnPredictionData[];
}

export interface CohortData {
  cohort: string;
  period: number;
  users: number;
  retained: number;
  retentionRate: number;
}

export interface ChurnPredictionData {
  userId: string;
  churnProbability: number;
  factors: ChurnFactor[];
  recommendedActions: string[];
}

export interface ChurnFactor {
  factor: string;
  weight: number;
  value: number;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly metricsService: MetricsService
  ) {}

  // Privacy-compliant analytics tracking
  async trackUserAnalytics(analytics: UserAnalytics): Promise<void> {
    try {
      // Anonymize PII before storing
      const anonymizedAnalytics = this.anonymizeUserData(analytics);
      
      // Store analytics data
      await this.storeAnalytics(anonymizedAnalytics);
      
      // Update real-time metrics
      await this.updateMetrics(anonymizedAnalytics);
      
      this.logger.debug(`Analytics tracked for session: ${analytics.sessionId}`);
    } catch (error) {
      this.logger.error('Failed to track user analytics', error);
    }
  }

  // Business metrics calculation
  async calculateBusinessMetrics(): Promise<BusinessMetrics> {
    try {
      const [
        revenue,
        users,
        content,
        performance,
        retention
      ] = await Promise.all([
        this.calculateRevenueMetrics(),
        this.calculateUserMetrics(),
        this.calculateContentMetrics(),
        this.calculatePerformanceMetrics(),
        this.calculateRetentionMetrics()
      ]);

      return {
        revenue,
        users,
        content,
        performance,
        retention
      };
    } catch (error) {
      this.logger.error('Failed to calculate business metrics', error);
      throw error;
    }
  }

  // Real-time dashboard data
  async getDashboardData(timeRange: string = '24h'): Promise<any> {
    try {
      const metrics = await this.calculateBusinessMetrics();
      
      return {
        kpis: {
          revenue: metrics.revenue.monthlyRecurringRevenue,
          users: metrics.users.activeUsers,
          conversion: metrics.revenue.conversionRate,
          retention: metrics.retention.day30Retention,
          nps: metrics.users.netPromoterScore,
          churn: metrics.revenue.churnRate
        },
        revenue: {
          total: metrics.revenue.totalRevenue,
          mrr: metrics.revenue.monthlyRecurringRevenue,
          arpu: metrics.revenue.averageRevenuePerUser,
          ltv: metrics.revenue.customerLifetimeValue,
          byTier: metrics.revenue.revenueByTier,
          byChannel: metrics.revenue.revenueByChannel
        },
        users: {
          total: metrics.users.totalUsers,
          active: metrics.users.activeUsers,
          new: metrics.users.newUsers,
          growth: metrics.users.userGrowthRate,
          engagement: metrics.users.engagementRate
        },
        content: {
          completionRates: metrics.content.chapterCompletionRates,
          templateUsage: metrics.content.templateUsageStats,
          engagement: metrics.content.contentEngagement,
          feedback: metrics.content.feedbackScores
        },
        performance: {
          webVitals: metrics.performance.coreWebVitals,
          pwa: metrics.performance.pwaMetrics,
          uptime: metrics.performance.uptimePercentage
        }
      };
    } catch (error) {
      this.logger.error('Failed to get dashboard data', error);
      throw error;
    }
  }

  // Learning analytics
  async getLearningAnalytics(userId?: string): Promise<any> {
    try {
      const baseQuery = `
        SELECT 
          chapter_id,
          COUNT(*) as starts,
          COUNT(CASE WHEN completed = true THEN 1 END) as completions,
          AVG(time_spent) as avg_time,
          AVG(difficulty_rating) as avg_difficulty
        FROM learning_progress
      `;
      
      const userFilter = userId ? ` WHERE user_id = $1` : '';
      const groupBy = ` GROUP BY chapter_id`;
      
      // Execute analytics queries here
      return {
        chapterAnalytics: [],
        learningPaths: [],
        effectiveness: [],
        recommendations: []
      };
    } catch (error) {
      this.logger.error('Failed to get learning analytics', error);
      throw error;
    }
  }

  // Conversion funnel analysis
  async getConversionFunnel(timeRange: string = '30d'): Promise<any> {
    try {
      const funnelSteps = [
        'landing_page_view',
        'content_exploration',
        'value_proposition_view',
        'pricing_page_view',
        'checkout_start',
        'payment_method_entry',
        'purchase_complete'
      ];

      const funnelData = await this.calculateFunnelMetrics(funnelSteps, timeRange);
      
      return {
        steps: funnelData,
        conversionRates: this.calculateConversionRates(funnelData),
        dropOffPoints: this.identifyDropOffPoints(funnelData),
        optimizationOpportunities: this.getOptimizationRecommendations(funnelData)
      };
    } catch (error) {
      this.logger.error('Failed to get conversion funnel', error);
      throw error;
    }
  }

  // Customer health scoring
  async calculateCustomerHealthScore(userId: string): Promise<number> {
    try {
      const factors = await this.getUserHealthFactors(userId);
      
      // Weighted health score calculation
      const weights = {
        engagement: 0.3,
        learning_progress: 0.25,
        feature_usage: 0.2,
        support_interactions: 0.1,
        payment_history: 0.1,
        feedback_sentiment: 0.05
      };

      let healthScore = 0;
      for (const [factor, weight] of Object.entries(weights)) {
        healthScore += (factors[factor] || 0) * weight;
      }

      return Math.min(100, Math.max(0, healthScore));
    } catch (error) {
      this.logger.error('Failed to calculate customer health score', error);
      return 50; // Default neutral score
    }
  }

  // Churn prediction
  async predictChurn(userId: string): Promise<ChurnPredictionData> {
    try {
      const healthScore = await this.calculateCustomerHealthScore(userId);
      const engagementTrend = await this.getEngagementTrend(userId);
      const usagePattern = await this.getUsagePattern(userId);
      
      const churnFactors: ChurnFactor[] = [
        {
          factor: 'health_score',
          weight: 0.4,
          value: 100 - healthScore
        },
        {
          factor: 'engagement_decline',
          weight: 0.3,
          value: engagementTrend.decline
        },
        {
          factor: 'usage_frequency',
          weight: 0.2,
          value: 100 - usagePattern.frequency
        },
        {
          factor: 'support_tickets',
          weight: 0.1,
          value: usagePattern.supportTickets
        }
      ];

      const churnProbability = churnFactors.reduce((total, factor) => {
        return total + (factor.value * factor.weight);
      }, 0);

      const recommendedActions = this.getChurnPreventionActions(churnProbability, churnFactors);

      return {
        userId,
        churnProbability: Math.min(100, Math.max(0, churnProbability)),
        factors: churnFactors,
        recommendedActions
      };
    } catch (error) {
      this.logger.error('Failed to predict churn', error);
      throw error;
    }
  }

  // Scheduled analytics aggregation
  @Cron(CronExpression.EVERY_HOUR)
  async aggregateHourlyMetrics(): Promise<void> {
    try {
      this.logger.log('Starting hourly metrics aggregation...');
      
      const metrics = await this.calculateBusinessMetrics();
      await this.storeMetricsSnapshot('hourly', metrics);
      
      this.logger.log('Hourly metrics aggregation completed');
    } catch (error) {
      this.logger.error('Failed to aggregate hourly metrics', error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async aggregateDailyMetrics(): Promise<void> {
    try {
      this.logger.log('Starting daily metrics aggregation...');
      
      const metrics = await this.calculateBusinessMetrics();
      await this.storeMetricsSnapshot('daily', metrics);
      
      // Generate daily reports
      await this.generateDailyReport(metrics);
      
      this.logger.log('Daily metrics aggregation completed');
    } catch (error) {
      this.logger.error('Failed to aggregate daily metrics', error);
    }
  }

  // Privacy compliance methods
  private anonymizeUserData(analytics: UserAnalytics): UserAnalytics {
    return {
      ...analytics,
      userId: this.hashUserId(analytics.userId),
      location: {
        ...analytics.location,
        // Only keep country-level location data
        region: undefined,
        city: undefined
      }
    };
  }

  private hashUserId(userId: string): string {
    // Use a one-way hash to anonymize user IDs
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(userId).digest('hex');
  }

  // Helper methods for metrics calculation
  private async calculateRevenueMetrics(): Promise<RevenueMetrics> {
    // Implementation for revenue metrics calculation
    return {
      totalRevenue: 0,
      monthlyRecurringRevenue: 0,
      averageRevenuePerUser: 0,
      customerLifetimeValue: 0,
      churnRate: 0,
      conversionRate: 0,
      refundRate: 0,
      revenueByTier: {},
      revenueByChannel: {}
    };
  }

  private async calculateUserMetrics(): Promise<UserMetrics> {
    // Implementation for user metrics calculation
    return {
      totalUsers: 0,
      activeUsers: 0,
      newUsers: 0,
      returningUsers: 0,
      userGrowthRate: 0,
      engagementRate: 0,
      sessionDuration: 0,
      netPromoterScore: 0
    };
  }

  private async calculateContentMetrics(): Promise<ContentMetrics> {
    // Implementation for content metrics calculation
    return {
      chapterCompletionRates: {},
      templateUsageStats: {},
      contentEngagement: {},
      searchTerms: {},
      feedbackScores: {},
      learningPathEffectiveness: {}
    };
  }

  private async calculatePerformanceMetrics(): Promise<PerformanceMetrics> {
    // Implementation for performance metrics calculation
    return {
      pageLoadTimes: {},
      apiResponseTimes: {},
      errorRates: {},
      uptimePercentage: 0,
      coreWebVitals: {
        lcp: { p50: 0, p75: 0, p90: 0, p95: 0, p99: 0 },
        fid: { p50: 0, p75: 0, p90: 0, p95: 0, p99: 0 },
        cls: { p50: 0, p75: 0, p90: 0, p95: 0, p99: 0 },
        fcp: { p50: 0, p75: 0, p90: 0, p95: 0, p99: 0 },
        tti: { p50: 0, p75: 0, p90: 0, p95: 0, p99: 0 }
      },
      pwaMetrics: {
        installationRate: 0,
        offlineUsage: 0,
        pushNotificationEngagement: 0,
        serviceWorkerCacheHitRate: 0,
        backgroundSyncSuccess: 0
      }
    };
  }

  private async calculateRetentionMetrics(): Promise<RetentionMetrics> {
    // Implementation for retention metrics calculation
    return {
      day1Retention: 0,
      day7Retention: 0,
      day30Retention: 0,
      cohortAnalysis: [],
      churnPrediction: []
    };
  }

  private async storeAnalytics(analytics: UserAnalytics): Promise<void> {
    // Store analytics data in database
  }

  private async updateMetrics(analytics: UserAnalytics): Promise<void> {
    // Update Prometheus metrics
    this.metricsService.incrementCounter('user_sessions_total', {
      device: analytics.device.type,
      is_pwa: analytics.device.isPWA.toString()
    });
  }

  private async storeMetricsSnapshot(interval: string, metrics: BusinessMetrics): Promise<void> {
    // Store metrics snapshot for historical analysis
  }

  private async generateDailyReport(metrics: BusinessMetrics): Promise<void> {
    // Generate and send daily business report
  }

  private calculateFunnelMetrics(steps: string[], timeRange: string): Promise<any[]> {
    // Calculate conversion funnel metrics
    return Promise.resolve([]);
  }

  private calculateConversionRates(funnelData: any[]): Record<string, number> {
    // Calculate step-by-step conversion rates
    return {};
  }

  private identifyDropOffPoints(funnelData: any[]): string[] {
    // Identify major drop-off points in the funnel
    return [];
  }

  private getOptimizationRecommendations(funnelData: any[]): string[] {
    // Get recommendations for funnel optimization
    return [];
  }

  private async getUserHealthFactors(userId: string): Promise<Record<string, number>> {
    // Get factors for customer health scoring
    return {};
  }

  private async getEngagementTrend(userId: string): Promise<any> {
    // Get user engagement trend
    return { decline: 0 };
  }

  private async getUsagePattern(userId: string): Promise<any> {
    // Get user usage patterns
    return { frequency: 0, supportTickets: 0 };
  }

  private getChurnPreventionActions(churnProbability: number, factors: ChurnFactor[]): string[] {
    // Get recommended actions to prevent churn
    const actions: string[] = [];
    
    if (churnProbability > 70) {
      actions.push('Immediate personal outreach required');
      actions.push('Offer premium support consultation');
    } else if (churnProbability > 40) {
      actions.push('Send re-engagement email campaign');
      actions.push('Provide additional learning resources');
    }
    
    return actions;
  }
}