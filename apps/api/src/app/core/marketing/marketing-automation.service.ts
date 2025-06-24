import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  trigger: WorkflowTrigger;
  actions: WorkflowAction[];
  conditions: WorkflowCondition[];
  settings: WorkflowSettings;
  analytics: WorkflowAnalytics;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface WorkflowTrigger {
  type: 'lead_created' | 'email_opened' | 'email_clicked' | 'page_visited' | 'form_submitted' | 'purchase_made' | 'time_based' | 'score_threshold' | 'tag_added';
  configuration: TriggerConfiguration;
}

export interface TriggerConfiguration {
  // For page_visited
  pageUrl?: string;
  
  // For email triggers
  emailCampaignId?: string;
  
  // For form_submitted
  formId?: string;
  
  // For time_based
  delay?: number; // minutes
  schedule?: string; // cron expression
  
  // For score_threshold
  scoreThreshold?: number;
  
  // For tag_added
  tagName?: string;
  
  // General filters
  filters?: WorkflowFilter[];
}

export interface WorkflowFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'not_in';
  value: any;
}

export interface WorkflowAction {
  id: string;
  type: 'send_email' | 'add_tag' | 'remove_tag' | 'update_field' | 'assign_lead' | 'create_task' | 'webhook' | 'wait' | 'split_test';
  configuration: ActionConfiguration;
  order: number;
  isActive: boolean;
}

export interface ActionConfiguration {
  // For send_email
  emailTemplateId?: string;
  emailSubject?: string;
  personalization?: Record<string, string>;
  
  // For tag actions
  tagName?: string;
  
  // For update_field
  fieldName?: string;
  fieldValue?: any;
  
  // For assign_lead
  assigneeId?: string;
  
  // For create_task
  taskTitle?: string;
  taskDescription?: string;
  taskDueDate?: Date;
  
  // For webhook
  webhookUrl?: string;
  webhookMethod?: 'GET' | 'POST' | 'PUT';
  webhookHeaders?: Record<string, string>;
  webhookPayload?: any;
  
  // For wait
  waitDuration?: number; // minutes
  
  // For split_test
  variants?: SplitTestVariant[];
}

export interface SplitTestVariant {
  id: string;
  name: string;
  percentage: number;
  actions: WorkflowAction[];
}

export interface WorkflowCondition {
  id: string;
  type: 'if' | 'unless';
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'exists' | 'in' | 'not_in';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface WorkflowSettings {
  maxExecutionsPerContact: number;
  cooldownPeriod: number; // hours
  timezone: string;
  sendTimeOptimization: boolean;
  respectUnsubscribe: boolean;
  respectFrequencyCap: boolean;
  enableLogging: boolean;
}

export interface WorkflowAnalytics {
  totalExecutions: number;
  activeParticipants: number;
  completedParticipants: number;
  conversionRate: number;
  averageTimeToComplete: number; // hours
  actionPerformance: ActionPerformance[];
  goalConversions: number;
  revenue: number;
  roi: number;
}

export interface ActionPerformance {
  actionId: string;
  actionType: string;
  executions: number;
  successes: number;
  failures: number;
  successRate: number;
  averageExecutionTime: number; // milliseconds
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  leadId: string;
  status: 'running' | 'completed' | 'failed' | 'paused' | 'cancelled';
  currentActionIndex: number;
  startedAt: Date;
  completedAt?: Date;
  lastExecutedAt: Date;
  executionData: Record<string, any>;
  errors: ExecutionError[];
}

export interface ExecutionError {
  actionId: string;
  actionType: string;
  timestamp: Date;
  errorMessage: string;
  retryCount: number;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  isActive: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AutomationTrigger {
  event: 'lead_score_change' | 'lead_stage_change' | 'inactivity_period' | 'engagement_spike' | 'cart_abandonment';
  threshold?: number;
  timeframe?: number; // hours
}

export interface AutomationCondition {
  field: string;
  operator: string;
  value: any;
}

export interface AutomationAction {
  type: 'start_workflow' | 'send_alert' | 'update_score' | 'change_stage' | 'assign_owner';
  configuration: any;
}

export interface PersonalizationEngine {
  getPersonalizedContent(leadId: string, templateId: string): Promise<string>;
  getPersonalizationVariables(leadId: string): Promise<Record<string, any>>;
  updatePersonalizationProfile(leadId: string, data: Record<string, any>): Promise<void>;
}

@Injectable()
export class MarketingAutomationService implements PersonalizationEngine {
  private readonly logger = new Logger(MarketingAutomationService.name);
  private workflows: AutomationWorkflow[] = [];
  private executions: WorkflowExecution[] = [];
  private automationRules: AutomationRule[] = [];
  private executionQueue: { workflowId: string; leadId: string; triggerData: any }[] = [];

