import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface Subscription {
  id: string;
  userId: string;
  customerId: string; // Stripe customer ID
  subscriptionId: string; // Stripe subscription ID
  status: SubscriptionStatus;
  tier: SubscriptionTier;
  billingCycle: BillingCycle;
  amount: number;
  currency: string;
  taxRate?: number;
  discountCode?: string;
  discountAmount?: number;
  trialStart?: Date;
  trialEnd?: Date;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  nextBillingDate: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  cancellationReason?: string;
  pausedAt?: Date;
  pauseReason?: string;
  resumedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  paymentMethod: PaymentMethodInfo;
  billing: BillingInfo;
  usage: UsageMetrics;
  modifications: SubscriptionModification[];
  renewals: SubscriptionRenewal[];
  credits: SubscriptionCredit[];
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  TRIALING = 'trialing',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  UNPAID = 'unpaid',
  PAUSED = 'paused',
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incomplete_expired'
}

export enum SubscriptionTier {
  FOUNDATION = 'foundation',
  ADVANCED = 'advanced',
  ENTERPRISE = 'enterprise'
}

export enum BillingCycle {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}

export interface PaymentMethodInfo {
  id: string; // Stripe payment method ID
  type: 'card' | 'bank_account' | 'paypal' | 'apple_pay' | 'google_pay';
  brand?: string; // visa, mastercard, etc.
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  fingerprint?: string;
  country?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillingInfo {
  email: string;
  name: string;
  address: BillingAddress;
  taxId?: string;
  taxExempt: boolean;
  invoiceSettings: InvoiceSettings;
}

export interface BillingAddress {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface InvoiceSettings {
  customFields: CustomField[];
  defaultPaymentMethod?: string;
  footer?: string;
  renderingOptions?: RenderingOptions;
}

export interface CustomField {
  name: string;
  value: string;
}

export interface RenderingOptions {
  amountTaxDisplay: 'include_inclusive_tax' | 'exclude_tax' | 'include_exclusive_tax';
}

export interface UsageMetrics {
  currentPeriodUsage: number;
  totalUsage: number;
  lastUsageUpdate: Date;
  usageLimit?: number;
  overageCharges: number;
  usageAlerts: UsageAlert[];
}

export interface UsageAlert {
  threshold: number; // percentage
  triggered: boolean;
  lastTriggered?: Date;
  notificationSent: boolean;
}

export interface SubscriptionModification {
  id: string;
  type: 'upgrade' | 'downgrade' | 'pause' | 'resume' | 'cancel' | 'reactivate';
  fromTier?: SubscriptionTier;
  toTier?: SubscriptionTier;
  effectiveDate: Date;
  proratedAmount?: number;
  reason: string;
  requestedBy: string;
  approvedBy?: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface SubscriptionRenewal {
  id: string;
  renewalDate: Date;
  amount: number;
  currency: string;
  paymentStatus: 'succeeded' | 'failed' | 'pending';
  invoiceId?: string;
  failureReason?: string;
  attemptCount: number;
  nextRetryDate?: Date;
  createdAt: Date;
}

export interface SubscriptionCredit {
  id: string;
  amount: number;
  currency: string;
  reason: string;
  type: 'refund' | 'goodwill' | 'discount' | 'migration' | 'promotional';
  appliedAt: Date;
  expiresAt?: Date;
  balance: number;
  usedAmount: number;
  createdBy: string;
  metadata?: Record<string, any>;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  description: string;
  features: PlanFeature[];
  pricing: PlanPricing[];
  limits: PlanLimits;
  isActive: boolean;
  isFeatured: boolean;
  trialDays: number;
  setupFee?: number;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanFeature {
  name: string;
  description: string;
  included: boolean;
  limit?: number;
  unlimited: boolean;
}

export interface PlanPricing {
  billingCycle: BillingCycle;
  amount: number;
  currency: string;
  stripePriceId: string;
  discountPercentage?: number;
}

export interface PlanLimits {
  maxUsers?: number;
  maxProjects?: number;
  maxTemplates?: number;
  maxStorage?: number; // in GB
  maxBandwidth?: number; // in GB
  apiCallsPerMonth?: number;
  supportLevel: 'community' | 'email' | 'priority' | 'dedicated';
  responseTime?: string; // "24h", "4h", "1h"
}

export interface PaymentTransaction {
  id: string;
  subscriptionId: string;
  stripePaymentIntentId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  type: PaymentType;
  description: string;
  failureCode?: string;
  failureMessage?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  processedAt?: Date;
  refundedAt?: Date;
  refundAmount?: number;
  fees: PaymentFee[];
}

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELED = 'canceled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded'
}

export enum PaymentType {
  SUBSCRIPTION = 'subscription',
  SETUP = 'setup',
  UPGRADE = 'upgrade',
  DOWNGRADE = 'downgrade',
  REFUND = 'refund',
  CREDIT = 'credit'
}

export interface PaymentFee {
  type: 'stripe' | 'tax' | 'processing';
  amount: number;
  currency: string;
  description: string;
}

export interface SubscriptionAnalytics {
  totalSubscriptions: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  canceledSubscriptions: number;
  churnRate: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  averageRevenuePerUser: number;
  customerLifetimeValue: number;
  tierDistribution: Record<SubscriptionTier, number>;
  billingCycleDistribution: Record<BillingCycle, number>;
  paymentMethodDistribution: Record<string, number>;
  geographicDistribution: Record<string, number>;
  cohortAnalysis: CohortData[];
  revenueMetrics: RevenueMetrics;
  churnAnalysis: ChurnAnalysis;
}

export interface CohortData {
  month: string;
  newSubscriptions: number;
  revenue: number;
  retentionRates: Record<string, number>; // month 1, 2, 3, etc.
  churnRates: Record<string, number>;
}

export interface RevenueMetrics {
  grossRevenue: number;
  netRevenue: number;
  refunds: number;
  chargebacks: number;
  taxes: number;
  fees: number;
  growth: {
    monthly: number; // percentage
    quarterly: number;
    yearly: number;
  };
  forecasting: RevenueForecast[];
}

export interface RevenueForecast {
  month: string;
  predictedRevenue: number;
  confidence: number;
  factors: string[];
}

export interface ChurnAnalysis {
  overallChurnRate: number;
  churnByTier: Record<SubscriptionTier, number>;
  churnByCycle: Record<BillingCycle, number>;
  churnReasons: ChurnReason[];
  timeToChurn: number; // average days
  recoveryOpportunities: ChurnRecoveryOpportunity[];
}

export interface ChurnReason {
  reason: string;
  percentage: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface ChurnRecoveryOpportunity {
  segment: string;
  potentialRecovery: number;
  strategies: string[];
  estimatedSuccess: number; // percentage
}

export interface SubscriptionSearchFilters {
  searchTerm?: string;
  status?: SubscriptionStatus[];
  tier?: SubscriptionTier[];
  billingCycle?: BillingCycle[];
  createdDateRange?: DateRange;
  nextBillingRange?: DateRange;
  revenueRange?: { min: number; max: number };
  paymentStatus?: 'current' | 'overdue' | 'failed';
  country?: string[];
  hasDiscount?: boolean;
  isTrialing?: boolean;
  cancelAtPeriodEnd?: boolean;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface SubscriptionSearchResult {
  subscriptions: Subscription[];
  totalCount: number;
  pageInfo: PageInfo;
  aggregations: SubscriptionAggregations;
}

export interface PageInfo {
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface SubscriptionAggregations {
  statusDistribution: Record<SubscriptionStatus, number>;
  tierDistribution: Record<SubscriptionTier, number>;
  billingCycleDistribution: Record<BillingCycle, number>;
  totalRevenue: number;
  averageRevenue: number;
}

export interface BillingIssue {
  id: string;
  subscriptionId: string;
  type: BillingIssueType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  status: 'open' | 'investigating' | 'resolved' | 'escalated';
  customerNotified: boolean;
  resolutionSteps: string[];
  assignedTo?: string;
  createdAt: Date;
  resolvedAt?: Date;
  metadata: Record<string, any>;
}

export enum BillingIssueType {
  PAYMENT_FAILED = 'payment_failed',
  CARD_EXPIRED = 'card_expired',
  INSUFFICIENT_FUNDS = 'insufficient_funds',
  DISPUTE = 'dispute',
  REFUND_REQUEST = 'refund_request',
  BILLING_ADDRESS = 'billing_address',
  TAX_CALCULATION = 'tax_calculation',
  PRORATION_ERROR = 'proration_error',
  WEBHOOK_FAILURE = 'webhook_failure'
}

@Injectable()
export class SubscriptionManagementService {
  private readonly logger = new Logger(SubscriptionManagementService.name);
  private subscriptions: Subscription[] = [];
  private plans: SubscriptionPlan[] = [];
  private transactions: PaymentTransaction[] = [];
  private billingIssues: BillingIssue[] = [];

