import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface AuditEvent {
  id: string;
  timestamp: Date;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  result: 'success' | 'failure' | 'partial';
  errorMessage?: string;
  severity: AuditSeverity;
  category: AuditCategory;
  tags: string[];
}

export enum AuditAction {
  // Authentication actions
  LOGIN = 'login',
  LOGOUT = 'logout',
  LOGIN_FAILED = 'login_failed',
  PASSWORD_CHANGED = 'password_changed',
  MFA_ENABLED = 'mfa_enabled',
  MFA_DISABLED = 'mfa_disabled',
  
  // User management actions
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
  USER_ROLE_CHANGED = 'user_role_changed',
  USER_PERMISSIONS_CHANGED = 'user_permissions_changed',
  USER_LOCKED = 'user_locked',
  USER_UNLOCKED = 'user_unlocked',
  
  // Content management actions
  CONTENT_CREATED = 'content_created',
  CONTENT_UPDATED = 'content_updated',
  CONTENT_DELETED = 'content_deleted',
  CONTENT_PUBLISHED = 'content_published',
  CONTENT_UNPUBLISHED = 'content_unpublished',
  
  // Data access actions
  DATA_VIEWED = 'data_viewed',
  DATA_EXPORTED = 'data_exported',
  DATA_IMPORTED = 'data_imported',
  REPORT_GENERATED = 'report_generated',
  
  // System administration actions
  SETTINGS_CHANGED = 'settings_changed',
  BACKUP_CREATED = 'backup_created',
  BACKUP_RESTORED = 'backup_restored',
  SYSTEM_MAINTENANCE = 'system_maintenance',
  
  // Security actions
  SECURITY_INCIDENT = 'security_incident',
  ACCESS_DENIED = 'access_denied',
  PRIVILEGE_ESCALATION_ATTEMPT = 'privilege_escalation_attempt',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  
  // Compliance actions
  GDPR_REQUEST = 'gdpr_request',
  DATA_RETENTION_APPLIED = 'data_retention_applied',
  COMPLIANCE_REVIEW = 'compliance_review',
  AUDIT_PERFORMED = 'audit_performed'
}

export enum AuditSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum AuditCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATA_ACCESS = 'data_access',
  DATA_MODIFICATION = 'data_modification',
  SYSTEM_ADMIN = 'system_admin',
  SECURITY = 'security',
  COMPLIANCE = 'compliance',
  USER_MANAGEMENT = 'user_management',
  CONTENT_MANAGEMENT = 'content_management'
}

export interface AuditQuery {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  action?: AuditAction;
  resource?: string;
  category?: AuditCategory;
  severity?: AuditSeverity;
  result?: 'success' | 'failure' | 'partial';
  limit?: number;
  offset?: number;
}

export interface AuditSummary {
  totalEvents: number;
  eventsByAction: Record<string, number>;
  eventsByCategory: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  eventsByResult: Record<string, number>;
  topUsers: Array<{ userId: string; userEmail: string; eventCount: number }>;
  topResources: Array<{ resource: string; eventCount: number }>;
  timeRange: { start: Date; end: Date };
}

@Injectable()
export class AuditLoggerService {
  private readonly logger = new Logger(AuditLoggerService.name);
  private auditEvents: AuditEvent[] = [];
  private readonly maxEventsInMemory = 50000;

  constructor(private configService: ConfigService) {
    this.startAuditMaintenance();
  }

  async logEvent(
    action: AuditAction,
    resource: string,
    details: any,
    userId?: string,
    userEmail?: string,
    userRole?: string,
    resourceId?: string,
    ipAddress?: string,
    userAgent?: string,
    sessionId?: string
  ): Promise<string> {
    const event: AuditEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      userId,
      userEmail,
      userRole,
      action,
      resource,
      resourceId,
      details: this.sanitizeDetails(details),
      ipAddress,
      userAgent,
      sessionId,
      result: 'success',
      severity: this.determineSeverity(action),
      category: this.determineCategory(action),
      tags: this.generateTags(action, resource, details)
    };

    this.auditEvents.push(event);

    // Maintain memory limit
    if (this.auditEvents.length > this.maxEventsInMemory) {
      this.auditEvents = this.auditEvents.slice(-this.maxEventsInMemory);
    }

    this.logger.log(`Audit event logged: ${action} on ${resource} by ${userEmail || 'system'}`);

    // In production, this would also write to persistent storage
    await this.persistEvent(event);

