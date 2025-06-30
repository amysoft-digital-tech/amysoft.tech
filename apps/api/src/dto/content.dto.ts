import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional, IsNumber, IsBoolean, IsArray, IsObject, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';

// Content Tier DTOs
export class ContentTierDto {
  @ApiProperty({ description: 'Unique identifier for the content tier' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Internal name of the tier', example: 'foundation' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Display name of the tier', example: 'Foundation' })
  @IsString()
  displayName: string;

  @ApiProperty({ description: 'Price of the tier in USD', example: 24.95 })
  @IsNumber()
  price: number;

  @ApiPropertyOptional({ description: 'Description of the tier' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Features included in this tier', type: [String] })
  @IsArray()
  @IsString({ each: true })
  features: string[];

  @ApiProperty({ description: 'Chapter numbers accessible with this tier', type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  chapterAccess: number[];

  @ApiProperty({ description: 'Sort order for display' })
  @IsNumber()
  sortOrder: number;

  @ApiProperty({ description: 'Whether the tier is active' })
  @IsBoolean()
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Whether this tier is marked as popular' })
  @IsOptional()
  @IsBoolean()
  popular?: boolean;

  @ApiPropertyOptional({ description: 'Number of chapters in this tier' })
  @IsOptional()
  @IsNumber()
  chapterCount?: number;
}

// Chapter DTOs
export class ChapterMetadataDto {
  @ApiPropertyOptional({ description: 'SEO title for the chapter' })
  @IsOptional()
  @IsString()
  seoTitle?: string;

  @ApiPropertyOptional({ description: 'SEO description for the chapter' })
  @IsOptional()
  @IsString()
  seoDescription?: string;

  @ApiPropertyOptional({ description: 'SEO keywords', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  seoKeywords?: string[];

  @ApiPropertyOptional({ description: 'Estimated reading time in minutes' })
  @IsOptional()
  @IsNumber()
  estimatedReadTime?: number;

  @ApiPropertyOptional({ description: 'Word count of the chapter' })
  @IsOptional()
  @IsNumber()
  wordCount?: number;

  @ApiPropertyOptional({ description: 'Prerequisites for this chapter', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prerequisites?: string[];

  @ApiPropertyOptional({ description: 'Learning objectives', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  learningObjectives?: string[];
}

export class ChapterSectionDto {
  @ApiProperty({ description: 'Unique identifier for the section' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Section title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Section content in markdown format' })
  @IsString()
  content: string;

  @ApiProperty({ description: 'Type of content section', enum: ['text', 'code', 'quote', 'callout', 'exercise', 'template'] })
  @IsEnum(['text', 'code', 'quote', 'callout', 'exercise', 'template'])
  type: 'text' | 'code' | 'quote' | 'callout' | 'exercise' | 'template';

  @ApiPropertyOptional({ description: 'Additional metadata for the section' })
  @IsOptional()
  @IsObject()
  metadata?: {
    language?: string;
    framework?: string;
    difficulty?: string;
    category?: string;
  };

  @ApiProperty({ description: 'Sort order of the section' })
  @IsNumber()
  sortOrder: number;
}

export class ChapterAssetDto {
  @ApiProperty({ description: 'Unique identifier for the asset' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Type of asset', enum: ['image', 'video', 'audio', 'document', 'interactive'] })
  @IsEnum(['image', 'video', 'audio', 'document', 'interactive'])
  type: 'image' | 'video' | 'audio' | 'document' | 'interactive';

  @ApiProperty({ description: 'URL to access the asset' })
  @IsString()
  url: string;

  @ApiProperty({ description: 'Asset title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Asset description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Alt text for accessibility' })
  @IsOptional()
  @IsString()
  altText?: string;

  @ApiPropertyOptional({ description: 'Caption for the asset' })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class ExerciseDto {
  @ApiProperty({ description: 'Unique identifier for the exercise' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Exercise title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Exercise description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Type of exercise', enum: ['quiz', 'practical', 'reflection', 'case-study'] })
  @IsEnum(['quiz', 'practical', 'reflection', 'case-study'])
  type: 'quiz' | 'practical' | 'reflection' | 'case-study';

  @ApiProperty({ description: 'Exercise difficulty', enum: ['beginner', 'intermediate', 'advanced'] })
  @IsEnum(['beginner', 'intermediate', 'advanced'])
  difficulty: 'beginner' | 'intermediate' | 'advanced';

  @ApiProperty({ description: 'Estimated time to complete in minutes' })
  @IsNumber()
  estimatedTime: number;

  @ApiProperty({ description: 'Step-by-step instructions', type: [String] })
  @IsArray()
  @IsString({ each: true })
  instructions: string[];

  @ApiPropertyOptional({ description: 'Resources needed for the exercise', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  resources?: string[];

  @ApiPropertyOptional({ description: 'Solution or expected outcome' })
  @IsOptional()
  @IsString()
  solution?: string;
}

export class ChapterDto {
  @ApiProperty({ description: 'Unique identifier for the chapter' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Chapter number' })
  @IsNumber()
  number: number;

  @ApiProperty({ description: 'Chapter title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Chapter subtitle' })
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiProperty({ description: 'URL slug for the chapter' })
  @IsString()
  slug: string;

  @ApiProperty({ description: 'Chapter description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Full chapter content in markdown format' })
  @IsString()
  content: string;

  @ApiProperty({ description: 'Word count of the chapter' })
  @IsNumber()
  wordCount: number;

  @ApiProperty({ description: 'Estimated reading time in minutes' })
  @IsNumber()
  estimatedReadTime: number;

  @ApiProperty({ description: 'Chapter difficulty', enum: ['beginner', 'intermediate', 'advanced'] })
  @IsEnum(['beginner', 'intermediate', 'advanced'])
  difficulty: 'beginner' | 'intermediate' | 'advanced';

  @ApiProperty({ description: 'Tags associated with the chapter', type: [String] })
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @ApiPropertyOptional({ description: 'Prerequisites for this chapter', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prerequisites?: string[];

  @ApiProperty({ description: 'Learning objectives for the chapter', type: [String] })
  @IsArray()
  @IsString({ each: true })
  learningObjectives: string[];

  @ApiProperty({ description: 'Chapter sections', type: [ChapterSectionDto] })
  @IsArray()
  @Type(() => ChapterSectionDto)
  sections: ChapterSectionDto[];

  @ApiPropertyOptional({ description: 'Prompt templates related to this chapter', type: [String] })
  @IsOptional()
  @IsArray()
  templateIds?: string[];

  @ApiPropertyOptional({ description: 'Exercises for this chapter', type: [ExerciseDto] })
  @IsOptional()
  @IsArray()
  @Type(() => ExerciseDto)
  exercises?: ExerciseDto[];

  @ApiProperty({ description: 'Key takeaways from the chapter', type: [String] })
  @IsArray()
  @IsString({ each: true })
  keyTakeaways: string[];

  @ApiPropertyOptional({ description: 'Slug of the next chapter' })
  @IsOptional()
  @IsString()
  nextChapter?: string;

  @ApiPropertyOptional({ description: 'Slug of the previous chapter' })
  @IsOptional()
  @IsString()
  previousChapter?: string;

  @ApiProperty({ description: 'Content tier this chapter belongs to' })
  @Type(() => ContentTierDto)
  tier: ContentTierDto;

  @ApiProperty({ description: 'Whether the chapter is published' })
  @IsBoolean()
  published: boolean;

  @ApiPropertyOptional({ description: 'Assets associated with the chapter', type: [ChapterAssetDto] })
  @IsOptional()
  @IsArray()
  @Type(() => ChapterAssetDto)
  assets?: ChapterAssetDto[];

  @ApiPropertyOptional({ description: 'Chapter metadata' })
  @IsOptional()
  @Type(() => ChapterMetadataDto)
  metadata?: ChapterMetadataDto;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

// Template DTOs
export class TemplateVariableDto {
  @ApiProperty({ description: 'Variable name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Variable description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Variable type', enum: ['text', 'number', 'select', 'textarea'] })
  @IsEnum(['text', 'number', 'select', 'textarea'])
  type: 'text' | 'number' | 'select' | 'textarea';

  @ApiPropertyOptional({ description: 'Available options for select type', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiPropertyOptional({ description: 'Placeholder text for the variable' })
  @IsOptional()
  @IsString()
  placeholder?: string;

  @ApiProperty({ description: 'Whether the variable is required' })
  @IsBoolean()
  required: boolean;
}

export class TemplateExampleDto {
  @ApiProperty({ description: 'Example title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Scenario description' })
  @IsString()
  scenario: string;

  @ApiProperty({ description: 'Input values for the example' })
  @IsObject()
  input: Record<string, any>;

  @ApiProperty({ description: 'Expected output' })
  @IsString()
  output: string;

  @ApiPropertyOptional({ description: 'Performance metrics for the example' })
  @IsOptional()
  @IsObject()
  metrics?: {
    before: string;
    after: string;
    improvement: string;
  };
}

export class PromptTemplateDto {
  @ApiProperty({ description: 'Unique identifier for the template' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Template title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Template description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Template category' })
  @IsString()
  category: string;

  @ApiProperty({ description: 'Template difficulty', enum: ['beginner', 'intermediate', 'advanced'] })
  @IsEnum(['beginner', 'intermediate', 'advanced'])
  difficulty: 'beginner' | 'intermediate' | 'advanced';

  @ApiProperty({ description: 'The actual prompt template with placeholders' })
  @IsString()
  template: string;

  @ApiProperty({ description: 'Template variables', type: [TemplateVariableDto] })
  @IsArray()
  @Type(() => TemplateVariableDto)
  variables: TemplateVariableDto[];

  @ApiProperty({ description: 'Template examples', type: [TemplateExampleDto] })
  @IsArray()
  @Type(() => TemplateExampleDto)
  examples: TemplateExampleDto[];

  @ApiProperty({ description: 'Tags associated with the template', type: [String] })
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @ApiProperty({ description: 'Number of times this template has been used' })
  @IsNumber()
  @Min(0)
  usageCount: number;

  @ApiProperty({ description: 'Average rating for this template' })
  @IsNumber()
  @Min(0)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ description: 'Related chapter slug' })
  @IsOptional()
  @IsString()
  chapterSlug?: string;
}

// Case Study DTOs
export class CaseStudyDto {
  @ApiProperty({ description: 'Unique identifier for the case study' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Case study title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Case study description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'URL slug for the case study' })
  @IsString()
  slug: string;

  @ApiProperty({ description: 'Full case study content' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'Industry sector' })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({ description: 'Company size', enum: ['startup', 'medium', 'enterprise'] })
  @IsOptional()
  @IsEnum(['startup', 'medium', 'enterprise'])
  companySize?: 'startup' | 'medium' | 'enterprise';

  @ApiPropertyOptional({ description: 'Metrics before implementation' })
  @IsOptional()
  @IsObject()
  beforeMetrics?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Metrics after implementation' })
  @IsOptional()
  @IsObject()
  afterMetrics?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Improvement percentage' })
  @IsOptional()
  @IsNumber()
  improvementPercentage?: number;

  @ApiPropertyOptional({ description: 'Implementation timeframe in weeks' })
  @IsOptional()
  @IsNumber()
  timeframeWeeks?: number;

  @ApiProperty({ description: 'Tags associated with the case study', type: [String] })
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @ApiPropertyOptional({ description: 'Related chapter slug' })
  @IsOptional()
  @IsString()
  chapterSlug?: string;

  @ApiProperty({ description: 'Whether the case study is published' })
  @IsBoolean()
  published: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

// Tag DTO
export class TagDto {
  @ApiProperty({ description: 'Unique identifier for the tag' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Tag name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Tag description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Tag category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Color code for UI display' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Usage count across content' })
  @IsOptional()
  @IsNumber()
  usageCount?: number;
}

// Search DTOs
export class ContentSearchResultDto {
  @ApiProperty({ description: 'Unique identifier' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Content type', enum: ['chapter', 'template', 'case-study'] })
  @IsEnum(['chapter', 'template', 'case-study'])
  type: 'chapter' | 'template' | 'case-study';

  @ApiProperty({ description: 'Content title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Content description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'URL slug' })
  @IsString()
  slug: string;

  @ApiProperty({ description: 'Relevance score for search ranking' })
  @IsNumber()
  @Min(0)
  @Max(1)
  relevanceScore: number;

  @ApiPropertyOptional({ description: 'Related chapter slug for templates and case studies' })
  @IsOptional()
  @IsString()
  chapterSlug?: string;

  @ApiProperty({ description: 'Highlighted text snippets', type: [String] })
  @IsArray()
  @IsString({ each: true })
  highlights: string[];

  @ApiProperty({ description: 'Tags associated with the content', type: [String] })
  @IsArray()
  @IsString({ each: true })
  tags: string[];
}

export class SearchResultsDto {
  @ApiProperty({ description: 'Search query that was executed' })
  @IsString()
  query: string;

  @ApiProperty({ description: 'Total number of results found' })
  @IsNumber()
  @Min(0)
  totalResults: number;

  @ApiProperty({ description: 'Search results', type: [ContentSearchResultDto] })
  @IsArray()
  @Type(() => ContentSearchResultDto)
  results: ContentSearchResultDto[];

  @ApiProperty({ description: 'Search execution time in milliseconds' })
  @IsNumber()
  executionTime: number;

  @ApiPropertyOptional({ description: 'Suggested search terms', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  suggestions?: string[];

  @ApiProperty({ description: 'Results breakdown by content type' })
  @IsObject()
  breakdown: {
    chapters: number;
    templates: number;
    caseStudies: number;
  };
}

// Query Parameter DTOs
export class ContentQueryDto {
  @ApiPropertyOptional({ description: 'Filter by content tier' })
  @IsOptional()
  @IsString()
  tier?: string;

  @ApiPropertyOptional({ description: 'Filter by difficulty', enum: ['beginner', 'intermediate', 'advanced'] })
  @IsOptional()
  @IsEnum(['beginner', 'intermediate', 'advanced'])
  difficulty?: 'beginner' | 'intermediate' | 'advanced';

  @ApiPropertyOptional({ description: 'Filter by tags (comma-separated)' })
  @IsOptional()
  @IsString()
  tags?: string;

  @ApiPropertyOptional({ description: 'Filter by category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Only show published content' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  published?: boolean;

  @ApiPropertyOptional({ description: 'Page number for pagination', minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Sort field' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class SearchQueryDto {
  @ApiProperty({ description: 'Search query string', minLength: 1 })
  @IsString()
  @Transform(({ value }) => value.trim())
  query: string;

  @ApiPropertyOptional({ description: 'Content types to search', enum: ['chapter', 'template', 'case-study'] })
  @IsOptional()
  @IsEnum(['chapter', 'template', 'case-study'], { each: true })
  types?: ('chapter' | 'template' | 'case-study')[];

  @ApiPropertyOptional({ description: 'Filter by difficulty', enum: ['beginner', 'intermediate', 'advanced'] })
  @IsOptional()
  @IsEnum(['beginner', 'intermediate', 'advanced'], { each: true })
  difficulty?: ('beginner' | 'intermediate' | 'advanced')[];

  @ApiPropertyOptional({ description: 'Filter by tags (comma-separated)' })
  @IsOptional()
  @IsString()
  tags?: string;

  @ApiPropertyOptional({ description: 'Maximum number of results', minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}