import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
  BeforeInsert,
  BeforeUpdate
} from 'typeorm';
import { IsEnum, IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { User } from './user.entity';
import { ContentAnalytics } from './content-analytics.entity';

export enum ContentType {
  CHAPTER = 'chapter',
  PRINCIPLE = 'principle',
  TEMPLATE = 'template',
  LESSON = 'lesson',
  EXERCISE = 'exercise',
  RESOURCE = 'resource'
}

export enum ContentStatus {
  DRAFT = 'draft',
  REVIEW = 'review',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  DELETED = 'deleted'
}

export enum ContentDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

@Entity('content')
@Index(['slug'], { unique: true })
@Index(['status'])
@Index(['type'])
@Index(['category'])
@Index(['published'])
@Index(['createdAt'])
@Index(['author'])
export class Content {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @IsString()
  slug: string;

  @Column()
  @IsString()
  title: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  subtitle?: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Column({ type: 'text' })
  @IsString()
  content: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  excerpt?: string;

  @Column({ type: 'enum', enum: ContentType })
  @IsEnum(ContentType)
  type: ContentType;

  @Column({ type: 'enum', enum: ContentStatus, default: ContentStatus.DRAFT })
  @IsEnum(ContentStatus)
  status: ContentStatus;

  @Column({ type: 'enum', enum: ContentDifficulty, default: ContentDifficulty.BEGINNER })
  @IsEnum(ContentDifficulty)
  difficulty: ContentDifficulty;

  @Column()
  @IsString()
  category: string;

  @Column({ type: 'simple-array', nullable: true })
  tags?: string[];

  @Column({ nullable: true })
  @IsOptional()
  featuredImage?: string;

  @Column({ type: 'jsonb', nullable: true })
  images?: {
    url: string;
    alt: string;
    caption?: string;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    estimatedReadTime?: number;
    wordCount?: number;
    chapters?: number;
    exercises?: number;
    resources?: string[];
    prerequisites?: string[];
    learningObjectives?: string[];
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string[];
  };

  @Column({ default: 0 })
  @IsNumber()
  @Min(0)
  sortOrder: number;

  @Column({ default: 0 })
  @IsNumber()
  @Min(0)
  views: number;

  @Column({ default: 0 })
  @IsNumber()
  @Min(0)
  @Max(5)
  averageRating: number;

  @Column({ default: 0 })
  @IsNumber()
  @Min(0)
  ratingCount: number;

  @Column({ default: false })
  featured: boolean;

  @Column({ default: false })
  premium: boolean;

  @Column({ nullable: true })
  @IsOptional()
  publishedAt?: Date;

  @Column({ nullable: true })
  @IsOptional()
  archivedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, user => user.authoredContent, { eager: true })
  author: User;

  @OneToMany(() => ContentAnalytics, analytics => analytics.content)
  analytics: ContentAnalytics[];

  // Virtual properties
  get isPublished(): boolean {
    return this.status === ContentStatus.PUBLISHED && !!this.publishedAt;
  }

  get isActive(): boolean {
    return this.status === ContentStatus.PUBLISHED && !this.archivedAt;
  }

  get readingTime(): number {
    if (this.metadata?.estimatedReadTime) {
      return this.metadata.estimatedReadTime;
    }
    
    // Estimate reading time (200 words per minute average)
    const wordCount = this.metadata?.wordCount || this.content.split(/\s+/).length;
    return Math.ceil(wordCount / 200);
  }

  // Methods
  @BeforeInsert()
  @BeforeUpdate()
  generateSlug() {
    if (!this.slug && this.title) {
      this.slug = this.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
  }

  @BeforeInsert()
  @BeforeUpdate()
  updateMetadata() {
    if (!this.metadata) {
      this.metadata = {};
    }

    // Update word count
    this.metadata.wordCount = this.content.split(/\s+/).length;

    // Update estimated read time
    this.metadata.estimatedReadTime = this.readingTime;

    // Generate excerpt if not provided
    if (!this.excerpt && this.content) {
      this.excerpt = this.content
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .substring(0, 200) + '...';
    }
  }

  @BeforeUpdate()
  updatePublishedDate() {
    if (this.status === ContentStatus.PUBLISHED && !this.publishedAt) {
      this.publishedAt = new Date();
    }

    if (this.status === ContentStatus.ARCHIVED && !this.archivedAt) {
      this.archivedAt = new Date();
    }
  }

  incrementViews(): void {
    this.views += 1;
  }

  updateRating(newRating: number): void {
    const totalRating = this.averageRating * this.ratingCount + newRating;
    this.ratingCount += 1;
    this.averageRating = Math.round((totalRating / this.ratingCount) * 100) / 100;
  }

  canBeAccessedBy(user?: User): boolean {
    // Public content
    if (!this.premium) {
      return this.isPublished;
    }

    // Premium content requires authenticated user with active subscription
    if (!user) {
      return false;
    }

    // Admins and instructors can access all content
    if (user.role === 'admin' || user.role === 'instructor') {
      return this.isPublished;
    }

    // Check if user has active subscription for premium content
    return this.isPublished && user.subscription?.status === 'active';
  }

  toSearchableText(): string {
    return [
      this.title,
      this.subtitle,
      this.description,
      this.content.replace(/<[^>]*>/g, ''), // Remove HTML
      this.category,
      ...(this.tags || []),
      ...(this.metadata?.learningObjectives || [])
    ].filter(Boolean).join(' ');
  }
}