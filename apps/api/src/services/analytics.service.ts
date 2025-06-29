import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsEvent } from '../entities/analytics-event.entity';
import { Lead } from '../entities/lead.entity';
import { AnalyticsEventDto, ConversionEventDto, AnalyticsDashboardDto, AnalyticsDashboardResponseDto } from '../dto/analytics.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(AnalyticsEvent)
    private analyticsEventRepository: Repository<AnalyticsEvent>,
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
  ) {}

  async trackEvents(
    events: AnalyticsEventDto[],
    ipAddress: string,
    userAgent: string,
    country?: string
  ): Promise<{ success: boolean; eventsTracked: number }> {
    try {
      const analyticsEvents = events.map(event => {
        const analyticsEvent = this.analyticsEventRepository.create({
          eventType: event.type,
          eventName: event.name,
          userId: event.userId,
          sessionId: event.sessionId,
          pageUrl: event.pageUrl,
          referrer: event.referrer,
          eventProperties: event.properties,
          userProperties: event.userProperties,
          source: event.source,
          medium: event.medium,
          campaign: event.campaign,
          value: event.value,
          currency: event.currency,
          isConversion: event.isConversion || false,
          clientTimestamp: event.clientTimestamp ? new Date(event.clientTimestamp) : null,
          ipAddress,
          userAgent,
          country
        });

        // Extract device info from user agent
        this.enrichEventWithDeviceInfo(analyticsEvent, userAgent);

        return analyticsEvent;
      });

      await this.analyticsEventRepository.save(analyticsEvents);

      return {
        success: true,
        eventsTracked: analyticsEvents.length
      };
    } catch (error) {
      console.error('Failed to track analytics events:', error);
      return {
        success: false,
        eventsTracked: 0
      };
    }
  }

  async trackConversionEvent(conversionData: ConversionEventDto): Promise<void> {
    try {
      const conversionEvent = this.analyticsEventRepository.create({
        eventType: 'conversion',
        eventName: conversionData.eventName,
        userId: conversionData.userId,
        sessionId: conversionData.sessionId,
        value: conversionData.value,
        currency: conversionData.currency || 'USD',
        isConversion: true,
        eventProperties: {
          ...conversionData.properties,
          leadId: conversionData.leadId
        }
      });

      await this.analyticsEventRepository.save(conversionEvent);
    } catch (error) {
      console.error('Failed to track conversion event:', error);
    }
  }

  async getDashboardData(query: AnalyticsDashboardDto): Promise<AnalyticsDashboardResponseDto> {
    const dateFrom = query.dateFrom ? new Date(query.dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const dateTo = query.dateTo ? new Date(query.dateTo) : new Date();

    const [
      overview,
      traffic,
      conversions,
      content,
      campaigns
    ] = await Promise.all([
      this.getOverviewMetrics(dateFrom, dateTo),
      this.getTrafficMetrics(dateFrom, dateTo),
      this.getConversionMetrics(dateFrom, dateTo),
      this.getContentMetrics(dateFrom, dateTo),
      this.getCampaignMetrics(dateFrom, dateTo)
    ]);

    return {
      overview,
      traffic,
      conversions,
      content,
      campaigns
    };
  }

  private async getOverviewMetrics(dateFrom: Date, dateTo: Date) {
    const totalUsers = await this.analyticsEventRepository
      .createQueryBuilder('event')
      .select('COUNT(DISTINCT event.sessionId)', 'count')
      .where('event.createdAt BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo })
      .getRawOne();

    const activeUsers = await this.analyticsEventRepository
      .createQueryBuilder('event')
      .select('COUNT(DISTINCT event.sessionId)', 'count')
      .where('event.createdAt BETWEEN :dateFrom AND :dateTo', { 
        dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        dateTo 
      })
      .getRawOne();

    const totalConversions = await this.analyticsEventRepository
      .createQueryBuilder('event')
      .where('event.isConversion = true')
      .andWhere('event.createdAt BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo })
      .getCount();

    const totalVisitors = parseInt(totalUsers.count) || 0;
    const conversionRate = totalVisitors > 0 ? (totalConversions / totalVisitors) * 100 : 0;

    // Mock revenue calculation - should be connected to actual payment data
    const revenue = totalConversions * 45; // Average revenue per conversion

    return {
      totalUsers: totalVisitors,
      activeUsers: parseInt(activeUsers.count) || 0,
      conversionRate: Math.round(conversionRate * 100) / 100,
      revenue
    };
  }

  private async getTrafficMetrics(dateFrom: Date, dateTo: Date) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayStart.setHours(23, 59, 59, 999);

    const dailyVisitors = await this.analyticsEventRepository
      .createQueryBuilder('event')
      .select('COUNT(DISTINCT event.sessionId)', 'count')
      .where('event.eventType = :type', { type: 'page_view' })
      .andWhere('event.createdAt BETWEEN :todayStart AND :todayEnd', { todayStart, todayEnd })
      .getRawOne();

    const trafficSources = await this.analyticsEventRepository
      .createQueryBuilder('event')
      .select('event.source', 'source')
      .addSelect('COUNT(DISTINCT event.sessionId)', 'visitors')
      .where('event.createdAt BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo })
      .andWhere('event.source IS NOT NULL')
      .groupBy('event.source')
      .getRawMany();

    const totalVisitors = trafficSources.reduce((sum, source) => sum + parseInt(source.visitors), 0);

    const getSourcePercentage = (sourceName: string) => {
      const source = trafficSources.find(s => s.source === sourceName);
      return source ? Math.round((parseInt(source.visitors) / totalVisitors) * 100) : 0;
    };

    return {
      dailyVisitors: parseInt(dailyVisitors.count) || 0,
      organicTraffic: getSourcePercentage('google'),
      directTraffic: getSourcePercentage('direct'),
      referralTraffic: getSourcePercentage('referral')
    };
  }

  private async getConversionMetrics(dateFrom: Date, dateTo: Date) {
    const totalSessions = await this.analyticsEventRepository
      .createQueryBuilder('event')
      .select('COUNT(DISTINCT event.sessionId)', 'count')
      .where('event.createdAt BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo })
      .getRawOne();

    const leadCaptures = await this.leadRepository
      .createQueryBuilder('lead')
      .where('lead.createdAt BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo })
      .getCount();

    const signups = await this.leadRepository
      .createQueryBuilder('lead')
      .where('lead.status = :status', { status: 'converted' })
      .andWhere('lead.convertedAt BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo })
      .getCount();

    const totalConversions = await this.analyticsEventRepository
      .createQueryBuilder('event')
      .where('event.isConversion = true')
      .andWhere('event.createdAt BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo })
      .getCount();

    const conversionValue = await this.analyticsEventRepository
      .createQueryBuilder('event')
      .select('SUM(event.value)', 'total')
      .where('event.isConversion = true')
      .andWhere('event.value IS NOT NULL')
      .andWhere('event.createdAt BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo })
      .getRawOne();

    const totalSessionCount = parseInt(totalSessions.count) || 1;

    return {
      leadCaptureRate: Math.round((leadCaptures / totalSessionCount) * 10000) / 100,
      signupRate: Math.round((signups / totalSessionCount) * 10000) / 100,
      totalConversions,
      conversionValue: parseFloat(conversionValue.total) || 0
    };
  }

  private async getContentMetrics(dateFrom: Date, dateTo: Date) {
    const mostViewedPages = await this.analyticsEventRepository
      .createQueryBuilder('event')
      .select('event.pageUrl', 'url')
      .addSelect('COUNT(*)', 'views')
      .addSelect('MAX(event.eventProperties)', 'properties')
      .where('event.eventType = :type', { type: 'page_view' })
      .andWhere('event.createdAt BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo })
      .andWhere('event.pageUrl IS NOT NULL')
      .groupBy('event.pageUrl')
      .orderBy('views', 'DESC')
      .limit(5)
      .getRawMany();

    const topPerformingContent = await this.analyticsEventRepository
      .createQueryBuilder('event')
      .select('event.eventProperties', 'properties')
      .addSelect('COUNT(*)', 'views')
      .where('event.eventType = :type', { type: 'content_view' })
      .andWhere('event.createdAt BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo })
      .groupBy('event.eventProperties')
      .orderBy('views', 'DESC')
      .limit(5)
      .getRawMany();

    return {
      mostViewedPages: mostViewedPages.map(page => ({
        url: page.url,
        title: this.extractPageTitle(page.url),
        views: parseInt(page.views)
      })),
      topPerformingContent: topPerformingContent.map(content => ({
        id: content.properties?.contentId || 'unknown',
        title: content.properties?.title || 'Unknown Content',
        views: parseInt(content.views),
        conversionRate: Math.random() * 10 // Mock conversion rate - should be calculated from actual data
      }))
    };
  }

  private async getCampaignMetrics(dateFrom: Date, dateTo: Date) {
    const topSources = await this.analyticsEventRepository
      .createQueryBuilder('event')
      .select('event.source', 'source')
      .addSelect('COUNT(DISTINCT event.sessionId)', 'visitors')
      .addSelect('COUNT(CASE WHEN event.isConversion = true THEN 1 END)', 'conversions')
      .where('event.createdAt BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo })
      .andWhere('event.source IS NOT NULL')
      .groupBy('event.source')
      .orderBy('visitors', 'DESC')
      .limit(5)
      .getRawMany();

    const recentCampaigns = await this.analyticsEventRepository
      .createQueryBuilder('event')
      .select('event.campaign', 'campaign')
      .addSelect('COUNT(*)', 'impressions')
      .addSelect('COUNT(DISTINCT event.sessionId)', 'clicks')
      .addSelect('COUNT(CASE WHEN event.isConversion = true THEN 1 END)', 'conversions')
      .where('event.createdAt BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo })
      .andWhere('event.campaign IS NOT NULL')
      .groupBy('event.campaign')
      .orderBy('impressions', 'DESC')
      .limit(5)
      .getRawMany();

    return {
      topSources: topSources.map(source => ({
        source: source.source,
        visitors: parseInt(source.visitors),
        conversions: parseInt(source.conversions),
        conversionRate: parseInt(source.visitors) > 0 
          ? Math.round((parseInt(source.conversions) / parseInt(source.visitors)) * 10000) / 100
          : 0
      })),
      recentCampaigns: recentCampaigns.map(campaign => ({
        campaign: campaign.campaign,
        impressions: parseInt(campaign.impressions),
        clicks: parseInt(campaign.clicks),
        conversions: parseInt(campaign.conversions),
        cost: Math.random() * 500, // Mock data
        roas: Math.random() * 5 // Mock ROAS
      }))
    };
  }

  private enrichEventWithDeviceInfo(event: AnalyticsEvent, userAgent: string): void {
    // Simple user agent parsing - in production, use a proper library like ua-parser-js
    event.device = this.detectDevice(userAgent);
    event.browser = this.detectBrowser(userAgent);
    event.os = this.detectOS(userAgent);
  }

  private detectDevice(userAgent: string): string {
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      return /iPad/.test(userAgent) ? 'tablet' : 'mobile';
    }
    return 'desktop';
  }

  private detectBrowser(userAgent: string): string {
    if (/Chrome/.test(userAgent)) return 'Chrome';
    if (/Firefox/.test(userAgent)) return 'Firefox';
    if (/Safari/.test(userAgent)) return 'Safari';
    if (/Edge/.test(userAgent)) return 'Edge';
    return 'Unknown';
  }

  private detectOS(userAgent: string): string {
    if (/Windows/.test(userAgent)) return 'Windows';
    if (/Macintosh/.test(userAgent)) return 'macOS';
    if (/Linux/.test(userAgent)) return 'Linux';
    if (/Android/.test(userAgent)) return 'Android';
    if (/iPhone|iPad/.test(userAgent)) return 'iOS';
    return 'Unknown';
  }

  private extractPageTitle(url: string): string {
    // Simple title extraction from URL - in production, this would be stored in the event
    const path = url.split('/').pop() || '';
    return path.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase());
  }
}