  constructor(private configService: ConfigService) {
    this.initializeSubscriptionPlans();
    this.initializeMockSubscriptions();
    this.initializeMockTransactions();
    this.initializeBillingIssues();
  }

  private initializeSubscriptionPlans(): void {
    this.plans = [
      {
        id: 'plan_foundation',
        name: 'Foundation Tier',
        tier: SubscriptionTier.FOUNDATION,
        description: 'Perfect for individual developers and small teams getting started with AI-powered development',
        features: [
          { name: 'Complete Five Elite Principles Access', description: 'Full access to core methodology', included: true, unlimited: false },
          { name: '100+ Production-Ready Templates', description: 'Curated prompt template library', included: true, unlimited: false },
          { name: '12-Week Transformation Roadmap', description: 'Structured learning path', included: true, unlimited: false },
          { name: 'Community Support', description: 'Access to community forums', included: true, unlimited: true },
          { name: 'Mobile & Desktop Access', description: 'Cross-platform availability', included: true, unlimited: true },
          { name: 'Progress Tracking', description: 'Learning analytics and insights', included: true, unlimited: true },
          { name: 'Bookmark & Notes', description: 'Personal organization tools', included: true, unlimited: true },
          { name: 'Offline Reading', description: 'Download content for offline use', included: true, unlimited: true }
        ],
        pricing: [
          { billingCycle: BillingCycle.MONTHLY, amount: 2495, currency: 'USD', stripePriceId: 'price_foundation_monthly' },
          { billingCycle: BillingCycle.YEARLY, amount: 24950, currency: 'USD', stripePriceId: 'price_foundation_yearly', discountPercentage: 17 }
        ],
        limits: {
          maxUsers: 1,
          maxProjects: 5,
          maxTemplates: 100,
          maxStorage: 1,
          apiCallsPerMonth: 1000,
          supportLevel: 'community',
          responseTime: '24h'
        },
        isActive: true,
        isFeatured: true,
        trialDays: 7,
        metadata: {
          targetAudience: 'Individual developers and small teams',
          popularFeatures: ['Complete methodology access', 'Template library', 'Learning roadmap']
        },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-03-01')
      },
      {
        id: 'plan_advanced',
        name: 'Advanced Tier',
        tier: SubscriptionTier.ADVANCED,
        description: 'For growing teams and organizations ready to scale their AI development practices',
        features: [
          { name: 'Everything in Foundation', description: 'All foundation tier features', included: true, unlimited: false },
          { name: 'Advanced Architecture Patterns', description: 'Enterprise-scale implementation strategies', included: true, unlimited: false },
          { name: 'Team Collaboration Tools', description: 'Shared workspaces and team management', included: true, unlimited: false },
          { name: 'Custom Template Creation', description: 'Build and share your own templates', included: true, unlimited: true },
          { name: 'Priority Email Support', description: '4-hour response time guarantee', included: true, unlimited: true },
          { name: 'Video Tutorials & Workshops', description: 'Exclusive advanced content', included: true, unlimited: false },
          { name: 'API Access', description: 'Integrate with your development workflow', included: true, unlimited: false, limit: 10000 },
          { name: 'Advanced Analytics', description: 'Team performance insights', included: true, unlimited: true }
        ],
        pricing: [
          { billingCycle: BillingCycle.MONTHLY, amount: 9995, currency: 'USD', stripePriceId: 'price_advanced_monthly' },
          { billingCycle: BillingCycle.YEARLY, amount: 99950, currency: 'USD', stripePriceId: 'price_advanced_yearly', discountPercentage: 17 }
        ],
        limits: {
          maxUsers: 10,
          maxProjects: 25,
          maxTemplates: 500,
          maxStorage: 10,
          apiCallsPerMonth: 10000,
          supportLevel: 'priority',
          responseTime: '4h'
        },
        isActive: true,
        isFeatured: false,
        trialDays: 14,
        metadata: {
          targetAudience: 'Growing teams and organizations',
          popularFeatures: ['Team collaboration', 'Custom templates', 'Priority support']
        },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-03-01')
      },
      {
        id: 'plan_enterprise',
        name: 'Enterprise Tier',
        tier: SubscriptionTier.ENTERPRISE,
        description: 'For large organizations requiring enterprise-grade features and dedicated support',
        features: [
          { name: 'Everything in Advanced', description: 'All advanced tier features', included: true, unlimited: false },
          { name: 'Dedicated Account Manager', description: 'Personal success manager', included: true, unlimited: true },
          { name: 'Custom Integration Support', description: 'Tailored implementation assistance', included: true, unlimited: true },
          { name: 'White-label Options', description: 'Brand customization capabilities', included: true, unlimited: true },
          { name: 'SLA Guarantees', description: '99.9% uptime and 1-hour support response', included: true, unlimited: true },
          { name: 'Advanced Security & Compliance', description: 'SOC2, GDPR, and enterprise security', included: true, unlimited: true },
          { name: 'Unlimited API Access', description: 'No rate limiting or usage caps', included: true, unlimited: true },
          { name: 'Custom Training & Workshops', description: 'On-site or virtual team training', included: true, unlimited: false }
        ],
        pricing: [
          { billingCycle: BillingCycle.MONTHLY, amount: 49995, currency: 'USD', stripePriceId: 'price_enterprise_monthly' },
          { billingCycle: BillingCycle.YEARLY, amount: 499950, currency: 'USD', stripePriceId: 'price_enterprise_yearly', discountPercentage: 17 }
        ],
        limits: {
          maxUsers: 100,
          maxStorage: 100,
          supportLevel: 'dedicated',
          responseTime: '1h'
        },
        isActive: true,
        isFeatured: false,
        trialDays: 30,
        setupFee: 500000, // $5,000 setup fee
        metadata: {
          targetAudience: 'Large organizations and enterprises',
          popularFeatures: ['Dedicated support', 'Custom integration', 'White-label options']
        },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-03-01')
      }
    ];

    this.logger.log(`Initialized ${this.plans.length} subscription plans`);
  }

