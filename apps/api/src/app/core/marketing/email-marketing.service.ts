import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: EmailVariable[];
  category: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tags: string[];
}

export interface EmailVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'url';
  defaultValue?: string;
  required: boolean;
  description: string;
}

export interface EmailCampaign {
  id: string;
  name: string;
  description: string;
  type: 'newsletter' | 'promotional' | 'transactional' | 'drip' | 'welcome';
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';
  templateId: string;
  segmentIds: string[];
  scheduledAt?: Date;
  sentAt?: Date;
  configuration: CampaignConfiguration;
  analytics: CampaignAnalytics;
  abTest?: ABTestConfiguration;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface CampaignConfiguration {
  fromName: string;
  fromEmail: string;
  replyTo: string;
  sendTimeOptimization: boolean;
  trackOpens: boolean;
  trackClicks: boolean;
  timezone: string;
  suppressionLists: string[];
  deliverySettings: DeliverySettings;
}

export interface DeliverySettings {
  maxSendRate: number; // emails per hour
  throttling: boolean;
  retryFailedSends: boolean;
  bounceHandling: boolean;
  unsubscribeHandling: boolean;
}

export interface CampaignAnalytics {
  totalSent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  complained: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  unsubscribeRate: number;
  complaintRate: number;
  conversionRate: number;
  revenue: number;
  roi: number;
}

export interface ABTestConfiguration {
  enabled: boolean;
  testType: 'subject' | 'content' | 'send_time' | 'from_name';
  variants: ABTestVariant[];
  splitPercentage: number;
  winnerCriteria: 'open_rate' | 'click_rate' | 'conversion_rate';
  testDuration: number; // hours
  autoSelectWinner: boolean;
}

export interface ABTestVariant {
  id: string;
  name: string;
  percentage: number;
  subject?: string;
  content?: string;
  sendTime?: string;
  fromName?: string;
  analytics: CampaignAnalytics;
}

export interface EmailDelivery {
  id: string;
  campaignId: string;
  recipientEmail: string;
  status: 'queued' | 'sending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed';
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  bouncedAt?: Date;
  bounceReason?: string;
  errorMessage?: string;
  tracking: EmailTracking;
}

export interface EmailTracking {
  opens: EmailEvent[];
  clicks: EmailEvent[];
  deviceInfo: DeviceInfo;
  location: LocationInfo;
}

export interface EmailEvent {
  timestamp: Date;
  userAgent: string;
  ipAddress: string;
  clickedUrl?: string;
}

export interface DeviceInfo {
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  operatingSystem: string;
  browser: string;
}

export interface LocationInfo {
  country: string;
  region: string;
  city: string;
  timezone: string;
}

export interface EmailSegment {
  id: string;
  name: string;
  description: string;
  criteria: SegmentCriteria[];
  estimatedSize: number;
  lastCalculated: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface SegmentCriteria {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

@Injectable()
export class EmailMarketingService {
  private readonly logger = new Logger(EmailMarketingService.name);
  private templates: EmailTemplate[] = [];
  private campaigns: EmailCampaign[] = [];
  private deliveries: EmailDelivery[] = [];
  private segments: EmailSegment[] = [];
  private deliveryQueue: EmailDelivery[] = [];

  constructor(private configService: ConfigService) {
    this.initializeDefaultTemplates();
    this.initializeDefaultSegments();
  }

  private initializeDefaultTemplates(): void {
    this.templates = [
      {
        id: 'welcome_series_1',
        name: 'Welcome Email - Foundation Tier',
        subject: 'Welcome to Beyond the AI Plateau! Your Journey Begins',
        htmlContent: this.getWelcomeEmailHTML(),
        textContent: this.getWelcomeEmailText(),
        variables: [
          { name: 'firstName', type: 'text', required: true, description: 'Customer first name' },
          { name: 'purchaseDate', type: 'date', required: true, description: 'Date of purchase' },
          { name: 'loginUrl', type: 'url', required: true, description: 'Link to learning platform' }
        ],
        category: 'Welcome Series',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        tags: ['onboarding', 'foundation-tier', 'welcome']
      },
      {
        id: 'newsletter_weekly',
        name: 'Weekly Newsletter Template',
        subject: 'Weekly AI Insights: {{weekNumber}} Advanced Techniques',
        htmlContent: this.getNewsletterEmailHTML(),
        textContent: this.getNewsletterEmailText(),
        variables: [
          { name: 'weekNumber', type: 'number', required: true, description: 'Week number of the year' },
          { name: 'featuredTechnique', type: 'text', required: true, description: 'Technique of the week' },
          { name: 'caseStudyTitle', type: 'text', required: false, description: 'Case study title' }
        ],
        category: 'Newsletter',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        tags: ['newsletter', 'weekly', 'content']
      },
      {
        id: 'cart_abandonment',
        name: 'Cart Abandonment Recovery',
        subject: 'Complete Your Journey - AI Mastery Awaits',
        htmlContent: this.getCartAbandonmentHTML(),
        textContent: this.getCartAbandonmentText(),
        variables: [
          { name: 'firstName', type: 'text', required: true, description: 'Customer first name' },
          { name: 'cartValue', type: 'number', required: true, description: 'Value of abandoned cart' },
          { name: 'checkoutUrl', type: 'url', required: true, description: 'Complete checkout link' },
          { name: 'discountCode', type: 'text', required: false, description: 'Special discount code' }
        ],
        category: 'Recovery',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        tags: ['abandonment', 'recovery', 'conversion']
      }
    ];

    this.logger.log(`Initialized ${this.templates.length} default email templates`);
  }

  private initializeDefaultSegments(): void {
    this.segments = [
      {
        id: 'foundation_customers',
        name: 'Foundation Tier Customers',
        description: 'Customers who purchased the foundation tier',
        criteria: [
          { field: 'subscription.tier', operator: 'equals', value: 'foundation' }
        ],
        estimatedSize: 0,
        lastCalculated: new Date(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      },
      {
        id: 'high_engagement',
        name: 'High Engagement Users',
        description: 'Users with high platform engagement in last 30 days',
        criteria: [
          { field: 'analytics.sessionCount', operator: 'greater_than', value: 10, logicalOperator: 'AND' },
          { field: 'analytics.lastActive', operator: 'greater_than', value: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        ],
        estimatedSize: 0,
        lastCalculated: new Date(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      },
      {
        id: 'cart_abandoners',
        name: 'Cart Abandoners (24h)',
        description: 'Users who abandoned cart in last 24 hours',
        criteria: [
          { field: 'cart.abandoned', operator: 'equals', value: true, logicalOperator: 'AND' },
          { field: 'cart.updatedAt', operator: 'greater_than', value: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        ],
        estimatedSize: 0,
        lastCalculated: new Date(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      }
    ];

    this.logger.log(`Initialized ${this.segments.length} default email segments`);
  }

  async createTemplate(template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const newTemplate: EmailTemplate = {
      id: `template_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      ...template,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.templates.push(newTemplate);
    this.logger.log(`Email template created: ${newTemplate.id}`);
    
    return newTemplate.id;
  }

  async updateTemplate(templateId: string, updates: Partial<EmailTemplate>): Promise<boolean> {
    const templateIndex = this.templates.findIndex(t => t.id === templateId);
    
    if (templateIndex === -1) {
      return false;
    }

    this.templates[templateIndex] = {
      ...this.templates[templateIndex],
      ...updates,
      updatedAt: new Date()
    };

    this.logger.log(`Email template updated: ${templateId}`);
    return true;
  }

  async createCampaign(campaign: Omit<EmailCampaign, 'id' | 'createdAt' | 'updatedAt' | 'analytics'>): Promise<string> {
    const newCampaign: EmailCampaign = {
      id: `campaign_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      ...campaign,
      analytics: {
        totalSent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        unsubscribed: 0,
        complained: 0,
        openRate: 0,
        clickRate: 0,
        bounceRate: 0,
        unsubscribeRate: 0,
        complaintRate: 0,
        conversionRate: 0,
        revenue: 0,
        roi: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.campaigns.push(newCampaign);
    this.logger.log(`Email campaign created: ${newCampaign.id}`);
    
    return newCampaign.id;
  }

  async scheduleCampaign(campaignId: string, scheduledAt: Date): Promise<boolean> {
    const campaign = this.campaigns.find(c => c.id === campaignId);
    
    if (!campaign || campaign.status !== 'draft') {
      return false;
    }

    campaign.scheduledAt = scheduledAt;
    campaign.status = 'scheduled';
    campaign.updatedAt = new Date();

    this.logger.log(`Campaign scheduled: ${campaignId} for ${scheduledAt.toISOString()}`);
    return true;
  }

  async sendCampaign(campaignId: string): Promise<boolean> {
    const campaign = this.campaigns.find(c => c.id === campaignId);
    
    if (!campaign || (campaign.status !== 'draft' && campaign.status !== 'scheduled')) {
      return false;
    }

    campaign.status = 'sending';
    campaign.sentAt = new Date();
    campaign.updatedAt = new Date();

    // Get recipients from segments
    const recipients = await this.getSegmentRecipients(campaign.segmentIds);
    
    // Create delivery records
    for (const recipient of recipients) {
      const delivery: EmailDelivery = {
        id: `delivery_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        campaignId,
        recipientEmail: recipient.email,
        status: 'queued',
        tracking: {
          opens: [],
          clicks: [],
          deviceInfo: {
            deviceType: 'unknown',
            operatingSystem: '',
            browser: ''
          },
          location: {
            country: '',
            region: '',
            city: '',
            timezone: ''
          }
        }
      };

      this.deliveries.push(delivery);
      this.deliveryQueue.push(delivery);
    }

    campaign.analytics.totalSent = recipients.length;
    
    this.logger.log(`Campaign sending started: ${campaignId} to ${recipients.length} recipients`);
    
    // Process delivery queue
    await this.processDeliveryQueue();
    
    return true;
  }

  async createSegment(segment: Omit<EmailSegment, 'id' | 'createdAt' | 'updatedAt' | 'estimatedSize' | 'lastCalculated'>): Promise<string> {
    const newSegment: EmailSegment = {
      id: `segment_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      ...segment,
      estimatedSize: 0,
      lastCalculated: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Calculate initial segment size
    newSegment.estimatedSize = await this.calculateSegmentSize(newSegment.criteria);
    
    this.segments.push(newSegment);
    this.logger.log(`Email segment created: ${newSegment.id} with ${newSegment.estimatedSize} recipients`);
    
    return newSegment.id;
  }

  async getCampaignAnalytics(campaignId: string): Promise<CampaignAnalytics | null> {
    const campaign = this.campaigns.find(c => c.id === campaignId);
    
    if (!campaign) {
      return null;
    }

    // Recalculate analytics based on delivery records
    const campaignDeliveries = this.deliveries.filter(d => d.campaignId === campaignId);
    
    const analytics: CampaignAnalytics = {
      totalSent: campaignDeliveries.length,
      delivered: campaignDeliveries.filter(d => d.status === 'delivered' || d.status === 'opened' || d.status === 'clicked').length,
      opened: campaignDeliveries.filter(d => d.openedAt).length,
      clicked: campaignDeliveries.filter(d => d.clickedAt).length,
      bounced: campaignDeliveries.filter(d => d.status === 'bounced').length,
      unsubscribed: 0, // Would be calculated from unsubscribe events
      complained: 0, // Would be calculated from complaint events
      openRate: 0,
      clickRate: 0,
      bounceRate: 0,
      unsubscribeRate: 0,
      complaintRate: 0,
      conversionRate: 0,
      revenue: 0,
      roi: 0
    };

    // Calculate rates
    if (analytics.delivered > 0) {
      analytics.openRate = (analytics.opened / analytics.delivered) * 100;
      analytics.clickRate = (analytics.clicked / analytics.delivered) * 100;
    }
    
    if (analytics.totalSent > 0) {
      analytics.bounceRate = (analytics.bounced / analytics.totalSent) * 100;
      analytics.unsubscribeRate = (analytics.unsubscribed / analytics.totalSent) * 100;
      analytics.complaintRate = (analytics.complained / analytics.totalSent) * 100;
    }

    // Update campaign analytics
    campaign.analytics = analytics;
    
    return analytics;
  }

  async trackEmailOpen(deliveryId: string, userAgent: string, ipAddress: string): Promise<boolean> {
    const delivery = this.deliveries.find(d => d.id === deliveryId);
    
    if (!delivery) {
      return false;
    }

    if (!delivery.openedAt) {
      delivery.openedAt = new Date();
      delivery.status = 'opened';
    }

    delivery.tracking.opens.push({
      timestamp: new Date(),
      userAgent,
      ipAddress
    });

    this.logger.log(`Email open tracked: ${deliveryId}`);
    return true;
  }

  async trackEmailClick(deliveryId: string, clickedUrl: string, userAgent: string, ipAddress: string): Promise<boolean> {
    const delivery = this.deliveries.find(d => d.id === deliveryId);
    
    if (!delivery) {
      return false;
    }

    if (!delivery.clickedAt) {
      delivery.clickedAt = new Date();
      delivery.status = 'clicked';
    }

    delivery.tracking.clicks.push({
      timestamp: new Date(),
      userAgent,
      ipAddress,
      clickedUrl
    });

    this.logger.log(`Email click tracked: ${deliveryId} - ${clickedUrl}`);
    return true;
  }

  async getTemplates(category?: string): Promise<EmailTemplate[]> {
    if (category) {
      return this.templates.filter(t => t.category === category && t.isActive);
    }
    return this.templates.filter(t => t.isActive);
  }

  async getCampaigns(status?: string): Promise<EmailCampaign[]> {
    if (status) {
      return this.campaigns.filter(c => c.status === status);
    }
    return this.campaigns;
  }

  async getSegments(): Promise<EmailSegment[]> {
    return this.segments.filter(s => s.isActive);
  }

  async getDeliveryStatus(campaignId: string): Promise<EmailDelivery[]> {
    return this.deliveries.filter(d => d.campaignId === campaignId);
  }

  private async getSegmentRecipients(segmentIds: string[]): Promise<{ email: string; data: any }[]> {
    // In production, this would query the database based on segment criteria
    // For now, return mock data
    const mockRecipients = [
      { email: 'user1@example.com', data: { firstName: 'John', tier: 'foundation' } },
      { email: 'user2@example.com', data: { firstName: 'Jane', tier: 'foundation' } },
      { email: 'user3@example.com', data: { firstName: 'Bob', tier: 'advanced' } }
    ];

    return mockRecipients;
  }

  private async calculateSegmentSize(criteria: SegmentCriteria[]): Promise<number> {
    // In production, this would query the database to count matching records
    // For now, return a mock count
    return Math.floor(Math.random() * 1000) + 100;
  }

  private async processDeliveryQueue(): Promise<void> {
    while (this.deliveryQueue.length > 0) {
      const delivery = this.deliveryQueue.shift()!;
      
      try {
        // Simulate email sending
        await this.sendEmail(delivery);
        delivery.status = 'sent';
        delivery.sentAt = new Date();
        
        // Simulate delivery after a short delay
        setTimeout(() => {
          delivery.status = 'delivered';
          delivery.deliveredAt = new Date();
        }, Math.random() * 5000 + 1000);
        
      } catch (error) {
        delivery.status = 'failed';
        delivery.errorMessage = error.message;
        this.logger.error(`Email delivery failed: ${delivery.id}`, error);
      }
    }
  }

  private async sendEmail(delivery: EmailDelivery): Promise<void> {
    // In production, this would integrate with email service provider (SendGrid, AWS SES, etc.)
    this.logger.log(`Sending email to ${delivery.recipientEmail} for campaign ${delivery.campaignId}`);
    
    // Simulate random failures (5% failure rate)
    if (Math.random() < 0.05) {
      throw new Error('Email service temporarily unavailable');
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  private async processScheduledCampaigns(): Promise<void> {
    const now = new Date();
    const scheduledCampaigns = this.campaigns.filter(
      c => c.status === 'scheduled' && c.scheduledAt && c.scheduledAt <= now
    );

    for (const campaign of scheduledCampaigns) {
      await this.sendCampaign(campaign.id);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  private async updateSegmentSizes(): Promise<void> {
    for (const segment of this.segments) {
      if (segment.isActive) {
        segment.estimatedSize = await this.calculateSegmentSize(segment.criteria);
        segment.lastCalculated = new Date();
      }
    }
    
    this.logger.log('Updated segment sizes');
  }

  private getWelcomeEmailHTML(): string {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
          <h1>Welcome to Beyond the AI Plateau, {{firstName}}!</h1>
          <p>Thank you for joining our community of AI practitioners on {{purchaseDate}}.</p>
          <p>Your foundation tier access includes:</p>
          <ul>
            <li>Complete access to the Five Elite Principles</li>
            <li>100+ production-ready prompt templates</li>
            <li>12-week transformation roadmap</li>
          </ul>
          <a href="{{loginUrl}}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Start Learning</a>
        </body>
      </html>
    `;
  }

  private getWelcomeEmailText(): string {
    return `
      Welcome to Beyond the AI Plateau, {{firstName}}!
      
      Thank you for joining our community of AI practitioners on {{purchaseDate}}.
      
      Your foundation tier access includes:
      - Complete access to the Five Elite Principles
      - 100+ production-ready prompt templates
      - 12-week transformation roadmap
      
      Start your journey: {{loginUrl}}
    `;
  }

  private getNewsletterEmailHTML(): string {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
          <h1>Week {{weekNumber}} AI Insights</h1>
          <h2>Featured Technique: {{featuredTechnique}}</h2>
          <p>This week we're diving deep into advanced AI techniques that will transform your development workflow.</p>
          {{#if caseStudyTitle}}
          <h3>Case Study: {{caseStudyTitle}}</h3>
          <p>See how real developers are applying these principles in production environments.</p>
          {{/if}}
        </body>
      </html>
    `;
  }

  private getNewsletterEmailText(): string {
    return `
      Week {{weekNumber}} AI Insights
      
      Featured Technique: {{featuredTechnique}}
      
      This week we're diving deep into advanced AI techniques that will transform your development workflow.
      
      {{#if caseStudyTitle}}
      Case Study: {{caseStudyTitle}}
      See how real developers are applying these principles in production environments.
      {{/if}}
    `;
  }

  private getCartAbandonmentHTML(): string {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
          <h1>Don't Miss Out, {{firstName}}!</h1>
          <p>You left ${{cartValue}} worth of AI mastery in your cart.</p>
          <p>Complete your purchase now and start transforming your development skills today.</p>
          {{#if discountCode}}
          <p><strong>Special offer:</strong> Use code {{discountCode}} for additional savings!</p>
          {{/if}}
          <a href="{{checkoutUrl}}" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Complete Purchase</a>
        </body>
      </html>
    `;
  }

  private getCartAbandonmentText(): string {
    return `
      Don't Miss Out, {{firstName}}!
      
      You left ${{cartValue}} worth of AI mastery in your cart.
      
      Complete your purchase now and start transforming your development skills today.
      
      {{#if discountCode}}
      Special offer: Use code {{discountCode}} for additional savings!
      {{/if}}
      
      Complete your purchase: {{checkoutUrl}}
    `;
  }
}