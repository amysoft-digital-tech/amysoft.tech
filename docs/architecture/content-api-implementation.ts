// src/content/content.module.ts
import { Module } from '@nestjs/common';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}

// src/content/content.controller.ts
import { Controller, Get, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ContentService } from './content.service';
import { ChapterDto, PromptTemplateDto, CaseStudyDto, ContentTierDto } from './dto';

@ApiTags('content')
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get('tiers')
  @ApiOperation({ summary: 'Get all content tiers' })
  @ApiResponse({ status: 200, type: [ContentTierDto] })
  async getContentTiers(): Promise<ContentTierDto[]> {
    return this.contentService.getContentTiers();
  }

  @Get('chapters')
  @ApiOperation({ summary: 'Get chapters with optional filtering' })
  @ApiQuery({ name: 'tier', required: false })
  @ApiQuery({ name: 'published', required: false, type: Boolean })
  @ApiResponse({ status: 200, type: [ChapterDto] })
  async getChapters(
    @Query('tier') tier?: string,
    @Query('published') published?: boolean,
  ): Promise<ChapterDto[]> {
    return this.contentService.getChapters({ tier, published });
  }

  @Get('chapters/:slug')
  @ApiOperation({ summary: 'Get chapter by slug' })
  @ApiResponse({ status: 200, type: ChapterDto })
  async getChapterBySlug(@Param('slug') slug: string): Promise<ChapterDto> {
    return this.contentService.getChapterBySlug(slug);
  }

  @Get('chapters/:slug/sections')
  @ApiOperation({ summary: 'Get chapter sections' })
  async getChapterSections(@Param('slug') slug: string) {
    return this.contentService.getChapterSections(slug);
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get prompt templates' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'difficulty', required: false })
  @ApiQuery({ name: 'chapter', required: false })
  @ApiResponse({ status: 200, type: [PromptTemplateDto] })
  async getPromptTemplates(
    @Query('category') category?: string,
    @Query('difficulty') difficulty?: string,
    @Query('chapter') chapter?: string,
  ): Promise<PromptTemplateDto[]> {
    return this.contentService.getPromptTemplates({ category, difficulty, chapter });
  }

  @Get('templates/:slug')
  @ApiOperation({ summary: 'Get prompt template by slug' })
  @ApiResponse({ status: 200, type: PromptTemplateDto })
  async getPromptTemplateBySlug(@Param('slug') slug: string): Promise<PromptTemplateDto> {
    return this.contentService.getPromptTemplateBySlug(slug);
  }

  @Get('case-studies')
  @ApiOperation({ summary: 'Get case studies' })
  @ApiQuery({ name: 'industry', required: false })
  @ApiQuery({ name: 'companySize', required: false })
  @ApiResponse({ status: 200, type: [CaseStudyDto] })
  async getCaseStudies(
    @Query('industry') industry?: string,
    @Query('companySize') companySize?: string,
  ): Promise<CaseStudyDto[]> {
    return this.contentService.getCaseStudies({ industry, companySize });
  }

  @Get('search')
  @ApiOperation({ summary: 'Search content' })
  @ApiQuery({ name: 'q', required: true })
  @ApiQuery({ name: 'type', required: false })
  async searchContent(
    @Query('q') query: string,
    @Query('type') type?: string,
  ) {
    return this.contentService.searchContent(query, type);
  }
}

// src/content/content.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChapterDto, PromptTemplateDto, CaseStudyDto, ContentTierDto } from './dto';

@Injectable()
export class ContentService {
  constructor(private prisma: PrismaService) {}

