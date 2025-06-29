import { Injectable } from '@angular/core';

export interface EmailSequence {
  id: string;
  name: string;
  description: string;
  type: SequenceType;
  trigger: EmailTrigger;
  emails: EmailTemplate[];
  active: boolean;
  metrics: SequenceMetrics;
  segmentation?: EmailSegmentation;
}

export type SequenceType = 
  | 'welcome' 
  | 'lead_nurture' 
  | 'onboarding' 
  | 'engagement' 
  | 'conversion' 
  | 'retention'
  | 'reactivation';

export interface EmailTrigger {
  type: 'signup' | 'purchase' | 'behavior' | 'time_based' | 'tag_added';
  condition: string;
  delay?: number; // hours
}

export interface EmailTemplate {
  id: string;
  subject: string;
  preview: string;
  content: EmailContent;
  timing: EmailTiming;
  personalization: PersonalizationRule[];
  abTest?: ABTestVariant[];
  metrics: EmailMetrics;
}

export interface EmailContent {
  text: string;
  html: string;
  ctaButtons: CTAButton[];
  personalizedFields: string[];
}

export interface EmailTiming {
  delayFromPrevious: number; // hours
  optimalSendTime: string; // "09:00" format
  timeZoneHandling: 'recipient' | 'sender' | 'utc';
}

export interface PersonalizationRule {
  field: string;
  fallback: string;
  conditions?: string[];
}

export interface ABTestVariant {
  id: string;
  name: string;
  percentage: number;
  subject?: string;
  content?: Partial<EmailContent>;
}

export interface CTAButton {
  text: string;
  url: string;
  style: 'primary' | 'secondary' | 'ghost';
  tracking: string;
}

export interface EmailMetrics {
  openRate: number;
  clickRate: number;
  conversionRate: number;
  unsubscribeRate: number;
  replyRate?: number;
}

export interface SequenceMetrics {
  totalSubscribers: number;
  completionRate: number;
  averageOpenRate: number;
  averageClickRate: number;
  totalConversions: number;
  conversionValue: number;
}

export interface EmailSegmentation {
  criteria: SegmentCriteria[];
  excludeSegments?: string[];
}

export interface SegmentCriteria {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in_list';
  value: any;
}

export interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  actions: WorkflowAction[];
  conditions: WorkflowCondition[];
  active: boolean;
  stats: WorkflowStats;
}

export interface WorkflowTrigger {
  type: 'email_opened' | 'link_clicked' | 'form_submitted' | 'tag_added' | 'purchase_made';
  criteria: any;
}

export interface WorkflowAction {
  type: 'send_email' | 'add_tag' | 'remove_tag' | 'update_field' | 'notify_team';
  config: any;
  delay?: number;
}

export interface WorkflowCondition {
  field: string;
  operator: string;
  value: any;
}

export interface WorkflowStats {
  totalTriggered: number;
  completionRate: number;
  conversionRate: number;
}

@Injectable({
  providedIn: 'root'
})
export class EmailSequencesDataService {

