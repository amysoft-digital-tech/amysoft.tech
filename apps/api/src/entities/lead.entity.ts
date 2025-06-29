import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('leads')
@Index(['email'], { unique: true })
@Index(['source', 'createdAt'])
@Index(['status', 'createdAt'])
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name?: string;

  @Column({ 
    type: 'enum', 
    enum: ['beginner', 'intermediate', 'advanced'],
    nullable: true 
  })
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';

  @Column({ type: 'varchar', length: 100, nullable: true })
  primaryLanguage?: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  source: string; // 'hero-form', 'pricing-page', 'blog-post', 'exit-intent'

  @Column({ 
    type: 'enum', 
    enum: ['new', 'contacted', 'converted', 'unsubscribed'],
    default: 'new' 
  })
  @Index()
  status: 'new' | 'contacted' | 'converted' | 'unsubscribed';

  @Column({ type: 'boolean', default: false })
  gdprConsent: boolean;

  @Column({ type: 'boolean', default: false })
  marketingConsent: boolean;

  @Column({ type: 'boolean', default: false })
  newsletterSubscribed: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  utmSource?: string; // 'google', 'facebook', 'direct'

  @Column({ type: 'varchar', length: 100, nullable: true })
  utmMedium?: string; // 'cpc', 'organic', 'email'

  @Column({ type: 'varchar', length: 100, nullable: true })
  utmCampaign?: string; // 'ai-development', 'elite-principles'

  @Column({ type: 'varchar', length: 100, nullable: true })
  utmTerm?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  utmContent?: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  @Index()
  ipAddress?: string;

  @Column({ type: 'text', nullable: true })
  userAgent?: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  country?: string; // ISO country code

  @Column({ type: 'varchar', length: 100, nullable: true })
  referrer?: string;

  @Column({ type: 'json', nullable: true })
  customProperties?: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  firstContactedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  convertedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastEmailSentAt?: Date;

  @Column({ type: 'int', default: 0 })
  emailsSent: number;

  @Column({ type: 'int', default: 0 })
  emailsOpened: number;

  @Column({ type: 'int', default: 0 })
  emailsClicked: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  conversionProbability?: number; // ML-generated probability score

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}