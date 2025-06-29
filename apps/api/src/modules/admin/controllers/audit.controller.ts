import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from '../services/audit.service';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { RequirePermissions } from '../decorators/permissions.decorator';
import { AdminPermission } from '../interfaces/admin.interfaces';

@ApiTags('Admin - Audit & Security')
@ApiBearerAuth()
@Controller('api/admin/audit')
@UseGuards(AdminAuthGuard)
export class AuditController {
  constructor(
    private readonly auditService: AuditService,
  ) {}

  @Get('logs')
  @RequirePermissions(AdminPermission.VIEW_AUDIT_LOGS)
  @ApiOperation({ summary: 'Get audit logs with filters' })
  @ApiResponse({ status: 200, description: 'Audit logs' })
  async getAuditLogs(
    @Query('adminUserId') adminUserId?: string,
    @Query('action') action?: string,
    @Query('resource') resource?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('limit') limit: number = 100,
    @Query('offset') offset: number = 0,
    @Req() req: any,
  ) {
    // Log this audit log access
    await this.auditService.logAdminAction(
      req.adminUser,
      'view_audit_logs',
      'audit',
      undefined,
      { filters: { adminUserId, action, resource, dateFrom, dateTo } },
      req,
    );

    return this.auditService.getAuditLogs({
      adminUserId,
      action,
      resource,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      limit,
      offset,
    });
  }

  @Get('admin/:adminId/activity')
  @RequirePermissions(AdminPermission.VIEW_AUDIT_LOGS)
  @ApiOperation({ summary: 'Get specific admin user activity summary' })
  @ApiResponse({ status: 200, description: 'Admin activity summary' })
  async getAdminActivity(
    @Param('adminId') adminId: string,
    @Query('days') days: number = 30,
    @Req() req: any,
  ) {
    await this.auditService.logAdminAction(
      req.adminUser,
      'view_admin_activity',
      'audit',
      adminId,
      { days },
      req,
    );

    return this.auditService.getAdminActivitySummary(adminId, days);
  }

  @Get('compliance-report')
  @RequirePermissions(AdminPermission.VIEW_AUDIT_LOGS, AdminPermission.EXPORT_REPORTS)
  @ApiOperation({ summary: 'Generate compliance report' })
  @ApiResponse({ status: 200, description: 'Compliance report' })
  async generateComplianceReport(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Query('includeDetails') includeDetails: boolean = false,
    @Req() req: any,
  ) {
    await this.auditService.logAdminAction(
      req.adminUser,
      'generate_compliance_report',
      'audit',
      undefined,
      { dateFrom, dateTo, includeDetails },
      req,
    );

    return this.auditService.generateComplianceReport({
      dateFrom: new Date(dateFrom),
      dateTo: new Date(dateTo),
      includeDetails,
    });
  }

  @Get('security-events')
  @RequirePermissions(AdminPermission.VIEW_AUDIT_LOGS)
  @ApiOperation({ summary: 'Get security-related events' })
  @ApiResponse({ status: 200, description: 'Security events' })
  async getSecurityEvents(
    @Query('severity') severity?: 'low' | 'medium' | 'high' | 'critical',
    @Query('type') type?: string,
    @Query('limit') limit: number = 50,
    @Req() req: any,
  ) {
    await this.auditService.logAdminAction(
      req.adminUser,
      'view_security_events',
      'audit',
      undefined,
      { severity, type, limit },
      req,
    );

    // Filter for security-related actions
    const securityActions = [
      'login_failed',
      'permission_denied',
      'suspicious_activity',
      'data_export',
      'bulk_delete',
      'admin_created',
      'admin_deleted',
      'role_changed',
    ];

    const { logs } = await this.auditService.getAuditLogs({
      action: type || undefined,
      limit,
    });

    // Filter and categorize security events
    const securityEvents = logs
      .filter(log => 
        securityActions.some(action => log.action.includes(action)) ||
        (severity && this.getEventSeverity(log) === severity)
      )
      .map(log => ({
        ...log,
        severity: this.getEventSeverity(log),
        category: this.getEventCategory(log),
      }));

    return {
      events: securityEvents,
      summary: {
        total: securityEvents.length,
        bySeverity: this.groupBySeverity(securityEvents),
        byCategory: this.groupByCategory(securityEvents),
      },
    };
  }

  @Get('access-patterns')
  @RequirePermissions(AdminPermission.VIEW_AUDIT_LOGS)
  @ApiOperation({ summary: 'Analyze admin access patterns' })
  @ApiResponse({ status: 200, description: 'Access pattern analysis' })
  async getAccessPatterns(
    @Query('days') days: number = 7,
    @Req() req: any,
  ) {
    await this.auditService.logAdminAction(
      req.adminUser,
      'view_access_patterns',
      'audit',
      undefined,
      { days },
      req,
    );

    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    const { logs } = await this.auditService.getAuditLogs({
      dateFrom,
      dateTo: new Date(),
    });

    // Analyze patterns
    const patterns = {
      byHour: this.analyzeByHour(logs),
      byDay: this.analyzeByDay(logs),
      byResource: this.analyzeByResource(logs),
      byAdmin: this.analyzeByAdmin(logs),
      unusualActivity: this.detectUnusualActivity(logs),
    };

    return patterns;
  }

