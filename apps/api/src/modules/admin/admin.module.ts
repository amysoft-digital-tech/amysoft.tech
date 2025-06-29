import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Controllers
import { AdminAuthController } from './controllers/admin-auth.controller';
import { CustomerAdminController } from './controllers/customer-admin.controller';
import { ContentAdminController } from './controllers/content-admin.controller';
import { BusinessIntelligenceController } from './controllers/business-intelligence.controller';
import { AuditController } from './controllers/audit.controller';

// Services
import { CustomerAdminService } from './services/customer-admin.service';
import { ContentAdminService } from './services/content-admin.service';
import { BusinessIntelligenceService } from './services/business-intelligence.service';
import { AuditService } from './services/audit.service';
import { AdminAuthService } from './services/admin-auth.service';

// Entities
import { User } from '../../entities/user.entity';
import { UserSubscription } from '../../entities/user-subscription.entity';
import { Content } from '../../entities/content.entity';
import { ContentAnalytics } from '../../entities/content-analytics.entity';
import { Payment } from '../../entities/payment.entity';
import { UserActivity } from '../../entities/user-activity.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserSubscription,
      Content,
      ContentAnalytics,
      Payment,
      UserActivity,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'admin-secret'),
        signOptions: { expiresIn: '8h' },
      }),
    }),
  ],
  controllers: [
    AdminAuthController,
    CustomerAdminController,
    ContentAdminController,
    BusinessIntelligenceController,
    AuditController,
  ],
  providers: [
    CustomerAdminService,
    ContentAdminService,
    BusinessIntelligenceService,
    AuditService,
    AdminAuthService,
  ],
  exports: [
    CustomerAdminService,
    ContentAdminService,
    BusinessIntelligenceService,
    AuditService,
    AdminAuthService,
  ],
})
export class AdminModule {}