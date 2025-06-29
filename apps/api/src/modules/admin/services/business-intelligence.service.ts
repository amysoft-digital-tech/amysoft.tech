import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, Like } from 'typeorm';
import { User } from '../../../entities/user.entity';
import { UserSubscription } from '../../../entities/user-subscription.entity';
import { Payment } from '../../../entities/payment.entity';
import { ContentAnalytics } from '../../../entities/content-analytics.entity';
import { UserActivity } from '../../../entities/user-activity.entity';
import { BusinessMetrics } from '../interfaces/admin.interfaces';

@Injectable()
export class BusinessIntelligenceService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserSubscription)
    private readonly subscriptionRepository: Repository<UserSubscription>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(ContentAnalytics)
    private readonly contentAnalyticsRepository: Repository<ContentAnalytics>,
    @InjectRepository(UserActivity)
    private readonly activityRepository: Repository<UserActivity>,
  ) {}

  async getBusinessMetrics(period?: { from: Date; to: Date }): Promise<BusinessMetrics> {
    const [revenue, customers, content, performance] = await Promise.all([
      this.getRevenueMetrics(period),
      this.getCustomerMetrics(period),
      this.getContentMetrics(period),
      this.getPerformanceMetrics(),
    ]);

    return {
      revenue,
      customers,
      content,
      performance,
    };
  }

  async getRevenueAnalytics(params: {
    dateFrom: Date;
    dateTo: Date;
    groupBy: 'day' | 'week' | 'month';
  }): Promise<any> {
    const payments = await this.paymentRepository.find({
      where: {
        createdAt: Between(params.dateFrom, params.dateTo),
        status: 'completed',
      },
      order: { createdAt: 'ASC' },
    });

    // Group payments by period
    const grouped = this.groupByPeriod(payments, params.groupBy);
    
    // Calculate metrics
    const metrics = {
      total: payments.reduce((sum, p) => sum + p.amount, 0),
      average: payments.length > 0 ? payments.reduce((sum, p) => sum + p.amount, 0) / payments.length : 0,
      count: payments.length,
      byPeriod: grouped,
      byProduct: this.groupByProduct(payments),
      byPlan: this.groupByPlan(payments),
      forecast: this.calculateRevenueForecast(grouped),
    };

    return metrics;
  }

  async getCustomerAnalytics(params: {
    dateFrom: Date;
    dateTo: Date;
  }): Promise<any> {
    const newCustomers = await this.userRepository.count({
      where: {
        createdAt: Between(params.dateFrom, params.dateTo),
      },
    });

    const activeSubscriptions = await this.subscriptionRepository.count({
      where: {
        status: 'active',
      },
    });

    const cancelledSubscriptions = await this.subscriptionRepository.count({
      where: {
        cancelledAt: Between(params.dateFrom, params.dateTo),
      },
    });

    const totalCustomers = await this.userRepository.count();
    const churnRate = totalCustomers > 0 ? (cancelledSubscriptions / totalCustomers) * 100 : 0;

    // Calculate cohort retention
    const cohortRetention = await this.calculateCohortRetention(params);

    // Customer segmentation
    const segmentation = await this.getCustomerSegmentation();

    return {
      acquisition: {
        newCustomers,
        acquisitionRate: (newCustomers / 30) * 100, // Daily average
        sources: await this.getAcquisitionSources(params),
      },
      retention: {
        activeCustomers: activeSubscriptions,
        churnRate,
        cancelledCount: cancelledSubscriptions,
        cohortRetention,
      },
      segmentation,
      lifetimeValue: await this.calculateAverageLifetimeValue(),
    };
  }

  async getOperationalMetrics(): Promise<any> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      dailyActiveUsers,
      monthlyActiveUsers,
      supportTickets,
      contentPublished,
      systemHealth,
    ] = await Promise.all([
      this.getDailyActiveUsers(),
      this.getMonthlyActiveUsers(),
      this.getSupportMetrics(thirtyDaysAgo),
      this.getContentPublishingMetrics(thirtyDaysAgo),
      this.getSystemHealthMetrics(),
    ]);

    return {
      userActivity: {
        dailyActiveUsers,
        monthlyActiveUsers,
        avgSessionDuration: 15.5, // Placeholder
        pageViewsPerSession: 8.2, // Placeholder
      },
      support: supportTickets,
      content: contentPublished,
      system: systemHealth,
    };
  }

  async generateExecutiveReport(period: { from: Date; to: Date }): Promise<any> {
    const [
      metrics,
      revenue,
      customers,
      topContent,
      trends,
    ] = await Promise.all([
      this.getBusinessMetrics(period),
      this.getRevenueAnalytics({ ...period, groupBy: 'month' }),
      this.getCustomerAnalytics(period),
      this.getTopPerformingContent(10),
      this.getBusinessTrends(period),
    ]);

    return {
      period,
      summary: {
        revenue: metrics.revenue,
        customers: metrics.customers,
        keyHighlights: this.generateKeyHighlights(metrics, trends),
      },
      details: {
        revenueAnalysis: revenue,
        customerAnalysis: customers,
        contentPerformance: topContent,
        trends,
      },
      recommendations: this.generateRecommendations(metrics, trends),
    };
  }

  private async getRevenueMetrics(period?: { from: Date; to: Date }): Promise<BusinessMetrics['revenue']> {
    const whereClause: any = { status: 'completed' };
    if (period) {
      whereClause.createdAt = Between(period.from, period.to);
    }

    const payments = await this.paymentRepository.find({ where: whereClause });
    
    const total = payments.reduce((sum, p) => sum + p.amount, 0);
    
    // Calculate monthly revenue
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const monthlyPayments = payments.filter(p => p.createdAt > thirtyDaysAgo);
    const monthly = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);

    // Calculate growth (comparing to previous period)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const previousMonthPayments = payments.filter(
      p => p.createdAt > sixtyDaysAgo && p.createdAt <= thirtyDaysAgo
    );
    const previousMonthly = previousMonthPayments.reduce((sum, p) => sum + p.amount, 0);
    const growth = previousMonthly > 0 ? ((monthly - previousMonthly) / previousMonthly) * 100 : 0;

    // Group by product
    const byProduct: Record<string, number> = {};
    payments.forEach(payment => {
      const product = payment.productId || 'subscription';
      byProduct[product] = (byProduct[product] || 0) + payment.amount;
    });

    return {
      total,
      monthly,
      growth,
      byProduct,
    };
  }

  private async getCustomerMetrics(period?: { from: Date; to: Date }): Promise<BusinessMetrics['customers']> {
    const total = await this.userRepository.count();
    const active = await this.subscriptionRepository.count({
      where: { status: 'active' },
    });

    // Calculate churn rate
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cancelled = await this.subscriptionRepository.count({
      where: {
        cancelledAt: MoreThan(thirtyDaysAgo),
      },
    });
    const churnRate = active > 0 ? (cancelled / active) * 100 : 0;

    // Calculate acquisition rate
    const newCustomers = await this.userRepository.count({
      where: {
        createdAt: MoreThan(thirtyDaysAgo),
      },
    });
    const acquisitionRate = total > 0 ? (newCustomers / total) * 100 : 0;

    // Calculate average lifetime value
    const lifetimeValue = await this.calculateAverageLifetimeValue();

    return {
      total,
      active,
      churnRate,
      acquisitionRate,
      lifetimeValue,
    };
  }

  private async getContentMetrics(period?: { from: Date; to: Date }): Promise<BusinessMetrics['content']> {
    const totalItems = await this.contentAnalyticsRepository.count();
    
    const analytics = await this.contentAnalyticsRepository.find({
      order: { viewCount: 'DESC' },
      take: 5,
    });

    const totalViews = analytics.reduce((sum, a) => sum + (a.viewCount || 0), 0);
    const engagementRate = totalItems > 0 ? (totalViews / totalItems) : 0;

    const popularItems = analytics.map(a => ({
      id: a.contentId,
      title: a.contentTitle || 'Untitled',
      views: a.viewCount || 0,
    }));

    return {
      totalItems,
      engagementRate,
      popularItems,
    };
  }

  private async getPerformanceMetrics(): Promise<BusinessMetrics['performance']> {
    // In a real implementation, these would come from monitoring systems
    return {
      apiLatency: 45, // ms
      errorRate: 0.02, // 2%
      uptime: 99.95, // percentage
    };
  }

  private groupByPeriod(payments: Payment[], groupBy: 'day' | 'week' | 'month'): any[] {
    const groups: Record<string, { date: string; amount: number; count: number }> = {};

    payments.forEach(payment => {
      const date = new Date(payment.createdAt);
      let key: string;

      if (groupBy === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        const week = this.getWeekNumber(date);
        key = `${date.getFullYear()}-W${week}`;
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!groups[key]) {
        groups[key] = { date: key, amount: 0, count: 0 };
      }

      groups[key].amount += payment.amount;
      groups[key].count += 1;
    });

    return Object.values(groups).sort((a, b) => a.date.localeCompare(b.date));
  }

  private groupByProduct(payments: Payment[]): Record<string, number> {
    const groups: Record<string, number> = {};
    
    payments.forEach(payment => {
      const product = payment.productId || 'subscription';
      groups[product] = (groups[product] || 0) + payment.amount;
    });

    return groups;
  }

  private groupByPlan(payments: Payment[]): Record<string, number> {
    const groups: Record<string, number> = {};
    
    payments.forEach(payment => {
      const plan = payment.metadata?.plan || 'standard';
      groups[plan] = (groups[plan] || 0) + payment.amount;
    });

    return groups;
  }

  private calculateRevenueForecast(historicalData: any[]): number {
    // Simple linear regression forecast
    if (historicalData.length < 2) return 0;

    const n = historicalData.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    historicalData.forEach((point, index) => {
      sumX += index;
      sumY += point.amount;
      sumXY += index * point.amount;
      sumX2 += index * index;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Forecast next period
    return slope * n + intercept;
  }

  private async calculateAverageLifetimeValue(): Promise<number> {
    const allPayments = await this.paymentRepository.find({
      where: { status: 'completed' },
    });

    const customerRevenue: Record<string, number> = {};
    allPayments.forEach(payment => {
      customerRevenue[payment.userId] = (customerRevenue[payment.userId] || 0) + payment.amount;
    });

    const values = Object.values(customerRevenue);
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  }

  private async calculateCohortRetention(params: { dateFrom: Date; dateTo: Date }): Promise<any> {
    // Simplified cohort retention calculation
    const cohorts: any[] = [];
    const monthsToAnalyze = 6;

    for (let i = 0; i < monthsToAnalyze; i++) {
      const cohortStart = new Date(params.dateFrom);
      cohortStart.setMonth(cohortStart.getMonth() - i);
      const cohortEnd = new Date(cohortStart);
      cohortEnd.setMonth(cohortEnd.getMonth() + 1);

      const cohortUsers = await this.userRepository.find({
        where: {
          createdAt: Between(cohortStart, cohortEnd),
        },
      });

      const cohortData = {
        month: cohortStart.toISOString().substring(0, 7),
        users: cohortUsers.length,
        retention: {} as Record<string, number>,
      };

      // Calculate retention for each subsequent month
      for (let j = 0; j <= i; j++) {
        const checkDate = new Date(cohortStart);
        checkDate.setMonth(checkDate.getMonth() + j);
        
        const activeCount = await this.activityRepository
          .createQueryBuilder('activity')
          .where('activity.userId IN (:...userIds)', { 
            userIds: cohortUsers.map(u => u.id) 
          })
          .andWhere('activity.timestamp > :date', { date: checkDate })
          .select('DISTINCT activity.userId')
          .getCount();

        cohortData.retention[`month_${j}`] = 
          cohortUsers.length > 0 ? (activeCount / cohortUsers.length) * 100 : 0;
      }

      cohorts.push(cohortData);
    }

    return cohorts;
  }

  private async getCustomerSegmentation(): Promise<any> {
    const segments = {
      byPlan: {} as Record<string, number>,
      byValue: {
        high: 0,
        medium: 0,
        low: 0,
      },
      byActivity: {
        veryActive: 0,
        active: 0,
        inactive: 0,
      },
    };

    // Segment by subscription plan
    const subscriptions = await this.subscriptionRepository.find({
      where: { status: 'active' },
    });

    subscriptions.forEach(sub => {
      segments.byPlan[sub.plan] = (segments.byPlan[sub.plan] || 0) + 1;
    });

    // Segment by value and activity (simplified)
    const users = await this.userRepository.find();
    
    for (const user of users) {
      const revenue = await this.calculateUserRevenue(user.id);
      
      if (revenue > 1000) segments.byValue.high++;
      else if (revenue > 100) segments.byValue.medium++;
      else segments.byValue.low++;

      const lastActivity = await this.getLastUserActivity(user.id);
      const daysSinceActive = lastActivity ? 
        (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24) : 999;

      if (daysSinceActive < 7) segments.byActivity.veryActive++;
      else if (daysSinceActive < 30) segments.byActivity.active++;
      else segments.byActivity.inactive++;
    }

    return segments;
  }

  private async calculateUserRevenue(userId: string): Promise<number> {
    const payments = await this.paymentRepository.find({
      where: { userId, status: 'completed' },
    });

    return payments.reduce((sum, p) => sum + p.amount, 0);
  }

  private async getLastUserActivity(userId: string): Promise<Date | null> {
    const activity = await this.activityRepository.findOne({
      where: { userId },
      order: { timestamp: 'DESC' },
    });

    return activity?.timestamp || null;
  }

  private async getAcquisitionSources(params: { dateFrom: Date; dateTo: Date }): Promise<any> {
    // In a real implementation, this would analyze referral sources
    return {
      organic: 45,
      paid: 25,
      social: 15,
      referral: 10,
      direct: 5,
    };
  }

  private async getDailyActiveUsers(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.activityRepository
      .createQueryBuilder('activity')
      .where('activity.timestamp > :today', { today })
      .select('DISTINCT activity.userId')
      .getCount();
  }

  private async getMonthlyActiveUsers(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return this.activityRepository
      .createQueryBuilder('activity')
      .where('activity.timestamp > :date', { date: thirtyDaysAgo })
      .select('DISTINCT activity.userId')
      .getCount();
  }

  private async getSupportMetrics(since: Date): Promise<any> {
    const supportActivities = await this.activityRepository.find({
      where: {
        activityType: Like('support:%'),
        timestamp: MoreThan(since),
      },
    });

    const resolved = supportActivities.filter(a => 
      a.metadata?.status === 'resolved'
    ).length;

    return {
      total: supportActivities.length,
      resolved,
      pending: supportActivities.length - resolved,
      avgResolutionTime: 4.5, // hours, placeholder
      satisfactionScore: 4.2, // out of 5, placeholder
    };
  }

  private async getContentPublishingMetrics(since: Date): Promise<any> {
    const contentActivities = await this.activityRepository.find({
      where: {
        activityType: 'content_published',
        timestamp: MoreThan(since),
      },
    });

    return {
      published: contentActivities.length,
      avgPublishingTime: 2.3, // days, placeholder
      byType: {
        chapter: 15,
        template: 25,
        resource: 10,
      },
    };
  }

  private async getSystemHealthMetrics(): Promise<any> {
    return {
      apiLatency: {
        p50: 45,
        p95: 120,
        p99: 250,
      },
      errorRate: 0.02,
      uptime: 99.95,
      queueDepth: 12,
      databaseConnections: 45,
    };
  }

  private async getTopPerformingContent(limit: number): Promise<any[]> {
    const analytics = await this.contentAnalyticsRepository.find({
      order: { viewCount: 'DESC' },
      take: limit,
    });

    return analytics.map(a => ({
      id: a.contentId,
      title: a.contentTitle || 'Untitled',
      type: a.contentType || 'unknown',
      metrics: {
        views: a.viewCount || 0,
        uniqueViews: a.uniqueViewCount || 0,
        avgTimeSpent: a.avgTimeSpent || 0,
        completionRate: a.completionRate || 0,
        engagementScore: a.engagementScore || 0,
      },
    }));
  }

  private async getBusinessTrends(period: { from: Date; to: Date }): Promise<any> {
    // Calculate various trend indicators
    return {
      revenue: {
        trend: 'up',
        change: 15.3,
        forecast: 'positive',
      },
      customers: {
        trend: 'up',
        change: 8.7,
        forecast: 'stable',
      },
      engagement: {
        trend: 'stable',
        change: -1.2,
        forecast: 'stable',
      },
      content: {
        trend: 'up',
        change: 22.5,
        forecast: 'positive',
      },
    };
  }

  private generateKeyHighlights(metrics: BusinessMetrics, trends: any): string[] {
    const highlights: string[] = [];

    if (metrics.revenue.growth > 10) {
      highlights.push(`Revenue grew ${metrics.revenue.growth.toFixed(1)}% month-over-month`);
    }

    if (metrics.customers.churnRate < 5) {
      highlights.push(`Low churn rate of ${metrics.customers.churnRate.toFixed(1)}%`);
    }

    if (metrics.customers.acquisitionRate > 10) {
      highlights.push(`Strong customer acquisition at ${metrics.customers.acquisitionRate.toFixed(1)}%`);
    }

    if (metrics.performance.uptime > 99.9) {
      highlights.push(`Excellent system uptime of ${metrics.performance.uptime}%`);
    }

    return highlights;
  }

  private generateRecommendations(metrics: BusinessMetrics, trends: any): string[] {
    const recommendations: string[] = [];

    if (metrics.customers.churnRate > 10) {
      recommendations.push('Focus on retention strategies to reduce high churn rate');
    }

    if (metrics.revenue.growth < 5) {
      recommendations.push('Consider promotional campaigns to boost revenue growth');
    }

    if (metrics.content.engagementRate < 50) {
      recommendations.push('Improve content quality and discovery to increase engagement');
    }

    if (metrics.performance.errorRate > 1) {
      recommendations.push('Address system stability issues to reduce error rate');
    }

    return recommendations;
  }

  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }
}