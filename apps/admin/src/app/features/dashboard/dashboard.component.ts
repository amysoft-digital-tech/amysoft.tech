import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { AuthService, AdminRole } from '../../core/auth/auth.service';
import { NotificationService } from '../../core/services/notification.service';

interface DashboardCard {
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
  color: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
    period: string;
  };
  action?: {
    label: string;
    route: string;
  };
}

interface QuickAction {
  label: string;
  icon: string;
  route: string;
  description: string;
  requiredRoles: AdminRole[];
}

interface RecentActivity {
  id: string;
  action: string;
  user: string;
  timestamp: Date;
  status: 'success' | 'warning' | 'error';
  details: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatGridListModule,
    MatProgressBarModule,
    MatTableModule,
    MatChipsModule,
    MatMenuModule,
    MatTooltipModule
  ],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <div class="header-content">
          <h1>Welcome back, {{ currentUser?.name }}!</h1>
          <p class="header-subtitle">Here's what's happening with your platform today</p>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="refreshDashboard()">
            <mat-icon>refresh</mat-icon>
            Refresh
          </button>
        </div>
      </div>

      <!-- Key Metrics Grid -->
      <div class="metrics-grid">
        <mat-grid-list [cols]="(isHandset$ | async) ? 1 : 4" rowHeight="200px" gutterSize="24px">
          <mat-grid-tile *ngFor="let card of visibleMetricCards">
            <mat-card class="metric-card" [class]="'card-' + card.color">
              <mat-card-header>
                <div class="metric-header">
                  <div class="metric-icon">
                    <mat-icon>{{ card.icon }}</mat-icon>
                  </div>
                  <div class="metric-menu">
                    <button mat-icon-button [matMenuTriggerFor]="cardMenu">
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    <mat-menu #cardMenu="matMenu">
                      <button mat-menu-item *ngIf="card.action" [routerLink]="card.action.route">
                        <mat-icon>open_in_new</mat-icon>
                        <span>{{ card.action.label }}</span>
                      </button>
                      <button mat-menu-item>
                        <mat-icon>download</mat-icon>
                        <span>Export Data</span>
                      </button>
                    </mat-menu>
                  </div>
                </div>
              </mat-card-header>
              <mat-card-content>
                <div class="metric-value">{{ card.value }}</div>
                <div class="metric-title">{{ card.title }}</div>
                <div class="metric-subtitle">{{ card.subtitle }}</div>
                <div class="metric-trend" *ngIf="card.trend">
                  <mat-icon [class]="'trend-' + card.trend.direction">
                    {{ card.trend.direction === 'up' ? 'trending_up' : 'trending_down' }}
                  </mat-icon>
                  <span class="trend-value">{{ card.trend.value }}%</span>
                  <span class="trend-period">{{ card.trend.period }}</span>
                </div>
              </mat-card-content>
            </mat-card>
          </mat-grid-tile>
        </mat-grid-list>
      </div>

      <!-- Quick Actions -->
      <mat-card class="quick-actions-card">
        <mat-card-header>
          <mat-card-title>Quick Actions</mat-card-title>
          <mat-card-subtitle>Frequently used administrative tasks</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="quick-actions-grid">
            <button mat-stroked-button 
                    *ngFor="let action of visibleQuickActions"
                    class="quick-action-button"
                    [routerLink]="action.route"
                    matTooltip="{{ action.description }}">
              <mat-icon>{{ action.icon }}</mat-icon>
              <span>{{ action.label }}</span>
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Dashboard Content Grid -->
      <div class="content-grid">
        <!-- Recent Activity -->
        <mat-card class="activity-card">
          <mat-card-header>
            <mat-card-title>Recent Activity</mat-card-title>
            <mat-card-subtitle>Latest system events and user actions</mat-card-subtitle>
            <div class="card-actions">
              <button mat-icon-button routerLink="/system/audit">
                <mat-icon>open_in_new</mat-icon>
              </button>
            </div>
          </mat-card-header>
          <mat-card-content>
            <div class="activity-list" *ngIf="recentActivity.length > 0; else noActivity">
              <div class="activity-item" *ngFor="let activity of recentActivity">
                <div class="activity-status">
                  <mat-icon [class]="'status-' + activity.status">
                    {{ getStatusIcon(activity.status) }}
                  </mat-icon>
                </div>
                <div class="activity-content">
                  <div class="activity-action">{{ activity.action }}</div>
                  <div class="activity-details">{{ activity.details }}</div>
                  <div class="activity-meta">
                    <span class="activity-user">{{ activity.user }}</span>
                    <span class="activity-time">{{ activity.timestamp | date:'short' }}</span>
                  </div>
                </div>
              </div>
            </div>
            <ng-template #noActivity>
              <div class="no-activity">
                <mat-icon>timeline</mat-icon>
                <p>No recent activity to display</p>
              </div>
            </ng-template>
          </mat-card-content>
        </mat-card>

        <!-- System Status -->
        <mat-card class="system-status-card">
          <mat-card-header>
            <mat-card-title>System Status</mat-card-title>
            <mat-card-subtitle>Current health and performance metrics</mat-card-subtitle>
            <div class="card-actions">
              <button mat-icon-button routerLink="/system/health">
                <mat-icon>open_in_new</mat-icon>
              </button>
            </div>
          </mat-card-header>
          <mat-card-content>
            <div class="status-metrics">
              <div class="status-item" *ngFor="let metric of systemMetrics">
                <div class="status-label">{{ metric.label }}</div>
                <div class="status-bar">
                  <mat-progress-bar 
                    mode="determinate" 
                    [value]="metric.value"
                    [class]="'progress-' + metric.status">
                  </mat-progress-bar>
                  <span class="status-value">{{ metric.value }}%</span>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Role-Specific Content -->
      <div class="role-content" *ngIf="hasContentAccess()">
        <mat-card class="content-overview-card">
          <mat-card-header>
            <mat-card-title>Content Overview</mat-card-title>
            <mat-card-subtitle>Your content management summary</mat-card-subtitle>
            <div class="card-actions">
              <button mat-icon-button routerLink="/content">
                <mat-icon>open_in_new</mat-icon>
              </button>
            </div>
          </mat-card-header>
          <mat-card-content>
            <div class="content-stats">
              <div class="content-stat">
                <div class="stat-value">{{ contentStats.published }}</div>
                <div class="stat-label">Published</div>
              </div>
              <div class="content-stat">
                <div class="stat-value">{{ contentStats.draft }}</div>
                <div class="stat-label">Drafts</div>
              </div>
              <div class="content-stat">
                <div class="stat-value">{{ contentStats.review }}</div>
                <div class="stat-label">In Review</div>
              </div>
              <div class="content-stat">
                <div class="stat-value">{{ contentStats.scheduled }}</div>
                <div class="stat-label">Scheduled</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentUser = this.authService.getCurrentUser();
  
  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(map(result => result.matches));

  private subscriptions = new Subscription();

  metricCards: DashboardCard[] = [
    {
      title: 'Total Users',
      value: '2,847',
      subtitle: 'Active subscribers',
      icon: 'people',
      color: 'primary',
      trend: { value: 12, direction: 'up', period: 'vs last month' },
      action: { label: 'View Users', route: '/users' }
    },
    {
      title: 'Revenue',
      value: '$28,450',
      subtitle: 'Monthly recurring',
      icon: 'monetization_on',
      color: 'success',
      trend: { value: 8, direction: 'up', period: 'vs last month' }
    },
    {
      title: 'Content Items',
      value: '156',
      subtitle: 'Published articles',
      icon: 'article',
      color: 'info',
      trend: { value: 3, direction: 'down', period: 'vs last week' },
      action: { label: 'Manage Content', route: '/content' }
    },
    {
      title: 'System Health',
      value: '99.8%',
      subtitle: 'Uptime this month',
      icon: 'monitor_heart',
      color: 'warning',
      action: { label: 'View Details', route: '/system/health' }
    }
  ];

  quickActions: QuickAction[] = [
    {
      label: 'Create Content',
      icon: 'add_circle',
      route: '/content/editor',
      description: 'Create new blog post or article',
      requiredRoles: [AdminRole.SUPER_ADMIN, AdminRole.CONTENT_ADMIN]
    },
    {
      label: 'Manage Users',
      icon: 'person_add',
      route: '/users',
      description: 'Add or edit user accounts',
      requiredRoles: [AdminRole.SUPER_ADMIN, AdminRole.SUPPORT_ADMIN]
    },
    {
      label: 'View Reports',
      icon: 'analytics',
      route: '/analytics/business',
      description: 'Access business intelligence dashboard',
      requiredRoles: [AdminRole.SUPER_ADMIN, AdminRole.ANALYTICS_ADMIN]
    },
    {
      label: 'System Settings',
      icon: 'settings',
      route: '/system/config',
      description: 'Configure system parameters',
      requiredRoles: [AdminRole.SUPER_ADMIN]
    },
    {
      label: 'Support Tickets',
      icon: 'support',
      route: '/users/support',
      description: 'Manage customer support requests',
      requiredRoles: [AdminRole.SUPER_ADMIN, AdminRole.SUPPORT_ADMIN]
    },
    {
      label: 'Media Library',
      icon: 'perm_media',
      route: '/content/media',
      description: 'Manage uploaded media files',
      requiredRoles: [AdminRole.SUPER_ADMIN, AdminRole.CONTENT_ADMIN]
    }
  ];

  recentActivity: RecentActivity[] = [
    {
      id: '1',
      action: 'Content Published',
      user: 'John Smith',
      timestamp: new Date(Date.now() - 300000),
      status: 'success',
      details: 'Chapter 7: Advanced Prompt Engineering'
    },
    {
      id: '2',
      action: 'User Registration',
      user: 'System',
      timestamp: new Date(Date.now() - 600000),
      status: 'success',
      details: 'New user: jane.doe@example.com'
    },
    {
      id: '3',
      action: 'Payment Failed',
      user: 'Payment System',
      timestamp: new Date(Date.now() - 900000),
      status: 'error',
      details: 'Subscription renewal failed for user #2847'
    },
    {
      id: '4',
      action: 'Content Updated',
      user: 'Sarah Wilson',
      timestamp: new Date(Date.now() - 1200000),
      status: 'success',
      details: 'Updated content: Introduction to AI Prompts'
    }
  ];

  systemMetrics = [
    { label: 'CPU Usage', value: 65, status: 'normal' },
    { label: 'Memory Usage', value: 78, status: 'normal' },
    { label: 'Disk Usage', value: 45, status: 'good' },
    { label: 'Network I/O', value: 32, status: 'good' }
  ];

  contentStats = {
    published: 142,
    draft: 23,
    review: 8,
    scheduled: 5
  };

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get visibleMetricCards(): DashboardCard[] {
    return this.metricCards.filter(card => this.hasCardAccess(card));
  }

  get visibleQuickActions(): QuickAction[] {
    return this.quickActions.filter(action => 
      this.authService.hasAnyRole(action.requiredRoles)
    );
  }

  hasContentAccess(): boolean {
    return this.authService.hasAnyRole([AdminRole.SUPER_ADMIN, AdminRole.CONTENT_ADMIN]);
  }

  refreshDashboard(): void {
    this.notificationService.showInfo('Refreshing dashboard data...');
    this.loadDashboardData();
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'success': return 'check_circle';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'info';
    }
  }

  private hasCardAccess(card: DashboardCard): boolean {
    // Simple role-based access control for cards
    switch (card.title) {
      case 'Total Users':
        return this.authService.hasAnyRole([AdminRole.SUPER_ADMIN, AdminRole.SUPPORT_ADMIN]);
      case 'Content Items':
        return this.authService.hasAnyRole([AdminRole.SUPER_ADMIN, AdminRole.CONTENT_ADMIN]);
      case 'System Health':
        return this.authService.hasRole(AdminRole.SUPER_ADMIN);
      default:
        return true; // Revenue and general metrics visible to all
    }
  }

  private loadDashboardData(): void {
    // In a real application, this would make HTTP calls to load actual data
    // For now, we'll simulate the data loading
    setTimeout(() => {
      this.notificationService.showSuccess('Dashboard data refreshed successfully');
    }, 1000);
  }
}