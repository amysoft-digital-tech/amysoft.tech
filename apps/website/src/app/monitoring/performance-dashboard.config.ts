import { Injectable } from '@angular/core';
import { PerformanceService } from '@amysoft/shared-data-access';

export interface DashboardPanel {
  id: string;
  title: string;
  type: 'metric' | 'chart' | 'table' | 'heatmap' | 'funnel';
  dataSource: string;
  refreshInterval: number; // seconds
  config: any;
}

export interface MetricThreshold {
  metric: string;
  warning: number;
  critical: number;
  unit: string;
  comparison: 'greater' | 'less';
}

export interface PerformanceDashboard {
  id: string;
  name: string;
  description: string;
  panels: DashboardPanel[];
  alerts: AlertConfiguration[];
  refreshInterval: number;
}

export interface AlertConfiguration {
  id: string;
  name: string;
  metric: string;
  threshold: number;
  duration: number; // seconds
  severity: 'low' | 'medium' | 'high' | 'critical';
  channels: AlertChannel[];
}

export interface AlertChannel {
  type: 'email' | 'slack' | 'webhook' | 'pagerduty';
  config: any;
}

@Injectable({
  providedIn: 'root'
})
export class PerformanceDashboardConfig {
  
  private readonly metricThresholds: MetricThreshold[] = [
    {
      metric: 'page_load_time',
      warning: 1500,
      critical: 2000,
      unit: 'ms',
      comparison: 'greater'
    },
    {
      metric: 'lcp',
      warning: 2000,
      critical: 2500,
      unit: 'ms',
      comparison: 'greater'
    },
    {
      metric: 'fid',
      warning: 75,
      critical: 100,
      unit: 'ms',
      comparison: 'greater'
    },
    {
      metric: 'cls',
      warning: 0.1,
      critical: 0.25,
      unit: 'score',
      comparison: 'greater'
    },
    {
      metric: 'lighthouse_score',
      warning: 85,
      critical: 80,
      unit: 'score',
      comparison: 'less'
    },
    {
      metric: 'api_response_time',
      warning: 500,
      critical: 1000,
      unit: 'ms',
      comparison: 'greater'
    },
    {
      metric: 'error_rate',
      warning: 2,
      critical: 5,
      unit: '%',
      comparison: 'greater'
    },
    {
      metric: 'conversion_rate',
      warning: 3,
      critical: 2,
      unit: '%',
      comparison: 'less'
    }
  ];

  constructor(private performanceService: PerformanceService) {}

