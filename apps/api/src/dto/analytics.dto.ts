import { IsString, IsOptional, IsUUID, IsBoolean, IsNumber, IsArray, IsObject, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class AnalyticsEventDto {
  @IsEnum([
    'page_view', 'form_submit', 'button_click', 'content_view', 
    'video_play', 'download', 'signup', 'conversion', 'email_open', 
    'email_click', 'search', 'error', 'custom'
  ])
  type: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsString()
  sessionId: string;

  @IsOptional()
  @IsString()
  pageUrl?: string;

  @IsOptional()
  @IsString()
  referrer?: string;

  @IsOptional()
  @IsObject()
  properties?: Record<string, any>;

  @IsOptional()
  @IsObject()
  userProperties?: Record<string, any>;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  medium?: string;

  @IsOptional()
  @IsString()
  campaign?: string;

  @IsOptional()
  @IsNumber()
  value?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsBoolean()
  isConversion?: boolean;

  @IsOptional()
  @IsDateString()
  clientTimestamp?: string;
}

export class TrackEventsDto {
  @IsArray()
  @Type(() => AnalyticsEventDto)
  events: AnalyticsEventDto[];
}

export class ConversionEventDto {
  @IsString()
  eventName: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsString()
  sessionId: string;

  @IsOptional()
  @IsString()
  leadId?: string;

  @IsOptional()
  @IsNumber()
  value?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsObject()
  properties?: Record<string, any>;
}

export class AnalyticsDashboardDto {
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  granularity?: 'hour' | 'day' | 'week' | 'month';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  metrics?: string[];
}

export class AnalyticsDashboardResponseDto {
  overview: {
    totalUsers: number;
    activeUsers: number;
    conversionRate: number;
    revenue: number;
  };
  traffic: {
    dailyVisitors: number;
    organicTraffic: number;
    directTraffic: number;
    referralTraffic: number;
  };
  conversions: {
    leadCaptureRate: number;
    signupRate: number;
    totalConversions: number;
    conversionValue: number;
  };
  content: {
    mostViewedPages: Array<{
      url: string;
      title: string;
      views: number;
    }>;
    topPerformingContent: Array<{
      id: string;
      title: string;
      views: number;
      conversionRate: number;
    }>;
  };
  campaigns: {
    topSources: Array<{
      source: string;
      visitors: number;
      conversions: number;
      conversionRate: number;
    }>;
    recentCampaigns: Array<{
      campaign: string;
      impressions: number;
      clicks: number;
      conversions: number;
      cost: number;
      roas: number;
    }>;
  };
}