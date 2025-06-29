import { IsEmail, IsOptional, IsString, IsBoolean, IsEnum, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class LeadCaptureDto {
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  name?: string;

  @IsOptional()
  @IsEnum(['beginner', 'intermediate', 'advanced'])
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';

  @IsOptional()
  @IsString()
  @MaxLength(100)
  primaryLanguage?: string;

  @IsString()
  @MaxLength(100)
  source: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  utmSource?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  utmMedium?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  utmCampaign?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  utmTerm?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  utmContent?: string;

  @IsBoolean()
  gdprConsent: boolean;

  @IsOptional()
  @IsBoolean()
  marketingConsent?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  referrer?: string;
}

export class NewsletterSignupDto {
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  name?: string;

  @IsOptional()
  preferences?: {
    weeklyNewsletter?: boolean;
    productUpdates?: boolean;
    courseAnnouncements?: boolean;
  };

  @IsString()
  @MaxLength(100)
  source: string;

  @IsBoolean()
  gdprConsent: boolean;
}

export class EmailValidationDto {
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;
}

export class LeadCaptureResponseDto {
  success: boolean;
  leadId: string;
  message: string;
  nextSteps: {
    emailSent: boolean;
    welcomeSequence: string;
    redirectUrl?: string;
  };
}

export class EmailValidationResponseDto {
  valid: boolean;
  suggestion?: string;
  riskScore: number;
  deliverable: boolean;
  disposable: boolean;
}