  /**
   * Get main performance dashboard configuration
   */
  getMainDashboard(): PerformanceDashboard {
    return {
      id: 'main-performance',
      name: 'Main Performance Dashboard',
      description: 'Real-time performance metrics and monitoring',
      refreshInterval: 30,
      panels: [
        {
          id: 'current-metrics',
          title: 'Current Performance Metrics',
          type: 'metric',
          dataSource: 'realtime',
          refreshInterval: 10,
          config: {
            metrics: [
              { key: 'page_load_time', label: 'Page Load', format: 'duration' },
              { key: 'active_users', label: 'Active Users', format: 'number' },
              { key: 'error_rate', label: 'Error Rate', format: 'percentage' },
              { key: 'api_latency', label: 'API Latency', format: 'duration' }
            ]
          }
        },
        {
          id: 'core-web-vitals',
          title: 'Core Web Vitals',
          type: 'chart',
          dataSource: 'vitals',
          refreshInterval: 60,
          config: {
            chartType: 'gauge',
            metrics: ['lcp', 'fid', 'cls'],
            thresholds: {
              lcp: { good: 2500, poor: 4000 },
              fid: { good: 100, poor: 300 },
              cls: { good: 0.1, poor: 0.25 }
            }
          }
        },
        {
          id: 'performance-timeline',
          title: '24-Hour Performance Timeline',
          type: 'chart',
          dataSource: 'historical',
          refreshInterval: 300,
          config: {
            chartType: 'line',
            timeRange: '24h',
            metrics: ['page_load_time', 'api_response_time'],
            aggregation: '5m'
          }
        },
        {
          id: 'lighthouse-scores',
          title: 'Lighthouse Scores by Page',
          type: 'table',
          dataSource: 'lighthouse',
          refreshInterval: 3600,
          config: {
            columns: [
              { key: 'page', label: 'Page' },
              { key: 'performance', label: 'Performance', format: 'score' },
              { key: 'accessibility', label: 'Accessibility', format: 'score' },
              { key: 'seo', label: 'SEO', format: 'score' },
              { key: 'best_practices', label: 'Best Practices', format: 'score' }
            ]
          }
        },
        {
          id: 'user-flow-performance',
          title: 'User Flow Performance',
          type: 'funnel',
          dataSource: 'analytics',
          refreshInterval: 600,
          config: {
            steps: [
              { name: 'Homepage', metric: 'page_load_time' },
              { name: 'Pricing', metric: 'page_load_time' },
              { name: 'Signup', metric: 'form_submission_time' },
              { name: 'Purchase', metric: 'transaction_time' }
            ]
          }
        },
        {
          id: 'geographic-performance',
          title: 'Performance by Region',
          type: 'heatmap',
          dataSource: 'geographic',
          refreshInterval: 1800,
          config: {
            metric: 'page_load_time',
            regions: ['north-america', 'europe', 'asia-pacific', 'south-america']
          }
        }
      ],
      alerts: [
        {
          id: 'high-load-time',
          name: 'High Page Load Time',
          metric: 'page_load_time',
          threshold: 2000,
          duration: 300,
          severity: 'high',
          channels: [
            {
              type: 'email',
              config: { recipients: ['alerts@amysoft.tech'] }
            },
            {
              type: 'slack',
              config: { webhook: process.env['SLACK_WEBHOOK_URL'], channel: '#alerts' }
            }
          ]
        },
        {
          id: 'poor-core-vitals',
          name: 'Poor Core Web Vitals',
          metric: 'lcp',
          threshold: 2500,
          duration: 600,
          severity: 'medium',
          channels: [
            {
              type: 'email',
              config: { recipients: ['performance@amysoft.tech'] }
            }
          ]
        },
        {
          id: 'high-error-rate',
          name: 'High Error Rate',
          metric: 'error_rate',
          threshold: 5,
          duration: 180,
          severity: 'critical',
          channels: [
            {
              type: 'pagerduty',
              config: { serviceKey: process.env['PAGERDUTY_KEY'] }
            }
          ]
        },
        {
          id: 'low-conversion',
          name: 'Low Conversion Rate',
          metric: 'conversion_rate',
          threshold: 2,
          duration: 3600,
          severity: 'medium',
          channels: [
            {
              type: 'email',
              config: { recipients: ['product@amysoft.tech'] }
            }
          ]
        }
      ]
    };
  }

  /**
   * Get business metrics dashboard
   */
  getBusinessDashboard(): PerformanceDashboard {
    return {
      id: 'business-metrics',
      name: 'Business Performance Dashboard',
      description: 'Revenue, conversion, and user engagement metrics',
      refreshInterval: 300,
      panels: [
        {
          id: 'revenue-metrics',
          title: 'Revenue Metrics',
          type: 'metric',
          dataSource: 'stripe',
          refreshInterval: 300,
          config: {
            metrics: [
              { key: 'daily_revenue', label: 'Today\'s Revenue', format: 'currency' },
              { key: 'monthly_revenue', label: 'Monthly Revenue', format: 'currency' },
              { key: 'arpu', label: 'ARPU', format: 'currency' },
              { key: 'mrr', label: 'MRR', format: 'currency' }
            ]
          }
        },
        {
          id: 'conversion-funnel',
          title: 'Conversion Funnel',
          type: 'funnel',
          dataSource: 'analytics',
          refreshInterval: 600,
          config: {
            steps: [
              { name: 'Visitors', count: 'unique_visitors' },
              { name: 'Leads', count: 'email_signups' },
              { name: 'Trial', count: 'trial_starts' },
              { name: 'Paid', count: 'paid_conversions' }
            ]
          }
        },
        {
          id: 'subscription-breakdown',
          title: 'Subscription Tier Breakdown',
          type: 'chart',
          dataSource: 'database',
          refreshInterval: 3600,
          config: {
            chartType: 'pie',
            data: 'subscription_tiers',
            labels: ['Foundation', 'Advanced', 'Elite']
          }
        },
        {
          id: 'user-engagement',
          title: 'User Engagement Metrics',
          type: 'chart',
          dataSource: 'analytics',
          refreshInterval: 1800,
          config: {
            chartType: 'bar',
            metrics: [
              'daily_active_users',
              'weekly_active_users',
              'monthly_active_users'
            ]
          }
        }
      ],
      alerts: [
        {
          id: 'revenue-drop',
          name: 'Revenue Drop Alert',
          metric: 'daily_revenue',
          threshold: 1000, // $1000 daily minimum
          duration: 86400,
          severity: 'high',
          channels: [
            {
              type: 'email',
              config: { recipients: ['revenue@amysoft.tech', 'ceo@amysoft.tech'] }
            }
          ]
        },
        {
          id: 'churn-spike',
          name: 'High Churn Rate',
          metric: 'churn_rate',
          threshold: 10, // 10% monthly churn
          duration: 86400,
          severity: 'critical',
          channels: [
            {
              type: 'slack',
              config: { webhook: process.env['SLACK_WEBHOOK_URL'], channel: '#revenue-alerts' }
            }
          ]
        }
      ]
    };
  }

