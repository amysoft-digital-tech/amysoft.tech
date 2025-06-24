import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  type: TicketType;
  source: TicketSource;
  customer: CustomerInfo;
  assignedTo?: string;
  assignedTeam?: string;
  tags: string[];
  attachments: TicketAttachment[];
  interactions: TicketInteraction[];
  sla: SLATracking;
  resolution?: TicketResolution;
  satisfaction?: CustomerSatisfaction;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  escalatedAt?: Date;
  firstResponseAt?: Date;
}

export enum TicketStatus {
  NEW = 'new',
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  PENDING_CUSTOMER = 'pending_customer',
  PENDING_INTERNAL = 'pending_internal',
  ESCALATED = 'escalated',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  CANCELLED = 'cancelled'
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical'
}

export enum TicketType {
  TECHNICAL_ISSUE = 'technical_issue',
  BILLING_INQUIRY = 'billing_inquiry',
  FEATURE_REQUEST = 'feature_request',
  ACCOUNT_MANAGEMENT = 'account_management',
  GENERAL_INQUIRY = 'general_inquiry',
  BUG_REPORT = 'bug_report',
  REFUND_REQUEST = 'refund_request',
  PASSWORD_RESET = 'password_reset',
  TRAINING_REQUEST = 'training_request'
}

export enum TicketSource {
  EMAIL = 'email',
  WEB_FORM = 'web_form',
  CHAT = 'chat',
  PHONE = 'phone',
  SOCIAL_MEDIA = 'social_media',
  API = 'api',
  INTERNAL = 'internal'
}

export interface CustomerInfo {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  tier: 'foundation' | 'advanced' | 'enterprise';
  accountValue: number;
  totalTickets: number;
  satisfactionScore: number;
  lastInteraction: Date;
  timezone: string;
  preferredLanguage: string;
}

