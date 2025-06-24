import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface CommunicationChannel {
  id: string;
  name: string;
  type: ChannelType;
  isActive: boolean;
  configuration: ChannelConfiguration;
  metrics: ChannelMetrics;
  createdAt: Date;
  updatedAt: Date;
}

export enum ChannelType {
  EMAIL = 'email',
  CHAT = 'chat',
  PHONE = 'phone',
  SMS = 'sms',
  SOCIAL_MEDIA = 'social_media',
  VIDEO_CALL = 'video_call',
  TICKET_SYSTEM = 'ticket_system'
}

export interface ChannelConfiguration {
  // Email configuration
  emailAddress?: string;
  smtpSettings?: SMTPSettings;
  emailTemplates?: string[];
  
  // Chat configuration
  chatWidget?: ChatWidgetConfig;
  availableHours?: BusinessHours;
  autoResponses?: AutoResponse[];
  
  // Phone configuration
  phoneNumber?: string;
  callRouting?: CallRoutingConfig;
  voicemailEnabled?: boolean;
  
  // SMS configuration
  smsProvider?: string;
  shortCode?: string;
  keywords?: string[];
  
  // Social media configuration
  platforms?: SocialPlatform[];
  
  // General settings
  businessHours?: BusinessHours;
  escalationRules?: string[];
  maxResponseTime?: number; // minutes
}

export interface SMTPSettings {
  host: string;
  port: number;
  username: string;
  password: string;
  secure: boolean;
  fromName: string;
  fromEmail: string;
}

export interface ChatWidgetConfig {
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  primaryColor: string;
  welcomeMessage: string;
  offlineMessage: string;
  enableFileUpload: boolean;
  enableEmojis: boolean;
  maxMessageLength: number;
}

export interface BusinessHours {
  timezone: string;
  schedule: DaySchedule[];
  holidays: Date[];
}

export interface DaySchedule {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  isOpen: boolean;
  openTime?: string; // HH:mm format
  closeTime?: string; // HH:mm format
  breaks?: TimeBreak[];
}

export interface TimeBreak {
  startTime: string;
  endTime: string;
  reason: string;
}

export interface AutoResponse {
  id: string;
  trigger: ResponseTrigger;
  message: string;
  isActive: boolean;
  delay?: number; // seconds
}

export interface ResponseTrigger {
  type: 'keyword' | 'time_based' | 'inactivity' | 'first_message' | 'queue_position';
  value: any;
  conditions?: Record<string, any>;
}

export interface CallRoutingConfig {
  strategy: 'round_robin' | 'skill_based' | 'priority' | 'availability';
  agents: string[];
  fallbackNumber?: string;
  maxRingTime: number; // seconds
  queueMusic?: string;
}

export interface SocialPlatform {
  platform: 'twitter' | 'facebook' | 'instagram' | 'linkedin';
  accountId: string;
  accessToken: string;
  monitorKeywords: string[];
  autoReply: boolean;
}

export interface ChannelMetrics {
  totalMessages: number;
  responseTime: {
    average: number;
    p50: number;
    p95: number;
    p99: number;
  };
  resolutionRate: number;
  customerSatisfaction: number;
  agentUtilization: number;
  queueMetrics?: QueueMetrics;
}

export interface QueueMetrics {
  currentWaiting: number;
  averageWaitTime: number;
  maxWaitTime: number;
  abandonRate: number;
}

export interface MessageTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  subject?: string;
  content: string;
  variables: TemplateVariable[];
  channels: ChannelType[];
  language: string;
  isActive: boolean;
  usageCount: number;
  averageRating: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export enum TemplateCategory {
  GREETING = 'greeting',
  ACKNOWLEDGMENT = 'acknowledgment',
  FOLLOW_UP = 'follow_up',
  RESOLUTION = 'resolution',
  ESCALATION = 'escalation',
  CLOSING = 'closing',
  TROUBLESHOOTING = 'troubleshooting',
  BILLING = 'billing',
  TECHNICAL = 'technical',
  GENERAL = 'general'
}

export interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'url' | 'email';
  required: boolean;
  defaultValue?: string;
  description: string;
}

