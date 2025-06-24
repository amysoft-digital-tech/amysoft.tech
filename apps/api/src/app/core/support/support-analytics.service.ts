import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface SupportAnalyticsDashboard {
  overview: SupportOverview;
  teamPerformance: TeamPerformance;
  customerSatisfaction: CustomerSatisfactionMetrics;
  ticketAnalytics: TicketAnalytics;
  channelAnalytics: ChannelAnalytics;
  knowledgeBaseAnalytics: KBAnalytics;
  trends: SupportTrend[];
  alerts: SupportAlert[];
  recommendations: SupportRecommendation[];
}

export interface SupportOverview {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  avgFirstResponseTime: number; // minutes
  avgResolutionTime: number; // hours
  slaComplianceRate: number; // percentage
  customerSatisfactionScore: number; // 1-5 scale
  firstCallResolutionRate: number; // percentage
  escalationRate: number; // percentage
  backlogGrowthRate: number; // percentage
  ticketVolumeTrend: 'increasing' | 'decreasing' | 'stable';
  performanceScore: number; // 0-100
}

export interface TeamPerformance {
  totalAgents: number;
  activeAgents: number;
  averageUtilization: number; // percentage
  topPerformers: AgentPerformance[];
  teamMetrics: TeamMetrics;
  skillDistribution: SkillDistribution[];
  workloadBalance: WorkloadBalance[];
}

export interface AgentPerformance {
  agentId: string;
  agentName: string;
  ticketsHandled: number;
  ticketsResolved: number;
  avgResponseTime: number; // minutes
  avgResolutionTime: number; // hours
  customerSatisfaction: number; // 1-5 scale
  firstCallResolutionRate: number; // percentage
  slaComplianceRate: number; // percentage
  productivityScore: number; // 0-100
  specializations: string[];
  status: 'online' | 'offline' | 'busy' | 'away';
  currentLoad: number; // number of active tickets
}

export interface TeamMetrics {
  responseTimeTarget: number; // minutes
  resolutionTimeTarget: number; // hours
  slaTarget: number; // percentage
  satisfactionTarget: number; // 1-5 scale
  currentResponseTime: number;
  currentResolutionTime: number;
  currentSlaCompliance: number;
  currentSatisfaction: number;
  trendsVsTarget: TrendVsTarget;
}

export interface TrendVsTarget {
  responseTime: 'above' | 'below' | 'meeting';
  resolutionTime: 'above' | 'below' | 'meeting';
  slaCompliance: 'above' | 'below' | 'meeting';
  satisfaction: 'above' | 'below' | 'meeting';
}

export interface SkillDistribution {
  skill: string;
  agentCount: number;
  proficiencyLevel: 'beginner' | 'intermediate' | 'expert';
  demandLevel: 'low' | 'medium' | 'high';
  gapAnalysis: 'shortage' | 'adequate' | 'surplus';
}

export interface WorkloadBalance {
  agentId: string;
  agentName: string;
  currentTickets: number;
  plannedCapacity: number;
  utilizationRate: number;
  overloadRisk: 'low' | 'medium' | 'high';
}

export interface CustomerSatisfactionMetrics {
  overallScore: number; // 1-5 scale
  responseRate: number; // percentage of customers who provide feedback
  npsScore: number; // -100 to 100
  detractorRate: number; // percentage
  promoterRate: number; // percentage
  satisfactionByChannel: Record<string, number>;
  satisfactionByTeam: Record<string, number>;
  satisfactionTrends: SatisfactionTrend[];
  topCompliments: ComplimentCategory[];
  topComplaints: ComplaintCategory[];
  improvementAreas: ImprovementArea[];
}

export interface SatisfactionTrend {
  date: Date;
  score: number;
  responseRate: number;
  sampleSize: number;
}

export interface ComplimentCategory {
  category: string;
  count: number;
  percentage: number;
  examples: string[];
}

export interface ComplaintCategory {
  category: string;
  count: number;
  percentage: number;
  impact: 'low' | 'medium' | 'high';
  examples: string[];
}

export interface ImprovementArea {
  area: string;
  priority: 'low' | 'medium' | 'high';
  currentScore: number;
  targetScore: number;
  actionItems: string[];
  estimatedImpact: string;
}

export interface TicketAnalytics {
  volumeAnalysis: VolumeAnalysis;
  categoryBreakdown: CategoryBreakdown[];
  priorityDistribution: PriorityDistribution[];
  sourceAnalysis: SourceAnalysis[];
  resolutionAnalysis: ResolutionAnalysis;
  escalationAnalysis: EscalationAnalysis;
  repeatTicketAnalysis: RepeatTicketAnalysis;
}

