import { Controller, Post, Body, Get, Query, Ip, Headers, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { LeadCaptureService } from '../services/lead-capture.service';
import { 
  LeadCaptureDto, 
  NewsletterSignupDto, 
  EmailValidationDto, 
  LeadCaptureResponseDto, 
  EmailValidationResponseDto 
} from '../dto/lead-capture.dto';

@ApiTags('Lead Capture')
@Controller('api/leads')
export class LeadCaptureController {
  constructor(private readonly leadCaptureService: LeadCaptureService) {}

  @Post('capture')
  @ApiOperation({ 
    summary: 'Capture lead information',
    description: 'Capture lead information from forms across the website with email validation and welcome sequence'
  })
  @ApiBody({ type: LeadCaptureDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Lead captured successfully',
    type: LeadCaptureResponseDto
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async captureLead(
    @Body(new ValidationPipe({ transform: true })) leadData: LeadCaptureDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
    @Headers('cf-ipcountry') country?: string
  ): Promise<LeadCaptureResponseDto> {
    return this.leadCaptureService.captureLeadFromForm(
      leadData,
      ipAddress,
      userAgent,
      country
    );
  }

  @Post('newsletter-signup')
  @ApiOperation({ 
    summary: 'Newsletter subscription',
    description: 'Subscribe to newsletter with preference management'
  })
  @ApiBody({ type: NewsletterSignupDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Newsletter subscription successful',
    schema: {
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  })
  async subscribeToNewsletter(
    @Body(new ValidationPipe({ transform: true })) subscriptionData: NewsletterSignupDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
    @Headers('cf-ipcountry') country?: string
  ): Promise<{ success: boolean; message: string }> {
    return this.leadCaptureService.subscribeToNewsletter(
      subscriptionData,
      ipAddress,
      userAgent,
      country
    );
  }

  @Post('validate-email')
  @ApiOperation({ 
    summary: 'Validate email address',
    description: 'Validate email format, check for disposable domains, and assess deliverability'
  })
  @ApiBody({ type: EmailValidationDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Email validation result',
    type: EmailValidationResponseDto
  })
  async validateEmail(
    @Body(new ValidationPipe({ transform: true })) emailData: EmailValidationDto
  ): Promise<EmailValidationResponseDto> {
    return this.leadCaptureService.validateEmail(emailData);
  }

  @Get('stats')
  @ApiOperation({ 
    summary: 'Get lead statistics',
    description: 'Get lead capture statistics and conversion metrics'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lead statistics',
    schema: {
      properties: {
        totalLeads: { type: 'number' },
        newLeads: { type: 'number' },
        convertedLeads: { type: 'number' },
        conversionRate: { type: 'number' },
        topSources: { type: 'array', items: { type: 'object' } },
        conversionBySource: { type: 'array', items: { type: 'object' } }
      }
    }
  })
  async getLeadStats(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string
  ) {
    const from = dateFrom ? new Date(dateFrom) : undefined;
    const to = dateTo ? new Date(dateTo) : undefined;
    
    return this.leadCaptureService.getLeadStats(from, to);
  }
}