  private readonly emailSequences: EmailSequence[] = [
    {
      id: 'welcome_sequence',
      name: '7-Day Welcome Sequence',
      description: 'Onboard new subscribers with value-first content and gentle product introduction',
      type: 'welcome',
      trigger: {
        type: 'signup',
        condition: 'newsletter_signup',
        delay: 0
      },
      emails: [
        {
          id: 'welcome_01',
          subject: 'Welcome to the Elite 3% (+ Your Free Context Template)',
          preview: 'Your transformation to elite AI development starts now...',
          content: {
            text: `Hi {{first_name}},

Welcome to the Beyond the AI Plateau community! You've just joined an exclusive group of developers who refuse to accept mediocrity in their AI development skills.

Most developers hit the "AI plateau" where they can use ChatGPT for simple tasks but struggle with complex challenges. You're here because you know there's a better way.

🎁 YOUR WELCOME GIFT

I've prepared a special Context Mastery template that will immediately improve your AI interactions:

[Download Your Free Context Template]

This template alone has helped developers reduce debugging time by 60% and improve code quality scores significantly.

WHAT TO EXPECT THIS WEEK:

Tomorrow: The #1 mistake that keeps developers stuck on the AI plateau
Day 3: Dynamic Planning - How elite developers tackle complex features  
Day 4: The Strategic Testing approach that eliminates production bugs
Day 5: Code Evolution patterns for maintainable AI-assisted development
Day 6: Intelligent Review techniques that accelerate learning
Day 7: Your complete transformation roadmap

Each email contains actionable insights you can implement immediately, plus real case studies from developers who've made the transformation.

Ready to join the elite 3%?

Amy Richardson
Creator, Beyond the AI Plateau Framework

P.S. Hit reply and let me know what your biggest AI development challenge is right now. I personally read every email and often create content based on subscriber questions.`,
            html: `<div style="font-family: -apple-system, BlinkMacSystemFont, segoe ui, roboto, oxygen, ubuntu, cantarell, open sans, helvetica neue, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">Welcome to the Elite 3%</h1>
  
  <p>Hi {{first_name}},</p>
  
  <p>Welcome to the Beyond the AI Plateau community! You've just joined an exclusive group of developers who refuse to accept mediocrity in their AI development skills.</p>
  
  <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="color: #374151; margin-top: 0;">🎁 YOUR WELCOME GIFT</h3>
    <p>I've prepared a special Context Mastery template that will immediately improve your AI interactions:</p>
    <a href="{{context_template_url}}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Download Your Free Context Template</a>
  </div>
  
  <h3>WHAT TO EXPECT THIS WEEK:</h3>
  <ul>
    <li><strong>Tomorrow:</strong> The #1 mistake that keeps developers stuck on the AI plateau</li>
    <li><strong>Day 3:</strong> Dynamic Planning - How elite developers tackle complex features</li>
    <li><strong>Day 4:</strong> The Strategic Testing approach that eliminates production bugs</li>
    <li><strong>Day 5:</strong> Code Evolution patterns for maintainable AI-assisted development</li>
    <li><strong>Day 6:</strong> Intelligent Review techniques that accelerate learning</li>
    <li><strong>Day 7:</strong> Your complete transformation roadmap</li>
  </ul>
  
  <p>Ready to join the elite 3%?</p>
  
  <p>Amy Richardson<br>
  <em>Creator, Beyond the AI Plateau Framework</em></p>
  
  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280;">
    <p><strong>P.S.</strong> Hit reply and let me know what your biggest AI development challenge is right now. I personally read every email and often create content based on subscriber questions.</p>
  </div>
</div>`,
            ctaButtons: [
              {
                text: 'Download Your Free Context Template',
                url: '{{context_template_url}}',
                style: 'primary',
                tracking: 'welcome_context_template'
              }
            ],
            personalizedFields: ['first_name', 'context_template_url']
          },
          timing: {
            delayFromPrevious: 0,
            optimalSendTime: '09:00',
            timeZoneHandling: 'recipient'
          },
          personalization: [
            { field: 'first_name', fallback: 'there' },
            { field: 'context_template_url', fallback: '/templates/context-mastery' }
          ],
          metrics: {
            openRate: 67.3,
            clickRate: 23.8,
            conversionRate: 8.2,
            unsubscribeRate: 0.8,
            replyRate: 4.1
          }
        },
        {
          id: 'welcome_02',
          subject: 'The #1 Mistake Keeping You Stuck on the AI Plateau',
          preview: 'This single mindset shift transforms everything...',
          content: {
            text: `Hi {{first_name}},

Yesterday I promised to reveal the #1 mistake that keeps developers stuck on the AI plateau. 

Here it is: **Treating AI like a search engine instead of a collaborative partner.**

Most developers approach AI with the "Google mindset" - ask a quick question, get a quick answer, move on. This works for simple tasks but fails catastrophically for complex development challenges.

THE COLLABORATION MINDSET

Elite developers understand that AI is most powerful when treated as an intelligent collaborator who needs context, constraints, and clear communication.

Instead of:
"Write a login function"

They provide:
"I need a login function for our React/TypeScript app that integrates with our existing Redux auth slice, follows our error handling patterns, includes proper validation, and prepares for upcoming SSO integration."

THE TRANSFORMATION

When Marcus from DataCore Systems made this shift, he went from spending 4-6 hours debugging complex API issues to resolving them in 30-45 minutes.

Sarah at TechFlow reduced her feature development time by 70% just by improving how she communicated with AI.

THE CONTEXT HIERARCHY

Tomorrow, I'll show you the exact Context Hierarchy framework that elite developers use:

Level 1: Functional Context (what most developers stop at)
Level 2: Technical Context  
Level 3: Architectural Context
Level 4: Strategic Context (where breakthrough results happen)

Plus, I'll give you the specific templates that make this transformation automatic.

Talk tomorrow,
Amy

P.S. What's one complex development challenge you're facing right now? Reply and let me know - I might feature the solution in an upcoming email.`,
            html: `<div style="font-family: -apple-system, BlinkMacSystemFont, segoe ui, roboto, oxygen, ubuntu, cantarell, open sans, helvetica neue, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">The #1 Mistake Keeping You Stuck</h1>
  
  <p>Hi {{first_name}},</p>
  
  <p>Yesterday I promised to reveal the #1 mistake that keeps developers stuck on the AI plateau.</p>
  
  <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0;">
    <p style="margin: 0; font-weight: 600; color: #92400e;">Here it is: <strong>Treating AI like a search engine instead of a collaborative partner.</strong></p>
  </div>
  
  <p>Most developers approach AI with the "Google mindset" - ask a quick question, get a quick answer, move on. This works for simple tasks but fails catastrophically for complex development challenges.</p>
  
  <h3 style="color: #374151;">THE COLLABORATION MINDSET</h3>
  
  <p>Elite developers understand that AI is most powerful when treated as an intelligent collaborator who needs context, constraints, and clear communication.</p>
  
  <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0;">
    <p style="margin: 0; color: #ef4444;"><strong>Instead of:</strong><br>"Write a login function"</p>
  </div>
  
  <div style="background: #ecfdf5; border: 1px solid #10b981; padding: 15px; border-radius: 6px; margin: 15px 0;">
    <p style="margin: 0; color: #047857;"><strong>They provide:</strong><br>"I need a login function for our React/TypeScript app that integrates with our existing Redux auth slice, follows our error handling patterns, includes proper validation, and prepares for upcoming SSO integration."</p>
  </div>
  
  <h3 style="color: #374151;">THE TRANSFORMATION</h3>
  
  <ul>
    <li><strong>Marcus from DataCore Systems:</strong> Went from 4-6 hours debugging complex API issues to 30-45 minutes</li>
    <li><strong>Sarah at TechFlow:</strong> Reduced feature development time by 70% just by improving AI communication</li>
  </ul>
  
  <p>Tomorrow, I'll show you the exact Context Hierarchy framework that makes this transformation automatic.</p>
  
  <p>Talk tomorrow,<br>Amy</p>
  
  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280;">
    <p><strong>P.S.</strong> What's one complex development challenge you're facing right now? Reply and let me know - I might feature the solution in an upcoming email.</p>
  </div>
</div>`,
            ctaButtons: [],
            personalizedFields: ['first_name']
          },
          timing: {
            delayFromPrevious: 24,
            optimalSendTime: '09:30',
            timeZoneHandling: 'recipient'
          },
          personalization: [
            { field: 'first_name', fallback: 'there' }
          ],
          metrics: {
            openRate: 59.2,
            clickRate: 15.4,
            conversionRate: 4.7,
            unsubscribeRate: 1.2,
            replyRate: 6.8
          }
        },
        {
          id: 'welcome_03',
          subject: 'The Context Hierarchy (+ Free Dynamic Planning Template)',
          preview: 'Level 4 is where breakthrough results happen...',
          content: {
            text: `Hi {{first_name}},

Ready for the Context Hierarchy framework that separates elite developers from everyone else?

Most developers stop at Level 1 or 2. Elite developers consistently operate at Level 4.

LEVEL 1: FUNCTIONAL CONTEXT
"Create a login form"
(Basic - what most developers provide)

LEVEL 2: TECHNICAL CONTEXT
"Create a React login form with email/password validation"  
(Better - but still missing critical information)

LEVEL 3: ARCHITECTURAL CONTEXT
"Create a React login form that integrates with our Redux auth slice, follows our design system, and handles our error boundary requirements"
(Good - but elite developers go deeper)

LEVEL 4: STRATEGIC CONTEXT (ELITE LEVEL)
"Create a React login form for our fintech SaaS that:
- Integrates with Redux auth slice following patterns in src/auth/
- Implements security requirements (2FA ready, rate limiting aware)
- Follows design system (@/ui components, react-hook-form validation)
- Includes TypeScript types matching our User interface
- Handles edge cases: network failures, session timeout, concurrent logins
- Includes WCAG 2.1 AA accessibility features
- Prepares for upcoming SSO integration"

THE TRANSFORMATION

When developers make this shift to Level 4 context:
- 85% productivity increase (average)
- 70% reduction in iteration cycles
- 60% improvement in code quality scores
- 90% reduction in integration issues

🎁 YOUR DYNAMIC PLANNING TEMPLATE

Since you're making great progress, here's your second free template:

[Download Dynamic Planning Template]

This template helps you break down complex features systematically - the same approach that helped Marcus deliver his API project 8 weeks ahead of schedule.

COMING UP:

Tomorrow: Strategic Testing that eliminates production bugs
Friday: Code Evolution patterns for long-term maintainability  
Weekend: The complete transformation framework

Keep going - you're building momentum!

Amy

P.S. Try the Level 4 context approach on your next AI interaction. The difference is immediate and dramatic.`,
            html: `<div style="font-family: -apple-system, BlinkMacSystemFont, segoe ui, roboto, oxygen, ubuntu, cantarell, open sans, helvetica neue, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">The Context Hierarchy</h1>
  
  <p>Hi {{first_name}},</p>
  
  <p>Ready for the Context Hierarchy framework that separates elite developers from everyone else?</p>
  
  <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 0; text-align: center; font-weight: 600; color: #374151;">Most developers stop at Level 1 or 2.<br>Elite developers consistently operate at Level 4.</p>
  </div>
  
  <div style="margin: 20px 0;">
    <div style="padding: 10px; border-left: 3px solid #ef4444; background: #fef2f2; margin-bottom: 10px;">
      <strong>LEVEL 1: FUNCTIONAL</strong><br>
      "Create a login form"
    </div>
    
    <div style="padding: 10px; border-left: 3px solid #f59e0b; background: #fef3c7; margin-bottom: 10px;">
      <strong>LEVEL 2: TECHNICAL</strong><br>
      "Create a React login form with email/password validation"
    </div>
    
    <div style="padding: 10px; border-left: 3px solid #3b82f6; background: #eff6ff; margin-bottom: 10px;">
      <strong>LEVEL 3: ARCHITECTURAL</strong><br>
      "Create a React login form that integrates with our Redux auth slice, follows our design system, and handles our error boundary requirements"
    </div>
    
    <div style="padding: 15px; border-left: 3px solid #10b981; background: #ecfdf5;">
      <strong>LEVEL 4: STRATEGIC (ELITE LEVEL)</strong><br>
      Complete context including system integration, security requirements, edge cases, accessibility, and future considerations.
    </div>
  </div>
  
  <h3 style="color: #374151;">THE TRANSFORMATION</h3>
  <ul>
    <li>85% productivity increase (average)</li>
    <li>70% reduction in iteration cycles</li>
    <li>60% improvement in code quality scores</li>
    <li>90% reduction in integration issues</li>
  </ul>
  
  <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
    <h3 style="color: #374151; margin-top: 0;">🎁 YOUR DYNAMIC PLANNING TEMPLATE</h3>
    <p>Since you're making great progress, here's your second free template:</p>
    <a href="{{dynamic_planning_url}}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Download Dynamic Planning Template</a>
  </div>
  
  <p>Keep going - you're building momentum!</p>
  
  <p>Amy</p>
  
  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280;">
    <p><strong>P.S.</strong> Try the Level 4 context approach on your next AI interaction. The difference is immediate and dramatic.</p>
  </div>
</div>`,
            ctaButtons: [
              {
                text: 'Download Dynamic Planning Template',
                url: '{{dynamic_planning_url}}',
                style: 'primary',
                tracking: 'welcome_dynamic_planning'
              }
            ],
            personalizedFields: ['first_name', 'dynamic_planning_url']
          },
          timing: {
            delayFromPrevious: 24,
            optimalSendTime: '10:00',
            timeZoneHandling: 'recipient'
          },
          personalization: [
            { field: 'first_name', fallback: 'there' },
            { field: 'dynamic_planning_url', fallback: '/templates/dynamic-planning' }
          ],
          metrics: {
            openRate: 55.8,
            clickRate: 19.6,
            conversionRate: 7.3,
            unsubscribeRate: 1.0,
            replyRate: 3.2
          }
        }
        // Additional emails would continue the pattern...
      ],
      active: true,
      metrics: {
        totalSubscribers: 2847,
        completionRate: 73.2,
        averageOpenRate: 58.4,
        averageClickRate: 17.8,
        totalConversions: 547,
        conversionValue: 27350
      }
    },
    {
      id: 'conversion_sequence',
      name: 'Framework Introduction Sequence',
      description: 'Convert engaged subscribers to framework customers',
      type: 'conversion',
      trigger: {
        type: 'tag_added',
        condition: 'high_engagement',
        delay: 0
      },
      emails: [
        {
          id: 'conversion_01',
          subject: 'The Complete Framework (Finally Available)',
          preview: 'Everything you need to join the elite 3%...',
          content: {
            text: `Hi {{first_name}},

You've been following the Beyond the AI Plateau content, engaging with the templates, and asking great questions.

You're clearly serious about transforming your development approach.

That's why I want to let you know that the complete Five Elite Principles framework is now available.

WHAT YOU GET:

✅ Complete 9-chapter "Beyond the AI Plateau" ebook
✅ 100+ proven prompt templates (Context, Planning, Testing, Evolution, Review)
✅ 12-week implementation roadmap with weekly milestones
✅ Detailed case studies with metrics and timelines
✅ Lifetime updates and new template additions
✅ Priority email support

This isn't just another AI development course. It's the systematic framework that 3,000+ developers have used to break through their AI plateau.

THE RESULTS SPEAK FOR THEMSELVES:

"The strategic decomposition pillar alone saved our critical API project. We went from 6 weeks behind to 2 weeks early delivery." - Marcus, Lead Engineer

"Context architecture transformed my debugging. Complex issues that took 4 hours now resolve in 30 minutes." - Sarah, Senior Developer

"Quality integration eliminated our review bottlenecks. Team velocity increased 40% with better code quality." - Priya, Team Lead

SPECIAL LAUNCH PRICING:

For the next 48 hours, you can get the complete framework for just $497 (normally $697).

That's less than what most developers spend on a single conference ticket - but this will transform every day of your career.

[Get The Complete Framework - $497]

RISK-FREE GUARANTEE:

Try everything for 30 days. If you don't see dramatic improvements in your AI development approach, get a full refund.

The elite 3% don't hesitate when they see a systematic path forward.

Will you join them?

Amy

P.S. This launch pricing expires in 48 hours. After that, it goes to the regular $697 price. Don't miss this opportunity to transform your development career.`,
            html: `<div style="font-family: -apple-system, BlinkMacSystemFont, segoe ui, roboto, oxygen, ubuntu, cantarell, open sans, helvetica neue, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">The Complete Framework (Finally Available)</h1>
  
  <p>Hi {{first_name}},</p>
  
  <p>You've been following the Beyond the AI Plateau content, engaging with the templates, and asking great questions.</p>
  
  <p style="font-weight: 600; color: #374151;">You're clearly serious about transforming your development approach.</p>
  
  <div style="background: #ecfdf5; border: 1px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="color: #047857; margin-top: 0;">WHAT YOU GET:</h3>
    <ul style="margin-bottom: 0;">
      <li>✅ Complete 9-chapter "Beyond the AI Plateau" ebook</li>
      <li>✅ 100+ proven prompt templates</li>
      <li>✅ 12-week implementation roadmap</li>
      <li>✅ Detailed case studies with metrics</li>
      <li>✅ Lifetime updates and new templates</li>
      <li>✅ Priority email support</li>
    </ul>
  </div>
  
  <h3 style="color: #374151;">THE RESULTS SPEAK FOR THEMSELVES:</h3>
  
  <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #3b82f6;">
    <p style="margin: 0; font-style: italic;">"The strategic decomposition pillar alone saved our critical API project. We went from 6 weeks behind to 2 weeks early delivery."</p>
    <p style="margin: 5px 0 0 0; font-size: 14px; color: #6b7280;">— Marcus, Lead Engineer</p>
  </div>
  
  <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center;">
    <h3 style="color: #92400e; margin-top: 0;">⚡ SPECIAL LAUNCH PRICING</h3>
    <p style="font-size: 18px; margin: 10px 0;">Complete framework for just <strong style="color: #dc2626;">$497</strong></p>
    <p style="margin: 0; color: #6b7280; text-decoration: line-through;">Normally $697</p>
    <div style="margin: 20px 0;">
      <a href="{{purchase_url}}" style="display: inline-block; background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 18px;">Get The Complete Framework - $497</a>
    </div>
    <p style="font-size: 14px; color: #92400e; margin: 0;"><strong>⏰ This pricing expires in 48 hours</strong></p>
  </div>
  
  <div style="background: #eff6ff; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center;">
    <h4 style="color: #1e40af; margin-top: 0;">🛡️ RISK-FREE GUARANTEE</h4>
    <p style="margin: 0;">Try everything for 30 days. If you don't see dramatic improvements, get a full refund.</p>
  </div>
  
  <p style="text-align: center; font-weight: 600; color: #374151;">The elite 3% don't hesitate when they see a systematic path forward.</p>
  <p style="text-align: center; font-size: 18px; color: #dc2626;"><strong>Will you join them?</strong></p>
  
  <p>Amy</p>
  
  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280;">
    <p><strong>P.S.</strong> This launch pricing expires in 48 hours. After that, it goes to the regular $697 price. Don't miss this opportunity to transform your development career.</p>
  </div>
</div>`,
            ctaButtons: [
              {
                text: 'Get The Complete Framework - $497',
                url: '{{purchase_url}}',
                style: 'primary',
                tracking: 'conversion_framework_purchase'
              }
            ],
            personalizedFields: ['first_name', 'purchase_url']
          },
          timing: {
            delayFromPrevious: 0,
            optimalSendTime: '10:00',
            timeZoneHandling: 'recipient'
          },
          personalization: [
            { field: 'first_name', fallback: 'there' },
            { field: 'purchase_url', fallback: '/framework/foundation' }
          ],
          abTest: [
            {
              id: 'urgency_variant',
              name: 'High Urgency',
              percentage: 50,
              subject: '⚡ 48 Hours Left: Complete Framework Available',
              content: {
                text: 'Urgency-focused version...',
                html: 'Urgency-focused HTML...',
                ctaButtons: [
                  {
                    text: '⚡ Secure Your Spot Now - $497',
                    url: '{{purchase_url}}',
                    style: 'primary',
                    tracking: 'conversion_urgency_purchase'
                  }
                ],
                personalizedFields: ['first_name', 'purchase_url']
              }
            }
          ],
          metrics: {
            openRate: 72.4,
            clickRate: 28.9,
            conversionRate: 15.7,
            unsubscribeRate: 2.1
          }
        }
      ],
      active: true,
      metrics: {
        totalSubscribers: 847,
        completionRate: 89.3,
        averageOpenRate: 69.8,
        averageClickRate: 31.2,
        totalConversions: 133,
        conversionValue: 66101
      }
    }
  ];