export interface VolumeAnalysis {
  currentPeriod: VolumePeriod;
  previousPeriod: VolumePeriod;
  percentageChange: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  seasonality: SeasonalPattern[];
  forecasting: VolumeForecasting;
}

export interface VolumePeriod {
  totalTickets: number;
  avgDailyVolume: number;
  peakDayVolume: number;
  lowDayVolume: number;
  weekdayAvg: number;
  weekendAvg: number;
}

export interface SeasonalPattern {
  period: string; // 'hourly', 'daily', 'weekly', 'monthly'
  pattern: PatternData[];
}

export interface PatternData {
  timeUnit: string;
  volume: number;
  trend: 'peak' | 'valley' | 'normal';
}

export interface VolumeForecasting {
  nextWeek: number;
  nextMonth: number;
  confidenceLevel: number;
  factors: string[];
}

export interface CategoryBreakdown {
  category: string;
  count: number;
  percentage: number;
  avgResolutionTime: number;
  satisfactionScore: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface PriorityDistribution {
  priority: string;
  count: number;
  percentage: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  slaCompliance: number;
}

export interface SourceAnalysis {
  source: string;
  count: number;
  percentage: number;
  conversionRate: number; // to resolved tickets
  customerEffort: number; // 1-5 scale
  cost: number;
}

export interface ResolutionAnalysis {
  firstCallResolution: number;
  avgResolutionTime: number;
  resolutionTimeByCategory: Record<string, number>;
  resolutionMethods: ResolutionMethod[];
  qualityScore: number;
}

export interface ResolutionMethod {
  method: string;
  count: number;
  successRate: number;
  avgTime: number;
  customerSatisfaction: number;
}

export interface EscalationAnalysis {
  escalationRate: number;
  escalationReasons: EscalationReason[];
  escalationTimeDistribution: TimeDistribution[];
  preventableEscalations: number;
  costImpact: number;
}

export interface EscalationReason {
  reason: string;
  count: number;
  percentage: number;
  avgResolutionTime: number;
  preventable: boolean;
}

export interface TimeDistribution {
  timeRange: string;
  count: number;
  percentage: number;
}

export interface RepeatTicketAnalysis {
  repeatTicketRate: number;
  avgTimeBetweenTickets: number; // days
  topRepeatIssues: RepeatIssue[];
  customerImpact: number;
  rootCauseAnalysis: RootCause[];
}

export interface RepeatIssue {
  issue: string;
  occurrences: number;
  affectedCustomers: number;
  businessImpact: 'low' | 'medium' | 'high';
}

export interface RootCause {
  cause: string;
  frequency: number;
  resolution: string;
  preventionPlan: string;
}

export interface ChannelAnalytics {
  channelPerformance: ChannelPerformance[];
  channelPreferences: ChannelPreference[];
  channelEfficiency: ChannelEfficiency[];
  crossChannelJourney: CrossChannelJourney[];
}

export interface ChannelPerformance {
  channel: string;
  volume: number;
  responseTime: number;
  resolutionTime: number;
  satisfactionScore: number;
  cost: number;
  efficiency: number;
}

export interface ChannelPreference {
  customerSegment: string;
  preferredChannels: string[];
  usagePatterns: UsagePattern[];
}

export interface UsagePattern {
  timeOfDay: string;
  channel: string;
  volume: number;
}

export interface ChannelEfficiency {
  channel: string;
  resolutionRate: number;
  escalationRate: number;
  customerEffort: number;
  agentProductivity: number;
}

export interface CrossChannelJourney {
  journeyId: string;
  channels: string[];
  avgJourneyTime: number;
  touchpoints: number;
  resolutionRate: number;
  satisfactionImpact: number;
}

export interface KBAnalytics {
  usageMetrics: KBUsageMetrics;
  searchAnalytics: KBSearchAnalytics;
  contentPerformance: KBContentPerformance;
  deflectionRate: number;
  selfServiceSuccess: number;
}

export interface KBUsageMetrics {
  totalViews: number;
  uniqueUsers: number;
  avgSessionDuration: number;
  returnUserRate: number;
  mobileUsage: number;
}

export interface KBSearchAnalytics {
  totalSearches: number;
  successRate: number;
  topQueries: string[];
  zeroResultQueries: string[];
  searchToResolutionRate: number;
}

export interface KBContentPerformance {
  topArticles: ContentMetric[];
  underperformingContent: ContentMetric[];
  contentGaps: string[];
  updateNeeded: string[];
}

export interface ContentMetric {
  title: string;
  views: number;
  rating: number;
  helpfulness: number;
}

export interface SupportTrend {
  date: Date;
  ticketVolume: number;
  responseTime: number;
  resolutionTime: number;
  satisfactionScore: number;
  slaCompliance: number;
}

export interface SupportAlert {
  id: string;
  type: 'performance' | 'volume' | 'satisfaction' | 'sla' | 'escalation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  metric: string;
  currentValue: number;
  thresholdValue: number;
  trend: string;
  affectedAreas: string[];
  recommendations: string[];
  createdAt: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
}

export interface SupportRecommendation {
  id: string;
  category: 'process' | 'training' | 'technology' | 'staffing' | 'knowledge';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  expectedImpact: string;
  effort: 'low' | 'medium' | 'high';
  timeline: string;
  businessValue: number;
  implementation: string[];
}

export interface SupportMetricsConfig {
  refreshInterval: number; // minutes
  dataRetentionPeriod: number; // days
  alertThresholds: AlertThresholds;
  benchmarks: SupportBenchmarks;
}

export interface AlertThresholds {
  responseTime: number; // minutes
  resolutionTime: number; // hours
  slaCompliance: number; // percentage
  satisfactionScore: number; // 1-5 scale
  escalationRate: number; // percentage
  backlogSize: number;
}

export interface SupportBenchmarks {
  industry: IndustryBenchmarks;
  internal: InternalBenchmarks;
}

export interface IndustryBenchmarks {
  avgResponseTime: number;
  avgResolutionTime: number;
  firstCallResolution: number;
  customerSatisfaction: number;
  slaCompliance: number;
}

export interface InternalBenchmarks {
  responseTimeTarget: number;
  resolutionTimeTarget: number;
  satisfactionTarget: number;
  slaTarget: number;
  escalationTarget: number;
}

@Injectable()
export class SupportAnalyticsService {
  private readonly logger = new Logger(SupportAnalyticsService.name);
  private supportMetrics: SupportAnalyticsDashboard | null = null;
  private alerts: SupportAlert[] = [];
  private recommendations: SupportRecommendation[] = [];

