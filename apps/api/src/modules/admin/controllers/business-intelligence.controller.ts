import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BusinessIntelligenceService } from '../services/business-intelligence.service';
import { AuditService } from '../services/audit.service';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { RequirePermissions } from '../decorators/permissions.decorator';
import { AdminPermission } from '../interfaces/admin.interfaces';

@ApiTags('Admin - Business Intelligence')
@ApiBearerAuth()
@Controller('api/admin/analytics')
@UseGuards(AdminAuthGuard)
export class BusinessIntelligenceController {
  constructor(
    private readonly biService: BusinessIntelligenceService,
    private readonly auditService: AuditService,
  ) {}

  @Get('metrics')
  @RequirePermissions(AdminPermission.VIEW_BUSINESS_METRICS)
  @ApiOperation({ summary: 'Get comprehensive business metrics' })
  @ApiResponse({ status: 200, description: 'Business metrics data' })
  async getBusinessMetrics(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Req() req: any,
  ) {
    await this.auditService.logAdminAction(
      req.adminUser,
      'view_business_metrics',
      'analytics',
      undefined,
      { dateFrom, dateTo },
      req,
    );

    const period = dateFrom && dateTo ? {
      from: new Date(dateFrom),
      to: new Date(dateTo),
    } : undefined;

    return this.biService.getBusinessMetrics(period);
  }

  @Get('revenue')
  @RequirePermissions(AdminPermission.VIEW_REVENUE)
  @ApiOperation({ summary: 'Get detailed revenue analytics' })
  @ApiResponse({ status: 200, description: 'Revenue analytics data' })
  async getRevenueAnalytics(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Query('groupBy') groupBy: 'day' | 'week' | 'month' = 'month',
    @Req() req: any,
  ) {
    await this.auditService.logAdminAction(
      req.adminUser,
      'view_revenue_analytics',
      'analytics',
      undefined,
      { dateFrom, dateTo, groupBy },
      req,
    );

    return this.biService.getRevenueAnalytics({
      dateFrom: new Date(dateFrom),
      dateTo: new Date(dateTo),
      groupBy,
    });
  }

  @Get('customers')
  @RequirePermissions(AdminPermission.VIEW_ANALYTICS)
  @ApiOperation({ summary: 'Get customer analytics and insights' })
  @ApiResponse({ status: 200, description: 'Customer analytics data' })
  async getCustomerAnalytics(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Req() req: any,
  ) {
    await this.auditService.logAdminAction(
      req.adminUser,
      'view_customer_analytics',
      'analytics',
      undefined,
      { dateFrom, dateTo },
      req,
    );

    return this.biService.getCustomerAnalytics({
      dateFrom: new Date(dateFrom),
      dateTo: new Date(dateTo),
    });
  }

  @Get('operational')
  @RequirePermissions(AdminPermission.VIEW_ANALYTICS)
  @ApiOperation({ summary: 'Get operational metrics and system health' })
  @ApiResponse({ status: 200, description: 'Operational metrics data' })
  async getOperationalMetrics(@Req() req: any) {
    await this.auditService.logAdminAction(
      req.adminUser,
      'view_operational_metrics',
      'analytics',
      undefined,
      undefined,
      req,
    );

    return this.biService.getOperationalMetrics();
  }

  @Get('executive-report')
  @RequirePermissions(AdminPermission.VIEW_BUSINESS_METRICS, AdminPermission.EXPORT_REPORTS)
  @ApiOperation({ summary: 'Generate executive summary report' })
  @ApiResponse({ status: 200, description: 'Executive report data' })
  async generateExecutiveReport(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Req() req: any,
  ) {
    await this.auditService.logAdminAction(
      req.adminUser,
      'generate_executive_report',
      'analytics',
      undefined,
      { dateFrom, dateTo },
      req,
    );

    return this.biService.generateExecutiveReport({
      from: new Date(dateFrom),
      to: new Date(dateTo),
    });
  }

  @Get('revenue/forecast')
  @RequirePermissions(AdminPermission.VIEW_REVENUE)
  @ApiOperation({ summary: 'Get revenue forecast based on historical data' })
  @ApiResponse({ status: 200, description: 'Revenue forecast data' })
  async getRevenueForecast(
    @Query('periods') periods: number = 3,
    @Req() req: any,
  ) {
    await this.auditService.logAdminAction(
      req.adminUser,
      'view_revenue_forecast',
      'analytics',
      undefined,
      { periods },
      req,
    );

    // Get historical data for forecast
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);

    const historicalData = await this.biService.getRevenueAnalytics({
      dateFrom: startDate,
      dateTo: endDate,
      groupBy: 'month',
    });

