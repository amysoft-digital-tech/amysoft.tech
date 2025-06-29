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
import { CustomerAdminService } from '../services/customer-admin.service';
import { AuditService } from '../services/audit.service';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { RequirePermissions } from '../decorators/permissions.decorator';
import { AdminPermission, CustomerSearchParams } from '../interfaces/admin.interfaces';

@ApiTags('Admin - Customers')
@ApiBearerAuth()
@Controller('api/admin/customers')
@UseGuards(AdminAuthGuard)
export class CustomerAdminController {
  constructor(
    private readonly customerService: CustomerAdminService,
    private readonly auditService: AuditService,
  ) {}

  @Get('search')
  @RequirePermissions(AdminPermission.VIEW_CUSTOMERS)
  @ApiOperation({ summary: 'Search customers with advanced filters' })
  @ApiResponse({ status: 200, description: 'Customer search results' })
  async searchCustomers(
    @Query() params: CustomerSearchParams,
    @Req() req: any,
  ) {
    await this.auditService.logAdminAction(
      req.adminUser,
      'search_customers',
      'customer',
      undefined,
      { params },
      req,
    );

    return this.customerService.searchCustomers(params);
  }

  @Get(':id')
  @RequirePermissions(AdminPermission.VIEW_CUSTOMERS)
  @ApiOperation({ summary: 'Get detailed customer information' })
  @ApiResponse({ status: 200, description: 'Customer details' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async getCustomerDetails(
    @Param('id') customerId: string,
    @Req() req: any,
  ) {
    await this.auditService.logAdminAction(
      req.adminUser,
      'view_customer',
      'customer',
      customerId,
      undefined,
      req,
    );

    return this.customerService.getCustomerDetails(customerId);
  }

  @Put(':id')
  @RequirePermissions(AdminPermission.EDIT_CUSTOMERS)
  @ApiOperation({ summary: 'Update customer profile' })
  @ApiResponse({ status: 200, description: 'Customer updated successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async updateCustomer(
    @Param('id') customerId: string,
    @Body() updates: any,
    @Req() req: any,
  ) {
    await this.auditService.logAdminAction(
      req.adminUser,
      'update_customer',
      'customer',
      customerId,
      { updates },
      req,
    );

    return this.customerService.updateCustomerProfile(customerId, updates);
  }

  @Post(':id/subscription')
  @RequirePermissions(AdminPermission.MANAGE_SUBSCRIPTIONS)
  @ApiOperation({ summary: 'Update customer subscription' })
  @ApiResponse({ status: 200, description: 'Subscription updated successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async updateSubscription(
    @Param('id') customerId: string,
    @Body() updates: {
      plan?: string;
      status?: string;
      endDate?: Date;
      autoRenew?: boolean;
    },
    @Req() req: any,
  ) {
    await this.auditService.logAdminAction(
      req.adminUser,
      'update_subscription',
      'subscription',
      customerId,
      { updates },
      req,
    );

    return this.customerService.updateSubscription(customerId, updates);
  }

  @Post(':id/subscription/cancel')
  @RequirePermissions(AdminPermission.MANAGE_SUBSCRIPTIONS)
  @ApiOperation({ summary: 'Cancel customer subscription' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async cancelSubscription(
    @Param('id') customerId: string,
    @Body('reason') reason: string,
    @Req() req: any,
  ) {
    await this.auditService.logAdminAction(
      req.adminUser,
      'cancel_subscription',
      'subscription',
      customerId,
      { reason },
      req,
    );

    return this.customerService.cancelSubscription(customerId, reason);
  }

  @Post(':id/message')
  @RequirePermissions(AdminPermission.EDIT_CUSTOMERS)
  @ApiOperation({ summary: 'Send message to customer' })
  @ApiResponse({ status: 200, description: 'Message sent successfully' })
  @HttpCode(HttpStatus.OK)
  async sendMessage(
    @Param('id') customerId: string,
    @Body() message: {
      subject: string;
      body: string;
      type: 'email' | 'notification';
    },
    @Req() req: any,
  ) {
    await this.auditService.logAdminAction(
      req.adminUser,
      'send_message',
      'customer',
      customerId,
      { messageType: message.type, subject: message.subject },
      req,
    );

    // In a real implementation, this would send an actual message
    return {
      success: true,
      messageId: `msg_${Date.now()}`,
      sentAt: new Date(),
    };
  }

  @Get(':id/activity')
  @RequirePermissions(AdminPermission.VIEW_CUSTOMER_ANALYTICS)
  @ApiOperation({ summary: 'Get customer activity history' })
  @ApiResponse({ status: 200, description: 'Customer activity data' })
  async getCustomerActivity(
    @Param('id') customerId: string,
    @Query('limit') limit: number = 50,
    @Req() req: any,
  ) {
    await this.auditService.logAdminAction(
      req.adminUser,
      'view_customer_activity',
      'customer',
      customerId,
      { limit },
      req,
    );

    const details = await this.customerService.getCustomerDetails(customerId);
    return {
      customerId,
      activity: details.activity,
      metrics: details.metrics,
    };
  }

  @Get(':id/support-tickets')
  @RequirePermissions(AdminPermission.VIEW_CUSTOMERS)
  @ApiOperation({ summary: 'Get customer support ticket history' })
  @ApiResponse({ status: 200, description: 'Support ticket history' })
  async getCustomerSupportTickets(
    @Param('id') customerId: string,
    @Req() req: any,
  ) {
    await this.auditService.logAdminAction(
      req.adminUser,
      'view_support_tickets',
      'customer',
      customerId,
      undefined,
      req,
    );

    const details = await this.customerService.getCustomerDetails(customerId);
    return {
      customerId,
      tickets: details.supportHistory,
      totalCount: details.supportHistory.length,
    };
  }

  @Post('bulk-action')
  @RequirePermissions(AdminPermission.EDIT_CUSTOMERS)
  @ApiOperation({ summary: 'Perform bulk actions on multiple customers' })
  @ApiResponse({ status: 200, description: 'Bulk action completed' })
  async bulkAction(
    @Body() data: {
      customerIds: string[];
      action: 'message' | 'tag' | 'export';
      params: any;
    },
    @Req() req: any,
  ) {
    await this.auditService.logAdminAction(
      req.adminUser,
      'bulk_customer_action',
      'customer',
      undefined,
      { action: data.action, count: data.customerIds.length },
      req,
    );

    // In a real implementation, this would perform the bulk action
    return {
      success: true,
      processed: data.customerIds.length,
      action: data.action,
    };
  }

  @Get('analytics/segments')
  @RequirePermissions(AdminPermission.VIEW_CUSTOMER_ANALYTICS)
  @ApiOperation({ summary: 'Get customer segmentation analytics' })
  @ApiResponse({ status: 200, description: 'Customer segments data' })
  async getCustomerSegments(@Req() req: any) {
    await this.auditService.logAdminAction(
      req.adminUser,
      'view_customer_segments',
      'analytics',
      undefined,
      undefined,
      req,
    );

    // In a real implementation, this would return actual segmentation data
    return {
      segments: {
        byValue: {
          high: 150,
          medium: 500,
          low: 1200,
        },
        byActivity: {
          veryActive: 400,
          active: 800,
          inactive: 650,
        },
        byPlan: {
          premium: 200,
          standard: 1000,
          basic: 650,
        },
      },
      totalCustomers: 1850,
    };
  }

  @Get('analytics/churn-risk')
  @RequirePermissions(AdminPermission.VIEW_CUSTOMER_ANALYTICS)
  @ApiOperation({ summary: 'Get customers at risk of churning' })
  @ApiResponse({ status: 200, description: 'Churn risk analysis' })
  async getChurnRiskAnalysis(
    @Query('limit') limit: number = 20,
    @Req() req: any,
  ) {
    await this.auditService.logAdminAction(
      req.adminUser,
      'view_churn_risk',
      'analytics',
      undefined,
      { limit },
      req,
    );

    // In a real implementation, this would use ML models for churn prediction
    return {
      highRisk: [],
      mediumRisk: [],
      summary: {
        highRiskCount: 0,
        mediumRiskCount: 0,
        overallChurnRate: 5.2,
      },
    };
  }
}