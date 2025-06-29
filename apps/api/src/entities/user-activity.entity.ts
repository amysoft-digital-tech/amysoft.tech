import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index
} from 'typeorm';
import { IsEnum, IsString, IsOptional } from 'class-validator';
import { User } from './user.entity';

export enum ActivityType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  REGISTER = 'register',
  PASSWORD_CHANGE = 'password_change',
  EMAIL_CHANGE = 'email_change',
  PROFILE_UPDATE = 'profile_update',
  SUBSCRIPTION_CREATED = 'subscription_created',
  SUBSCRIPTION_UPDATED = 'subscription_updated',
  SUBSCRIPTION_CANCELLED = 'subscription_cancelled',
  PAYMENT_SUCCEEDED = 'payment_succeeded',
  PAYMENT_FAILED = 'payment_failed',
  CONTENT_VIEWED = 'content_viewed',
  CONTENT_DOWNLOADED = 'content_downloaded',
  CONTENT_RATED = 'content_rated',
  CONTENT_SHARED = 'content_shared',
  SEARCH_PERFORMED = 'search_performed',
  EMAIL_VERIFIED = 'email_verified',
  PASSWORD_RESET_REQUESTED = 'password_reset_requested',
  PASSWORD_RESET_COMPLETED = 'password_reset_completed',
  ACCOUNT_SUSPENDED = 'account_suspended',
  ACCOUNT_REACTIVATED = 'account_reactivated',
  SECURITY_ALERT = 'security_alert'
}

@Entity('user_activities')
@Index(['type'])
@Index(['createdAt'])
@Index(['user'])
@Index(['ipAddress'])
export class UserActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ActivityType })
  @IsEnum(ActivityType)
  type: ActivityType;

  @Column()
  @IsString()
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    contentId?: string;
    paymentId?: string;
    subscriptionId?: string;
    searchQuery?: string;
    rating?: number;
    downloadUrl?: string;
    shareMethod?: string;
    oldValue?: any;
    newValue?: any;
    failureReason?: string;
    securityLevel?: 'low' | 'medium' | 'high' | 'critical';
    location?: {
      country?: string;
      region?: string;
      city?: string;
      coordinates?: [number, number];
    };
    device?: {
      type?: string;
      os?: string;
      browser?: string;
      version?: string;
    };
  };

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @Column({ default: false })
  flagged: boolean;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  flaggedReason?: string;

  @CreateDateColumn()
  createdAt: Date;

  // Relationships
  @ManyToOne(() => User, user => user.activities, { onDelete: 'CASCADE' })
  user: User;

  // Virtual properties
  get isSecurityRelated(): boolean {
    return [
      ActivityType.LOGIN,
      ActivityType.PASSWORD_CHANGE,
      ActivityType.EMAIL_CHANGE,
      ActivityType.PASSWORD_RESET_REQUESTED,
      ActivityType.PASSWORD_RESET_COMPLETED,
      ActivityType.SECURITY_ALERT,
      ActivityType.ACCOUNT_SUSPENDED
    ].includes(this.type);
  }

  get isPaymentRelated(): boolean {
    return [
      ActivityType.SUBSCRIPTION_CREATED,
      ActivityType.SUBSCRIPTION_UPDATED,
      ActivityType.SUBSCRIPTION_CANCELLED,
      ActivityType.PAYMENT_SUCCEEDED,
      ActivityType.PAYMENT_FAILED
    ].includes(this.type);
  }

  get isContentRelated(): boolean {
    return [
      ActivityType.CONTENT_VIEWED,
      ActivityType.CONTENT_DOWNLOADED,
      ActivityType.CONTENT_RATED,
      ActivityType.CONTENT_SHARED
    ].includes(this.type);
  }

  // Methods
  static createLoginActivity(user: User, ipAddress?: string, userAgent?: string): UserActivity {
    const activity = new UserActivity();
    activity.user = user;
    activity.type = ActivityType.LOGIN;
    activity.description = `User logged in`;
    activity.ipAddress = ipAddress;
    activity.userAgent = userAgent;
    activity.metadata = {
      device: activity.parseUserAgent(userAgent)
    };
    return activity;
  }

  static createLogoutActivity(user: User): UserActivity {
    const activity = new UserActivity();
    activity.user = user;
    activity.type = ActivityType.LOGOUT;
    activity.description = `User logged out`;
    return activity;
  }

  static createPasswordChangeActivity(user: User): UserActivity {
    const activity = new UserActivity();
    activity.user = user;
    activity.type = ActivityType.PASSWORD_CHANGE;
    activity.description = `User changed password`;
    return activity;
  }

  static createContentViewActivity(user: User, contentId: string, contentTitle: string): UserActivity {
    const activity = new UserActivity();
    activity.user = user;
    activity.type = ActivityType.CONTENT_VIEWED;
    activity.description = `Viewed content: ${contentTitle}`;
    activity.metadata = { contentId };
    return activity;
  }

  static createPaymentActivity(
    user: User, 
    paymentId: string, 
    amount: number, 
    status: 'succeeded' | 'failed'
  ): UserActivity {
    const activity = new UserActivity();
    activity.user = user;
    activity.type = status === 'succeeded' ? ActivityType.PAYMENT_SUCCEEDED : ActivityType.PAYMENT_FAILED;
    activity.description = `Payment ${status}: $${amount}`;
    activity.metadata = { paymentId };
    return activity;
  }

  static createSecurityAlert(
    user: User, 
    alertType: string, 
    severity: 'low' | 'medium' | 'high' | 'critical',
    details?: any
  ): UserActivity {
    const activity = new UserActivity();
    activity.user = user;
    activity.type = ActivityType.SECURITY_ALERT;
    activity.description = `Security alert: ${alertType}`;
    activity.metadata = {
      securityLevel: severity,
      ...details
    };
    activity.flagged = severity === 'high' || severity === 'critical';
    return activity;
  }

  private parseUserAgent(userAgent?: string): any {
    if (!userAgent) return null;

    // Simple user agent parsing (in production, use a proper library like ua-parser-js)
    const device = {
      type: 'unknown',
      os: 'unknown',
      browser: 'unknown',
      version: 'unknown'
    };

    // Detect mobile vs desktop
    if (/Mobile|Android|iPhone|iPad/i.test(userAgent)) {
      device.type = 'mobile';
    } else {
      device.type = 'desktop';
    }

    // Detect OS
    if (/Windows/i.test(userAgent)) {
      device.os = 'Windows';
    } else if (/Mac OS/i.test(userAgent)) {
      device.os = 'macOS';
    } else if (/Linux/i.test(userAgent)) {
      device.os = 'Linux';
    } else if (/Android/i.test(userAgent)) {
      device.os = 'Android';
    } else if (/iPhone|iPad/i.test(userAgent)) {
      device.os = 'iOS';
    }

    // Detect browser
    if (/Chrome/i.test(userAgent)) {
      device.browser = 'Chrome';
    } else if (/Firefox/i.test(userAgent)) {
      device.browser = 'Firefox';
    } else if (/Safari/i.test(userAgent)) {
      device.browser = 'Safari';
    } else if (/Edge/i.test(userAgent)) {
      device.browser = 'Edge';
    }

    return device;
  }

  markAsFlagged(reason: string): void {
    this.flagged = true;
    this.flaggedReason = reason;
  }

  clearFlag(): void {
    this.flagged = false;
    this.flaggedReason = undefined;
  }

  toAnalyticsEvent() {
    return {
      eventType: this.type,
      userId: this.user.id,
      timestamp: this.createdAt,
      metadata: this.metadata,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent
    };
  }
}