  constructor(private configService: ConfigService) {
    this.initializeDefaultWorkflows();
    this.initializeAutomationRules();
  }

  private initializeDefaultWorkflows(): void {
    this.workflows = [
      {
        id: 'welcome_series',
        name: 'Welcome Email Series',
        description: 'Automated welcome sequence for new foundation tier customers',
        isActive: true,
        trigger: {
          type: 'purchase_made',
          configuration: {
            filters: [
              { field: 'product.tier', operator: 'equals', value: 'foundation' }
            ]
          }
        },
        actions: [
          {
            id: 'welcome_email_1',
            type: 'send_email',
            configuration: {
              emailTemplateId: 'welcome_series_1',
              personalization: {
                'firstName': '{{lead.firstName}}',
                'purchaseDate': '{{purchase.date}}',
                'loginUrl': '{{system.loginUrl}}'
              }
            },
            order: 1,
            isActive: true
          },
          {
            id: 'wait_3_days',
            type: 'wait',
            configuration: {
              waitDuration: 4320 // 3 days in minutes
            },
            order: 2,
            isActive: true
          },
          {
            id: 'onboarding_email',
            type: 'send_email',
            configuration: {
              emailTemplateId: 'onboarding_tips',
              personalization: {
                'firstName': '{{lead.firstName}}',
                'progressUrl': '{{system.progressUrl}}'
              }
            },
            order: 3,
            isActive: true
          },
          {
            id: 'add_onboarded_tag',
            type: 'add_tag',
            configuration: {
              tagName: 'onboarded'
            },
            order: 4,
            isActive: true
          }
        ],
        conditions: [],
        settings: {
          maxExecutionsPerContact: 1,
          cooldownPeriod: 168, // 7 days
          timezone: 'UTC',
          sendTimeOptimization: true,
          respectUnsubscribe: true,
          respectFrequencyCap: true,
          enableLogging: true
        },
        analytics: {
          totalExecutions: 0,
          activeParticipants: 0,
          completedParticipants: 0,
          conversionRate: 0,
          averageTimeToComplete: 0,
          actionPerformance: [],
          goalConversions: 0,
          revenue: 0,
          roi: 0
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      },
      {
        id: 'cart_abandonment_sequence',
        name: 'Cart Abandonment Recovery',
        description: 'Automated sequence to recover abandoned carts',
        isActive: true,
        trigger: {
          type: 'time_based',
          configuration: {
            delay: 60, // 1 hour
            filters: [
              { field: 'cart.status', operator: 'equals', value: 'abandoned' }
            ]
          }
        },
        actions: [
          {
            id: 'abandonment_email_1',
            type: 'send_email',
            configuration: {
              emailTemplateId: 'cart_abandonment',
              personalization: {
                'firstName': '{{lead.firstName}}',
                'cartValue': '{{cart.total}}',
                'checkoutUrl': '{{cart.checkoutUrl}}'
              }
            },
            order: 1,
            isActive: true
          },
          {
            id: 'wait_24_hours',
            type: 'wait',
            configuration: {
              waitDuration: 1440 // 24 hours
            },
            order: 2,
            isActive: true
          },
          {
            id: 'abandonment_email_2',
            type: 'send_email',
            configuration: {
              emailTemplateId: 'cart_abandonment_discount',
              personalization: {
                'firstName': '{{lead.firstName}}',
                'discountCode': '{{system.generateDiscountCode}}',
                'checkoutUrl': '{{cart.checkoutUrl}}'
              }
            },
            order: 3,
            isActive: true
          }
        ],
        conditions: [
          {
            id: 'cart_still_abandoned',
            type: 'if',
            field: 'cart.status',
            operator: 'equals',
            value: 'abandoned'
          }
        ],
        settings: {
          maxExecutionsPerContact: 3,
          cooldownPeriod: 72, // 3 days
          timezone: 'UTC',
          sendTimeOptimization: true,
          respectUnsubscribe: true,
          respectFrequencyCap: true,
          enableLogging: true
        },
        analytics: {
          totalExecutions: 0,
          activeParticipants: 0,
          completedParticipants: 0,
          conversionRate: 0,
          averageTimeToComplete: 0,
          actionPerformance: [],
          goalConversions: 0,
          revenue: 0,
          roi: 0
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      },
      {
        id: 'lead_nurturing',
        name: 'Lead Nurturing Campaign',
        description: 'Nurture qualified leads with educational content',
        isActive: true,
        trigger: {
          type: 'score_threshold',
          configuration: {
            scoreThreshold: 50,
            filters: [
              { field: 'status', operator: 'not_equals', value: 'customer' }
            ]
          }
        },
        actions: [
          {
            id: 'nurture_email_1',
            type: 'send_email',
            configuration: {
              emailTemplateId: 'nurture_content_1'
            },
            order: 1,
            isActive: true
          },
          {
            id: 'wait_1_week',
            type: 'wait',
            configuration: {
              waitDuration: 10080 // 1 week
            },
            order: 2,
            isActive: true
          },
          {
            id: 'nurture_email_2',
            type: 'send_email',
            configuration: {
              emailTemplateId: 'nurture_content_2'
            },
            order: 3,
            isActive: true
          }
        ],
        conditions: [
          {
            id: 'lead_still_qualified',
            type: 'if',
            field: 'score',
            operator: 'greater_than',
            value: 40
          }
        ],
        settings: {
          maxExecutionsPerContact: 1,
          cooldownPeriod: 336, // 2 weeks
          timezone: 'UTC',
          sendTimeOptimization: true,
          respectUnsubscribe: true,
          respectFrequencyCap: true,
          enableLogging: true
        },
        analytics: {
          totalExecutions: 0,
          activeParticipants: 0,
          completedParticipants: 0,
          conversionRate: 0,
          averageTimeToComplete: 0,
          actionPerformance: [],
          goalConversions: 0,
          revenue: 0,
          roi: 0
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      }
    ];

    this.logger.log(`Initialized ${this.workflows.length} default automation workflows`);
  }

  private initializeAutomationRules(): void {
    this.automationRules = [
      {
        id: 'high_score_alert',
        name: 'High Score Lead Alert',
        description: 'Alert sales team when lead reaches high score',
        trigger: {
          event: 'lead_score_change',
          threshold: 80
        },
        conditions: [
          { field: 'score', operator: 'greater_than', value: 80 },
          { field: 'status', operator: 'not_equals', value: 'contacted' }
        ],
        actions: [
          {
            type: 'send_alert',
            configuration: {
              alertType: 'sales_notification',
              message: 'High-value lead requires immediate attention'
            }
          },
          {
            type: 'assign_owner',
            configuration: {
              ownerId: 'sales_team'
            }
          }
        ],
        isActive: true,
        priority: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'inactivity_reengagement',
        name: 'Inactivity Re-engagement',
        description: 'Re-engage leads who have been inactive for 30 days',
        trigger: {
          event: 'inactivity_period',
          timeframe: 720 // 30 days in hours
        },
        conditions: [
          { field: 'lastActivityAt', operator: 'less_than', value: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          { field: 'status', operator: 'not_equals', value: 'unsubscribed' }
        ],
        actions: [
          {
            type: 'start_workflow',
            configuration: {
              workflowId: 'reengagement_campaign'
            }
          }
        ],
        isActive: true,
        priority: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    this.logger.log(`Initialized ${this.automationRules.length} automation rules`);
  }

  async createWorkflow(workflow: Omit<AutomationWorkflow, 'id' | 'analytics' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const newWorkflow: AutomationWorkflow = {
      id: `workflow_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      ...workflow,
      analytics: {
        totalExecutions: 0,
        activeParticipants: 0,
        completedParticipants: 0,
        conversionRate: 0,
        averageTimeToComplete: 0,
        actionPerformance: [],
        goalConversions: 0,
        revenue: 0,
        roi: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.workflows.push(newWorkflow);
    this.logger.log(`Automation workflow created: ${newWorkflow.id}`);
    
    return newWorkflow.id;
  }

  async triggerWorkflow(workflowId: string, leadId: string, triggerData: any = {}): Promise<string> {
    const workflow = this.workflows.find(w => w.id === workflowId);
    
    if (!workflow || !workflow.isActive) {
      throw new Error(`Workflow not found or inactive: ${workflowId}`);
    }

    // Check if lead has already reached max executions
    const existingExecutions = this.executions.filter(
      e => e.workflowId === workflowId && e.leadId === leadId
    );

    if (existingExecutions.length >= workflow.settings.maxExecutionsPerContact) {
      this.logger.warn(`Lead ${leadId} has reached max executions for workflow ${workflowId}`);
      return '';
    }

    // Check cooldown period
    const lastExecution = existingExecutions
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())[0];

    if (lastExecution) {
      const cooldownEnd = new Date(lastExecution.startedAt.getTime() + (workflow.settings.cooldownPeriod * 60 * 60 * 1000));
      if (new Date() < cooldownEnd) {
        this.logger.warn(`Lead ${leadId} is in cooldown period for workflow ${workflowId}`);
        return '';
      }
    }

    const execution: WorkflowExecution = {
      id: `execution_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      workflowId,
      leadId,
      status: 'running',
      currentActionIndex: 0,
      startedAt: new Date(),
      lastExecutedAt: new Date(),
      executionData: { ...triggerData },
      errors: []
    };

    this.executions.push(execution);
    workflow.analytics.totalExecutions++;
    workflow.analytics.activeParticipants++;

    this.logger.log(`Workflow execution started: ${execution.id} for lead ${leadId}`);
    
    // Start executing the workflow
    await this.executeWorkflowActions(execution);
    
    return execution.id;
  }

  private async executeWorkflowActions(execution: WorkflowExecution): Promise<void> {
    const workflow = this.workflows.find(w => w.id === execution.workflowId);
    
    if (!workflow) {
      execution.status = 'failed';
      execution.errors.push({
        actionId: '',
        actionType: 'workflow',
        timestamp: new Date(),
        errorMessage: 'Workflow not found',
        retryCount: 0
      });
      return;
    }

    try {
      while (execution.currentActionIndex < workflow.actions.length && execution.status === 'running') {
        const action = workflow.actions[execution.currentActionIndex];
        
        if (!action.isActive) {
          execution.currentActionIndex++;
          continue;
        }

        // Check conditions before executing action
        if (workflow.conditions.length > 0) {
          const conditionsMet = await this.evaluateConditions(workflow.conditions, execution.leadId);
          if (!conditionsMet) {
            this.logger.log(`Conditions not met for workflow ${workflow.id}, stopping execution`);
            execution.status = 'completed';
            break;
          }
        }

        await this.executeAction(action, execution);
        
        // If action is a wait, schedule continuation
        if (action.type === 'wait') {
          await this.scheduleWorkflowContinuation(execution, action.configuration.waitDuration!);
          return; // Exit for now, will continue later
        }

        execution.currentActionIndex++;
        execution.lastExecutedAt = new Date();
      }

      if (execution.currentActionIndex >= workflow.actions.length) {
        execution.status = 'completed';
        execution.completedAt = new Date();
        workflow.analytics.activeParticipants--;
        workflow.analytics.completedParticipants++;
        
        // Calculate average time to complete
        const executionTime = (execution.completedAt.getTime() - execution.startedAt.getTime()) / (1000 * 60 * 60); // hours
        workflow.analytics.averageTimeToComplete = 
          (workflow.analytics.averageTimeToComplete * (workflow.analytics.completedParticipants - 1) + executionTime) / 
          workflow.analytics.completedParticipants;
      }

    } catch (error) {
      execution.status = 'failed';
      execution.errors.push({
        actionId: workflow.actions[execution.currentActionIndex]?.id || '',
        actionType: workflow.actions[execution.currentActionIndex]?.type || '',
        timestamp: new Date(),
        errorMessage: error.message,
        retryCount: 0
      });
      
      workflow.analytics.activeParticipants--;
      this.logger.error(`Workflow execution failed: ${execution.id}`, error);
    }
  }

  private async executeAction(action: WorkflowAction, execution: WorkflowExecution): Promise<void> {
    const startTime = Date.now();
    
    try {
      switch (action.type) {
        case 'send_email':
          await this.executeSendEmailAction(action, execution);
          break;
        
        case 'add_tag':
          await this.executeAddTagAction(action, execution);
          break;
        
        case 'remove_tag':
          await this.executeRemoveTagAction(action, execution);
          break;
        
        case 'update_field':
          await this.executeUpdateFieldAction(action, execution);
          break;
        
        case 'assign_lead':
          await this.executeAssignLeadAction(action, execution);
          break;
        
        case 'create_task':
          await this.executeCreateTaskAction(action, execution);
          break;
        
        case 'webhook':
          await this.executeWebhookAction(action, execution);
          break;
        
        case 'wait':
          // Wait actions are handled in the main execution loop
          break;
        
        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }

      // Update action performance
      this.updateActionPerformance(execution.workflowId, action, startTime, true);
      
    } catch (error) {
      this.updateActionPerformance(execution.workflowId, action, startTime, false);
      throw error;
    }
  }

  private async executeSendEmailAction(action: WorkflowAction, execution: WorkflowExecution): Promise<void> {
    const { emailTemplateId, emailSubject, personalization } = action.configuration;
    
    // Get personalized content
    const personalizedContent = await this.getPersonalizedContent(execution.leadId, emailTemplateId!);
    const personalizedSubject = await this.personalizeText(emailSubject || '', execution.leadId);
    
    // In production, this would integrate with email service
    this.logger.log(`Sending automated email to lead ${execution.leadId}: ${personalizedSubject}`);
    
    // Simulate email sending
    execution.executionData[`email_${action.id}_sent`] = true;
    execution.executionData[`email_${action.id}_timestamp`] = new Date();
  }

  private async executeAddTagAction(action: WorkflowAction, execution: WorkflowExecution): Promise<void> {
    const { tagName } = action.configuration;
    
    // In production, this would update the lead record in database
    this.logger.log(`Adding tag '${tagName}' to lead ${execution.leadId}`);
    
    execution.executionData[`tag_${tagName}_added`] = true;
  }

  private async executeRemoveTagAction(action: WorkflowAction, execution: WorkflowExecution): Promise<void> {
    const { tagName } = action.configuration;
    
    // In production, this would update the lead record in database
    this.logger.log(`Removing tag '${tagName}' from lead ${execution.leadId}`);
    
    execution.executionData[`tag_${tagName}_removed`] = true;
  }

  private async executeUpdateFieldAction(action: WorkflowAction, execution: WorkflowExecution): Promise<void> {
    const { fieldName, fieldValue } = action.configuration;
    
    // In production, this would update the lead record in database
    this.logger.log(`Updating field '${fieldName}' to '${fieldValue}' for lead ${execution.leadId}`);
    
    execution.executionData[`field_${fieldName}_updated`] = fieldValue;
  }

  private async executeAssignLeadAction(action: WorkflowAction, execution: WorkflowExecution): Promise<void> {
    const { assigneeId } = action.configuration;
    
    // In production, this would update the lead assignment in database
    this.logger.log(`Assigning lead ${execution.leadId} to ${assigneeId}`);
    
    execution.executionData.assignedTo = assigneeId;
  }

  private async executeCreateTaskAction(action: WorkflowAction, execution: WorkflowExecution): Promise<void> {
    const { taskTitle, taskDescription, taskDueDate } = action.configuration;
    
    // In production, this would create a task in the CRM system
    this.logger.log(`Creating task '${taskTitle}' for lead ${execution.leadId}`);
    
    execution.executionData[`task_${action.id}_created`] = {
      title: taskTitle,
      description: taskDescription,
      dueDate: taskDueDate,
      createdAt: new Date()
    };
  }

  private async executeWebhookAction(action: WorkflowAction, execution: WorkflowExecution): Promise<void> {
    const { webhookUrl, webhookMethod, webhookHeaders, webhookPayload } = action.configuration;
    
    // In production, this would make an actual HTTP request
    this.logger.log(`Calling webhook ${webhookUrl} for lead ${execution.leadId}`);
    
    execution.executionData[`webhook_${action.id}_called`] = {
      url: webhookUrl,
      method: webhookMethod,
      timestamp: new Date()
    };
  }

  private async scheduleWorkflowContinuation(execution: WorkflowExecution, waitMinutes: number): Promise<void> {
    const continueAt = new Date(Date.now() + (waitMinutes * 60 * 1000));
    
    // In production, this would schedule with a job queue like Bull or Agenda
    this.logger.log(`Scheduling workflow continuation for ${execution.id} at ${continueAt.toISOString()}`);
    
    // Simulate scheduling by setting a timeout (not recommended for production)
    setTimeout(async () => {
      execution.currentActionIndex++;
      await this.executeWorkflowActions(execution);
    }, waitMinutes * 60 * 1000);
  }

  private async evaluateConditions(conditions: WorkflowCondition[], leadId: string): Promise<boolean> {
    // In production, this would fetch lead data from database
    const leadData = await this.getLeadData(leadId);
    
    for (const condition of conditions) {
      const fieldValue = this.getNestedValue(leadData, condition.field);
      const result = this.evaluateCondition(fieldValue, condition.operator, condition.value);
      
      if (condition.type === 'if' && !result) {
        return false;
      } else if (condition.type === 'unless' && result) {
        return false;
      }
    }
    
    return true;
  }

  private evaluateCondition(fieldValue: any, operator: string, expectedValue: any): boolean {
    switch (operator) {
      case 'equals':
        return fieldValue === expectedValue;
      case 'not_equals':
        return fieldValue !== expectedValue;
      case 'greater_than':
        return fieldValue > expectedValue;
      case 'less_than':
        return fieldValue < expectedValue;
      case 'contains':
        return typeof fieldValue === 'string' && fieldValue.includes(expectedValue);
      case 'exists':
        return fieldValue !== null && fieldValue !== undefined;
      case 'in':
        return Array.isArray(expectedValue) && expectedValue.includes(fieldValue);
      case 'not_in':
        return Array.isArray(expectedValue) && !expectedValue.includes(fieldValue);
      default:
        return false;
    }
  }

  private updateActionPerformance(workflowId: string, action: WorkflowAction, startTime: number, success: boolean): void {
    const workflow = this.workflows.find(w => w.id === workflowId);
    if (!workflow) return;

    let actionPerf = workflow.analytics.actionPerformance.find(ap => ap.actionId === action.id);
    
    if (!actionPerf) {
      actionPerf = {
        actionId: action.id,
        actionType: action.type,
        executions: 0,
        successes: 0,
        failures: 0,
        successRate: 0,
        averageExecutionTime: 0
      };
      workflow.analytics.actionPerformance.push(actionPerf);
    }

    const executionTime = Date.now() - startTime;
    actionPerf.executions++;
    
    if (success) {
      actionPerf.successes++;
    } else {
      actionPerf.failures++;
    }
    
    actionPerf.successRate = (actionPerf.successes / actionPerf.executions) * 100;
    actionPerf.averageExecutionTime = 
      (actionPerf.averageExecutionTime * (actionPerf.executions - 1) + executionTime) / actionPerf.executions;
  }

  async getPersonalizedContent(leadId: string, templateId: string): Promise<string> {
    // Get lead data and personalization variables
    const leadData = await this.getLeadData(leadId);
    const personalizedVariables = await this.getPersonalizationVariables(leadId);
    
    // In production, this would fetch the template and apply personalization
    const template = `Hello {{firstName}}, welcome to our platform!`;
    
    return this.personalizeText(template, leadId, { ...leadData, ...personalizedVariables });
  }

  async getPersonalizationVariables(leadId: string): Promise<Record<string, any>> {
    // In production, this would fetch from database
    return {
      firstName: 'John',
      lastName: 'Doe',
      company: 'Example Corp',
      loginUrl: 'https://app.amysoft.tech/login',
      progressUrl: 'https://app.amysoft.tech/progress'
    };
  }

  async updatePersonalizationProfile(leadId: string, data: Record<string, any>): Promise<void> {
    // In production, this would update the lead's personalization profile
    this.logger.log(`Updating personalization profile for lead ${leadId}`);
  }

  private async personalizeText(text: string, leadId: string, variables?: Record<string, any>): Promise<string> {
    const vars = variables || await this.getPersonalizationVariables(leadId);
    
    let personalizedText = text;
    
    // Replace variables in {{variable}} format
    Object.keys(vars).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      personalizedText = personalizedText.replace(regex, vars[key] || '');
    });
    
    return personalizedText;
  }

  private async getLeadData(leadId: string): Promise<any> {
    // In production, this would fetch from database
    return {
      id: leadId,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      score: 75,
      status: 'qualified',
      lastActivityAt: new Date(),
      cart: {
        status: 'abandoned',
        total: 24.95,
        checkoutUrl: 'https://amysoft.tech/checkout'
      }
    };
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // Public API methods
  async getWorkflows(): Promise<AutomationWorkflow[]> {
    return this.workflows.filter(w => w.isActive);
  }

  async getWorkflowAnalytics(workflowId: string): Promise<WorkflowAnalytics | null> {
    const workflow = this.workflows.find(w => w.id === workflowId);
    return workflow ? workflow.analytics : null;
  }

  async getActiveExecutions(): Promise<WorkflowExecution[]> {
    return this.executions.filter(e => e.status === 'running');
  }

  async pauseExecution(executionId: string): Promise<boolean> {
    const execution = this.executions.find(e => e.id === executionId);
    
    if (!execution || execution.status !== 'running') {
      return false;
    }

    execution.status = 'paused';
    this.logger.log(`Workflow execution paused: ${executionId}`);
    
    return true;
  }

  async resumeExecution(executionId: string): Promise<boolean> {
    const execution = this.executions.find(e => e.id === executionId);
    
    if (!execution || execution.status !== 'paused') {
      return false;
    }

    execution.status = 'running';
    this.logger.log(`Workflow execution resumed: ${executionId}`);
    
    // Continue execution
    await this.executeWorkflowActions(execution);
    
    return true;
  }

  @Cron(CronExpression.EVERY_MINUTE)
  private async processAutomationRules(): Promise<void> {
    for (const rule of this.automationRules.filter(r => r.isActive)) {
      try {
        await this.evaluateAutomationRule(rule);
      } catch (error) {
        this.logger.error(`Error processing automation rule ${rule.id}:`, error);
      }
    }
  }

  private async evaluateAutomationRule(rule: AutomationRule): Promise<void> {
    // In production, this would query the database for matching conditions
    // For now, simulate rule evaluation
    
    switch (rule.trigger.event) {
      case 'lead_score_change':
        // Check for leads that recently crossed the threshold
        break;
      
      case 'inactivity_period':
        // Check for leads inactive for the specified timeframe
        break;
      
      case 'cart_abandonment':
        // Check for recently abandoned carts
        break;
    }
  }
}