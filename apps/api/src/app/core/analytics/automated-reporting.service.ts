import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'executive' | 'financial' | 'customer' | 'content' | 'operational' | 'custom';
  category: string;
  sections: ReportSection[];
  format: ReportFormat;
  scheduling: ReportScheduling;
  recipients: ReportRecipient[];
  filters: ReportFilter[];
  branding: ReportBranding;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface ReportSection {
  id: string;
  name: string;
  type: 'chart' | 'table' | 'metric' | 'text' | 'image' | 'kpi_grid';
  order: number;
  configuration: SectionConfiguration;
  dataSource: DataSourceConfiguration;
  styling: SectionStyling;
  isVisible: boolean;
}

export interface SectionConfiguration {
  title: string;
  subtitle?: string;
  showHeader: boolean;
  height?: number;
  width?: number;
  chartType?: 'line' | 'bar' | 'pie' | 'doughnut' | 'radar' | 'scatter' | 'area';
  tableColumns?: TableColumn[];
  metricDisplayType?: 'large' | 'compact' | 'card';
  textContent?: string;
  imageUrl?: string;
  kpiLayout?: 'grid' | 'horizontal' | 'vertical';
}

export interface DataSourceConfiguration {
  source: string;
  endpoint: string;
  parameters: Record<string, any>;
  refreshInterval: number;
  cacheTimeout: number;
  transformations: DataTransformation[];
  aggregations: DataAggregation[];
}

export interface DataTransformation {
  type: 'filter' | 'sort' | 'group' | 'calculate' | 'format';
  field: string;
  operation: string;
  value?: any;
  expression?: string;
}

export interface DataAggregation {
  field: string;
  operation: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'median';
  groupBy?: string[];
}

export interface SectionStyling {
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  alignment?: 'left' | 'center' | 'right';
  padding?: number;
  margin?: number;
  borderRadius?: number;
}

export interface TableColumn {
  field: string;
  header: string;
  type: 'text' | 'number' | 'currency' | 'percentage' | 'date' | 'boolean';
  width?: number;
  sortable: boolean;
  format?: string;
  aggregation?: 'sum' | 'avg' | 'count';
}

export interface ReportFormat {
  outputType: 'pdf' | 'excel' | 'csv' | 'html' | 'json';
  pageSize: 'A4' | 'A3' | 'Letter' | 'Legal';
  orientation: 'portrait' | 'landscape';
  margins: PageMargins;
  compression: boolean;
  password?: string;
  watermark?: WatermarkConfiguration;
}

export interface PageMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface WatermarkConfiguration {
  text: string;
  opacity: number;
  fontSize: number;
  color: string;
  rotation: number;
}

export interface ReportScheduling {
  frequency: 'manual' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  timezone: string;
  startDate: Date;
  endDate?: Date;
  customCron?: string;
  retryAttempts: number;
  retryInterval: number;
  failureNotification: boolean;
}

export interface ReportRecipient {
  id: string;
  email: string;
  name: string;
  role: string;
  deliveryMethod: 'email' | 'download' | 'dashboard' | 'api';
  format?: 'pdf' | 'excel' | 'csv';
  personalizedFilters?: Record<string, any>;
  isActive: boolean;
}

export interface ReportFilter {
  id: string;
  name: string;
  field: string;
  type: 'date_range' | 'single_select' | 'multi_select' | 'number_range' | 'text';
  defaultValue?: any;
  options?: FilterOption[];
  isRequired: boolean;
  isUserConfigurable: boolean;
}

export interface FilterOption {
  value: any;
  label: string;
  description?: string;
}

export interface ReportBranding {
  logo?: string;
  companyName: string;
  colors: BrandColors;
  fonts: BrandFonts;
  headerText?: string;
  footerText?: string;
  customCSS?: string;
}

export interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  border: string;
}

export interface BrandFonts {
  heading: string;
  body: string;
  size: {
    h1: number;
    h2: number;
    h3: number;
    body: number;
    caption: number;
  };
}