  constructor(private configService: ConfigService) {
    this.initializeAnalytics();
  }

  private initializeAnalytics(): void {
    // Initialize with mock data - in production this would come from actual data sources
    this.supportMetrics = {
      overview: {
        totalTickets: 3847,
        openTickets: 156,
        resolvedTickets: 3691,
        avgFirstResponseTime: 12.5,
        avgResolutionTime: 8.2,
        slaComplianceRate: 94.8,
        customerSatisfactionScore: 4.6,
        firstCallResolutionRate: 78.3,
        escalationRate: 6.7,
        backlogGrowthRate: -2.3,
        ticketVolumeTrend: 'stable',
        performanceScore: 87
      },
      teamPerformance: {
        totalAgents: 12,
        activeAgents: 9,
        averageUtilization: 73.5,
        topPerformers: [
          {
            agentId: 'agent_001',
            agentName: 'Sarah Johnson',
            ticketsHandled: 234,
            ticketsResolved: 228,
            avgResponseTime: 8.2,
            avgResolutionTime: 6.5,
            customerSatisfaction: 4.8,
            firstCallResolutionRate: 85.2,
            slaComplianceRate: 97.4,
            productivityScore: 92,
            specializations: ['technical', 'billing'],
            status: 'online',
            currentLoad: 5
          },
          {
            agentId: 'agent_002',
            agentName: 'Mike Chen',
            ticketsHandled: 198,
            ticketsResolved: 192,
            avgResponseTime: 10.1,
            avgResolutionTime: 7.8,
            customerSatisfaction: 4.7,
            firstCallResolutionRate: 82.1,
            slaComplianceRate: 95.8,
            productivityScore: 89,
            specializations: ['technical', 'feature_requests'],
            status: 'online',
            currentLoad: 3
          }
        ],
        teamMetrics: {
          responseTimeTarget: 15,
          resolutionTimeTarget: 12,
          slaTarget: 95,
          satisfactionTarget: 4.5,
          currentResponseTime: 12.5,
          currentResolutionTime: 8.2,
          currentSlaCompliance: 94.8,
          currentSatisfaction: 4.6,
          trendsVsTarget: {
            responseTime: 'meeting',
            resolutionTime: 'meeting',
            slaCompliance: 'below',
            satisfaction: 'above'
          }
        },
        skillDistribution: [
          {
            skill: 'Technical Support',
            agentCount: 8,
            proficiencyLevel: 'expert',
            demandLevel: 'high',
            gapAnalysis: 'adequate'
          },
          {
            skill: 'Billing Support',
            agentCount: 5,
            proficiencyLevel: 'intermediate',
            demandLevel: 'medium',
            gapAnalysis: 'adequate'
          }
        ],
        workloadBalance: [
          {
            agentId: 'agent_001',
            agentName: 'Sarah Johnson',
            currentTickets: 5,
            plannedCapacity: 8,
            utilizationRate: 62.5,
            overloadRisk: 'low'
          }
        ]
      },
      customerSatisfaction: {
        overallScore: 4.6,
        responseRate: 67.8,
        npsScore: 42,
        detractorRate: 8.3,
        promoterRate: 58.7,
        satisfactionByChannel: {
          'email': 4.5,
          'chat': 4.7,
          'phone': 4.8
        },
        satisfactionByTeam: {
          'technical': 4.6,
          'billing': 4.5,
          'general': 4.4
        },
        satisfactionTrends: [],
        topCompliments: [
          {
            category: 'Quick Response',
            count: 156,
            percentage: 45.2,
            examples: ['Very fast response time', 'Got help immediately']
          },
          {
            category: 'Knowledgeable Staff',
            count: 134,
            percentage: 38.8,
            examples: ['Agent knew exactly what to do', 'Very technical and helpful']
          }
        ],
        topComplaints: [
          {
            category: 'Long Wait Time',
            count: 23,
            percentage: 28.4,
            impact: 'medium',
            examples: ['Had to wait too long', 'Response took forever']
          }
        ],
        improvementAreas: [
          {
            area: 'Response Time',
            priority: 'medium',
            currentScore: 4.2,
            targetScore: 4.6,
            actionItems: ['Increase staffing during peak hours', 'Implement chat bots'],
            estimatedImpact: '10% improvement in satisfaction'
          }
        ]
      },
      ticketAnalytics: {
        volumeAnalysis: {
          currentPeriod: {
            totalTickets: 3847,
            avgDailyVolume: 128,
            peakDayVolume: 189,
            lowDayVolume: 87,
            weekdayAvg: 142,
            weekendAvg: 89
          },
          previousPeriod: {
            totalTickets: 3654,
            avgDailyVolume: 122,
            peakDayVolume: 176,
            lowDayVolume: 82,
            weekdayAvg: 135,
            weekendAvg: 84
          },
          percentageChange: 5.3,
          trend: 'increasing',
          seasonality: [],
          forecasting: {
            nextWeek: 896,
            nextMonth: 3920,
            confidenceLevel: 0.87,
            factors: ['Product launch', 'Holiday season']
          }
        },
        categoryBreakdown: [
          {
            category: 'Technical Issues',
            count: 1847,
            percentage: 48.0,
            avgResolutionTime: 9.2,
            satisfactionScore: 4.5,
            trend: 'stable'
          },
          {
            category: 'Billing Inquiries',
            count: 923,
            percentage: 24.0,
            avgResolutionTime: 4.8,
            satisfactionScore: 4.7,
            trend: 'decreasing'
          }
        ],
        priorityDistribution: [
          {
            priority: 'High',
            count: 462,
            percentage: 12.0,
            avgResponseTime: 5.2,
            avgResolutionTime: 4.8,
            slaCompliance: 98.7
          }
        ],
        sourceAnalysis: [
          {
            source: 'Email',
            count: 2308,
            percentage: 60.0,
            conversionRate: 94.5,
            customerEffort: 3.2,
            cost: 8.50
          }
        ],
        resolutionAnalysis: {
          firstCallResolution: 78.3,
          avgResolutionTime: 8.2,
          resolutionTimeByCategory: {
            'technical': 9.2,
            'billing': 4.8,
            'general': 6.5
          },
          resolutionMethods: [
            {
              method: 'Knowledge Base Article',
              count: 1234,
              successRate: 89.2,
              avgTime: 2.5,
              customerSatisfaction: 4.3
            }
          ],
          qualityScore: 87.5
        },
        escalationAnalysis: {
          escalationRate: 6.7,
          escalationReasons: [
            {
              reason: 'Complex Technical Issue',
              count: 156,
              percentage: 60.5,
              avgResolutionTime: 18.5,
              preventable: false
            }
          ],
          escalationTimeDistribution: [
            {
              timeRange: '0-1 hours',
              count: 89,
              percentage: 34.5
            }
          ],
          preventableEscalations: 23.4,
          costImpact: 12500
        },
        repeatTicketAnalysis: {
          repeatTicketRate: 8.9,
          avgTimeBetweenTickets: 12.5,
          topRepeatIssues: [
            {
              issue: 'Template Loading Issues',
              occurrences: 45,
              affectedCustomers: 23,
              businessImpact: 'medium'
            }
          ],
          customerImpact: 15.6,
          rootCauseAnalysis: [
            {
              cause: 'Incomplete Resolution',
              frequency: 67,
              resolution: 'Better follow-up process',
              preventionPlan: 'Implement resolution verification'
            }
          ]
        }
      },
      channelAnalytics: {
        channelPerformance: [
          {
            channel: 'Email',
            volume: 2308,
            responseTime: 145,
            resolutionTime: 8.2,
            satisfactionScore: 4.5,
            cost: 8.50,
            efficiency: 85.2
          }
        ],
        channelPreferences: [
          {
            customerSegment: 'Enterprise',
            preferredChannels: ['Phone', 'Email'],
            usagePatterns: [
              {
                timeOfDay: '09:00-17:00',
                channel: 'Phone',
                volume: 67
              }
            ]
          }
        ],
        channelEfficiency: [
          {
            channel: 'Chat',
            resolutionRate: 89.5,
            escalationRate: 4.2,
            customerEffort: 2.8,
            agentProductivity: 92.1
          }
        ],
        crossChannelJourney: [
          {
            journeyId: 'journey_001',
            channels: ['Email', 'Chat'],
            avgJourneyTime: 24.5,
            touchpoints: 2.3,
            resolutionRate: 94.2,
            satisfactionImpact: 0.8
          }
        ]
      },
      knowledgeBaseAnalytics: {
        usageMetrics: {
          totalViews: 45678,
          uniqueUsers: 12345,
          avgSessionDuration: 420,
          returnUserRate: 34.5,
          mobileUsage: 42.3
        },
        searchAnalytics: {
          totalSearches: 8934,
          successRate: 87.6,
          topQueries: ['getting started', 'billing help', 'template issues'],
          zeroResultQueries: ['advanced api', 'mobile app'],
          searchToResolutionRate: 73.4
        },
        contentPerformance: {
          topArticles: [
            {
              title: 'Getting Started Guide',
              views: 5678,
              rating: 4.7,
              helpfulness: 89.2
            }
          ],
          underperformingContent: [
            {
              title: 'Advanced Features',
              views: 234,
              rating: 3.2,
              helpfulness: 45.6
            }
          ],
          contentGaps: ['Mobile usage', 'API integration'],
          updateNeeded: ['Setup guide screenshots', 'Pricing information']
        },
        deflectionRate: 67.8,
        selfServiceSuccess: 73.4
      },
      trends: this.generateTrendData(),
      alerts: [],
      recommendations: []
    };

    this.initializeAlertsAndRecommendations();
    this.logger.log('Support analytics initialized');
  }

