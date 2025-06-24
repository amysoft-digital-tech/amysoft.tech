import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snackbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { Subscription, interval } from 'rxjs';

Chart.register(...registerables);

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatar?: string;
  company?: string;
  jobTitle?: string;
  accountStatus: UserAccountStatus;
  subscription?: UserSubscription;
  lastLogin: Date;
  registrationDate: Date;
  engagementScore: number;
  churnRisk: ChurnRiskLevel;
  lifetimeValue: number;
  supportTickets: number;
  tags: string[];
}

export enum UserAccountStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
  DEACTIVATED = 'deactivated',
  BANNED = 'banned'
}

export interface UserSubscription {
  id: string;
  tier: 'foundation' | 'advanced' | 'enterprise';
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'paused';
  amount: number;
  currency: string;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  nextBillingDate: Date;
  cancelAtPeriodEnd: boolean;
}

export enum ChurnRiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface UserHealthScore {
  userId: string;
  overallScore: number;
  components: {
    engagement: number;
    satisfaction: number;
    technical: number;
    financial: number;
  };
  trend: 'improving' | 'stable' | 'declining';
  recommendations: string[];
}

export interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  churnRate: number;
  averageEngagement: number;
  revenuePerUser: number;
  statusDistribution: Record<UserAccountStatus, number>;
  tierDistribution: Record<string, number>;
  churnRiskDistribution: Record<ChurnRiskLevel, number>;
  geographicDistribution: Record<string, number>;
}

export interface BulkAction {
  id: string;
  name: string;
  description: string;
  icon: string;
  requiresConfirmation: boolean;
  type: 'status_change' | 'tag_management' | 'communication' | 'export' | 'dangerous';
}

export interface UserFilter {
  searchTerm?: string;
  accountStatus?: UserAccountStatus[];
  subscriptionTier?: string[];
  churnRisk?: ChurnRiskLevel[];
  engagementRange?: { min: number; max: number };
  registrationDateRange?: { start: Date; end: Date };
  lastActivityRange?: { start: Date; end: Date };
  tags?: string[];
  hasSubscription?: boolean;
  supportTickets?: 'none' | 'open' | 'resolved';
}