export interface TicketAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface TicketInteraction {
  id: string;
  type: 'comment' | 'status_change' | 'assignment' | 'escalation' | 'resolution' | 'note';
  content: string;
  author: string;
  authorType: 'customer' | 'agent' | 'system';
  isPublic: boolean;
  attachments: TicketAttachment[];
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface SLATracking {
  firstResponseDue: Date;
  resolutionDue: Date;
  firstResponseTime?: number; // minutes
  resolutionTime?: number; // minutes
  isFirstResponseOverdue: boolean;
  isResolutionOverdue: boolean;
  escalationThreshold: Date;
  breachedSLA: boolean;
  slaLevel: 'standard' | 'premium' | 'enterprise';
}

export interface TicketResolution {
  type: 'solved' | 'workaround' | 'duplicate' | 'wont_fix' | 'by_customer';
  description: string;
  resolvedBy: string;
  timeToResolution: number; // minutes
  firstCallResolution: boolean;
  resolutionSteps: string[];
  preventionMeasures?: string[];
}

export interface CustomerSatisfaction {
  rating: number; // 1-5 scale
  feedback?: string;
  surveyedAt: Date;
  npsScore?: number; // -100 to 100
  wouldRecommend?: boolean;
  followUpRequired: boolean;
}

export interface TicketFilters {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  type?: TicketType[];
  assignedTo?: string;
  assignedTeam?: string;
  customer?: string;
  dateRange?: { start: Date; end: Date };
  tags?: string[];
  slaBreached?: boolean;
  searchQuery?: string;
}

export interface TicketMetrics {
  totalTickets: number;
  openTickets: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  firstCallResolutionRate: number;
  customerSatisfactionScore: number;
  slaComplianceRate: number;
  escalationRate: number;
  ticketsByPriority: Record<TicketPriority, number>;
  ticketsByType: Record<TicketType, number>;
  ticketsBySource: Record<TicketSource, number>;
  agentPerformance: AgentPerformance[];
  trendsData: TicketTrend[];
}

export interface AgentPerformance {
  agentId: string;
  agentName: string;
  ticketsAssigned: number;
  ticketsResolved: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  customerSatisfaction: number;
  firstCallResolutionRate: number;
  slaComplianceRate: number;
  efficiency: number;
}

export interface TicketTrend {
  date: Date;
  newTickets: number;
  resolvedTickets: number;
  avgResponseTime: number;
  satisfactionScore: number;
}

export interface AutoAssignmentRule {
  id: string;
  name: string;
  conditions: AssignmentCondition[];
  actions: AssignmentAction[];
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssignmentCondition {
  field: 'type' | 'priority' | 'source' | 'customer_tier' | 'subject_contains' | 'time_of_day';
  operator: 'equals' | 'contains' | 'in' | 'greater_than' | 'less_than';
  value: any;
}

export interface AssignmentAction {
  type: 'assign_to_agent' | 'assign_to_team' | 'set_priority' | 'add_tag' | 'send_notification';
  value: any;
}

export interface EscalationRule {
  id: string;
  name: string;
  trigger: EscalationTrigger;
  actions: EscalationAction[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EscalationTrigger {
  type: 'sla_breach' | 'customer_tier' | 'priority_level' | 'time_since_update' | 'interaction_count';
  condition: any;
  threshold: number;
}

export interface EscalationAction {
  type: 'assign_to_manager' | 'increase_priority' | 'notify_team' | 'add_to_escalation_queue';
  target: string;
  notificationTemplate?: string;
}

@Injectable()
export class TicketManagementService {
  private readonly logger = new Logger(TicketManagementService.name);
  private tickets: SupportTicket[] = [];
  private assignmentRules: AutoAssignmentRule[] = [];
  private escalationRules: EscalationRule[] = [];
  private ticketCounter = 1000;

  constructor(private configService: ConfigService) {
    this.initializeDefaultRules();
    this.initializeSampleTickets();
  }

  private initializeDefaultRules(): void {
    this.assignmentRules = [
      {
        id: 'billing_team_assignment',
        name: 'Billing Team Assignment',
        conditions: [
          { field: 'type', operator: 'equals', value: TicketType.BILLING_INQUIRY }
        ],
        actions: [
          { type: 'assign_to_team', value: 'billing' },
          { type: 'add_tag', value: 'billing' }
        ],
        priority: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'technical_team_assignment',
        name: 'Technical Team Assignment',
        conditions: [
          { field: 'type', operator: 'in', value: [TicketType.TECHNICAL_ISSUE, TicketType.BUG_REPORT] }
        ],
        actions: [
          { type: 'assign_to_team', value: 'technical' },
          { type: 'add_tag', value: 'technical' }
        ],
        priority: 2,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'enterprise_priority',
        name: 'Enterprise Customer Priority',
        conditions: [
          { field: 'customer_tier', operator: 'equals', value: 'enterprise' }
        ],
        actions: [
          { type: 'set_priority', value: TicketPriority.HIGH },
          { type: 'assign_to_team', value: 'enterprise_support' }
        ],
        priority: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    this.escalationRules = [
      {
        id: 'sla_breach_escalation',
        name: 'SLA Breach Escalation',
        trigger: {
          type: 'sla_breach',
          condition: 'first_response_overdue',
          threshold: 60 // minutes
        },
        actions: [
          { type: 'assign_to_manager', target: 'support_manager' },
          { type: 'increase_priority', target: 'next_level' },
          { type: 'notify_team', target: 'management' }
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'enterprise_escalation',
        name: 'Enterprise Customer Escalation',
        trigger: {
          type: 'customer_tier',
          condition: 'enterprise',
          threshold: 30 // minutes without response
        },
        actions: [
          { type: 'notify_team', target: 'enterprise_success' },
          { type: 'assign_to_manager', target: 'enterprise_manager' }
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    this.logger.log(`Initialized ${this.assignmentRules.length} assignment rules and ${this.escalationRules.length} escalation rules`);
  }

  private initializeSampleTickets(): void {
    const sampleTickets: Partial<SupportTicket>[] = [
      {
        subject: 'Unable to access premium templates',
        description: 'I purchased the foundation tier but cannot access the premium prompt templates mentioned in the documentation.',
        type: TicketType.TECHNICAL_ISSUE,
        priority: TicketPriority.MEDIUM,
        source: TicketSource.EMAIL,
        customer: {
          id: 'cust_001',
          name: 'John Smith',
          email: 'john.smith@techcorp.com',
          company: 'TechCorp',
          tier: 'foundation',
          accountValue: 24.95,
          totalTickets: 1,
          satisfactionScore: 4.5,
          lastInteraction: new Date(),
          timezone: 'UTC-8',
          preferredLanguage: 'en'
        }
      },
      {
        subject: 'Billing inquiry about subscription renewal',
        description: 'I need clarification on when my subscription will renew and the pricing for the advanced tier.',
        type: TicketType.BILLING_INQUIRY,
        priority: TicketPriority.LOW,
        source: TicketSource.WEB_FORM,
        customer: {
          id: 'cust_002',
          name: 'Sarah Johnson',
          email: 'sarah@designstudio.com',
          company: 'Design Studio',
          tier: 'foundation',
          accountValue: 24.95,
          totalTickets: 3,
          satisfactionScore: 4.2,
          lastInteraction: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          timezone: 'UTC-5',
          preferredLanguage: 'en'
        }
      },
      {
        subject: 'Feature request: AI code review integration',
        description: 'Would love to see integration with popular code review tools like GitHub PR reviews.',
        type: TicketType.FEATURE_REQUEST,
        priority: TicketPriority.LOW,
        source: TicketSource.WEB_FORM,
        customer: {
          id: 'cust_003',
          name: 'Mike Chen',
          email: 'mike.chen@enterprise.com',
          company: 'Enterprise Solutions',
          tier: 'enterprise',
          accountValue: 999.99,
          totalTickets: 5,
          satisfactionScore: 4.8,
          lastInteraction: new Date(Date.now() - 12 * 60 * 60 * 1000),
          timezone: 'UTC+8',
          preferredLanguage: 'en'
        }
      }
    ];

    sampleTickets.forEach(ticketData => {
      this.createTicket(ticketData);
    });

    this.logger.log(`Initialized ${this.tickets.length} sample support tickets`);
  }

  async createTicket(ticketData: Partial<SupportTicket>): Promise<string> {
    const ticketNumber = `TKT-${String(this.ticketCounter++).padStart(6, '0')}`;
    
    const ticket: SupportTicket = {
      id: `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      ticketNumber,
      subject: ticketData.subject || 'No subject',
      description: ticketData.description || '',
      status: TicketStatus.NEW,
      priority: ticketData.priority || TicketPriority.MEDIUM,
      type: ticketData.type || TicketType.GENERAL_INQUIRY,
      source: ticketData.source || TicketSource.WEB_FORM,
      customer: ticketData.customer!,
      tags: ticketData.tags || [],
      attachments: ticketData.attachments || [],
      interactions: [],
      sla: this.calculateSLA(ticketData.priority || TicketPriority.MEDIUM, ticketData.customer!.tier),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Apply auto-assignment rules
    await this.applyAssignmentRules(ticket);

    // Add initial system interaction
    this.addInteraction(ticket.id, {
      type: 'comment',
      content: `Ticket ${ticketNumber} created via ${ticket.source}`,
      author: 'system',
      authorType: 'system',
      isPublic: false,
      attachments: []
    });

    this.tickets.push(ticket);
    
    // Set status to OPEN after creation
    await this.updateTicketStatus(ticket.id, TicketStatus.OPEN);

    this.logger.log(`Support ticket created: ${ticketNumber} for customer ${ticket.customer.email}`);
    return ticket.id;
  }

  private calculateSLA(priority: TicketPriority, customerTier: string): SLATracking {
    const now = new Date();
    let firstResponseMinutes: number;
    let resolutionHours: number;
    let slaLevel: 'standard' | 'premium' | 'enterprise';

    // Define SLA based on customer tier and priority
    switch (customerTier) {
      case 'enterprise':
        slaLevel = 'enterprise';
        firstResponseMinutes = priority === TicketPriority.CRITICAL ? 15 : 30;
        resolutionHours = priority === TicketPriority.CRITICAL ? 4 : 8;
        break;
      case 'advanced':
        slaLevel = 'premium';
        firstResponseMinutes = priority === TicketPriority.CRITICAL ? 30 : 60;
        resolutionHours = priority === TicketPriority.CRITICAL ? 8 : 24;
        break;
      default:
        slaLevel = 'standard';
        firstResponseMinutes = priority === TicketPriority.CRITICAL ? 60 : 120;
        resolutionHours = priority === TicketPriority.CRITICAL ? 24 : 48;
    }

    // Adjust for priority
    if (priority === TicketPriority.URGENT) {
      firstResponseMinutes = Math.floor(firstResponseMinutes * 0.5);
      resolutionHours = Math.floor(resolutionHours * 0.5);
    } else if (priority === TicketPriority.LOW) {
      firstResponseMinutes = firstResponseMinutes * 2;
      resolutionHours = resolutionHours * 2;
    }

    const firstResponseDue = new Date(now.getTime() + firstResponseMinutes * 60 * 1000);
    const resolutionDue = new Date(now.getTime() + resolutionHours * 60 * 60 * 1000);
    const escalationThreshold = new Date(firstResponseDue.getTime() + 30 * 60 * 1000); // 30 min after first response due

    return {
      firstResponseDue,
      resolutionDue,
      isFirstResponseOverdue: false,
      isResolutionOverdue: false,
      escalationThreshold,
      breachedSLA: false,
      slaLevel
    };
  }

  private async applyAssignmentRules(ticket: SupportTicket): Promise<void> {
    const applicableRules = this.assignmentRules
      .filter(rule => rule.isActive)
      .sort((a, b) => a.priority - b.priority);

    for (const rule of applicableRules) {
      const conditionsMet = rule.conditions.every(condition => 
        this.evaluateAssignmentCondition(condition, ticket)
      );

      if (conditionsMet) {
        for (const action of rule.actions) {
          await this.executeAssignmentAction(action, ticket);
        }
        break; // Only apply the first matching rule
      }
    }
  }

  private evaluateAssignmentCondition(condition: AssignmentCondition, ticket: SupportTicket): boolean {
    let fieldValue: any;

    switch (condition.field) {
      case 'type':
        fieldValue = ticket.type;
        break;
      case 'priority':
        fieldValue = ticket.priority;
        break;
      case 'source':
        fieldValue = ticket.source;
        break;
      case 'customer_tier':
        fieldValue = ticket.customer.tier;
        break;
      case 'subject_contains':
        fieldValue = ticket.subject.toLowerCase();
        break;
      case 'time_of_day':
        fieldValue = new Date().getHours();
        break;
      default:
        return false;
    }

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'contains':
        return typeof fieldValue === 'string' && fieldValue.includes(condition.value.toLowerCase());
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'greater_than':
        return fieldValue > condition.value;
      case 'less_than':
        return fieldValue < condition.value;
      default:
        return false;
    }
  }

  private async executeAssignmentAction(action: AssignmentAction, ticket: SupportTicket): Promise<void> {
    switch (action.type) {
      case 'assign_to_agent':
        ticket.assignedTo = action.value;
        break;
      case 'assign_to_team':
        ticket.assignedTeam = action.value;
        break;
      case 'set_priority':
        ticket.priority = action.value;
        // Recalculate SLA based on new priority
        ticket.sla = this.calculateSLA(ticket.priority, ticket.customer.tier);
        break;
      case 'add_tag':
        if (!ticket.tags.includes(action.value)) {
          ticket.tags.push(action.value);
        }
        break;
      case 'send_notification':
        // In production, this would send actual notifications
        this.logger.log(`Notification sent for ticket ${ticket.ticketNumber}: ${action.value}`);
        break;
    }

    ticket.updatedAt = new Date();
  }

  async updateTicketStatus(ticketId: string, newStatus: TicketStatus, agentId?: string): Promise<boolean> {
    const ticket = this.tickets.find(t => t.id === ticketId);
    
    if (!ticket) {
      return false;
    }

    const oldStatus = ticket.status;
    ticket.status = newStatus;
    ticket.updatedAt = new Date();

    // Update timestamps based on status
    if (newStatus === TicketStatus.RESOLVED && !ticket.resolvedAt) {
      ticket.resolvedAt = new Date();
      if (ticket.sla.firstResponseTime) {
        ticket.sla.resolutionTime = Math.floor(
          (ticket.resolvedAt.getTime() - ticket.createdAt.getTime()) / (1000 * 60)
        );
      }
    } else if (newStatus === TicketStatus.CLOSED && !ticket.closedAt) {
      ticket.closedAt = new Date();
    }

    // Add status change interaction
    this.addInteraction(ticketId, {
      type: 'status_change',
      content: `Status changed from ${oldStatus} to ${newStatus}`,
      author: agentId || 'system',
      authorType: agentId ? 'agent' : 'system',
      isPublic: false,
      attachments: []
    });

    this.logger.log(`Ticket ${ticket.ticketNumber} status updated: ${oldStatus} -> ${newStatus}`);
    return true;
  }

  async assignTicket(ticketId: string, agentId?: string, teamId?: string): Promise<boolean> {
    const ticket = this.tickets.find(t => t.id === ticketId);
    
    if (!ticket) {
      return false;
    }

    ticket.assignedTo = agentId;
    ticket.assignedTeam = teamId;
    ticket.updatedAt = new Date();

    const assignmentTarget = agentId || teamId || 'unassigned';
    this.addInteraction(ticketId, {
      type: 'assignment',
      content: `Ticket assigned to ${assignmentTarget}`,
      author: 'system',
      authorType: 'system',
      isPublic: false,
      attachments: []
    });

    this.logger.log(`Ticket ${ticket.ticketNumber} assigned to ${assignmentTarget}`);
    return true;
  }

  addInteraction(ticketId: string, interaction: Omit<TicketInteraction, 'id' | 'createdAt'>): string {
    const ticket = this.tickets.find(t => t.id === ticketId);
    
    if (!ticket) {
      throw new Error(`Ticket not found: ${ticketId}`);
    }

    const newInteraction: TicketInteraction = {
      id: `interaction_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      ...interaction,
      createdAt: new Date()
    };

    ticket.interactions.push(newInteraction);
    ticket.updatedAt = new Date();

    // Update first response time if this is the first agent response
    if (interaction.authorType === 'agent' && !ticket.firstResponseAt) {
      ticket.firstResponseAt = new Date();
      ticket.sla.firstResponseTime = Math.floor(
        (ticket.firstResponseAt.getTime() - ticket.createdAt.getTime()) / (1000 * 60)
      );
    }

    this.logger.log(`Interaction added to ticket ${ticket.ticketNumber} by ${interaction.author}`);
    return newInteraction.id;
  }

  async escalateTicket(ticketId: string, reason: string, escalatedTo: string): Promise<boolean> {
    const ticket = this.tickets.find(t => t.id === ticketId);
    
    if (!ticket) {
      return false;
    }

    ticket.status = TicketStatus.ESCALATED;
    ticket.escalatedAt = new Date();
    ticket.updatedAt = new Date();

    // Increase priority if not already at highest
    if (ticket.priority !== TicketPriority.CRITICAL) {
      const priorities = [TicketPriority.LOW, TicketPriority.MEDIUM, TicketPriority.HIGH, TicketPriority.URGENT, TicketPriority.CRITICAL];
      const currentIndex = priorities.indexOf(ticket.priority);
      if (currentIndex < priorities.length - 1) {
        ticket.priority = priorities[currentIndex + 1];
      }
    }

    this.addInteraction(ticketId, {
      type: 'escalation',
      content: `Ticket escalated to ${escalatedTo}. Reason: ${reason}`,
      author: 'system',
      authorType: 'system',
      isPublic: false,
      attachments: []
    });

    this.logger.log(`Ticket ${ticket.ticketNumber} escalated to ${escalatedTo}: ${reason}`);
    return true;
  }

  async resolveTicket(
    ticketId: string, 
    resolution: Omit<TicketResolution, 'timeToResolution'>, 
    agentId: string
  ): Promise<boolean> {
    const ticket = this.tickets.find(t => t.id === ticketId);
    
    if (!ticket) {
      return false;
    }

    const timeToResolution = Math.floor(
      (new Date().getTime() - ticket.createdAt.getTime()) / (1000 * 60)
    );

    ticket.resolution = {
      ...resolution,
      timeToResolution
    };

    await this.updateTicketStatus(ticketId, TicketStatus.RESOLVED, agentId);

    this.addInteraction(ticketId, {
      type: 'resolution',
      content: `Ticket resolved: ${resolution.description}`,
      author: agentId,
      authorType: 'agent',
      isPublic: true,
      attachments: []
    });

    // Send satisfaction survey
    await this.sendSatisfactionSurvey(ticketId);

    this.logger.log(`Ticket ${ticket.ticketNumber} resolved by ${agentId}`);
    return true;
  }

  private async sendSatisfactionSurvey(ticketId: string): Promise<void> {
    // In production, this would send an actual survey
    this.logger.log(`Satisfaction survey sent for ticket ${ticketId}`);
  }

  async recordSatisfaction(
    ticketId: string, 
    satisfaction: Omit<CustomerSatisfaction, 'surveyedAt'>
  ): Promise<boolean> {
    const ticket = this.tickets.find(t => t.id === ticketId);
    
    if (!ticket) {
      return false;
    }

    ticket.satisfaction = {
      ...satisfaction,
      surveyedAt: new Date()
    };

    ticket.updatedAt = new Date();

    this.logger.log(`Customer satisfaction recorded for ticket ${ticket.ticketNumber}: ${satisfaction.rating}/5`);
    return true;
  }

  async getTickets(filters?: TicketFilters): Promise<SupportTicket[]> {
    let filteredTickets = [...this.tickets];

    if (filters) {
      if (filters.status && filters.status.length > 0) {
        filteredTickets = filteredTickets.filter(t => filters.status!.includes(t.status));
      }

      if (filters.priority && filters.priority.length > 0) {
        filteredTickets = filteredTickets.filter(t => filters.priority!.includes(t.priority));
      }

      if (filters.type && filters.type.length > 0) {
        filteredTickets = filteredTickets.filter(t => filters.type!.includes(t.type));
      }

      if (filters.assignedTo) {
        filteredTickets = filteredTickets.filter(t => t.assignedTo === filters.assignedTo);
      }

      if (filters.assignedTeam) {
        filteredTickets = filteredTickets.filter(t => t.assignedTeam === filters.assignedTeam);
      }

      if (filters.customer) {
        filteredTickets = filteredTickets.filter(t => 
          t.customer.id === filters.customer || 
          t.customer.email.toLowerCase().includes(filters.customer!.toLowerCase())
        );
      }

      if (filters.dateRange) {
        filteredTickets = filteredTickets.filter(t => 
          t.createdAt >= filters.dateRange!.start && 
          t.createdAt <= filters.dateRange!.end
        );
      }

      if (filters.tags && filters.tags.length > 0) {
        filteredTickets = filteredTickets.filter(t => 
          filters.tags!.some(tag => t.tags.includes(tag))
        );
      }

      if (filters.slaBreached) {
        filteredTickets = filteredTickets.filter(t => t.sla.breachedSLA);
      }

      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filteredTickets = filteredTickets.filter(t => 
          t.subject.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.ticketNumber.toLowerCase().includes(query) ||
          t.customer.name.toLowerCase().includes(query) ||
          t.customer.email.toLowerCase().includes(query)
        );
      }
    }

    return filteredTickets.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async getTicketById(ticketId: string): Promise<SupportTicket | null> {
    return this.tickets.find(t => t.id === ticketId) || null;
  }

  async getTicketByNumber(ticketNumber: string): Promise<SupportTicket | null> {
    return this.tickets.find(t => t.ticketNumber === ticketNumber) || null;
  }

  async getTicketMetrics(): Promise<TicketMetrics> {
    const totalTickets = this.tickets.length;
    const openTickets = this.tickets.filter(t => 
      [TicketStatus.NEW, TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.ESCALATED].includes(t.status)
    ).length;

    const resolvedTickets = this.tickets.filter(t => t.resolvedAt);
    const responseTimes = this.tickets.filter(t => t.sla.firstResponseTime).map(t => t.sla.firstResponseTime!);
    const resolutionTimes = resolvedTickets.filter(t => t.resolution?.timeToResolution).map(t => t.resolution!.timeToResolution);

    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    const avgResolutionTime = resolutionTimes.length > 0
      ? resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length
      : 0;

    const firstCallResolutions = resolvedTickets.filter(t => t.resolution?.firstCallResolution).length;
    const firstCallResolutionRate = resolvedTickets.length > 0 
      ? (firstCallResolutions / resolvedTickets.length) * 100 
      : 0;

    const satisfactionScores = this.tickets.filter(t => t.satisfaction?.rating).map(t => t.satisfaction!.rating);
    const customerSatisfactionScore = satisfactionScores.length > 0
      ? satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length
      : 0;

    const slaCompliantTickets = this.tickets.filter(t => !t.sla.breachedSLA).length;
    const slaComplianceRate = totalTickets > 0 ? (slaCompliantTickets / totalTickets) * 100 : 0;

    const escalatedTickets = this.tickets.filter(t => t.escalatedAt).length;
    const escalationRate = totalTickets > 0 ? (escalatedTickets / totalTickets) * 100 : 0;

    // Aggregate by priority, type, and source
    const ticketsByPriority = Object.values(TicketPriority).reduce((acc, priority) => {
      acc[priority] = this.tickets.filter(t => t.priority === priority).length;
      return acc;
    }, {} as Record<TicketPriority, number>);

    const ticketsByType = Object.values(TicketType).reduce((acc, type) => {
      acc[type] = this.tickets.filter(t => t.type === type).length;
      return acc;
    }, {} as Record<TicketType, number>);

    const ticketsBySource = Object.values(TicketSource).reduce((acc, source) => {
      acc[source] = this.tickets.filter(t => t.source === source).length;
      return acc;
    }, {} as Record<TicketSource, number>);

    return {
      totalTickets,
      openTickets,
      avgResponseTime,
      avgResolutionTime,
      firstCallResolutionRate,
      customerSatisfactionScore,
      slaComplianceRate,
      escalationRate,
      ticketsByPriority,
      ticketsByType,
      ticketsBySource,
      agentPerformance: [], // Would be calculated from actual agent data
      trendsData: this.generateTrendData()
    };
  }

  private generateTrendData(): TicketTrend[] {
    const trends: TicketTrend[] = [];
    const days = 30;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const dayStart = new Date(date);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const dayTickets = this.tickets.filter(t => 
        t.createdAt >= dayStart && t.createdAt <= dayEnd
      );

      const resolvedTickets = this.tickets.filter(t => 
        t.resolvedAt && t.resolvedAt >= dayStart && t.resolvedAt <= dayEnd
      );

      const responseTimes = dayTickets.filter(t => t.sla.firstResponseTime).map(t => t.sla.firstResponseTime!);
      const avgResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
        : 0;

      const satisfactionScores = dayTickets.filter(t => t.satisfaction?.rating).map(t => t.satisfaction!.rating);
      const satisfactionScore = satisfactionScores.length > 0
        ? satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length
        : 0;

      trends.push({
        date,
        newTickets: dayTickets.length,
        resolvedTickets: resolvedTickets.length,
        avgResponseTime,
        satisfactionScore
      });
    }

    return trends;
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  private async checkSLACompliance(): Promise<void> {
    const now = new Date();

    for (const ticket of this.tickets) {
      if (ticket.status === TicketStatus.CLOSED || ticket.status === TicketStatus.RESOLVED) {
        continue;
      }

      // Check first response SLA
      if (!ticket.firstResponseAt && now > ticket.sla.firstResponseDue) {
        ticket.sla.isFirstResponseOverdue = true;
        ticket.sla.breachedSLA = true;
        
        // Check for escalation
        if (now > ticket.sla.escalationThreshold) {
          await this.checkEscalationRules(ticket);
        }
      }

      // Check resolution SLA
      if (!ticket.resolvedAt && now > ticket.sla.resolutionDue) {
        ticket.sla.isResolutionOverdue = true;
        ticket.sla.breachedSLA = true;
      }
    }
  }

  private async checkEscalationRules(ticket: SupportTicket): Promise<void> {
    for (const rule of this.escalationRules.filter(r => r.isActive)) {
      const shouldEscalate = this.evaluateEscalationTrigger(rule.trigger, ticket);
      
      if (shouldEscalate) {
        await this.executeEscalationActions(rule.actions, ticket);
        break; // Only apply first matching rule
      }
    }
  }

  private evaluateEscalationTrigger(trigger: EscalationTrigger, ticket: SupportTicket): boolean {
    const now = new Date();
    
    switch (trigger.type) {
      case 'sla_breach':
        return ticket.sla.breachedSLA;
      case 'customer_tier':
        return ticket.customer.tier === trigger.condition;
      case 'priority_level':
        const priorities = [TicketPriority.LOW, TicketPriority.MEDIUM, TicketPriority.HIGH, TicketPriority.URGENT, TicketPriority.CRITICAL];
        return priorities.indexOf(ticket.priority) >= priorities.indexOf(trigger.condition);
      case 'time_since_update':
        const timeSinceUpdate = (now.getTime() - ticket.updatedAt.getTime()) / (1000 * 60); // minutes
        return timeSinceUpdate > trigger.threshold;
      case 'interaction_count':
        return ticket.interactions.length >= trigger.threshold;
      default:
        return false;
    }
  }

  private async executeEscalationActions(actions: EscalationAction[], ticket: SupportTicket): Promise<void> {
    for (const action of actions) {
      switch (action.type) {
        case 'assign_to_manager':
          await this.assignTicket(ticket.id, action.target);
          break;
        case 'increase_priority':
          const priorities = [TicketPriority.LOW, TicketPriority.MEDIUM, TicketPriority.HIGH, TicketPriority.URGENT, TicketPriority.CRITICAL];
          const currentIndex = priorities.indexOf(ticket.priority);
          if (currentIndex < priorities.length - 1) {
            ticket.priority = priorities[currentIndex + 1];
          }
          break;
        case 'notify_team':
          this.logger.log(`Escalation notification sent to ${action.target} for ticket ${ticket.ticketNumber}`);
          break;
        case 'add_to_escalation_queue':
          ticket.tags.push('escalated');
          break;
      }
    }

    await this.escalateTicket(ticket.id, 'Automatic escalation due to SLA breach', 'system');
  }
}