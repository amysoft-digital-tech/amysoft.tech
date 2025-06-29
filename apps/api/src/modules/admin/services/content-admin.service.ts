import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, IsNull, Not } from 'typeorm';
import { Content } from '../../../entities/content.entity';
import { ContentAnalytics } from '../../../entities/content-analytics.entity';
import { ContentSearchParams } from '../interfaces/admin.interfaces';

@Injectable()
export class ContentAdminService {
  constructor(
    @InjectRepository(Content)
    private readonly contentRepository: Repository<Content>,
    @InjectRepository(ContentAnalytics)
    private readonly analyticsRepository: Repository<ContentAnalytics>,
  ) {}

  async searchContent(params: ContentSearchParams): Promise<{
    content: any[];
    total: number;
  }> {
    const query = this.contentRepository.createQueryBuilder('content')
      .leftJoinAndSelect('content.author', 'author')
      .leftJoinAndSelect('content.category', 'category');

    // Apply search filters
    if (params.query) {
      query.andWhere(
        '(content.title LIKE :query OR content.description LIKE :query OR content.tags LIKE :query)',
        { query: `%${params.query}%` },
      );
    }

    if (params.type) {
      query.andWhere('content.type = :type', { type: params.type });
    }

    if (params.status) {
      if (params.status === 'published') {
        query.andWhere('content.publishedAt IS NOT NULL');
      } else if (params.status === 'draft') {
        query.andWhere('content.publishedAt IS NULL AND content.archivedAt IS NULL');
      } else if (params.status === 'archived') {
        query.andWhere('content.archivedAt IS NOT NULL');
      }
    }

    if (params.authorId) {
      query.andWhere('content.authorId = :authorId', { authorId: params.authorId });
    }

    if (params.categoryId) {
      query.andWhere('content.categoryId = :categoryId', { categoryId: params.categoryId });
    }

    if (params.dateFrom && params.dateTo) {
      query.andWhere('content.createdAt BETWEEN :dateFrom AND :dateTo', {
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
      });
    }

    // Apply sorting
    query.orderBy('content.createdAt', 'DESC');

    // Apply pagination
    if (params.limit) {
      query.limit(params.limit);
    }
    if (params.offset) {
      query.offset(params.offset);
    }

    const [items, total] = await query.getManyAndCount();

    // Enrich with analytics data
    const content = await Promise.all(items.map(async (item) => {
      const analytics = await this.getContentAnalytics(item.id);
      
      return {
        id: item.id,
        title: item.title,
        type: item.type,
        status: this.getContentStatus(item),
        author: item.author ? {
          id: item.author.id,
          name: `${item.author.firstName} ${item.author.lastName}`,
          email: item.author.email,
        } : null,
        category: item.category,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        publishedAt: item.publishedAt,
        archivedAt: item.archivedAt,
        analytics: {
          views: analytics.totalViews,
          uniqueViews: analytics.uniqueViews,
          avgTimeSpent: analytics.avgTimeSpent,
          completionRate: analytics.completionRate,
          engagementScore: analytics.engagementScore,
        },
      };
    }));

    return { content, total };
  }