  private initializeMockSubscriptions(): void {
    this.subscriptions = [
      {
        id: 'sub_001',
        userId: 'user_001',
        customerId: 'cus_stripe_001',
        subscriptionId: 'sub_stripe_001',
        status: SubscriptionStatus.ACTIVE,
        tier: SubscriptionTier.FOUNDATION,
        billingCycle: BillingCycle.MONTHLY,
        amount: 2495,
        currency: 'USD',
        currentPeriodStart: new Date('2024-03-01'),
        currentPeriodEnd: new Date('2024-04-01'),
        nextBillingDate: new Date('2024-04-01'),
        cancelAtPeriodEnd: false,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-03-01'),
        paymentMethod: {
          id: 'pm_001',
          type: 'card',
          brand: 'visa',
          last4: '4242',
          expiryMonth: 12,
          expiryYear: 2026,
          country: 'US',
          isDefault: true,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15')
        },
        billing: {
          email: 'john.smith@techcorp.com',
          name: 'John Smith',
          address: {
            line1: '123 Tech Street',
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'US'
          },
          taxExempt: false,
          invoiceSettings: {
            customFields: [],
            renderingOptions: {
              amountTaxDisplay: 'exclude_tax'
            }
          }
        },
        usage: {
          currentPeriodUsage: 45,
          totalUsage: 312,
          lastUsageUpdate: new Date(),
          overageCharges: 0,
          usageAlerts: [
            { threshold: 80, triggered: false, notificationSent: false },
            { threshold: 95, triggered: false, notificationSent: false }
          ]
        },
        modifications: [
          {
            id: 'mod_001',
            type: 'upgrade',
            fromTier: SubscriptionTier.FOUNDATION,
            toTier: SubscriptionTier.FOUNDATION,
            effectiveDate: new Date('2024-01-15'),
            reason: 'Initial subscription',
            requestedBy: 'user_001',
            createdAt: new Date('2024-01-15')
          }
        ],
        renewals: [
          {
            id: 'ren_001',
            renewalDate: new Date('2024-02-01'),
            amount: 2495,
            currency: 'USD',
            paymentStatus: 'succeeded',
            invoiceId: 'in_stripe_001',
            attemptCount: 1,
            createdAt: new Date('2024-02-01')
          },
          {
            id: 'ren_002',
            renewalDate: new Date('2024-03-01'),
            amount: 2495,
            currency: 'USD',
            paymentStatus: 'succeeded',
            invoiceId: 'in_stripe_002',
            attemptCount: 1,
            createdAt: new Date('2024-03-01')
          }
        ],
        credits: []
      },
      {
        id: 'sub_002',
        userId: 'user_002',
        customerId: 'cus_stripe_002',
        subscriptionId: 'sub_stripe_002',
        status: SubscriptionStatus.TRIALING,
        tier: SubscriptionTier.ADVANCED,
        billingCycle: BillingCycle.MONTHLY,
        amount: 9995,
        currency: 'USD',
        trialStart: new Date('2024-03-15'),
        trialEnd: new Date('2024-03-29'),
        currentPeriodStart: new Date('2024-03-15'),
        currentPeriodEnd: new Date('2024-03-29'),
        nextBillingDate: new Date('2024-03-29'),
        cancelAtPeriodEnd: false,
        createdAt: new Date('2024-03-15'),
        updatedAt: new Date('2024-03-15'),
        paymentMethod: {
          id: 'pm_002',
          type: 'card',
          brand: 'mastercard',
          last4: '5555',
          expiryMonth: 8,
          expiryYear: 2027,
          country: 'US',
          isDefault: true,
          createdAt: new Date('2024-03-15'),
          updatedAt: new Date('2024-03-15')
        },
        billing: {
          email: 'sarah.johnson@startup.io',
          name: 'Sarah Johnson',
          address: {
            line1: '456 Innovation Ave',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94105',
            country: 'US'
          },
          taxExempt: false,
          invoiceSettings: {
            customFields: [
              { name: 'Company', value: 'StartupIO' }
            ],
            renderingOptions: {
              amountTaxDisplay: 'exclude_tax'
            }
          }
        },
        usage: {
          currentPeriodUsage: 23,
          totalUsage: 23,
          lastUsageUpdate: new Date(),
          overageCharges: 0,
          usageAlerts: [
            { threshold: 80, triggered: false, notificationSent: false },
            { threshold: 95, triggered: false, notificationSent: false }
          ]
        },
        modifications: [
          {
            id: 'mod_002',
            type: 'upgrade',
            fromTier: SubscriptionTier.FOUNDATION,
            toTier: SubscriptionTier.ADVANCED,
            effectiveDate: new Date('2024-03-15'),
            reason: 'Trial upgrade to advanced features',
            requestedBy: 'user_002',
            createdAt: new Date('2024-03-15')
          }
        ],
        renewals: [],
        credits: [
          {
            id: 'cred_001',
            amount: 2000,
            currency: 'USD',
            reason: 'Welcome bonus for new advanced trial',
            type: 'promotional',
            appliedAt: new Date('2024-03-15'),
            balance: 2000,
            usedAmount: 0,
            createdBy: 'system'
          }
        ]
      }
    ];

    this.logger.log(`Initialized ${this.subscriptions.length} mock subscriptions`);
  }

