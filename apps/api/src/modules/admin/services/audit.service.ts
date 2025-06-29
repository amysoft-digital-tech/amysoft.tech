import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { UserActivity } from '../../../entities/user-activity.entity';
import { AuditLog, AdminUser } from '../interfaces/admin.interfaces';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(UserActivity)
    private readonly userActivityRepository: Repository<UserActivity>,
  ) {}

  async logAdminAction(
    adminUser: AdminUser,
    action: string,
    resource: string,
    resourceId?: string,
    details?: Record<string, any>,
    request?: any,
  ): Promise<void> {
    const auditEntry = this.userActivityRepository.create({
      userId: adminUser.id,
      activityType: `admin:${action}`,
      metadata: {
        adminEmail: adminUser.email,
        adminRole: adminUser.role,
        resource,
        resourceId,
        details,
        ipAddress: request?.ip || 'unknown',
        userAgent: request?.headers?.['user-agent'] || 'unknown',
      },
      timestamp: new Date(),
    });

    await this.userActivityRepository.save(auditEntry);
  }

  async getAuditLogs(params: {
    adminUserId?: string;
    action?: string;
    resource?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: AuditLog[]; total: number }> {
    const query = this.userActivityRepository.createQueryBuilder('activity')
      .where('activity.activityType LIKE :pattern', { pattern: 'admin:%' });

    if (params.adminUserId) {
      query.andWhere('activity.userId = :userId', { userId: params.adminUserId });
    }

    if (params.action) {
      query.andWhere('activity.activityType = :type', { type: `admin:${params.action}` });
    }

    if (params.resource) {
      query.andWhere('activity.metadata->\'resource\' = :resource', { resource: params.resource });
    }

    if (params.dateFrom && params.dateTo) {
      query.andWhere('activity.timestamp BETWEEN :dateFrom AND :dateTo', {
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
      });
    }

    query.orderBy('activity.timestamp', 'DESC');

    if (params.limit) {
      query.limit(params.limit);
    }

    if (params.offset) {
      query.offset(params.offset);
    }

    const [activities, total] = await query.getManyAndCount();

    const logs: AuditLog[] = activities.map(activity => ({
      id: activity.id,
      adminUserId: activity.userId,
      adminEmail: activity.metadata?.adminEmail || 'unknown',
      action: activity.activityType.replace('admin:', ''),
      resource: activity.metadata?.resource || 'unknown',
      resourceId: activity.metadata?.resourceId,
      details: activity.metadata?.details || {},
      ipAddress: activity.metadata?.ipAddress || 'unknown',
      userAgent: activity.metadata?.userAgent || 'unknown',
      timestamp: activity.timestamp,
    }));

    return { logs, total };
  }

  async getAdminActivitySummary(adminUserId: string, days: number = 30): Promise<{
    totalActions: number;
    actionsByType: Record<string, number>;
    recentActions: AuditLog[];
  }> {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    const activities = await this.userActivityRepository.find({
      where: {
        userId: adminUserId,
        activityType: Like('admin:%'),
        timestamp: Between(dateFrom, new Date()),
      },
      order: { timestamp: 'DESC' },
    });

    const actionsByType: Record<string, number> = {};
    activities.forEach(activity => {
      const action = activity.activityType.replace('admin:', '');
      actionsByType[action] = (actionsByType[action] || 0) + 1;
    });

    const recentActions = activities.slice(0, 10).map(activity => ({
      id: activity.id,
      adminUserId: activity.userId,
      adminEmail: activity.metadata?.adminEmail || 'unknown',
      action: activity.activityType.replace('admin:', ''),
      resource: activity.metadata?.resource || 'unknown',
      resourceId: activity.metadata?.resourceId,
      details: activity.metadata?.details || {},
      ipAddress: activity.metadata?.ipAddress || 'unknown',
      userAgent: activity.metadata?.userAgent || 'unknown',
      timestamp: activity.timestamp,
    }));

    return {
      totalActions: activities.length,
      actionsByType,
      recentActions,
    };
  }

  async generateComplianceReport(params: {
    dateFrom: Date;
    dateTo: Date;
    includeDetails?: boolean;
  }): Promise<{
    period: { from: Date; to: Date };
    summary: {
      totalActions: number;
      uniqueAdmins: number;
      actionBreakdown: Record<string, number>;
      resourceBreakdown: Record<string, number>;
    };
    details?: AuditLog[];
  }> {
    const activities = await this.userActivityRepository.find({
      where: {
        activityType: Like('admin:%'),
        timestamp: Between(params.dateFrom, params.dateTo),
      },
      order: { timestamp: 'DESC' },
    });

    const uniqueAdmins = new Set(activities.map(a => a.userId)).size;
    const actionBreakdown: Record<string, number> = {};
    const resourceBreakdown: Record<string, number> = {};

    activities.forEach(activity => {
      const action = activity.activityType.replace('admin:', '');
      const resource = activity.metadata?.resource || 'unknown';
      
      actionBreakdown[action] = (actionBreakdown[action] || 0) + 1;
      resourceBreakdown[resource] = (resourceBreakdown[resource] || 0) + 1;
    });

    const report: any = {
      period: { from: params.dateFrom, to: params.dateTo },
      summary: {
        totalActions: activities.length,
        uniqueAdmins,
        actionBreakdown,
        resourceBreakdown,
      },
    };

    if (params.includeDetails) {
      report.details = activities.map(activity => ({
        id: activity.id,
        adminUserId: activity.userId,
        adminEmail: activity.metadata?.adminEmail || 'unknown',
        action: activity.activityType.replace('admin:', ''),
        resource: activity.metadata?.resource || 'unknown',
        resourceId: activity.metadata?.resourceId,
        details: activity.metadata?.details || {},
        ipAddress: activity.metadata?.ipAddress || 'unknown',
        userAgent: activity.metadata?.userAgent || 'unknown',
        timestamp: activity.timestamp,
      }));
    }

    return report;
  }
}