export interface GeneratedReport {
  id: string;
  templateId: string;
  name: string;
  description: string;
  format: string;
  status: 'generating' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  generatedAt: Date;
  completedAt?: Date;
  fileUrl?: string;
  fileSize?: number;
  errorMessage?: string;
  parameters: Record<string, any>;
  metadata: ReportMetadata;
  recipients: string[];
  deliveryStatus: DeliveryStatus[];
}

export interface ReportMetadata {
  totalPages?: number;
  totalRecords?: number;
  dataDateRange: {
    start: Date;
    end: Date;
  };
  generatedBy: string;
  generationTime: number;
  dataVersion: string;
  reportVersion: string;
}

export interface DeliveryStatus {
  recipientId: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
  deliveredAt?: Date;
  errorMessage?: string;
  readAt?: Date;
  downloadedAt?: Date;
}

export interface ReportQueue {
  id: string;
  templateId: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  scheduledAt: Date;
  parameters: Record<string, any>;
  requester: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  attempts: number;
  maxAttempts: number;
  errorLog: string[];
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface ReportAnalytics {
  templateId: string;
  totalGenerations: number;
  successfulGenerations: number;
  failedGenerations: number;
  averageGenerationTime: number;
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  openRate: number;
  downloadRate: number;
  lastGenerated: Date;
  popularFilters: Record<string, number>;
  usageByRole: Record<string, number>;
  usageByTimeOfDay: Record<string, number>;
  performanceMetrics: PerformanceMetrics;
}

export interface PerformanceMetrics {
  averageDataFetchTime: number;
  averageRenderTime: number;
  averageDeliveryTime: number;
  peakMemoryUsage: number;
  averageFileSize: number;
  errorRates: Record<string, number>;
}

export interface ReportDashboard {
  totalTemplates: number;
  activeTemplates: number;
  totalReports: number;
  reportsThisMonth: number;
  averageGenerationTime: number;
  successRate: number;
  topTemplates: TemplateUsage[];
  recentReports: GeneratedReport[];
  systemHealth: ReportSystemHealth;
  upcomingScheduled: ScheduledReportInfo[];
}

export interface TemplateUsage {
  templateId: string;
  templateName: string;
  usageCount: number;
  lastUsed: Date;
  averageRating: number;
}

export interface ReportSystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  queueSize: number;
  processingCapacity: number;
  averageWaitTime: number;
  errorRate: number;
  lastHealthCheck: Date;
}

export interface ScheduledReportInfo {
  templateId: string;
  templateName: string;
  nextRun: Date;
  frequency: string;
  recipientCount: number;
  estimatedDuration: number;
}

@Injectable()
export class AutomatedReportingService {
  private readonly logger = new Logger(AutomatedReportingService.name);
  private templates: ReportTemplate[] = [];
  private generatedReports: GeneratedReport[] = [];
  private reportQueue: ReportQueue[] = [];
  private analytics: Map<string, ReportAnalytics> = new Map();

  constructor(private configService: ConfigService) {
    this.initializeDefaultTemplates();
    this.initializeSystemTemplates();
  }