  private initializeMockTransactions(): void {
    this.transactions = [
      {
        id: 'txn_001',
        subscriptionId: 'sub_001',
        stripePaymentIntentId: 'pi_stripe_001',
        amount: 2495,
        currency: 'USD',
        status: PaymentStatus.SUCCEEDED,
        type: PaymentType.SUBSCRIPTION,
        description: 'Foundation Tier - Monthly',
        metadata: { invoiceId: 'in_stripe_001', period: '2024-02' },
        createdAt: new Date('2024-02-01'),
        processedAt: new Date('2024-02-01'),
        fees: [
          { type: 'stripe', amount: 102, currency: 'USD', description: 'Stripe processing fee' },
          { type: 'tax', amount: 199, currency: 'USD', description: 'Sales tax' }
        ]
      },
      {
        id: 'txn_002',
        subscriptionId: 'sub_001',
        stripePaymentIntentId: 'pi_stripe_002',
        amount: 2495,
        currency: 'USD',
        status: PaymentStatus.SUCCEEDED,
        type: PaymentType.SUBSCRIPTION,
        description: 'Foundation Tier - Monthly',
        metadata: { invoiceId: 'in_stripe_002', period: '2024-03' },
        createdAt: new Date('2024-03-01'),
        processedAt: new Date('2024-03-01'),
        fees: [
          { type: 'stripe', amount: 102, currency: 'USD', description: 'Stripe processing fee' },
          { type: 'tax', amount: 199, currency: 'USD', description: 'Sales tax' }
        ]
      },
      {
        id: 'txn_003',
        subscriptionId: 'sub_002',
        stripePaymentIntentId: 'pi_stripe_003',
        amount: 0,
        currency: 'USD',
        status: PaymentStatus.SUCCEEDED,
        type: PaymentType.SETUP,
        description: 'Advanced Tier - Trial Setup',
        metadata: { trialStart: '2024-03-15', trialEnd: '2024-03-29' },
        createdAt: new Date('2024-03-15'),
        processedAt: new Date('2024-03-15'),
        fees: []
      }
    ];

    this.logger.log(`Initialized ${this.transactions.length} mock transactions`);
  }

  private initializeBillingIssues(): void {
    this.billingIssues = [
      {
        id: 'issue_001',
        subscriptionId: 'sub_001',
        type: BillingIssueType.CARD_EXPIRED,
        severity: 'medium',
        description: 'Payment method will expire next month',
        status: 'open',
        customerNotified: true,
        resolutionSteps: [
          'Email sent to customer with card update link',
          'In-app notification displayed',
          'Follow-up email scheduled for 1 week before expiry'
        ],
        assignedTo: 'billing_team',
        createdAt: new Date('2024-03-20'),
        metadata: {
          expiryDate: '12/2024',
          cardLast4: '4242',
          remindersSent: 1
        }
      }
    ];

    this.logger.log(`Initialized ${this.billingIssues.length} billing issues`);
  }

  async searchSubscriptions(
    filters: SubscriptionSearchFilters,
    page: number = 1,
    pageSize: number = 20,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<SubscriptionSearchResult> {
    let filteredSubscriptions = [...this.subscriptions];

    // Apply filters
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filteredSubscriptions = filteredSubscriptions.filter(sub =>
        sub.id.toLowerCase().includes(term) ||
        sub.billing.email.toLowerCase().includes(term) ||
        sub.billing.name.toLowerCase().includes(term)
      );
    }

    if (filters.status && filters.status.length > 0) {
      filteredSubscriptions = filteredSubscriptions.filter(sub =>
        filters.status!.includes(sub.status)
      );
    }

    if (filters.tier && filters.tier.length > 0) {
      filteredSubscriptions = filteredSubscriptions.filter(sub =>
        filters.tier!.includes(sub.tier)
      );
    }

    if (filters.billingCycle && filters.billingCycle.length > 0) {
      filteredSubscriptions = filteredSubscriptions.filter(sub =>
        filters.billingCycle!.includes(sub.billingCycle)
      );
    }

    if (filters.createdDateRange) {
      filteredSubscriptions = filteredSubscriptions.filter(sub =>
        sub.createdAt >= filters.createdDateRange!.start &&
        sub.createdAt <= filters.createdDateRange!.end
      );
    }

    if (filters.isTrialing !== undefined) {
      filteredSubscriptions = filteredSubscriptions.filter(sub =>
        filters.isTrialing ? sub.status === SubscriptionStatus.TRIALING : sub.status !== SubscriptionStatus.TRIALING
      );
    }

    if (filters.cancelAtPeriodEnd !== undefined) {
      filteredSubscriptions = filteredSubscriptions.filter(sub =>
        sub.cancelAtPeriodEnd === filters.cancelAtPeriodEnd
      );
    }

    // Sort subscriptions
    filteredSubscriptions.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'createdAt':
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
          break;
        case 'nextBillingDate':
          aValue = a.nextBillingDate.getTime();
          bValue = b.nextBillingDate.getTime();
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'tier':
          aValue = a.tier;
          bValue = b.tier;
          break;
        default:
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    // Calculate pagination
    const totalCount = filteredSubscriptions.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalCount);
    const paginatedSubscriptions = filteredSubscriptions.slice(startIndex, endIndex);