  private readonly automationWorkflows: AutomationWorkflow[] = [
    {
      id: 'engagement_scoring',
      name: 'Engagement-Based Tagging',
      description: 'Automatically tag subscribers based on email engagement and website behavior',
      trigger: {
        type: 'email_opened',
        criteria: { emails_opened: 3, timeframe: '7_days' }
      },
      actions: [
        {
          type: 'add_tag',
          config: { tag: 'high_engagement' },
          delay: 0
        },
        {
          type: 'update_field',
          config: { field: 'engagement_score', value: '+10' },
          delay: 0
        }
      ],
      conditions: [
        {
          field: 'subscriber_age_days',
          operator: 'greater_than',
          value: 3
        }
      ],
      active: true,
      stats: {
        totalTriggered: 1247,
        completionRate: 96.8,
        conversionRate: 23.4
      }
    },
    {
      id: 'lead_nurture_progression',
      name: 'Progressive Lead Nurturing',
      description: 'Move subscribers through nurture sequences based on behavior',
      trigger: {
        type: 'link_clicked',
        criteria: { url_contains: 'templates' }
      },
      actions: [
        {
          type: 'add_tag',
          config: { tag: 'template_interested' },
          delay: 0
        },
        {
          type: 'send_email',
          config: { template: 'template_collection_email' },
          delay: 24
        }
      ],
      conditions: [
        {
          field: 'tags',
          operator: 'not_contains',
          value: 'customer'
        }
      ],
      active: true,
      stats: {
        totalTriggered: 892,
        completionRate: 84.2,
        conversionRate: 18.7
      }
    }
  ];