  private initializeDefaultTemplates(): void {
    this.templates = [
      {
        id: 'exec_daily',
        name: 'Executive Daily Summary',
        description: 'High-level business metrics and key alerts for executive team',
        type: 'executive',
        category: 'Leadership',
        sections: this.createExecutiveDashboardSections(),
        format: {
          outputType: 'pdf',
          pageSize: 'A4',
          orientation: 'portrait',
          margins: { top: 20, right: 20, bottom: 20, left: 20 },
          compression: true,
          watermark: {
            text: 'CONFIDENTIAL',
            opacity: 0.1,
            fontSize: 48,
            color: '#cccccc',
            rotation: 45
          }
        },
        scheduling: {
          frequency: 'daily',
          time: '08:00',
          timezone: 'UTC',
          startDate: new Date(),
          retryAttempts: 3,
          retryInterval: 15,
          failureNotification: true
        },
        recipients: [
          {
            id: 'ceo',
            email: 'ceo@amysoft.tech',
            name: 'Chief Executive Officer',
            role: 'CEO',
            deliveryMethod: 'email',
            format: 'pdf',
            isActive: true
          },
          {
            id: 'cfo',
            email: 'cfo@amysoft.tech',
            name: 'Chief Financial Officer',
            role: 'CFO',
            deliveryMethod: 'email',
            format: 'pdf',
            isActive: true
          }
        ],
        filters: [
          {
            id: 'date_range',
            name: 'Date Range',
            field: 'dateRange',
            type: 'date_range',
            defaultValue: { start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), end: new Date() },
            isRequired: true,
            isUserConfigurable: false
          }
        ],
        branding: this.getDefaultBranding(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      },
      {
        id: 'revenue_weekly',
        name: 'Weekly Revenue Analysis',
        description: 'Comprehensive revenue metrics, trends, and forecasting',
        type: 'financial',
        category: 'Finance',
        sections: this.createRevenueAnalysisSections(),
        format: {
          outputType: 'excel',
          pageSize: 'A4',
          orientation: 'landscape',
          margins: { top: 15, right: 15, bottom: 15, left: 15 },
          compression: false
        },
        scheduling: {
          frequency: 'weekly',
          dayOfWeek: 1, // Monday
          time: '09:00',
          timezone: 'UTC',
          startDate: new Date(),
          retryAttempts: 2,
          retryInterval: 30,
          failureNotification: true
        },
        recipients: [
          {
            id: 'finance_team',
            email: 'finance@amysoft.tech',
            name: 'Finance Team',
            role: 'Finance',
            deliveryMethod: 'email',
            format: 'excel',
            isActive: true
          }
        ],
        filters: [],
        branding: this.getDefaultBranding(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      },
      {
        id: 'customer_monthly',
        name: 'Monthly Customer Analytics',
        description: 'Customer behavior, satisfaction, and retention analysis',
        type: 'customer',
        category: 'Customer Success',
        sections: this.createCustomerAnalyticsSections(),
        format: {
          outputType: 'pdf',
          pageSize: 'A4',
          orientation: 'portrait',
          margins: { top: 20, right: 20, bottom: 20, left: 20 },
          compression: true
        },
        scheduling: {
          frequency: 'monthly',
          dayOfMonth: 1,
          time: '10:00',
          timezone: 'UTC',
          startDate: new Date(),
          retryAttempts: 3,
          retryInterval: 60,
          failureNotification: true
        },
        recipients: [
          {
            id: 'customer_success',
            email: 'customer-success@amysoft.tech',
            name: 'Customer Success Team',
            role: 'Customer Success',
            deliveryMethod: 'email',
            format: 'pdf',
            isActive: true
          }
        ],
        filters: [
          {
            id: 'customer_segment',
            name: 'Customer Segment',
            field: 'segment',
            type: 'multi_select',
            options: [
              { value: 'foundation', label: 'Foundation Tier' },
              { value: 'advanced', label: 'Advanced Tier' },
              { value: 'enterprise', label: 'Enterprise Tier' }
            ],
            isRequired: false,
            isUserConfigurable: true
          }
        ],
        branding: this.getDefaultBranding(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      }
    ];

    this.logger.log(`Initialized ${this.templates.length} default report templates`);
  }

  private initializeSystemTemplates(): void {
    // Initialize analytics for each template
    this.templates.forEach(template => {
      this.analytics.set(template.id, {
        templateId: template.id,
        totalGenerations: 0,
        successfulGenerations: 0,
        failedGenerations: 0,
        averageGenerationTime: 0,
        totalDeliveries: 0,
        successfulDeliveries: 0,
        failedDeliveries: 0,
        openRate: 0,
        downloadRate: 0,
        lastGenerated: new Date(),
        popularFilters: {},
        usageByRole: {},
        usageByTimeOfDay: {},
        performanceMetrics: {
          averageDataFetchTime: 0,
          averageRenderTime: 0,
          averageDeliveryTime: 0,
          peakMemoryUsage: 0,
          averageFileSize: 0,
          errorRates: {}
        }
      });
    });
  }

  async createTemplate(template: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const newTemplate: ReportTemplate = {
      id: `template_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      ...template,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.templates.push(newTemplate);
    this.analytics.set(newTemplate.id, this.createEmptyAnalytics(newTemplate.id));
    
    this.logger.log(`Report template created: ${newTemplate.id}`);
    return newTemplate.id;
  }

  async updateTemplate(templateId: string, updates: Partial<ReportTemplate>): Promise<boolean> {
    const templateIndex = this.templates.findIndex(t => t.id === templateId);
    
    if (templateIndex === -1) {
      return false;
    }

    this.templates[templateIndex] = {
      ...this.templates[templateIndex],
      ...updates,
      updatedAt: new Date()
    };

    this.logger.log(`Report template updated: ${templateId}`);
    return true;
  }

  async deleteTemplate(templateId: string): Promise<boolean> {
    const templateIndex = this.templates.findIndex(t => t.id === templateId);
    
    if (templateIndex === -1) {
      return false;
    }

    this.templates.splice(templateIndex, 1);
    this.analytics.delete(templateId);
    
    this.logger.log(`Report template deleted: ${templateId}`);
    return true;
  }

  async generateReport(
    templateId: string,
    parameters: Record<string, any> = {},
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
  ): Promise<string> {
    const template = this.templates.find(t => t.id === templateId);
    
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const reportId = `report_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    const generatedReport: GeneratedReport = {
      id: reportId,
      templateId,
      name: `${template.name} - ${new Date().toLocaleDateString()}`,
      description: template.description,
      format: template.format.outputType,
      status: 'generating',
      progress: 0,
      generatedAt: new Date(),
      parameters,
      metadata: {
        dataDateRange: {
          start: parameters.dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: parameters.dateRange?.end || new Date()
        },
        generatedBy: parameters.userId || 'system',
        generationTime: 0,
        dataVersion: '1.0',
        reportVersion: template.updatedAt.toISOString()
      },
      recipients: template.recipients.map(r => r.email),
      deliveryStatus: template.recipients.map(r => ({
        recipientId: r.id,
        status: 'pending'
      }))
    };

    this.generatedReports.push(generatedReport);
    
    // Add to processing queue
    const queueItem: ReportQueue = {
      id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      templateId,
      priority,
      scheduledAt: new Date(),
      parameters,
      requester: parameters.userId || 'system',
      status: 'queued',
      attempts: 0,
      maxAttempts: 3,
      errorLog: [],
      createdAt: new Date()
    };

    this.reportQueue.push(queueItem);
    
    // Process immediately if high priority
    if (priority === 'high' || priority === 'urgent') {
      setImmediate(() => this.processQueueItem(queueItem, generatedReport));
    }

    this.logger.log(`Report queued for generation: ${reportId} (template: ${templateId})`);
    return reportId;
  }

  async scheduleReport(
    templateId: string,
    scheduling: ReportScheduling,
    parameters: Record<string, any> = {}
  ): Promise<boolean> {
    const template = this.templates.find(t => t.id === templateId);
    
    if (!template) {
      return false;
    }

    template.scheduling = scheduling;
    template.updatedAt = new Date();

    this.logger.log(`Report scheduled: ${templateId} - ${scheduling.frequency}`);
    return true;
  }

  async getReportStatus(reportId: string): Promise<GeneratedReport | null> {
    return this.generatedReports.find(r => r.id === reportId) || null;
  }

  async getReportHistory(templateId?: string, limit: number = 50): Promise<GeneratedReport[]> {
    let reports = this.generatedReports;
    
    if (templateId) {
      reports = reports.filter(r => r.templateId === templateId);
    }

    return reports
      .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime())
      .slice(0, limit);
  }

  async getTemplates(category?: string, type?: string): Promise<ReportTemplate[]> {
    let templates = this.templates.filter(t => t.isActive);
    
    if (category) {
      templates = templates.filter(t => t.category === category);
    }
    
    if (type) {
      templates = templates.filter(t => t.type === type);
    }

    return templates;
  }

  async getTemplate(templateId: string): Promise<ReportTemplate | null> {
    return this.templates.find(t => t.id === templateId) || null;
  }

  async getDashboard(): Promise<ReportDashboard> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const reportsThisMonth = this.generatedReports.filter(
      r => r.generatedAt >= startOfMonth
    ).length;

    const completedReports = this.generatedReports.filter(r => r.status === 'completed');
    const averageGenerationTime = completedReports.length > 0
      ? completedReports.reduce((sum, r) => sum + (r.metadata.generationTime || 0), 0) / completedReports.length
      : 0;

    const successRate = this.generatedReports.length > 0
      ? (completedReports.length / this.generatedReports.length) * 100
      : 100;

    const topTemplates = this.getTopTemplates();
    const recentReports = this.generatedReports
      .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime())
      .slice(0, 10);

    return {
      totalTemplates: this.templates.length,
      activeTemplates: this.templates.filter(t => t.isActive).length,
      totalReports: this.generatedReports.length,
      reportsThisMonth,
      averageGenerationTime,
      successRate,
      topTemplates,
      recentReports,
      systemHealth: this.getSystemHealth(),
      upcomingScheduled: this.getUpcomingScheduled()
    };
  }