  private generateTrendData(): SupportTrend[] {
    const trends: SupportTrend[] = [];
    const days = 30;

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      trends.push({
        date,
        ticketVolume: Math.floor(Math.random() * 50) + 100,
        responseTime: Math.random() * 5 + 10,
        resolutionTime: Math.random() * 3 + 6,
        satisfactionScore: Math.random() * 0.5 + 4.3,
        slaCompliance: Math.random() * 10 + 90
      });
    }

    return trends;
  }

  private initializeAlertsAndRecommendations(): void {
    this.alerts = [
      {
        id: 'alert_001',
        type: 'sla',
        severity: 'medium',
        title: 'SLA Compliance Below Target',
        description: 'SLA compliance has dropped to 94.8%, below the 95% target',
        metric: 'slaCompliance',
        currentValue: 94.8,
        thresholdValue: 95.0,
        trend: 'decreasing',
        affectedAreas: ['Technical Support Team'],
        recommendations: [
          'Review complex tickets requiring extended resolution time',
          'Consider additional staffing during peak hours'
        ],
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        id: 'alert_002',
        type: 'volume',
        severity: 'low',
        title: 'Ticket Volume Increasing',
        description: 'Daily ticket volume has increased by 15% over the past week',
        metric: 'ticketVolume',
        currentValue: 142,
        thresholdValue: 130,
        trend: 'increasing',
        affectedAreas: ['All Teams'],
        recommendations: [
          'Monitor for capacity issues',
          'Review knowledge base content for common issues'
        ],
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
      }
    ];

    this.recommendations = [
      {
        id: 'rec_001',
        category: 'process',
        priority: 'high',
        title: 'Implement Automated Triage',
        description: 'Implement automated ticket triage to improve initial routing and reduce response time',
        expectedImpact: '20% reduction in first response time',
        effort: 'medium',
        timeline: '4-6 weeks',
        businessValue: 85,
        implementation: [
          'Define triage rules based on keywords and customer data',
          'Implement machine learning classification',
          'Test with pilot group',
          'Roll out to all teams'
        ]
      },
      {
        id: 'rec_002',
        category: 'knowledge',
        priority: 'medium',
        title: 'Expand Knowledge Base Content',
        description: 'Create additional articles for high-volume issue categories',
        expectedImpact: '15% increase in self-service resolution',
        effort: 'medium',
        timeline: '2-3 weeks',
        businessValue: 70,
        implementation: [
          'Analyze top ticket categories',
          'Create content plan',
          'Write and review articles',
          'Publish and promote new content'
        ]
      },
      {
        id: 'rec_003',
        category: 'training',
        priority: 'medium',
        title: 'Advanced Technical Training',
        description: 'Provide advanced technical training to reduce escalations',
        expectedImpact: '25% reduction in escalation rate',
        effort: 'high',
        timeline: '6-8 weeks',
        businessValue: 75,
        implementation: [
          'Assess current skill gaps',
          'Develop training curriculum',
          'Schedule training sessions',
          'Measure improvement'
        ]
      }
    ];
  }