  getEmailSequences(): EmailSequence[] {
    return this.emailSequences;
  }

  getSequenceById(id: string): EmailSequence | undefined {
    return this.emailSequences.find(seq => seq.id === id);
  }

  getSequencesByType(type: SequenceType): EmailSequence[] {
    return this.emailSequences.filter(seq => seq.type === type);
  }

  getActiveSequences(): EmailSequence[] {
    return this.emailSequences.filter(seq => seq.active);
  }

  getAutomationWorkflows(): AutomationWorkflow[] {
    return this.automationWorkflows;
  }

  getWorkflowById(id: string): AutomationWorkflow | undefined {
    return this.automationWorkflows.find(wf => wf.id === id);
  }

  getEmailMetricsSummary(): {
    totalSequences: number;
    totalSubscribers: number;
    averageOpenRate: number;
    averageClickRate: number;
    totalRevenue: number;
  } {
    const totalSubscribers = this.emailSequences.reduce((sum, seq) => 
      sum + seq.metrics.totalSubscribers, 0
    );
    
    const totalRevenue = this.emailSequences.reduce((sum, seq) => 
      sum + seq.metrics.conversionValue, 0
    );
    
    const avgOpenRate = this.emailSequences.reduce((sum, seq) => 
      sum + seq.metrics.averageOpenRate, 0
    ) / this.emailSequences.length;
    
    const avgClickRate = this.emailSequences.reduce((sum, seq) => 
      sum + seq.metrics.averageClickRate, 0
    ) / this.emailSequences.length;
    
    return {
      totalSequences: this.emailSequences.length,
      totalSubscribers,
      averageOpenRate: Math.round(avgOpenRate * 10) / 10,
      averageClickRate: Math.round(avgClickRate * 10) / 10,
      totalRevenue
    };
  }