  async getAnalytics(templateId: string): Promise<ReportAnalytics | null> {
    return this.analytics.get(templateId) || null;
  }

  async cancelReport(reportId: string): Promise<boolean> {
    const report = this.generatedReports.find(r => r.id === reportId);
    
    if (!report || report.status === 'completed') {
      return false;
    }

    report.status = 'cancelled';
    report.completedAt = new Date();

    // Remove from queue if still queued
    const queueIndex = this.reportQueue.findIndex(q => q.templateId === report.templateId);
    if (queueIndex !== -1) {
      this.reportQueue.splice(queueIndex, 1);
    }

    this.logger.log(`Report cancelled: ${reportId}`);
    return true;
  }

  async downloadReport(reportId: string): Promise<string | null> {
    const report = this.generatedReports.find(r => r.id === reportId);
    
    if (!report || report.status !== 'completed' || !report.fileUrl) {
      return null;
    }

    // Update analytics
    const analytics = this.analytics.get(report.templateId);
    if (analytics) {
      analytics.downloadRate++;
    }

    this.logger.log(`Report downloaded: ${reportId}`);
    return report.fileUrl;
  }

  private async processQueueItem(queueItem: ReportQueue, report: GeneratedReport): Promise<void> {
    queueItem.status = 'processing';
    queueItem.startedAt = new Date();
    queueItem.attempts++;

    const template = this.templates.find(t => t.id === queueItem.templateId);
    
    if (!template) {
      this.handleProcessingError(queueItem, report, 'Template not found');
      return;
    }

    try {
      report.status = 'generating';
      report.progress = 10;

      // Simulate data fetching
      await this.fetchReportData(template, queueItem.parameters);
      report.progress = 40;

      // Simulate report rendering
      await this.renderReport(template, queueItem.parameters);
      report.progress = 70;

      // Simulate file generation
      const fileUrl = await this.generateReportFile(template, queueItem.parameters);
      report.progress = 90;

      // Complete the report
      report.status = 'completed';
      report.progress = 100;
      report.completedAt = new Date();
      report.fileUrl = fileUrl;
      report.fileSize = Math.floor(Math.random() * 2000000) + 500000; // 0.5-2.5MB
      report.metadata.generationTime = Date.now() - report.generatedAt.getTime();
      report.metadata.totalPages = Math.floor(Math.random() * 20) + 5;
      report.metadata.totalRecords = Math.floor(Math.random() * 10000) + 1000;

      queueItem.status = 'completed';
      queueItem.completedAt = new Date();

      // Update analytics
      this.updateAnalytics(template.id, report);

      // Deliver report
      if (template.recipients.length > 0) {
        await this.deliverReport(report, template);
      }

      this.logger.log(`Report generation completed: ${report.id}`);

    } catch (error) {
      this.handleProcessingError(queueItem, report, error.message);
    }
  }

