import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index
} from 'typeorm';
import { IsEnum, IsString, IsOptional, IsBoolean } from 'class-validator';
import { User } from './user.entity';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CANCELLED = 'cancelled',
  PAST_DUE = 'past_due',
  TRIAL = 'trial',
  PAUSED = 'paused'
}

export enum SubscriptionPlan {
  FREE = 'free',
  BASIC = 'basic',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise'
}

export enum BillingCycle {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  LIFETIME = 'lifetime'
}

@Entity('user_subscriptions')
@Index(['status'])
@Index(['planId'])
@Index(['stripeSubscriptionId'], { unique: true, where: 'stripe_subscription_id IS NOT NULL' })
@Index(['currentPeriodEnd'])
@Index(['user'])
export class UserSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsString()
  planId: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  stripeSubscriptionId?: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  stripeCustomerId?: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  stripePriceId?: string;

  @Column({ type: 'enum', enum: SubscriptionStatus, default: SubscriptionStatus.INACTIVE })
  @IsEnum(SubscriptionStatus)
  status: SubscriptionStatus;

  @Column({ type: 'enum', enum: SubscriptionPlan, default: SubscriptionPlan.FREE })
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;

  @Column({ type: 'enum', enum: BillingCycle, default: BillingCycle.MONTHLY })
  @IsEnum(BillingCycle)
  billingCycle: BillingCycle;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column()
  startDate: Date;

  @Column({ nullable: true })
  @IsOptional()
  endDate?: Date;

  @Column({ nullable: true })
  @IsOptional()
  trialEndDate?: Date;

  @Column()
  currentPeriodStart: Date;

  @Column()
  currentPeriodEnd: Date;

  @Column({ default: true })
  @IsBoolean()
  autoRenew: boolean;

  @Column({ default: false })
  @IsBoolean()
  cancelAtPeriodEnd: boolean;

  @Column({ nullable: true })
  @IsOptional()
  cancelledAt?: Date;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  cancellationReason?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    features?: string[];
    limits?: {
      contentAccess?: string[];
      maxDownloads?: number;
      supportLevel?: string;
    };
    discounts?: {
      code?: string;
      amount?: number;
      type?: 'percentage' | 'fixed';
    };
    upgradeHistory?: {
      fromPlan: string;
      toPlan: string;
      date: Date;
      reason?: string;
    }[];
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @OneToOne(() => User, user => user.subscription)
  @JoinColumn()
  user: User;

  // Virtual properties
  get isActive(): boolean {
    return this.status === SubscriptionStatus.ACTIVE && 
           this.currentPeriodEnd > new Date();
  }

  get isTrialing(): boolean {
    return this.status === SubscriptionStatus.TRIAL && 
           this.trialEndDate && this.trialEndDate > new Date();
  }

  get isPastDue(): boolean {
    return this.status === SubscriptionStatus.PAST_DUE;
  }

  get isCancelled(): boolean {
    return this.status === SubscriptionStatus.CANCELLED || !!this.cancelledAt;
  }

  get daysUntilRenewal(): number {
    const today = new Date();
    const renewalDate = this.currentPeriodEnd;
    const diffTime = renewalDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get isNearExpiry(): boolean {
    return this.daysUntilRenewal <= 7;
  }

  // Methods
  activate(): void {
    this.status = SubscriptionStatus.ACTIVE;
    if (!this.startDate) {
      this.startDate = new Date();
    }
  }

  cancel(reason?: string): void {
    this.status = SubscriptionStatus.CANCELLED;
    this.cancelledAt = new Date();
    this.cancellationReason = reason;
    this.autoRenew = false;
  }

  pause(): void {
    this.status = SubscriptionStatus.PAUSED;
    this.autoRenew = false;
  }

  resume(): void {
    if (this.status === SubscriptionStatus.PAUSED) {
      this.status = SubscriptionStatus.ACTIVE;
      this.autoRenew = true;
    }
  }

  markAsPastDue(): void {
    this.status = SubscriptionStatus.PAST_DUE;
  }

  renew(periodLength: number = 30): void {
    const now = new Date();
    this.currentPeriodStart = now;
    this.currentPeriodEnd = new Date(now.getTime() + (periodLength * 24 * 60 * 60 * 1000));
    
    if (this.status !== SubscriptionStatus.ACTIVE) {
      this.status = SubscriptionStatus.ACTIVE;
    }
  }

  upgrade(newPlan: SubscriptionPlan, newPrice: number): void {
    const oldPlan = this.plan;
    
    this.plan = newPlan;
    this.price = newPrice;
    
    // Track upgrade history
    if (!this.metadata) this.metadata = {};
    if (!this.metadata.upgradeHistory) this.metadata.upgradeHistory = [];
    
    this.metadata.upgradeHistory.push({
      fromPlan: oldPlan,
      toPlan: newPlan,
      date: new Date(),
      reason: 'user_upgrade'
    });
  }

  downgrade(newPlan: SubscriptionPlan, newPrice: number): void {
    const oldPlan = this.plan;
    
    this.plan = newPlan;
    this.price = newPrice;
    
    // Track downgrade history
    if (!this.metadata) this.metadata = {};
    if (!this.metadata.upgradeHistory) this.metadata.upgradeHistory = [];
    
    this.metadata.upgradeHistory.push({
      fromPlan: oldPlan,
      toPlan: newPlan,
      date: new Date(),
      reason: 'user_downgrade'
    });
  }

  updateFromStripeSubscription(stripeSubscription: any): void {
    this.stripeSubscriptionId = stripeSubscription.id;
    this.stripeCustomerId = stripeSubscription.customer;
    this.stripePriceId = stripeSubscription.items.data[0]?.price?.id;
    
    this.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
    this.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
    
    if (stripeSubscription.trial_end) {
      this.trialEndDate = new Date(stripeSubscription.trial_end * 1000);
    }

    this.cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end;
    
    if (stripeSubscription.canceled_at) {
      this.cancelledAt = new Date(stripeSubscription.canceled_at * 1000);
    }

    // Map Stripe status to our status
    switch (stripeSubscription.status) {
      case 'active':
        this.status = SubscriptionStatus.ACTIVE;
        break;
      case 'trialing':
        this.status = SubscriptionStatus.TRIAL;
        break;
      case 'past_due':
        this.status = SubscriptionStatus.PAST_DUE;
        break;
      case 'canceled':
      case 'unpaid':
        this.status = SubscriptionStatus.CANCELLED;
        break;
      case 'paused':
        this.status = SubscriptionStatus.PAUSED;
        break;
      default:
        this.status = SubscriptionStatus.INACTIVE;
    }
  }

  hasFeature(feature: string): boolean {
    return this.metadata?.features?.includes(feature) || false;
  }

  getFeatureLimit(limitType: string): number | undefined {
    return this.metadata?.limits?.[limitType];
  }

  canAccessContent(contentType: string): boolean {
    if (this.plan === SubscriptionPlan.FREE) {
      return contentType === 'free';
    }
    
    if (this.plan === SubscriptionPlan.BASIC) {
      return ['free', 'basic'].includes(contentType);
    }
    
    if (this.plan === SubscriptionPlan.PREMIUM) {
      return ['free', 'basic', 'premium'].includes(contentType);
    }
    
    if (this.plan === SubscriptionPlan.ENTERPRISE) {
      return true; // Access to all content
    }
    
    return false;
  }

  toJSON() {
    return {
      id: this.id,
      planId: this.planId,
      status: this.status,
      plan: this.plan,
      billingCycle: this.billingCycle,
      price: this.price,
      currency: this.currency,
      startDate: this.startDate,
      endDate: this.endDate,
      currentPeriodEnd: this.currentPeriodEnd,
      autoRenew: this.autoRenew,
      isActive: this.isActive,
      isTrialing: this.isTrialing,
      daysUntilRenewal: this.daysUntilRenewal,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}