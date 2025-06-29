import { Injectable } from '@nestjs/common';
import { Lead } from '../entities/lead.entity';

@Injectable()
export class EmailService {
  async sendWelcomeEmail(lead: Lead): Promise<void> {
    // TODO: Integrate with actual email service provider (SendGrid, Mailgun, etc.)
    console.log(`Sending welcome email to ${lead.email}`);
    
    const emailTemplate = this.getWelcomeEmailTemplate(lead);
    
    // Mock email sending - replace with actual email service
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Welcome email sent to ${lead.email}`);
        resolve();
      }, 100);
    });
  }

  async sendNewsletterConfirmation(lead: Lead): Promise<void> {
    console.log(`Sending newsletter confirmation to ${lead.email}`);
    
    const emailTemplate = this.getNewsletterConfirmationTemplate(lead);
    
    // Mock email sending
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Newsletter confirmation sent to ${lead.email}`);
        resolve();
      }, 100);
    });
  }

  async sendDeveloperOnboardingSequence(lead: Lead, sequence: string): Promise<void> {
    console.log(`Starting ${sequence} sequence for ${lead.email}`);
    
    // Mock sequence sending
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Onboarding sequence ${sequence} started for ${lead.email}`);
        resolve();
      }, 100);
    });
  }

  private getWelcomeEmailTemplate(lead: Lead): string {
    const experienceLevel = lead.experienceLevel || 'intermediate';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Welcome to Beyond the AI Plateau</title>
      </head>
      <body>
        <h1>Welcome ${lead.name || 'Developer'}!</h1>
        <p>Thank you for joining our community of elite AI developers.</p>
        
        ${this.getPersonalizedContent(experienceLevel)}
        
        <h2>What's Next?</h2>
        <ul>
          <li>📖 Start with our foundational principles</li>
          <li>🛠️ Access your template library</li>
          <li>💬 Join our developer community</li>
        </ul>
        
        <a href="https://amysoft.tech/get-started" style="background: #007acc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
          Get Started Now
        </a>
        
        <p>Best regards,<br>Christopher Caruso</p>
      </body>
      </html>
    `;
  }

  private getNewsletterConfirmationTemplate(lead: Lead): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Newsletter Subscription Confirmed</title>
      </head>
      <body>
        <h1>You're all set, ${lead.name || 'Developer'}!</h1>
        <p>Your newsletter subscription has been confirmed.</p>
        
        <p>You'll receive:</p>
        <ul>
          <li>📅 Weekly AI development insights</li>
          <li>🎯 Exclusive tips and strategies</li>
          <li>📢 Early access to new content</li>
        </ul>
        
        <p>Stay tuned for amazing content!</p>
        
        <p>Best regards,<br>Christopher Caruso</p>
        
        <p><small>
          You can <a href="https://amysoft.tech/unsubscribe?email=${lead.email}">unsubscribe</a> at any time.
        </small></p>
      </body>
      </html>
    `;
  }

  private getPersonalizedContent(experienceLevel: string): string {
    switch (experienceLevel) {
      case 'beginner':
        return `
          <p>As a beginner developer, you're in the perfect position to build AI-driven development habits from the start.</p>
          <p>We recommend starting with our "Foundation Principles" to build a solid base.</p>
        `;
      case 'advanced':
        return `
          <p>As an advanced developer, you'll appreciate our deep-dive strategies for integrating AI into complex development workflows.</p>
          <p>Jump straight to our "Elite Techniques" for maximum impact.</p>
        `;
      default:
        return `
          <p>As an intermediate developer, you're ready to accelerate your AI development skills to the next level.</p>
          <p>Our structured approach will help you master both fundamentals and advanced techniques.</p>
        `;
    }
  }
}