    return event.id;
  }

  async logFailure(
    action: AuditAction,
    resource: string,
    errorMessage: string,
    details: any,
    userId?: string,
    userEmail?: string,
    userRole?: string,
    resourceId?: string,
    ipAddress?: string,
    userAgent?: string,
    sessionId?: string
  ): Promise<string> {
    const event: AuditEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      userId,
      userEmail,
      userRole,
      action,
      resource,
      resourceId,
      details: this.sanitizeDetails(details),
      ipAddress,
      userAgent,
      sessionId,
      result: 'failure',
      errorMessage,
      severity: this.determineSeverity(action, true),
      category: this.determineCategory(action),
      tags: this.generateTags(action, resource, details, ['failure'])
    };

    this.auditEvents.push(event);

    if (this.auditEvents.length > this.maxEventsInMemory) {
      this.auditEvents = this.auditEvents.slice(-this.maxEventsInMemory);
    }

    this.logger.warn(`Audit failure logged: ${action} on ${resource} by ${userEmail || 'system'}: ${errorMessage}`);

    await this.persistEvent(event);

    return event.id;
  }

  async queryEvents(query: AuditQuery): Promise<AuditEvent[]> {
    let filteredEvents = [...this.auditEvents];

    // Apply filters
    if (query.startDate) {
      filteredEvents = filteredEvents.filter(e => e.timestamp >= query.startDate!);
    }

    if (query.endDate) {
      filteredEvents = filteredEvents.filter(e => e.timestamp <= query.endDate!);
    }

    if (query.userId) {
      filteredEvents = filteredEvents.filter(e => e.userId === query.userId);
    }

    if (query.action) {
      filteredEvents = filteredEvents.filter(e => e.action === query.action);
    }

    if (query.resource) {
      filteredEvents = filteredEvents.filter(e => e.resource === query.resource);
    }

    if (query.category) {
      filteredEvents = filteredEvents.filter(e => e.category === query.category);
    }

    if (query.severity) {
      filteredEvents = filteredEvents.filter(e => e.severity === query.severity);
    }

    if (query.result) {
      filteredEvents = filteredEvents.filter(e => e.result === query.result);
    }

    // Sort by timestamp descending
    filteredEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 1000;

    return filteredEvents.slice(offset, offset + limit);
  }

  async generateSummary(startDate: Date, endDate: Date): Promise<AuditSummary> {
    const events = await this.queryEvents({ startDate, endDate });

    const summary: AuditSummary = {
      totalEvents: events.length,
      eventsByAction: {},
      eventsByCategory: {},
      eventsBySeverity: {},
      eventsByResult: {},
      topUsers: [],
      topResources: [],
      timeRange: { start: startDate, end: endDate }
    };

    // Count events by various dimensions
    const userCounts = new Map<string, { userId: string; userEmail: string; count: number }>();
    const resourceCounts = new Map<string, number>();

    events.forEach(event => {
      // By action
      summary.eventsByAction[event.action] = (summary.eventsByAction[event.action] || 0) + 1;

      // By category
      summary.eventsByCategory[event.category] = (summary.eventsByCategory[event.category] || 0) + 1;

      // By severity
      summary.eventsBySeverity[event.severity] = (summary.eventsBySeverity[event.severity] || 0) + 1;

      // By result
      summary.eventsByResult[event.result] = (summary.eventsByResult[event.result] || 0) + 1;

      // User counts
      if (event.userId && event.userEmail) {
        const userKey = `${event.userId}:${event.userEmail}`;
        const existing = userCounts.get(userKey);
        if (existing) {
          existing.count++;
        } else {
          userCounts.set(userKey, {
            userId: event.userId,
            userEmail: event.userEmail,
            count: 1
          });
        }
      }

      // Resource counts
      resourceCounts.set(event.resource, (resourceCounts.get(event.resource) || 0) + 1);
    });

    // Top users
    summary.topUsers = Array.from(userCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(u => ({ userId: u.userId, userEmail: u.userEmail, eventCount: u.count }));

    // Top resources
    summary.topResources = Array.from(resourceCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([resource, count]) => ({ resource, eventCount: count }));

    return summary;
  }

  async exportAuditLog(
    query: AuditQuery,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    const events = await this.queryEvents(query);

    if (format === 'csv') {
      return this.exportAsCSV(events);
    } else {
      return JSON.stringify(events, null, 2);
    }
  }

  async searchEvents(searchTerm: string, limit: number = 100): Promise<AuditEvent[]> {
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return this.auditEvents
      .filter(event => {
        return (
          event.action.toLowerCase().includes(lowerSearchTerm) ||
          event.resource.toLowerCase().includes(lowerSearchTerm) ||
          (event.userEmail && event.userEmail.toLowerCase().includes(lowerSearchTerm)) ||
          (event.details && JSON.stringify(event.details).toLowerCase().includes(lowerSearchTerm)) ||
          event.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm))
        );
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async getComplianceReport(frameworkType: 'gdpr' | 'sox' | 'hipaa' | 'pci'): Promise<any> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const events = await this.queryEvents({
      startDate: thirtyDaysAgo,
      endDate: now
    });

    const report: any = {
      framework: frameworkType,
      period: { start: thirtyDaysAgo, end: now },
      summary: {
        totalEvents: events.length,
        securityEvents: 0,
        dataAccessEvents: 0,
        adminEvents: 0,
        failedEvents: 0
      },
      findings: [],
      recommendations: []
    };

    // Analyze events for compliance requirements
    events.forEach(event => {
      if (event.category === AuditCategory.SECURITY) {
        report.summary.securityEvents++;
      }
      if (event.category === AuditCategory.DATA_ACCESS) {
        report.summary.dataAccessEvents++;
      }
      if (event.category === AuditCategory.SYSTEM_ADMIN) {
        report.summary.adminEvents++;
      }
      if (event.result === 'failure') {
        report.summary.failedEvents++;
      }
    });

    // Generate framework-specific findings
    switch (frameworkType) {
      case 'gdpr':
        report.findings = this.generateGDPRFindings(events);
        break;
      case 'sox':
        report.findings = this.generateSOXFindings(events);
        break;
      case 'hipaa':
        report.findings = this.generateHIPAAFindings(events);
        break;
      case 'pci':
        report.findings = this.generatePCIFindings(events);
        break;
    }

    return report;
  }

  private generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  private sanitizeDetails(details: any): any {
    if (!details) return details;

    // Remove sensitive information from details
    const sanitized = JSON.parse(JSON.stringify(details));
    
    // Remove password fields
    if (sanitized.password) delete sanitized.password;
    if (sanitized.oldPassword) delete sanitized.oldPassword;
    if (sanitized.newPassword) delete sanitized.newPassword;
    
    // Truncate very large fields
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string' && sanitized[key].length > 1000) {
        sanitized[key] = sanitized[key].substring(0, 1000) + '... [truncated]';
      }
    });

    return sanitized;
  }

  private determineSeverity(action: AuditAction, isFailure: boolean = false): AuditSeverity {
    if (isFailure) {
      // Failures are generally more severe
      switch (action) {
        case AuditAction.LOGIN_FAILED:
        case AuditAction.ACCESS_DENIED:
          return AuditSeverity.MEDIUM;
        case AuditAction.PRIVILEGE_ESCALATION_ATTEMPT:
        case AuditAction.SECURITY_INCIDENT:
          return AuditSeverity.CRITICAL;
        default:
          return AuditSeverity.HIGH;
      }
    }

    switch (action) {
      case AuditAction.LOGIN:
      case AuditAction.LOGOUT:
      case AuditAction.DATA_VIEWED:
        return AuditSeverity.LOW;
      
      case AuditAction.USER_CREATED:
      case AuditAction.USER_UPDATED:
      case AuditAction.CONTENT_CREATED:
      case AuditAction.CONTENT_UPDATED:
      case AuditAction.SETTINGS_CHANGED:
        return AuditSeverity.MEDIUM;
      
      case AuditAction.USER_DELETED:
      case AuditAction.USER_ROLE_CHANGED:
      case AuditAction.CONTENT_DELETED:
      case AuditAction.PASSWORD_CHANGED:
      case AuditAction.MFA_DISABLED:
        return AuditSeverity.HIGH;
      
      case AuditAction.SECURITY_INCIDENT:
      case AuditAction.PRIVILEGE_ESCALATION_ATTEMPT:
      case AuditAction.BACKUP_RESTORED:
        return AuditSeverity.CRITICAL;
      
      default:
        return AuditSeverity.MEDIUM;
    }
  }

  private determineCategory(action: AuditAction): AuditCategory {
    switch (action) {
      case AuditAction.LOGIN:
      case AuditAction.LOGOUT:
      case AuditAction.LOGIN_FAILED:
      case AuditAction.PASSWORD_CHANGED:
      case AuditAction.MFA_ENABLED:
      case AuditAction.MFA_DISABLED:
        return AuditCategory.AUTHENTICATION;
      
      case AuditAction.ACCESS_DENIED:
      case AuditAction.PRIVILEGE_ESCALATION_ATTEMPT:
        return AuditCategory.AUTHORIZATION;
      
      case AuditAction.DATA_VIEWED:
      case AuditAction.DATA_EXPORTED:
      case AuditAction.REPORT_GENERATED:
        return AuditCategory.DATA_ACCESS;
      
      case AuditAction.CONTENT_CREATED:
      case AuditAction.CONTENT_UPDATED:
      case AuditAction.CONTENT_DELETED:
      case AuditAction.DATA_IMPORTED:
        return AuditCategory.DATA_MODIFICATION;
      
      case AuditAction.USER_CREATED:
      case AuditAction.USER_UPDATED:
      case AuditAction.USER_DELETED:
      case AuditAction.USER_ROLE_CHANGED:
      case AuditAction.USER_PERMISSIONS_CHANGED:
      case AuditAction.USER_LOCKED:
      case AuditAction.USER_UNLOCKED:
        return AuditCategory.USER_MANAGEMENT;
      
      case AuditAction.SETTINGS_CHANGED:
      case AuditAction.BACKUP_CREATED:
      case AuditAction.BACKUP_RESTORED:
      case AuditAction.SYSTEM_MAINTENANCE:
        return AuditCategory.SYSTEM_ADMIN;
      
      case AuditAction.SECURITY_INCIDENT:
      case AuditAction.SUSPICIOUS_ACTIVITY:
        return AuditCategory.SECURITY;
      
      case AuditAction.GDPR_REQUEST:
      case AuditAction.DATA_RETENTION_APPLIED:
      case AuditAction.COMPLIANCE_REVIEW:
      case AuditAction.AUDIT_PERFORMED:
        return AuditCategory.COMPLIANCE;
      
      default:
        return AuditCategory.SYSTEM_ADMIN;
    }
  }

  private generateTags(action: AuditAction, resource: string, details: any, additionalTags: string[] = []): string[] {
    const tags = [...additionalTags];
    
    // Add action-based tags
    tags.push(action);
    tags.push(resource);
    
    // Add detail-based tags
    if (details) {
      if (details.method) tags.push(details.method.toLowerCase());
      if (details.userAgent && details.userAgent.includes('Mobile')) tags.push('mobile');
      if (details.adminAction) tags.push('admin-action');
    }
    
    return tags;
  }

  private exportAsCSV(events: AuditEvent[]): string {
    const headers = [
      'Timestamp', 'User Email', 'Action', 'Resource', 'Result', 
      'Severity', 'Category', 'IP Address', 'Details'
    ];
    
    const rows = events.map(event => [
      event.timestamp.toISOString(),
      event.userEmail || '',
      event.action,
      event.resource,
      event.result,
      event.severity,
      event.category,
      event.ipAddress || '',
      JSON.stringify(event.details).replace(/"/g, '""')
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    return csvContent;
  }

  private generateGDPRFindings(events: AuditEvent[]): any[] {
    const findings = [];
    
    // Check for data access without proper justification
    const dataAccessEvents = events.filter(e => e.category === AuditCategory.DATA_ACCESS);
    if (dataAccessEvents.length > 1000) {
      findings.push({
        type: 'data_access_volume',
        severity: 'medium',
        description: 'High volume of data access events detected',
        count: dataAccessEvents.length
      });
    }
    
    return findings;
  }

  private generateSOXFindings(events: AuditEvent[]): any[] {
    const findings = [];
    
    // Check for administrative changes without approval
    const adminEvents = events.filter(e => e.category === AuditCategory.SYSTEM_ADMIN);
    findings.push({
      type: 'admin_changes',
      severity: 'low',
      description: 'Administrative changes require documented approval',
      count: adminEvents.length
    });
    
    return findings;
  }

  private generateHIPAAFindings(events: AuditEvent[]): any[] {
    return []; // Placeholder for HIPAA-specific findings
  }

  private generatePCIFindings(events: AuditEvent[]): any[] {
    return []; // Placeholder for PCI-specific findings
  }

  private async persistEvent(event: AuditEvent): Promise<void> {
    // In production, this would write to database, file, or external logging service
    // For now, we just keep events in memory
  }

  private startAuditMaintenance(): void {
    // Clean up old events periodically
    setInterval(() => {
      const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days
      const originalLength = this.auditEvents.length;
      
      this.auditEvents = this.auditEvents.filter(event => event.timestamp > cutoff);
      
      const cleaned = originalLength - this.auditEvents.length;
      if (cleaned > 0) {
        this.logger.log(`Cleaned up ${cleaned} old audit events`);
      }
    }, 24 * 60 * 60 * 1000); // Daily
  }
}