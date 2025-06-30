import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service';
import {
  ContentTierDto,
  ChapterDto,
  PromptTemplateDto,
  CaseStudyDto,
  SearchResultsDto,
  ContentSearchResultDto,
  ContentQueryDto,
  SearchQueryDto,
} from '../../dto/content.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);

  constructor(private prisma: PrismaService) {}

  // Content Tier Operations
  async getContentTiers(): Promise<ContentTierDto[]> {
    const tiers = await this.prisma.contentTier.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { chapters: true }
        }
      }
    });

    return tiers.map(tier => ({
      id: tier.id,
      name: tier.name,
      displayName: this.formatTierDisplayName(tier.name),
      price: Number(tier.price),
      description: tier.description || '',
      features: this.getTierFeatures(tier.name),
      chapterAccess: this.getTierChapterAccess(tier.name),
      sortOrder: tier.sortOrder,
      isActive: tier.isActive,
      popular: tier.name === 'advanced', // Mark advanced as popular
      chapterCount: tier._count.chapters
    }));
  }

  async getContentTierById(id: string): Promise<ContentTierDto | null> {
    const tier = await this.prisma.contentTier.findUnique({
      where: { id },
      include: {
        _count: {
          select: { chapters: true }
        }
      }
    });

    if (!tier) return null;

    return {
      id: tier.id,
      name: tier.name,
      displayName: this.formatTierDisplayName(tier.name),
      price: Number(tier.price),
      description: tier.description || '',
      features: this.getTierFeatures(tier.name),
      chapterAccess: this.getTierChapterAccess(tier.name),
      sortOrder: tier.sortOrder,
      isActive: tier.isActive,
      popular: tier.name === 'advanced',
      chapterCount: tier._count.chapters
    };
  }

  // Chapter Operations
  async getAllChapters(query: ContentQueryDto): Promise<ChapterDto[]> {
    const where: Prisma.ChapterWhereInput = {
      isPublished: query.published !== false,
    };

    // Apply filters
    if (query.tier) {
      where.tier = { name: query.tier };
    }

    if (query.tags) {
      const tagNames = query.tags.split(',').map(tag => tag.trim());
      where.tags = {
        some: {
          name: { in: tagNames }
        }
      };
    }

    const skip = ((query.page || 1) - 1) * (query.limit || 20);
    const take = query.limit || 20;

    const chapters = await this.prisma.chapter.findMany({
      where,
      skip,
      take,
      orderBy: { sortOrder: 'asc' },
      include: {
        tier: true,
        sections: {
          orderBy: { sortOrder: 'asc' }
        },
        templates: {
          where: { isActive: true }
        },
        caseStudies: {
          where: { isPublished: true }
        },
        assets: true,
        metadata: true,
        tags: true
      }
    });

    return chapters.map(chapter => this.mapChapterToDto(chapter));
  }

  async getChapterBySlug(slug: string): Promise<ChapterDto> {
    const chapter = await this.prisma.chapter.findUnique({
      where: { slug },
      include: {
        tier: true,
        sections: {
          orderBy: { sortOrder: 'asc' }
        },
        templates: {
          where: { isActive: true },
          include: {
            variables: true,
            examples: true,
            tags: true
          }
        },
        caseStudies: {
          where: { isPublished: true },
          include: {
            tags: true
          }
        },
        assets: true,
        metadata: true,
        tags: true
      }
    });

    if (!chapter) {
      throw new NotFoundException(`Chapter with slug "${slug}" not found`);
    }

    return this.mapChapterToDto(chapter);
  }

  async getChapterSections(slug: string) {
    const chapter = await this.prisma.chapter.findUnique({
      where: { slug },
      include: {
        sections: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    if (!chapter) {
      throw new NotFoundException(`Chapter with slug "${slug}" not found`);
    }

    return chapter.sections.map(section => ({
      id: section.id,
      title: section.title,
      content: section.content,
      type: this.inferSectionType(section.content),
      sortOrder: section.sortOrder,
      metadata: this.extractSectionMetadata(section.content)
    }));
  }

  // Template Operations
  async getTemplates(query: ContentQueryDto): Promise<PromptTemplateDto[]> {
    const where: Prisma.PromptTemplateWhereInput = {
      isActive: true,
    };

    if (query.category) {
      where.category = query.category;
    }

    if (query.difficulty) {
      where.difficulty = query.difficulty;
    }

    if (query.tags) {
      const tagNames = query.tags.split(',').map(tag => tag.trim());
      where.tags = {
        some: {
          name: { in: tagNames }
        }
      };
    }

    const skip = ((query.page || 1) - 1) * (query.limit || 20);
    const take = query.limit || 20;

    const templates = await this.prisma.promptTemplate.findMany({
      where,
      skip,
      take,
      orderBy: { [query.sortBy || 'createdAt']: query.sortOrder || 'desc' },
      include: {
        variables: true,
        examples: true,
        tags: true,
        chapter: true
      }
    });

    return templates.map(template => this.mapTemplateToDto(template));
  }

  async getTemplateBySlug(slug: string): Promise<PromptTemplateDto> {
    const template = await this.prisma.promptTemplate.findUnique({
      where: { slug },
      include: {
        variables: true,
        examples: true,
        tags: true,
        chapter: true
      }
    });

    if (!template) {
      throw new NotFoundException(`Template with slug "${slug}" not found`);
    }

    // Increment usage count
    await this.prisma.promptTemplate.update({
      where: { id: template.id },
      data: { usageCount: { increment: 1 } }
    });

    return this.mapTemplateToDto(template);
  }

  // Case Study Operations
  async getCaseStudies(query: ContentQueryDto): Promise<CaseStudyDto[]> {
    const where: Prisma.CaseStudyWhereInput = {
      isPublished: query.published !== false,
    };

    if (query.tags) {
      const tagNames = query.tags.split(',').map(tag => tag.trim());
      where.tags = {
        some: {
          name: { in: tagNames }
        }
      };
    }

    const skip = ((query.page || 1) - 1) * (query.limit || 20);
    const take = query.limit || 20;

    const caseStudies = await this.prisma.caseStudy.findMany({
      where,
      skip,
      take,
      orderBy: { [query.sortBy || 'createdAt']: query.sortOrder || 'desc' },
      include: {
        tags: true,
        chapter: true
      }
    });

    return caseStudies.map(caseStudy => this.mapCaseStudyToDto(caseStudy));
  }

  async getCaseStudyBySlug(slug: string): Promise<CaseStudyDto> {
    const caseStudy = await this.prisma.caseStudy.findUnique({
      where: { slug },
      include: {
        tags: true,
        chapter: true
      }
    });

    if (!caseStudy) {
      throw new NotFoundException(`Case study with slug "${slug}" not found`);
    }

    return this.mapCaseStudyToDto(caseStudy);
  }

  // Search Operations
  async searchContent(query: SearchQueryDto): Promise<SearchResultsDto> {
    const startTime = Date.now();
    const searchTerm = query.query.toLowerCase();
    const results: ContentSearchResultDto[] = [];

    try {
      // Search chapters
      if (!query.types || query.types.includes('chapter')) {
        const chapters = await this.searchChapters(searchTerm, query);
        results.push(...chapters);
      }

      // Search templates
      if (!query.types || query.types.includes('template')) {
        const templates = await this.searchTemplates(searchTerm, query);
        results.push(...templates);
      }

      // Search case studies
      if (!query.types || query.types.includes('case-study')) {
        const caseStudies = await this.searchCaseStudies(searchTerm, query);
        results.push(...caseStudies);
      }

      // Sort by relevance score
      results.sort((a, b) => b.relevanceScore - a.relevanceScore);

      // Apply limit
      const limitedResults = results.slice(0, query.limit || 20);

      const executionTime = Date.now() - startTime;

      return {
        query: query.query,
        totalResults: results.length,
        results: limitedResults,
        executionTime,
        breakdown: {
          chapters: results.filter(r => r.type === 'chapter').length,
          templates: results.filter(r => r.type === 'template').length,
          caseStudies: results.filter(r => r.type === 'case-study').length
        },
        suggestions: this.generateSearchSuggestions(query.query)
      };
    } catch (error) {
      this.logger.error('Search error:', error);
      throw new BadRequestException('Search failed');
    }
  }

  // Helper Methods
  private mapChapterToDto(chapter: any): ChapterDto {
    // Determine chapter number from tier and sort order
    const chapterNumber = this.calculateChapterNumber(chapter.tier.name, chapter.sortOrder);

    return {
      id: chapter.id,
      number: chapterNumber,
      title: chapter.title,
      subtitle: chapter.subtitle,
      slug: chapter.slug,
      description: chapter.description || '',
      content: chapter.content,
      wordCount: chapter.wordCount,
      estimatedReadTime: chapter.estimatedReadTime,
      difficulty: this.mapDifficulty(chapterNumber),
      tags: chapter.tags.map((tag: any) => tag.name),
      prerequisites: this.getChapterPrerequisites(chapterNumber),
      learningObjectives: this.getChapterLearningObjectives(chapter.title),
      sections: chapter.sections.map((section: any) => ({
        id: section.id,
        title: section.title,
        content: section.content,
        type: this.inferSectionType(section.content),
        metadata: this.extractSectionMetadata(section.content),
        sortOrder: section.sortOrder
      })),
      templateIds: chapter.templates.map((template: any) => template.id),
      exercises: this.generateExercises(chapter.title, chapterNumber),
      keyTakeaways: this.generateKeyTakeaways(chapter.title, chapterNumber),
      nextChapter: this.getNextChapterSlug(chapterNumber),
      previousChapter: this.getPreviousChapterSlug(chapterNumber),
      tier: {
        id: chapter.tier.id,
        name: chapter.tier.name,
        displayName: this.formatTierDisplayName(chapter.tier.name),
        price: Number(chapter.tier.price),
        description: chapter.tier.description || '',
        features: this.getTierFeatures(chapter.tier.name),
        chapterAccess: this.getTierChapterAccess(chapter.tier.name),
        sortOrder: chapter.tier.sortOrder,
        isActive: chapter.tier.isActive,
        popular: chapter.tier.name === 'advanced'
      },
      published: chapter.isPublished,
      assets: chapter.assets.map((asset: any) => ({
        id: asset.id,
        type: asset.assetType.toLowerCase(),
        url: asset.url || `/assets/${asset.path}`,
        title: asset.filename,
        description: asset.caption,
        altText: asset.alt,
        caption: asset.caption,
        metadata: asset.metadata as Record<string, any>
      })),
      metadata: chapter.metadata ? {
        seoTitle: chapter.metadata.metaTitle,
        seoDescription: chapter.metadata.metaDescription,
        estimatedReadTime: chapter.estimatedReadTime,
        wordCount: chapter.wordCount
      } : undefined,
      createdAt: chapter.createdAt,
      updatedAt: chapter.updatedAt
    };
  }

  private mapTemplateToDto(template: any): PromptTemplateDto {
    return {
      id: template.id,
      title: template.title,
      description: template.description || '',
      category: template.category,
      difficulty: template.difficulty as 'beginner' | 'intermediate' | 'advanced',
      template: template.template,
      variables: template.variables.map((variable: any) => ({
        name: variable.name,
        description: variable.description || '',
        type: this.mapVariableType(variable.dataType),
        options: variable.validationRules?.options,
        placeholder: variable.defaultValue,
        required: variable.isRequired
      })),
      examples: template.examples.map((example: any) => ({
        title: example.title,
        scenario: example.description || '',
        input: example.input as Record<string, any>,
        output: example.output
      })),
      tags: template.tags.map((tag: any) => tag.name),
      usageCount: template.usageCount,
      rating: Number(template.effectivenessScore || 0) / 20, // Convert 0-100 to 0-5
      chapterSlug: template.chapter?.slug
    };
  }

  private mapCaseStudyToDto(caseStudy: any): CaseStudyDto {
    return {
      id: caseStudy.id,
      title: caseStudy.title,
      description: caseStudy.description || '',
      slug: caseStudy.slug,
      content: caseStudy.content,
      industry: caseStudy.industry,
      companySize: caseStudy.companySize as 'startup' | 'medium' | 'enterprise',
      beforeMetrics: caseStudy.beforeMetrics as Record<string, any>,
      afterMetrics: caseStudy.afterMetrics as Record<string, any>,
      improvementPercentage: Number(caseStudy.improvementPercentage),
      timeframeWeeks: caseStudy.timeframeWeeks,
      tags: caseStudy.tags.map((tag: any) => tag.name),
      chapterSlug: caseStudy.chapter?.slug,
      published: caseStudy.isPublished,
      createdAt: caseStudy.createdAt,
      updatedAt: caseStudy.updatedAt
    };
  }

  private async searchChapters(searchTerm: string, query: SearchQueryDto): Promise<ContentSearchResultDto[]> {
    const chapters = await this.prisma.chapter.findMany({
      where: {
        isPublished: true,
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
          { content: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      include: {
        tags: true,
        tier: true
      },
      take: query.limit || 20
    });

    return chapters.map(chapter => ({
      id: chapter.id,
      type: 'chapter' as const,
      title: chapter.title,
      description: chapter.description || '',
      slug: chapter.slug,
      relevanceScore: this.calculateRelevanceScore(searchTerm, chapter.title, chapter.description || '', chapter.content),
      highlights: this.extractHighlights(searchTerm, [chapter.title, chapter.description || '', chapter.content]),
      tags: chapter.tags.map(tag => tag.name)
    }));
  }

  private async searchTemplates(searchTerm: string, query: SearchQueryDto): Promise<ContentSearchResultDto[]> {
    const templates = await this.prisma.promptTemplate.findMany({
      where: {
        isActive: true,
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
          { template: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      include: {
        tags: true,
        chapter: true
      },
      take: query.limit || 20
    });

    return templates.map(template => ({
      id: template.id,
      type: 'template' as const,
      title: template.title,
      description: template.description || '',
      slug: template.slug,
      relevanceScore: this.calculateRelevanceScore(searchTerm, template.title, template.description || '', template.template),
      chapterSlug: template.chapter?.slug,
      highlights: this.extractHighlights(searchTerm, [template.title, template.description || '', template.template]),
      tags: template.tags.map(tag => tag.name)
    }));
  }

  private async searchCaseStudies(searchTerm: string, query: SearchQueryDto): Promise<ContentSearchResultDto[]> {
    const caseStudies = await this.prisma.caseStudy.findMany({
      where: {
        isPublished: true,
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
          { content: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      include: {
        tags: true,
        chapter: true
      },
      take: query.limit || 20
    });

    return caseStudies.map(caseStudy => ({
      id: caseStudy.id,
      type: 'case-study' as const,
      title: caseStudy.title,
      description: caseStudy.description || '',
      slug: caseStudy.slug,
      relevanceScore: this.calculateRelevanceScore(searchTerm, caseStudy.title, caseStudy.description || '', caseStudy.content),
      chapterSlug: caseStudy.chapter?.slug,
      highlights: this.extractHighlights(searchTerm, [caseStudy.title, caseStudy.description || '', caseStudy.content]),
      tags: caseStudy.tags.map(tag => tag.name)
    }));
  }

  private calculateRelevanceScore(searchTerm: string, title: string, description: string, content: string): number {
    let score = 0;
    const term = searchTerm.toLowerCase();
    
    // Title match (highest weight)
    if (title.toLowerCase().includes(term)) {
      score += 1.0;
    }
    
    // Description match
    if (description.toLowerCase().includes(term)) {
      score += 0.7;
    }
    
    // Content match
    if (content.toLowerCase().includes(term)) {
      score += 0.3;
    }
    
    // Exact word match bonus
    const words = term.split(' ');
    words.forEach(word => {
      if (title.toLowerCase().includes(word)) score += 0.2;
      if (description.toLowerCase().includes(word)) score += 0.1;
    });

    return Math.min(1, score); // Cap at 1.0
  }

  private extractHighlights(searchTerm: string, texts: string[]): string[] {
    const highlights: string[] = [];
    const term = searchTerm.toLowerCase();
    
    texts.forEach(text => {
      const lowerText = text.toLowerCase();
      const index = lowerText.indexOf(term);
      if (index >= 0) {
        const start = Math.max(0, index - 30);
        const end = Math.min(text.length, index + term.length + 30);
        highlights.push(text.substring(start, end));
      }
    });

    return highlights.slice(0, 3); // Limit to 3 highlights
  }

  private generateSearchSuggestions(query: string): string[] {
    // Simple suggestion algorithm - could be enhanced with AI
    const suggestions = [
      'AI principles',
      'prompt engineering',
      'advanced templates',
      'case studies',
      'elite strategies'
    ];
    
    return suggestions.filter(s => 
      !s.toLowerCase().includes(query.toLowerCase()) && 
      query.length > 2
    ).slice(0, 3);
  }

  // Helper methods for data mapping
  private formatTierDisplayName(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  private getTierFeatures(tierName: string): string[] {
    switch (tierName) {
      case 'foundation':
        return [
          'Core AI principles',
          'Basic prompt engineering',
          'Foundation concepts',
          'Getting started guide'
        ];
      case 'advanced':
        return [
          'Advanced prompt strategies',
          'AI workflow optimization',
          'Professional templates',
          'Case studies',
          'Expert techniques'
        ];
      case 'elite':
        return [
          'Complete content library',
          'Exclusive templates',
          'Advanced tools',
          'Priority support',
          'Mastermind access',
          'Custom consulting'
        ];
      default:
        return [];
    }
  }

  private getTierChapterAccess(tierName: string): number[] {
    switch (tierName) {
      case 'foundation':
        return [1, 2, 3, 4, 5];
      case 'advanced':
        return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      case 'elite':
        return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
      default:
        return [];
    }
  }

  private calculateChapterNumber(tierName: string, sortOrder: number): number {
    // Calculate chapter number based on tier and sort order
    switch (tierName) {
      case 'foundation':
        return sortOrder;
      case 'advanced':
        return 5 + sortOrder;
      case 'elite':
        return 10 + sortOrder;
      default:
        return sortOrder;
    }
  }

  private mapDifficulty(chapterNumber: number): 'beginner' | 'intermediate' | 'advanced' {
    if (chapterNumber <= 5) return 'beginner';
    if (chapterNumber <= 10) return 'intermediate';
    return 'advanced';
  }

  private getChapterPrerequisites(chapterNumber: number): string[] {
    if (chapterNumber <= 1) return [];
    if (chapterNumber <= 5) return [`ch${chapterNumber - 1}-chapter`];
    return [`ch${chapterNumber - 1}-chapter`, 'foundation-complete'];
  }

  private getChapterLearningObjectives(title: string): string[] {
    // Generate basic learning objectives based on title
    return [
      `Understand the core concepts of ${title}`,
      `Apply practical techniques from ${title}`,
      `Integrate knowledge into real-world scenarios`
    ];
  }

  private generateExercises(title: string, chapterNumber: number): any[] {
    // Generate basic exercises - could be enhanced with real data
    return [
      {
        id: `exercise-${chapterNumber}-1`,
        title: `Practice Exercise: ${title}`,
        description: `Apply the concepts from ${title} to a real scenario`,
        type: 'practical',
        difficulty: this.mapDifficulty(chapterNumber),
        estimatedTime: 15,
        instructions: [
          'Review the chapter content',
          'Identify key concepts',
          'Apply to your current project',
          'Document your results'
        ]
      }
    ];
  }

  private generateKeyTakeaways(title: string, chapterNumber: number): string[] {
    // Generate basic takeaways - could be enhanced with real data
    return [
      `Master the ${title} methodology`,
      'Apply systematic thinking to AI challenges',
      'Develop practical implementation skills'
    ];
  }

  private getNextChapterSlug(chapterNumber: number): string | undefined {
    if (chapterNumber >= 15) return undefined;
    return `ch${chapterNumber + 1}-chapter`;
  }

  private getPreviousChapterSlug(chapterNumber: number): string | undefined {
    if (chapterNumber <= 1) return undefined;
    return `ch${chapterNumber - 1}-chapter`;
  }

  private inferSectionType(content: string): 'text' | 'code' | 'quote' | 'callout' | 'exercise' | 'template' {
    if (content.includes('```')) return 'code';
    if (content.startsWith('>')) return 'quote';
    if (content.includes('**Note:**') || content.includes('**Warning:**')) return 'callout';
    if (content.includes('Exercise:') || content.includes('Practice:')) return 'exercise';
    if (content.includes('Template:') || content.includes('{{')) return 'template';
    return 'text';
  }

  private extractSectionMetadata(content: string): any {
    const metadata: any = {};
    
    if (content.includes('```')) {
      const match = content.match(/```(\w+)/);
      if (match) {
        metadata.language = match[1];
      }
    }
    
    return metadata;
  }

  private mapVariableType(dataType: string): 'text' | 'number' | 'select' | 'textarea' {
    switch (dataType) {
      case 'number': return 'number';
      case 'array': return 'select';
      case 'string':
      default:
        return 'text';
    }
  }
}