import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface CampaignPerformanceMetrics {
  campaignId: string;
  campaignName: string;
  type: 'email' | 'social' | 'content' | 'paid_ads' | 'webinar' | 'organic';
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  dateRange: DateRange;
  budget: BudgetMetrics;
  reach: ReachMetrics;
  engagement: EngagementMetrics;
  conversion: ConversionMetrics;
  roi: ROIMetrics;
  attribution: AttributionMetrics;
  trends: TrendData[];
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
  duration: number; // days
}

export interface BudgetMetrics {
  allocated: number;
  spent: number;
  remaining: number;
  utilization: number; // percentage
  costPerLead: number;
  costPerAcquisition: number;
  costPerClick?: number;
  costPerImpression?: number;
}

export interface ReachMetrics {
  impressions: number;
  uniqueReach: number;
  frequency: number;
  deliveredEmails?: number;
  bouncedEmails?: number;
  deliveryRate?: number;
  openRate?: number;
}

export interface EngagementMetrics {
  clicks: number;
  clickThroughRate: number;
  emailOpens?: number;
  emailClicks?: number;
  socialShares?: number;
  comments?: number;
  likes?: number;
  videoViews?: number;
  timeSpent: number; // average seconds
  pageViews: number;
  bounceRate: number;
}

export interface ConversionMetrics {
  leads: number;
  qualifiedLeads: number;
  opportunities: number;
  customers: number;
  leadConversionRate: number;
  opportunityConversionRate: number;
  customerConversionRate: number;
  revenue: number;
  averageOrderValue: number;
  lifetimeValue: number;
}

export interface ROIMetrics {
  return: number;
  investment: number;
  roi: number; // percentage
  roas: number; // return on ad spend
  paybackPeriod: number; // months
  marginContribution: number;
  profitability: number;
}

export interface AttributionMetrics {
  firstTouchConversions: number;
  lastTouchConversions: number;
  assistedConversions: number;
  attributionValue: number;
  influenceScore: number;
  crossChannelImpact: CrossChannelImpact[];
}

export interface CrossChannelImpact {
  channel: string;
  touchpoints: number;
  influence: number; // percentage
  value: number;
}

export interface TrendData {
  date: Date;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
}

export interface MarketingDashboard {
  overview: DashboardOverview;
  campaignPerformance: CampaignPerformanceMetrics[];
  channelPerformance: ChannelPerformance[];
  leadFunnel: FunnelMetrics;
  customerAcquisition: AcquisitionMetrics;
  revenueAttribution: RevenueAttribution;
  predictiveAnalytics: PredictiveMetrics;
  alerts: MarketingAlert[];
}

export interface DashboardOverview {
  totalSpend: number;
  totalRevenue: number;
  totalLeads: number;
  totalCustomers: number;
  overallROI: number;
  averageCostPerLead: number;
  averageCostPerAcquisition: number;
  conversionRate: number;
  growthRate: number;
  marketingQualifiedLeads: number;
}

export interface ChannelPerformance {
  channel: string;
  spend: number;
  leads: number;
  customers: number;
  revenue: number;
  roi: number;
  cpl: number; // cost per lead
  cpa: number; // cost per acquisition
  conversionRate: number;
  trend: 'up' | 'down' | 'stable';
  efficiency: number; // 0-100 score
}

export interface FunnelMetrics {
  stages: FunnelStage[];
  conversionRates: number[];
  dropoffPoints: DropoffAnalysis[];
  bottlenecks: string[];
  optimizationOpportunities: OptimizationOpportunity[];
}

export interface FunnelStage {
  name: string;
  visitors: number;
  conversions: number;
  conversionRate: number;
  dropoffRate: number;
  timeToConvert: number; // average days
}

export interface DropoffAnalysis {
  stage: string;
  dropoffRate: number;
  commonReasons: string[];
  improvementSuggestions: string[];
}

export interface OptimizationOpportunity {
  area: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  description: string;
  potentialImpact: number; // percentage improvement
}

