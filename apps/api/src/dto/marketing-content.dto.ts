import { IsOptional, IsString, IsEnum, IsBoolean, MaxLength } from 'class-validator';

export class GetMarketingContentDto {
  @IsOptional()
  @IsString()
  variant?: string; // For A/B testing

  @IsOptional()
  @IsString()
  @MaxLength(10)
  language?: string; // Language code

  @IsOptional()
  @IsBoolean()
  preview?: boolean; // Preview mode for drafts
}

export class MarketingContentResponseDto {
  id: string;
  type: string;
  title: string;
  description?: string;
  content: Record<string, any>;
  seoMetadata?: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogImage?: string;
    canonicalUrl?: string;
  };
  publishedAt?: Date;
  lastUpdated: Date;
}

export class ContentPreviewDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsString()
  userTier?: string; // For tier-based filtering
}

export class ContentPreviewResponseDto {
  id: string;
  title: string;
  description: string;
  previewContent: string;
  fullContentLength: number;
  previewLength: number;
  estimatedReadTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  author: {
    name: string;
    title: string;
    avatar?: string;
  };
  publishedDate: Date;
  lastUpdated: Date;
  tags: string[];
  requiredTier: string;
  chapterNumber?: number;
  nextChapter?: string;
  previousChapter?: string;
}