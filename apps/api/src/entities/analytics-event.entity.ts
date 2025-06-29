import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('analytics_events')
@Index(['eventType', 'createdAt'])
@Index(['userId', 'createdAt'])
@Index(['sessionId', 'createdAt'])
export class AnalyticsEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ 
    type: 'enum',
    enum: [
      'page_view', 'form_submit', 'button_click', 'content_view', 
      'video_play', 'download', 'signup', 'conversion', 'email_open', 
      'email_click', 'search', 'error', 'custom'
    ]
  })
  @Index()
  eventType: string;

  @Column({ type: 'varchar', length: 255 })
  eventName: string; // Specific event name like 'hero_form_submit'

  @Column({ type: 'uuid', nullable: true })
  @Index()
  userId?: string; // Reference to user if authenticated

  @Column({ type: 'varchar', length: 255 })
  @Index()
  sessionId: string; // Browser session identifier

  @Column({ type: 'varchar', length: 500, nullable: true })
  pageUrl?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  referrer?: string;

  @Column({ type: 'json', nullable: true })
  eventProperties?: Record<string, any>; // Custom event data

  @Column({ type: 'json', nullable: true })
  userProperties?: Record<string, any>; // User context at time of event

  @Column({ type: 'varchar', length: 45, nullable: true })
  @Index()
  ipAddress?: string;

  @Column({ type: 'text', nullable: true })
  userAgent?: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  country?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  city?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  device?: string; // 'mobile', 'tablet', 'desktop'

  @Column({ type: 'varchar', length: 100, nullable: true })
  browser?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  os?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @Index()
  source?: string; // Marketing campaign source

  @Column({ type: 'varchar', length: 100, nullable: true })
  medium?: string; // Marketing campaign medium

  @Column({ type: 'varchar', length: 100, nullable: true })
  campaign?: string; // Marketing campaign name

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  value?: number; // Monetary value for conversion events

  @Column({ type: 'varchar', length: 10, nullable: true })
  currency?: string; // Currency code for value

  @Column({ type: 'boolean', default: false })
  @Index()
  isConversion: boolean; // Mark important conversion events

  @Column({ type: 'timestamp', nullable: true })
  clientTimestamp?: Date; // Client-side timestamp

  @CreateDateColumn()
  @Index()
  createdAt: Date; // Server timestamp
}