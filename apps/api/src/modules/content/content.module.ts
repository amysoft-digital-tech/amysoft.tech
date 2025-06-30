import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { Content } from '../../entities/content.entity';
import { ContentAnalytics } from '../../entities/content-analytics.entity';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { PrismaService } from '../../services/prisma.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Content, ContentAnalytics]),
    CacheModule.register({
      ttl: 1800, // 30 minutes default cache
      max: 100,  // Maximum number of items in cache
    })
  ],
  providers: [
    PrismaService,
    ContentService
  ],
  controllers: [ContentController],
  exports: [PrismaService, ContentService]
})
export class ContentModule {}