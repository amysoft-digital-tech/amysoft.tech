import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface Lead {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  source: LeadSource;
  status: LeadStatus;
  score: number;
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
  customFields: Record<string, any>;
  tags: string[];
  assignedTo?: string;
  journey: CustomerJourney;
}

export interface LeadSource {
  channel: 'organic_search' | 'paid_search' | 'social_media' | 'email' | 'direct' | 'referral' | 'content' | 'webinar' | 'event';
  medium: string;
  campaign: string;
  source: string;
  content?: string;
  term?: string;
  referrer?: string;
  landingPage: string;
  utmParameters: UTMParameters;
}

export interface UTMParameters {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  PROPOSAL = 'proposal',
  NEGOTIATION = 'negotiation',
  CLOSED_WON = 'closed_won',
  CLOSED_LOST = 'closed_lost',
  NURTURING = 'nurturing',
  UNQUALIFIED = 'unqualified'
}

export interface CustomerJourney {
  touchpoints: Touchpoint[];
  currentStage: JourneyStage;
  stages: JourneyStageProgress[];
  totalInteractions: number;
  firstTouch: Date;
  lastTouch: Date;
  timeToConversion?: number; // days
  conversionValue?: number;
  attribution: AttributionModel;
}

export interface Touchpoint {
  id: string;
  timestamp: Date;
  type: 'page_view' | 'email_open' | 'email_click' | 'form_fill' | 'download' | 'purchase' | 'support_ticket' | 'webinar_attendance';
  source: LeadSource;
  pageUrl?: string;
  emailCampaignId?: string;
  formId?: string;
  downloadAsset?: string;
  value?: number;
  sessionId: string;
  deviceInfo: DeviceInfo;
  locationInfo: LocationInfo;
  engagement: EngagementMetrics;
}

export interface DeviceInfo {
  deviceType: 'desktop' | 'mobile' | 'tablet';
  operatingSystem: string;
  browser: string;
  screenResolution: string;
  userAgent: string;
}

export interface LocationInfo {
  country: string;
  region: string;
  city: string;
  timezone: string;
  ipAddress: string;
}

export interface EngagementMetrics {
  timeOnPage?: number; // seconds
  scrollDepth?: number; // percentage
  clicks?: number;
  formFieldsCompleted?: number;
  documentsViewed?: number;
}

export enum JourneyStage {
  AWARENESS = 'awareness',
  INTEREST = 'interest',
  CONSIDERATION = 'consideration',
  INTENT = 'intent',
  EVALUATION = 'evaluation',
  PURCHASE = 'purchase',
  ONBOARDING = 'onboarding',
  RETENTION = 'retention',
  ADVOCACY = 'advocacy'
}

export interface JourneyStageProgress {
  stage: JourneyStage;
  enteredAt: Date;
  exitedAt?: Date;
  timeSpent?: number; // days
  touchpoints: number;
  conversionRate: number;
}

export interface AttributionModel {
  firstTouch: AttributionCredit;
  lastTouch: AttributionCredit;
  linear: AttributionCredit[];
  timeDecay: AttributionCredit[];
  positionBased: AttributionCredit[];
}

export interface AttributionCredit {
  touchpointId: string;
  credit: number; // percentage
  value: number; // monetary value
}

export interface LeadScoringRule {
  id: string;
  name: string;
  description: string;
  condition: ScoringCondition;
  points: number;
  frequency: 'once' | 'multiple';
  enabled: boolean;
  category: 'demographic' | 'behavioral' | 'engagement' | 'firmographic';
  createdAt: Date;
  updatedAt: Date;
}

export interface ScoringCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'starts_with' | 'ends_with' | 'in' | 'not_in';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface ConversionEvent {
  id: string;
  leadId: string;
  eventType: 'purchase' | 'signup' | 'trial' | 'demo_request' | 'download' | 'subscription';
  timestamp: Date;
  value: number;
  currency: string;
  productId?: string;
  campaignId?: string;
  source: LeadSource;
  attribution: AttributionModel;
}

export interface LeadAnalytics {
  totalLeads: number;
  leadsBySource: Record<string, number>;
  leadsByStage: Record<string, number>;
  conversionRates: Record<string, number>;
  averageTimeToConversion: number;
  costPerLead: Record<string, number>;
  leadQualityScore: number;
  topPerformingChannels: ChannelPerformance[];
  cohortAnalysis: CohortData[];
}

