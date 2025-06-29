import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from '../entities/lead.entity';
import { LeadCaptureDto, NewsletterSignupDto, EmailValidationDto, LeadCaptureResponseDto, EmailValidationResponseDto } from '../dto/lead-capture.dto';
import { EmailService } from './email.service';
import { AnalyticsService } from './analytics.service';

@Injectable()
export class LeadCaptureService {
  constructor(
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
    private emailService: EmailService,
    private analyticsService: AnalyticsService,
  ) {}

  async captureLeadFromForm(
    leadData: LeadCaptureDto,
    ipAddress: string,
    userAgent: string,
    country?: string
  ): Promise<LeadCaptureResponseDto> {
    // Check for existing lead
    const existingLead = await this.leadRepository.findOne({
      where: { email: leadData.email }
    });

    if (existingLead) {
      // Update existing lead with new information
      await this.updateExistingLead(existingLead, leadData, ipAddress, userAgent, country);
      
      return {
        success: true,
        leadId: existingLead.id,
        message: 'Welcome back! We\'ve updated your preferences.',
        nextSteps: {
          emailSent: false,
          welcomeSequence: 'returning-user',
          redirectUrl: '/welcome-back'
        }
      };
    }

    // Create new lead
    const lead = this.leadRepository.create({
      ...leadData,
      ipAddress,
      userAgent,
      country,
      status: 'new',
      newsletterSubscribed: leadData.marketingConsent || false
    });

    const savedLead = await this.leadRepository.save(lead);

    // Send welcome email
    let emailSent = false;
    try {
      await this.emailService.sendWelcomeEmail(savedLead);
      emailSent = true;
      
      // Update email sent tracking
      await this.leadRepository.update(savedLead.id, {
        firstContactedAt: new Date(),
        emailsSent: 1,
        lastEmailSentAt: new Date()
      });
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }

    // Track conversion event
    await this.analyticsService.trackConversionEvent({
      eventName: 'lead_captured',
      sessionId: `session_${Date.now()}`, // Should come from request
      leadId: savedLead.id,
      properties: {
        source: leadData.source,
        experienceLevel: leadData.experienceLevel,
        utmSource: leadData.utmSource,
        utmCampaign: leadData.utmCampaign
      }
    });

    return {
      success: true,
      leadId: savedLead.id,
      message: 'Welcome! Check your email for next steps.',
      nextSteps: {
        emailSent,
        welcomeSequence: this.getWelcomeSequenceType(leadData),
        redirectUrl: '/welcome'
      }
    };
  }

  async subscribeToNewsletter(
    subscriptionData: NewsletterSignupDto,
    ipAddress: string,
    userAgent: string,
    country?: string
  ): Promise<{ success: boolean; message: string }> {
    const existingLead = await this.leadRepository.findOne({
      where: { email: subscriptionData.email }
    });

    if (existingLead) {
      // Update newsletter subscription
      await this.leadRepository.update(existingLead.id, {
        newsletterSubscribed: true,
        marketingConsent: true,
        updatedAt: new Date()
      });

      return {
        success: true,
        message: 'Newsletter subscription updated successfully!'
      };
    }

    // Create new lead for newsletter subscription
    const lead = this.leadRepository.create({
      email: subscriptionData.email,
      name: subscriptionData.name,
      source: subscriptionData.source,
      gdprConsent: subscriptionData.gdprConsent,
      marketingConsent: true,
      newsletterSubscribed: true,
      status: 'new',
      ipAddress,
      userAgent,
      country
    });

    await this.leadRepository.save(lead);

    // Send newsletter confirmation
    try {
      await this.emailService.sendNewsletterConfirmation(lead);
    } catch (error) {
      console.error('Failed to send newsletter confirmation:', error);
    }

    return {
      success: true,
      message: 'Successfully subscribed to newsletter!'
    };
  }

