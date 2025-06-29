import { Injectable } from '@angular/core';
import { AnalyticsService } from '@amysoft/shared-data-access';

export interface GA4Configuration {
  measurementId: string;
  trackingConfig: GA4TrackingConfig;
  conversionGoals: ConversionGoal[];
  customDimensions: CustomDimension[];
  customMetrics: CustomMetric[];
  audiences: AudienceDefinition[];
}

export interface GA4TrackingConfig {
  enhanced_measurement: boolean;
  page_title: boolean;
  scroll_tracking: boolean;
  outbound_links: boolean;
  site_search: boolean;
  video_engagement: boolean;
  file_downloads: boolean;
  custom_parameters: Record<string, any>;
}

export interface ConversionGoal {
  id: string;
  name: string;
  description: string;
  eventName: string;
  conditions: GoalCondition[];
  value: GoalValue;
  attribution: AttributionModel;
  category: 'macro' | 'micro' | 'engagement';
  priority: 'high' | 'medium' | 'low';
}

export interface GoalCondition {
  parameter: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'begins_with';
  value: string | number;
}

export interface GoalValue {
  currency: string;
  defaultValue?: number;
  dynamicValue?: string; // parameter name for dynamic value
}

export interface AttributionModel {
  type: 'last_click' | 'first_click' | 'linear' | 'time_decay' | 'position_based';
  lookbackWindow: number; // days
}

export interface CustomDimension {
  id: string;
  name: string;
  scope: 'event' | 'user' | 'session';
  description: string;
  parameter: string;
}

export interface CustomMetric {
  id: string;
  name: string;
  description: string;
  unit: 'standard' | 'currency' | 'feet' | 'meters' | 'kilometers' | 'miles' | 'milliseconds' | 'seconds' | 'minutes' | 'hours';
  parameter: string;
}

export interface AudienceDefinition {
  id: string;
  name: string;
  description: string;
  conditions: AudienceCondition[];
  membershipDuration: number; // days
  purpose: 'remarketing' | 'conversion_optimization' | 'analysis';
}

export interface AudienceCondition {
  type: 'event' | 'dimension' | 'metric';
  parameter: string;
  operator: string;
  value: any;
  timeframe?: string;
}

export interface ConversionFunnel {
  id: string;
  name: string;
  description: string;
  steps: FunnelStep[];
  timeWindow: number; // hours
}