  async getSupportAnalyticsDashboard(): Promise<SupportAnalyticsDashboard> {
    if (!this.supportMetrics) {
      await this.refreshAnalytics();
    }

    return {
      ...this.supportMetrics!,
      alerts: this.alerts.filter(alert => !alert.acknowledgedBy),
      recommendations: this.recommendations.sort((a, b) => {
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
    };
  }

  async getTeamPerformance(): Promise<TeamPerformance> {
    return this.supportMetrics?.teamPerformance || {
      totalAgents: 0,
      activeAgents: 0,
      averageUtilization: 0,
      topPerformers: [],
      teamMetrics: {
        responseTimeTarget: 15,
        resolutionTimeTarget: 12,
        slaTarget: 95,
        satisfactionTarget: 4.5,
        currentResponseTime: 0,
        currentResolutionTime: 0,
        currentSlaCompliance: 0,
        currentSatisfaction: 0,
        trendsVsTarget: {
          responseTime: 'meeting',
          resolutionTime: 'meeting',
          slaCompliance: 'meeting',
          satisfaction: 'meeting'
        }
      },
      skillDistribution: [],
      workloadBalance: []
    };
  }

  async getCustomerSatisfactionMetrics(): Promise<CustomerSatisfactionMetrics> {
    return this.supportMetrics?.customerSatisfaction || {
      overallScore: 0,
      responseRate: 0,
      npsScore: 0,
      detractorRate: 0,
      promoterRate: 0,
      satisfactionByChannel: {},
      satisfactionByTeam: {},
      satisfactionTrends: [],
      topCompliments: [],
      topComplaints: [],
      improvementAreas: []
    };
  }

  async getTicketAnalytics(): Promise<TicketAnalytics> {
    return this.supportMetrics?.ticketAnalytics || {
      volumeAnalysis: {
        currentPeriod: {
          totalTickets: 0,
          avgDailyVolume: 0,
          peakDayVolume: 0,
          lowDayVolume: 0,
          weekdayAvg: 0,
          weekendAvg: 0
        },
        previousPeriod: {
          totalTickets: 0,
          avgDailyVolume: 0,
          peakDayVolume: 0,
          lowDayVolume: 0,
          weekdayAvg: 0,
          weekendAvg: 0
        },
        percentageChange: 0,
        trend: 'stable',
        seasonality: [],
        forecasting: {
          nextWeek: 0,
          nextMonth: 0,
          confidenceLevel: 0,
          factors: []
        }
      },
      categoryBreakdown: [],
      priorityDistribution: [],
      sourceAnalysis: [],
      resolutionAnalysis: {
        firstCallResolution: 0,
        avgResolutionTime: 0,
        resolutionTimeByCategory: {},
        resolutionMethods: [],
        qualityScore: 0
      },
      escalationAnalysis: {
        escalationRate: 0,
        escalationReasons: [],
        escalationTimeDistribution: [],
        preventableEscalations: 0,
        costImpact: 0
      },
      repeatTicketAnalysis: {
        repeatTicketRate: 0,
        avgTimeBetweenTickets: 0,
        topRepeatIssues: [],
        customerImpact: 0,
        rootCauseAnalysis: []
      }
    };
  }

  async createAlert(alert: Omit<SupportAlert, 'id' | 'createdAt'>): Promise<string> {
    const newAlert: SupportAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      ...alert,
      createdAt: new Date()
    };

    this.alerts.push(newAlert);
    this.logger.log(`Support alert created: ${alert.title}`);
    
    return newAlert.id;
  }

  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<boolean> {
    const alert = this.alerts.find(a => a.id === alertId);
    
    if (!alert) {
      return false;
    }

    alert.acknowledgedBy = acknowledgedBy;
    this.logger.log(`Alert acknowledged: ${alertId} by ${acknowledgedBy}`);
    
    return true;
  }

  async resolveAlert(alertId: string): Promise<boolean> {
    const alert = this.alerts.find(a => a.id === alertId);
    
    if (!alert) {
      return false;
    }

    alert.resolvedAt = new Date();
    this.logger.log(`Alert resolved: ${alertId}`);
    
    return true;
  }

  async addRecommendation(recommendation: Omit<SupportRecommendation, 'id'>): Promise<string> {
    const newRecommendation: SupportRecommendation = {
      id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      ...recommendation
    };

    this.recommendations.push(newRecommendation);
    this.logger.log(`Support recommendation added: ${recommendation.title}`);
    
    return newRecommendation.id;
  }

  async getAgentPerformance(agentId?: string): Promise<AgentPerformance[]> {
    const teamPerformance = await this.getTeamPerformance();
    
    if (agentId) {
      const agent = teamPerformance.topPerformers.find(a => a.agentId === agentId);
      return agent ? [agent] : [];
    }
    
    return teamPerformance.topPerformers;
  }

  async getSupportTrends(days: number = 30): Promise<SupportTrend[]> {
    return this.supportMetrics?.trends.slice(-days) || [];
  }

  async generatePerformanceReport(period: 'daily' | 'weekly' | 'monthly'): Promise<any> {
    const dashboard = await this.getSupportAnalyticsDashboard();
    
    const report = {
      period,
      generatedAt: new Date(),
      overview: dashboard.overview,
      keyMetrics: {
        ticketsHandled: dashboard.overview.totalTickets,
        averageResolutionTime: dashboard.overview.avgResolutionTime,
        customerSatisfaction: dashboard.overview.customerSatisfactionScore,
        slaCompliance: dashboard.overview.slaComplianceRate,
        firstCallResolution: dashboard.overview.firstCallResolutionRate
      },
      teamSummary: {
        totalAgents: dashboard.teamPerformance.totalAgents,
        activeAgents: dashboard.teamPerformance.activeAgents,
        averageUtilization: dashboard.teamPerformance.averageUtilization,
        topPerformer: dashboard.teamPerformance.topPerformers[0]?.agentName || 'N/A'
      },
      improvements: dashboard.recommendations.slice(0, 3),
      alerts: dashboard.alerts.filter(alert => alert.severity === 'high' || alert.severity === 'critical'),
      nextSteps: this.generateNextSteps(dashboard)
    };

    this.logger.log(`Performance report generated for ${period} period`);
    return report;
  }

  private generateNextSteps(dashboard: SupportAnalyticsDashboard): string[] {
    const nextSteps: string[] = [];

    // Check SLA compliance
    if (dashboard.overview.slaComplianceRate < 95) {
      nextSteps.push('Focus on improving SLA compliance through better ticket routing');
    }

    // Check satisfaction
    if (dashboard.overview.customerSatisfactionScore < 4.5) {
      nextSteps.push('Implement customer satisfaction improvement initiatives');
    }

    // Check escalation rate
    if (dashboard.overview.escalationRate > 10) {
      nextSteps.push('Reduce escalation rate through enhanced agent training');
    }

    // Check knowledge base deflection
    if (dashboard.knowledgeBaseAnalytics.deflectionRate < 70) {
      nextSteps.push('Improve knowledge base content to increase self-service deflection');
    }

    return nextSteps;
  }

  async exportAnalytics(format: 'json' | 'csv', dateRange?: { start: Date; end: Date }): Promise<string> {
    const dashboard = await this.getSupportAnalyticsDashboard();
    
    if (format === 'json') {
      return JSON.stringify(dashboard, null, 2);
    } else {
      // Convert to CSV format (simplified)
      const csvData = [
        ['Metric', 'Value'],
        ['Total Tickets', dashboard.overview.totalTickets.toString()],
        ['Open Tickets', dashboard.overview.openTickets.toString()],
        ['Avg Response Time (min)', dashboard.overview.avgFirstResponseTime.toString()],
        ['Avg Resolution Time (hrs)', dashboard.overview.avgResolutionTime.toString()],
        ['SLA Compliance (%)', dashboard.overview.slaComplianceRate.toString()],
        ['Customer Satisfaction', dashboard.overview.customerSatisfactionScore.toString()],
        ['First Call Resolution (%)', dashboard.overview.firstCallResolutionRate.toString()]
      ];

      return csvData.map(row => row.join(',')).join('\n');
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  private async refreshAnalytics(): Promise<void> {
    // In production, this would pull fresh data from various sources
    // For now, we simulate some dynamic updates
    
    if (this.supportMetrics) {
      // Simulate some metric changes
      this.supportMetrics.overview.totalTickets += Math.floor(Math.random() * 5);
      this.supportMetrics.overview.openTickets += Math.floor(Math.random() * 3) - 1;
      
      // Update trends
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const existingTrend = this.supportMetrics.trends.find(t => 
        t.date.getTime() === today.getTime()
      );

      if (!existingTrend) {
        this.supportMetrics.trends.push({
          date: today,
          ticketVolume: Math.floor(Math.random() * 50) + 100,
          responseTime: Math.random() * 5 + 10,
          resolutionTime: Math.random() * 3 + 6,
          satisfactionScore: Math.random() * 0.5 + 4.3,
          slaCompliance: Math.random() * 10 + 90
        });

        // Keep only last 30 days
        if (this.supportMetrics.trends.length > 30) {
          this.supportMetrics.trends = this.supportMetrics.trends.slice(-30);
        }
      }
    }

    this.logger.log('Support analytics refreshed');
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  private async checkAlertConditions(): Promise<void> {
    if (!this.supportMetrics) return;

    // Check SLA compliance
    if (this.supportMetrics.overview.slaComplianceRate < 95) {
      const existingAlert = this.alerts.find(a => 
        a.type === 'sla' && 
        !a.resolvedAt &&
        (Date.now() - a.createdAt.getTime()) < 24 * 60 * 60 * 1000 // Last 24 hours
      );

      if (!existingAlert) {
        await this.createAlert({
          type: 'sla',
          severity: 'medium',
          title: 'SLA Compliance Below Target',
          description: `SLA compliance has dropped to ${this.supportMetrics.overview.slaComplianceRate}%, below the 95% target`,
          metric: 'slaCompliance',
          currentValue: this.supportMetrics.overview.slaComplianceRate,
          thresholdValue: 95.0,
          trend: 'decreasing',
          affectedAreas: ['Support Team'],
          recommendations: [
            'Review complex tickets requiring extended resolution time',
            'Consider additional staffing during peak hours'
          ]
        });
      }
    }

    // Check response time
    if (this.supportMetrics.overview.avgFirstResponseTime > 20) {
      await this.createAlert({
        type: 'performance',
        severity: 'high',
        title: 'Response Time Above Target',
        description: `Average first response time is ${this.supportMetrics.overview.avgFirstResponseTime} minutes, above the 15-minute target`,
        metric: 'responseTime',
        currentValue: this.supportMetrics.overview.avgFirstResponseTime,
        thresholdValue: 20,
        trend: 'increasing',
        affectedAreas: ['All Teams'],
        recommendations: [
          'Increase staffing levels',
          'Review ticket assignment rules',
          'Implement auto-responses for common queries'
        ]
      });
    }

    // Check satisfaction score
    if (this.supportMetrics.overview.customerSatisfactionScore < 4.0) {
      await this.createAlert({
        type: 'satisfaction',
        severity: 'critical',
        title: 'Customer Satisfaction Below Acceptable Level',
        description: `Customer satisfaction score is ${this.supportMetrics.overview.customerSatisfactionScore}, below the 4.0 minimum`,
        metric: 'satisfaction',
        currentValue: this.supportMetrics.overview.customerSatisfactionScore,
        thresholdValue: 4.0,
        trend: 'decreasing',
        affectedAreas: ['All Teams'],
        recommendations: [
          'Review recent negative feedback',
          'Implement immediate satisfaction recovery process',
          'Provide additional customer service training'
        ]
      });
    }
  }
}