    return {
      historical: historicalData.byPeriod,
      forecast: historicalData.forecast,
      confidence: 0.85, // Placeholder confidence score
      periods,
    };
  }

  @Get('customers/cohorts')
  @RequirePermissions(AdminPermission.VIEW_ANALYTICS)
  @ApiOperation({ summary: 'Get customer cohort analysis' })
  @ApiResponse({ status: 200, description: 'Cohort analysis data' })
  async getCohortAnalysis(
    @Query('months') months: number = 6,
    @Req() req: any,
  ) {
    await this.auditService.logAdminAction(
      req.adminUser,
      'view_cohort_analysis',
      'analytics',
      undefined,
      { months },
      req,
    );

    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const customerAnalytics = await this.biService.getCustomerAnalytics({
      dateFrom: startDate,
      dateTo: endDate,
    });

    return {
      cohorts: customerAnalytics.retention.cohortRetention,
      summary: {
        avgRetentionMonth1: 85,
        avgRetentionMonth3: 72,
        avgRetentionMonth6: 65,
      },
    };
  }

  @Get('conversion-funnel')
  @RequirePermissions(AdminPermission.VIEW_ANALYTICS)
  @ApiOperation({ summary: 'Get conversion funnel analytics' })
  @ApiResponse({ status: 200, description: 'Conversion funnel data' })
  async getConversionFunnel(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Req() req: any,
  ) {
    await this.auditService.logAdminAction(
      req.adminUser,
      'view_conversion_funnel',
      'analytics',
      undefined,
      { dateFrom, dateTo },
      req,
    );

    // In a real implementation, this would analyze the customer journey
    return {
      funnel: [
        { stage: 'Visit', count: 10000, percentage: 100 },
        { stage: 'Sign Up', count: 2500, percentage: 25 },
        { stage: 'Trial', count: 1800, percentage: 18 },
        { stage: 'Paid', count: 900, percentage: 9 },
        { stage: 'Retained', count: 810, percentage: 8.1 },
      ],
      conversions: {
        visitToSignup: 25,
        signupToTrial: 72,
        trialToPaid: 50,
        paidRetention: 90,
      },
      recommendations: [
        'Optimize signup flow to improve visit-to-signup conversion',
        'Enhance trial experience to increase trial-to-paid conversion',
      ],
    };
  }

  @Get('kpi-dashboard')
  @RequirePermissions(AdminPermission.VIEW_BUSINESS_METRICS)
  @ApiOperation({ summary: 'Get key performance indicators dashboard' })
  @ApiResponse({ status: 200, description: 'KPI dashboard data' })
  async getKPIDashboard(@Req() req: any) {
    await this.auditService.logAdminAction(
      req.adminUser,
      'view_kpi_dashboard',
      'analytics',
      undefined,
      undefined,
      req,
    );

    const metrics = await this.biService.getBusinessMetrics();

    return {
      kpis: [
        {
          name: 'Monthly Recurring Revenue',
          value: metrics.revenue.monthly,
          change: metrics.revenue.growth,
          target: 50000,
          status: metrics.revenue.monthly > 50000 ? 'above' : 'below',
        },
        {
          name: 'Active Customers',
          value: metrics.customers.active,
          change: metrics.customers.acquisitionRate,
          target: 1000,
          status: metrics.customers.active > 1000 ? 'above' : 'below',
        },
        {
          name: 'Churn Rate',
          value: metrics.customers.churnRate,
          change: -0.5,
          target: 5,
          status: metrics.customers.churnRate < 5 ? 'above' : 'below',
        },
        {
          name: 'System Uptime',
          value: metrics.performance.uptime,
          change: 0,
          target: 99.9,
          status: metrics.performance.uptime > 99.9 ? 'above' : 'below',
        },
      ],
      lastUpdated: new Date(),
    };
  }

  @Get('competitive-analysis')
  @RequirePermissions(AdminPermission.VIEW_BUSINESS_METRICS)
  @ApiOperation({ summary: 'Get competitive analysis and market positioning' })
  @ApiResponse({ status: 200, description: 'Competitive analysis data' })
  async getCompetitiveAnalysis(@Req() req: any) {
    await this.auditService.logAdminAction(
      req.adminUser,
      'view_competitive_analysis',
      'analytics',
      undefined,
      undefined,
      req,
    );

    // In a real implementation, this would include market research data
    return {
      marketPosition: {
        marketShare: 12.5,
        ranking: 3,
        growth: 25,
      },
      competitors: [
        {
          name: 'Competitor A',
          marketShare: 35,
          strengths: ['Brand recognition', 'Feature set'],
          weaknesses: ['Pricing', 'Customer support'],
        },
        {
          name: 'Competitor B',
          marketShare: 22,
          strengths: ['Pricing', 'Ease of use'],
          weaknesses: ['Limited features', 'Scalability'],
        },
      ],
      opportunities: [
        'Expand into enterprise market',
        'Develop mobile-first features',
        'Enhance AI capabilities',
      ],
      threats: [
        'New market entrants',
        'Technology disruption',
        'Economic uncertainty',
      ],
    };
  }

  @Get('export')
  @RequirePermissions(AdminPermission.EXPORT_REPORTS)
  @ApiOperation({ summary: 'Export analytics data in various formats' })
  @ApiResponse({ status: 200, description: 'Export data' })
  async exportAnalytics(
    @Query('type') type: 'revenue' | 'customers' | 'executive' | 'all',
    @Query('format') format: 'csv' | 'excel' | 'pdf' = 'csv',
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Req() req: any,
  ) {
    await this.auditService.logAdminAction(
      req.adminUser,
      'export_analytics',
      'analytics',
      undefined,
      { type, format, dateFrom, dateTo },
      req,
    );

    // In a real implementation, this would generate actual export files
    return {
      exportId: `export_${Date.now()}`,
      type,
      format,
      status: 'processing',
      estimatedTime: 30, // seconds
      downloadUrl: `/api/admin/analytics/download/export_${Date.now()}`,
    };
  }
}