export interface FunnelStep {
  id: string;
  name: string;
  eventName: string;
  conditions?: GoalCondition[];
  required: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleAnalyticsConfigService {
  
  private readonly ga4Config: GA4Configuration = {
    measurementId: 'G-XXXXXXXXXX', // Replace with actual measurement ID
    trackingConfig: {
      enhanced_measurement: true,
      page_title: true,
      scroll_tracking: true,
      outbound_links: true,
      site_search: true,
      video_engagement: true,
      file_downloads: true,
      custom_parameters: {
        content_group1: 'AI Development',
        content_group2: 'Marketing Website',
        custom_map: {
          'user_tier': 'user_tier',
          'experience_level': 'experience_level',
          'signup_source': 'signup_source'
        }
      }
    },
    conversionGoals: [
      {
        id: 'lead_capture',
        name: 'Lead Capture - Email Signup',
        description: 'User provides email address for newsletter or templates',
        eventName: 'lead_capture',
        conditions: [
          {
            parameter: 'method',
            operator: 'equals',
            value: 'email_signup'
          }
        ],
        value: {
          currency: 'USD',
          defaultValue: 5.00
        },
        attribution: {
          type: 'last_click',
          lookbackWindow: 30
        },
        category: 'micro',
        priority: 'high'
      },
      {
        id: 'framework_purchase',
        name: 'Framework Purchase - Foundation Tier',
        description: 'Customer purchases the Foundation framework tier',
        eventName: 'purchase',
        conditions: [
          {
            parameter: 'tier',
            operator: 'equals',
            value: 'foundation'
          }
        ],
        value: {
          currency: 'USD',
          dynamicValue: 'value'
        },
        attribution: {
          type: 'first_click',
          lookbackWindow: 90
        },
        category: 'macro',
        priority: 'high'
      },
      {
        id: 'template_download',
        name: 'Template Download',
        description: 'User downloads free templates or resources',
        eventName: 'file_download',
        conditions: [
          {
            parameter: 'file_type',
            operator: 'equals',
            value: 'template'
          }
        ],
        value: {
          currency: 'USD',
          defaultValue: 2.00
        },
        attribution: {
          type: 'last_click',
          lookbackWindow: 7
        },
        category: 'micro',
        priority: 'medium'
      },
      {
        id: 'blog_engagement',
        name: 'High Blog Engagement',
        description: 'User spends significant time reading blog content',
        eventName: 'scroll',
        conditions: [
          {
            parameter: 'percent_scrolled',
            operator: 'greater_than',
            value: 75
          }
        ],
        value: {
          currency: 'USD',
          defaultValue: 1.00
        },
        attribution: {
          type: 'last_click',
          lookbackWindow: 1
        },
        category: 'engagement',
        priority: 'low'
      },
      {
        id: 'pricing_page_view',
        name: 'Pricing Page Interest',
        description: 'User views pricing page indicating purchase consideration',
        eventName: 'page_view',
        conditions: [
          {
            parameter: 'page_location',
            operator: 'contains',
            value: '/pricing'
          }
        ],
        value: {
          currency: 'USD',
          defaultValue: 3.00
        },
        attribution: {
          type: 'last_click',
          lookbackWindow: 7
        },
        category: 'micro',
        priority: 'medium'
      },
      {
        id: 'video_completion',
        name: 'Video Content Completion',
        description: 'User completes watching framework overview video',
        eventName: 'video_complete',
        conditions: [
          {
            parameter: 'video_title',
            operator: 'contains',
            value: 'framework'
          }
        ],
        value: {
          currency: 'USD',
          defaultValue: 4.00
        },
        attribution: {
          type: 'last_click',
          lookbackWindow: 7
        },
        category: 'engagement',
        priority: 'medium'
      }
    ],
    customDimensions: [
      {
        id: 'user_tier',
        name: 'User Tier',
        scope: 'user',
        description: 'The subscription tier of the user (freemium, foundation, advanced, elite)',
        parameter: 'user_tier'
      },
      {
        id: 'experience_level',
        name: 'Developer Experience Level',
        scope: 'user',
        description: 'Self-reported experience level (junior, mid, senior, principal)',
        parameter: 'experience_level'
      },
      {
        id: 'signup_source',
        name: 'Signup Source',
        scope: 'session',
        description: 'Source that led to email signup (blog, template, pricing, etc)',
        parameter: 'signup_source'
      },
      {
        id: 'ab_test_variant',
        name: 'A/B Test Variant',
        scope: 'session',
        description: 'Active A/B test variant for the session',
        parameter: 'ab_test_variant'
      },
      {
        id: 'content_category',
        name: 'Content Category',
        scope: 'event',
        description: 'Category of content being viewed or interacted with',
        parameter: 'content_category'
      },
      {
        id: 'feature_interest',
        name: 'Feature Interest',
        scope: 'event',
        description: 'Specific feature or principle user is interested in',
        parameter: 'feature_interest'
      }
    ],
    customMetrics: [
      {
        id: 'read_progress',
        name: 'Reading Progress Percentage',
        description: 'Percentage of article or content read',
        unit: 'standard',
        parameter: 'read_progress'
      },
      {
        id: 'session_value',
        name: 'Session Value Score',
        description: 'Calculated value score for the session based on actions',
        unit: 'currency',
        parameter: 'session_value'
      },
      {
        id: 'engagement_time',
        name: 'Active Engagement Time',
        description: 'Time user was actively engaged with content',
        unit: 'seconds',
        parameter: 'engagement_time'
      }
    ],
    audiences: [
      {
        id: 'high_intent_leads',
        name: 'High Intent Leads',
        description: 'Users who have shown strong purchase intent signals',
        conditions: [
          {
            type: 'event',
            parameter: 'event_name',
            operator: 'equals',
            value: 'pricing_page_view',
            timeframe: '7_days'
          },
          {
            type: 'event',
            parameter: 'event_name',
            operator: 'equals',
            value: 'template_download',
            timeframe: '7_days'
          }
        ],
        membershipDuration: 30,
        purpose: 'conversion_optimization'
      },
      {
        id: 'blog_engaged_readers',
        name: 'Engaged Blog Readers',
        description: 'Users who regularly consume blog content',
        conditions: [
          {
            type: 'metric',
            parameter: 'read_progress',
            operator: 'greater_than',
            value: 50,
            timeframe: '30_days'
          },
          {
            type: 'event',
            parameter: 'page_view',
            operator: 'greater_than',
            value: 3,
            timeframe: '30_days'
          }
        ],
        membershipDuration: 90,
        purpose: 'remarketing'
      },
      {
        id: 'framework_customers',
        name: 'Framework Customers',
        description: 'Users who have purchased any framework tier',
        conditions: [
          {
            type: 'event',
            parameter: 'event_name',
            operator: 'equals',
            value: 'purchase'
          }
        ],
        membershipDuration: 365,
        purpose: 'analysis'
      }
    ]
  };

  private readonly conversionFunnels: ConversionFunnel[] = [
    {
      id: 'lead_to_customer',
      name: 'Lead to Customer Conversion',
      description: 'Complete journey from first visit to framework purchase',
      timeWindow: 2160, // 90 days
      steps: [
        {
          id: 'first_visit',
          name: 'First Website Visit',
          eventName: 'page_view',
          required: true
        },
        {
          id: 'content_engagement',
          name: 'Content Engagement',
          eventName: 'scroll',
          conditions: [
            {
              parameter: 'percent_scrolled',
              operator: 'greater_than',
              value: 50
            }
          ],
          required: false
        },
        {
          id: 'email_signup',
          name: 'Email Signup',
          eventName: 'lead_capture',
          required: true
        },
        {
          id: 'template_download',
          name: 'Template Download',
          eventName: 'file_download',
          conditions: [
            {
              parameter: 'file_type',
              operator: 'equals',
              value: 'template'
            }
          ],
          required: false
        },
        {
          id: 'pricing_consideration',
          name: 'Pricing Page View',
          eventName: 'page_view',
          conditions: [
            {
              parameter: 'page_location',
              operator: 'contains',
              value: '/pricing'
            }
          ],
          required: false
        },
        {
          id: 'framework_purchase',
          name: 'Framework Purchase',
          eventName: 'purchase',
          required: true
        }
      ]
    },
    {
      id: 'blog_to_lead',
      name: 'Blog to Lead Conversion',
      description: 'Journey from blog discovery to email signup',
      timeWindow: 168, // 7 days
      steps: [
        {
          id: 'blog_visit',
          name: 'Blog Post Visit',
          eventName: 'page_view',
          conditions: [
            {
              parameter: 'page_location',
              operator: 'contains',
              value: '/blog/'
            }
          ],
          required: true
        },
        {
          id: 'blog_reading',
          name: 'Blog Content Reading',
          eventName: 'scroll',
          conditions: [
            {
              parameter: 'percent_scrolled',
              operator: 'greater_than',
              value: 75
            }
          ],
          required: false
        },
        {
          id: 'related_content',
          name: 'Related Content View',
          eventName: 'page_view',
          required: false
        },
        {
          id: 'lead_signup',
          name: 'Newsletter Signup',
          eventName: 'lead_capture',
          required: true
        }
      ]
    }
  ];

  constructor(private analyticsService: AnalyticsService) {}

  getGA4Configuration(): GA4Configuration {
    return this.ga4Config;
  }

  initializeGA4(): void {
    // Initialize GA4 with configuration
    if (typeof gtag !== 'undefined') {
      gtag('config', this.ga4Config.measurementId, {
        ...this.ga4Config.trackingConfig,
        page_title: true,
        page_location: window.location.href,
        page_referrer: document.referrer
      });
    }
  }

  trackConversionGoal(goalId: string, parameters: Record<string, any> = {}): void {
    const goal = this.ga4Config.conversionGoals.find(g => g.id === goalId);
    if (!goal) return;

    // Validate conditions
    const conditionsMet = goal.conditions.every(condition => {
      const value = parameters[condition.parameter];
      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'greater_than':
          return value > condition.value;
        case 'less_than':
          return value < condition.value;
        case 'contains':
          return value && value.toString().includes(condition.value);
        case 'begins_with':
          return value && value.toString().startsWith(condition.value);
        default:
          return false;
      }
    });

    if (conditionsMet) {
      const eventData: Record<string, any> = {
        ...parameters,
        conversion_goal: goalId,
        goal_category: goal.category,
        goal_priority: goal.priority
      };

      if (goal.value.defaultValue) {
        eventData.value = goal.value.defaultValue;
        eventData.currency = goal.value.currency;
      } else if (goal.value.dynamicValue && parameters[goal.value.dynamicValue]) {
        eventData.value = parameters[goal.value.dynamicValue];
        eventData.currency = goal.value.currency;
      }

      // Track in GA4
      if (typeof gtag !== 'undefined') {
        gtag('event', goal.eventName, eventData);
      }

      // Also track in our analytics service
      this.analyticsService.trackEvent('conversion_goal', {
        goal_id: goalId,
        goal_name: goal.name,
        ...eventData
      });
    }
  }