    // Calculate aggregations
    const aggregations: SubscriptionAggregations = {
      statusDistribution: this.calculateStatusDistribution(filteredSubscriptions),
      tierDistribution: this.calculateTierDistribution(filteredSubscriptions),
      billingCycleDistribution: this.calculateBillingCycleDistribution(filteredSubscriptions),
      totalRevenue: filteredSubscriptions.reduce((sum, sub) => sum + sub.amount, 0),
      averageRevenue: filteredSubscriptions.length > 0 
        ? filteredSubscriptions.reduce((sum, sub) => sum + sub.amount, 0) / filteredSubscriptions.length 
        : 0
    };

    return {
      subscriptions: paginatedSubscriptions,
      totalCount,
      pageInfo: {
        page,
        pageSize,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      },
      aggregations
    };
  }

  async getSubscriptionById(subscriptionId: string): Promise<Subscription | null> {
    return this.subscriptions.find(sub => sub.id === subscriptionId) || null;
  }

  async getSubscriptionsByUserId(userId: string): Promise<Subscription[]> {
    return this.subscriptions.filter(sub => sub.userId === userId);
  }

  async createSubscription(
    userId: string,
    planId: string,
    paymentMethodId: string,
    billingCycle: BillingCycle,
    discountCode?: string
  ): Promise<string> {
    const plan = this.plans.find(p => p.id === planId);
    
    if (!plan) {
      throw new Error('Plan not found');
    }

    const pricing = plan.pricing.find(p => p.billingCycle === billingCycle);
    
    if (!pricing) {
      throw new Error('Pricing not found for billing cycle');
    }

    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date();
    const trialEnd = plan.trialDays > 0 ? new Date(now.getTime() + plan.trialDays * 24 * 60 * 60 * 1000) : undefined;

    const newSubscription: Subscription = {
      id: subscriptionId,
      userId,
      customerId: `cus_${userId}`,
      subscriptionId: `stripe_${subscriptionId}`,
      status: plan.trialDays > 0 ? SubscriptionStatus.TRIALING : SubscriptionStatus.ACTIVE,
      tier: plan.tier,
      billingCycle,
      amount: pricing.amount,
      currency: pricing.currency,
      discountCode,
      discountAmount: discountCode ? Math.round(pricing.amount * 0.1) : undefined, // 10% discount
      trialStart: plan.trialDays > 0 ? now : undefined,
      trialEnd,
      currentPeriodStart: now,
      currentPeriodEnd: trialEnd || this.calculateNextBillingDate(now, billingCycle),
      nextBillingDate: trialEnd || this.calculateNextBillingDate(now, billingCycle),
      cancelAtPeriodEnd: false,
      createdAt: now,
      updatedAt: now,
      paymentMethod: {
        id: paymentMethodId,
        type: 'card',
        brand: 'visa',
        last4: '4242',
        expiryMonth: 12,
        expiryYear: 2026,
        country: 'US',
        isDefault: true,
        createdAt: now,
        updatedAt: now
      },
      billing: {
        email: `user_${userId}@example.com`,
        name: 'New Customer',
        address: {
          line1: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          postalCode: '12345',
          country: 'US'
        },
        taxExempt: false,
        invoiceSettings: {
          customFields: [],
          renderingOptions: {
            amountTaxDisplay: 'exclude_tax'
          }
        }
      },
      usage: {
        currentPeriodUsage: 0,
        totalUsage: 0,
        lastUsageUpdate: now,
        overageCharges: 0,
        usageAlerts: [
          { threshold: 80, triggered: false, notificationSent: false },
          { threshold: 95, triggered: false, notificationSent: false }
        ]
      },
      modifications: [
        {
          id: `mod_${Date.now()}`,
          type: 'upgrade',
          toTier: plan.tier,
          effectiveDate: now,
          reason: 'Initial subscription',
          requestedBy: userId,
          createdAt: now
        }
      ],
      renewals: [],
      credits: []
    };

    this.subscriptions.push(newSubscription);

    this.logger.log(`Subscription created: ${subscriptionId} for user ${userId}`);
    return subscriptionId;
  }

  async updateSubscription(
    subscriptionId: string,
    updates: Partial<Subscription>
  ): Promise<boolean> {
    const subscriptionIndex = this.subscriptions.findIndex(sub => sub.id === subscriptionId);
    
    if (subscriptionIndex === -1) {
      return false;
    }

    this.subscriptions[subscriptionIndex] = {
      ...this.subscriptions[subscriptionIndex],
      ...updates,
      updatedAt: new Date()
    };

    this.logger.log(`Subscription updated: ${subscriptionId}`);
    return true;
  }

  async changeSubscriptionTier(
    subscriptionId: string,
    newTier: SubscriptionTier,
    effectiveDate: Date = new Date(),
    reason: string = 'Customer request'
  ): Promise<boolean> {
    const subscription = this.subscriptions.find(sub => sub.id === subscriptionId);
    
    if (!subscription) {
      return false;
    }

    const newPlan = this.plans.find(p => p.tier === newTier);
    
    if (!newPlan) {
      return false;
    }

    const newPricing = newPlan.pricing.find(p => p.billingCycle === subscription.billingCycle);
    
    if (!newPricing) {
      return false;
    }

    const modification: SubscriptionModification = {
      id: `mod_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      type: newTier > subscription.tier ? 'upgrade' : 'downgrade',
      fromTier: subscription.tier,
      toTier: newTier,
      effectiveDate,
      proratedAmount: this.calculateProration(subscription, newPricing.amount),
      reason,
      requestedBy: subscription.userId,
      createdAt: new Date()
    };

    subscription.tier = newTier;
    subscription.amount = newPricing.amount;
    subscription.modifications.push(modification);
    subscription.updatedAt = new Date();

    this.logger.log(`Subscription tier changed: ${subscriptionId} - ${modification.fromTier} → ${newTier}`);
    return true;
  }

  async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd: boolean = true,
    reason: string = 'Customer request'
  ): Promise<boolean> {
    const subscription = this.subscriptions.find(sub => sub.id === subscriptionId);
    
    if (!subscription) {
      return false;
    }

    if (cancelAtPeriodEnd) {
      subscription.cancelAtPeriodEnd = true;
    } else {
      subscription.status = SubscriptionStatus.CANCELED;
      subscription.canceledAt = new Date();
    }

    subscription.cancellationReason = reason;
    subscription.updatedAt = new Date();

    const modification: SubscriptionModification = {
      id: `mod_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      type: 'cancel',
      effectiveDate: cancelAtPeriodEnd ? subscription.currentPeriodEnd : new Date(),
      reason,
      requestedBy: subscription.userId,
      createdAt: new Date()
    };

    subscription.modifications.push(modification);

    this.logger.log(`Subscription cancelled: ${subscriptionId} - ${cancelAtPeriodEnd ? 'at period end' : 'immediately'}`);
    return true;
  }