  async getContentTiers(): Promise<ContentTierDto[]> {
    return this.prisma.contentTier.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { chapters: true },
        },
      },
    });
  }

  async getChapters(filters?: {
    tier?: string;
    published?: boolean;
  }): Promise<ChapterDto[]> {
    const where: any = {};
    
    if (filters?.tier) {
      where.tier = { name: filters.tier };
    }
    
    if (filters?.published !== undefined) {
      where.isPublished = filters.published;
    }

    return this.prisma.chapter.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: {
        tier: true,
        metadata: true,
        tags: true,
        _count: {
          select: {
            sections: true,
            templates: true,
            caseStudies: true,
          },
        },
      },
    });
  }

  async getChapterBySlug(slug: string): Promise<ChapterDto> {
    const chapter = await this.prisma.chapter.findUnique({
      where: { slug },
      include: {
        tier: true,
        sections: {
          orderBy: { sortOrder: 'asc' },
        },
        templates: {
          where: { isActive: true },
          orderBy: { title: 'asc' },
        },
        caseStudies: {
          where: { isPublished: true },
          orderBy: { title: 'asc' },
        },
        assets: {
          orderBy: { filename: 'asc' },
        },
        metadata: true,
        tags: true,
      },
    });

    if (!chapter) {
      throw new NotFoundException(`Chapter with slug "${slug}" not found`);
    }

    return chapter;
  }

  async getChapterSections(slug: string) {
    const chapter = await this.prisma.chapter.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!chapter) {
      throw new NotFoundException(`Chapter with slug "${slug}" not found`);
    }

    return this.prisma.chapterSection.findMany({
      where: { chapterId: chapter.id },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getPromptTemplates(filters?: {
    category?: string;
    difficulty?: string;
    chapter?: string;
  }): Promise<PromptTemplateDto[]> {
    const where: any = { isActive: true };
    
    if (filters?.category) {
      where.category = filters.category;
    }
    
    if (filters?.difficulty) {
      where.difficulty = filters.difficulty;
    }
    
    if (filters?.chapter) {
      where.chapter = { slug: filters.chapter };
    }

    return this.prisma.promptTemplate.findMany({
      where,
      orderBy: { title: 'asc' },
      include: {
        variables: {
          orderBy: { name: 'asc' },
        },
        examples: {
          orderBy: { title: 'asc' },
        },
        chapter: {
          select: { slug: true, title: true },
        },
        tags: true,
      },
    });
  }

  async getPromptTemplateBySlug(slug: string): Promise<PromptTemplateDto> {
    const template = await this.prisma.promptTemplate.findUnique({
      where: { slug },
      include: {
        variables: {
          orderBy: { name: 'asc' },
        },
        examples: {
          orderBy: { title: 'asc' },
        },
        chapter: {
          select: { slug: true, title: true },
        },
        tags: true,
      },
    });

    if (!template) {
      throw new NotFoundException(`Template with slug "${slug}" not found`);
    }

    // Increment usage count
    await this.prisma.promptTemplate.update({
      where: { id: template.id },
      data: { usageCount: { increment: 1 } },
    });

    return template;
  }

  async getCaseStudies(filters?: {
    industry?: string;
    companySize?: string;
  }): Promise<CaseStudyDto[]> {
    const where: any = { isPublished: true };
    
    if (filters?.industry) {
      where.industry = filters.industry;
    }
    
    if (filters?.companySize) {
      where.companySize = filters.companySize;
    }

    return this.prisma.caseStudy.findMany({
      where,
      orderBy: { title: 'asc' },
      include: {
        chapter: {
          select: { slug: true, title: true },
        },
        tags: true,
      },
    });
  }

  async searchContent(query: string, type?: string) {
    const searchResults = {
      chapters: [],
      templates: [],
      caseStudies: [],
    };

    if (!type || type === 'chapters') {
      searchResults.chapters = await this.prisma.chapter.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
          isPublished: true,
        },
        select: {
          slug: true,
          title: true,
          description: true,
          tier: { select: { name: true } },
        },
        take: 10,
      });
    }

    if (!type || type === 'templates') {
      searchResults.templates = await this.prisma.promptTemplate.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { template: { contains: query, mode: 'insensitive' } },
          ],
          isActive: true,
        },
        select: {
          slug: true,
          title: true,
          description: true,
          category: true,
          difficulty: true,
        },
        take: 10,
      });
    }

    if (!type || type === 'case-studies') {
      searchResults.caseStudies = await this.prisma.caseStudy.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
          ],
          isPublished: true,
        },
        select: {
          slug: true,
          title: true,
          description: true,
          industry: true,
          companySize: true,
        },
        take: 10,
      });
    }

    return searchResults;
  }
}

// src/content/dto/index.ts
import { ApiProperty } from '@nestjs/swagger';

export class ContentTierDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  _count?: {
    chapters: number;
  };
}

export class TagDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  category?: string;

  @ApiProperty()
  color?: string;
}

export class ChapterMetadataDto {
  @ApiProperty()
  completionStatus: string;

  @ApiProperty()
  technicalAccuracy: boolean;

  @ApiProperty()
  qualityScore?: number;

  @ApiProperty()
  lastReviewDate?: Date;

  @ApiProperty()
  reviewNotes?: string;
}

export class ChapterSectionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  sortOrder: number;
}

export class ChapterDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  subtitle?: string;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  wordCount: number;

  @ApiProperty()
  estimatedReadTime: number;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  isPublished: boolean;

  @ApiProperty({ type: ContentTierDto })
  tier: ContentTierDto;

  @ApiProperty({ type: [ChapterSectionDto] })
  sections?: ChapterSectionDto[];

  @ApiProperty({ type: [TagDto] })
  tags: TagDto[];

  @ApiProperty({ type: ChapterMetadataDto })
  metadata?: ChapterMetadataDto;

  @ApiProperty()
  _count?: {
    sections: number;
    templates: number;
    caseStudies: number;
  };
}

export class TemplateVariableDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  dataType: string;

  @ApiProperty()
  isRequired: boolean;

  @ApiProperty()
  defaultValue?: string;

  @ApiProperty()
  validationRules?: any;
}

export class TemplateExampleDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  input: any;

  @ApiProperty()
  output: string;
}

export class PromptTemplateDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  template: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  difficulty: string;

  @ApiProperty()
  usageContext?: string;

  @ApiProperty()
  expectedOutcome?: string;

  @ApiProperty()
  customizationGuide?: string;

  @ApiProperty()
  effectivenessScore?: number;

  @ApiProperty()
  usageCount: number;

  @ApiProperty()
  successRate?: number;

  @ApiProperty({ type: [TemplateVariableDto] })
  variables: TemplateVariableDto[];

  @ApiProperty({ type: [TemplateExampleDto] })
  examples: TemplateExampleDto[];

  @ApiProperty({ type: [TagDto] })
  tags: TagDto[];

  @ApiProperty()
  chapter?: {
    slug: string;
    title: string;
  };

  @ApiProperty()
  isActive: boolean;
}

export class CaseStudyDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  industry?: string;

  @ApiProperty()
  companySize?: string;

  @ApiProperty()
  beforeMetrics?: any;

  @ApiProperty()
  afterMetrics?: any;

  @ApiProperty()
  improvementPercentage?: number;

  @ApiProperty()
  timeframeWeeks?: number;

  @ApiProperty()
  isPublished: boolean;

  @ApiProperty({ type: [TagDto] })
  tags: TagDto[];

  @ApiProperty()
  chapter?: {
    slug: string;
    title: string;
  };
}