@Component({
  selector: 'app-user-management-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatChipsModule,
    MatBadgeModule,
    MatMenuModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatSlideToggleModule,
    MatExpansionModule,
    MatCheckboxModule
  ],
  template: `
    <div class="user-management-dashboard">
      <!-- Dashboard Header -->
      <div class="dashboard-header">
        <div class="header-content">
          <h1 class="dashboard-title">User Management</h1>
          <div class="header-actions">
            <button mat-raised-button color="primary" (click)="refreshData()">
              <mat-icon>refresh</mat-icon>
              Refresh
            </button>
            <button mat-button [matMenuTriggerFor]="exportMenu">
              <mat-icon>download</mat-icon>
              Export
            </button>
            <mat-menu #exportMenu="matMenu">
              <button mat-menu-item (click)="exportUsers('csv')">
                <mat-icon>table_chart</mat-icon>
                Export as CSV
              </button>
              <button mat-menu-item (click)="exportUsers('excel')">
                <mat-icon>description</mat-icon>
                Export as Excel
              </button>
              <button mat-menu-item (click)="exportUsers('pdf')">
                <mat-icon>picture_as_pdf</mat-icon>
                Export as PDF
              </button>
            </mat-menu>
          </div>
        </div>
        
        <div class="analytics-overview" *ngIf="analytics">
          <mat-card class="metric-card">
            <mat-card-content>
              <div class="metric-value">{{ analytics.totalUsers | number }}</div>
              <div class="metric-label">Total Users</div>
              <div class="metric-change positive">{{ analytics.newUsersThisMonth | number }} new this month</div>
            </mat-card-content>
          </mat-card>
          
          <mat-card class="metric-card">
            <mat-card-content>
              <div class="metric-value">{{ analytics.activeUsers | number }}</div>
              <div class="metric-label">Active Users</div>
              <div class="metric-change">{{ (analytics.activeUsers / analytics.totalUsers * 100) | number:'1.1-1' }}% of total</div>
            </mat-card-content>
          </mat-card>
          
          <mat-card class="metric-card">
            <mat-card-content>
              <div class="metric-value">{{ analytics.churnRate | number:'1.1-1' }}%</div>
              <div class="metric-label">Churn Rate</div>
              <div class="metric-change" [ngClass]="analytics.churnRate < 5 ? 'positive' : 'negative'">
                {{ analytics.churnRate < 5 ? 'Low' : 'Attention needed' }}
              </div>
            </mat-card-content>
          </mat-card>
          
          <mat-card class="metric-card">
            <mat-card-content>
              <div class="metric-value">{{ analytics.revenuePerUser | currency }}</div>
              <div class="metric-label">Avg Revenue/User</div>
              <div class="metric-change positive">{{ analytics.averageEngagement | number:'1.1-1' }} engagement score</div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-container" *ngIf="isLoading">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Loading user data...</p>
      </div>

      <!-- Dashboard Content -->
      <div class="dashboard-content" *ngIf="!isLoading">
        <mat-card class="main-content-card">
          <mat-tab-group (selectedTabChange)="onTabChange($event)" dynamicHeight>
            <!-- User List Tab -->
            <mat-tab label="User Directory">
              <div class="tab-content">
                <!-- Advanced Search and Filters -->
                <mat-card class="filters-card">
                  <mat-card-header>
                    <mat-card-title>Search and Filter</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <form [formGroup]="filterForm" class="filter-form">
                      <div class="filter-row">
                        <mat-form-field appearance="outline" class="search-field">
                          <mat-label>Search users</mat-label>
                          <input matInput placeholder="Name, email, company..." formControlName="searchTerm">
                          <mat-icon matSuffix>search</mat-icon>
                        </mat-form-field>
                        
                        <mat-form-field appearance="outline">
                          <mat-label>Account Status</mat-label>
                          <mat-select formControlName="accountStatus" multiple>
                            <mat-option value="active">Active</mat-option>
                            <mat-option value="inactive">Inactive</mat-option>
                            <mat-option value="suspended">Suspended</mat-option>
                            <mat-option value="pending_verification">Pending Verification</mat-option>
                          </mat-select>
                        </mat-form-field>
                        
                        <mat-form-field appearance="outline">
                          <mat-label>Subscription Tier</mat-label>
                          <mat-select formControlName="subscriptionTier" multiple>
                            <mat-option value="foundation">Foundation</mat-option>
                            <mat-option value="advanced">Advanced</mat-option>
                            <mat-option value="enterprise">Enterprise</mat-option>
                          </mat-select>
                        </mat-form-field>
                        
                        <mat-form-field appearance="outline">
                          <mat-label>Churn Risk</mat-label>
                          <mat-select formControlName="churnRisk" multiple>
                            <mat-option value="low">Low Risk</mat-option>
                            <mat-option value="medium">Medium Risk</mat-option>
                            <mat-option value="high">High Risk</mat-option>
                            <mat-option value="critical">Critical Risk</mat-option>
                          </mat-select>
                        </mat-form-field>
                      </div>
                      
                      <div class="filter-actions">
                        <button mat-button type="button" (click)="clearFilters()">Clear Filters</button>
                        <button mat-raised-button color="primary" type="button" (click)="applyFilters()">Apply Filters</button>
                      </div>
                    </form>
                  </mat-card-content>
                </mat-card>

                <!-- Bulk Actions -->
                <div class="bulk-actions" *ngIf="selection.hasValue()">
                  <mat-card class="bulk-actions-card">
                    <mat-card-content>
                      <div class="bulk-actions-header">
                        <span class="selected-count">{{ selection.selected.length }} users selected</span>
                        <div class="bulk-action-buttons">
                          <button mat-button [matMenuTriggerFor]="bulkActionsMenu">
                            <mat-icon>more_vert</mat-icon>
                            Bulk Actions
                          </button>
                          <mat-menu #bulkActionsMenu="matMenu">
                            <button mat-menu-item (click)="performBulkAction('update_status')">
                              <mat-icon>account_circle</mat-icon>
                              Update Status
                            </button>
                            <button mat-menu-item (click)="performBulkAction('add_tags')">
                              <mat-icon>label</mat-icon>
                              Add Tags
                            </button>
                            <button mat-menu-item (click)="performBulkAction('send_email')">
                              <mat-icon>email</mat-icon>
                              Send Email
                            </button>
                            <button mat-menu-item (click)="performBulkAction('export_selected')">
                              <mat-icon>download</mat-icon>
                              Export Selected
                            </button>
                          </mat-menu>
                          <button mat-button (click)="clearSelection()">
                            <mat-icon>clear</mat-icon>
                            Clear Selection
                          </button>
                        </div>
                      </div>
                    </mat-card-content>
                  </mat-card>
                </div>

                <!-- User Table -->
                <div class="table-container">
                  <table mat-table [dataSource]="dataSource" matSort class="user-table">
                    <!-- Selection Column -->
                    <ng-container matColumnDef="select">
                      <th mat-header-cell *matHeaderCellDef>
                        <mat-checkbox (change)="$event ? masterToggle() : null"
                                      [checked]="selection.hasValue() && isAllSelected()"
                                      [indeterminate]="selection.hasValue() && !isAllSelected()">
                        </mat-checkbox>
                      </th>
                      <td mat-cell *matCellDef="let user">
                        <mat-checkbox (click)="$event.stopPropagation()"
                                      (change)="$event ? selection.toggle(user) : null"
                                      [checked]="selection.isSelected(user)">
                        </mat-checkbox>
                      </td>
                    </ng-container>

                    <!-- Avatar Column -->
                    <ng-container matColumnDef="avatar">
                      <th mat-header-cell *matHeaderCellDef></th>
                      <td mat-cell *matCellDef="let user">
                        <img [src]="user.avatar || '/assets/default-avatar.png'" 
                             [alt]="user.displayName" 
                             class="user-avatar">
                      </td>
                    </ng-container>

                    <!-- User Info Column -->
                    <ng-container matColumnDef="userInfo">
                      <th mat-header-cell *matHeaderCellDef mat-sort-header="displayName">User</th>
                      <td mat-cell *matCellDef="let user">
                        <div class="user-info">
                          <div class="user-name">{{ user.displayName }}</div>
                          <div class="user-email">{{ user.email }}</div>
                          <div class="user-company" *ngIf="user.company">{{ user.company }}</div>
                        </div>
                      </td>
                    </ng-container>

                    <!-- Status Column -->
                    <ng-container matColumnDef="status">
                      <th mat-header-cell *matHeaderCellDef mat-sort-header="accountStatus">Status</th>
                      <td mat-cell *matCellDef="let user">
                        <mat-chip [ngClass]="'status-' + user.accountStatus">
                          {{ getStatusLabel(user.accountStatus) }}
                        </mat-chip>
                      </td>
                    </ng-container>

                    <!-- Subscription Column -->
                    <ng-container matColumnDef="subscription">
                      <th mat-header-cell *matHeaderCellDef>Subscription</th>
                      <td mat-cell *matCellDef="let user">
                        <div class="subscription-info" *ngIf="user.subscription; else noSubscription">
                          <mat-chip [ngClass]="'tier-' + user.subscription.tier">
                            {{ user.subscription.tier | titlecase }}
                          </mat-chip>
                          <div class="subscription-details">
                            <span class="amount">{{ user.subscription.amount | currency }}</span>
                            <span class="cycle">/{{ user.subscription.billingCycle }}</span>
                          </div>
                        </div>
                        <ng-template #noSubscription>
                          <span class="no-subscription">No subscription</span>
                        </ng-template>
                      </td>
                    </ng-container>

                    <!-- Engagement Column -->
                    <ng-container matColumnDef="engagement">
                      <th mat-header-cell *matHeaderCellDef mat-sort-header="engagementScore">Engagement</th>
                      <td mat-cell *matCellDef="let user">
                        <div class="engagement-score">
                          <div class="score-value">{{ user.engagementScore }}</div>
                          <div class="score-bar">
                            <div class="score-fill" [style.width.%]="user.engagementScore"></div>
                          </div>
                        </div>
                      </td>
                    </ng-container>

                    <!-- Churn Risk Column -->
                    <ng-container matColumnDef="churnRisk">
                      <th mat-header-cell *matHeaderCellDef mat-sort-header="churnRisk">Churn Risk</th>
                      <td mat-cell *matCellDef="let user">
                        <mat-chip [ngClass]="'risk-' + user.churnRisk">
                          <mat-icon class="risk-icon">{{ getChurnRiskIcon(user.churnRisk) }}</mat-icon>
                          {{ user.churnRisk | titlecase }}
                        </mat-chip>
                      </td>
                    </ng-container>

                    <!-- Last Activity Column -->
                    <ng-container matColumnDef="lastActivity">
                      <th mat-header-cell *matHeaderCellDef mat-sort-header="lastLogin">Last Activity</th>
                      <td mat-cell *matCellDef="let user">
                        <div class="last-activity">
                          <div class="activity-date">{{ user.lastLogin | date:'short' }}</div>
                          <div class="activity-ago">{{ getTimeAgo(user.lastLogin) }}</div>
                        </div>
                      </td>
                    </ng-container>

                    <!-- Tags Column -->
                    <ng-container matColumnDef="tags">
                      <th mat-header-cell *matHeaderCellDef>Tags</th>
                      <td mat-cell *matCellDef="let user">
                        <div class="user-tags">
                          <mat-chip *ngFor="let tag of user.tags.slice(0, 2)" class="user-tag">
                            {{ tag }}
                          </mat-chip>
                          <mat-chip *ngIf="user.tags.length > 2" class="more-tags" 
                                   [matTooltip]="user.tags.slice(2).join(', ')">
                            +{{ user.tags.length - 2 }}
                          </mat-chip>
                        </div>
                      </td>
                    </ng-container>

                    <!-- Actions Column -->
                    <ng-container matColumnDef="actions">
                      <th mat-header-cell *matHeaderCellDef>Actions</th>
                      <td mat-cell *matCellDef="let user">
                        <button mat-icon-button [matMenuTriggerFor]="userActionsMenu">
                          <mat-icon>more_vert</mat-icon>
                        </button>
                        <mat-menu #userActionsMenu="matMenu">
                          <button mat-menu-item (click)="viewUserDetails(user)">
                            <mat-icon>visibility</mat-icon>
                            View Details
                          </button>
                          <button mat-menu-item (click)="editUser(user)">
                            <mat-icon>edit</mat-icon>
                            Edit User
                          </button>
                          <button mat-menu-item (click)="viewSubscription(user)">
                            <mat-icon>payment</mat-icon>
                            Subscription
                          </button>
                          <button mat-menu-item (click)="viewActivity(user)">
                            <mat-icon>timeline</mat-icon>
                            Activity Timeline
                          </button>
                          <button mat-menu-item (click)="contactUser(user)">
                            <mat-icon>email</mat-icon>
                            Contact User
                          </button>
                          <mat-divider></mat-divider>
                          <button mat-menu-item (click)="suspendUser(user)" *ngIf="user.accountStatus === 'active'">
                            <mat-icon>block</mat-icon>
                            Suspend User
                          </button>
                          <button mat-menu-item (click)="activateUser(user)" *ngIf="user.accountStatus !== 'active'">
                            <mat-icon>check_circle</mat-icon>
                            Activate User
                          </button>
                        </mat-menu>
                      </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: displayedColumns;" 
                        (click)="viewUserDetails(row)" 
                        class="user-row"></tr>
                  </table>

                  <mat-paginator [pageSizeOptions]="[10, 25, 50, 100]" 
                                 [pageSize]="pageSize"
                                 showFirstLastButtons>
                  </mat-paginator>
                </div>
              </div>
            </mat-tab>

            <!-- Analytics Tab -->
            <mat-tab label="User Analytics">
              <div class="tab-content">
                <div class="analytics-grid">
                  <!-- User Growth Chart -->
                  <mat-card class="chart-card">
                    <mat-card-header>
                      <mat-card-title>User Growth</mat-card-title>
                      <mat-card-subtitle>Registration trends over time</mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="chart-container">
                        <canvas #userGrowthChart></canvas>
                      </div>
                    </mat-card-content>
                  </mat-card>

                  <!-- Engagement Distribution -->
                  <mat-card class="chart-card">
                    <mat-card-header>
                      <mat-card-title>Engagement Distribution</mat-card-title>
                      <mat-card-subtitle>User engagement levels</mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="chart-container">
                        <canvas #engagementChart></canvas>
                      </div>
                    </mat-card-content>
                  </mat-card>

                  <!-- Churn Risk Analysis -->
                  <mat-card class="chart-card">
                    <mat-card-header>
                      <mat-card-title>Churn Risk Analysis</mat-card-title>
                      <mat-card-subtitle>Risk level distribution</mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="chart-container">
                        <canvas #churnRiskChart></canvas>
                      </div>
                    </mat-card-content>
                  </mat-card>

                  <!-- Geographic Distribution -->
                  <mat-card class="chart-card">
                    <mat-card-header>
                      <mat-card-title>Geographic Distribution</mat-card-title>
                      <mat-card-subtitle>Users by country/region</mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="chart-container">
                        <canvas #geographicChart></canvas>
                      </div>
                    </mat-card-content>
                  </mat-card>
                </div>
              </div>
            </mat-tab>

            <!-- Health Scores Tab -->
            <mat-tab label="Health Scores">
              <div class="tab-content">
                <div class="health-scores-content">
                  <mat-card class="health-overview-card">
                    <mat-card-header>
                      <mat-card-title>User Health Overview</mat-card-title>
                      <mat-card-subtitle>Comprehensive user health monitoring</mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="health-metrics">
                        <div class="health-metric">
                          <div class="metric-icon">
                            <mat-icon class="engagement-icon">trending_up</mat-icon>
                          </div>
                          <div class="metric-info">
                            <div class="metric-title">Average Engagement Health</div>
                            <div class="metric-value">{{ averageHealthScores.engagement | number:'1.0-0' }}/100</div>
                            <div class="metric-trend positive">+5.2% from last month</div>
                          </div>
                        </div>

                        <div class="health-metric">
                          <div class="metric-icon">
                            <mat-icon class="satisfaction-icon">sentiment_satisfied</mat-icon>
                          </div>
                          <div class="metric-info">
                            <div class="metric-title">Customer Satisfaction</div>
                            <div class="metric-value">{{ averageHealthScores.satisfaction | number:'1.0-0' }}/100</div>
                            <div class="metric-trend positive">+2.8% from last month</div>
                          </div>
                        </div>

                        <div class="health-metric">
                          <div class="metric-icon">
                            <mat-icon class="financial-icon">account_balance</mat-icon>
                          </div>
                          <div class="metric-info">
                            <div class="metric-title">Financial Health</div>
                            <div class="metric-value">{{ averageHealthScores.financial | number:'1.0-0' }}/100</div>
                            <div class="metric-trend stable">No change</div>
                          </div>
                        </div>

                        <div class="health-metric">
                          <div class="metric-icon">
                            <mat-icon class="technical-icon">settings</mat-icon>
                          </div>
                          <div class="metric-info">
                            <div class="metric-title">Technical Health</div>
                            <div class="metric-value">{{ averageHealthScores.technical | number:'1.0-0' }}/100</div>
                            <div class="metric-trend positive">+1.5% from last month</div>
                          </div>
                        </div>
                      </div>
                    </mat-card-content>
                  </mat-card>

                  <!-- Health Score Chart -->
                  <mat-card class="health-chart-card">
                    <mat-card-header>
                      <mat-card-title>Health Score Trends</mat-card-title>
                      <mat-card-subtitle>Monthly health score evolution</mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="chart-container">
                        <canvas #healthTrendChart></canvas>
                      </div>
                    </mat-card-content>
                  </mat-card>

                  <!-- At-Risk Users -->
                  <mat-card class="at-risk-users-card">
                    <mat-card-header>
                      <mat-card-title>Users Requiring Attention</mat-card-title>
                      <mat-card-subtitle>Low health scores or declining trends</mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="at-risk-list">
                        <div class="at-risk-user" *ngFor="let user of atRiskUsers">
                          <div class="user-avatar-small">
                            <img [src]="user.avatar || '/assets/default-avatar.png'" [alt]="user.displayName">
                          </div>
                          <div class="user-details">
                            <div class="user-name">{{ user.displayName }}</div>
                            <div class="user-email">{{ user.email }}</div>
                          </div>
                          <div class="health-score-small">
                            <div class="score-value">{{ user.healthScore?.overallScore || 0 }}</div>
                            <div class="score-trend" [ngClass]="user.healthScore?.trend">
                              <mat-icon>{{ getHealthTrendIcon(user.healthScore?.trend) }}</mat-icon>
                            </div>
                          </div>
                          <div class="user-actions-small">
                            <button mat-icon-button (click)="viewUserHealth(user)" matTooltip="View Details">
                              <mat-icon>visibility</mat-icon>
                            </button>
                            <button mat-icon-button (click)="contactUser(user)" matTooltip="Contact User">
                              <mat-icon>email</mat-icon>
                            </button>
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
  styleUrls: ['./user-management-dashboard.component.scss']
})
export class UserManagementDashboardComponent implements OnInit, OnDestroy {
  @ViewChild('userGrowthChart', { static: false }) userGrowthChartRef!: ElementRef;
  @ViewChild('engagementChart', { static: false }) engagementChartRef!: ElementRef;
  @ViewChild('churnRiskChart', { static: false }) churnRiskChartRef!: ElementRef;
  @ViewChild('geographicChart', { static: false }) geographicChartRef!: ElementRef;
  @ViewChild('healthTrendChart', { static: false }) healthTrendChartRef!: ElementRef;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Form and data properties
  filterForm: FormGroup;
  dataSource = new MatTableDataSource<UserProfile>();
  selection = new SelectionModel<UserProfile>(true, []);
  isLoading = true;
  pageSize = 25;

  // Chart instances
  userGrowthChart: Chart | null = null;
  engagementChart: Chart | null = null;
  churnRiskChart: Chart | null = null;
  geographicChart: Chart | null = null;
  healthTrendChart: Chart | null = null;

  // Data properties
  users: UserProfile[] = [];
  analytics: UserAnalytics | null = null;
  atRiskUsers: (UserProfile & { healthScore?: UserHealthScore })[] = [];
  averageHealthScores = {
    engagement: 78,
    satisfaction: 82,
    technical: 91,
    financial: 94
  };

  // Table configuration
  displayedColumns: string[] = [
    'select', 'avatar', 'userInfo', 'status', 'subscription', 
    'engagement', 'churnRisk', 'lastActivity', 'tags', 'actions'
  ];

  // Bulk actions configuration
  bulkActions: BulkAction[] = [
    {
      id: 'update_status',
      name: 'Update Status',
      description: 'Change account status for selected users',
      icon: 'account_circle',
      requiresConfirmation: true,
      type: 'status_change'
    },
    {
      id: 'add_tags',
      name: 'Add Tags',
      description: 'Add tags to selected users',
      icon: 'label',
      requiresConfirmation: false,
      type: 'tag_management'
    },
    {
      id: 'send_email',
      name: 'Send Email',
      description: 'Send bulk email to selected users',
      icon: 'email',
      requiresConfirmation: true,
      type: 'communication'
    }
  ];

  // Subscriptions
  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.filterForm = this.fb.group({
      searchTerm: [''],
      accountStatus: [[]],
      subscriptionTier: [[]],
      churnRisk: [[]],
      engagementRange: [{ min: 0, max: 100 }],
      tags: [[]],
      hasSubscription: [null]
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
      await this.loadUserData();
      await this.loadAnalytics();
      this.setupDataSource();
      setTimeout(() => {
        this.initializeCharts();
      }, 100);
    } catch (error) {
      console.error('Failed to initialize component:', error);
      this.showError('Failed to load user data');
    } finally {
      this.isLoading = false;
    }
  }

  private setupAutoRefresh(): void {
    // Refresh data every 5 minutes
    const refreshInterval = interval(5 * 60 * 1000);
    this.subscriptions.add(
      refreshInterval.subscribe(() => {
        this.refreshData();
      })
    );
  }

  private setupDataSource(): void {
    this.dataSource.data = this.users;
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // Custom filter predicate
    this.dataSource.filterPredicate = (user: UserProfile, filter: string) => {
      const filterObj = JSON.parse(filter);
      
      // Search term filter
      if (filterObj.searchTerm) {
        const searchLower = filterObj.searchTerm.toLowerCase();
        const matchesSearch = 
          user.displayName.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          (user.company && user.company.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filterObj.accountStatus && filterObj.accountStatus.length > 0) {
        if (!filterObj.accountStatus.includes(user.accountStatus)) return false;
      }

      // Subscription tier filter
      if (filterObj.subscriptionTier && filterObj.subscriptionTier.length > 0) {
        if (!user.subscription || !filterObj.subscriptionTier.includes(user.subscription.tier)) {
          return false;
        }
      }

      // Churn risk filter
      if (filterObj.churnRisk && filterObj.churnRisk.length > 0) {
        if (!filterObj.churnRisk.includes(user.churnRisk)) return false;
      }

      // Has subscription filter
      if (filterObj.hasSubscription !== null) {
        const hasSubscription = !!user.subscription;
        if (hasSubscription !== filterObj.hasSubscription) return false;
      }

      return true;
    };
  }

  async refreshData(): Promise<void> {
    try {
      await this.loadUserData();
      await this.loadAnalytics();
      this.dataSource.data = this.users;
      this.updateCharts();
    } catch (error) {
      console.error('Failed to refresh data:', error);
      this.showError('Failed to refresh user data');
    }
  }

  onTabChange(event: any): void {
    setTimeout(() => {
      this.updateChartsForTab(event.index);
    }, 100);
  }

  applyFilters(): void {
    const filterValue = JSON.stringify(this.filterForm.value);
    this.dataSource.filter = filterValue;
  }

  clearFilters(): void {
    this.filterForm.reset({
      searchTerm: '',
      accountStatus: [],
      subscriptionTier: [],
      churnRisk: [],
      engagementRange: { min: 0, max: 100 },
      tags: [],
      hasSubscription: null
    });
    this.dataSource.filter = '';
  }

  // Selection methods
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle(): void {
    this.isAllSelected() 
      ? this.selection.clear() 
      : this.dataSource.data.forEach(row => this.selection.select(row));
  }

  clearSelection(): void {
    this.selection.clear();
  }

  // Bulk actions
  performBulkAction(actionId: string): void {
    const selectedUsers = this.selection.selected;
    if (selectedUsers.length === 0) {
      this.showError('No users selected');
      return;
    }

    switch (actionId) {
      case 'update_status':
        this.bulkUpdateStatus(selectedUsers);
        break;
      case 'add_tags':
        this.bulkAddTags(selectedUsers);
        break;
      case 'send_email':
        this.bulkSendEmail(selectedUsers);
        break;
      case 'export_selected':
        this.exportSelectedUsers(selectedUsers);
        break;
    }
  }

  private bulkUpdateStatus(users: UserProfile[]): void {
    // Would open dialog for status selection
    console.log('Bulk update status for', users.length, 'users');
    this.showSuccess(`Status update initiated for ${users.length} users`);
    this.selection.clear();
  }

  private bulkAddTags(users: UserProfile[]): void {
    // Would open dialog for tag selection
    console.log('Bulk add tags for', users.length, 'users');
    this.showSuccess(`Tags added to ${users.length} users`);
    this.selection.clear();
  }

  private bulkSendEmail(users: UserProfile[]): void {
    // Would open email composition dialog
    console.log('Bulk send email to', users.length, 'users');
    this.showSuccess(`Email sent to ${users.length} users`);
    this.selection.clear();
  }

  private exportSelectedUsers(users: UserProfile[]): void {
    // Would trigger export for selected users
    console.log('Export', users.length, 'selected users');
    this.showSuccess(`Export started for ${users.length} users`);
    this.selection.clear();
  }

  // User actions
  viewUserDetails(user: UserProfile): void {
    console.log('View details for user:', user.id);
    // Would open user details dialog
  }

  editUser(user: UserProfile): void {
    console.log('Edit user:', user.id);
    // Would open user edit dialog
  }

  viewSubscription(user: UserProfile): void {
    console.log('View subscription for user:', user.id);
    // Would open subscription details dialog
  }

  viewActivity(user: UserProfile): void {
    console.log('View activity for user:', user.id);
    // Would open activity timeline dialog
  }

  contactUser(user: UserProfile): void {
    console.log('Contact user:', user.id);
    // Would open contact dialog
  }

  suspendUser(user: UserProfile): void {
    console.log('Suspend user:', user.id);
    // Would show confirmation dialog
    this.showSuccess(`User ${user.displayName} has been suspended`);
  }

  activateUser(user: UserProfile): void {
    console.log('Activate user:', user.id);
    user.accountStatus = UserAccountStatus.ACTIVE;
    this.showSuccess(`User ${user.displayName} has been activated`);
  }

  viewUserHealth(user: UserProfile): void {
    console.log('View health for user:', user.id);
    // Would open health details dialog
  }

  // Export methods
  exportUsers(format: 'csv' | 'excel' | 'pdf'): void {
    console.log(`Exporting users as ${format}`);
    this.showSuccess(`User export (${format.toUpperCase()}) has been initiated`);
  }

  // Utility methods
  getStatusLabel(status: UserAccountStatus): string {
    const labels: Record<UserAccountStatus, string> = {
      [UserAccountStatus.ACTIVE]: 'Active',
      [UserAccountStatus.INACTIVE]: 'Inactive',
      [UserAccountStatus.SUSPENDED]: 'Suspended',
      [UserAccountStatus.PENDING_VERIFICATION]: 'Pending',
      [UserAccountStatus.DEACTIVATED]: 'Deactivated',
      [UserAccountStatus.BANNED]: 'Banned'
    };
    return labels[status] || status;
  }

  getChurnRiskIcon(risk: ChurnRiskLevel): string {
    const icons: Record<ChurnRiskLevel, string> = {
      [ChurnRiskLevel.LOW]: 'check_circle',
      [ChurnRiskLevel.MEDIUM]: 'warning',
      [ChurnRiskLevel.HIGH]: 'error',
      [ChurnRiskLevel.CRITICAL]: 'dangerous'
    };
    return icons[risk] || 'help';
  }

  getHealthTrendIcon(trend?: string): string {
    const icons: Record<string, string> = {
      'improving': 'trending_up',
      'stable': 'trending_flat',
      'declining': 'trending_down'
    };
    return icons[trend || 'stable'] || 'trending_flat';
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  // Chart methods
  private initializeCharts(): void {
    this.initializeUserGrowthChart();
    this.initializeEngagementChart();
    this.initializeChurnRiskChart();
    this.initializeGeographicChart();
    this.initializeHealthTrendChart();
  }

  private initializeUserGrowthChart(): void {
    if (this.userGrowthChartRef?.nativeElement) {
      const ctx = this.userGrowthChartRef.nativeElement.getContext('2d');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const data = [120, 145, 167, 189, 210, 234];
      
      this.userGrowthChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: months,
          datasets: [{
            label: 'New Users',
            data: data,
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
            legend: { display: false }
          },
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
    }
  }

  private initializeEngagementChart(): void {
    if (this.engagementChartRef?.nativeElement) {
      const ctx = this.engagementChartRef.nativeElement.getContext('2d');
      
      this.engagementChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['High Engagement', 'Medium Engagement', 'Low Engagement'],
          datasets: [{
            data: [45, 35, 20],
            backgroundColor: ['#4caf50', '#ff9800', '#f44336']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' }
          }
        }
      });
    }
  }

  private initializeChurnRiskChart(): void {
    if (this.churnRiskChartRef?.nativeElement) {
      const ctx = this.churnRiskChartRef.nativeElement.getContext('2d');
      
      this.churnRiskChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Low Risk', 'Medium Risk', 'High Risk', 'Critical'],
          datasets: [{
            label: 'Users',
            data: [156, 78, 23, 5],
            backgroundColor: ['#4caf50', '#ff9800', '#f44336', '#9c27b0']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
    }
  }

  private initializeGeographicChart(): void {
    if (this.geographicChartRef?.nativeElement) {
      const ctx = this.geographicChartRef.nativeElement.getContext('2d');
      
      this.geographicChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: ['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'Other'],
          datasets: [{
            data: [45, 18, 12, 8, 7, 10],
            backgroundColor: [
              '#1976d2', '#388e3c', '#f57c00', 
              '#7b1fa2', '#c2185b', '#757575'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' }
          }
        }
      });
    }
  }

  private initializeHealthTrendChart(): void {
    if (this.healthTrendChartRef?.nativeElement) {
      const ctx = this.healthTrendChartRef.nativeElement.getContext('2d');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      
      this.healthTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: months,
          datasets: [
            {
              label: 'Engagement',
              data: [75, 77, 76, 78, 79, 78],
              borderColor: '#1976d2',
              backgroundColor: 'rgba(25, 118, 210, 0.1)'
            },
            {
              label: 'Satisfaction',
              data: [80, 82, 81, 83, 82, 82],
              borderColor: '#4caf50',
              backgroundColor: 'rgba(76, 175, 80, 0.1)'
            },
            {
              label: 'Financial',
              data: [92, 93, 94, 94, 95, 94],
              borderColor: '#ff9800',
              backgroundColor: 'rgba(255, 152, 0, 0.1)'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' }
          },
          scales: {
            y: { beginAtZero: true, max: 100 }
          }
        }
      });
    }
  }

  private updateCharts(): void {
    // Update chart data with real data
    if (this.userGrowthChart) this.userGrowthChart.update();
    if (this.engagementChart) this.engagementChart.update();
    if (this.churnRiskChart) this.churnRiskChart.update();
    if (this.geographicChart) this.geographicChart.update();
    if (this.healthTrendChart) this.healthTrendChart.update();
  }

  private updateChartsForTab(tabIndex: number): void {
    switch (tabIndex) {
      case 1: // Analytics tab
        if (this.userGrowthChart) this.userGrowthChart.resize();
        if (this.engagementChart) this.engagementChart.resize();
        if (this.churnRiskChart) this.churnRiskChart.resize();
        if (this.geographicChart) this.geographicChart.resize();
        break;
      case 2: // Health scores tab
        if (this.healthTrendChart) this.healthTrendChart.resize();
        break;
    }
  }

  private destroyCharts(): void {
    if (this.userGrowthChart) this.userGrowthChart.destroy();
    if (this.engagementChart) this.engagementChart.destroy();
    if (this.churnRiskChart) this.churnRiskChart.destroy();
    if (this.geographicChart) this.geographicChart.destroy();
    if (this.healthTrendChart) this.healthTrendChart.destroy();
  }

  // Mock data loading methods
  private async loadUserData(): Promise<void> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.users = [
      {
        id: 'user_001',
        email: 'john.smith@techcorp.com',
        firstName: 'John',
        lastName: 'Smith',
        displayName: 'John Smith',
        avatar: 'https://via.placeholder.com/40',
        company: 'TechCorp Inc.',
        jobTitle: 'Senior Software Engineer',
        accountStatus: UserAccountStatus.ACTIVE,
        subscription: {
          id: 'sub_001',
          tier: 'foundation',
          status: 'active',
          amount: 24.95,
          currency: 'USD',
          billingCycle: 'monthly',
          nextBillingDate: new Date('2024-04-01'),
          cancelAtPeriodEnd: false
        },
        lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000),
        registrationDate: new Date('2024-01-15'),
        engagementScore: 89,
        churnRisk: ChurnRiskLevel.LOW,
        lifetimeValue: 149.70,
        supportTickets: 2,
        tags: ['high-value', 'beta-tester', 'enterprise-prospect']
      },
      {
        id: 'user_002',
        email: 'sarah.johnson@startup.io',
        firstName: 'Sarah',
        lastName: 'Johnson',
        displayName: 'Sarah Johnson',
        company: 'StartupIO',
        jobTitle: 'Product Manager',
        accountStatus: UserAccountStatus.ACTIVE,
        subscription: {
          id: 'sub_002',
          tier: 'advanced',
          status: 'trialing',
          amount: 99.95,
          currency: 'USD',
          billingCycle: 'monthly',
          nextBillingDate: new Date('2024-03-29'),
          cancelAtPeriodEnd: false
        },
        lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000),
        registrationDate: new Date('2024-02-20'),
        engagementScore: 76,
        churnRisk: ChurnRiskLevel.MEDIUM,
        lifetimeValue: 0,
        supportTickets: 0,
        tags: ['new-user', 'high-engagement', 'trial']
      }
      // Add more mock users as needed
    ];

    // Generate at-risk users
    this.atRiskUsers = this.users
      .filter(user => user.churnRisk === ChurnRiskLevel.HIGH || user.churnRisk === ChurnRiskLevel.CRITICAL)
      .map(user => ({
        ...user,
        healthScore: {
          userId: user.id,
          overallScore: Math.floor(Math.random() * 30) + 40, // 40-70 for at-risk
          components: {
            engagement: Math.floor(Math.random() * 40) + 30,
            satisfaction: Math.floor(Math.random() * 40) + 40,
            technical: Math.floor(Math.random() * 20) + 70,
            financial: Math.floor(Math.random() * 30) + 60
          },
          trend: Math.random() > 0.5 ? 'declining' : 'stable',
          recommendations: ['Increase engagement', 'Provide support', 'Offer incentives']
        }
      }));
  }

  private async loadAnalytics(): Promise<void> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    this.analytics = {
      totalUsers: this.users.length,
      activeUsers: this.users.filter(u => u.accountStatus === UserAccountStatus.ACTIVE).length,
      newUsersThisMonth: 23,
      churnRate: 3.2,
      averageEngagement: 78.5,
      revenuePerUser: 68.50,
      statusDistribution: {
        [UserAccountStatus.ACTIVE]: this.users.filter(u => u.accountStatus === UserAccountStatus.ACTIVE).length,
        [UserAccountStatus.INACTIVE]: 0,
        [UserAccountStatus.SUSPENDED]: 0,
        [UserAccountStatus.PENDING_VERIFICATION]: 0,
        [UserAccountStatus.DEACTIVATED]: 0,
        [UserAccountStatus.BANNED]: 0
      },
      tierDistribution: {
        'foundation': 1456,
        'advanced': 156,
        'enterprise': 35
      },
      churnRiskDistribution: {
        [ChurnRiskLevel.LOW]: 1523,
        [ChurnRiskLevel.MEDIUM]: 89,
        [ChurnRiskLevel.HIGH]: 32,
        [ChurnRiskLevel.CRITICAL]: 3
      },
      geographicDistribution: {
        'US': 892,
        'UK': 234,
        'CA': 189,
        'AU': 145,
        'DE': 123
      }
    };
  }
}