  getEmailTemplateLibrary(): Array<{
    category: string;
    templates: Array<{
      name: string;
      purpose: string;
      expectedOpenRate: number;
      expectedClickRate: number;
    }>;
  }> {
    return [
      {
        category: 'Welcome & Onboarding',
        templates: [
          {
            name: 'Welcome + Free Template',
            purpose: 'First impression and immediate value delivery',
            expectedOpenRate: 67.3,
            expectedClickRate: 23.8
          },
          {
            name: 'Framework Introduction',
            purpose: 'Establish methodology and build anticipation',
            expectedOpenRate: 59.2,
            expectedClickRate: 15.4
          }
        ]
      },
      {
        category: 'Education & Value',
        templates: [
          {
            name: 'Principle Deep Dive',
            purpose: 'Detailed explanation with practical examples',
            expectedOpenRate: 55.8,
            expectedClickRate: 19.6
          },
          {
            name: 'Case Study Spotlight',
            purpose: 'Social proof and transformation examples',
            expectedOpenRate: 62.1,
            expectedClickRate: 21.3
          }
        ]
      },
      {
        category: 'Conversion & Sales',
        templates: [
          {
            name: 'Framework Launch',
            purpose: 'Primary conversion email with urgency',
            expectedOpenRate: 72.4,
            expectedClickRate: 28.9
          },
          {
            name: 'Last Chance',
            purpose: 'Final urgency email before price increase',
            expectedOpenRate: 68.9,
            expectedClickRate: 35.2
          }
        ]
      }
    ];
  }

