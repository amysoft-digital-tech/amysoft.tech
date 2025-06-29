import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index
} from 'typeorm';
import { IsEnum, IsString, IsNumber, Min, IsOptional } from 'class-validator';
import { User } from './user.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded'
}

export enum PaymentMethod {
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  DIGITAL_WALLET = 'digital_wallet',
  CRYPTO = 'crypto'
}

export enum PaymentType {
  SUBSCRIPTION = 'subscription',
  ONE_TIME = 'one_time',
  REFUND = 'refund',
  ADJUSTMENT = 'adjustment'
}

export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  CAD = 'CAD',
  AUD = 'AUD'
}

@Entity('payments')
@Index(['status'])
@Index(['type'])
@Index(['stripePaymentIntentId'], { unique: true, where: 'stripe_payment_intent_id IS NOT NULL' })
@Index(['createdAt'])
@Index(['user'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @IsString()
  transactionId: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  stripePaymentIntentId?: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  stripeChargeId?: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  stripeCustomerId?: string;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @Column({ type: 'enum', enum: PaymentType })
  @IsEnum(PaymentType)
  type: PaymentType;

  @Column({ type: 'enum', enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  @IsNumber()
  @Min(0)
  amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  @IsNumber()
  @Min(0)
  feeAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  @IsNumber()
  netAmount: number;

  @Column({ type: 'enum', enum: Currency, default: Currency.USD })
  @IsEnum(Currency)
  currency: Currency;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    subscriptionId?: string;
    planId?: string;
    billingCycle?: string;
    discountCode?: string;
    discountAmount?: number;
    taxAmount?: number;
    invoiceId?: string;
    receiptUrl?: string;
    failureReason?: string;
    refundReason?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  paymentMethodDetails?: {
    type: string;
    card?: {
      brand: string;
      last4: string;
      expMonth: number;
      expYear: number;
      funding: string;
      country: string;
    };
    bankTransfer?: {
      accountHolderType: string;
      bankName: string;
      country: string;
    };
  };

  @Column({ nullable: true })
  @IsOptional()
  processedAt?: Date;

  @Column({ nullable: true })
  @IsOptional()
  failedAt?: Date;

  @Column({ nullable: true })
  @IsOptional()
  refundedAt?: Date;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  failureCode?: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  failureMessage?: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  receiptEmail?: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  receiptUrl?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, user => user.payments, { eager: true })
  user: User;

  // Virtual properties
  get isSuccessful(): boolean {
    return this.status === PaymentStatus.SUCCEEDED;
  }

  get isFailed(): boolean {
    return this.status === PaymentStatus.FAILED;
  }

  get isRefunded(): boolean {
    return this.status === PaymentStatus.REFUNDED || 
           this.status === PaymentStatus.PARTIALLY_REFUNDED;
  }

  get isPending(): boolean {
    return this.status === PaymentStatus.PENDING || 
           this.status === PaymentStatus.PROCESSING;
  }

  // Methods
  markAsSucceeded(stripeChargeId?: string, receiptUrl?: string): void {
    this.status = PaymentStatus.SUCCEEDED;
    this.processedAt = new Date();
    
    if (stripeChargeId) {
      this.stripeChargeId = stripeChargeId;
    }
    
    if (receiptUrl) {
      this.receiptUrl = receiptUrl;
      if (!this.metadata) this.metadata = {};
      this.metadata.receiptUrl = receiptUrl;
    }
  }

  markAsFailed(failureCode?: string, failureMessage?: string): void {
    this.status = PaymentStatus.FAILED;
    this.failedAt = new Date();
    this.failureCode = failureCode;
    this.failureMessage = failureMessage;
    
    if (!this.metadata) this.metadata = {};
    this.metadata.failureReason = failureMessage;
  }

  markAsRefunded(reason?: string): void {
    this.status = PaymentStatus.REFUNDED;
    this.refundedAt = new Date();
    
    if (!this.metadata) this.metadata = {};
    this.metadata.refundReason = reason;
  }

  updateFromStripeEvent(stripeEvent: any): void {
    const paymentIntent = stripeEvent.data.object;
    
    this.stripePaymentIntentId = paymentIntent.id;
    this.amount = paymentIntent.amount / 100; // Convert from cents
    this.currency = paymentIntent.currency.toUpperCase();
    
    if (paymentIntent.charges?.data?.[0]) {
      const charge = paymentIntent.charges.data[0];
      this.stripeChargeId = charge.id;
      this.receiptUrl = charge.receipt_url;
      this.paymentMethodDetails = {
        type: charge.payment_method_details.type,
        ...charge.payment_method_details
      };
    }

    switch (paymentIntent.status) {
      case 'succeeded':
        this.markAsSucceeded(this.stripeChargeId, this.receiptUrl);
        break;
      case 'processing':
        this.status = PaymentStatus.PROCESSING;
        break;
      case 'requires_payment_method':
      case 'requires_confirmation':
      case 'requires_action':
        this.status = PaymentStatus.PENDING;
        break;
      case 'canceled':
        this.status = PaymentStatus.CANCELLED;
        break;
      default:
        this.markAsFailed(paymentIntent.last_payment_error?.code, paymentIntent.last_payment_error?.message);
    }
  }

  generateTransactionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `txn_${timestamp}_${random}`.toUpperCase();
  }

  formatAmount(): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency
    }).format(this.amount);
  }

  toReceiptData() {
    return {
      id: this.id,
      transactionId: this.transactionId,
      amount: this.formatAmount(),
      status: this.status,
      method: this.method,
      processedAt: this.processedAt,
      description: this.description,
      receiptUrl: this.receiptUrl,
      user: {
        name: this.user.fullName,
        email: this.user.email
      }
    };
  }
}