  async pauseSubscription(
    subscriptionId: string,
    reason: string = 'Customer request'
  ): Promise<boolean> {
    const subscription = this.subscriptions.find(sub => sub.id === subscriptionId);
    
    if (!subscription || subscription.status !== SubscriptionStatus.ACTIVE) {
      return false;
    }

    subscription.status = SubscriptionStatus.PAUSED;
    subscription.pausedAt = new Date();
    subscription.pauseReason = reason;
    subscription.updatedAt = new Date();

    const modification: SubscriptionModification = {
      id: `mod_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      type: 'pause',
      effectiveDate: new Date(),
      reason,
      requestedBy: subscription.userId,
      createdAt: new Date()
    };

    subscription.modifications.push(modification);

    this.logger.log(`Subscription paused: ${subscriptionId}`);
    return true;
  }

  async resumeSubscription(subscriptionId: string): Promise<boolean> {
    const subscription = this.subscriptions.find(sub => sub.id === subscriptionId);
    
    if (!subscription || subscription.status !== SubscriptionStatus.PAUSED) {
      return false;
    }

    subscription.status = SubscriptionStatus.ACTIVE;
    subscription.resumedAt = new Date();
    subscription.updatedAt = new Date();

    const modification: SubscriptionModification = {
      id: `mod_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      type: 'resume',
      effectiveDate: new Date(),
      reason: 'Subscription resumed',
      requestedBy: subscription.userId,
      createdAt: new Date()
    };

    subscription.modifications.push(modification);

    this.logger.log(`Subscription resumed: ${subscriptionId}`);
    return true;
  }