  private handleProcessingError(queueItem: ReportQueue, report: GeneratedReport, error: string): void {
    queueItem.errorLog.push(`${new Date().toISOString()}: ${error}`);
    
    if (queueItem.attempts >= queueItem.maxAttempts) {
      queueItem.status = 'failed';
      report.status = 'failed';
      report.errorMessage = error;
      report.completedAt = new Date();
      
      this.logger.error(`Report generation failed permanently: ${report.id} - ${error}`);
    } else {
      // Retry after delay
      setTimeout(() => {
        this.processQueueItem(queueItem, report);
      }, 60000 * queueItem.attempts); // Exponential backoff
      
      this.logger.warn(`Report generation failed, retrying: ${report.id} - ${error}`);
    }
  }

  private async fetchReportData(template: ReportTemplate, parameters: Record<string, any>): Promise<any> {
    // Simulate data fetching delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // In production, this would fetch real data from various sources
    return {
      businessData: { /* business intelligence data */ },
      customerData: { /* customer analytics data */ },
      revenueData: { /* revenue analytics data */ }
    };
  }

  private async renderReport(template: ReportTemplate, parameters: Record<string, any>): Promise<void> {
    // Simulate report rendering delay
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    // In production, this would render charts, tables, and other report sections
  }

  private async generateReportFile(template: ReportTemplate, parameters: Record<string, any>): Promise<string> {
    // Simulate file generation delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // In production, this would generate actual PDF/Excel/CSV files
    const fileName = `${template.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.${template.format.outputType}`;
    return `/reports/${fileName}`;
  }