  /**
   * Get custom dashboard configuration
   */
  createCustomDashboard(config: {
    name: string;
    panels: string[];
    metrics: string[];
  }): PerformanceDashboard {
    const availablePanels = this.getAvailablePanels();
    const selectedPanels = config.panels
      .map(panelId => availablePanels.find(p => p.id === panelId))
      .filter(Boolean) as DashboardPanel[];

    return {
      id: `custom-${Date.now()}`,
      name: config.name,
      description: 'Custom performance dashboard',
      refreshInterval: 60,
      panels: selectedPanels,
      alerts: []
    };
  }

  /**
   * Get available panel templates
   */
  getAvailablePanels(): DashboardPanel[] {
    return [
      // Performance panels
      {
        id: 'realtime-performance',
        title: 'Real-time Performance',
        type: 'metric',
        dataSource: 'realtime',
        refreshInterval: 5,
        config: {}
      },
      {
        id: 'performance-history',
        title: 'Performance History',
        type: 'chart',
        dataSource: 'historical',
        refreshInterval: 300,
        config: {}
      },
      // User panels
      {
        id: 'active-users',
        title: 'Active Users',
        type: 'metric',
        dataSource: 'realtime',
        refreshInterval: 30,
        config: {}
      },
      {
        id: 'user-geography',
        title: 'Users by Geography',
        type: 'heatmap',
        dataSource: 'analytics',
        refreshInterval: 3600,
        config: {}
      },
      // Business panels
      {
        id: 'revenue-tracker',
        title: 'Revenue Tracker',
        type: 'chart',
        dataSource: 'stripe',
        refreshInterval: 300,
        config: {}
      },
      {
        id: 'conversion-rates',
        title: 'Conversion Rates',
        type: 'table',
        dataSource: 'analytics',
        refreshInterval: 600,
        config: {}
      }
    ];
  }

  /**
   * Get metric thresholds
   */
  getMetricThresholds(): MetricThreshold[] {
    return this.metricThresholds;
  }

  /**
   * Check if metric is within acceptable range
   */
  isMetricHealthy(metric: string, value: number): 'good' | 'warning' | 'critical' {
    const threshold = this.metricThresholds.find(t => t.metric === metric);
    if (!threshold) return 'good';

    const { warning, critical, comparison } = threshold;

    if (comparison === 'greater') {
      if (value > critical) return 'critical';
      if (value > warning) return 'warning';
    } else {
      if (value < critical) return 'critical';
      if (value < warning) return 'warning';
    }

    return 'good';
  }

  /**
   * Export dashboard configuration
   */
  exportDashboard(dashboard: PerformanceDashboard): string {
    return JSON.stringify(dashboard, null, 2);
  }

  /**
   * Import dashboard configuration
   */
  importDashboard(json: string): PerformanceDashboard {
    try {
      const dashboard = JSON.parse(json);
      // Validate dashboard structure
      if (!dashboard.id || !dashboard.name || !dashboard.panels) {
        throw new Error('Invalid dashboard configuration');
      }
      return dashboard;
    } catch (error) {
      throw new Error('Failed to import dashboard: ' + error.message);
    }
  }
}