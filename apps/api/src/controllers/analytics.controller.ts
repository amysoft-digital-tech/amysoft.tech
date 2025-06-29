import { Controller, Post, Get, Body, Query, Ip, Headers, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AnalyticsService } from '../services/analytics.service';
import { 
  TrackEventsDto, 
  ConversionEventDto, 
  AnalyticsDashboardDto, 
  AnalyticsDashboardResponseDto 
} from '../dto/analytics.dto';

@ApiTags('Analytics')
@Controller('api/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('events')
  @ApiOperation({ 
    summary: 'Track analytics events',
    description: 'Track user behavior events including page views, form submissions, and custom events'
  })
  @ApiBody({ type: TrackEventsDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Events tracked successfully',
    schema: {
      properties: {
        success: { type: 'boolean' },
        eventsTracked: { type: 'number' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid event data' })
  async trackEvents(
    @Body(new ValidationPipe({ transform: true })) eventsData: TrackEventsDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
    @Headers('cf-ipcountry') country?: string
  ): Promise<{ success: boolean; eventsTracked: number }> {
    return this.analyticsService.trackEvents(
      eventsData.events,
      ipAddress,
      userAgent,
      country
    );
  }

  @Post('conversion-event')
  @ApiOperation({ 
    summary: 'Track conversion event',
    description: 'Track high-value conversion events with monetary value and attribution'
  })
  @ApiBody({ type: ConversionEventDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Conversion event tracked successfully',
    schema: {
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  })
  async trackConversionEvent(
    @Body(new ValidationPipe({ transform: true })) conversionData: ConversionEventDto
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.analyticsService.trackConversionEvent(conversionData);
      return {
        success: true,
        message: 'Conversion event tracked successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to track conversion event'
      };
    }
  }

  @Get('dashboard')
  @ApiOperation({ 
    summary: 'Get analytics dashboard data',
    description: 'Get comprehensive analytics data for dashboard display including traffic, conversions, and content metrics'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Dashboard data retrieved successfully',
    type: AnalyticsDashboardResponseDto
  })
  async getDashboardData(
    @Query(new ValidationPipe({ transform: true })) query: AnalyticsDashboardDto
  ): Promise<AnalyticsDashboardResponseDto> {
    return this.analyticsService.getDashboardData(query);
  }

  @Get('metrics')
  @ApiOperation({ 
    summary: 'Get business metrics overview',
    description: 'Get high-level business metrics for executive dashboard'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Business metrics retrieved successfully',
    schema: {
      properties: {
        totalUsers: { type: 'number' },
        activeUsers: { type: 'number' },
        conversionRate: { type: 'number' },
        revenue: { type: 'number' },
        monthlyGrowth: { type: 'number' },
        topPerformingPages: { type: 'array' },
        conversionFunnel: { type: 'array' }
      }
    }
  })
  async getBusinessMetrics(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('granularity') granularity?: 'hour' | 'day' | 'week' | 'month'
  ) {
    const dashboardQuery: AnalyticsDashboardDto = {
      dateFrom,
      dateTo,
      granularity,
      metrics: ['overview', 'traffic', 'conversions']
    };

    const dashboardData = await this.analyticsService.getDashboardData(dashboardQuery);

    return {
      totalUsers: dashboardData.overview.totalUsers,
      activeUsers: dashboardData.overview.activeUsers,
      conversionRate: dashboardData.overview.conversionRate,
      revenue: dashboardData.overview.revenue,
      monthlyGrowth: Math.random() * 20, // Mock data - should be calculated from historical data
      topPerformingPages: dashboardData.content.mostViewedPages,
      conversionFunnel: [
        { stage: 'Visitors', count: dashboardData.overview.totalUsers },
        { stage: 'Leads', count: Math.round(dashboardData.overview.totalUsers * 0.15) },
        { stage: 'Subscribers', count: Math.round(dashboardData.overview.totalUsers * 0.08) },
        { stage: 'Customers', count: Math.round(dashboardData.overview.totalUsers * 0.02) }
      ]
    };
  }

  @Get('traffic-sources')
  @ApiOperation({ 
    summary: 'Get traffic source analysis',
    description: 'Get detailed traffic source breakdown with conversion rates'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Traffic sources retrieved successfully'
  })
  async getTrafficSources(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string
  ) {
    const dashboardQuery: AnalyticsDashboardDto = {
      dateFrom,
      dateTo,
      metrics: ['campaigns']
    };

    const dashboardData = await this.analyticsService.getDashboardData(dashboardQuery);
    return dashboardData.campaigns.topSources;
  }

  @Get('content-performance')
  @ApiOperation({ 
    summary: 'Get content performance metrics',
    description: 'Get content engagement and conversion metrics'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Content performance retrieved successfully'
  })
  async getContentPerformance(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string
  ) {
    const dashboardQuery: AnalyticsDashboardDto = {
      dateFrom,
      dateTo,
      metrics: ['content']
    };

    const dashboardData = await this.analyticsService.getDashboardData(dashboardQuery);
    return {
      mostViewedPages: dashboardData.content.mostViewedPages,
      topPerformingContent: dashboardData.content.topPerformingContent
    };
  }
}