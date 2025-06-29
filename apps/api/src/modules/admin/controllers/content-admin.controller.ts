import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ContentAdminService } from '../services/content-admin.service';
import { AuditService } from '../services/audit.service';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { RequirePermissions } from '../decorators/permissions.decorator';
import { AdminPermission, ContentSearchParams } from '../interfaces/admin.interfaces';

@ApiTags('Admin - Content')
@ApiBearerAuth()
@Controller('api/admin/content')
@UseGuards(AdminAuthGuard)
export class ContentAdminController {
  constructor(
    private readonly contentService: ContentAdminService,
    private readonly auditService: AuditService,
  ) {}

  @Get('search')
  @RequirePermissions(AdminPermission.VIEW_CONTENT)
  @ApiOperation({ summary: 'Search content with filters' })
  @ApiResponse({ status: 200, description: 'Content search results' })
  async searchContent(
    @Query() params: ContentSearchParams,
    @Req() req: any,
  ) {
    await this.auditService.logAdminAction(
      req.adminUser,
      'search_content',
      'content',
      undefined,
      { params },
      req,
    );

    return this.contentService.searchContent(params);
  }

  @Get(':id')
  @RequirePermissions(AdminPermission.VIEW_CONTENT)
  @ApiOperation({ summary: 'Get detailed content information' })
  @ApiResponse({ status: 200, description: 'Content details' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  async getContentDetails(
    @Param('id') contentId: string,
    @Req() req: any,
  ) {
    await this.auditService.logAdminAction(
      req.adminUser,
      'view_content',
      'content',
      contentId,
      undefined,
      req,
    );

    return this.contentService.getContentDetails(contentId);
  }

  @Post()
  @RequirePermissions(AdminPermission.CREATE_CONTENT)
  @ApiOperation({ summary: 'Create new content' })
  @ApiResponse({ status: 201, description: 'Content created successfully' })
  async createContent(
    @Body() data: {
      title: string;
      description: string;
      type: string;
      body: any;
      tags: string[];
      categoryId: string;
      authorId: string;
      metadata?: any;
    },
    @Req() req: any,
  ) {
    const content = await this.contentService.createContent({
      ...data,
      authorId: data.authorId || req.adminUser.id,
    });

    await this.auditService.logAdminAction(
      req.adminUser,
      'create_content',
      'content',
      content.id,
      { title: content.title, type: content.type },
      req,
    );

    return content;
  }

  @Put(':id')
  @RequirePermissions(AdminPermission.EDIT_CONTENT)
  @ApiOperation({ summary: 'Update content' })
  @ApiResponse({ status: 200, description: 'Content updated successfully' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  async updateContent(
    @Param('id') contentId: string,
    @Body() updates: any,
    @Req() req: any,
  ) {
    await this.auditService.logAdminAction(
      req.adminUser,
      'update_content',
      'content',
      contentId,
      { updates: Object.keys(updates) },
      req,
    );

    return this.contentService.updateContent(contentId, updates);
  }

  @Post(':id/publish')
  @RequirePermissions(AdminPermission.PUBLISH_CONTENT)
  @ApiOperation({ summary: 'Publish content' })
  @ApiResponse({ status: 200, description: 'Content published successfully' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  @HttpCode(HttpStatus.OK)
  async publishContent(
    @Param('id') contentId: string,
    @Req() req: any,
  ) {
    const content = await this.contentService.publishContent(contentId);

    await this.auditService.logAdminAction(
      req.adminUser,
      'publish_content',
      'content',
      contentId,
      { title: content.title },
      req,
    );

    return content;
  }

  @Post(':id/archive')
  @RequirePermissions(AdminPermission.EDIT_CONTENT)
  @ApiOperation({ summary: 'Archive content' })
  @ApiResponse({ status: 200, description: 'Content archived successfully' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  @HttpCode(HttpStatus.OK)
  async archiveContent(
    @Param('id') contentId: string,
    @Req() req: any,
  ) {
    const content = await this.contentService.archiveContent(contentId);

    await this.auditService.logAdminAction(
      req.adminUser,
      'archive_content',
      'content',
      contentId,
      undefined,
      req,
    );

    return content;
  }

  @Delete(':id')
  @RequirePermissions(AdminPermission.DELETE_CONTENT)
  @ApiOperation({ summary: 'Delete content permanently' })
  @ApiResponse({ status: 204, description: 'Content deleted successfully' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteContent(
    @Param('id') contentId: string,
    @Req() req: any,
  ) {
    await this.contentService.deleteContent(contentId);

    await this.auditService.logAdminAction(
      req.adminUser,
      'delete_content',
      'content',
      contentId,
      undefined,
      req,
    );
  }

  @Post('bulk-action')
  @RequirePermissions(AdminPermission.EDIT_CONTENT)
  @ApiOperation({ summary: 'Perform bulk actions on multiple content items' })
  @ApiResponse({ status: 200, description: 'Bulk action completed' })
  async bulkAction(
    @Body() data: {
      contentIds: string[];
      action: {
        status?: 'publish' | 'archive' | 'delete';
        categoryId?: string;
        tags?: string[];
      };
    },
    @Req() req: any,
  ) {
    const result = await this.contentService.bulkUpdateContent(
      data.contentIds,
      data.action,
    );

    await this.auditService.logAdminAction(
      req.adminUser,
      'bulk_content_action',
      'content',
      undefined,
      { 
        action: data.action,
        count: data.contentIds.length,
        result,
      },
      req,
    );

    return result;
  }

  @Get(':id/versions')
  @RequirePermissions(AdminPermission.VIEW_CONTENT)
  @ApiOperation({ summary: 'Get content version history' })
  @ApiResponse({ status: 200, description: 'Version history' })
  async getVersionHistory(
    @Param('id') contentId: string,
    @Req() req: any,
  ) {
    await this.auditService.logAdminAction(
      req.adminUser,
      'view_content_versions',
      'content',
      contentId,
      undefined,
      req,
    );

    const details = await this.contentService.getContentDetails(contentId);
    return {
      contentId,
      currentVersion: details.content,
      history: details.versionHistory,
    };
  }

  @Get(':id/analytics')
  @RequirePermissions(AdminPermission.VIEW_ANALYTICS)
  @ApiOperation({ summary: 'Get content analytics' })
  @ApiResponse({ status: 200, description: 'Content analytics data' })
  async getContentAnalytics(
    @Param('id') contentId: string,
    @Query('period') period: 'day' | 'week' | 'month' = 'month',
    @Req() req: any,
  ) {
    await this.auditService.logAdminAction(
      req.adminUser,
      'view_content_analytics',
      'content',
      contentId,
      { period },
      req,
    );

    const details = await this.contentService.getContentDetails(contentId);
    return {
      contentId,
      title: details.content.title,
      analytics: details.analytics,
      period,
    };
  }

  @Get('templates/library')
  @RequirePermissions(AdminPermission.VIEW_CONTENT)
  @ApiOperation({ summary: 'Get template library' })
  @ApiResponse({ status: 200, description: 'Template library' })
  async getTemplateLibrary(
    @Query('category') category?: string,
    @Query('limit') limit: number = 50,
    @Req() req: any,
  ) {
    await this.auditService.logAdminAction(
      req.adminUser,
      'view_template_library',
      'content',
      undefined,
      { category, limit },
      req,
    );

    const params: ContentSearchParams = {
      type: 'template',
      categoryId: category,
      limit,
    };

    return this.contentService.searchContent(params);
  }

  @Post('templates/:id/approve')
  @RequirePermissions(AdminPermission.PUBLISH_CONTENT)
  @ApiOperation({ summary: 'Approve template for library' })
  @ApiResponse({ status: 200, description: 'Template approved' })
  @HttpCode(HttpStatus.OK)
  async approveTemplate(
    @Param('id') templateId: string,
    @Req() req: any,
  ) {
    const template = await this.contentService.updateContent(templateId, {
      metadata: {
        approved: true,
        approvedBy: req.adminUser.id,
        approvedAt: new Date(),
      },
    });

    await this.auditService.logAdminAction(
      req.adminUser,
      'approve_template',
      'content',
      templateId,
      undefined,
      req,
    );

    return template;
  }

  @Get('categories')
  @RequirePermissions(AdminPermission.VIEW_CONTENT)
  @ApiOperation({ summary: 'Get content categories' })
  @ApiResponse({ status: 200, description: 'Content categories' })
  async getCategories(@Req() req: any) {
    // In a real implementation, this would fetch from a categories table
    return {
      categories: [
        { id: 'tech', name: 'Technology', count: 150 },
        { id: 'business', name: 'Business', count: 230 },
        { id: 'design', name: 'Design', count: 180 },
        { id: 'marketing', name: 'Marketing', count: 120 },
      ],
    };
  }

  @Get('analytics/performance')
  @RequirePermissions(AdminPermission.VIEW_ANALYTICS)
  @ApiOperation({ summary: 'Get overall content performance metrics' })
  @ApiResponse({ status: 200, description: 'Content performance data' })
  async getContentPerformance(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Req() req: any,
  ) {
    await this.auditService.logAdminAction(
      req.adminUser,
      'view_content_performance',
      'analytics',
      undefined,
      { dateFrom, dateTo },
      req,
    );

    // In a real implementation, this would aggregate analytics data
    return {
      period: { from: dateFrom, to: dateTo },
      summary: {
        totalContent: 450,
        publishedContent: 380,
        totalViews: 125000,
        avgEngagement: 4.2,
      },
      topPerforming: [],
      byCategory: {},
      trends: {
        views: [],
        engagement: [],
        publishing: [],
      },
    };
  }
}