export interface AcquisitionMetrics {
  newCustomers: number;
  customerAcquisitionCost: number;
  customerLifetimeValue: number;
  ltvcacRatio: number;
  paybackPeriod: number;
  churnRate: number;
  retentionRate: number;
  cohortAnalysis: CohortAnalysis[];
}

export interface CohortAnalysis {
  cohort: string;
  size: number;
  acquisitionCost: number;
  retentionRates: number[]; // by month
  revenuePerCustomer: number[];
  lifetimeValue: number;
}

export interface RevenueAttribution {
  totalRevenue: number;
  attributedRevenue: number;
  unattributedRevenue: number;
  channelAttribution: ChannelAttribution[];
  campaignAttribution: CampaignAttribution[];
  touchpointAttribution: TouchpointAttribution[];
}

export interface ChannelAttribution {
  channel: string;
  revenue: number;
  percentage: number;
  customers: number;
  avgOrderValue: number;
}

export interface CampaignAttribution {
  campaignId: string;
  campaignName: string;
  revenue: number;
  percentage: number;
  influence: number;
}

export interface TouchpointAttribution {
  touchpoint: string;
  firstTouch: number;
  lastTouch: number;
  assisted: number;
  totalValue: number;
}

export interface PredictiveMetrics {
  forecastedRevenue: ForecastData[];
  leadScoringAccuracy: number;
  churnPrediction: ChurnPrediction[];
  budgetOptimization: BudgetOptimization[];
  seasonalTrends: SeasonalTrend[];
}

export interface ForecastData {
  period: string;
  predictedRevenue: number;
  confidenceInterval: { low: number; high: number };
  seasonalFactor: number;
}

export interface ChurnPrediction {
  segment: string;
  churnProbability: number;
  customersAtRisk: number;
  preventionActions: string[];
  potentialRevenueLoss: number;
}

export interface BudgetOptimization {
  channel: string;
  currentAllocation: number;
  recommendedAllocation: number;
  expectedImpact: number;
  reasoning: string;
}

export interface SeasonalTrend {
  month: string;
  historicalPerformance: number;
  seasonalityIndex: number;
  recommendedAdjustment: number;
}

export interface MarketingAlert {
  id: string;
  type: 'performance' | 'budget' | 'conversion' | 'quality' | 'trend';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedCampaigns: string[];
  recommendedActions: string[];
  timestamp: Date;
  isRead: boolean;
}

export interface ABTestResults {
  testId: string;
  testName: string;
  hypothesis: string;
  variants: ABTestVariant[];
  winningVariant?: string;
  confidenceLevel: number;
  statisticalSignificance: boolean;
  uplift: number;
  pValue: number;
  sampleSize: number;
  testDuration: number; // days
  results: ABTestMetrics;
}

export interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  trafficAllocation: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  visitors: number;
}

export interface ABTestMetrics {
  primaryMetric: string;
  secondaryMetrics: string[];
  performance: Record<string, VariantPerformance>;
  recommendations: string[];
}

export interface VariantPerformance {
  variantId: string;
  value: number;
  confidenceInterval: { low: number; high: number };
  improvement: number; // percentage vs control
}

@Injectable()
export class CampaignAnalyticsService {
  private readonly logger = new Logger(CampaignAnalyticsService.name);
  private campaignMetrics: CampaignPerformanceMetrics[] = [];
  private abTestResults: ABTestResults[] = [];
  private marketingAlerts: MarketingAlert[] = [];

  constructor(private configService: ConfigService) {
    this.initializeSampleData();
  }

