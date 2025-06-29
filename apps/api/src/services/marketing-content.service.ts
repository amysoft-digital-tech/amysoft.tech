import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketingContent } from '../entities/marketing-content.entity';
import { Content } from '../entities/content.entity';
import { GetMarketingContentDto, MarketingContentResponseDto, ContentPreviewDto, ContentPreviewResponseDto } from '../dto/marketing-content.dto';
import { CacheService } from './cache.service';

@Injectable()
export class MarketingContentService {
  constructor(
    @InjectRepository(MarketingContent)
    private marketingContentRepository: Repository<MarketingContent>,
    @InjectRepository(Content)
    private contentRepository: Repository<Content>,
    private cacheService: CacheService,
  ) {}

  async getMarketingContent(
    type: string, 
    query: GetMarketingContentDto
  ): Promise<MarketingContentResponseDto> {
    const cacheKey = `marketing-content:${type}:${query.variant || 'default'}:${query.language || 'en'}`;
    
    // Try to get from cache first
    const cached = await this.cacheService.get(cacheKey);
    if (cached && !query.preview) {
      return cached;
    }

    // Find content by type
    const queryBuilder = this.marketingContentRepository
      .createQueryBuilder('content')
      .where('content.type = :type', { type })
      .andWhere('content.language = :language', { language: query.language || 'en' });

    if (!query.preview) {
      queryBuilder.andWhere('content.status = :status', { status: 'published' });
    }

    let content = await queryBuilder.getOne();

    if (!content) {
      throw new NotFoundException(`Marketing content of type '${type}' not found`);
    }

    // Handle A/B testing variants
    let finalContent = content.content;
    if (query.variant && content.abTestVariants && content.abTestVariants[query.variant]) {
      const variant = content.abTestVariants[query.variant];
      if (variant.active) {
        finalContent = { ...finalContent, ...variant.content };
      }
    }

    const response: MarketingContentResponseDto = {
      id: content.id,
      type: content.type,
      title: content.title,
      description: content.description,
      content: finalContent,
      seoMetadata: content.seoMetadata,
      publishedAt: content.publishedAt,
      lastUpdated: content.updatedAt
    };

    // Track view
    await this.trackContentView(content.id);

    // Cache the response for 5 minutes
    if (!query.preview) {
      await this.cacheService.set(cacheKey, response, 300);
    }

    return response;
  }

  async getContentPreviews(query: ContentPreviewDto): Promise<ContentPreviewResponseDto[]> {
    const cacheKey = `content-previews:${query.category || 'all'}:${query.limit || '20'}`;
    
    // Try cache first
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return this.filterByUserTier(cached, query.userTier);
    }

    const queryBuilder = this.contentRepository
      .createQueryBuilder('content')
      .where('content.status = :status', { status: 'published' });

    if (query.category) {
      queryBuilder.andWhere('content.category = :category', { category: query.category });
    }

    const limit = parseInt(query.limit || '20');
    queryBuilder
      .orderBy('content.publishedAt', 'DESC')
      .limit(limit);

    const contents = await queryBuilder.getMany();

    const previews = contents.map(content => this.createContentPreview(content));

    // Cache for 10 minutes
    await this.cacheService.set(cacheKey, previews, 600);