  private async deliverReport(report: GeneratedReport, template: ReportTemplate): Promise<void> {
    for (const recipient of template.recipients) {
      if (!recipient.isActive) continue;

      try {
        // Simulate delivery
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const deliveryStatus = report.deliveryStatus.find(d => d.recipientId === recipient.id);
        if (deliveryStatus) {
          deliveryStatus.status = 'delivered';
          deliveryStatus.deliveredAt = new Date();
        }

        this.logger.log(`Report delivered to ${recipient.email}: ${report.id}`);
        
      } catch (error) {
        const deliveryStatus = report.deliveryStatus.find(d => d.recipientId === recipient.id);
        if (deliveryStatus) {
          deliveryStatus.status = 'failed';
          deliveryStatus.errorMessage = error.message;
        }
        
        this.logger.error(`Failed to deliver report to ${recipient.email}: ${error.message}`);
      }
    }
  }

  private updateAnalytics(templateId: string, report: GeneratedReport): void {
    const analytics = this.analytics.get(templateId);
    if (!analytics) return;

    analytics.totalGenerations++;
    
    if (report.status === 'completed') {
      analytics.successfulGenerations++;
      analytics.lastGenerated = report.completedAt!;
      
      // Update average generation time
      const totalTime = analytics.averageGenerationTime * (analytics.successfulGenerations - 1) + report.metadata.generationTime;
      analytics.averageGenerationTime = totalTime / analytics.successfulGenerations;
      
    } else if (report.status === 'failed') {
      analytics.failedGenerations++;
    }

    // Update delivery analytics
    const deliveredCount = report.deliveryStatus.filter(d => d.status === 'delivered').length;
    const failedCount = report.deliveryStatus.filter(d => d.status === 'failed').length;
    
    analytics.totalDeliveries += deliveredCount + failedCount;
    analytics.successfulDeliveries += deliveredCount;
    analytics.failedDeliveries += failedCount;
  }