  private initializeSampleData(): void {
    // Initialize with sample campaign metrics
    this.campaignMetrics = [
      {
        campaignId: 'foundation_launch',
        campaignName: 'Foundation Tier Launch Campaign',
        type: 'email',
        status: 'active',
        dateRange: {
          startDate: new Date('2024-06-01'),
          endDate: new Date('2024-06-30'),
          duration: 30
        },
        budget: {
          allocated: 5000,
          spent: 3200,
          remaining: 1800,
          utilization: 64,
          costPerLead: 24.56,
          costPerAcquisition: 89.32
        },
        reach: {
          impressions: 45000,
          uniqueReach: 32000,
          frequency: 1.4,
          deliveredEmails: 28500,
          bouncedEmails: 1500,
          deliveryRate: 95,
          openRate: 28.5
        },
        engagement: {
          clicks: 3200,
          clickThroughRate: 11.2,
          emailOpens: 8125,
          emailClicks: 2400,
          timeSpent: 145,
          pageViews: 12500,
          bounceRate: 32.1
        },
        conversion: {
          leads: 130,
          qualifiedLeads: 78,
          opportunities: 45,
          customers: 36,
          leadConversionRate: 4.06,
          opportunityConversionRate: 57.7,
          customerConversionRate: 80,
          revenue: 8976,
          averageOrderValue: 249.33,
          lifetimeValue: 850
        },
        roi: {
          return: 8976,
          investment: 3200,
          roi: 180.5,
          roas: 2.8,
          paybackPeriod: 2.3,
          marginContribution: 5776,
          profitability: 64.3
        },
        attribution: {
          firstTouchConversions: 18,
          lastTouchConversions: 24,
          assistedConversions: 12,
          attributionValue: 6240,
          influenceScore: 85,
          crossChannelImpact: [
            { channel: 'email', touchpoints: 156, influence: 45, value: 4032 },
            { channel: 'organic_search', touchpoints: 89, influence: 28, value: 2510 },
            { channel: 'social_media', touchpoints: 34, influence: 15, value: 936 }
          ]
        },
        trends: this.generateTrendData(30)
      }
    ];

    this.logger.log(`Initialized campaign analytics with ${this.campaignMetrics.length} campaigns`);
  }

  private generateTrendData(days: number): TrendData[] {
    const trends: TrendData[] = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      trends.push({
        date,
        impressions: Math.floor(Math.random() * 2000) + 1000,
        clicks: Math.floor(Math.random() * 200) + 50,
        conversions: Math.floor(Math.random() * 20) + 1,
        spend: Math.floor(Math.random() * 200) + 100,
        revenue: Math.floor(Math.random() * 800) + 200
      });
    }

