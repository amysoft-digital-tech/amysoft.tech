import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, FindOptionsWhere } from 'typeorm';
import { User } from '../../../entities/user.entity';
import { UserSubscription } from '../../../entities/user-subscription.entity';
import { UserActivity } from '../../../entities/user-activity.entity';
import { Payment } from '../../../entities/payment.entity';
import { CustomerSearchParams } from '../interfaces/admin.interfaces';

@Injectable()
export class CustomerAdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserSubscription)
    private readonly subscriptionRepository: Repository<UserSubscription>,
    @InjectRepository(UserActivity)
    private readonly activityRepository: Repository<UserActivity>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  async searchCustomers(params: CustomerSearchParams): Promise<{
    customers: any[];
    total: number;
  }> {
    const query = this.userRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.subscription', 'subscription');

    // Apply search filters
    if (params.query) {
      query.andWhere(
        '(user.email LIKE :query OR user.firstName LIKE :query OR user.lastName LIKE :query)',
        { query: `%${params.query}%` },
      );
    }

    if (params.email) {
      query.andWhere('user.email = :email', { email: params.email });
    }

    if (params.subscriptionStatus) {
      query.andWhere('subscription.status = :status', { status: params.subscriptionStatus });
    }

    if (params.dateFrom && params.dateTo) {
      query.andWhere('user.createdAt BETWEEN :dateFrom AND :dateTo', {
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
      });
    }

    // Apply sorting
    const sortField = params.sortBy === 'lastActive' ? 'user.lastLogin' :
                     params.sortBy === 'revenue' ? 'subscription.totalRevenue' :
                     'user.createdAt';
    query.orderBy(sortField, params.sortOrder?.toUpperCase() as 'ASC' | 'DESC' || 'DESC');

    // Apply pagination
    if (params.limit) {
      query.limit(params.limit);
    }
    if (params.offset) {
      query.offset(params.offset);
    }

    const [users, total] = await query.getManyAndCount();

    // Enrich with additional data
    const customers = await Promise.all(users.map(async (user) => {
      const recentActivity = await this.getRecentActivity(user.id);
      const totalRevenue = await this.calculateTotalRevenue(user.id);
      const supportTickets = await this.getSupportTicketCount(user.id);

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        subscription: user.subscription ? {
          id: user.subscription.id,
          plan: user.subscription.plan,
          status: user.subscription.status,
          startDate: user.subscription.startDate,
          endDate: user.subscription.endDate,
          autoRenew: user.subscription.autoRenew,
        } : null,
        metrics: {
          totalRevenue,
          supportTickets,
          lastActivity: recentActivity?.timestamp,
          activityCount: recentActivity?.count || 0,
        },
      };
    }));

    return { customers, total };
  }

  async getCustomerDetails(customerId: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: customerId },
      relations: ['subscription'],
    });

    if (!user) {
      throw new NotFoundException('Customer not found');
    }

    const [
      activityHistory,
      paymentHistory,
      totalRevenue,
      supportTickets,
      engagementMetrics,
    ] = await Promise.all([
      this.getActivityHistory(customerId),
      this.getPaymentHistory(customerId),
      this.calculateTotalRevenue(customerId),
      this.getSupportTickets(customerId),
      this.getEngagementMetrics(customerId),
    ]);

    return {
      profile: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        emailVerified: user.emailVerified,
        preferences: user.preferences,
      },
      subscription: user.subscription ? {
        id: user.subscription.id,
        plan: user.subscription.plan,
        status: user.subscription.status,
        startDate: user.subscription.startDate,
        endDate: user.subscription.endDate,
        autoRenew: user.subscription.autoRenew,
        cancelledAt: user.subscription.cancelledAt,
        cancelReason: user.subscription.cancelReason,
      } : null,
      metrics: {
        totalRevenue,
        lifetimeValue: totalRevenue * 1.5, // Simplified LTV calculation
        supportTicketCount: supportTickets.length,
        engagementScore: engagementMetrics.score,
        churnRisk: this.calculateChurnRisk(user, engagementMetrics),
      },
      activity: {
        recent: activityHistory.slice(0, 10),
        summary: engagementMetrics,
      },
      payments: paymentHistory,
      supportHistory: supportTickets,
    };
  }

  async updateCustomerProfile(customerId: string, updates: Partial<User>): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: customerId } });
    
    if (!user) {
      throw new NotFoundException('Customer not found');
    }

    Object.assign(user, updates);
    return this.userRepository.save(user);
  }

  async updateSubscription(customerId: string, updates: {
    plan?: string;
    status?: string;
    endDate?: Date;
    autoRenew?: boolean;
  }): Promise<UserSubscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { userId: customerId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    Object.assign(subscription, updates);
    subscription.updatedAt = new Date();

    return this.subscriptionRepository.save(subscription);
  }

  async cancelSubscription(customerId: string, reason: string): Promise<UserSubscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { userId: customerId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date();
    subscription.cancelReason = reason;
    subscription.autoRenew = false;

    return this.subscriptionRepository.save(subscription);
  }

  private async getRecentActivity(userId: string): Promise<{ timestamp: Date; count: number } | null> {
    const activities = await this.activityRepository.find({
      where: { userId },
      order: { timestamp: 'DESC' },
      take: 1,
    });

    const count = await this.activityRepository.count({ where: { userId } });

    return activities.length > 0 ? {
      timestamp: activities[0].timestamp,
      count,
    } : null;
  }

  private async getActivityHistory(userId: string, limit: number = 50): Promise<UserActivity[]> {
    return this.activityRepository.find({
      where: { userId },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  private async getPaymentHistory(userId: string): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  private async calculateTotalRevenue(userId: string): Promise<number> {
    const payments = await this.paymentRepository.find({
      where: { userId, status: 'completed' },
    });

    return payments.reduce((total, payment) => total + payment.amount, 0);
  }

  private async getSupportTickets(userId: string): Promise<any[]> {
    // In a real implementation, this would query a support ticket system
    // For now, we'll return mock data based on user activity
    const supportActivities = await this.activityRepository.find({
      where: {
        userId,
        activityType: Like('support:%'),
      },
      order: { timestamp: 'DESC' },
    });

    return supportActivities.map(activity => ({
      id: activity.id,
      type: activity.activityType.replace('support:', ''),
      status: activity.metadata?.status || 'resolved',
      createdAt: activity.timestamp,
      subject: activity.metadata?.subject || 'Support Request',
      priority: activity.metadata?.priority || 'normal',
    }));
  }

  private async getSupportTicketCount(userId: string): Promise<number> {
    return this.activityRepository.count({
      where: {
        userId,
        activityType: Like('support:%'),
      },
    });
  }

  private async getEngagementMetrics(userId: string): Promise<{
    score: number;
    lastActive: Date | null;
    totalSessions: number;
    avgSessionDuration: number;
    contentViewed: number;
  }> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activities = await this.activityRepository.find({
      where: {
        userId,
        timestamp: Between(thirtyDaysAgo, new Date()),
      },
    });

    const sessionActivities = activities.filter(a => a.activityType === 'session_start');
    const contentActivities = activities.filter(a => a.activityType.startsWith('content_'));

    const lastActivity = activities.length > 0 ? 
      activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0] : null;

    // Calculate engagement score (0-100)
    const recencyScore = lastActivity ? 
      Math.max(0, 100 - (Date.now() - lastActivity.timestamp.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    const frequencyScore = Math.min(100, sessionActivities.length * 10);
    const depthScore = Math.min(100, contentActivities.length * 5);

    return {
      score: Math.round((recencyScore + frequencyScore + depthScore) / 3),
      lastActive: lastActivity?.timestamp || null,
      totalSessions: sessionActivities.length,
      avgSessionDuration: 15, // Placeholder - would calculate from session data
      contentViewed: contentActivities.length,
    };
  }

  private calculateChurnRisk(user: User, engagement: any): 'low' | 'medium' | 'high' {
    const daysSinceLastLogin = user.lastLogin ? 
      (Date.now() - user.lastLogin.getTime()) / (1000 * 60 * 60 * 24) : 999;
    
    if (daysSinceLastLogin > 30 || engagement.score < 20) {
      return 'high';
    }
    if (daysSinceLastLogin > 14 || engagement.score < 50) {
      return 'medium';
    }
    return 'low';
  }
}