    return this.filterByUserTier(previews, query.userTier);
  }

  async getStaticMarketingData(): Promise<Record<string, any>> {
    // This method returns static marketing data that doesn't change often
    const cacheKey = 'static-marketing-data';
    
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const data = {
      heroData: await this.getHeroData(),
      principlesData: await this.getPrinciplesData(),
      testimonialsData: await this.getTestimonialsData(),
      pricingData: await this.getPricingData(),
      faqData: await this.getFaqData(),
      authorData: await this.getAuthorData()
    };

    // Cache for 1 hour
    await this.cacheService.set(cacheKey, data, 3600);

    return data;
  }

  private async getHeroData(): Promise<any> {
    const heroContent = await this.marketingContentRepository.findOne({
      where: { type: 'hero', status: 'published' }
    });

    return heroContent?.content || {
      headline: "Beyond the AI Plateau: Master the Elite Principles of AI-Driven Development",
      subheadline: "Transform from AI novice to elite developer with proven strategies that 97% of developers miss",
      ctaText: "Get Instant Access to Elite Principles",
      ctaUrl: "/signup",
      features: [
        "5 Elite Principles of AI Development",
        "15+ Practical Templates",
        "Direct Access to Expert Guidance"
      ],
      socialProof: {
        memberCount: 1247,
        testimonialCount: 89,
        averageRating: 4.8
      }
    };
  }

  private async getPrinciplesData(): Promise<any> {
    const principlesContent = await this.marketingContentRepository.findOne({
      where: { type: 'principles', status: 'published' }
    });

    return principlesContent?.content || {
      principles: [
        {
          id: "strategic-prompting",
          title: "Strategic Prompting Mastery",
          description: "Advanced prompt engineering techniques that separate elite developers from the masses",
          previewContent: "Most developers use AI like a search engine. Elite developers use it like a specialized team member...",
          icon: "strategy-icon.svg",
          chapterReference: "chapter-2",
          estimatedReadTime: 12,
          difficultyLevel: "intermediate"
        },
        {
          id: "code-generation-optimization",
          title: "Code Generation Optimization",
          description: "Maximizing AI code generation effectiveness while maintaining quality standards",
          previewContent: "The difference between getting working code and getting production-ready code...",
          icon: "optimization-icon.svg",
          chapterReference: "chapter-4",
          estimatedReadTime: 15,
          difficultyLevel: "advanced"
        }
      ],
      totalChapters: 15
    };
  }

  private async getTestimonialsData(): Promise<any> {
    const testimonialsContent = await this.marketingContentRepository.findOne({
      where: { type: 'testimonials', status: 'published' }
    });

    return testimonialsContent?.content || {
      testimonials: [
        {
          id: "testimonial-1",
          name: "Sarah Chen",
          title: "Senior Full Stack Developer",
          company: "TechCorp",
          avatar: "/assets/testimonials/sarah-chen.jpg",
          rating: 5,
          quote: "This transformed how I work with AI. I'm 3x more productive and my code quality has never been better.",
          tags: ["React", "Senior Developer", "Full Stack"],
          verified: true,
          featured: true
        }
      ],
      stats: {
        totalTestimonials: 89,
        averageRating: 4.8,
        verifiedCount: 67
      }
    };
  }

  private async getPricingData(): Promise<any> {
    const pricingContent = await this.marketingContentRepository.findOne({
      where: { type: 'pricing', status: 'published' }
    });

    return pricingContent?.content || {
      tiers: [
        {
          id: "foundation",
          name: "Foundation",
          description: "Perfect for developers starting their AI journey",
          pricing: {
            monthly: 29,
            annual: 290,
            currency: "USD",
            annualDiscount: 17
          },
          features: [
            { name: "5 Core Chapters", included: true, description: "Essential AI development principles" },
            { name: "Basic Template Library", included: true, description: "20+ proven prompts and templates" },
            { name: "Community Access", included: true, description: "Join our developer community" },
            { name: "1-on-1 Coaching", included: false, description: "Direct mentorship sessions" }
          ],
          ctaText: "Start Foundation",
          popular: false
        }
      ]
    };
  }

  private async getFaqData(): Promise<any> {
    const faqContent = await this.marketingContentRepository.findOne({
      where: { type: 'faq', status: 'published' }
    });

    return faqContent?.content || {
      categories: [
        {
          name: "Technical",
          questions: [
            {
              id: "tech-1",
              question: "What IDEs and editors are supported?",
              answer: "Our techniques work with any IDE. We provide specific examples for VS Code, JetBrains IDEs, and Vim/Neovim.",
              tags: ["technical", "tools"]
            }
          ]
        }
      ]
    };
  }

  private async getAuthorData(): Promise<any> {
    const authorContent = await this.marketingContentRepository.findOne({
      where: { type: 'author', status: 'published' }
    });

    return authorContent?.content || {
      name: "Christopher Caruso",
      title: "AI Development Expert",
      bio: "Christopher has been at the forefront of AI-driven development...",
      avatar: "/assets/author-avatar.jpg",
      credentials: [
        "10+ years in software development",
        "AI/ML consultant for Fortune 500 companies",
        "Speaker at major tech conferences"
      ],
      socialLinks: {
        linkedin: "https://linkedin.com/in/christophercaruso",
        twitter: "https://twitter.com/christophercaruso",
        github: "https://github.com/christophercaruso"
      }
    };
  }

  private createContentPreview(content: Content): ContentPreviewResponseDto {
    const previewLength = 500;
    const fullContentLength = content.body ? JSON.stringify(content.body).length : 0;
    
    return {
      id: content.id,
      title: content.title,
      description: content.description || '',
      previewContent: this.extractPreviewText(content.body, previewLength),
      fullContentLength,
      previewLength,
      estimatedReadTime: Math.ceil(fullContentLength / 1000), // Rough estimate
      difficulty: (content.metadata as any)?.difficulty || 'intermediate',
      author: {
        name: "Christopher Caruso",
        title: "AI Development Expert",
        avatar: "/assets/author-avatar.jpg"
      },
      publishedDate: content.publishedAt || content.createdAt,
      lastUpdated: content.updatedAt,
      tags: (content.metadata as any)?.tags || [],
      requiredTier: (content.metadata as any)?.requiredTier || 'foundation',
      chapterNumber: (content.metadata as any)?.chapterNumber,
      nextChapter: (content.metadata as any)?.nextChapter,
      previousChapter: (content.metadata as any)?.previousChapter
    };
  }

  private extractPreviewText(body: any, maxLength: number): string {
    if (!body) return '';
    
    if (typeof body === 'string') {
      return body.substring(0, maxLength) + (body.length > maxLength ? '...' : '');
    }
    
    if (typeof body === 'object' && body.content) {
      return this.extractPreviewText(body.content, maxLength);
    }
    
    return JSON.stringify(body).substring(0, maxLength) + '...';
  }

  private filterByUserTier(previews: ContentPreviewResponseDto[], userTier?: string): ContentPreviewResponseDto[] {
    if (!userTier) {
      return previews; // Return all if no tier specified
    }

    const tierHierarchy = {
      'foundation': 1,
      'professional': 2,
      'elite': 3
    };

    const userTierLevel = tierHierarchy[userTier as keyof typeof tierHierarchy] || 0;

    return previews.filter(preview => {
      const requiredTierLevel = tierHierarchy[preview.requiredTier as keyof typeof tierHierarchy] || 1;
      return userTierLevel >= requiredTierLevel;
    });
  }

  private async trackContentView(contentId: string): Promise<void> {
    try {
      await this.marketingContentRepository.increment(
        { id: contentId },
        'views',
        1
      );
    } catch (error) {
      console.error('Failed to track content view:', error);
    }
  }
}