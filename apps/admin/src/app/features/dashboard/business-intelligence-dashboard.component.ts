import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { Subscription, interval } from 'rxjs';

Chart.register(...registerables);

export interface BusinessOverview {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  totalCustomers: number;
  activeSubscriptions: number;
  churnRate: number;
  customerLifetimeValue: number;
  growthRate: number;
  conversionRate: number;
  marketingROI: number;
  supportTicketVolume: number;
  contentEngagement: number;
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
}

export interface RevenueMetrics {
  averageRevenuePerUser: number;
  customerAcquisitionCost: number;
  lifetimeValueToCAC: number;
  paybackPeriod: number;
  monthsToBreakeven: number;
  revenueGrowthRate: number;
  netRevenueRetention: number;
  grossRevenueRetention: number;
}

export interface BusinessAlert {
  id: string;
  type: 'revenue' | 'customer' | 'system' | 'opportunity' | 'threat';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  value: number;
  threshold: number;
  trend: 'improving' | 'stable' | 'declining';
  actionItems: string[];
  createdAt: Date;
  acknowledgedAt?: Date;
}

export interface RevenueTrend {
  date: Date;
  revenue: number;
  newCustomers: number;
  churnedCustomers: number;
  averageOrderValue: number;
  conversionRate: number;
}

export interface CustomerSegment {
  name: string;
  customerCount: number;
  percentage: number;
  averageRevenue: number;
  churnRate: number;
  engagementScore: number;
}

export interface ContentPerformance {
  id: string;
  title: string;
  type: 'chapter' | 'template' | 'exercise' | 'video';
  engagementScore: number;
  viewCount: number;
  averageTime: number;
  completionRate: number;
}