    return trends;
  }

  async getMarketingDashboard(): Promise<MarketingDashboard> {
    const overview = await this.calculateDashboardOverview();
    const channelPerformance = await this.getChannelPerformance();
    const leadFunnel = await this.getFunnelMetrics();
    const customerAcquisition = await this.getAcquisitionMetrics();
    const revenueAttribution = await this.getRevenueAttribution();
    const predictiveAnalytics = await this.getPredictiveMetrics();
    const alerts = await this.getMarketingAlerts();

    return {
      overview,
      campaignPerformance: this.campaignMetrics,
      channelPerformance,
      leadFunnel,
      customerAcquisition,
      revenueAttribution,
      predictiveAnalytics,
      alerts
    };
  }

  private async calculateDashboardOverview(): Promise<DashboardOverview> {
    const totalSpend = this.campaignMetrics.reduce((sum, c) => sum + c.budget.spent, 0);
    const totalRevenue = this.campaignMetrics.reduce((sum, c) => sum + c.conversion.revenue, 0);
    const totalLeads = this.campaignMetrics.reduce((sum, c) => sum + c.conversion.leads, 0);
    const totalCustomers = this.campaignMetrics.reduce((sum, c) => sum + c.conversion.customers, 0);

    return {
      totalSpend,
      totalRevenue,
      totalLeads,
      totalCustomers,
      overallROI: totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0,
      averageCostPerLead: totalLeads > 0 ? totalSpend / totalLeads : 0,
      averageCostPerAcquisition: totalCustomers > 0 ? totalSpend / totalCustomers : 0,
      conversionRate: totalLeads > 0 ? (totalCustomers / totalLeads) * 100 : 0,
      growthRate: 15.3, // Would be calculated from historical data
      marketingQualifiedLeads: this.campaignMetrics.reduce((sum, c) => sum + c.conversion.qualifiedLeads, 0)
    };
  }

  private async getChannelPerformance(): Promise<ChannelPerformance[]> {
    const channels = ['email', 'social_media', 'paid_search', 'organic_search', 'content', 'webinar'];
    
    return channels.map(channel => {
      const channelCampaigns = this.campaignMetrics.filter(c => 
        c.type === channel || c.attribution.crossChannelImpact.some(ci => ci.channel === channel)
      );

      const spend = channelCampaigns.reduce((sum, c) => sum + c.budget.spent, 0);
      const leads = channelCampaigns.reduce((sum, c) => sum + c.conversion.leads, 0);
      const customers = channelCampaigns.reduce((sum, c) => sum + c.conversion.customers, 0);
      const revenue = channelCampaigns.reduce((sum, c) => sum + c.conversion.revenue, 0);

      return {
        channel,
        spend,
        leads,
        customers,
        revenue,
        roi: spend > 0 ? ((revenue - spend) / spend) * 100 : 0,
        cpl: leads > 0 ? spend / leads : 0,
        cpa: customers > 0 ? spend / customers : 0,
        conversionRate: leads > 0 ? (customers / leads) * 100 : 0,
        trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
        efficiency: Math.floor(Math.random() * 40) + 60 // 60-100 efficiency score
      };
    });
  }

  private async getFunnelMetrics(): Promise<FunnelMetrics> {
    const stages: FunnelStage[] = [
      {
        name: 'Awareness',
        visitors: 50000,
        conversions: 8000,
        conversionRate: 16,
        dropoffRate: 84,
        timeToConvert: 0
      },
      {
        name: 'Interest',
        visitors: 8000,
        conversions: 3200,
        conversionRate: 40,
        dropoffRate: 60,
        timeToConvert: 2.5
      },
      {
        name: 'Consideration',
        visitors: 3200,
        conversions: 1280,
        conversionRate: 40,
        dropoffRate: 60,
        timeToConvert: 7.2
      },
      {
        name: 'Intent',
        visitors: 1280,
        conversions: 640,
        conversionRate: 50,
        dropoffRate: 50,
        timeToConvert: 3.8
      },
      {
        name: 'Purchase',
        visitors: 640,
        conversions: 256,
        conversionRate: 40,
        dropoffRate: 60,
        timeToConvert: 1.2
      }
    ];

    const conversionRates = stages.map(s => s.conversionRate);
    
    const dropoffPoints: DropoffAnalysis[] = [
      {
        stage: 'Awareness to Interest',
        dropoffRate: 84,
        commonReasons: ['Unclear value proposition', 'Poor targeting', 'Weak call-to-action'],
        improvementSuggestions: ['Improve ad relevance', 'Better landing page design', 'Clearer messaging']
      },
      {
        stage: 'Interest to Consideration',
        dropoffRate: 60,
        commonReasons: ['Lack of trust signals', 'Price concerns', 'Feature comparison'],
        improvementSuggestions: ['Add testimonials', 'Provide pricing transparency', 'Feature comparison guides']
      }
    ];

    const bottlenecks = ['Awareness to Interest transition', 'Purchase conversion'];
    
    const optimizationOpportunities: OptimizationOpportunity[] = [
      {
        area: 'Landing Page Optimization',
        impact: 'high',
        effort: 'medium',
        description: 'Optimize landing pages for better initial conversion',
        potentialImpact: 25
      },
      {
        area: 'Email Nurturing',
        impact: 'medium',
        effort: 'low',
        description: 'Improve email sequences for consideration stage',
        potentialImpact: 15
      }
    ];

    return {
      stages,
      conversionRates,
      dropoffPoints,
      bottlenecks,
      optimizationOpportunities
    };
  }

  private async getAcquisitionMetrics(): Promise<AcquisitionMetrics> {
    return {
      newCustomers: 256,
      customerAcquisitionCost: 89.32,
      customerLifetimeValue: 850,
      ltvcacRatio: 9.5,
      paybackPeriod: 2.3,
      churnRate: 5.2,
      retentionRate: 94.8,
      cohortAnalysis: [
        {
          cohort: '2024-06',
          size: 256,
          acquisitionCost: 89.32,
          retentionRates: [100, 95, 92, 89, 87, 85],
          revenuePerCustomer: [24.95, 18.50, 15.25, 12.80, 11.60, 10.90],
          lifetimeValue: 850
        }
      ]
    };
  }

  private async getRevenueAttribution(): Promise<RevenueAttribution> {
    const totalRevenue = this.campaignMetrics.reduce((sum, c) => sum + c.conversion.revenue, 0);
    const attributedRevenue = totalRevenue * 0.85; // 85% attribution coverage
    
    return {
      totalRevenue,
      attributedRevenue,
      unattributedRevenue: totalRevenue - attributedRevenue,
      channelAttribution: [
        { channel: 'email', revenue: attributedRevenue * 0.4, percentage: 40, customers: 102, avgOrderValue: 249.33 },
        { channel: 'organic_search', revenue: attributedRevenue * 0.25, percentage: 25, customers: 64, avgOrderValue: 249.33 },
        { channel: 'paid_search', revenue: attributedRevenue * 0.2, percentage: 20, customers: 51, avgOrderValue: 249.33 },
        { channel: 'social_media', revenue: attributedRevenue * 0.15, percentage: 15, customers: 39, avgOrderValue: 249.33 }
      ],
      campaignAttribution: this.campaignMetrics.map(c => ({
        campaignId: c.campaignId,
        campaignName: c.campaignName,
        revenue: c.conversion.revenue,
        percentage: (c.conversion.revenue / totalRevenue) * 100,
        influence: c.attribution.influenceScore
      })),
      touchpointAttribution: [
        { touchpoint: 'First Email Open', firstTouch: 2400, lastTouch: 800, assisted: 1200, totalValue: 4400 },
        { touchpoint: 'Landing Page Visit', firstTouch: 1800, lastTouch: 1200, assisted: 2000, totalValue: 5000 },
        { touchpoint: 'Pricing Page View', firstTouch: 600, lastTouch: 2200, assisted: 800, totalValue: 3600 }
      ]
    };
  }

  private async getPredictiveMetrics(): Promise<PredictiveMetrics> {
    const forecastedRevenue: ForecastData[] = [];
    const currentDate = new Date();
    
    for (let i = 1; i <= 12; i++) {
      const futureDate = new Date(currentDate);
      futureDate.setMonth(futureDate.getMonth() + i);
      
      const baseRevenue = 8976 * (1 + (i * 0.05)); // 5% monthly growth
      const seasonalFactor = 1 + (Math.sin(i * Math.PI / 6) * 0.1); // Seasonal variation
      
      forecastedRevenue.push({
        period: `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}`,
        predictedRevenue: Math.round(baseRevenue * seasonalFactor),
        confidenceInterval: {
          low: Math.round(baseRevenue * seasonalFactor * 0.8),
          high: Math.round(baseRevenue * seasonalFactor * 1.2)
        },
        seasonalFactor
      });
    }

    return {
      forecastedRevenue,
      leadScoringAccuracy: 87.3,
      churnPrediction: [
        {
          segment: 'Low Engagement Users',
          churnProbability: 23.5,
          customersAtRisk: 34,
          preventionActions: ['Re-engagement campaign', 'Personal outreach', 'Special offers'],
          potentialRevenueLoss: 8485
        }
      ],
      budgetOptimization: [
        {
          channel: 'email',
          currentAllocation: 40,
          recommendedAllocation: 45,
          expectedImpact: 12.5,
          reasoning: 'Email shows highest ROI and conversion rates'
        },
        {
          channel: 'paid_search',
          currentAllocation: 35,
          recommendedAllocation: 30,
          expectedImpact: -5,
          reasoning: 'Diminishing returns at current spend levels'
        }
      ],
      seasonalTrends: [
        { month: 'January', historicalPerformance: 85, seasonalityIndex: 0.95, recommendedAdjustment: -10 },
        { month: 'February', historicalPerformance: 92, seasonalityIndex: 1.02, recommendedAdjustment: 5 },
        { month: 'March', historicalPerformance: 108, seasonalityIndex: 1.15, recommendedAdjustment: 15 }
      ]
    };
  }

  async createABTest(test: Omit<ABTestResults, 'id' | 'results' | 'winningVariant' | 'confidenceLevel' | 'statisticalSignificance' | 'uplift' | 'pValue'>): Promise<string> {
    const testId = `abtest_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    const newTest: ABTestResults = {
      id: testId,
      ...test,
      winningVariant: undefined,
      confidenceLevel: 0,
      statisticalSignificance: false,
      uplift: 0,
      pValue: 1,
      results: {
        primaryMetric: 'conversion_rate',
        secondaryMetrics: ['revenue_per_visitor', 'click_through_rate'],
        performance: {},
        recommendations: []
      }
    };

    this.abTestResults.push(newTest);
    this.logger.log(`A/B test created: ${testId}`);
    
    return testId;
  }

  async updateABTestResults(testId: string, results: Partial<ABTestResults>): Promise<boolean> {
    const testIndex = this.abTestResults.findIndex(t => t.id === testId);
    
    if (testIndex === -1) {
      return false;
    }

    this.abTestResults[testIndex] = { ...this.abTestResults[testIndex], ...results };
    
    // Calculate statistical significance
    if (results.variants) {
      await this.calculateStatisticalSignificance(testId);
    }
    
    this.logger.log(`A/B test results updated: ${testId}`);
    return true;
  }

  private async calculateStatisticalSignificance(testId: string): Promise<void> {
    const test = this.abTestResults.find(t => t.id === testId);
    if (!test || test.variants.length < 2) return;

    // Simplified statistical significance calculation
    const control = test.variants[0];
    const variant = test.variants[1];
    
    const controlRate = control.conversionRate / 100;
    const variantRate = variant.conversionRate / 100;
    
    // Calculate p-value (simplified)
    const pooledRate = (control.conversions + variant.conversions) / (control.visitors + variant.visitors);
    const standardError = Math.sqrt(pooledRate * (1 - pooledRate) * (1/control.visitors + 1/variant.visitors));
    const zScore = Math.abs(controlRate - variantRate) / standardError;
    
    // Approximate p-value calculation
    test.pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));
    test.statisticalSignificance = test.pValue < 0.05;
    test.confidenceLevel = (1 - test.pValue) * 100;
    test.uplift = ((variantRate - controlRate) / controlRate) * 100;
    
    if (test.statisticalSignificance) {
      test.winningVariant = variantRate > controlRate ? variant.id : control.id;
    }
  }

  private normalCDF(x: number): number {
    // Approximation of normal cumulative distribution function
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  private erf(x: number): number {
    // Approximation of error function
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  async generateMarketingAlert(alert: Omit<MarketingAlert, 'id' | 'timestamp' | 'isRead'>): Promise<string> {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    const newAlert: MarketingAlert = {
      id: alertId,
      ...alert,
      timestamp: new Date(),
      isRead: false
    };

    this.marketingAlerts.push(newAlert);
    this.logger.log(`Marketing alert generated: ${alert.title}`);
    
    return alertId;
  }

  private async getMarketingAlerts(): Promise<MarketingAlert[]> {
    return this.marketingAlerts
      .filter(alert => !alert.isRead)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10); // Return latest 10 unread alerts
  }

  async getCampaignMetrics(campaignId: string): Promise<CampaignPerformanceMetrics | null> {
    return this.campaignMetrics.find(c => c.campaignId === campaignId) || null;
  }

  async updateCampaignMetrics(campaignId: string, metrics: Partial<CampaignPerformanceMetrics>): Promise<boolean> {
    const index = this.campaignMetrics.findIndex(c => c.campaignId === campaignId);
    
    if (index === -1) {
      return false;
    }

    this.campaignMetrics[index] = { ...this.campaignMetrics[index], ...metrics };
    this.logger.log(`Campaign metrics updated: ${campaignId}`);
    
    return true;
  }

  async getABTestResults(testId?: string): Promise<ABTestResults[]> {
    if (testId) {
      const test = this.abTestResults.find(t => t.id === testId);
      return test ? [test] : [];
    }
    
    return this.abTestResults;
  }

  async getConversionFunnelAnalysis(): Promise<any> {
    // Detailed funnel analysis with drop-off points and optimization suggestions
    const funnelData = await this.getFunnelMetrics();
    
    return {
      ...funnelData,
      recommendations: [
        {
          stage: 'Awareness',
          issue: 'High drop-off rate',
          solution: 'Improve targeting and ad relevance',
          expectedImpact: '15% improvement in conversion'
        }
      ]
    };
  }

  @Cron(CronExpression.EVERY_HOUR)
  private async updateRealTimeMetrics(): Promise<void> {
    // Update real-time campaign metrics
    for (const campaign of this.campaignMetrics) {
      if (campaign.status === 'active') {
        // Simulate real-time updates
        const randomVariation = (Math.random() - 0.5) * 0.1; // ±5% variation
        campaign.engagement.clicks += Math.floor(Math.random() * 10);
        campaign.reach.impressions += Math.floor(Math.random() * 100);
        
        // Add new trend data point
        campaign.trends.push({
          date: new Date(),
          impressions: Math.floor(Math.random() * 2000) + 1000,
          clicks: Math.floor(Math.random() * 200) + 50,
          conversions: Math.floor(Math.random() * 20) + 1,
          spend: Math.floor(Math.random() * 200) + 100,
          revenue: Math.floor(Math.random() * 800) + 200
        });

        // Keep only last 30 days of trend data
        if (campaign.trends.length > 30) {
          campaign.trends = campaign.trends.slice(-30);
        }
      }
    }
  }

  @Cron(CronExpression.EVERY_6_HOURS)
  private async generatePerformanceAlerts(): Promise<void> {
    for (const campaign of this.campaignMetrics) {
      // Check for performance anomalies
      if (campaign.engagement.clickThroughRate < 2.0) {
        await this.generateMarketingAlert({
          type: 'performance',
          severity: 'medium',
          title: 'Low Click-Through Rate',
          description: `Campaign "${campaign.campaignName}" has a CTR of ${campaign.engagement.clickThroughRate}%, below the 2% threshold`,
          affectedCampaigns: [campaign.campaignId],
          recommendedActions: ['Review ad creative', 'Optimize targeting', 'A/B test new messaging']
        });
      }

      // Check budget utilization
      if (campaign.budget.utilization > 90) {
        await this.generateMarketingAlert({
          type: 'budget',
          severity: 'high',
          title: 'High Budget Utilization',
          description: `Campaign "${campaign.campaignName}" has used ${campaign.budget.utilization}% of allocated budget`,
          affectedCampaigns: [campaign.campaignId],
          recommendedActions: ['Consider budget reallocation', 'Pause low-performing ad sets', 'Adjust bidding strategy']
        });
      }

      // Check conversion rate trends
      const recentTrends = campaign.trends.slice(-7); // Last 7 days
      const avgConversions = recentTrends.reduce((sum, t) => sum + t.conversions, 0) / recentTrends.length;
      
      if (avgConversions < 3) {
        await this.generateMarketingAlert({
          type: 'conversion',
          severity: 'medium',
          title: 'Declining Conversion Rate',
          description: `Campaign "${campaign.campaignName}" shows declining conversion trends`,
          affectedCampaigns: [campaign.campaignId],
          recommendedActions: ['Review landing page performance', 'Check audience quality', 'Test new offers']
        });
      }
    }
  }
}