export interface ChannelPerformance {
  channel: string;
  leads: number;
  conversions: number;
  conversionRate: number;
  cost: number;
  costPerLead: number;
  costPerAcquisition: number;
  roi: number;
}

export interface CohortData {
  cohort: string; // month/week identifier
  size: number;
  conversionRates: number[]; // by time period
  retentionRates: number[];
  revenue: number[];
}

@Injectable()
export class LeadTrackingService {
  private readonly logger = new Logger(LeadTrackingService.name);
  private leads: Lead[] = [];
  private touchpoints: Touchpoint[] = [];
  private conversions: ConversionEvent[] = [];
  private scoringRules: LeadScoringRule[] = [];

  constructor(private configService: ConfigService) {
    this.initializeScoringRules();
  }

  private initializeScoringRules(): void {
    this.scoringRules = [
      {
        id: 'email_provided',
        name: 'Email Address Provided',
        description: 'Lead provides email address',
        condition: { field: 'email', operator: 'not_equals', value: null },
        points: 10,
        frequency: 'once',
        enabled: true,
        category: 'demographic',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'page_visit_pricing',
        name: 'Visited Pricing Page',
        description: 'Lead visited the pricing page',
        condition: { field: 'pageUrl', operator: 'contains', value: '/pricing' },
        points: 15,
        frequency: 'once',
        enabled: true,
        category: 'behavioral',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'email_open_multiple',
        name: 'Multiple Email Opens',
        description: 'Lead opened 3+ emails in last 30 days',
        condition: { field: 'email_opens', operator: 'greater_than', value: 3 },
        points: 20,
        frequency: 'once',
        enabled: true,
        category: 'engagement',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'content_download',
        name: 'Content Download',
        description: 'Lead downloaded premium content',
        condition: { field: 'type', operator: 'equals', value: 'download' },
        points: 25,
        frequency: 'multiple',
        enabled: true,
        category: 'behavioral',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'enterprise_email',
        name: 'Enterprise Email Domain',
        description: 'Email from enterprise domain (non-free)',
        condition: { field: 'email', operator: 'not_in', value: ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'] },
        points: 15,
        frequency: 'once',
        enabled: true,
        category: 'firmographic',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    this.logger.log(`Initialized ${this.scoringRules.length} lead scoring rules`);
  }

  async createLead(leadData: Omit<Lead, 'id' | 'score' | 'createdAt' | 'updatedAt' | 'journey'>): Promise<string> {
    const lead: Lead = {
      id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      ...leadData,
      score: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      journey: {
        touchpoints: [],
        currentStage: JourneyStage.AWARENESS,
        stages: [{
          stage: JourneyStage.AWARENESS,
          enteredAt: new Date(),
          touchpoints: 0,
          conversionRate: 0
        }],
        totalInteractions: 0,
        firstTouch: new Date(),
        lastTouch: new Date(),
        attribution: {
          firstTouch: { touchpointId: '', credit: 100, value: 0 },
          lastTouch: { touchpointId: '', credit: 100, value: 0 },
          linear: [],
          timeDecay: [],
          positionBased: []
        }
      }
    };

    this.leads.push(lead);
    
    // Calculate initial lead score
    await this.calculateLeadScore(lead.id);
    
    this.logger.log(`Lead created: ${lead.id} - ${lead.email}`);
    return lead.id;
  }

  async trackTouchpoint(leadId: string, touchpointData: Omit<Touchpoint, 'id' | 'timestamp'>): Promise<string> {
    const lead = this.leads.find(l => l.id === leadId);
    
    if (!lead) {
      throw new Error(`Lead not found: ${leadId}`);
    }

    const touchpoint: Touchpoint = {
      id: `touchpoint_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      timestamp: new Date(),
      ...touchpointData
    };

    this.touchpoints.push(touchpoint);
    lead.journey.touchpoints.push(touchpoint);
    lead.journey.totalInteractions++;
    lead.journey.lastTouch = new Date();
    lead.lastActivityAt = new Date();
    lead.updatedAt = new Date();

    // Update journey stage based on touchpoint
    await this.updateJourneyStage(lead, touchpoint);
    
    // Recalculate lead score
    await this.calculateLeadScore(leadId);
    
    this.logger.log(`Touchpoint tracked: ${touchpoint.id} for lead ${leadId}`);
    return touchpoint.id;
  }

  async recordConversion(conversionData: Omit<ConversionEvent, 'id' | 'timestamp' | 'attribution'>): Promise<string> {
    const lead = this.leads.find(l => l.id === conversionData.leadId);
    
    if (!lead) {
      throw new Error(`Lead not found: ${conversionData.leadId}`);
    }

    const conversion: ConversionEvent = {
      id: `conversion_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      timestamp: new Date(),
      attribution: await this.calculateAttribution(lead),
      ...conversionData
    };

    this.conversions.push(conversion);
    
    // Update lead status
    lead.status = LeadStatus.CLOSED_WON;
    lead.journey.timeToConversion = Math.floor(
      (conversion.timestamp.getTime() - lead.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    lead.journey.conversionValue = conversion.value;
    lead.updatedAt = new Date();

    // Update journey stage
    lead.journey.currentStage = JourneyStage.PURCHASE;
    
    this.logger.log(`Conversion recorded: ${conversion.id} for lead ${conversionData.leadId} - Value: ${conversion.value}`);
    return conversion.id;
  }

  async calculateLeadScore(leadId: string): Promise<number> {
    const lead = this.leads.find(l => l.id === leadId);
    
    if (!lead) {
      return 0;
    }

    let totalScore = 0;
    const appliedRules = new Set<string>();

    // Apply demographic scoring
    for (const rule of this.scoringRules.filter(r => r.enabled && r.category === 'demographic')) {
      if (this.evaluateCondition(lead, rule.condition)) {
        if (rule.frequency === 'once' && !appliedRules.has(rule.id)) {
          totalScore += rule.points;
          appliedRules.add(rule.id);
        }
      }
    }

    // Apply behavioral scoring based on touchpoints
    for (const touchpoint of lead.journey.touchpoints) {
      for (const rule of this.scoringRules.filter(r => r.enabled && r.category === 'behavioral')) {
        if (this.evaluateCondition(touchpoint, rule.condition)) {
          if (rule.frequency === 'multiple' || (rule.frequency === 'once' && !appliedRules.has(rule.id))) {
            totalScore += rule.points;
            if (rule.frequency === 'once') {
              appliedRules.add(rule.id);
            }
          }
        }
      }
    }

    // Apply engagement scoring
    const engagementScore = this.calculateEngagementScore(lead);
    totalScore += engagementScore;

    lead.score = Math.min(totalScore, 100); // Cap at 100
    lead.updatedAt = new Date();
    
    return lead.score;
  }

  async getLeadAnalytics(): Promise<LeadAnalytics> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentLeads = this.leads.filter(l => l.createdAt >= thirtyDaysAgo);
    const recentConversions = this.conversions.filter(c => c.timestamp >= thirtyDaysAgo);

    const leadsBySource: Record<string, number> = {};
    const leadsByStage: Record<string, number> = {};
    const conversionRates: Record<string, number> = {};

    // Calculate leads by source
    recentLeads.forEach(lead => {
      const source = lead.source.channel;
      leadsBySource[source] = (leadsBySource[source] || 0) + 1;
    });

    // Calculate leads by stage
    recentLeads.forEach(lead => {
      const stage = lead.journey.currentStage;
      leadsByStage[stage] = (leadsByStage[stage] || 0) + 1;
    });

    // Calculate conversion rates by source
    Object.keys(leadsBySource).forEach(source => {
      const sourceLeads = recentLeads.filter(l => l.source.channel === source);
      const sourceConversions = sourceLeads.filter(l => l.status === LeadStatus.CLOSED_WON);
      conversionRates[source] = sourceLeads.length > 0 ? (sourceConversions.length / sourceLeads.length) * 100 : 0;
    });

    // Calculate average time to conversion
    const convertedLeads = recentLeads.filter(l => l.journey.timeToConversion);
    const averageTimeToConversion = convertedLeads.length > 0 
      ? convertedLeads.reduce((sum, l) => sum + (l.journey.timeToConversion || 0), 0) / convertedLeads.length 
      : 0;

    // Calculate top performing channels
    const topPerformingChannels: ChannelPerformance[] = Object.keys(leadsBySource).map(channel => {
      const channelLeads = recentLeads.filter(l => l.source.channel === channel);
      const channelConversions = channelLeads.filter(l => l.status === LeadStatus.CLOSED_WON);
      const channelRevenue = channelConversions.reduce((sum, l) => sum + (l.journey.conversionValue || 0), 0);
      
      return {
        channel,
        leads: channelLeads.length,
        conversions: channelConversions.length,
        conversionRate: channelLeads.length > 0 ? (channelConversions.length / channelLeads.length) * 100 : 0,
        cost: 0, // Would be populated from ad spend data
        costPerLead: 0,
        costPerAcquisition: 0,
        roi: channelRevenue // Simplified ROI calculation
      };
    }).sort((a, b) => b.conversionRate - a.conversionRate);

    return {
      totalLeads: recentLeads.length,
      leadsBySource,
      leadsByStage,
      conversionRates,
      averageTimeToConversion,
      costPerLead: {}, // Would be calculated from ad spend
      leadQualityScore: this.calculateOverallLeadQuality(recentLeads),
      topPerformingChannels: topPerformingChannels.slice(0, 5),
      cohortAnalysis: await this.generateCohortAnalysis()
    };
  }

  async getLeadJourney(leadId: string): Promise<CustomerJourney | null> {
    const lead = this.leads.find(l => l.id === leadId);
    return lead ? lead.journey : null;
  }

  async updateLeadStage(leadId: string, newStage: JourneyStage): Promise<boolean> {
    const lead = this.leads.find(l => l.id === leadId);
    
    if (!lead) {
      return false;
    }

    // Exit current stage
    const currentStageProgress = lead.journey.stages.find(s => s.stage === lead.journey.currentStage && !s.exitedAt);
    if (currentStageProgress) {
      currentStageProgress.exitedAt = new Date();
      currentStageProgress.timeSpent = Math.floor(
        (currentStageProgress.exitedAt.getTime() - currentStageProgress.enteredAt.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    // Enter new stage
    lead.journey.currentStage = newStage;
    lead.journey.stages.push({
      stage: newStage,
      enteredAt: new Date(),
      touchpoints: 0,
      conversionRate: 0
    });

    lead.updatedAt = new Date();
    
    this.logger.log(`Lead stage updated: ${leadId} -> ${newStage}`);
    return true;
  }

  private async updateJourneyStage(lead: Lead, touchpoint: Touchpoint): Promise<void> {
    const currentStage = lead.journey.currentStage;
    let newStage: JourneyStage | null = null;

    // Stage progression logic based on touchpoint type and page
    switch (touchpoint.type) {
      case 'page_view':
        if (touchpoint.pageUrl?.includes('/pricing') && currentStage === JourneyStage.AWARENESS) {
          newStage = JourneyStage.CONSIDERATION;
        } else if (touchpoint.pageUrl?.includes('/features') && currentStage === JourneyStage.INTEREST) {
          newStage = JourneyStage.CONSIDERATION;
        }
        break;
      
      case 'form_fill':
        if (currentStage === JourneyStage.AWARENESS) {
          newStage = JourneyStage.INTEREST;
        } else if (currentStage === JourneyStage.CONSIDERATION) {
          newStage = JourneyStage.INTENT;
        }
        break;
      
      case 'download':
        if (currentStage === JourneyStage.INTEREST) {
          newStage = JourneyStage.CONSIDERATION;
        } else if (currentStage === JourneyStage.CONSIDERATION) {
          newStage = JourneyStage.EVALUATION;
        }
        break;
      
      case 'purchase':
        newStage = JourneyStage.PURCHASE;
        break;
    }

    if (newStage && newStage !== currentStage) {
      await this.updateLeadStage(lead.id, newStage);
    }
  }

  private async calculateAttribution(lead: Lead): Promise<AttributionModel> {
    const touchpoints = lead.journey.touchpoints.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    if (touchpoints.length === 0) {
      return {
        firstTouch: { touchpointId: '', credit: 0, value: 0 },
        lastTouch: { touchpointId: '', credit: 0, value: 0 },
        linear: [],
        timeDecay: [],
        positionBased: []
      };
    }

    const conversionValue = lead.journey.conversionValue || 0;
    
    // First-touch attribution
    const firstTouch = {
      touchpointId: touchpoints[0].id,
      credit: 100,
      value: conversionValue
    };

    // Last-touch attribution
    const lastTouch = {
      touchpointId: touchpoints[touchpoints.length - 1].id,
      credit: 100,
      value: conversionValue
    };

    // Linear attribution
    const linearCredit = 100 / touchpoints.length;
    const linear = touchpoints.map(tp => ({
      touchpointId: tp.id,
      credit: linearCredit,
      value: conversionValue * (linearCredit / 100)
    }));

    // Time-decay attribution (more recent touchpoints get more credit)
    const timeDecay = this.calculateTimeDecayAttribution(touchpoints, conversionValue);

    // Position-based attribution (40% first, 40% last, 20% middle)
    const positionBased = this.calculatePositionBasedAttribution(touchpoints, conversionValue);

    return {
      firstTouch,
      lastTouch,
      linear,
      timeDecay,
      positionBased
    };
  }

  private calculateTimeDecayAttribution(touchpoints: Touchpoint[], conversionValue: number): AttributionCredit[] {
    const now = Date.now();
    const halfLife = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

    // Calculate decay weights
    const weights = touchpoints.map(tp => {
      const age = now - tp.timestamp.getTime();
      return Math.pow(0.5, age / halfLife);
    });

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

    return touchpoints.map((tp, index) => ({
      touchpointId: tp.id,
      credit: (weights[index] / totalWeight) * 100,
      value: conversionValue * (weights[index] / totalWeight)
    }));
  }

  private calculatePositionBasedAttribution(touchpoints: Touchpoint[], conversionValue: number): AttributionCredit[] {
    if (touchpoints.length === 1) {
      return [{
        touchpointId: touchpoints[0].id,
        credit: 100,
        value: conversionValue
      }];
    }

    const result: AttributionCredit[] = [];
    
    // First touchpoint gets 40%
    result.push({
      touchpointId: touchpoints[0].id,
      credit: 40,
      value: conversionValue * 0.4
    });

    // Last touchpoint gets 40%
    if (touchpoints.length > 1) {
      result.push({
        touchpointId: touchpoints[touchpoints.length - 1].id,
        credit: 40,
        value: conversionValue * 0.4
      });
    }

    // Middle touchpoints share remaining 20%
    const middleTouchpoints = touchpoints.slice(1, -1);
    if (middleTouchpoints.length > 0) {
      const middleCredit = 20 / middleTouchpoints.length;
      const middleValue = (conversionValue * 0.2) / middleTouchpoints.length;
      
      middleTouchpoints.forEach(tp => {
        result.push({
          touchpointId: tp.id,
          credit: middleCredit,
          value: middleValue
        });
      });
    }

    return result;
  }

  private calculateEngagementScore(lead: Lead): number {
    let score = 0;
    const touchpoints = lead.journey.touchpoints;
    
    // Email engagement scoring
    const emailOpens = touchpoints.filter(tp => tp.type === 'email_open').length;
    const emailClicks = touchpoints.filter(tp => tp.type === 'email_click').length;
    score += Math.min(emailOpens * 2, 10); // Max 10 points for email opens
    score += Math.min(emailClicks * 5, 15); // Max 15 points for email clicks

    // Website engagement scoring
    const pageViews = touchpoints.filter(tp => tp.type === 'page_view').length;
    const totalTimeOnSite = touchpoints.reduce((sum, tp) => sum + (tp.engagement.timeOnPage || 0), 0);
    score += Math.min(pageViews, 10); // Max 10 points for page views
    score += Math.min(Math.floor(totalTimeOnSite / 60), 15); // Max 15 points for time on site (minutes)

    // Content engagement scoring
    const downloads = touchpoints.filter(tp => tp.type === 'download').length;
    score += downloads * 10; // 10 points per download

    return score;
  }

  private evaluateCondition(data: any, condition: ScoringCondition): boolean {
    const fieldValue = this.getNestedValue(data, condition.field);
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'greater_than':
        return fieldValue > condition.value;
      case 'less_than':
        return fieldValue < condition.value;
      case 'contains':
        return typeof fieldValue === 'string' && fieldValue.toLowerCase().includes(condition.value.toLowerCase());
      case 'starts_with':
        return typeof fieldValue === 'string' && fieldValue.toLowerCase().startsWith(condition.value.toLowerCase());
      case 'ends_with':
        return typeof fieldValue === 'string' && fieldValue.toLowerCase().endsWith(condition.value.toLowerCase());
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
      default:
        return false;
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private calculateOverallLeadQuality(leads: Lead[]): number {
    if (leads.length === 0) return 0;
    
    const averageScore = leads.reduce((sum, lead) => sum + lead.score, 0) / leads.length;
    const qualifiedLeads = leads.filter(l => l.score >= 50).length;
    const qualificationRate = (qualifiedLeads / leads.length) * 100;
    
    return Math.round((averageScore + qualificationRate) / 2);
  }

  private async generateCohortAnalysis(): Promise<CohortData[]> {
    // Generate cohort analysis for the last 6 months
    const cohorts: CohortData[] = [];
    const now = new Date();
    
    for (let i = 0; i < 6; i++) {
      const cohortDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const cohortEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const cohortLeads = this.leads.filter(l => 
        l.createdAt >= cohortDate && l.createdAt <= cohortEnd
      );
      
      if (cohortLeads.length > 0) {
        const cohortId = `${cohortDate.getFullYear()}-${String(cohortDate.getMonth() + 1).padStart(2, '0')}`;
        
        cohorts.push({
          cohort: cohortId,
          size: cohortLeads.length,
          conversionRates: this.calculateCohortConversionRates(cohortLeads),
          retentionRates: this.calculateCohortRetentionRates(cohortLeads),
          revenue: this.calculateCohortRevenue(cohortLeads)
        });
      }
    }
    
    return cohorts.reverse(); // Return chronological order
  }

  private calculateCohortConversionRates(cohortLeads: Lead[]): number[] {
    // Calculate conversion rates for each week after cohort creation
    const rates: number[] = [];
    const cohortStart = Math.min(...cohortLeads.map(l => l.createdAt.getTime()));
    
    for (let week = 1; week <= 12; week++) {
      const weekEnd = cohortStart + (week * 7 * 24 * 60 * 60 * 1000);
      const convertedByWeek = cohortLeads.filter(l => 
        l.status === LeadStatus.CLOSED_WON && 
        l.updatedAt.getTime() <= weekEnd
      ).length;
      
      rates.push((convertedByWeek / cohortLeads.length) * 100);
    }
    
    return rates;
  }

  private calculateCohortRetentionRates(cohortLeads: Lead[]): number[] {
    // For lead tracking, retention might be measured by continued engagement
    const rates: number[] = [];
    const cohortStart = Math.min(...cohortLeads.map(l => l.createdAt.getTime()));
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    for (let month = 1; month <= 6; month++) {
      const monthEnd = cohortStart + (month * 30 * 24 * 60 * 60 * 1000);
      const activeInMonth = cohortLeads.filter(l => 
        l.lastActivityAt.getTime() >= monthEnd - (30 * 24 * 60 * 60 * 1000) &&
        l.lastActivityAt.getTime() <= monthEnd
      ).length;
      
      rates.push((activeInMonth / cohortLeads.length) * 100);
    }
    
    return rates;
  }

  private calculateCohortRevenue(cohortLeads: Lead[]): number[] {
    const revenue: number[] = [];
    const cohortStart = Math.min(...cohortLeads.map(l => l.createdAt.getTime()));
    
    for (let month = 1; month <= 6; month++) {
      const monthEnd = cohortStart + (month * 30 * 24 * 60 * 60 * 1000);
      const monthRevenue = cohortLeads
        .filter(l => l.status === LeadStatus.CLOSED_WON)
        .reduce((sum, l) => sum + (l.journey.conversionValue || 0), 0);
      
      revenue.push(monthRevenue);
    }
    
    return revenue;
  }

  getLeads(filters?: { status?: LeadStatus; source?: string; minScore?: number }): Lead[] {
    let filteredLeads = [...this.leads];
    
    if (filters?.status) {
      filteredLeads = filteredLeads.filter(l => l.status === filters.status);
    }
    
    if (filters?.source) {
      filteredLeads = filteredLeads.filter(l => l.source.channel === filters.source);
    }
    
    if (filters?.minScore) {
      filteredLeads = filteredLeads.filter(l => l.score >= filters.minScore);
    }
    
    return filteredLeads.sort((a, b) => b.score - a.score);
  }

  getTouchpoints(leadId?: string): Touchpoint[] {
    if (leadId) {
      return this.touchpoints.filter(tp => {
        const lead = this.leads.find(l => l.id === leadId);
        return lead?.journey.touchpoints.some(jtp => jtp.id === tp.id);
      });
    }
    
    return this.touchpoints;
  }

  getConversions(): ConversionEvent[] {
    return this.conversions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}