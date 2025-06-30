import { 
  Controller, 
  Get, 
  Param, 
  Query, 
  HttpException, 
  HttpStatus,
  UseGuards,
  Logger,
  CacheInterceptor,
  UseInterceptors,
  CacheTTL
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ContentService } from './content.service';
import {
  ContentTierDto,
  ChapterDto,
  PromptTemplateDto,
  CaseStudyDto,
  SearchResultsDto,
  ContentQueryDto,
  SearchQueryDto,
  ChapterSectionDto
} from '../../dto/content.dto';

@ApiTags('Content')
@Controller('content')
@UseGuards(ThrottlerGuard)
@UseInterceptors(CacheInterceptor)
export class ContentController {
  private readonly logger = new Logger(ContentController.name);

  constructor(private readonly contentService: ContentService) {}

  // Content Tier Endpoints
  @Get('tiers')
  @CacheTTL(3600) // Cache for 1 hour
  @ApiOperation({ 
    summary: 'Get all content tiers',
    description: 'Retrieve all active content tiers with pricing and feature information'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully retrieved content tiers',
    type: [ContentTierDto]
  })
  async getContentTiers(): Promise<ContentTierDto[]> {
    try {
      return await this.contentService.getContentTiers();
    } catch (error) {
      this.logger.error('Failed to retrieve content tiers:', error);
      throw new HttpException(
        'Failed to retrieve content tiers',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('tiers/:id')
  @CacheTTL(3600)
  @ApiOperation({ 
    summary: 'Get content tier by ID',
    description: 'Retrieve detailed information about a specific content tier'
  })
  @ApiParam({ name: 'id', description: 'Content tier ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully retrieved content tier',
    type: ContentTierDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Content tier not found'
  })
  async getContentTierById(@Param('id') id: string): Promise<ContentTierDto> {
    try {
      const tier = await this.contentService.getContentTierById(id);
      if (!tier) {
        throw new HttpException('Content tier not found', HttpStatus.NOT_FOUND);
      }
      return tier;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Failed to retrieve content tier ${id}:`, error);
      throw new HttpException(
        'Failed to retrieve content tier',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Chapter Endpoints
  @Get('chapters')
  @CacheTTL(1800) // Cache for 30 minutes
  @ApiOperation({ 
    summary: 'Get all chapters',
    description: 'Retrieve chapters with optional filtering and pagination'
  })
  @ApiQuery({ name: 'tier', required: false, description: 'Filter by content tier' })
  @ApiQuery({ name: 'difficulty', required: false, enum: ['beginner', 'intermediate', 'advanced'] })
  @ApiQuery({ name: 'tags', required: false, description: 'Filter by tags (comma-separated)' })
  @ApiQuery({ name: 'published', required: false, type: Boolean, description: 'Filter by publication status' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number for pagination' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort field' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully retrieved chapters',
    type: [ChapterDto]
  })
  async getAllChapters(@Query() query: ContentQueryDto): Promise<ChapterDto[]> {
    try {
      return await this.contentService.getAllChapters(query);
    } catch (error) {
      this.logger.error('Failed to retrieve chapters:', error);
      throw new HttpException(
        'Failed to retrieve chapters',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('chapters/:slug')
  @CacheTTL(1800)
  @ApiOperation({ 
    summary: 'Get chapter by slug',
    description: 'Retrieve detailed information about a specific chapter including sections, templates, and case studies'
  })
  @ApiParam({ name: 'slug', description: 'Chapter URL slug' })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully retrieved chapter',
    type: ChapterDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Chapter not found'
  })
  async getChapterBySlug(@Param('slug') slug: string): Promise<ChapterDto> {
    try {
      return await this.contentService.getChapterBySlug(slug);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Failed to retrieve chapter ${slug}:`, error);
      throw new HttpException(
        'Failed to retrieve chapter',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('chapters/:slug/sections')
  @CacheTTL(1800)
  @ApiOperation({ 
    summary: 'Get chapter sections',
    description: 'Retrieve only the sections of a specific chapter for granular access'
  })
  @ApiParam({ name: 'slug', description: 'Chapter URL slug' })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully retrieved chapter sections',
    type: [ChapterSectionDto]
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Chapter not found'
  })
  async getChapterSections(@Param('slug') slug: string): Promise<ChapterSectionDto[]> {
    try {
      return await this.contentService.getChapterSections(slug);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Failed to retrieve chapter sections for ${slug}:`, error);
      throw new HttpException(
        'Failed to retrieve chapter sections',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Template Endpoints
  @Get('templates')
  @CacheTTL(1800)
  @ApiOperation({ 
    summary: 'Get all templates',
    description: 'Retrieve prompt templates with optional filtering and pagination'
  })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by template category' })
  @ApiQuery({ name: 'difficulty', required: false, enum: ['beginner', 'intermediate', 'advanced'] })
  @ApiQuery({ name: 'tags', required: false, description: 'Filter by tags (comma-separated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number for pagination' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort field' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully retrieved templates',
    type: [PromptTemplateDto]
  })
  async getTemplates(@Query() query: ContentQueryDto): Promise<PromptTemplateDto[]> {
    try {
      return await this.contentService.getTemplates(query);
    } catch (error) {
      this.logger.error('Failed to retrieve templates:', error);
      throw new HttpException(
        'Failed to retrieve templates',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('templates/:slug')
  @CacheTTL(900) // Cache for 15 minutes (shorter due to usage tracking)
  @ApiOperation({ 
    summary: 'Get template by slug',
    description: 'Retrieve detailed information about a specific template and increment usage count'
  })
  @ApiParam({ name: 'slug', description: 'Template URL slug' })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully retrieved template',
    type: PromptTemplateDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Template not found'
  })
  async getTemplateBySlug(@Param('slug') slug: string): Promise<PromptTemplateDto> {
    try {
      return await this.contentService.getTemplateBySlug(slug);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Failed to retrieve template ${slug}:`, error);
      throw new HttpException(
        'Failed to retrieve template',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Case Study Endpoints
  @Get('case-studies')
  @CacheTTL(1800)
  @ApiOperation({ 
    summary: 'Get all case studies',
    description: 'Retrieve case studies with optional filtering and pagination'
  })
  @ApiQuery({ name: 'industry', required: false, description: 'Filter by industry' })
  @ApiQuery({ name: 'companySize', required: false, enum: ['startup', 'medium', 'enterprise'] })
  @ApiQuery({ name: 'tags', required: false, description: 'Filter by tags (comma-separated)' })
  @ApiQuery({ name: 'published', required: false, type: Boolean, description: 'Filter by publication status' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number for pagination' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort field' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully retrieved case studies',
    type: [CaseStudyDto]
  })
  async getCaseStudies(@Query() query: ContentQueryDto): Promise<CaseStudyDto[]> {
    try {
      return await this.contentService.getCaseStudies(query);
    } catch (error) {
      this.logger.error('Failed to retrieve case studies:', error);
      throw new HttpException(
        'Failed to retrieve case studies',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('case-studies/:slug')
  @CacheTTL(1800)
  @ApiOperation({ 
    summary: 'Get case study by slug',
    description: 'Retrieve detailed information about a specific case study'
  })
  @ApiParam({ name: 'slug', description: 'Case study URL slug' })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully retrieved case study',
    type: CaseStudyDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Case study not found'
  })
  async getCaseStudyBySlug(@Param('slug') slug: string): Promise<CaseStudyDto> {
    try {
      return await this.contentService.getCaseStudyBySlug(slug);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Failed to retrieve case study ${slug}:`, error);
      throw new HttpException(
        'Failed to retrieve case study',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Search Endpoint
  @Get('search')
  @CacheTTL(600) // Cache for 10 minutes
  @ApiOperation({ 
    summary: 'Search content',
    description: 'Perform full-text search across chapters, templates, and case studies'
  })
  @ApiQuery({ name: 'query', description: 'Search query string' })
  @ApiQuery({ 
    name: 'types', 
    required: false, 
    description: 'Content types to search (comma-separated)',
    enum: ['chapter', 'template', 'case-study']
  })
  @ApiQuery({ 
    name: 'difficulty', 
    required: false, 
    description: 'Filter by difficulty (comma-separated)',
    enum: ['beginner', 'intermediate', 'advanced']
  })
  @ApiQuery({ name: 'tags', required: false, description: 'Filter by tags (comma-separated)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Maximum number of results' })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully executed search',
    type: SearchResultsDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid search query'
  })
  async searchContent(@Query() query: SearchQueryDto): Promise<SearchResultsDto> {
    try {
      // Validate query
      if (!query.query || query.query.trim().length === 0) {
        throw new HttpException('Search query is required', HttpStatus.BAD_REQUEST);
      }

      if (query.query.trim().length < 2) {
        throw new HttpException('Search query must be at least 2 characters', HttpStatus.BAD_REQUEST);
      }

      // Parse types if provided as comma-separated string
      if (typeof query.types === 'string') {
        query.types = (query.types as string).split(',').map(t => t.trim()) as any;
      }

      // Parse difficulty if provided as comma-separated string
      if (typeof query.difficulty === 'string') {
        query.difficulty = (query.difficulty as string).split(',').map(d => d.trim()) as any;
      }

      return await this.contentService.searchContent(query);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Search failed:', error);
      throw new HttpException(
        'Search failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Analytics Endpoints
  @Get('analytics/popular-templates')
  @CacheTTL(3600)
  @ApiOperation({ 
    summary: 'Get popular templates',
    description: 'Retrieve templates sorted by usage count'
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of templates to return' })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully retrieved popular templates',
    type: [PromptTemplateDto]
  })
  async getPopularTemplates(@Query('limit') limit: number = 10): Promise<PromptTemplateDto[]> {
    try {
      const query: ContentQueryDto = {
        limit: Math.min(limit, 50), // Cap at 50
        sortBy: 'usageCount',
        sortOrder: 'desc'
      };
      return await this.contentService.getTemplates(query);
    } catch (error) {
      this.logger.error('Failed to retrieve popular templates:', error);
      throw new HttpException(
        'Failed to retrieve popular templates',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('analytics/recent-content')
  @CacheTTL(1800)
  @ApiOperation({ 
    summary: 'Get recently added content',
    description: 'Retrieve recently published content across all types'
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items to return' })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully retrieved recent content'
  })
  async getRecentContent(@Query('limit') limit: number = 10) {
    try {
      const query: ContentQueryDto = {
        limit: Math.min(limit, 20),
        published: true,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      const [chapters, templates, caseStudies] = await Promise.all([
        this.contentService.getAllChapters({ ...query, limit: Math.ceil(limit / 3) }),
        this.contentService.getTemplates({ ...query, limit: Math.ceil(limit / 3) }),
        this.contentService.getCaseStudies({ ...query, limit: Math.ceil(limit / 3) })
      ]);

      // Combine and sort by creation date
      const allContent = [
        ...chapters.map(c => ({ ...c, contentType: 'chapter' })),
        ...templates.map(t => ({ ...t, contentType: 'template' })),
        ...caseStudies.map(cs => ({ ...cs, contentType: 'case-study' }))
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);

      return {
        totalItems: allContent.length,
        items: allContent
      };
    } catch (error) {
      this.logger.error('Failed to retrieve recent content:', error);
      throw new HttpException(
        'Failed to retrieve recent content',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Health Check Endpoint
  @Get('health')
  @ApiOperation({ 
    summary: 'Content service health check',
    description: 'Check the health status of the content service'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Service is healthy'
  })
  async healthCheck() {
    try {
      // Perform a simple database query to check connectivity
      const tiers = await this.contentService.getContentTiers();
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'content-api',
        checks: {
          database: 'connected',
          contentTiers: tiers.length > 0 ? 'available' : 'no-data'
        }
      };
    } catch (error) {
      this.logger.error('Health check failed:', error);
      throw new HttpException(
        {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          service: 'content-api',
          error: 'Database connection failed'
        },
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }
}