  getPersonalizationStrategy(): {
    segments: Array<{
      name: string;
      criteria: string;
      emailVariations: string[];
    }>;
    dynamicContent: Array<{
      element: string;
      variations: string[];
      trigger: string;
    }>;
  } {
    return {
      segments: [
        {
          name: 'Junior Developers',
          criteria: 'experience_level: junior OR years_experience < 3',
          emailVariations: [
            'Focus on learning and skill development',
            'Emphasize mentorship and guidance',
            'Include more educational context'
          ]
        },
        {
          name: 'Senior Developers',
          criteria: 'experience_level: senior OR years_experience >= 5',
          emailVariations: [
            'Focus on efficiency and team leadership',
            'Emphasize advanced techniques and optimization',
            'Include architecture and scalability considerations'
          ]
        },
        {
          name: 'High Engagement',
          criteria: 'email_opens >= 5 AND link_clicks >= 3',
          emailVariations: [
            'Earlier access to conversion sequences',
            'Exclusive content and templates',
            'Personal consultation offers'
          ]
        }
      ],
      dynamicContent: [
        {
          element: 'CTA Button Text',
          variations: ['Get Instant Access', 'Start Your Transformation', 'Join the Elite 3%'],
          trigger: 'A/B test performance'
        },
        {
          element: 'Social Proof',
          variations: ['Company logos', 'Testimonial quotes', 'Metric callouts'],
          trigger: 'Subscriber segment'
        },
        {
          element: 'Urgency Elements',
          variations: ['Time-based countdown', 'Limited spots', 'Price increase'],
          trigger: 'Conversion sequence stage'
        }
      ]
    };
  }
}