@Component({
  selector: 'app-business-intelligence-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatTableModule,
    MatSelectModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatBadgeModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule
  ],
  template: `
    <div class="business-intelligence-dashboard">
      <!-- Dashboard Header -->
      <div class="dashboard-header">
        <div class="header-content">
          <h1 class="dashboard-title">Business Intelligence Dashboard</h1>
          <div class="header-actions">
            <form [formGroup]="filterForm" class="filter-controls">
              <mat-form-field appearance="outline" class="date-range">
                <mat-label>Date Range</mat-label>
                <mat-select formControlName="dateRange">
                  <mat-option value="7d">Last 7 Days</mat-option>
                  <mat-option value="30d">Last 30 Days</mat-option>
                  <mat-option value="90d">Last 90 Days</mat-option>
                  <mat-option value="1y">Last Year</mat-option>
                </mat-select>
              </mat-form-field>
              
              <button mat-raised-button color="primary" (click)="refreshDashboard()">
                <mat-icon>refresh</mat-icon>
                Refresh
              </button>
              
              <button mat-button [matMenuTriggerFor]="exportMenu">
                <mat-icon>download</mat-icon>
                Export
              </button>
              <mat-menu #exportMenu="matMenu">
                <button mat-menu-item (click)="exportDashboard('pdf')">
                  <mat-icon>picture_as_pdf</mat-icon>
                  Export as PDF
                </button>
                <button mat-menu-item (click)="exportDashboard('excel')">
                  <mat-icon>table_chart</mat-icon>
                  Export as Excel
                </button>
                <button mat-menu-item (click)="exportDashboard('json')">
                  <mat-icon>code</mat-icon>
                  Export as JSON
                </button>
              </mat-menu>
            </form>
          </div>
        </div>
        
        <div class="last-updated" *ngIf="lastUpdated">
          <mat-icon class="update-icon">schedule</mat-icon>
          Last updated: {{ lastUpdated | date:'medium' }}
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-container" *ngIf="isLoading">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Loading business intelligence data...</p>
      </div>

      <!-- Dashboard Content -->
      <div class="dashboard-content" *ngIf="!isLoading">
        <!-- Business Overview Cards -->
        <div class="overview-cards">
          <mat-card class="metric-card revenue-card">
            <mat-card-header>
              <mat-card-title>Total Revenue</mat-card-title>
              <mat-card-subtitle>Monthly Performance</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="metric-value">{{ overview?.totalRevenue | currency }}</div>
              <div class="metric-trend" [ngClass]="getRevenueGrowthClass()">
                <mat-icon>{{ getRevenueGrowthIcon() }}</mat-icon>
                {{ overview?.growthRate }}% vs last month
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="metric-card customer-card">
            <mat-card-header>
              <mat-card-title>Total Customers</mat-card-title>
              <mat-card-subtitle>Active Subscribers</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="metric-value">{{ overview?.totalCustomers | number }}</div>
              <div class="metric-detail">
                {{ overview?.activeSubscriptions | number }} active subscriptions
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="metric-card mrr-card">
            <mat-card-header>
              <mat-card-title>Monthly Recurring Revenue</mat-card-title>
              <mat-card-subtitle>Subscription Income</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="metric-value">{{ overview?.monthlyRecurringRevenue | currency }}</div>
              <div class="metric-detail">
                {{ revenueMetrics?.averageRevenuePerUser | currency }} ARPU
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="metric-card health-card">
            <mat-card-header>
              <mat-card-title>System Health</mat-card-title>
              <mat-card-subtitle>Overall Performance</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="health-indicator" [ngClass]="overview?.systemHealth">
                <mat-icon>{{ getHealthIcon() }}</mat-icon>
                {{ overview?.systemHealth | titlecase }}
              </div>
              <div class="metric-detail">
                {{ overview?.contentEngagement }}% engagement rate
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Alerts Section -->
        <mat-card class="alerts-card" *ngIf="alerts && alerts.length > 0">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>notifications</mat-icon>
              Business Alerts
              <mat-chip-listbox class="alert-summary">
                <mat-chip class="critical-count" *ngIf="getCriticalAlertsCount() > 0">
                  {{ getCriticalAlertsCount() }} Critical
                </mat-chip>
                <mat-chip class="warning-count" *ngIf="getWarningAlertsCount() > 0">
                  {{ getWarningAlertsCount() }} Warning
                </mat-chip>
              </mat-chip-listbox>
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="alerts-list">
              <div 
                class="alert-item" 
                *ngFor="let alert of alerts" 
                [ngClass]="'alert-' + alert.severity"
                (click)="acknowledgeAlert(alert.id)"
              >
                <div class="alert-header">
                  <mat-icon class="alert-icon">{{ getAlertIcon(alert.type) }}</mat-icon>
                  <span class="alert-title">{{ alert.title }}</span>
                  <mat-chip class="alert-severity">{{ alert.severity }}</mat-chip>
                </div>
                <p class="alert-description">{{ alert.description }}</p>
                <div class="alert-actions" *ngIf="alert.actionItems.length > 0">
                  <strong>Recommended Actions:</strong>
                  <ul>
                    <li *ngFor="let action of alert.actionItems">{{ action }}</li>
                  </ul>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Main Analytics Tabs -->
        <mat-card class="analytics-tabs-card">
          <mat-tab-group (selectedTabChange)="onTabChange($event)" dynamicHeight>
            <!-- Revenue Analytics Tab -->
            <mat-tab label="Revenue Analytics">
              <div class="tab-content">
                <div class="chart-section">
                  <div class="chart-header">
                    <h3>Revenue Trends</h3>
                    <mat-form-field appearance="outline" class="chart-period">
                      <mat-label>Time Period</mat-label>
                      <mat-select [(value)]="revenuePeriod" (selectionChange)="updateRevenueChart()">
                        <mat-option value="daily">Daily</mat-option>
                        <mat-option value="weekly">Weekly</mat-option>
                        <mat-option value="monthly">Monthly</mat-option>
                        <mat-option value="quarterly">Quarterly</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>
                  <div class="chart-container">
                    <canvas #revenueChart></canvas>
                  </div>
                </div>

                <div class="metrics-grid">
                  <mat-card class="metric-detail-card">
                    <mat-card-header>
                      <mat-card-title>Key Revenue Metrics</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="metric-row">
                        <span class="metric-label">Customer Acquisition Cost:</span>
                        <span class="metric-value">{{ revenueMetrics?.customerAcquisitionCost | currency }}</span>
                      </div>
                      <div class="metric-row">
                        <span class="metric-label">Customer Lifetime Value:</span>
                        <span class="metric-value">{{ overview?.customerLifetimeValue | currency }}</span>
                      </div>
                      <div class="metric-row">
                        <span class="metric-label">LTV:CAC Ratio:</span>
                        <span class="metric-value">{{ revenueMetrics?.lifetimeValueToCAC | number:'1.1-1' }}:1</span>
                      </div>
                      <div class="metric-row">
                        <span class="metric-label">Payback Period:</span>
                        <span class="metric-value">{{ revenueMetrics?.paybackPeriod | number:'1.1-1' }} months</span>
                      </div>
                      <div class="metric-row">
                        <span class="metric-label">Net Revenue Retention:</span>
                        <span class="metric-value">{{ revenueMetrics?.netRevenueRetention | number:'1.1-1' }}%</span>
                      </div>
                    </mat-card-content>
                  </mat-card>

                  <mat-card class="forecast-card">
                    <mat-card-header>
                      <mat-card-title>Revenue Forecast</mat-card-title>
                      <mat-card-subtitle>Next 12 Months</mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="forecast-container">
                        <canvas #forecastChart></canvas>
                      </div>
                    </mat-card-content>
                  </mat-card>
                </div>
              </div>
            </mat-tab>

            <!-- Customer Analytics Tab -->
            <mat-tab label="Customer Analytics">
              <div class="tab-content">
                <div class="customer-analytics-grid">
                  <mat-card class="customer-overview-card">
                    <mat-card-header>
                      <mat-card-title>Customer Overview</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="customer-metrics">
                        <div class="customer-metric">
                          <span class="metric-value">{{ overview?.churnRate | number:'1.1-1' }}%</span>
                          <span class="metric-label">Churn Rate</span>
                        </div>
                        <div class="customer-metric">
                          <span class="metric-value">{{ overview?.conversionRate | number:'1.1-1' }}%</span>
                          <span class="metric-label">Conversion Rate</span>
                        </div>
                        <div class="customer-metric">
                          <span class="metric-value">{{ overview?.customerLifetimeValue | currency }}</span>
                          <span class="metric-label">Avg LTV</span>
                        </div>
                      </div>
                    </mat-card-content>
                  </mat-card>

                  <mat-card class="customer-segments-card">
                    <mat-card-header>
                      <mat-card-title>Customer Segments</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="segments-chart-container">
                        <canvas #customerSegmentsChart></canvas>
                      </div>
                    </mat-card-content>
                  </mat-card>

                  <mat-card class="customer-acquisition-card">
                    <mat-card-header>
                      <mat-card-title>Acquisition Channels</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="acquisition-chart-container">
                        <canvas #acquisitionChart></canvas>
                      </div>
                    </mat-card-content>
                  </mat-card>

                  <mat-card class="customer-lifecycle-card">
                    <mat-card-header>
                      <mat-card-title>Customer Lifecycle</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="lifecycle-funnel">
                        <div class="funnel-stage" *ngFor="let stage of customerLifecycleStages">
                          <div class="stage-name">{{ stage.name }}</div>
                          <div class="stage-count">{{ stage.count | number }}</div>
                          <div class="stage-conversion">{{ stage.conversionRate | number:'1.1-1' }}%</div>
                        </div>
                      </div>
                    </mat-card-content>
                  </mat-card>
                </div>
              </div>
            </mat-tab>

            <!-- Content Performance Tab -->
            <mat-tab label="Content Performance">
              <div class="tab-content">
                <div class="content-analytics-grid">
                  <mat-card class="content-overview-card">
                    <mat-card-header>
                      <mat-card-title>Content Engagement Overview</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="engagement-metrics">
                        <div class="engagement-metric">
                          <span class="metric-value">{{ overview?.contentEngagement | number:'1.1-1' }}%</span>
                          <span class="metric-label">Overall Engagement</span>
                        </div>
                        <div class="engagement-metric">
                          <span class="metric-value">18.5</span>
                          <span class="metric-label">Avg Session (min)</span>
                        </div>
                        <div class="engagement-metric">
                          <span class="metric-value">76%</span>
                          <span class="metric-label">Completion Rate</span>
                        </div>
                      </div>
                    </mat-card-content>
                  </mat-card>

                  <mat-card class="top-content-card">
                    <mat-card-header>
                      <mat-card-title>Top Performing Content</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="content-table-container">
                        <table mat-table [dataSource]="topContent" class="content-table">
                          <ng-container matColumnDef="title">
                            <th mat-header-cell *matHeaderCellDef>Content</th>
                            <td mat-cell *matCellDef="let content">
                              <div class="content-info">
                                <span class="content-title">{{ content.title }}</span>
                                <mat-chip class="content-type">{{ content.type }}</mat-chip>
                              </div>
                            </td>
                          </ng-container>

                          <ng-container matColumnDef="engagementScore">
                            <th mat-header-cell *matHeaderCellDef>Engagement</th>
                            <td mat-cell *matCellDef="let content">
                              <div class="engagement-score">
                                <span class="score-value">{{ content.engagementScore | number:'1.1-1' }}</span>
                                <div class="score-bar">
                                  <div class="score-fill" [style.width.%]="content.engagementScore"></div>
                                </div>
                              </div>
                            </td>
                          </ng-container>

                          <ng-container matColumnDef="viewCount">
                            <th mat-header-cell *matHeaderCellDef>Views</th>
                            <td mat-cell *matCellDef="let content">{{ content.viewCount | number }}</td>
                          </ng-container>

                          <ng-container matColumnDef="completionRate">
                            <th mat-header-cell *matHeaderCellDef>Completion</th>
                            <td mat-cell *matCellDef="let content">{{ content.completionRate | percent:'1.1-1' }}</td>
                          </ng-container>

                          <tr mat-header-row *matHeaderRowDef="contentDisplayedColumns"></tr>
                          <tr mat-row *matRowDef="let row; columns: contentDisplayedColumns;"></tr>
                        </table>
                      </div>
                    </mat-card-content>
                  </mat-card>

                  <mat-card class="content-trends-card">
                    <mat-card-header>
                      <mat-card-title>Content Engagement Trends</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="content-chart-container">
                        <canvas #contentTrendsChart></canvas>
                      </div>
                    </mat-card-content>
                  </mat-card>
                </div>
              </div>
            </mat-tab>

            <!-- Executive Summary Tab -->
            <mat-tab label="Executive Summary">
              <div class="tab-content">
                <div class="executive-summary-grid">
                  <mat-card class="kpi-summary-card">
                    <mat-card-header>
                      <mat-card-title>Key Performance Indicators</mat-card-title>
                      <mat-card-subtitle>Monthly Summary</mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="kpi-grid">
                        <div class="kpi-item">
                          <div class="kpi-value">{{ overview?.totalRevenue | currency }}</div>
                          <div class="kpi-label">Total Revenue</div>
                          <div class="kpi-change positive">+{{ overview?.growthRate }}%</div>
                        </div>
                        <div class="kpi-item">
                          <div class="kpi-value">{{ overview?.monthlyRecurringRevenue | currency }}</div>
                          <div class="kpi-label">Monthly Recurring Revenue</div>
                          <div class="kpi-change positive">+15.2%</div>
                        </div>
                        <div class="kpi-item">
                          <div class="kpi-value">{{ overview?.totalCustomers | number }}</div>
                          <div class="kpi-label">Total Customers</div>
                          <div class="kpi-change positive">+8.5%</div>
                        </div>
                        <div class="kpi-item">
                          <div class="kpi-value">{{ overview?.churnRate | number:'1.1-1' }}%</div>
                          <div class="kpi-label">Churn Rate</div>
                          <div class="kpi-change negative">-0.3%</div>
                        </div>
                      </div>
                    </mat-card-content>
                  </mat-card>

                  <mat-card class="strategic-insights-card">
                    <mat-card-header>
                      <mat-card-title>Strategic Insights</mat-card-title>
                      <mat-card-subtitle>Key Recommendations</mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="insights-list">
                        <div class="insight-item">
                          <mat-icon class="insight-icon positive">trending_up</mat-icon>
                          <div class="insight-content">
                            <h4>Revenue Growth Acceleration</h4>
                            <p>Current growth rate of {{ overview?.growthRate }}% exceeds target. Consider scaling marketing efforts.</p>
                          </div>
                        </div>
                        <div class="insight-item">
                          <mat-icon class="insight-icon warning">warning</mat-icon>
                          <div class="insight-content">
                            <h4>Customer Acquisition Cost Rising</h4>
                            <p>CAC increased to ${{ revenueMetrics?.customerAcquisitionCost }}. Optimize conversion funnel to improve efficiency.</p>
                          </div>
                        </div>
                        <div class="insight-item">
                          <mat-icon class="insight-icon positive">people</mat-icon>
                          <div class="insight-content">
                            <h4>Strong Customer Retention</h4>
                            <p>Churn rate maintained at {{ overview?.churnRate }}%. Continue focus on customer success initiatives.</p>
                          </div>
                        </div>
                      </div>
                    </mat-card-content>
                  </mat-card>

                  <mat-card class="business-health-card">
                    <mat-card-header>
                      <mat-card-title>Business Health Score</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="health-score-container">
                        <div class="health-score-chart">
                          <canvas #healthScoreChart></canvas>
                        </div>
                        <div class="health-metrics">
                          <div class="health-metric">
                            <span class="metric-name">Revenue Health</span>
                            <div class="metric-bar">
                              <div class="metric-fill revenue" style="width: 85%"></div>
                            </div>
                            <span class="metric-score">85/100</span>
                          </div>
                          <div class="health-metric">
                            <span class="metric-name">Customer Health</span>
                            <div class="metric-bar">
                              <div class="metric-fill customer" style="width: 78%"></div>
                            </div>
                            <span class="metric-score">78/100</span>
                          </div>
                          <div class="health-metric">
                            <span class="metric-name">Product Health</span>
                            <div class="metric-bar">
                              <div class="metric-fill product" style="width: 92%"></div>
                            </div>
                            <span class="metric-score">92/100</span>
                          </div>
                        </div>
                      </div>
                    </mat-card-content>
                  </mat-card>
                </div>
              </div>
            </mat-tab>
          </mat-tab-group>
        </mat-card>
      </div>
    </div>
  `,
  styleUrls: ['./business-intelligence-dashboard.component.scss']
})
export class BusinessIntelligenceDashboardComponent implements OnInit, OnDestroy {
  @ViewChild('revenueChart', { static: false }) revenueChartRef!: ElementRef;
  @ViewChild('forecastChart', { static: false }) forecastChartRef!: ElementRef;
  @ViewChild('customerSegmentsChart', { static: false }) customerSegmentsChartRef!: ElementRef;
  @ViewChild('acquisitionChart', { static: false }) acquisitionChartRef!: ElementRef;
  @ViewChild('contentTrendsChart', { static: false }) contentTrendsChartRef!: ElementRef;
  @ViewChild('healthScoreChart', { static: false }) healthScoreChartRef!: ElementRef;