  async addSubscriptionCredit(
    subscriptionId: string,
    amount: number,
    reason: string,
    type: SubscriptionCredit['type'],
    createdBy: string,
    expiresAt?: Date
  ): Promise<string> {
    const subscription = this.subscriptions.find(sub => sub.id === subscriptionId);
    
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const creditId = `cred_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    const credit: SubscriptionCredit = {
      id: creditId,
      amount,
      currency: subscription.currency,
      reason,
      type,
      appliedAt: new Date(),
      expiresAt,
      balance: amount,
      usedAmount: 0,
      createdBy
    };

    subscription.credits.push(credit);
    subscription.updatedAt = new Date();

    this.logger.log(`Credit added to subscription: ${subscriptionId} - ${amount} ${subscription.currency}`);
    return creditId;
  }

  async getSubscriptionAnalytics(): Promise<SubscriptionAnalytics> {
    const activeSubscriptions = this.subscriptions.filter(sub => sub.status === SubscriptionStatus.ACTIVE);
    const trialSubscriptions = this.subscriptions.filter(sub => sub.status === SubscriptionStatus.TRIALING);
    const canceledSubscriptions = this.subscriptions.filter(sub => sub.status === SubscriptionStatus.CANCELED);

    const totalSubscriptions = this.subscriptions.length;
    const churnRate = totalSubscriptions > 0 ? (canceledSubscriptions.length / totalSubscriptions) * 100 : 0;

    const monthlyRevenue = activeSubscriptions
      .filter(sub => sub.billingCycle === BillingCycle.MONTHLY)
      .reduce((sum, sub) => sum + sub.amount, 0);

    const yearlyRevenue = activeSubscriptions
      .filter(sub => sub.billingCycle === BillingCycle.YEARLY)
      .reduce((sum, sub) => sum + (sub.amount / 12), 0); // Convert to monthly

    const monthlyRecurringRevenue = monthlyRevenue + yearlyRevenue;
    const annualRecurringRevenue = monthlyRecurringRevenue * 12;

    const averageRevenuePerUser = activeSubscriptions.length > 0
      ? monthlyRecurringRevenue / activeSubscriptions.length
      : 0;

    const customerLifetimeValue = averageRevenuePerUser * 24; // Assume 24 month average lifetime

    return {
      totalSubscriptions,
      activeSubscriptions: activeSubscriptions.length,
      trialSubscriptions: trialSubscriptions.length,
      canceledSubscriptions: canceledSubscriptions.length,
      churnRate,
      monthlyRecurringRevenue,
      annualRecurringRevenue,
      averageRevenuePerUser,
      customerLifetimeValue,
      tierDistribution: this.calculateTierDistribution(this.subscriptions),
      billingCycleDistribution: this.calculateBillingCycleDistribution(this.subscriptions),
      paymentMethodDistribution: this.calculatePaymentMethodDistribution(this.subscriptions),
      geographicDistribution: this.calculateGeographicDistribution(this.subscriptions),
      cohortAnalysis: this.generateCohortAnalysis(),
      revenueMetrics: this.calculateRevenueMetrics(),
      churnAnalysis: this.generateChurnAnalysis()
    };
  }

  async getPlans(): Promise<SubscriptionPlan[]> {
    return this.plans.filter(plan => plan.isActive);
  }

  async getPlanById(planId: string): Promise<SubscriptionPlan | null> {
    return this.plans.find(plan => plan.id === planId) || null;
  }

  async getTransactionHistory(
    subscriptionId?: string,
    limit: number = 50
  ): Promise<PaymentTransaction[]> {
    let transactions = this.transactions;
    
    if (subscriptionId) {
      transactions = transactions.filter(txn => txn.subscriptionId === subscriptionId);
    }

    return transactions
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getBillingIssues(
    subscriptionId?: string,
    status?: BillingIssue['status']
  ): Promise<BillingIssue[]> {
    let issues = this.billingIssues;
    
    if (subscriptionId) {
      issues = issues.filter(issue => issue.subscriptionId === subscriptionId);
    }
    
    if (status) {
      issues = issues.filter(issue => issue.status === status);
    }

    return issues.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async resolveBillingIssue(issueId: string, resolution: string): Promise<boolean> {
    const issue = this.billingIssues.find(i => i.id === issueId);
    
    if (!issue) {
      return false;
    }

    issue.status = 'resolved';
    issue.resolvedAt = new Date();
    issue.resolutionSteps.push(`Resolved: ${resolution}`);

    this.logger.log(`Billing issue resolved: ${issueId}`);
    return true;
  }

  private calculateNextBillingDate(currentDate: Date, billingCycle: BillingCycle): Date {
    const nextDate = new Date(currentDate);
    
    switch (billingCycle) {
      case BillingCycle.MONTHLY:
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case BillingCycle.QUARTERLY:
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case BillingCycle.YEARLY:
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }
    
    return nextDate;
  }

  private calculateProration(subscription: Subscription, newAmount: number): number {
    const currentPeriodDays = Math.ceil(
      (subscription.currentPeriodEnd.getTime() - subscription.currentPeriodStart.getTime()) / (24 * 60 * 60 * 1000)
    );
    
    const remainingDays = Math.ceil(
      (subscription.currentPeriodEnd.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
    );

    const usedAmount = (subscription.amount * (currentPeriodDays - remainingDays)) / currentPeriodDays;
    const newPeriodAmount = (newAmount * remainingDays) / currentPeriodDays;

    return Math.round(newPeriodAmount - (subscription.amount - usedAmount));
  }

  private calculateStatusDistribution(subscriptions: Subscription[]): Record<SubscriptionStatus, number> {
    const distribution: Record<SubscriptionStatus, number> = {
      [SubscriptionStatus.ACTIVE]: 0,
      [SubscriptionStatus.TRIALING]: 0,
      [SubscriptionStatus.PAST_DUE]: 0,
      [SubscriptionStatus.CANCELED]: 0,
      [SubscriptionStatus.UNPAID]: 0,
      [SubscriptionStatus.PAUSED]: 0,
      [SubscriptionStatus.INCOMPLETE]: 0,
      [SubscriptionStatus.INCOMPLETE_EXPIRED]: 0
    };

    subscriptions.forEach(sub => {
      distribution[sub.status]++;
    });

    return distribution;
  }

  private calculateTierDistribution(subscriptions: Subscription[]): Record<SubscriptionTier, number> {
    const distribution: Record<SubscriptionTier, number> = {
      [SubscriptionTier.FOUNDATION]: 0,
      [SubscriptionTier.ADVANCED]: 0,
      [SubscriptionTier.ENTERPRISE]: 0
    };

    subscriptions.forEach(sub => {
      distribution[sub.tier]++;
    });

    return distribution;
  }

  private calculateBillingCycleDistribution(subscriptions: Subscription[]): Record<BillingCycle, number> {
    const distribution: Record<BillingCycle, number> = {
      [BillingCycle.MONTHLY]: 0,
      [BillingCycle.QUARTERLY]: 0,
      [BillingCycle.YEARLY]: 0
    };

    subscriptions.forEach(sub => {
      distribution[sub.billingCycle]++;
    });

    return distribution;
  }

  private calculatePaymentMethodDistribution(subscriptions: Subscription[]): Record<string, number> {
    const distribution: Record<string, number> = {};

    subscriptions.forEach(sub => {
      const method = sub.paymentMethod.type;
      distribution[method] = (distribution[method] || 0) + 1;
    });

    return distribution;
  }

  private calculateGeographicDistribution(subscriptions: Subscription[]): Record<string, number> {
    const distribution: Record<string, number> = {};

    subscriptions.forEach(sub => {
      const country = sub.billing.address.country;
      distribution[country] = (distribution[country] || 0) + 1;
    });

    return distribution;
  }

  private generateCohortAnalysis(): CohortData[] {
    // Generate mock cohort data for last 12 months
    const cohorts: CohortData[] = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const cohortDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = cohortDate.toISOString().substring(0, 7);

      cohorts.push({
        month: monthStr,
        newSubscriptions: Math.floor(Math.random() * 50) + 20,
        revenue: Math.floor(Math.random() * 50000) + 20000,
        retentionRates: {
          'month_1': 0.95,
          'month_2': 0.88,
          'month_3': 0.82,
          'month_6': 0.75,
          'month_12': 0.68
        },
        churnRates: {
          'month_1': 0.05,
          'month_2': 0.12,
          'month_3': 0.18,
          'month_6': 0.25,
          'month_12': 0.32
        }
      });
    }

    return cohorts;
  }

  private calculateRevenueMetrics(): RevenueMetrics {
    const totalRevenue = this.transactions
      .filter(txn => txn.status === PaymentStatus.SUCCEEDED)
      .reduce((sum, txn) => sum + txn.amount, 0);

    const refunds = this.transactions
      .filter(txn => txn.status === PaymentStatus.REFUNDED || txn.status === PaymentStatus.PARTIALLY_REFUNDED)
      .reduce((sum, txn) => sum + (txn.refundAmount || 0), 0);

    const fees = this.transactions
      .filter(txn => txn.status === PaymentStatus.SUCCEEDED)
      .reduce((sum, txn) => sum + txn.fees.reduce((feeSum, fee) => feeSum + fee.amount, 0), 0);

    return {
      grossRevenue: totalRevenue,
      netRevenue: totalRevenue - refunds - fees,
      refunds,
      chargebacks: 0, // Would be calculated from chargeback data
      taxes: fees * 0.3, // Approximate tax portion
      fees: fees * 0.7, // Approximate processing fees
      growth: {
        monthly: 12.5,
        quarterly: 38.2,
        yearly: 156.8
      },
      forecasting: [
        { month: '2024-04', predictedRevenue: 85000, confidence: 0.85, factors: ['Seasonal growth', 'New feature launch'] },
        { month: '2024-05', predictedRevenue: 92000, confidence: 0.82, factors: ['Marketing campaign', 'Word of mouth'] },
        { month: '2024-06', predictedRevenue: 98000, confidence: 0.79, factors: ['Summer uptick', 'Partnership deals'] }
      ]
    };
  }

  private generateChurnAnalysis(): ChurnAnalysis {
    const canceledSubs = this.subscriptions.filter(sub => sub.status === SubscriptionStatus.CANCELED);
    const totalSubs = this.subscriptions.length;
    const overallChurnRate = totalSubs > 0 ? (canceledSubs.length / totalSubs) * 100 : 0;

    return {
      overallChurnRate,
      churnByTier: {
        [SubscriptionTier.FOUNDATION]: 8.5,
        [SubscriptionTier.ADVANCED]: 4.2,
        [SubscriptionTier.ENTERPRISE]: 2.1
      },
      churnByCycle: {
        [BillingCycle.MONTHLY]: 12.3,
        [BillingCycle.QUARTERLY]: 6.8,
        [BillingCycle.YEARLY]: 3.4
      },
      churnReasons: [
        { reason: 'Price sensitivity', percentage: 32.4, trend: 'stable' },
        { reason: 'Feature limitations', percentage: 28.1, trend: 'decreasing' },
        { reason: 'Poor onboarding', percentage: 18.7, trend: 'decreasing' },
        { reason: 'Technical issues', percentage: 12.3, trend: 'stable' },
        { reason: 'Competitor offer', percentage: 8.5, trend: 'increasing' }
      ],
      timeToChurn: 127, // average days
      recoveryOpportunities: [
        {
          segment: 'Price-sensitive churners',
          potentialRecovery: 0.35,
          strategies: ['Discount offers', 'Downgrade options', 'Payment plans'],
          estimatedSuccess: 0.42
        },
        {
          segment: 'Feature-limited churners',
          potentialRecovery: 0.28,
          strategies: ['Feature education', 'Custom solutions', 'Advanced tier trial'],
          estimatedSuccess: 0.38
        }
      ]
    };
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  private async processSubscriptionRenewals(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const subscriptionsDue = this.subscriptions.filter(sub =>
      sub.status === SubscriptionStatus.ACTIVE &&
      sub.nextBillingDate.getTime() <= today.getTime()
    );

    for (const subscription of subscriptionsDue) {
      try {
        await this.processRenewal(subscription);
      } catch (error) {
        this.logger.error(`Failed to process renewal for subscription ${subscription.id}:`, error);
      }
    }

    this.logger.log(`Processed ${subscriptionsDue.length} subscription renewals`);
  }

  private async processRenewal(subscription: Subscription): Promise<void> {
    const renewalId = `ren_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    // Simulate payment processing
    const paymentSuccessful = Math.random() > 0.05; // 95% success rate

    const renewal: SubscriptionRenewal = {
      id: renewalId,
      renewalDate: new Date(),
      amount: subscription.amount,
      currency: subscription.currency,
      paymentStatus: paymentSuccessful ? 'succeeded' : 'failed',
      invoiceId: paymentSuccessful ? `in_${renewalId}` : undefined,
      failureReason: paymentSuccessful ? undefined : 'Insufficient funds',
      attemptCount: 1,
      nextRetryDate: paymentSuccessful ? undefined : new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdAt: new Date()
    };

    subscription.renewals.push(renewal);

    if (paymentSuccessful) {
      // Update subscription period
      subscription.currentPeriodStart = subscription.currentPeriodEnd;
      subscription.currentPeriodEnd = this.calculateNextBillingDate(subscription.currentPeriodEnd, subscription.billingCycle);
      subscription.nextBillingDate = subscription.currentPeriodEnd;

      // Create transaction record
      const transaction: PaymentTransaction = {
        id: `txn_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        subscriptionId: subscription.id,
        stripePaymentIntentId: `pi_${renewalId}`,
        amount: subscription.amount,
        currency: subscription.currency,
        status: PaymentStatus.SUCCEEDED,
        type: PaymentType.SUBSCRIPTION,
        description: `${subscription.tier} Tier - ${subscription.billingCycle}`,
        metadata: { renewalId, period: subscription.currentPeriodStart.toISOString().substring(0, 7) },
        createdAt: new Date(),
        processedAt: new Date(),
        fees: [
          { type: 'stripe', amount: Math.round(subscription.amount * 0.029), currency: subscription.currency, description: 'Stripe processing fee' }
        ]
      };

      this.transactions.push(transaction);
    } else {
      subscription.status = SubscriptionStatus.PAST_DUE;
    }

    subscription.updatedAt = new Date();
    this.logger.log(`Renewal processed: ${subscription.id} - ${paymentSuccessful ? 'successful' : 'failed'}`);
  }

  @Cron(CronExpression.EVERY_HOUR)
  private async detectBillingIssues(): Promise<void> {
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    for (const subscription of this.subscriptions) {
      // Check for expiring payment methods
      if (subscription.paymentMethod.expiryYear && subscription.paymentMethod.expiryMonth) {
        const expiryDate = new Date(subscription.paymentMethod.expiryYear, subscription.paymentMethod.expiryMonth - 1);
        
        if (expiryDate <= oneWeekFromNow) {
          const existingIssue = this.billingIssues.find(issue =>
            issue.subscriptionId === subscription.id &&
            issue.type === BillingIssueType.CARD_EXPIRED &&
            issue.status === 'open'
          );

          if (!existingIssue) {
            const issueId = `issue_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
            
            const billingIssue: BillingIssue = {
              id: issueId,
              subscriptionId: subscription.id,
              type: BillingIssueType.CARD_EXPIRED,
              severity: 'medium',
              description: `Payment method expiring on ${expiryDate.toLocaleDateString()}`,
              status: 'open',
              customerNotified: false,
              resolutionSteps: [
                'Automatic email notification to be sent',
                'In-app notification to be displayed',
                'Follow-up reminders scheduled'
              ],
              createdAt: new Date(),
              metadata: {
                expiryDate: expiryDate.toISOString(),
                cardLast4: subscription.paymentMethod.last4,
                daysUntilExpiry: Math.ceil((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
              }
            };

            this.billingIssues.push(billingIssue);
            this.logger.log(`Billing issue detected: ${issueId} - Card expiring for subscription ${subscription.id}`);
          }
        }
      }

      // Check for failed renewals that need retry
      const lastRenewal = subscription.renewals[subscription.renewals.length - 1];
      if (lastRenewal && lastRenewal.paymentStatus === 'failed' && lastRenewal.nextRetryDate && lastRenewal.nextRetryDate <= now) {
        // Would trigger retry logic here
        this.logger.log(`Retry needed for failed renewal: ${subscription.id}`);
      }
    }
  }
}