  async getContentDetails(contentId: string): Promise<any> {
    const content = await this.contentRepository.findOne({
      where: { id: contentId },
      relations: ['author', 'category'],
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    const [analytics, versionHistory, relatedContent] = await Promise.all([
      this.getDetailedAnalytics(contentId),
      this.getVersionHistory(contentId),
      this.getRelatedContent(contentId),
    ]);

    return {
      content: {
        id: content.id,
        title: content.title,
        description: content.description,
        type: content.type,
        body: content.body,
        tags: content.tags,
        metadata: content.metadata,
        status: this.getContentStatus(content),
        author: content.author ? {
          id: content.author.id,
          name: `${content.author.firstName} ${content.author.lastName}`,
          email: content.author.email,
        } : null,
        category: content.category,
        createdAt: content.createdAt,
        updatedAt: content.updatedAt,
        publishedAt: content.publishedAt,
        archivedAt: content.archivedAt,
      },
      analytics,
      versionHistory,
      relatedContent,
    };
  }

  async createContent(data: {
    title: string;
    description: string;
    type: string;
    body: any;
    tags: string[];
    categoryId: string;
    authorId: string;
    metadata?: any;
  }): Promise<Content> {
    const content = this.contentRepository.create({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return this.contentRepository.save(content);
  }

  async updateContent(contentId: string, updates: Partial<Content>): Promise<Content> {
    const content = await this.contentRepository.findOne({ where: { id: contentId } });
    
    if (!content) {
      throw new NotFoundException('Content not found');
    }

    // Store current version in history before updating
    await this.createVersionSnapshot(content);

    Object.assign(content, updates);
    content.updatedAt = new Date();

    return this.contentRepository.save(content);
  }

  async publishContent(contentId: string): Promise<Content> {
    const content = await this.contentRepository.findOne({ where: { id: contentId } });
    
    if (!content) {
      throw new NotFoundException('Content not found');
    }

    content.publishedAt = new Date();
    content.archivedAt = null;

    return this.contentRepository.save(content);
  }

  async archiveContent(contentId: string): Promise<Content> {
    const content = await this.contentRepository.findOne({ where: { id: contentId } });
    
    if (!content) {
      throw new NotFoundException('Content not found');
    }

    content.archivedAt = new Date();

    return this.contentRepository.save(content);
  }

  async deleteContent(contentId: string): Promise<void> {
    const result = await this.contentRepository.delete(contentId);
    
    if (result.affected === 0) {
      throw new NotFoundException('Content not found');
    }
  }

  async bulkUpdateContent(contentIds: string[], updates: {
    status?: 'publish' | 'archive' | 'delete';
    categoryId?: string;
    tags?: string[];
  }): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const contentId of contentIds) {
      try {
        if (updates.status === 'publish') {
          await this.publishContent(contentId);
        } else if (updates.status === 'archive') {
          await this.archiveContent(contentId);
        } else if (updates.status === 'delete') {
          await this.deleteContent(contentId);
        } else {
          await this.updateContent(contentId, updates);
        }
        success++;
      } catch (error) {
        failed++;
      }
    }

    return { success, failed };
  }

  private getContentStatus(content: Content): 'draft' | 'published' | 'archived' {
    if (content.archivedAt) return 'archived';
    if (content.publishedAt) return 'published';
    return 'draft';
  }

  private async getContentAnalytics(contentId: string): Promise<any> {
    const analytics = await this.analyticsRepository.findOne({
      where: { contentId },
    });

    if (!analytics) {
      return {
        totalViews: 0,
        uniqueViews: 0,
        avgTimeSpent: 0,
        completionRate: 0,
        engagementScore: 0,
      };
    }

    return {
      totalViews: analytics.viewCount || 0,
      uniqueViews: analytics.uniqueViewCount || 0,
      avgTimeSpent: analytics.avgTimeSpent || 0,
      completionRate: analytics.completionRate || 0,
      engagementScore: this.calculateEngagementScore(analytics),
    };
  }

  private async getDetailedAnalytics(contentId: string): Promise<any> {
    const analytics = await this.analyticsRepository.findOne({
      where: { contentId },
    });

    if (!analytics) {
      return this.getEmptyAnalytics();
    }

    return {
      overview: {
        totalViews: analytics.viewCount || 0,
        uniqueViews: analytics.uniqueViewCount || 0,
        avgTimeSpent: analytics.avgTimeSpent || 0,
        completionRate: analytics.completionRate || 0,
        engagementScore: this.calculateEngagementScore(analytics),
        lastViewed: analytics.lastViewedAt,
      },
      trends: {
        daily: analytics.dailyViews || [],
        weekly: analytics.weeklyViews || [],
        monthly: analytics.monthlyViews || [],
      },
      demographics: {
        byCountry: analytics.viewsByCountry || {},
        byDevice: analytics.viewsByDevice || {},
        bySource: analytics.viewsBySource || {},
      },
      engagement: {
        likes: analytics.likeCount || 0,
        shares: analytics.shareCount || 0,
        bookmarks: analytics.bookmarkCount || 0,
        comments: analytics.commentCount || 0,
      },
    };
  }

  private getEmptyAnalytics(): any {
    return {
      overview: {
        totalViews: 0,
        uniqueViews: 0,
        avgTimeSpent: 0,
        completionRate: 0,
        engagementScore: 0,
        lastViewed: null,
      },
      trends: {
        daily: [],
        weekly: [],
        monthly: [],
      },
      demographics: {
        byCountry: {},
        byDevice: {},
        bySource: {},
      },
      engagement: {
        likes: 0,
        shares: 0,
        bookmarks: 0,
        comments: 0,
      },
    };
  }

  private calculateEngagementScore(analytics: ContentAnalytics): number {
    const viewScore = Math.min(analytics.viewCount / 100, 1) * 25;
    const timeScore = Math.min(analytics.avgTimeSpent / 300, 1) * 25;
    const completionScore = (analytics.completionRate || 0) * 25;
    const interactionScore = Math.min(
      ((analytics.likeCount || 0) + (analytics.shareCount || 0) + (analytics.bookmarkCount || 0)) / 10,
      1
    ) * 25;

    return Math.round(viewScore + timeScore + completionScore + interactionScore);
  }

  private async createVersionSnapshot(content: Content): Promise<void> {
    // In a real implementation, this would store version history
    // For now, we'll just log it
    console.log(`Creating version snapshot for content ${content.id}`);
  }

  private async getVersionHistory(contentId: string): Promise<any[]> {
    // In a real implementation, this would fetch from a version history table
    // For now, return mock data
    return [
      {
        version: 1,
        createdAt: new Date(),
        author: 'System',
        changes: 'Initial version',
      },
    ];
  }

  private async getRelatedContent(contentId: string): Promise<any[]> {
    const content = await this.contentRepository.findOne({
      where: { id: contentId },
    });

    if (!content) {
      return [];
    }

    // Find content with similar tags or in the same category
    const related = await this.contentRepository
      .createQueryBuilder('content')
      .where('content.id != :contentId', { contentId })
      .andWhere(
        '(content.categoryId = :categoryId OR content.tags && :tags)',
        {
          categoryId: content.categoryId,
          tags: content.tags,
        },
      )
      .limit(5)
      .getMany();

    return related.map(item => ({
      id: item.id,
      title: item.title,
      type: item.type,
      status: this.getContentStatus(item),
      relevanceScore: 0.8, // Placeholder
    }));
  }
}