  private getTopTemplates(): TemplateUsage[] {
    return Array.from(this.analytics.entries())
      .map(([templateId, analytics]) => {
        const template = this.templates.find(t => t.id === templateId);
        return {
          templateId,
          templateName: template?.name || 'Unknown',
          usageCount: analytics.totalGenerations,
          lastUsed: analytics.lastGenerated,
          averageRating: 4.2 + Math.random() * 0.8 // Mock rating
        };
      })
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5);
  }

  private getSystemHealth(): ReportSystemHealth {
    const queuedCount = this.reportQueue.filter(q => q.status === 'queued').length;
    const processingCount = this.reportQueue.filter(q => q.status === 'processing').length;
    const failedCount = this.reportQueue.filter(q => q.status === 'failed').length;
    const totalCount = this.reportQueue.length;
    
    const errorRate = totalCount > 0 ? (failedCount / totalCount) * 100 : 0;
    let status: 'healthy' | 'degraded' | 'down' = 'healthy';
    
    if (errorRate > 20 || queuedCount > 50) {
      status = 'degraded';
    }
    if (errorRate > 50 || queuedCount > 100) {
      status = 'down';
    }

    return {
      status,
      queueSize: queuedCount,
      processingCapacity: 5, // Mock capacity
      averageWaitTime: queuedCount * 2, // Mock wait time
      errorRate,
      lastHealthCheck: new Date()
    };
  }

  private getUpcomingScheduled(): ScheduledReportInfo[] {
    return this.templates
      .filter(t => t.isActive && t.scheduling.frequency !== 'manual')
      .map(template => ({
        templateId: template.id,
        templateName: template.name,
        nextRun: this.calculateNextRun(template.scheduling),
        frequency: template.scheduling.frequency,
        recipientCount: template.recipients.filter(r => r.isActive).length,
        estimatedDuration: 5 + Math.random() * 10 // Mock duration
      }))
      .sort((a, b) => a.nextRun.getTime() - b.nextRun.getTime())
      .slice(0, 10);
  }

  private calculateNextRun(scheduling: ReportScheduling): Date {
    const now = new Date();
    const nextRun = new Date(now);
    
    switch (scheduling.frequency) {
      case 'daily':
        nextRun.setDate(nextRun.getDate() + 1);
        break;
      case 'weekly':
        nextRun.setDate(nextRun.getDate() + 7);
        break;
      case 'monthly':
        nextRun.setMonth(nextRun.getMonth() + 1);
        break;
      case 'quarterly':
        nextRun.setMonth(nextRun.getMonth() + 3);
        break;
      case 'yearly':
        nextRun.setFullYear(nextRun.getFullYear() + 1);
        break;
    }
    
    return nextRun;
  }

  private createEmptyAnalytics(templateId: string): ReportAnalytics {
    return {
      templateId,
      totalGenerations: 0,
      successfulGenerations: 0,
      failedGenerations: 0,
      averageGenerationTime: 0,
      totalDeliveries: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0,
      openRate: 0,
      downloadRate: 0,
      lastGenerated: new Date(),
      popularFilters: {},
      usageByRole: {},
      usageByTimeOfDay: {},
      performanceMetrics: {
        averageDataFetchTime: 0,
        averageRenderTime: 0,
        averageDeliveryTime: 0,
        peakMemoryUsage: 0,
        averageFileSize: 0,
        errorRates: {}
      }
    };
  }

  private getDefaultBranding(): ReportBranding {
    return {
      companyName: 'amysoft-digital-tech',
      colors: {
        primary: '#1976d2',
        secondary: '#388e3c',
        accent: '#f57c00',
        background: '#ffffff',
        text: '#333333',
        border: '#e0e0e0'
      },
      fonts: {
        heading: 'Roboto',
        body: 'Roboto',
        size: {
          h1: 24,
          h2: 20,
          h3: 16,
          body: 14,
          caption: 12
        }
      },
      headerText: 'Beyond the AI Plateau - Business Intelligence Report',
      footerText: 'Generated by amysoft.tech Business Intelligence Platform'
    };
  }

  private createExecutiveDashboardSections(): ReportSection[] {
    return [
      {
        id: 'overview_kpis',
        name: 'Key Performance Indicators',
        type: 'kpi_grid',
        order: 1,
        configuration: {
          title: 'Business Overview',
          showHeader: true,
          kpiLayout: 'grid'
        },
        dataSource: {
          source: 'business_intelligence',
          endpoint: '/api/analytics/overview',
          parameters: {},
          refreshInterval: 300,
          cacheTimeout: 600,
          transformations: [],
          aggregations: []
        },
        styling: {
          backgroundColor: '#f5f5f5',
          padding: 20
        },
        isVisible: true
      },
      {
        id: 'revenue_trend',
        name: 'Revenue Trend',
        type: 'chart',
        order: 2,
        configuration: {
          title: 'Revenue Trend (Last 30 Days)',
          showHeader: true,
          chartType: 'line',
          height: 300
        },
        dataSource: {
          source: 'business_intelligence',
          endpoint: '/api/analytics/revenue/trends',
          parameters: { period: '30d' },
          refreshInterval: 300,
          cacheTimeout: 600,
          transformations: [],
          aggregations: []
        },
        styling: {},
        isVisible: true
      }
    ];
  }

  private createRevenueAnalysisSections(): ReportSection[] {
    return [
      {
        id: 'revenue_summary',
        name: 'Revenue Summary',
        type: 'table',
        order: 1,
        configuration: {
          title: 'Revenue Breakdown',
          showHeader: true,
          tableColumns: [
            { field: 'period', header: 'Period', type: 'text', width: 150, sortable: true },
            { field: 'revenue', header: 'Revenue', type: 'currency', width: 120, sortable: true },
            { field: 'growth', header: 'Growth %', type: 'percentage', width: 100, sortable: true }
          ]
        },
        dataSource: {
          source: 'business_intelligence',
          endpoint: '/api/analytics/revenue/summary',
          parameters: {},
          refreshInterval: 300,
          cacheTimeout: 600,
          transformations: [],
          aggregations: []
        },
        styling: {},
        isVisible: true
      }
    ];
  }

  private createCustomerAnalyticsSections(): ReportSection[] {
    return [
      {
        id: 'customer_metrics',
        name: 'Customer Metrics',
        type: 'metric',
        order: 1,
        configuration: {
          title: 'Customer Analytics',
          showHeader: true,
          metricDisplayType: 'card'
        },
        dataSource: {
          source: 'business_intelligence',
          endpoint: '/api/analytics/customers/metrics',
          parameters: {},
          refreshInterval: 300,
          cacheTimeout: 600,
          transformations: [],
          aggregations: []
        },
        styling: {},
        isVisible: true
      }
    ];
  }

  @Cron(CronExpression.EVERY_MINUTE)
  private async processReportQueue(): Promise<void> {
    const queuedItems = this.reportQueue
      .filter(item => item.status === 'queued')
      .sort((a, b) => {
        // Sort by priority, then by scheduled time
        const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.scheduledAt.getTime() - b.scheduledAt.getTime();
      })
      .slice(0, 5); // Process max 5 reports concurrently

    for (const queueItem of queuedItems) {
      const report = this.generatedReports.find(r => r.templateId === queueItem.templateId);
      if (report) {
        this.processQueueItem(queueItem, report);
      }
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  private async processScheduledReports(): Promise<void> {
    const now = new Date();
    
    for (const template of this.templates) {
      if (!template.isActive || template.scheduling.frequency === 'manual') {
        continue;
      }

      if (this.shouldRunScheduledReport(template, now)) {
        try {
          await this.generateReport(template.id, {}, 'normal');
          this.logger.log(`Scheduled report generated: ${template.id}`);
        } catch (error) {
          this.logger.error(`Failed to generate scheduled report ${template.id}:`, error);
        }
      }
    }
  }

  private shouldRunScheduledReport(template: ReportTemplate, now: Date): boolean {
    const { scheduling } = template;
    const [hour, minute] = scheduling.time.split(':').map(Number);
    
    // Check if it's the right time
    if (now.getHours() !== hour || now.getMinutes() !== minute) {
      return false;
    }

    // Check frequency-specific conditions
    switch (scheduling.frequency) {
      case 'daily':
        return true;
      case 'weekly':
        return now.getDay() === (scheduling.dayOfWeek || 1);
      case 'monthly':
        return now.getDate() === (scheduling.dayOfMonth || 1);
      case 'quarterly':
        return now.getDate() === 1 && now.getMonth() % 3 === 0;
      case 'yearly':
        return now.getDate() === 1 && now.getMonth() === 0;
      default:
        return false;
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  private async cleanupOldReports(): Promise<void> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const oldReports = this.generatedReports.filter(
      r => r.generatedAt < thirtyDaysAgo && r.status === 'completed'
    );

    for (const report of oldReports) {
      // In production, delete actual files
      this.logger.log(`Cleaning up old report: ${report.id}`);
    }

    // Remove from memory
    this.generatedReports = this.generatedReports.filter(
      r => r.generatedAt >= thirtyDaysAgo || r.status !== 'completed'
    );

    // Clean up old queue items
    this.reportQueue = this.reportQueue.filter(
      q => q.createdAt >= thirtyDaysAgo
    );

    this.logger.log(`Cleaned up ${oldReports.length} old reports`);
  }
}