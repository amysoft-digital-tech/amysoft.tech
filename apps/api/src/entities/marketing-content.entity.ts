import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('marketing_content')
@Index(['type', 'status'])
@Index(['slug'], { unique: true })
export class MarketingContent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ 
    type: 'enum',
    enum: ['hero', 'principles', 'testimonials', 'pricing', 'faq', 'blog', 'author'],
  })
  @Index()
  type: 'hero' | 'principles' | 'testimonials' | 'pricing' | 'faq' | 'blog' | 'author';

  @Column({ type: 'varchar', length: 255 })
  @Index()
  slug: string; // URL-friendly identifier

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'json' })
  content: Record<string, any>; // Flexible content structure

  @Column({ 
    type: 'enum',
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  })
  @Index()
  status: 'draft' | 'published' | 'archived';

  @Column({ type: 'varchar', length: 10, nullable: true })
  language: string; // 'en', 'es', 'fr' for i18n

  @Column({ type: 'json', nullable: true })
  seoMetadata?: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogImage?: string;
    canonicalUrl?: string;
  };

  @Column({ type: 'json', nullable: true })
  abTestVariants?: {
    [variantName: string]: {
      content: Record<string, any>;
      trafficPercentage: number;
      active: boolean;
    };
  };

  @Column({ type: 'varchar', length: 100, nullable: true })
  author?: string;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt?: Date; // For scheduled publishing

  @Column({ type: 'int', default: 0 })
  views: number;

  @Column({ type: 'int', default: 0 })
  engagements: number; // clicks, form submissions, etc.

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  conversionRate?: number;

  @Column({ type: 'json', nullable: true })
  tags?: string[];

  @Column({ type: 'json', nullable: true })
  customFields?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}