  @Get('data-access-report')
  @RequirePermissions(AdminPermission.VIEW_AUDIT_LOGS)
  @ApiOperation({ summary: 'Get sensitive data access report' })
  @ApiResponse({ status: 200, description: 'Data access report' })
  async getDataAccessReport(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Req() req: any,
  ) {
    await this.auditService.logAdminAction(
      req.adminUser,
      'view_data_access_report',
      'audit',
      undefined,
      { dateFrom, dateTo },
      req,
    );

    const { logs } = await this.auditService.getAuditLogs({
      dateFrom: new Date(dateFrom),
      dateTo: new Date(dateTo),
    });

    // Filter for data access actions
    const dataAccessActions = [
      'view_customer',
      'export_customer_data',
      'view_payment_details',
      'export_analytics',
      'bulk_export',
    ];

    const dataAccessLogs = logs.filter(log =>
      dataAccessActions.some(action => log.action.includes(action))
    );

    return {
      period: { from: dateFrom, to: dateTo },
      summary: {
        totalAccess: dataAccessLogs.length,
        uniqueAdmins: new Set(dataAccessLogs.map(l => l.adminUserId)).size,
        sensitiveAccess: dataAccessLogs.filter(l => this.isSensitiveAccess(l)).length,
      },
      byResource: this.groupByResource(dataAccessLogs),
      byAdmin: this.groupByAdmin(dataAccessLogs),
      sensitiveAccess: dataAccessLogs
        .filter(l => this.isSensitiveAccess(l))
        .slice(0, 20),
    };
  }

  private getEventSeverity(log: any): 'low' | 'medium' | 'high' | 'critical' {
    const highSeverityActions = ['delete', 'bulk_delete', 'role_changed'];
    const mediumSeverityActions = ['export', 'update', 'permission_denied'];
    
    if (highSeverityActions.some(a => log.action.includes(a))) return 'high';
    if (mediumSeverityActions.some(a => log.action.includes(a))) return 'medium';
    if (log.action.includes('failed')) return 'medium';
    
    return 'low';
  }

  private getEventCategory(log: any): string {
    if (log.action.includes('customer')) return 'customer_data';
    if (log.action.includes('content')) return 'content_management';
    if (log.action.includes('payment') || log.action.includes('revenue')) return 'financial';
    if (log.action.includes('admin') || log.action.includes('role')) return 'access_control';
    if (log.action.includes('export') || log.action.includes('report')) return 'data_export';
    
    return 'other';
  }

  private groupBySeverity(events: any[]): Record<string, number> {
    return events.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {});
  }

  private groupByCategory(events: any[]): Record<string, number> {
    return events.reduce((acc, event) => {
      acc[event.category] = (acc[event.category] || 0) + 1;
      return acc;
    }, {});
  }

  private analyzeByHour(logs: any[]): Record<number, number> {
    const byHour: Record<number, number> = {};
    
    logs.forEach(log => {
      const hour = new Date(log.timestamp).getHours();
      byHour[hour] = (byHour[hour] || 0) + 1;
    });
    
    return byHour;
  }

  private analyzeByDay(logs: any[]): Record<string, number> {
    const byDay: Record<string, number> = {};
    
    logs.forEach(log => {
      const day = new Date(log.timestamp).toISOString().split('T')[0];
      byDay[day] = (byDay[day] || 0) + 1;
    });
    
    return byDay;
  }

  private analyzeByResource(logs: any[]): Record<string, number> {
    const byResource: Record<string, number> = {};
    
    logs.forEach(log => {
      byResource[log.resource] = (byResource[log.resource] || 0) + 1;
    });
    
    return byResource;
  }

  private analyzeByAdmin(logs: any[]): Record<string, number> {
    const byAdmin: Record<string, number> = {};
    
    logs.forEach(log => {
      const key = `${log.adminEmail} (${log.adminUserId})`;
      byAdmin[key] = (byAdmin[key] || 0) + 1;
    });
    
    return byAdmin;
  }

  private groupByResource(logs: any[]): Record<string, number> {
    return logs.reduce((acc, log) => {
      acc[log.resource] = (acc[log.resource] || 0) + 1;
      return acc;
    }, {});
  }

  private groupByAdmin(logs: any[]): Record<string, { count: number; email: string }> {
    const grouped: Record<string, { count: number; email: string }> = {};
    
    logs.forEach(log => {
      if (!grouped[log.adminUserId]) {
        grouped[log.adminUserId] = { count: 0, email: log.adminEmail };
      }
      grouped[log.adminUserId].count++;
    });
    
    return grouped;
  }

  private detectUnusualActivity(logs: any[]): any[] {
    const unusual: any[] = [];
    
    // Detect high frequency access
    const adminFrequency: Record<string, number> = {};
    const hourlyActivity: Record<string, number> = {};
    
    logs.forEach(log => {
      const hourKey = new Date(log.timestamp).toISOString().substring(0, 13);
      const adminHourKey = `${log.adminUserId}_${hourKey}`;
      
      adminFrequency[log.adminUserId] = (adminFrequency[log.adminUserId] || 0) + 1;
      hourlyActivity[adminHourKey] = (hourlyActivity[adminHourKey] || 0) + 1;
    });
    
    // Flag admins with unusually high activity
    Object.entries(hourlyActivity).forEach(([key, count]) => {
      if (count > 100) { // More than 100 actions per hour
        const [adminId, hour] = key.split('_');
        unusual.push({
          type: 'high_frequency',
          adminUserId: adminId,
          hour,
          count,
          severity: 'medium',
        });
      }
    });
    
    // Detect off-hours access (assuming business hours are 8 AM - 6 PM)
    logs.forEach(log => {
      const hour = new Date(log.timestamp).getHours();
      if (hour < 8 || hour > 18) {
        if (log.action.includes('export') || log.action.includes('delete')) {
          unusual.push({
            type: 'off_hours_sensitive_action',
            log,
            severity: 'high',
          });
        }
      }
    });
    
    return unusual;
  }

  private isSensitiveAccess(log: any): boolean {
    const sensitiveActions = [
      'view_payment',
      'export_customer',
      'view_revenue',
      'bulk_export',
    ];
    
    return sensitiveActions.some(action => log.action.includes(action));
  }
}