export interface CommunicationMessage {
  id: string;
  channelId: string;
  channelType: ChannelType;
  ticketId?: string;
  customerId: string;
  agentId?: string;
  direction: 'inbound' | 'outbound';
  content: MessageContent;
  status: MessageStatus;
  priority: MessagePriority;
  metadata: MessageMetadata;
  attachments: MessageAttachment[];
  readAt?: Date;
  deliveredAt?: Date;
  sentAt: Date;
  createdAt: Date;
}

export interface MessageContent {
  text: string;
  html?: string;
  subject?: string;
  format: 'plain' | 'html' | 'markdown';
  language?: string;
  tone?: MessageTone;
}

export enum MessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  BOUNCED = 'bounced'
}

export enum MessagePriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum MessageTone {
  PROFESSIONAL = 'professional',
  FRIENDLY = 'friendly',
  EMPATHETIC = 'empathetic',
  APOLOGETIC = 'apologetic',
  ASSERTIVE = 'assertive',
  CASUAL = 'casual'
}

export interface MessageMetadata {
  source: string;
  deviceInfo?: DeviceInfo;
  location?: LocationInfo;
  referrer?: string;
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;
  responseTime?: number;
  sentiment?: SentimentAnalysis;
}

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet';
  os: string;
  browser: string;
  version: string;
}

export interface LocationInfo {
  country: string;
  region: string;
  city: string;
  timezone: string;
}

export interface SentimentAnalysis {
  score: number; // -1 to 1
  magnitude: number; // 0 to 1
  label: 'positive' | 'negative' | 'neutral';
  confidence: number;
}

export interface MessageAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  isInline: boolean;
}

