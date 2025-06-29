import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { getDatabaseConfig } from '../config/database.config';
import { AuthModule } from '../modules/auth/auth.module';
import { AdminModule } from '../modules/admin/admin.module';
import { UsersModule } from '../modules/users/users.module';
import { ContentModule } from '../modules/content/content.module';
import { PaymentsModule } from '../modules/payments/payments.module';
import { AnalyticsModule } from '../modules/analytics/analytics.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => getDatabaseConfig(configService),
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ttl: configService.get('THROTTLE_TTL', 60),
        limit: configService.get('THROTTLE_LIMIT', 100),
      }),
    }),

    // Scheduling (for background tasks)
    ScheduleModule.forRoot(),

    // Feature modules
    AuthModule,
    AdminModule,
    UsersModule,
    ContentModule,
    PaymentsModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}