  async validateEmail(emailData: EmailValidationDto): Promise<EmailValidationResponseDto> {
    const email = emailData.email.toLowerCase().trim();

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        valid: false,
        riskScore: 1.0,
        deliverable: false,
        disposable: false
      };
    }

    // Check for disposable email domains
    const disposableIndicators = this.checkDisposableEmail(email);
    
    // Calculate risk score based on various factors
    const riskScore = this.calculateEmailRiskScore(email);

    // Check if email looks deliverable
    const deliverable = this.checkEmailDeliverability(email);

    return {
      valid: true,
      riskScore,
      deliverable,
      disposable: disposableIndicators.isDisposable,
      suggestion: disposableIndicators.suggestion
    };
  }

  async getLeadStats(dateFrom?: Date, dateTo?: Date) {
    const queryBuilder = this.leadRepository.createQueryBuilder('lead');
    
    if (dateFrom) {
      queryBuilder.andWhere('lead.createdAt >= :dateFrom', { dateFrom });
    }
    if (dateTo) {
      queryBuilder.andWhere('lead.createdAt <= :dateTo', { dateTo });
    }

    const [
      totalLeads,
      newLeads,
      convertedLeads,
      topSources,
      conversionBySource
    ] = await Promise.all([
      queryBuilder.getCount(),
      queryBuilder.clone().andWhere('lead.status = :status', { status: 'new' }).getCount(),
      queryBuilder.clone().andWhere('lead.status = :status', { status: 'converted' }).getCount(),
      queryBuilder
        .clone()
        .select('lead.source', 'source')
        .addSelect('COUNT(*)', 'count')
        .groupBy('lead.source')
        .orderBy('count', 'DESC')
        .limit(5)
        .getRawMany(),
      queryBuilder
        .clone()
        .select('lead.source', 'source')
        .addSelect('COUNT(CASE WHEN lead.status = \'converted\' THEN 1 END)', 'conversions')
        .addSelect('COUNT(*)', 'total')
        .addSelect('ROUND(COUNT(CASE WHEN lead.status = \'converted\' THEN 1 END) * 100.0 / COUNT(*), 2)', 'conversionRate')
        .groupBy('lead.source')
        .getRawMany()
    ]);

    return {
      totalLeads,
      newLeads,
      convertedLeads,
      conversionRate: totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0,
      topSources,
      conversionBySource
    };
  }

  private async updateExistingLead(
    existingLead: Lead,
    newData: LeadCaptureDto,
    ipAddress: string,
    userAgent: string,
    country?: string
  ): Promise<void> {
    const updateData: Partial<Lead> = {
      updatedAt: new Date()
    };

    // Update fields if they're provided and different
    if (newData.name && newData.name !== existingLead.name) {
      updateData.name = newData.name;
    }
    if (newData.experienceLevel && newData.experienceLevel !== existingLead.experienceLevel) {
      updateData.experienceLevel = newData.experienceLevel;
    }
    if (newData.primaryLanguage && newData.primaryLanguage !== existingLead.primaryLanguage) {
      updateData.primaryLanguage = newData.primaryLanguage;
    }
    if (newData.marketingConsent !== undefined) {
      updateData.marketingConsent = newData.marketingConsent;
      updateData.newsletterSubscribed = newData.marketingConsent;
    }

    // Always update tracking information
    updateData.ipAddress = ipAddress;
    updateData.userAgent = userAgent;
    if (country) updateData.country = country;

    // Update UTM parameters if provided
    if (newData.utmSource) updateData.utmSource = newData.utmSource;
    if (newData.utmMedium) updateData.utmMedium = newData.utmMedium;
    if (newData.utmCampaign) updateData.utmCampaign = newData.utmCampaign;

    await this.leadRepository.update(existingLead.id, updateData);
  }

  private getWelcomeSequenceType(leadData: LeadCaptureDto): string {
    // Determine welcome sequence based on lead characteristics
    if (leadData.experienceLevel === 'beginner') {
      return 'beginner-developer';
    } else if (leadData.experienceLevel === 'advanced') {
      return 'advanced-developer';
    } else if (leadData.source === 'pricing-page') {
      return 'pricing-interested';
    } else {
      return 'general-developer';
    }
  }

  private checkDisposableEmail(email: string): { isDisposable: boolean; suggestion?: string } {
    const disposableDomains = [
      '10minutemail.com', 'tempmail.org', 'guerrillamail.com', 
      'mailinator.com', 'throwaway.email', 'temp-mail.org'
    ];

    const domain = email.split('@')[1];
    const isDisposable = disposableDomains.includes(domain);

    return {
      isDisposable,
      suggestion: isDisposable ? 'Please use a permanent email address' : undefined
    };
  }

  private calculateEmailRiskScore(email: string): number {
    let score = 0;

    // Check for suspicious patterns
    if (email.includes('+')) score += 0.1; // Plus addressing
    if (/\d{4,}/.test(email)) score += 0.2; // Many consecutive numbers
    if (email.split('@')[0].length < 3) score += 0.3; // Very short local part
    
    const domain = email.split('@')[1];
    if (!domain.includes('.')) score += 0.5; // Invalid domain
    if (domain.endsWith('.tk') || domain.endsWith('.ml')) score += 0.3; // Free domains

    return Math.min(score, 1.0);
  }

  private checkEmailDeliverability(email: string): boolean {
    // Basic deliverability checks
    const domain = email.split('@')[1];
    
    // Common email providers are generally deliverable
    const trustedDomains = [
      'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com',
      'icloud.com', 'protonmail.com', 'company.com'
    ];

    return trustedDomains.some(trusted => domain.endsWith(trusted)) || 
           domain.includes('.edu') || 
           domain.includes('.gov') ||
           domain.includes('.org');
  }
}