  filterForm: FormGroup;
  isLoading = true;
  lastUpdated: Date | null = null;
  revenuePeriod = 'monthly';

  // Data properties
  overview: BusinessOverview | null = null;
  revenueMetrics: RevenueMetrics | null = null;
  alerts: BusinessAlert[] = [];
  revenueTrends: RevenueTrend[] = [];
  customerSegments: CustomerSegment[] = [];
  topContent: ContentPerformance[] = [];
  customerLifecycleStages: any[] = [];

  // Chart instances
  revenueChart: Chart | null = null;
  forecastChart: Chart | null = null;
  customerSegmentsChart: Chart | null = null;
  acquisitionChart: Chart | null = null;
  contentTrendsChart: Chart | null = null;
  healthScoreChart: Chart | null = null;

  // Table configuration
  contentDisplayedColumns: string[] = ['title', 'engagementScore', 'viewCount', 'completionRate'];

  // Subscriptions
  private subscriptions = new Subscription();

  constructor(private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      dateRange: ['30d']
    });
  }

  ngOnInit(): void {
    this.initializeComponent();
    this.setupAutoRefresh();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.destroyCharts();
  }

  private async initializeComponent(): Promise<void> {
    try {
      await this.loadDashboardData();
      setTimeout(() => {
        this.initializeCharts();
      }, 100);
    } catch (error) {
      console.error('Failed to initialize dashboard:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private async loadDashboardData(): Promise<void> {
    // Simulate API calls - in production, these would be actual service calls
    this.overview = await this.loadBusinessOverview();
    this.revenueMetrics = await this.loadRevenueMetrics();
    this.alerts = await this.loadAlerts();
    this.revenueTrends = await this.loadRevenueTrends();
    this.customerSegments = await this.loadCustomerSegments();
    this.topContent = await this.loadTopContent();
    this.customerLifecycleStages = await this.loadCustomerLifecycle();
    this.lastUpdated = new Date();
  }

  private setupAutoRefresh(): void {
    // Refresh data every 5 minutes
    const refreshInterval = interval(5 * 60 * 1000);
    this.subscriptions.add(
      refreshInterval.subscribe(() => {
        this.refreshDashboard();
      })
    );
  }

  async refreshDashboard(): Promise<void> {
    this.isLoading = true;
    try {
      await this.loadDashboardData();
      this.updateAllCharts();
    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async exportDashboard(format: 'pdf' | 'excel' | 'json'): Promise<void> {
    try {
      // In production, this would call the export service
      console.log(`Exporting dashboard as ${format}`);
      // Simulate export delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      // Download would be triggered here
    } catch (error) {
      console.error('Failed to export dashboard:', error);
    }
  }

  onTabChange(event: any): void {
    setTimeout(() => {
      this.updateChartsForTab(event.index);
    }, 100);
  }

  updateRevenueChart(): void {
    if (this.revenueChart) {
      this.updateRevenueChartData();
    }
  }

  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledgedAt = new Date();
    }
  }

  // Chart initialization methods
  private initializeCharts(): void {
    this.initializeRevenueChart();
    this.initializeForecastChart();
    this.initializeCustomerSegmentsChart();
    this.initializeAcquisitionChart();
    this.initializeContentTrendsChart();
    this.initializeHealthScoreChart();
  }

  private initializeRevenueChart(): void {
    if (this.revenueChartRef?.nativeElement) {
      const ctx = this.revenueChartRef.nativeElement.getContext('2d');
      this.revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: this.revenueTrends.map(t => t.date.toLocaleDateString()),
          datasets: [{
            label: 'Revenue',
            data: this.revenueTrends.map(t => t.revenue),
            borderColor: '#1976d2',
            backgroundColor: 'rgba(25, 118, 210, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) => '$' + value
              }
            }
          }
        }
      });
    }
  }

  private initializeForecastChart(): void {
    if (this.forecastChartRef?.nativeElement) {
      const ctx = this.forecastChartRef.nativeElement.getContext('2d');
      this.forecastChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            label: 'Projected Revenue',
            data: [25000, 28000, 31000, 34000, 37000, 40000],
            borderColor: '#4caf50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            borderDash: [5, 5],
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) => '$' + value
              }
            }
          }
        }
      });
    }
  }

  private initializeCustomerSegmentsChart(): void {
    if (this.customerSegmentsChartRef?.nativeElement) {
      const ctx = this.customerSegmentsChartRef.nativeElement.getContext('2d');
      this.customerSegmentsChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: this.customerSegments.map(s => s.name),
          datasets: [{
            data: this.customerSegments.map(s => s.customerCount),
            backgroundColor: [
              '#1976d2',
              '#388e3c',
              '#f57c00',
              '#7b1fa2',
              '#c2185b'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });
    }
  }

  private initializeAcquisitionChart(): void {
    if (this.acquisitionChartRef?.nativeElement) {
      const ctx = this.acquisitionChartRef.nativeElement.getContext('2d');
      this.acquisitionChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Organic', 'Social Media', 'Direct', 'Referral'],
          datasets: [{
            label: 'Customers',
            data: [823, 567, 198, 135],
            backgroundColor: '#1976d2'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }
  }

  private initializeContentTrendsChart(): void {
    if (this.contentTrendsChartRef?.nativeElement) {
      const ctx = this.contentTrendsChartRef.nativeElement.getContext('2d');
      this.contentTrendsChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          datasets: [{
            label: 'Engagement Rate',
            data: [72, 75, 78, 81],
            borderColor: '#ff9800',
            backgroundColor: 'rgba(255, 152, 0, 0.1)',
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              ticks: {
                callback: (value) => value + '%'
              }
            }
          }
        }
      });
    }
  }

  private initializeHealthScoreChart(): void {
    if (this.healthScoreChartRef?.nativeElement) {
      const ctx = this.healthScoreChartRef.nativeElement.getContext('2d');
      this.healthScoreChart = new Chart(ctx, {
        type: 'radar',
        data: {
          labels: ['Revenue', 'Customers', 'Product', 'Operations', 'Growth'],
          datasets: [{
            label: 'Business Health',
            data: [85, 78, 92, 88, 82],
            borderColor: '#4caf50',
            backgroundColor: 'rgba(76, 175, 80, 0.2)',
            pointBackgroundColor: '#4caf50'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            r: {
              beginAtZero: true,
              max: 100
            }
          }
        }
      });
    }
  }

  private updateAllCharts(): void {
    if (this.revenueChart) this.updateRevenueChartData();
    if (this.customerSegmentsChart) this.updateCustomerSegmentsChartData();
    // Update other charts as needed
  }

  private updateChartsForTab(tabIndex: number): void {
    switch (tabIndex) {
      case 0: // Revenue Analytics
        if (this.revenueChart) this.revenueChart.resize();
        if (this.forecastChart) this.forecastChart.resize();
        break;
      case 1: // Customer Analytics
        if (this.customerSegmentsChart) this.customerSegmentsChart.resize();
        if (this.acquisitionChart) this.acquisitionChart.resize();
        break;
      case 2: // Content Performance
        if (this.contentTrendsChart) this.contentTrendsChart.resize();
        break;
      case 3: // Executive Summary
        if (this.healthScoreChart) this.healthScoreChart.resize();
        break;
    }
  }

  private updateRevenueChartData(): void {
    if (this.revenueChart && this.revenueTrends) {
      this.revenueChart.data.labels = this.revenueTrends.map(t => t.date.toLocaleDateString());
      this.revenueChart.data.datasets[0].data = this.revenueTrends.map(t => t.revenue);
      this.revenueChart.update();
    }
  }

  private updateCustomerSegmentsChartData(): void {
    if (this.customerSegmentsChart && this.customerSegments) {
      this.customerSegmentsChart.data.labels = this.customerSegments.map(s => s.name);
      this.customerSegmentsChart.data.datasets[0].data = this.customerSegments.map(s => s.customerCount);
      this.customerSegmentsChart.update();
    }
  }

  private destroyCharts(): void {
    if (this.revenueChart) this.revenueChart.destroy();
    if (this.forecastChart) this.forecastChart.destroy();
    if (this.customerSegmentsChart) this.customerSegmentsChart.destroy();
    if (this.acquisitionChart) this.acquisitionChart.destroy();
    if (this.contentTrendsChart) this.contentTrendsChart.destroy();
    if (this.healthScoreChart) this.healthScoreChart.destroy();
  }

  // Helper methods
  getRevenueGrowthClass(): string {
    return this.overview && this.overview.growthRate > 0 ? 'positive' : 'negative';
  }

  getRevenueGrowthIcon(): string {
    return this.overview && this.overview.growthRate > 0 ? 'trending_up' : 'trending_down';
  }

  getHealthIcon(): string {
    switch (this.overview?.systemHealth) {
      case 'excellent': return 'check_circle';
      case 'good': return 'check';
      case 'warning': return 'warning';
      case 'critical': return 'error';
      default: return 'help';
    }
  }

  getCriticalAlertsCount(): number {
    return this.alerts.filter(a => a.severity === 'critical').length;
  }

  getWarningAlertsCount(): number {
    return this.alerts.filter(a => a.severity === 'warning').length;
  }

  getAlertIcon(type: string): string {
    const icons: Record<string, string> = {
      revenue: 'attach_money',
      customer: 'people',
      system: 'computer',
      opportunity: 'lightbulb',
      threat: 'warning'
    };
    return icons[type] || 'info';
  }

  // Mock data loading methods - in production, these would be actual service calls
  private async loadBusinessOverview(): Promise<BusinessOverview> {
    return {
      totalRevenue: 125750.50,
      monthlyRecurringRevenue: 28450.00,
      totalCustomers: 1847,
      activeSubscriptions: 1623,
      churnRate: 3.2,
      customerLifetimeValue: 1280.00,
      growthRate: 15.8,
      conversionRate: 12.4,
      marketingROI: 3.8,
      supportTicketVolume: 89,
      contentEngagement: 78.5,
      systemHealth: 'excellent'
    };
  }

  private async loadRevenueMetrics(): Promise<RevenueMetrics> {
    return {
      averageRevenuePerUser: 68.50,
      customerAcquisitionCost: 85.00,
      lifetimeValueToCAC: 15.1,
      paybackPeriod: 1.2,
      monthsToBreakeven: 8.5,
      revenueGrowthRate: 14.5,
      netRevenueRetention: 108.0,
      grossRevenueRetention: 95.5
    };
  }

  private async loadAlerts(): Promise<BusinessAlert[]> {
    return [
      {
        id: 'alert_001',
        type: 'revenue',
        severity: 'warning',
        title: 'Monthly Revenue Target Below Projection',
        description: 'Current month revenue is 8% below projection',
        value: 26150.00,
        threshold: 28450.00,
        trend: 'declining',
        actionItems: ['Review marketing spend efficiency', 'Analyze conversion funnel'],
        createdAt: new Date()
      }
    ];
  }

  private async loadRevenueTrends(): Promise<RevenueTrend[]> {
    const trends: RevenueTrend[] = [];
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      trends.push({
        date,
        revenue: 950 + Math.random() * 200,
        newCustomers: Math.floor(Math.random() * 8) + 2,
        churnedCustomers: Math.floor(Math.random() * 3),
        averageOrderValue: 24.95 + Math.random() * 10,
        conversionRate: 12 + Math.random() * 4
      });
    }
    return trends;
  }

  private async loadCustomerSegments(): Promise<CustomerSegment[]> {
    return [
      {
        name: 'High Value Power Users',
        customerCount: 234,
        percentage: 12.7,
        averageRevenue: 156.80,
        churnRate: 1.2,
        engagementScore: 92.5
      },
      {
        name: 'Growing Professionals',
        customerCount: 892,
        percentage: 48.3,
        averageRevenue: 68.50,
        churnRate: 2.8,
        engagementScore: 78.2
      }
    ];
  }

  private async loadTopContent(): Promise<ContentPerformance[]> {
    return [
      {
        id: 'ch_001',
        title: 'Elite Principle #1: Context Engineering',
        type: 'chapter',
        engagementScore: 95.2,
        viewCount: 1456,
        averageTime: 25.5,
        completionRate: 0.89
      },
      {
        id: 'tpl_001',
        title: 'Code Review Assistant Template',
        type: 'template',
        engagementScore: 92.8,
        viewCount: 1234,
        averageTime: 8.2,
        completionRate: 0.95
      }
    ];
  }

  private async loadCustomerLifecycle(): Promise<any[]> {
    return [
      { name: 'Visitors', count: 15000, conversionRate: 8.5 },
      { name: 'Leads', count: 1275, conversionRate: 65.2 },
      { name: 'Trials', count: 831, conversionRate: 72.1 },
      { name: 'Customers', count: 1623, conversionRate: 95.8 }
    ];
  }
}