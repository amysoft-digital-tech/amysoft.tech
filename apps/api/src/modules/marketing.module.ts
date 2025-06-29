import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { Lead } from '../entities/lead.entity';
import { MarketingContent } from '../entities/marketing-content.entity';
import { AnalyticsEvent } from '../entities/analytics-event.entity';
import { Content } from '../entities/content.entity';

// Controllers
import { LeadCaptureController } from '../controllers/lead-capture.controller';
import { MarketingContentController } from '../controllers/marketing-content.controller';
import { AnalyticsController } from '../controllers/analytics.controller';

// Services
import { LeadCaptureService } from '../services/lead-capture.service';
import { MarketingContentService } from '../services/marketing-content.service';
import { AnalyticsService } from '../services/analytics.service';
import { EmailService } from '../services/email.service';
import { CacheService } from '../services/cache.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Lead,
      MarketingContent,
      AnalyticsEvent,
      Content
    ])
  ],
  controllers: [
    LeadCaptureController,
    MarketingContentController,
    AnalyticsController
  ],
  providers: [
    LeadCaptureService,
    MarketingContentService,
    AnalyticsService,
    EmailService,
    CacheService
  ],
  exports: [
    LeadCaptureService,
    MarketingContentService,
    AnalyticsService,
    EmailService,
    CacheService
  ]
})
export class MarketingModule {}