export interface BrandVoiceProfile {
  id: string;
  name: string;
  description: string;
  tone: MessageTone;
  keyPhrases: string[];
  avoidPhrases: string[];
  writingStyle: WritingStyle;
  personaTraits: PersonaTrait[];
  responsePatterns: ResponsePattern[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WritingStyle {
  formality: 'formal' | 'semi-formal' | 'informal';
  verbosity: 'concise' | 'moderate' | 'detailed';
  technicality: 'layman' | 'moderate' | 'technical';
  positivity: 'neutral' | 'optimistic' | 'enthusiastic';
}

export interface PersonaTrait {
  trait: string;
  description: string;
  examples: string[];
}

export interface ResponsePattern {
  situation: string;
  template: string;
  variables: string[];
}

export interface CommunicationAnalytics {
  channelPerformance: ChannelPerformance[];
  messageVolume: VolumeMetrics;
  responseTimeAnalysis: ResponseTimeAnalysis;
  satisfactionMetrics: SatisfactionMetrics;
  agentPerformance: AgentCommunicationMetrics[];
  trendsData: CommunicationTrend[];
}

export interface ChannelPerformance {
  channelId: string;
  channelType: ChannelType;
  messageCount: number;
  averageResponseTime: number;
  resolutionRate: number;
  satisfactionScore: number;
  efficiency: number;
}

export interface VolumeMetrics {
  totalMessages: number;
  inboundMessages: number;
  outboundMessages: number;
  peakHours: HourlyVolume[];
  channelDistribution: Record<ChannelType, number>;
}

export interface HourlyVolume {
  hour: number;
  messageCount: number;
  averageResponseTime: number;
}

export interface ResponseTimeAnalysis {
  overall: TimeMetrics;
  byChannel: Record<ChannelType, TimeMetrics>;
  byPriority: Record<MessagePriority, TimeMetrics>;
  slaCompliance: number;
}

export interface TimeMetrics {
  average: number;
  median: number;
  p95: number;
  min: number;
  max: number;
}

export interface SatisfactionMetrics {
  overallScore: number;
  responseRate: number;
  npsScore: number;
  byChannel: Record<ChannelType, number>;
  sentimentDistribution: Record<string, number>;
}

export interface AgentCommunicationMetrics {
  agentId: string;
  agentName: string;
  messageCount: number;
  averageResponseTime: number;
  satisfactionScore: number;
  resolutionRate: number;
  channelExpertise: Record<ChannelType, number>;
}

export interface CommunicationTrend {
  date: Date;
  messageVolume: number;
  averageResponseTime: number;
  satisfactionScore: number;
  channelBreakdown: Record<ChannelType, number>;
}

@Injectable()
export class CommunicationPlatformService {
  private readonly logger = new Logger(CommunicationPlatformService.name);
  private channels: CommunicationChannel[] = [];
  private templates: MessageTemplate[] = [];
  private messages: CommunicationMessage[] = [];
  private brandVoiceProfiles: BrandVoiceProfile[] = [];

  constructor(private configService: ConfigService) {
    this.initializeChannels();
    this.initializeTemplates();
    this.initializeBrandVoice();
  }

  private initializeChannels(): void {
    this.channels = [
      {
        id: 'email_support',
        name: 'Email Support',
        type: ChannelType.EMAIL,
        isActive: true,
        configuration: {
          emailAddress: 'support@amysoft.tech',
          smtpSettings: {
            host: 'smtp.gmail.com',
            port: 587,
            username: 'support@amysoft.tech',
            password: 'encrypted_password',
            secure: true,
            fromName: 'Beyond the AI Plateau Support',
            fromEmail: 'support@amysoft.tech'
          },
          maxResponseTime: 240 // 4 hours
        },
        metrics: {
          totalMessages: 1250,
          responseTime: { average: 145, p50: 120, p95: 300, p99: 480 },
          resolutionRate: 92.5,
          customerSatisfaction: 4.3,
          agentUtilization: 78
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'live_chat',
        name: 'Live Chat Support',
        type: ChannelType.CHAT,
        isActive: true,
        configuration: {
          chatWidget: {
            position: 'bottom-right',
            primaryColor: '#007bff',
            welcomeMessage: 'Hi! How can we help you with your AI development journey today?',
            offlineMessage: 'We\'re currently offline. Please leave a message and we\'ll get back to you.',
            enableFileUpload: true,
            enableEmojis: true,
            maxMessageLength: 1000
          },
          businessHours: {
            timezone: 'UTC',
            schedule: [
              { day: 'monday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
              { day: 'tuesday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
              { day: 'wednesday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
              { day: 'thursday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
              { day: 'friday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
              { day: 'saturday', isOpen: false },
              { day: 'sunday', isOpen: false }
            ],
            holidays: []
          },
          autoResponses: [
            {
              id: 'welcome_message',
              trigger: { type: 'first_message', value: null },
              message: 'Welcome! I\'m here to help you get the most out of your AI development experience.',
              isActive: true
            }
          ],
          maxResponseTime: 5 // 5 minutes
        },
        metrics: {
          totalMessages: 3420,
          responseTime: { average: 3.2, p50: 2.1, p95: 8.5, p99: 15.2 },
          resolutionRate: 87.8,
          customerSatisfaction: 4.6,
          agentUtilization: 85,
          queueMetrics: {
            currentWaiting: 2,
            averageWaitTime: 1.8,
            maxWaitTime: 8.5,
            abandonRate: 3.2
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'phone_support',
        name: 'Phone Support',
        type: ChannelType.PHONE,
        isActive: true,
        configuration: {
          phoneNumber: '+1-800-AMYSOFT',
          callRouting: {
            strategy: 'skill_based',
            agents: ['agent_001', 'agent_002', 'agent_003'],
            maxRingTime: 30,
            queueMusic: 'professional_hold_music.mp3'
          },
          voicemailEnabled: true,
          businessHours: {
            timezone: 'UTC',
            schedule: [
              { day: 'monday', isOpen: true, openTime: '08:00', closeTime: '20:00' },
              { day: 'tuesday', isOpen: true, openTime: '08:00', closeTime: '20:00' },
              { day: 'wednesday', isOpen: true, openTime: '08:00', closeTime: '20:00' },
              { day: 'thursday', isOpen: true, openTime: '08:00', closeTime: '20:00' },
              { day: 'friday', isOpen: true, openTime: '08:00', closeTime: '20:00' },
              { day: 'saturday', isOpen: true, openTime: '10:00', closeTime: '16:00' },
              { day: 'sunday', isOpen: false }
            ],
            holidays: []
          },
          maxResponseTime: 2 // 2 minutes for callback
        },
        metrics: {
          totalMessages: 890,
          responseTime: { average: 1.8, p50: 1.2, p95: 4.5, p99: 8.2 },
          resolutionRate: 95.2,
          customerSatisfaction: 4.7,
          agentUtilization: 72,
          queueMetrics: {
            currentWaiting: 0,
            averageWaitTime: 0.8,
            maxWaitTime: 3.5,
            abandonRate: 2.1
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    this.logger.log(`Initialized ${this.channels.length} communication channels`);
  }

  private initializeTemplates(): void {
    this.templates = [
      {
        id: 'greeting_professional',
        name: 'Professional Greeting',
        category: TemplateCategory.GREETING,
        subject: 'Welcome to Beyond the AI Plateau Support',
        content: 'Hello {{customerName}},\n\nThank you for contacting Beyond the AI Plateau support. We\'ve received your inquiry regarding {{issueType}} and our team is ready to assist you.\n\nYour ticket number is {{ticketNumber}} for future reference.\n\nBest regards,\n{{agentName}}\nCustomer Success Team',
        variables: [
          { name: 'customerName', type: 'text', required: true, description: 'Customer\'s name' },
          { name: 'issueType', type: 'text', required: true, description: 'Type of issue reported' },
          { name: 'ticketNumber', type: 'text', required: true, description: 'Support ticket number' },
          { name: 'agentName', type: 'text', required: true, description: 'Support agent name' }
        ],
        channels: [ChannelType.EMAIL, ChannelType.CHAT],
        language: 'en',
        isActive: true,
        usageCount: 245,
        averageRating: 4.2,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      },
      {
        id: 'acknowledgment_technical',
        name: 'Technical Issue Acknowledgment',
        category: TemplateCategory.ACKNOWLEDGMENT,
        content: 'Hi {{customerName}},\n\nI understand you\'re experiencing {{technicalIssue}}. This can definitely be frustrating when you\'re trying to {{customerGoal}}.\n\nI\'ve escalated this to our technical team and we\'ll have a resolution for you within {{timeframe}}. I\'ll keep you updated on our progress.\n\nIn the meantime, here\'s a potential workaround: {{workaround}}\n\n{{agentName}}',
        variables: [
          { name: 'customerName', type: 'text', required: true, description: 'Customer\'s name' },
          { name: 'technicalIssue', type: 'text', required: true, description: 'Description of technical issue' },
          { name: 'customerGoal', type: 'text', required: true, description: 'What customer is trying to achieve' },
          { name: 'timeframe', type: 'text', required: true, description: 'Expected resolution timeframe' },
          { name: 'workaround', type: 'text', required: false, description: 'Temporary workaround solution' },
          { name: 'agentName', type: 'text', required: true, description: 'Support agent name' }
        ],
        channels: [ChannelType.EMAIL, ChannelType.CHAT, ChannelType.TICKET_SYSTEM],
        language: 'en',
        isActive: true,
        usageCount: 187,
        averageRating: 4.5,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'support_team'
      },
      {
        id: 'resolution_billing',
        name: 'Billing Resolution',
        category: TemplateCategory.RESOLUTION,
        subject: 'Billing Issue Resolved - {{ticketNumber}}',
        content: 'Hi {{customerName}},\n\nGreat news! I\'ve successfully resolved your billing inquiry regarding {{billingIssue}}.\n\nHere\'s what I\'ve done:\n{{resolutionSteps}}\n\nYour account has been updated and you should see the changes reflected within {{processingTime}}. {{refundInfo}}\n\nIs there anything else I can help you with regarding your account?\n\nBest regards,\n{{agentName}}',
        variables: [
          { name: 'customerName', type: 'text', required: true, description: 'Customer\'s name' },
          { name: 'ticketNumber', type: 'text', required: true, description: 'Support ticket number' },
          { name: 'billingIssue', type: 'text', required: true, description: 'Description of billing issue' },
          { name: 'resolutionSteps', type: 'text', required: true, description: 'Steps taken to resolve issue' },
          { name: 'processingTime', type: 'text', required: true, description: 'Time for changes to take effect' },
          { name: 'refundInfo', type: 'text', required: false, description: 'Refund information if applicable' },
          { name: 'agentName', type: 'text', required: true, description: 'Support agent name' }
        ],
        channels: [ChannelType.EMAIL],
        language: 'en',
        isActive: true,
        usageCount: 98,
        averageRating: 4.7,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'billing_team'
      },
      {
        id: 'follow_up_satisfaction',
        name: 'Satisfaction Follow-up',
        category: TemplateCategory.FOLLOW_UP,
        subject: 'How was your support experience? - {{ticketNumber}}',
        content: 'Hi {{customerName}},\n\nI hope your {{issueType}} has been fully resolved! I wanted to follow up to make sure everything is working well for you.\n\nWould you mind taking a moment to rate your support experience? Your feedback helps us continue improving our service.\n\n[Rate Your Experience]\n\nIf you need any additional assistance, please don\'t hesitate to reach out.\n\nBest regards,\n{{agentName}}',
        variables: [
          { name: 'customerName', type: 'text', required: true, description: 'Customer\'s name' },
          { name: 'ticketNumber', type: 'text', required: true, description: 'Support ticket number' },
          { name: 'issueType', type: 'text', required: true, description: 'Type of issue that was resolved' },
          { name: 'agentName', type: 'text', required: true, description: 'Support agent name' }
        ],
        channels: [ChannelType.EMAIL],
        language: 'en',
        isActive: true,
        usageCount: 156,
        averageRating: 4.1,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'quality_team'
      }
    ];

    this.logger.log(`Initialized ${this.templates.length} message templates`);
  }

  private initializeBrandVoice(): void {
    this.brandVoiceProfiles = [
      {
        id: 'default_brand_voice',
        name: 'Beyond the AI Plateau Brand Voice',
        description: 'Professional yet approachable tone for AI development community',
        tone: MessageTone.PROFESSIONAL,
        keyPhrases: [
          'AI development journey',
          'transform your workflow',
          'elite principles',
          'production-ready solutions',
          'phenomenal results'
        ],
        avoidPhrases: [
          'sorry for the inconvenience',
          'unfortunately',
          'we apologize',
          'that\'s not possible'
        ],
        writingStyle: {
          formality: 'semi-formal',
          verbosity: 'moderate',
          technicality: 'moderate',
          positivity: 'optimistic'
        },
        personaTraits: [
          {
            trait: 'Expert Guide',
            description: 'Knowledgeable about AI development with practical experience',
            examples: ['Based on my experience with similar implementations...', 'Here\'s a proven approach that works well...']
          },
          {
            trait: 'Solution-Oriented',
            description: 'Focuses on actionable solutions rather than problems',
            examples: ['Let me help you achieve that...', 'Here\'s how we can move forward...']
          },
          {
            trait: 'Community-Minded',
            description: 'Values collaboration and shared learning',
            examples: ['Many developers in our community have found...', 'You\'re part of a growing network of AI practitioners...']
          }
        ],
        responsePatterns: [
          {
            situation: 'Technical Issue',
            template: 'I understand the challenge you\'re facing with {{issue}}. Let me walk you through a solution that\'s worked well for other developers.',
            variables: ['issue']
          },
          {
            situation: 'Feature Request',
            template: 'That\'s an excellent suggestion! {{feature}} would definitely enhance the development experience. I\'ll make sure our product team sees this.',
            variables: ['feature']
          }
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    this.logger.log(`Initialized ${this.brandVoiceProfiles.length} brand voice profiles`);
  }

  async sendMessage(
    channelId: string,
    recipientId: string,
    content: MessageContent,
    templateId?: string,
    variables?: Record<string, string>
  ): Promise<string> {
    const channel = this.channels.find(c => c.id === channelId);
    
    if (!channel || !channel.isActive) {
      throw new Error(`Channel not found or inactive: ${channelId}`);
    }

    let finalContent = content;

    // Apply template if provided
    if (templateId) {
      const template = this.templates.find(t => t.id === templateId);
      if (template) {
        finalContent = await this.applyTemplate(template, variables || {});
      }
    }

    // Apply brand voice
    finalContent = await this.applyBrandVoice(finalContent);

    const message: CommunicationMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      channelId,
      channelType: channel.type,
      customerId: recipientId,
      direction: 'outbound',
      content: finalContent,
      status: MessageStatus.PENDING,
      priority: MessagePriority.NORMAL,
      metadata: {
        source: 'support_platform',
        responseTime: 0
      },
      attachments: [],
      sentAt: new Date(),
      createdAt: new Date()
    };

    this.messages.push(message);

    // Simulate message sending
    await this.processMessageDelivery(message);

    this.logger.log(`Message sent via ${channel.type} to ${recipientId}`);
    return message.id;
  }

  private async applyTemplate(template: MessageTemplate, variables: Record<string, string>): Promise<MessageContent> {
    let content = template.content;
    let subject = template.subject;

    // Replace variables in content
    template.variables.forEach(variable => {
      const value = variables[variable.name] || variable.defaultValue || `{{${variable.name}}}`;
      const regex = new RegExp(`{{${variable.name}}}`, 'g');
      content = content.replace(regex, value);
      if (subject) {
        subject = subject.replace(regex, value);
      }
    });

    return {
      text: content,
      subject,
      format: 'plain'
    };
  }

  private async applyBrandVoice(content: MessageContent): Promise<MessageContent> {
    const brandVoice = this.brandVoiceProfiles.find(p => p.isActive);
    
    if (!brandVoice) {
      return content;
    }

    // Simple brand voice application - in production this would be more sophisticated
    let enhancedContent = content.text;

    // Replace negative phrases with positive alternatives
    brandVoice.avoidPhrases.forEach(phrase => {
      if (enhancedContent.toLowerCase().includes(phrase.toLowerCase())) {
        // Simple replacements - in production this would use NLP
        enhancedContent = enhancedContent.replace(/sorry for the inconvenience/gi, 'thank you for your patience');
        enhancedContent = enhancedContent.replace(/unfortunately/gi, 'I understand');
        enhancedContent = enhancedContent.replace(/we apologize/gi, 'thank you for bringing this to our attention');
      }
    });

    return {
      ...content,
      text: enhancedContent,
      tone: brandVoice.tone
    };
  }

  private async processMessageDelivery(message: CommunicationMessage): Promise<void> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

    // Update message status
    message.status = MessageStatus.SENT;
    message.deliveredAt = new Date();

    // Simulate delivery confirmation
    setTimeout(() => {
      message.status = MessageStatus.DELIVERED;
    }, Math.random() * 2000 + 1000);

    // Update channel metrics
    const channel = this.channels.find(c => c.id === message.channelId);
    if (channel) {
      channel.metrics.totalMessages++;
      channel.updatedAt = new Date();
    }
  }

  async receiveMessage(
    channelId: string,
    senderId: string,
    content: string,
    metadata?: Partial<MessageMetadata>
  ): Promise<string> {
    const channel = this.channels.find(c => c.id === channelId);
    
    if (!channel || !channel.isActive) {
      throw new Error(`Channel not found or inactive: ${channelId}`);
    }

    const message: CommunicationMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      channelId,
      channelType: channel.type,
      customerId: senderId,
      direction: 'inbound',
      content: {
        text: content,
        format: 'plain'
      },
      status: MessageStatus.DELIVERED,
      priority: MessagePriority.NORMAL,
      metadata: {
        source: channel.type,
        ...metadata
      },
      attachments: [],
      sentAt: new Date(),
      createdAt: new Date()
    };

    // Perform sentiment analysis
    message.metadata.sentiment = await this.analyzeSentiment(content);

    this.messages.push(message);

    // Check for auto-responses
    await this.processAutoResponses(message);

    // Update channel metrics
    channel.metrics.totalMessages++;
    channel.updatedAt = new Date();

    this.logger.log(`Message received via ${channel.type} from ${senderId}`);
    return message.id;
  }

  private async analyzeSentiment(text: string): Promise<SentimentAnalysis> {
    // Simple sentiment analysis - in production this would use ML services
    const positiveWords = ['great', 'excellent', 'amazing', 'love', 'perfect', 'fantastic', 'wonderful'];
    const negativeWords = ['terrible', 'awful', 'hate', 'horrible', 'worst', 'frustrated', 'angry'];

    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach(word => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    });

    const totalSentimentWords = positiveCount + negativeCount;
    let score = 0;
    let label: 'positive' | 'negative' | 'neutral' = 'neutral';

    if (totalSentimentWords > 0) {
      score = (positiveCount - negativeCount) / totalSentimentWords;
      if (score > 0.1) label = 'positive';
      else if (score < -0.1) label = 'negative';
    }

    return {
      score,
      magnitude: Math.abs(score),
      label,
      confidence: totalSentimentWords > 0 ? 0.7 : 0.3
    };
  }

  private async processAutoResponses(message: CommunicationMessage): Promise<void> {
    const channel = this.channels.find(c => c.id === message.channelId);
    
    if (!channel?.configuration.autoResponses) {
      return;
    }

    for (const autoResponse of channel.configuration.autoResponses) {
      if (!autoResponse.isActive) continue;

      const shouldRespond = await this.evaluateResponseTrigger(autoResponse.trigger, message);
      
      if (shouldRespond) {
        // Delay response if specified
        const delay = autoResponse.delay || 0;
        
        setTimeout(async () => {
          await this.sendMessage(
            message.channelId,
            message.customerId,
            {
              text: autoResponse.message,
              format: 'plain'
            }
          );
        }, delay * 1000);

        break; // Only send first matching auto-response
      }
    }
  }

  private async evaluateResponseTrigger(trigger: ResponseTrigger, message: CommunicationMessage): Promise<boolean> {
    switch (trigger.type) {
      case 'keyword':
        return message.content.text.toLowerCase().includes(trigger.value.toLowerCase());
      
      case 'first_message':
        // Check if this is the customer's first message
        const customerMessages = this.messages.filter(m => 
          m.customerId === message.customerId && 
          m.direction === 'inbound'
        );
        return customerMessages.length === 1;
      
      case 'inactivity':
        // Check if there's been no response for a certain period
        return false; // Would be implemented with proper timing logic
      
      case 'time_based':
        const currentHour = new Date().getHours();
        return trigger.value.includes(currentHour);
      
      default:
        return false;
    }
  }

  async getTemplates(category?: TemplateCategory, channel?: ChannelType): Promise<MessageTemplate[]> {
    let templates = this.templates.filter(t => t.isActive);

    if (category) {
      templates = templates.filter(t => t.category === category);
    }

    if (channel) {
      templates = templates.filter(t => t.channels.includes(channel));
    }

    return templates.sort((a, b) => b.usageCount - a.usageCount);
  }

  async createTemplate(template: Omit<MessageTemplate, 'id' | 'usageCount' | 'averageRating' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const newTemplate: MessageTemplate = {
      id: `template_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      ...template,
      usageCount: 0,
      averageRating: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.templates.push(newTemplate);
    this.logger.log(`Message template created: ${newTemplate.name}`);
    
    return newTemplate.id;
  }

  async getChannels(): Promise<CommunicationChannel[]> {
    return this.channels.filter(c => c.isActive);
  }

  async updateChannelConfiguration(channelId: string, configuration: Partial<ChannelConfiguration>): Promise<boolean> {
    const channel = this.channels.find(c => c.id === channelId);
    
    if (!channel) {
      return false;
    }

    channel.configuration = { ...channel.configuration, ...configuration };
    channel.updatedAt = new Date();

    this.logger.log(`Channel configuration updated: ${channelId}`);
    return true;
  }

  async getMessages(channelId?: string, customerId?: string, limit: number = 100): Promise<CommunicationMessage[]> {
    let messages = [...this.messages];

    if (channelId) {
      messages = messages.filter(m => m.channelId === channelId);
    }

    if (customerId) {
      messages = messages.filter(m => m.customerId === customerId);
    }

    return messages
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getCommunicationAnalytics(): Promise<CommunicationAnalytics> {
    const channelPerformance = this.channels.map(channel => ({
      channelId: channel.id,
      channelType: channel.type,
      messageCount: channel.metrics.totalMessages,
      averageResponseTime: channel.metrics.responseTime.average,
      resolutionRate: channel.metrics.resolutionRate,
      satisfactionScore: channel.metrics.customerSatisfaction,
      efficiency: channel.metrics.agentUtilization
    }));

    const totalMessages = this.messages.length;
    const inboundMessages = this.messages.filter(m => m.direction === 'inbound').length;
    const outboundMessages = this.messages.filter(m => m.direction === 'outbound').length;

    // Generate hourly volume data
    const peakHours: HourlyVolume[] = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourMessages = this.messages.filter(m => m.createdAt.getHours() === hour);
      peakHours.push({
        hour,
        messageCount: hourMessages.length,
        averageResponseTime: hourMessages.length > 0 ? Math.random() * 10 + 1 : 0
      });
    }

    const channelDistribution = Object.values(ChannelType).reduce((acc, type) => {
      acc[type] = this.messages.filter(m => m.channelType === type).length;
      return acc;
    }, {} as Record<ChannelType, number>);

    return {
      channelPerformance,
      messageVolume: {
        totalMessages,
        inboundMessages,
        outboundMessages,
        peakHours,
        channelDistribution
      },
      responseTimeAnalysis: {
        overall: { average: 145, median: 120, p95: 300, min: 30, max: 480 },
        byChannel: {
          [ChannelType.EMAIL]: { average: 145, median: 120, p95: 300, min: 60, max: 480 },
          [ChannelType.CHAT]: { average: 3.2, median: 2.1, p95: 8.5, min: 0.5, max: 15.2 },
          [ChannelType.PHONE]: { average: 1.8, median: 1.2, p95: 4.5, min: 0.3, max: 8.2 },
          [ChannelType.SMS]: { average: 15, median: 12, p95: 30, min: 5, max: 60 },
          [ChannelType.SOCIAL_MEDIA]: { average: 120, median: 90, p95: 240, min: 30, max: 360 },
          [ChannelType.VIDEO_CALL]: { average: 2.5, median: 2.0, p95: 5.0, min: 1.0, max: 10.0 },
          [ChannelType.TICKET_SYSTEM]: { average: 180, median: 150, p95: 360, min: 60, max: 720 }
        },
        byPriority: {
          [MessagePriority.LOW]: { average: 240, median: 180, p95: 480, min: 120, max: 720 },
          [MessagePriority.NORMAL]: { average: 120, median: 90, p95: 240, min: 30, max: 360 },
          [MessagePriority.HIGH]: { average: 30, median: 20, p95: 60, min: 10, max: 90 },
          [MessagePriority.URGENT]: { average: 15, median: 10, p95: 30, min: 5, max: 45 }
        },
        slaCompliance: 94.2
      },
      satisfactionMetrics: {
        overallScore: 4.4,
        responseRate: 78.5,
        npsScore: 42,
        byChannel: {
          [ChannelType.EMAIL]: 4.3,
          [ChannelType.CHAT]: 4.6,
          [ChannelType.PHONE]: 4.7,
          [ChannelType.SMS]: 4.1,
          [ChannelType.SOCIAL_MEDIA]: 4.0,
          [ChannelType.VIDEO_CALL]: 4.8,
          [ChannelType.TICKET_SYSTEM]: 4.2
        },
        sentimentDistribution: {
          'positive': 65,
          'neutral': 25,
          'negative': 10
        }
      },
      agentPerformance: [], // Would be populated with actual agent data
      trendsData: this.generateCommunicationTrends()
    };
  }

  private generateCommunicationTrends(): CommunicationTrend[] {
    const trends: CommunicationTrend[] = [];
    const days = 30;

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      trends.push({
        date,
        messageVolume: Math.floor(Math.random() * 100) + 50,
        averageResponseTime: Math.random() * 60 + 30,
        satisfactionScore: Math.random() * 1 + 4,
        channelBreakdown: {
          [ChannelType.EMAIL]: Math.floor(Math.random() * 30) + 10,
          [ChannelType.CHAT]: Math.floor(Math.random() * 40) + 20,
          [ChannelType.PHONE]: Math.floor(Math.random() * 20) + 5,
          [ChannelType.SMS]: Math.floor(Math.random() * 10) + 2,
          [ChannelType.SOCIAL_MEDIA]: Math.floor(Math.random() * 15) + 3,
          [ChannelType.VIDEO_CALL]: Math.floor(Math.random() * 5) + 1,
          [ChannelType.TICKET_SYSTEM]: Math.floor(Math.random() * 25) + 8
        }
      });
    }

    return trends;
  }

  async markMessageAsRead(messageId: string): Promise<boolean> {
    const message = this.messages.find(m => m.id === messageId);
    
    if (!message) {
      return false;
    }

    message.readAt = new Date();
    message.status = MessageStatus.READ;

    return true;
  }

  async getBrandVoiceProfiles(): Promise<BrandVoiceProfile[]> {
    return this.brandVoiceProfiles;
  }

  async updateBrandVoiceProfile(profileId: string, updates: Partial<BrandVoiceProfile>): Promise<boolean> {
    const profile = this.brandVoiceProfiles.find(p => p.id === profileId);
    
    if (!profile) {
      return false;
    }

    Object.assign(profile, updates);
    profile.updatedAt = new Date();

    this.logger.log(`Brand voice profile updated: ${profileId}`);
    return true;
  }
}