  trackCustomEvent(eventName: string, parameters: Record<string, any> = {}): void {
    // Add custom dimensions to event
    const enrichedParameters = {
      ...parameters,
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent,
      screen_resolution: `${screen.width}x${screen.height}`,
      viewport_size: `${window.innerWidth}x${window.innerHeight}`
    };

    // Track in GA4
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, enrichedParameters);
    }

    // Track in our analytics service
    this.analyticsService.trackEvent(eventName, enrichedParameters);
  }

  setUserProperties(properties: Record<string, any>): void {
    // Set user properties in GA4
    if (typeof gtag !== 'undefined') {
      gtag('config', this.ga4Config.measurementId, {
        user_properties: properties
      });
    }

    // Update user properties in our analytics service
    this.analyticsService.updateUserProperties(properties);
  }

  trackPageView(pagePath: string, pageTitle?: string): void {
    const pageData = {
      page_location: window.location.href,
      page_path: pagePath,
      page_title: pageTitle || document.title,
      page_referrer: document.referrer
    };

    if (typeof gtag !== 'undefined') {
      gtag('event', 'page_view', pageData);
    }

    this.analyticsService.trackEvent('page_view', pageData);
  }

  trackFormSubmission(formName: string, formData: Record<string, any>): void {
    this.trackCustomEvent('form_submit', {
      form_name: formName,
      form_data: formData,
      form_location: window.location.pathname
    });
  }

  trackDownload(fileName: string, fileType: string, downloadSource: string): void {
    this.trackCustomEvent('file_download', {
      file_name: fileName,
      file_type: fileType,
      download_source: downloadSource,
      page_location: window.location.pathname
    });
  }

  trackVideoEngagement(videoTitle: string, action: 'start' | 'pause' | 'complete', progress?: number): void {
    this.trackCustomEvent(`video_${action}`, {
      video_title: videoTitle,
      video_progress: progress,
      page_location: window.location.pathname
    });
  }

  trackSearchQuery(query: string, resultsCount: number): void {
    this.trackCustomEvent('search', {
      search_term: query,
      search_results: resultsCount,
      page_location: window.location.pathname
    });
  }

  getConversionFunnels(): ConversionFunnel[] {
    return this.conversionFunnels;
  }

  getFunnelById(funnelId: string): ConversionFunnel | undefined {
    return this.conversionFunnels.find(f => f.id === funnelId);
  }

  trackFunnelStep(funnelId: string, stepId: string, parameters: Record<string, any> = {}): void {
    const funnel = this.getFunnelById(funnelId);
    const step = funnel?.steps.find(s => s.id === stepId);
    
    if (funnel && step) {
      this.trackCustomEvent('funnel_step', {
        funnel_id: funnelId,
        funnel_name: funnel.name,
        step_id: stepId,
        step_name: step.name,
        step_event: step.eventName,
        ...parameters
      });
    }
  }

  getRecommendedDashboards(): Array<{
    name: string;
    description: string;
    widgets: Array<{
      type: string;
      metric: string;
      dimensions: string[];
    }>;
  }> {
    return [
      {
        name: 'Conversion Overview',
        description: 'High-level view of all conversion goals and their performance',
        widgets: [
          {
            type: 'scorecard',
            metric: 'conversions',
            dimensions: ['conversion_goal']
          },
          {
            type: 'line_chart',
            metric: 'conversion_rate',
            dimensions: ['date', 'conversion_goal']
          },
          {
            type: 'bar_chart',
            metric: 'conversion_value',
            dimensions: ['conversion_goal']
          }
        ]
      },
      {
        name: 'Content Performance',
        description: 'Blog and content engagement metrics',
        widgets: [
          {
            type: 'table',
            metric: 'page_views',
            dimensions: ['page_path', 'page_title']
          },
          {
            type: 'heatmap',
            metric: 'scroll_depth',
            dimensions: ['page_path']
          },
          {
            type: 'funnel',
            metric: 'sessions',
            dimensions: ['blog_to_lead_funnel']
          }
        ]
      },
      {
        name: 'User Journey Analysis',
        description: 'Complete user journey from acquisition to conversion',
        widgets: [
          {
            type: 'sankey',
            metric: 'users',
            dimensions: ['first_source', 'conversion_path']
          },
          {
            type: 'cohort',
            metric: 'retention_rate',
            dimensions: ['user_cohort', 'weeks_since_first_visit']
          }
        ]
      }
    ];
  }
}

// Global gtag interface for TypeScript
declare global {
  function gtag(...args: any[]): void;
}