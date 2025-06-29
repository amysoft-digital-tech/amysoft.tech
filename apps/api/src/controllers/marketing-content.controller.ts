import { Controller, Get, Param, Query, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { MarketingContentService } from '../services/marketing-content.service';
import { 
  GetMarketingContentDto, 
  MarketingContentResponseDto, 
  ContentPreviewDto, 
  ContentPreviewResponseDto 
} from '../dto/marketing-content.dto';

@ApiTags('Marketing Content')
@Controller('api/content')
export class MarketingContentController {
  constructor(private readonly marketingContentService: MarketingContentService) {}

  @Get('marketing/:type')
  @ApiOperation({ 
    summary: 'Get marketing content by type',
    description: 'Retrieve marketing content (hero, principles, testimonials, pricing, faq, author) with A/B testing support'
  })
  @ApiParam({ 
    name: 'type', 
    enum: ['hero', 'principles', 'testimonials', 'pricing', 'faq', 'blog', 'author'],
    description: 'Type of marketing content to retrieve'
  })
  @ApiQuery({ name: 'variant', required: false, description: 'A/B test variant name' })
  @ApiQuery({ name: 'language', required: false, description: 'Language code (default: en)' })
  @ApiQuery({ name: 'preview', required: false, type: Boolean, description: 'Preview draft content' })
  @ApiResponse({ 
    status: 200, 
    description: 'Marketing content retrieved successfully',
    type: MarketingContentResponseDto
  })
  @ApiResponse({ status: 404, description: 'Content not found' })
  async getMarketingContent(
    @Param('type') type: string,
    @Query(new ValidationPipe({ transform: true })) query: GetMarketingContentDto
  ): Promise<MarketingContentResponseDto> {
    return this.marketingContentService.getMarketingContent(type, query);
  }

  @Get('previews')
  @ApiOperation({ 
    summary: 'Get content previews',
    description: 'Get chapter and template previews with tier-based filtering'
  })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by content category' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of previews to return (default: 20)' })
  @ApiQuery({ name: 'userTier', required: false, description: 'User tier for access filtering' })
  @ApiResponse({ 
    status: 200, 
    description: 'Content previews retrieved successfully',
    type: [ContentPreviewResponseDto]
  })
  async getContentPreviews(
    @Query(new ValidationPipe({ transform: true })) query: ContentPreviewDto
  ): Promise<ContentPreviewResponseDto[]> {
    return this.marketingContentService.getContentPreviews(query);
  }

  @Get('marketing/static-data')
  @ApiOperation({ 
    summary: 'Get all static marketing data',
    description: 'Get all marketing content in a single request for initial page load optimization'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Static marketing data retrieved successfully',
    schema: {
      properties: {
        heroData: { type: 'object' },
        principlesData: { type: 'object' },
        testimonialsData: { type: 'object' },
        pricingData: { type: 'object' },
        faqData: { type: 'object' },
        authorData: { type: 'object' }
      }
    }
  })
  async getStaticMarketingData(): Promise<Record<string, any>> {
    return this.marketingContentService.getStaticMarketingData();
  }

  @Get('marketing/hero')
  @ApiOperation({ 
    summary: 'Get hero section content',
    description: 'Get hero section content with social proof and CTA data'
  })
  @ApiQuery({ name: 'variant', required: false, description: 'A/B test variant' })
  @ApiResponse({ status: 200, description: 'Hero content' })
  async getHeroContent(
    @Query(new ValidationPipe({ transform: true })) query: GetMarketingContentDto
  ) {
    return this.marketingContentService.getMarketingContent('hero', query);
  }

  @Get('marketing/principles')
  @ApiOperation({ 
    summary: 'Get Five Elite Principles overview',
    description: 'Get the Five Elite Principles with chapter references and previews'
  })
  @ApiResponse({ status: 200, description: 'Principles overview content' })
  async getPrinciplesContent(
    @Query(new ValidationPipe({ transform: true })) query: GetMarketingContentDto
  ) {
    return this.marketingContentService.getMarketingContent('principles', query);
  }

  @Get('marketing/testimonials')
  @ApiOperation({ 
    summary: 'Get testimonials and social proof',
    description: 'Get developer testimonials with ratings and verification status'
  })
  @ApiResponse({ status: 200, description: 'Testimonials content' })
  async getTestimonialsContent(
    @Query(new ValidationPipe({ transform: true })) query: GetMarketingContentDto
  ) {
    return this.marketingContentService.getMarketingContent('testimonials', query);
  }

  @Get('marketing/pricing')
  @ApiOperation({ 
    summary: 'Get pricing tiers and features',
    description: 'Get pricing information with tier comparison and feature details'
  })
  @ApiResponse({ status: 200, description: 'Pricing content' })
  async getPricingContent(
    @Query(new ValidationPipe({ transform: true })) query: GetMarketingContentDto
  ) {
    return this.marketingContentService.getMarketingContent('pricing', query);
  }

  @Get('marketing/faq')
  @ApiOperation({ 
    summary: 'Get frequently asked questions',
    description: 'Get FAQ content organized by categories'
  })
  @ApiResponse({ status: 200, description: 'FAQ content' })
  async getFaqContent(
    @Query(new ValidationPipe({ transform: true })) query: GetMarketingContentDto
  ) {
    return this.marketingContentService.getMarketingContent('faq', query);
  }

  @Get('marketing/author')
  @ApiOperation({ 
    summary: 'Get author information',
    description: 'Get author bio, credentials, and social links'
  })
  @ApiResponse({ status: 200, description: 'Author content' })
  async getAuthorContent(
    @Query(new ValidationPipe({ transform: true })) query: GetMarketingContentDto
  ) {
    return this.marketingContentService.getMarketingContent('author', query);
  }
}