import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index
} from 'typeorm';
import { IsNumber, Min, IsOptional } from 'class-validator';
import { Content } from './content.entity';

@Entity('content_analytics')
@Index(['content'])
@Index(['date'])
@Index(['createdAt'])
export class ContentAnalytics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ default: 0 })
  @IsNumber()
  @Min(0)
  views: number;

  @Column({ default: 0 })
  @IsNumber()
  @Min(0)
  uniqueViews: number;

  @Column({ default: 0 })
  @IsNumber()
  @Min(0)
  downloads: number;

  @Column({ default: 0 })
  @IsNumber()
  @Min(0)
  shares: number;

  @Column({ default: 0 })
  @IsNumber()
  @Min(0)
  ratings: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  @IsNumber()
  @Min(0)
  averageRating: number;

  @Column({ default: 0 })
  @IsNumber()
  @Min(0)
  timeSpent: number; // in seconds

  @Column({ default: 0 })
  @IsNumber()
  @Min(0)
  bounceRate: number; // percentage

  @Column({ type: 'jsonb', nullable: true })
  demographics?: {
    countries?: Record<string, number>;
    devices?: Record<string, number>;
    browsers?: Record<string, number>;
    referrers?: Record<string, number>;
    ageGroups?: Record<string, number>;
  };

  @Column({ type: 'jsonb', nullable: true })
  engagement?: {
    commentCount?: number;
    likeCount?: number;
    bookmarkCount?: number;
    completionRate?: number;
    averageSessionDuration?: number;
    returnVisitorRate?: number;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Content, content => content.analytics, { onDelete: 'CASCADE' })
  content: Content;

  // Virtual properties
  get engagementRate(): number {
    if (this.uniqueViews === 0) return 0;
    const engagementActions = (this.engagement?.commentCount || 0) + 
                             (this.engagement?.likeCount || 0) + 
                             this.shares + 
                             this.ratings;
    return (engagementActions / this.uniqueViews) * 100;
  }

  get conversionRate(): number {
    if (this.views === 0) return 0;
    return (this.downloads / this.views) * 100;
  }

  // Methods
  incrementViews(isUnique: boolean = false): void {
    this.views++;
    if (isUnique) {
      this.uniqueViews++;
    }
  }

  incrementDownloads(): void {
    this.downloads++;
  }

  incrementShares(): void {
    this.shares++;
  }

  addRating(rating: number): void {
    const totalRating = this.averageRating * this.ratings + rating;
    this.ratings++;
    this.averageRating = Math.round((totalRating / this.ratings) * 100) / 100;
  }

  addTimeSpent(seconds: number): void {
    this.timeSpent += seconds;
  }

  updateDemographics(country?: string, device?: string, browser?: string, referrer?: string): void {
    if (!this.demographics) {
      this.demographics = {
        countries: {},
        devices: {},
        browsers: {},
        referrers: {}
      };
    }

    if (country) {
      this.demographics.countries[country] = (this.demographics.countries[country] || 0) + 1;
    }

    if (device) {
      this.demographics.devices[device] = (this.demographics.devices[device] || 0) + 1;
    }

    if (browser) {
      this.demographics.browsers[browser] = (this.demographics.browsers[browser] || 0) + 1;
    }

    if (referrer) {
      this.demographics.referrers[referrer] = (this.demographics.referrers[referrer] || 0) + 1;
    }
  }

  updateEngagement(type: 'comment' | 'like' | 'bookmark', increment: number = 1): void {
    if (!this.engagement) {
      this.engagement = {
        commentCount: 0,
        likeCount: 0,
        bookmarkCount: 0
      };
    }

    switch (type) {
      case 'comment':
        this.engagement.commentCount = (this.engagement.commentCount || 0) + increment;
        break;
      case 'like':
        this.engagement.likeCount = (this.engagement.likeCount || 0) + increment;
        break;
      case 'bookmark':
        this.engagement.bookmarkCount = (this.engagement.bookmarkCount || 0) + increment;
        break;
    }
  }

  calculateBounceRate(): void {
    // Bounce rate calculation would depend on session tracking
    // This is a simplified version
    if (this.uniqueViews > 0 && this.timeSpent > 0) {
      const averageTimePerView = this.timeSpent / this.uniqueViews;
      // If average time is less than 30 seconds, consider it a bounce
      const bounces = averageTimePerView < 30 ? this.uniqueViews * 0.8 : this.uniqueViews * 0.2;
      this.bounceRate = (bounces / this.uniqueViews) * 100;
    }
  }

  toSummary() {
    return {
      date: this.date,
      views: this.views,
      uniqueViews: this.uniqueViews,
      downloads: this.downloads,
      shares: this.shares,
      averageRating: this.averageRating,
      engagementRate: this.engagementRate,
      conversionRate: this.conversionRate,
      bounceRate: this.bounceRate,
      timeSpent: this.timeSpent
    };
  }

  static createDailyAnalytics(content: Content, date: Date): ContentAnalytics {
    const analytics = new ContentAnalytics();
    analytics.content = content;
    analytics.date = date;
    analytics.views = 0;
    analytics.uniqueViews = 0;
    analytics.downloads = 0;
    analytics.shares = 0;
    analytics.ratings = 0;
    analytics.averageRating = 0;
    analytics.timeSpent = 0;
    analytics.bounceRate = 0;
    return analytics;
  }

  static aggregateWeekly(dailyAnalytics: ContentAnalytics[]): Partial<ContentAnalytics> {
    const totalViews = dailyAnalytics.reduce((sum, day) => sum + day.views, 0);
    const totalUniqueViews = dailyAnalytics.reduce((sum, day) => sum + day.uniqueViews, 0);
    const totalDownloads = dailyAnalytics.reduce((sum, day) => sum + day.downloads, 0);
    const totalShares = dailyAnalytics.reduce((sum, day) => sum + day.shares, 0);
    const totalTimeSpent = dailyAnalytics.reduce((sum, day) => sum + day.timeSpent, 0);
    
    const ratingsData = dailyAnalytics.filter(day => day.ratings > 0);
    const averageRating = ratingsData.length > 0 
      ? ratingsData.reduce((sum, day) => sum + (day.averageRating * day.ratings), 0) / 
        ratingsData.reduce((sum, day) => sum + day.ratings, 0)
      : 0;

    return {
      views: totalViews,
      uniqueViews: totalUniqueViews,
      downloads: totalDownloads,
      shares: totalShares,
      averageRating: Math.round(averageRating * 100) / 100,
      timeSpent: totalTimeSpent
    };
  }
}