import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Content } from '../../entities/content.entity';
import { ContentAnalytics } from '../../entities/content-analytics.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Content, ContentAnalytics])],
  providers: [],
  controllers: [],
  exports: []
})
export class ContentModule {}