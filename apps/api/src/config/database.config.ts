import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';
import { Content } from '../entities/content.entity';
import { Payment } from '../entities/payment.entity';
import { UserSubscription } from '../entities/user-subscription.entity';
import { UserActivity } from '../entities/user-activity.entity';
import { ContentAnalytics } from '../entities/content-analytics.entity';

export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  const isProduction = configService.get('NODE_ENV') === 'production';
  
  return {
    type: 'postgres',
    host: configService.get('DATABASE_HOST', 'localhost'),
    port: configService.get('DATABASE_PORT', 5432),
    username: configService.get('DATABASE_USER', 'postgres'),
    password: configService.get('DATABASE_PASSWORD', 'password'),
    database: configService.get('DATABASE_NAME', isProduction ? 'amysoft_prod' : 'amysoft_dev'),
    entities: [
      User,
      Content,
      Payment,
      UserSubscription,
      UserActivity,
      ContentAnalytics
    ],
    migrations: ['dist/apps/api/src/migrations/*.js'],
    migrationsTableName: 'migrations',
    migrationsRun: configService.get('DATABASE_AUTO_MIGRATE', 'false') === 'true',
    synchronize: !isProduction && configService.get('DATABASE_SYNC', 'false') === 'true',
    logging: !isProduction,
    ssl: isProduction ? {
      rejectUnauthorized: configService.get('DATABASE_SSL_REJECT_UNAUTHORIZED', 'true') === 'true'
    } : false,
    extra: {
      max: 20, // Maximum number of connections
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    },
    retryAttempts: 3,
    retryDelay: 3000,
    autoLoadEntities: true,
    keepConnectionAlive: true,
    // Connection pooling for better performance
    cache: {
      type: 'redis',
      options: {
        host: configService.get('REDIS_HOST', 'localhost'),
        port: configService.get('REDIS_PORT', 6379),
        password: configService.get('REDIS_PASSWORD'),
        db: configService.get('REDIS_DB', 1), // Use different DB for cache
      },
      duration: 30000, // 30 seconds cache duration
    }
  };
};