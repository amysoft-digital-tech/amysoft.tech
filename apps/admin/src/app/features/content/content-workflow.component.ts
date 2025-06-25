import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snackbar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { SelectionModel } from '@angular/cdk/collections';
import { Subscription, Subject, debounceTime, distinctUntilChanged, interval } from 'rxjs';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

// Content Workflow Interfaces
export interface ContentWorkflow {
  id: string;
  contentId: string;
  contentTitle: string;
  contentType: ContentType;
  currentStage: WorkflowStage;
  stages: WorkflowStageProgress[];
  priority: WorkflowPriority;
  deadline?: Date;
  assignedTo: string[];
  createdBy: string;
  approvers: WorkflowApprover[];
  comments: WorkflowComment[];
  automatedChecks: WorkflowCheck[];
  notifications: WorkflowNotification[];
  metadata: WorkflowMetadata;
  status: WorkflowStatus;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export enum ContentType {
  CHAPTER = 'chapter',
  TEMPLATE = 'template',
  BLOG_POST = 'blog_post',
  MARKETING_PAGE = 'marketing_page',
  EMAIL_TEMPLATE = 'email_template',
  DOCUMENTATION = 'documentation',
  TUTORIAL = 'tutorial',
  CASE_STUDY = 'case_study'
}

export enum WorkflowStage {
  CREATION = 'creation',
  CONTENT_REVIEW = 'content_review',
  TECHNICAL_REVIEW = 'technical_review',
  COPY_EDITING = 'copy_editing',
  FACT_CHECK = 'fact_check',
  SEO_REVIEW = 'seo_review',
  LEGAL_REVIEW = 'legal_review',
  FINAL_APPROVAL = 'final_approval',
  READY_TO_PUBLISH = 'ready_to_publish',
  PUBLISHED = 'published',
  SCHEDULED = 'scheduled'
}

export enum WorkflowPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical'
}

export enum WorkflowStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold'
}

export interface WorkflowStageProgress {
  stage: WorkflowStage;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'skipped';
  assignedTo?: string;
  completedBy?: string;
  startedAt?: Date;
  completedAt?: Date;
  timeSpent?: number;
  estimatedTime?: number;
  notes?: string;
  checklist: WorkflowChecklist[];
  dependencies: string[];
  artifacts: WorkflowArtifact[];
}

export interface WorkflowApprover {
  userId: string;
  name: string;
  role: string;
  stage: WorkflowStage;
  status: 'pending' | 'approved' | 'rejected' | 'delegated';
  approvedAt?: Date;
  comments?: string;
  conditions?: string[];
  priority: number;
}

export interface WorkflowComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  type: 'comment' | 'approval' | 'rejection' | 'suggestion' | 'question';
  content: string;
  stage: WorkflowStage;
  attachments: WorkflowAttachment[];
  mentions: string[];
  reactions: WorkflowReaction[];
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowCheck {
  id: string;
  type: 'automated' | 'manual';
  category: 'seo' | 'accessibility' | 'performance' | 'content_quality' | 'legal' | 'technical';
  name: string;
  description: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'warning' | 'skipped';
  score?: number;
  maxScore?: number;
  details: WorkflowCheckDetail[];
  recommendations: string[];
  runAt?: Date;
  completedAt?: Date;
  nextRunAt?: Date;
  isRequired: boolean;
  isBlocking: boolean;
}

export interface WorkflowNotification {
  id: string;
  type: 'email' | 'in_app' | 'slack' | 'teams';
  trigger: 'stage_change' | 'approval_needed' | 'deadline_approaching' | 'overdue' | 'completed';
  recipients: string[];
  template: string;
  data: Record<string, any>;
  sentAt?: Date;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
}

export interface WorkflowMetadata {
  estimatedDuration: number;
  actualDuration?: number;
  complexity: 'simple' | 'moderate' | 'complex' | 'highly_complex';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  businessImpact: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  customFields: Record<string, any>;
  analytics: WorkflowAnalytics;
}

export interface WorkflowChecklist {
  id: string;
  item: string;
  description?: string;
  isRequired: boolean;
  isCompleted: boolean;
  completedBy?: string;
  completedAt?: Date;
  evidence?: string[];
  dependencies: string[];
}

export interface WorkflowArtifact {
  id: string;
  name: string;
  type: 'document' | 'image' | 'video' | 'link' | 'data';
  url: string;
  size?: number;
  mimeType?: string;
  uploadedBy: string;
  uploadedAt: Date;
  version: number;
  isRequired: boolean;
}

export interface WorkflowAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date;
}

export interface WorkflowReaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface WorkflowCheckDetail {
  key: string;
  label: string;
  value: any;
  status: 'passed' | 'failed' | 'warning';
  message?: string;
  suggestion?: string;
}

export interface WorkflowAnalytics {
  stageTransitions: WorkflowStageTransition[];
  bottlenecks: WorkflowBottleneck[];
  efficiency: WorkflowEfficiency;
  qualityMetrics: WorkflowQualityMetrics;
}

export interface WorkflowStageTransition {
  fromStage: WorkflowStage;
  toStage: WorkflowStage;
  duration: number;
  timestamp: Date;
  triggeredBy: string;
  reason?: string;
}

export interface WorkflowBottleneck {
  stage: WorkflowStage;
  averageWaitTime: number;
  backlogCount: number;
  utilizationRate: number;
  suggestions: string[];
}

export interface WorkflowEfficiency {
  cycleTime: number;
  leadTime: number;
  throughput: number;
  workInProgress: number;
  velocityTrend: number[];
}

export interface WorkflowQualityMetrics {
  defectRate: number;
  reworkRate: number;
  customerSatisfaction: number;
  firstPassYield: number;
  qualityScore: number;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  contentTypes: ContentType[];
  stages: WorkflowStageTemplate[];
  defaultApprovers: Record<WorkflowStage, string[]>;
  estimatedDuration: number;
  complexity: string;
  tags: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
}

export interface WorkflowStageTemplate {
  stage: WorkflowStage;
  name: string;
  description: string;
  estimatedTime: number;
  isRequired: boolean;
  canSkip: boolean;
  checklist: string[];
  automatedChecks: string[];
  approvalRequired: boolean;
  parallelWith: WorkflowStage[];
  dependencies: WorkflowStage[];
}

@Component({
  selector: 'app-content-workflow',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatDatepickerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatMenuModule,
    MatSlideToggleModule,
    MatExpansionModule,
    MatBadgeModule,
    MatDividerModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCheckboxModule,
    DragDropModule
  ],
  template: `
    <div class="workflow-container">
      <!-- Header -->
      <mat-card class="workflow-header">
        <mat-card-header>
          <div class="header-content">
            <div class="header-info">
              <h2>Content Workflow Management</h2>
              <p class="header-subtitle">Manage content approval workflows and publishing processes</p>
            </div>
            <div class="header-actions">
              <button mat-raised-button color="primary" (click)="createWorkflow()">
                <mat-icon>add</mat-icon>
                New Workflow
              </button>
              <button mat-button (click)="manageTemplates()">
                <mat-icon>settings</mat-icon>
                Templates
              </button>
              <button mat-icon-button [matMenuTriggerFor]="headerMenu">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #headerMenu="matMenu">
                <button mat-menu-item (click)="exportWorkflows()">
                  <mat-icon>download</mat-icon>
                  Export Workflows
                </button>
                <button mat-menu-item (click)="importWorkflows()">
                  <mat-icon>upload</mat-icon>
                  Import Workflows
                </button>
                <button mat-menu-item (click)="bulkOperations()">
                  <mat-icon>select_all</mat-icon>
                  Bulk Operations
                </button>
                <mat-divider></mat-divider>
                <button mat-menu-item (click)="workflowSettings()">
                  <mat-icon>tune</mat-icon>
                  Settings
                </button>
              </mat-menu>
            </div>
          </div>
        </mat-card-header>
      </mat-card>

      <!-- Workflow Dashboard -->
      <div class="workflow-dashboard">
        <mat-tab-group [(selectedIndex)]="selectedTabIndex" (selectedTabChange)="onTabChange($event)">
          <!-- Active Workflows Tab -->
          <mat-tab label="Active Workflows">
            <ng-template matTabContent>
              <div class="tab-content">
                <!-- Filters and Search -->
                <mat-card class="filters-card">
                  <div class="filters-container">
                    <mat-form-field appearance="outline" class="search-field">
                      <mat-label>Search workflows...</mat-label>
                      <input matInput [formControl]="searchControl" placeholder="Search by title, assignee, or stage">
                      <mat-icon matSuffix>search</mat-icon>
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline">
                      <mat-label>Status</mat-label>
                      <mat-select [formControl]="statusFilterControl" multiple>
                        <mat-option *ngFor="let status of workflowStatuses" [value]="status.value">
                          {{status.label}}
                        </mat-option>
                      </mat-select>
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline">
                      <mat-label>Priority</mat-label>
                      <mat-select [formControl]="priorityFilterControl" multiple>
                        <mat-option *ngFor="let priority of workflowPriorities" [value]="priority.value">
                          {{priority.label}}
                        </mat-option>
                      </mat-select>
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline">
                      <mat-label>Assignee</mat-label>
                      <mat-select [formControl]="assigneeFilterControl" multiple>
                        <mat-option *ngFor="let user of availableUsers" [value]="user.id">
                          {{user.name}}
                        </mat-option>
                      </mat-select>
                    </mat-form-field>
                    
                    <button mat-button (click)="clearFilters()">
                      <mat-icon>clear</mat-icon>
                      Clear Filters
                    </button>
                  </div>
                </mat-card>

                <!-- Workflow Kanban Board -->
                <div class="kanban-container" *ngIf="viewMode === 'kanban'">
                  <div class="kanban-board">
                    <div class="kanban-column" *ngFor="let stage of workflowStages" 
                         cdkDropList 
                         [cdkDropListData]="getWorkflowsByStage(stage.value)"
                         (cdkDropListDropped)="dropWorkflow($event, stage.value)">
                      <div class="column-header">
                        <h3>{{stage.label}}</h3>
                        <mat-chip-listbox>
                          <mat-chip>{{getWorkflowsByStage(stage.value).length}}</mat-chip>
                        </mat-chip-listbox>
                      </div>
                      
                      <div class="workflow-cards">
                        <mat-card class="workflow-card" 
                                  *ngFor="let workflow of getWorkflowsByStage(stage.value)"
                                  cdkDrag
                                  (click)="openWorkflowDetails(workflow)">
                          <mat-card-header>
                            <div class="workflow-card-header">
                              <h4>{{workflow.contentTitle}}</h4>
                              <mat-chip-listbox>
                                <mat-chip [ngClass]="'priority-' + workflow.priority">
                                  {{workflow.priority}}
                                </mat-chip>
                              </mat-chip-listbox>
                            </div>
                          </mat-card-header>
                          
                          <mat-card-content>
                            <div class="workflow-card-content">
                              <div class="workflow-meta">
                                <span class="content-type">{{workflow.contentType}}</span>
                                <span class="workflow-id">#{{workflow.id.substring(0, 8)}}</span>
                              </div>
                              
                              <div class="workflow-progress">
                                <mat-progress-bar 
                                  [value]="getWorkflowProgress(workflow)"
                                  [color]="getProgressColor(workflow)">
                                </mat-progress-bar>
                                <span class="progress-text">{{getWorkflowProgress(workflow)}}% Complete</span>
                              </div>
                              
                              <div class="workflow-assignees">
                                <div class="assignee-avatars">
                                  <div class="assignee-avatar" 
                                       *ngFor="let assignee of workflow.assignedTo.slice(0, 3)"
                                       [title]="getUserName(assignee)">
                                    {{getUserInitials(assignee)}}
                                  </div>
                                  <div class="assignee-overflow" 
                                       *ngIf="workflow.assignedTo.length > 3"
                                       [title]="getOverflowAssignees(workflow)">
                                    +{{workflow.assignedTo.length - 3}}
                                  </div>
                                </div>
                              </div>
                              
                              <div class="workflow-timing" *ngIf="workflow.deadline">
                                <mat-icon [ngClass]="getDeadlineClass(workflow.deadline)">schedule</mat-icon>
                                <span [ngClass]="getDeadlineClass(workflow.deadline)">
                                  {{formatDeadline(workflow.deadline)}}
                                </span>
                              </div>
                            </div>
                          </mat-card-content>
                          
                          <mat-card-actions>
                            <button mat-icon-button (click)="quickAction(workflow, $event)">
                              <mat-icon>more_horiz</mat-icon>
                            </button>
                            <button mat-icon-button 
                                    *ngIf="workflow.comments.length > 0"
                                    [matBadge]="workflow.comments.length"
                                    matBadgeSize="small">
                              <mat-icon>comment</mat-icon>
                            </button>
                            <button mat-icon-button 
                                    *ngIf="hasFailedChecks(workflow)"
                                    matBadgeColor="warn"
                                    matBadge="!"
                                    matBadgeSize="small">
                              <mat-icon>warning</mat-icon>
                            </button>
                          </mat-card-actions>
                        </mat-card>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Workflow Table View -->
                <div class="table-container" *ngIf="viewMode === 'table'">
                  <mat-card>
                    <table mat-table [dataSource]="workflowDataSource" class="workflow-table">
                      <!-- Selection Column -->
                      <ng-container matColumnDef="select">
                        <th mat-header-cell *matHeaderCellDef>
                          <mat-checkbox (change)="$event ? masterToggle() : null"
                                        [checked]="workflowSelection.hasValue() && isAllSelected()"
                                        [indeterminate]="workflowSelection.hasValue() && !isAllSelected()">
                          </mat-checkbox>
                        </th>
                        <td mat-cell *matCellDef="let workflow">
                          <mat-checkbox (click)="$event.stopPropagation()"
                                        (change)="$event ? workflowSelection.toggle(workflow) : null"
                                        [checked]="workflowSelection.isSelected(workflow)">
                          </mat-checkbox>
                        </td>
                      </ng-container>

                      <!-- Content Title Column -->
                      <ng-container matColumnDef="contentTitle">
                        <th mat-header-cell *matHeaderCellDef mat-sort-header>Content</th>
                        <td mat-cell *matCellDef="let workflow">
                          <div class="content-cell">
                            <span class="content-title">{{workflow.contentTitle}}</span>
                            <span class="content-id">#{{workflow.id.substring(0, 8)}}</span>
                          </div>
                        </td>
                      </ng-container>

                      <!-- Type Column -->
                      <ng-container matColumnDef="type">
                        <th mat-header-cell *matHeaderCellDef>Type</th>
                        <td mat-cell *matCellDef="let workflow">
                          <mat-chip-listbox>
                            <mat-chip>{{workflow.contentType}}</mat-chip>
                          </mat-chip-listbox>
                        </td>
                      </ng-container>

                      <!-- Stage Column -->
                      <ng-container matColumnDef="stage">
                        <th mat-header-cell *matHeaderCellDef>Current Stage</th>
                        <td mat-cell *matCellDef="let workflow">
                          <mat-chip-listbox>
                            <mat-chip [ngClass]="'stage-' + workflow.currentStage">
                              {{getStageLabel(workflow.currentStage)}}
                            </mat-chip>
                          </mat-chip-listbox>
                        </td>
                      </ng-container>

                      <!-- Priority Column -->
                      <ng-container matColumnDef="priority">
                        <th mat-header-cell *matHeaderCellDef>Priority</th>
                        <td mat-cell *matCellDef="let workflow">
                          <mat-chip-listbox>
                            <mat-chip [ngClass]="'priority-' + workflow.priority">
                              {{workflow.priority}}
                            </mat-chip>
                          </mat-chip-listbox>
                        </td>
                      </ng-container>

                      <!-- Assignees Column -->
                      <ng-container matColumnDef="assignees">
                        <th mat-header-cell *matHeaderCellDef>Assignees</th>
                        <td mat-cell *matCellDef="let workflow">
                          <div class="table-assignees">
                            <div class="assignee-avatar" 
                                 *ngFor="let assignee of workflow.assignedTo.slice(0, 2)"
                                 [title]="getUserName(assignee)">
                              {{getUserInitials(assignee)}}
                            </div>
                            <span *ngIf="workflow.assignedTo.length > 2" class="assignee-count">
                              +{{workflow.assignedTo.length - 2}}
                            </span>
                          </div>
                        </td>
                      </ng-container>

                      <!-- Progress Column -->
                      <ng-container matColumnDef="progress">
                        <th mat-header-cell *matHeaderCellDef>Progress</th>
                        <td mat-cell *matCellDef="let workflow">
                          <div class="progress-cell">
                            <mat-progress-bar 
                              [value]="getWorkflowProgress(workflow)"
                              [color]="getProgressColor(workflow)">
                            </mat-progress-bar>
                            <span class="progress-percentage">{{getWorkflowProgress(workflow)}}%</span>
                          </div>
                        </td>
                      </ng-container>

                      <!-- Deadline Column -->
                      <ng-container matColumnDef="deadline">
                        <th mat-header-cell *matHeaderCellDef>Deadline</th>
                        <td mat-cell *matCellDef="let workflow">
                          <span *ngIf="workflow.deadline" 
                                [ngClass]="getDeadlineClass(workflow.deadline)">
                            {{formatDeadline(workflow.deadline)}}
                          </span>
                          <span *ngIf="!workflow.deadline" class="no-deadline">No deadline</span>
                        </td>
                      </ng-container>

                      <!-- Actions Column -->
                      <ng-container matColumnDef="actions">
                        <th mat-header-cell *matHeaderCellDef>Actions</th>
                        <td mat-cell *matCellDef="let workflow">
                          <button mat-icon-button [matMenuTriggerFor]="workflowMenu" 
                                  (click)="$event.stopPropagation()">
                            <mat-icon>more_vert</mat-icon>
                          </button>
                          <mat-menu #workflowMenu="matMenu">
                            <button mat-menu-item (click)="editWorkflow(workflow)">
                              <mat-icon>edit</mat-icon>
                              Edit
                            </button>
                            <button mat-menu-item (click)="assignWorkflow(workflow)">
                              <mat-icon>person_add</mat-icon>
                              Assign
                            </button>
                            <button mat-menu-item (click)="duplicateWorkflow(workflow)">
                              <mat-icon>content_copy</mat-icon>
                              Duplicate
                            </button>
                            <mat-divider></mat-divider>
                            <button mat-menu-item (click)="pauseWorkflow(workflow)" 
                                    *ngIf="workflow.status === 'active'">
                              <mat-icon>pause</mat-icon>
                              Pause
                            </button>
                            <button mat-menu-item (click)="resumeWorkflow(workflow)" 
                                    *ngIf="workflow.status === 'paused'">
                              <mat-icon>play_arrow</mat-icon>
                              Resume
                            </button>
                            <button mat-menu-item (click)="cancelWorkflow(workflow)" 
                                    class="warn-action">
                              <mat-icon>cancel</mat-icon>
                              Cancel
                            </button>
                          </mat-menu>
                        </td>
                      </ng-container>

                      <tr mat-header-row *matHeaderRowDef="workflowDisplayedColumns"></tr>
                      <tr mat-row *matRowDef="let workflow; columns: workflowDisplayedColumns;"
                          (click)="openWorkflowDetails(workflow)"
                          class="workflow-row"></tr>
                    </table>
                  </mat-card>
                </div>

                <!-- View Mode Toggle -->
                <div class="view-controls">
                  <mat-button-toggle-group [value]="viewMode" (change)="changeViewMode($event)">
                    <mat-button-toggle value="kanban">
                      <mat-icon>view_kanban</mat-icon>
                      Kanban
                    </mat-button-toggle>
                    <mat-button-toggle value="table">
                      <mat-icon>table_view</mat-icon>
                      Table
                    </mat-button-toggle>
                  </mat-button-toggle-group>
                </div>
              </div>
            </ng-template>
          </mat-tab>

          <!-- Analytics Tab -->
          <mat-tab label="Analytics">
            <ng-template matTabContent>
              <div class="analytics-content">
                <!-- Analytics Header -->
                <div class="analytics-header">
                  <div class="analytics-summary">
                    <mat-card class="metric-card">
                      <h3>{{totalWorkflows}}</h3>
                      <p>Total Workflows</p>
                    </mat-card>
                    <mat-card class="metric-card">
                      <h3>{{activeWorkflows}}</h3>
                      <p>Active Workflows</p>
                    </mat-card>
                    <mat-card class="metric-card">
                      <h3>{{averageCycleTime}} days</h3>
                      <p>Avg Cycle Time</p>
                    </mat-card>
                    <mat-card class="metric-card">
                      <h3>{{throughputRate}}%</h3>
                      <p>Throughput Rate</p>
                    </mat-card>
                  </div>
                </div>

                <!-- Analytics Charts -->
                <div class="charts-container">
                  <mat-card class="chart-card">
                    <mat-card-header>
                      <mat-card-title>Workflow Progress Over Time</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <canvas #progressChart></canvas>
                    </mat-card-content>
                  </mat-card>

                  <mat-card class="chart-card">
                    <mat-card-header>
                      <mat-card-title>Stage Distribution</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <canvas #stageChart></canvas>
                    </mat-card-content>
                  </mat-card>

                  <mat-card class="chart-card">
                    <mat-card-header>
                      <mat-card-title>Cycle Time Trends</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <canvas #cycleTimeChart></canvas>
                    </mat-card-content>
                  </mat-card>

                  <mat-card class="chart-card">
                    <mat-card-header>
                      <mat-card-title>Bottleneck Analysis</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <canvas #bottleneckChart></canvas>
                    </mat-card-content>
                  </mat-card>
                </div>
              </div>
            </ng-template>
          </mat-tab>

          <!-- Templates Tab -->
          <mat-tab label="Templates">
            <ng-template matTabContent>
              <div class="templates-content">
                <!-- Templates Header -->
                <div class="templates-header">
                  <h3>Workflow Templates</h3>
                  <button mat-raised-button color="primary" (click)="createTemplate()">
                    <mat-icon>add</mat-icon>
                    New Template
                  </button>
                </div>

                <!-- Template Cards -->
                <div class="template-grid">
                  <mat-card class="template-card" *ngFor="let template of workflowTemplates">
                    <mat-card-header>
                      <mat-card-title>{{template.name}}</mat-card-title>
                      <mat-card-subtitle>{{template.description}}</mat-card-subtitle>
                    </mat-card-header>
                    
                    <mat-card-content>
                      <div class="template-info">
                        <div class="template-meta">
                          <span class="meta-item">
                            <mat-icon>schedule</mat-icon>
                            {{template.estimatedDuration}} days
                          </span>
                          <span class="meta-item">
                            <mat-icon>layers</mat-icon>
                            {{template.stages.length}} stages
                          </span>
                          <span class="meta-item">
                            <mat-icon>trending_up</mat-icon>
                            Used {{template.usageCount}} times
                          </span>
                        </div>
                        
                        <div class="template-tags">
                          <mat-chip-listbox>
                            <mat-chip *ngFor="let tag of template.tags">{{tag}}</mat-chip>
                          </mat-chip-listbox>
                        </div>
                        
                        <div class="content-types">
                          <span class="content-type-label">Content Types:</span>
                          <mat-chip-listbox>
                            <mat-chip *ngFor="let type of template.contentTypes">{{type}}</mat-chip>
                          </mat-chip-listbox>
                        </div>
                      </div>
                    </mat-card-content>
                    
                    <mat-card-actions>
                      <button mat-button (click)="useTemplate(template)">
                        <mat-icon>play_arrow</mat-icon>
                        Use Template
                      </button>
                      <button mat-button (click)="editTemplate(template)">
                        <mat-icon>edit</mat-icon>
                        Edit
                      </button>
                      <button mat-icon-button [matMenuTriggerFor]="templateMenu">
                        <mat-icon>more_vert</mat-icon>
                      </button>
                      <mat-menu #templateMenu="matMenu">
                        <button mat-menu-item (click)="duplicateTemplate(template)">
                          <mat-icon>content_copy</mat-icon>
                          Duplicate
                        </button>
                        <button mat-menu-item (click)="exportTemplate(template)">
                          <mat-icon>download</mat-icon>
                          Export
                        </button>
                        <mat-divider></mat-divider>
                        <button mat-menu-item (click)="deleteTemplate(template)" class="warn-action">
                          <mat-icon>delete</mat-icon>
                          Delete
                        </button>
                      </mat-menu>
                    </mat-card-actions>
                  </mat-card>
                </div>
              </div>
            </ng-template>
          </mat-tab>

          <!-- Settings Tab -->
          <mat-tab label="Settings">
            <ng-template matTabContent>
              <div class="settings-content">
                <form [formGroup]="workflowSettingsForm" (ngSubmit)="saveSettings()">
                  <mat-card class="settings-section">
                    <mat-card-header>
                      <mat-card-title>General Settings</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="settings-row">
                        <mat-slide-toggle formControlName="autoAssignment">
                          Auto-assign workflows based on content type
                        </mat-slide-toggle>
                      </div>
                      <div class="settings-row">
                        <mat-slide-toggle formControlName="deadlineNotifications">
                          Send notifications for approaching deadlines
                        </mat-slide-toggle>
                      </div>
                      <div class="settings-row">
                        <mat-slide-toggle formControlName="automatedChecks">
                          Run automated checks before stage transitions
                        </mat-slide-toggle>
                      </div>
                    </mat-card-content>
                  </mat-card>

                  <mat-card class="settings-section">
                    <mat-card-header>
                      <mat-card-title>Notification Settings</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <mat-form-field appearance="outline">
                        <mat-label>Deadline Warning (days)</mat-label>
                        <input matInput type="number" formControlName="deadlineWarningDays">
                      </mat-form-field>
                      
                      <mat-form-field appearance="outline">
                        <mat-label>Default Notification Method</mat-label>
                        <mat-select formControlName="defaultNotificationMethod">
                          <mat-option value="email">Email</mat-option>
                          <mat-option value="in_app">In-App</mat-option>
                          <mat-option value="slack">Slack</mat-option>
                          <mat-option value="teams">Teams</mat-option>
                        </mat-select>
                      </mat-form-field>
                    </mat-card-content>
                  </mat-card>

                  <mat-card class="settings-section">
                    <mat-card-header>
                      <mat-card-title>Performance Settings</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <mat-form-field appearance="outline">
                        <mat-label>Items per Page</mat-label>
                        <mat-select formControlName="itemsPerPage">
                          <mat-option value="10">10</mat-option>
                          <mat-option value="25">25</mat-option>
                          <mat-option value="50">50</mat-option>
                          <mat-option value="100">100</mat-option>
                        </mat-select>
                      </mat-form-field>
                      
                      <mat-form-field appearance="outline">
                        <mat-label>Auto-refresh Interval (seconds)</mat-label>
                        <input matInput type="number" formControlName="autoRefreshInterval">
                      </mat-form-field>
                    </mat-card-content>
                  </mat-card>

                  <div class="settings-actions">
                    <button mat-raised-button type="submit" color="primary">
                      Save Settings
                    </button>
                    <button mat-button type="button" (click)="resetSettings()">
                      Reset to Defaults
                    </button>
                  </div>
                </form>
              </div>
            </ng-template>
          </mat-tab>
        </mat-tab-group>
      </div>
    </div>
  `,
  styleUrls: ['./content-workflow.component.scss']
})
export class ContentWorkflowComponent implements OnInit, OnDestroy {
  @ViewChild('progressChart') progressChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('stageChart') stageChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('cycleTimeChart') cycleTimeChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('bottleneckChart') bottleneckChartRef!: ElementRef<HTMLCanvasElement>;

  // Form Controls
  searchControl = this.fb.control('');
  statusFilterControl = this.fb.control([]);
  priorityFilterControl = this.fb.control([]);
  assigneeFilterControl = this.fb.control([]);
  
  workflowSettingsForm: FormGroup;

  // Component State
  selectedTabIndex = 0;
  viewMode: 'kanban' | 'table' = 'kanban';
  
  // Data
  workflows: ContentWorkflow[] = [];
  workflowTemplates: WorkflowTemplate[] = [];
  availableUsers: any[] = [];
  
  // Table
  workflowDataSource = new MatTableDataSource<ContentWorkflow>();
  workflowSelection = new SelectionModel<ContentWorkflow>(true, []);
  workflowDisplayedColumns = ['select', 'contentTitle', 'type', 'stage', 'priority', 'assignees', 'progress', 'deadline', 'actions'];

  // Options
  workflowStatuses = [
    { value: WorkflowStatus.ACTIVE, label: 'Active' },
    { value: WorkflowStatus.PAUSED, label: 'Paused' },
    { value: WorkflowStatus.COMPLETED, label: 'Completed' },
    { value: WorkflowStatus.CANCELLED, label: 'Cancelled' },
    { value: WorkflowStatus.ON_HOLD, label: 'On Hold' }
  ];

  workflowPriorities = [
    { value: WorkflowPriority.LOW, label: 'Low' },
    { value: WorkflowPriority.MEDIUM, label: 'Medium' },
    { value: WorkflowPriority.HIGH, label: 'High' },
    { value: WorkflowPriority.URGENT, label: 'Urgent' },
    { value: WorkflowPriority.CRITICAL, label: 'Critical' }
  ];

  workflowStages = [
    { value: WorkflowStage.CREATION, label: 'Creation' },
    { value: WorkflowStage.CONTENT_REVIEW, label: 'Content Review' },
    { value: WorkflowStage.TECHNICAL_REVIEW, label: 'Technical Review' },
    { value: WorkflowStage.COPY_EDITING, label: 'Copy Editing' },
    { value: WorkflowStage.FACT_CHECK, label: 'Fact Check' },
    { value: WorkflowStage.SEO_REVIEW, label: 'SEO Review' },
    { value: WorkflowStage.LEGAL_REVIEW, label: 'Legal Review' },
    { value: WorkflowStage.FINAL_APPROVAL, label: 'Final Approval' },
    { value: WorkflowStage.READY_TO_PUBLISH, label: 'Ready to Publish' },
    { value: WorkflowStage.PUBLISHED, label: 'Published' }
  ];

  // Analytics
  totalWorkflows = 0;
  activeWorkflows = 0;
  averageCycleTime = 0;
  throughputRate = 0;

  // Charts
  progressChart: Chart | null = null;
  stageChart: Chart | null = null;
  cycleTimeChart: Chart | null = null;
  bottleneckChart: Chart | null = null;

  private subscription = new Subscription();
  private autoRefreshInterval: any;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.workflowSettingsForm = this.fb.group({
      autoAssignment: [true],
      deadlineNotifications: [true],
      automatedChecks: [true],
      deadlineWarningDays: [3, [Validators.min(1), Validators.max(30)]],
      defaultNotificationMethod: ['email'],
      itemsPerPage: [25],
      autoRefreshInterval: [30, [Validators.min(10), Validators.max(300)]]
    });
  }

  ngOnInit(): void {
    this.initializeData();
    this.setupFilters();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
    this.destroyCharts();
  }

  private initializeData(): void {
    // Initialize with mock data for development
    this.workflows = this.generateMockWorkflows();
    this.workflowTemplates = this.generateMockTemplates();
    this.availableUsers = this.generateMockUsers();
    
    this.updateDataSource();
    this.calculateAnalytics();
  }

  private setupFilters(): void {
    // Search filter
    this.subscription.add(
      this.searchControl.valueChanges
        .pipe(debounceTime(300), distinctUntilChanged())
        .subscribe(() => this.applyFilters())
    );

    // Status filter
    this.subscription.add(
      this.statusFilterControl.valueChanges.subscribe(() => this.applyFilters())
    );

    // Priority filter
    this.subscription.add(
      this.priorityFilterControl.valueChanges.subscribe(() => this.applyFilters())
    );

    // Assignee filter
    this.subscription.add(
      this.assigneeFilterControl.valueChanges.subscribe(() => this.applyFilters())
    );
  }

  private startAutoRefresh(): void {
    const interval = this.workflowSettingsForm.get('autoRefreshInterval')?.value * 1000 || 30000;
    this.autoRefreshInterval = setInterval(() => {
      this.refreshData();
    }, interval);
  }

  private refreshData(): void {
    // In real implementation, this would call the API
    this.calculateAnalytics();
  }

  private applyFilters(): void {
    let filteredWorkflows = [...this.workflows];

    // Apply search filter
    const searchTerm = this.searchControl.value?.toLowerCase();
    if (searchTerm) {
      filteredWorkflows = filteredWorkflows.filter(workflow =>
        workflow.contentTitle.toLowerCase().includes(searchTerm) ||
        workflow.assignedTo.some(assignee => 
          this.getUserName(assignee).toLowerCase().includes(searchTerm)
        ) ||
        this.getStageLabel(workflow.currentStage).toLowerCase().includes(searchTerm)
      );
    }

    // Apply status filter
    const selectedStatuses = this.statusFilterControl.value;
    if (selectedStatuses && selectedStatuses.length > 0) {
      filteredWorkflows = filteredWorkflows.filter(workflow =>
        selectedStatuses.includes(workflow.status)
      );
    }

    // Apply priority filter
    const selectedPriorities = this.priorityFilterControl.value;
    if (selectedPriorities && selectedPriorities.length > 0) {
      filteredWorkflows = filteredWorkflows.filter(workflow =>
        selectedPriorities.includes(workflow.priority)
      );
    }

    // Apply assignee filter
    const selectedAssignees = this.assigneeFilterControl.value;
    if (selectedAssignees && selectedAssignees.length > 0) {
      filteredWorkflows = filteredWorkflows.filter(workflow =>
        workflow.assignedTo.some(assignee => selectedAssignees.includes(assignee))
      );
    }

    this.workflowDataSource.data = filteredWorkflows;
  }

  private updateDataSource(): void {
    this.workflowDataSource.data = this.workflows;
    this.applyFilters();
  }

  private calculateAnalytics(): void {
    this.totalWorkflows = this.workflows.length;
    this.activeWorkflows = this.workflows.filter(w => w.status === WorkflowStatus.ACTIVE).length;
    
    // Calculate average cycle time
    const completedWorkflows = this.workflows.filter(w => w.status === WorkflowStatus.COMPLETED);
    if (completedWorkflows.length > 0) {
      const totalCycleTime = completedWorkflows.reduce((total, workflow) => {
        if (workflow.completedAt) {
          return total + (workflow.completedAt.getTime() - workflow.createdAt.getTime());
        }
        return total;
      }, 0);
      this.averageCycleTime = Math.round(totalCycleTime / completedWorkflows.length / (1000 * 60 * 60 * 24));
    }

    // Calculate throughput rate
    const thisMonthWorkflows = this.workflows.filter(w => {
      const thisMonth = new Date();
      thisMonth.setDate(1);
      return w.createdAt >= thisMonth;
    });
    const completedThisMonth = thisMonthWorkflows.filter(w => w.status === WorkflowStatus.COMPLETED);
    this.throughputRate = thisMonthWorkflows.length > 0 
      ? Math.round((completedThisMonth.length / thisMonthWorkflows.length) * 100)
      : 0;
  }

  // Event Handlers
  onTabChange(event: any): void {
    this.selectedTabIndex = event.index;
    
    // Load charts when analytics tab is selected
    if (event.index === 1) {
      setTimeout(() => this.initializeCharts(), 100);
    }
  }

  changeViewMode(mode: string): void {
    this.viewMode = mode as 'kanban' | 'table';
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.statusFilterControl.setValue([]);
    this.priorityFilterControl.setValue([]);
    this.assigneeFilterControl.setValue([]);
  }

  // Workflow Operations
  createWorkflow(): void {
    // Implementation for creating new workflow
    this.snackBar.open('Create workflow functionality would be implemented here', 'Close', {
      duration: 3000
    });
  }

  editWorkflow(workflow: ContentWorkflow): void {
    // Implementation for editing workflow
    this.snackBar.open(`Edit workflow: ${workflow.contentTitle}`, 'Close', {
      duration: 3000
    });
  }

  openWorkflowDetails(workflow: ContentWorkflow): void {
    // Implementation for opening workflow details
    this.snackBar.open(`Open workflow details: ${workflow.contentTitle}`, 'Close', {
      duration: 3000
    });
  }

  assignWorkflow(workflow: ContentWorkflow): void {
    // Implementation for assigning workflow
    this.snackBar.open(`Assign workflow: ${workflow.contentTitle}`, 'Close', {
      duration: 3000
    });
  }

  duplicateWorkflow(workflow: ContentWorkflow): void {
    // Implementation for duplicating workflow
    this.snackBar.open(`Duplicate workflow: ${workflow.contentTitle}`, 'Close', {
      duration: 3000
    });
  }

  pauseWorkflow(workflow: ContentWorkflow): void {
    workflow.status = WorkflowStatus.PAUSED;
    this.snackBar.open(`Workflow paused: ${workflow.contentTitle}`, 'Close', {
      duration: 3000
    });
  }

  resumeWorkflow(workflow: ContentWorkflow): void {
    workflow.status = WorkflowStatus.ACTIVE;
    this.snackBar.open(`Workflow resumed: ${workflow.contentTitle}`, 'Close', {
      duration: 3000
    });
  }

  cancelWorkflow(workflow: ContentWorkflow): void {
    workflow.status = WorkflowStatus.CANCELLED;
    this.snackBar.open(`Workflow cancelled: ${workflow.contentTitle}`, 'Close', {
      duration: 3000
    });
  }

  quickAction(workflow: ContentWorkflow, event: Event): void {
    event.stopPropagation();
    // Implementation for quick actions
  }

  dropWorkflow(event: CdkDragDrop<ContentWorkflow[]>, targetStage: WorkflowStage): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const workflow = event.previousContainer.data[event.previousIndex];
      workflow.currentStage = targetStage;
      
      // Update workflow stages progress
      const stageIndex = this.workflowStages.findIndex(s => s.value === targetStage);
      if (stageIndex >= 0 && workflow.stages[stageIndex]) {
        workflow.stages[stageIndex].status = 'in_progress';
        workflow.stages[stageIndex].startedAt = new Date();
      }

      // Move workflow between containers
      event.previousContainer.data.splice(event.previousIndex, 1);
      event.container.data.splice(event.currentIndex, 0, workflow);
      
      this.snackBar.open(`Moved ${workflow.contentTitle} to ${this.getStageLabel(targetStage)}`, 'Close', {
        duration: 3000
      });
    }
  }

  // Template Operations
  createTemplate(): void {
    this.snackBar.open('Create template functionality would be implemented here', 'Close', {
      duration: 3000
    });
  }

  useTemplate(template: WorkflowTemplate): void {
    this.snackBar.open(`Using template: ${template.name}`, 'Close', {
      duration: 3000
    });
  }

  editTemplate(template: WorkflowTemplate): void {
    this.snackBar.open(`Edit template: ${template.name}`, 'Close', {
      duration: 3000
    });
  }

  duplicateTemplate(template: WorkflowTemplate): void {
    this.snackBar.open(`Duplicate template: ${template.name}`, 'Close', {
      duration: 3000
    });
  }

  exportTemplate(template: WorkflowTemplate): void {
    this.snackBar.open(`Export template: ${template.name}`, 'Close', {
      duration: 3000
    });
  }

  deleteTemplate(template: WorkflowTemplate): void {
    this.snackBar.open(`Delete template: ${template.name}`, 'Close', {
      duration: 3000
    });
  }

  // Settings
  saveSettings(): void {
    if (this.workflowSettingsForm.valid) {
      this.snackBar.open('Settings saved successfully', 'Close', {
        duration: 3000
      });
    }
  }

  resetSettings(): void {
    this.workflowSettingsForm.reset({
      autoAssignment: true,
      deadlineNotifications: true,
      automatedChecks: true,
      deadlineWarningDays: 3,
      defaultNotificationMethod: 'email',
      itemsPerPage: 25,
      autoRefreshInterval: 30
    });
  }

  // Helper Methods
  getWorkflowsByStage(stage: WorkflowStage): ContentWorkflow[] {
    return this.workflows.filter(w => w.currentStage === stage);
  }

  getWorkflowProgress(workflow: ContentWorkflow): number {
    const completedStages = workflow.stages.filter(s => s.status === 'completed').length;
    return Math.round((completedStages / workflow.stages.length) * 100);
  }

  getProgressColor(workflow: ContentWorkflow): string {
    const progress = this.getWorkflowProgress(workflow);
    if (progress < 25) return 'warn';
    if (progress < 75) return 'accent';
    return 'primary';
  }

  getStageLabel(stage: WorkflowStage): string {
    const stageInfo = this.workflowStages.find(s => s.value === stage);
    return stageInfo ? stageInfo.label : stage;
  }

  getUserName(userId: string): string {
    const user = this.availableUsers.find(u => u.id === userId);
    return user ? user.name : 'Unknown User';
  }

  getUserInitials(userId: string): string {
    const user = this.availableUsers.find(u => u.id === userId);
    if (user) {
      return user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
    }
    return 'UU';
  }

  getOverflowAssignees(workflow: ContentWorkflow): string {
    const overflowUsers = workflow.assignedTo.slice(3);
    return overflowUsers.map(id => this.getUserName(id)).join(', ');
  }

  getDeadlineClass(deadline: Date): string {
    const now = new Date();
    const timeDiff = deadline.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (daysDiff < 0) return 'overdue';
    if (daysDiff <= 1) return 'urgent';
    if (daysDiff <= 3) return 'warning';
    return 'normal';
  }

  formatDeadline(deadline: Date): string {
    const now = new Date();
    const timeDiff = deadline.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (daysDiff < 0) {
      return `${Math.abs(daysDiff)} days overdue`;
    } else if (daysDiff === 0) {
      return 'Due today';
    } else if (daysDiff === 1) {
      return 'Due tomorrow';
    } else {
      return `Due in ${daysDiff} days`;
    }
  }

  hasFailedChecks(workflow: ContentWorkflow): boolean {
    return workflow.automatedChecks.some(check => check.status === 'failed');
  }

  // Table Selection
  isAllSelected(): boolean {
    const numSelected = this.workflowSelection.selected.length;
    const numRows = this.workflowDataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle(): void {
    if (this.isAllSelected()) {
      this.workflowSelection.clear();
    } else {
      this.workflowDataSource.data.forEach(row => this.workflowSelection.select(row));
    }
  }

  // Charts
  private initializeCharts(): void {
    this.initializeProgressChart();
    this.initializeStageChart();
    this.initializeCycleTimeChart();
    this.initializeBottleneckChart();
  }

  private initializeProgressChart(): void {
    if (this.progressChart) {
      this.progressChart.destroy();
    }

    const ctx = this.progressChartRef.nativeElement.getContext('2d');
    if (ctx) {
      this.progressChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            label: 'Completed Workflows',
            data: [12, 19, 3, 5, 2, 3],
            borderColor: '#1976d2',
            backgroundColor: 'rgba(25, 118, 210, 0.1)',
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
          }
        }
      });
    }
  }

  private initializeStageChart(): void {
    if (this.stageChart) {
      this.stageChart.destroy();
    }

    const ctx = this.stageChartRef.nativeElement.getContext('2d');
    if (ctx) {
      const stageData = this.workflowStages.map(stage => ({
        label: stage.label,
        count: this.getWorkflowsByStage(stage.value).length
      }));

      this.stageChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: stageData.map(d => d.label),
          datasets: [{
            data: stageData.map(d => d.count),
            backgroundColor: [
              '#1976d2', '#2196f3', '#03dac6', '#4caf50',
              '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107',
              '#ff9800', '#f44336'
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

  private initializeCycleTimeChart(): void {
    if (this.cycleTimeChart) {
      this.cycleTimeChart.destroy();
    }

    const ctx = this.cycleTimeChartRef.nativeElement.getContext('2d');
    if (ctx) {
      this.cycleTimeChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          datasets: [{
            label: 'Average Cycle Time (days)',
            data: [7, 8, 6, 9],
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

  private initializeBottleneckChart(): void {
    if (this.bottleneckChart) {
      this.bottleneckChart.destroy();
    }

    const ctx = this.bottleneckChartRef.nativeElement.getContext('2d');
    if (ctx) {
      this.bottleneckChart = new Chart(ctx, {
        type: 'horizontalBar',
        data: {
          labels: ['Content Review', 'Technical Review', 'Copy Editing', 'Final Approval'],
          datasets: [{
            label: 'Average Wait Time (hours)',
            data: [24, 18, 12, 36],
            backgroundColor: ['#f44336', '#ff9800', '#ffc107', '#4caf50']
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
            x: {
              beginAtZero: true
            }
          }
        }
      });
    }
  }

  private destroyCharts(): void {
    if (this.progressChart) {
      this.progressChart.destroy();
      this.progressChart = null;
    }
    if (this.stageChart) {
      this.stageChart.destroy();
      this.stageChart = null;
    }
    if (this.cycleTimeChart) {
      this.cycleTimeChart.destroy();
      this.cycleTimeChart = null;
    }
    if (this.bottleneckChart) {
      this.bottleneckChart.destroy();
      this.bottleneckChart = null;
    }
  }

  // Mock Data Generators
  private generateMockWorkflows(): ContentWorkflow[] {
    const workflows: ContentWorkflow[] = [];
    const contentTypes = Object.values(ContentType);
    const priorities = Object.values(WorkflowPriority);
    const stages = Object.values(WorkflowStage);
    const statuses = Object.values(WorkflowStatus);

    for (let i = 0; i < 50; i++) {
      const workflow: ContentWorkflow = {
        id: `workflow-${i + 1}`,
        contentId: `content-${i + 1}`,
        contentTitle: `Content Item ${i + 1}: ${this.getRandomTitle()}`,
        contentType: contentTypes[Math.floor(Math.random() * contentTypes.length)],
        currentStage: stages[Math.floor(Math.random() * stages.length)],
        stages: this.generateMockStageProgress(),
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        deadline: Math.random() > 0.3 ? new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000) : undefined,
        assignedTo: this.getRandomAssignees(),
        createdBy: `user-${Math.floor(Math.random() * 10) + 1}`,
        approvers: [],
        comments: [],
        automatedChecks: this.generateMockChecks(),
        notifications: [],
        metadata: {
          estimatedDuration: Math.floor(Math.random() * 14) + 1,
          complexity: ['simple', 'moderate', 'complex', 'highly_complex'][Math.floor(Math.random() * 4)] as any,
          riskLevel: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as any,
          businessImpact: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as any,
          tags: ['urgent', 'feature', 'bug', 'enhancement'].slice(0, Math.floor(Math.random() * 3) + 1),
          customFields: {},
          analytics: {
            stageTransitions: [],
            bottlenecks: [],
            efficiency: {
              cycleTime: 0,
              leadTime: 0,
              throughput: 0,
              workInProgress: 0,
              velocityTrend: []
            },
            qualityMetrics: {
              defectRate: 0,
              reworkRate: 0,
              customerSatisfaction: 0,
              firstPassYield: 0,
              qualityScore: 0
            }
          }
        },
        status: statuses[Math.floor(Math.random() * statuses.length)],
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        completedAt: Math.random() > 0.7 ? new Date() : undefined
      };
      workflows.push(workflow);
    }

    return workflows;
  }

  private generateMockStageProgress(): WorkflowStageProgress[] {
    return this.workflowStages.map(stage => ({
      stage: stage.value,
      status: ['pending', 'in_progress', 'completed', 'rejected', 'skipped'][Math.floor(Math.random() * 5)] as any,
      assignedTo: `user-${Math.floor(Math.random() * 10) + 1}`,
      startedAt: Math.random() > 0.5 ? new Date() : undefined,
      completedAt: Math.random() > 0.7 ? new Date() : undefined,
      timeSpent: Math.floor(Math.random() * 8) + 1,
      estimatedTime: Math.floor(Math.random() * 16) + 4,
      checklist: [],
      dependencies: [],
      artifacts: []
    }));
  }

  private generateMockChecks(): WorkflowCheck[] {
    const checks: WorkflowCheck[] = [];
    const checkTypes = ['seo', 'accessibility', 'performance', 'content_quality', 'legal', 'technical'];
    
    for (let i = 0; i < Math.floor(Math.random() * 5) + 2; i++) {
      checks.push({
        id: `check-${i + 1}`,
        type: Math.random() > 0.5 ? 'automated' : 'manual',
        category: checkTypes[Math.floor(Math.random() * checkTypes.length)] as any,
        name: `Check ${i + 1}`,
        description: `Description for check ${i + 1}`,
        status: ['pending', 'running', 'passed', 'failed', 'warning', 'skipped'][Math.floor(Math.random() * 6)] as any,
        score: Math.floor(Math.random() * 100),
        maxScore: 100,
        details: [],
        recommendations: [],
        isRequired: Math.random() > 0.3,
        isBlocking: Math.random() > 0.7
      });
    }

    return checks;
  }

  private generateMockTemplates(): WorkflowTemplate[] {
    const templates: WorkflowTemplate[] = [];
    const templateNames = [
      'Blog Post Workflow',
      'Chapter Content Workflow',
      'Marketing Page Workflow',
      'Documentation Workflow',
      'Email Template Workflow'
    ];

    templateNames.forEach((name, index) => {
      templates.push({
        id: `template-${index + 1}`,
        name,
        description: `Template for ${name.toLowerCase()}`,
        contentTypes: [Object.values(ContentType)[index]],
        stages: this.workflowStages.map(stage => ({
          stage: stage.value,
          name: stage.label,
          description: `${stage.label} stage`,
          estimatedTime: Math.floor(Math.random() * 8) + 1,
          isRequired: true,
          canSkip: false,
          checklist: [],
          automatedChecks: [],
          approvalRequired: Math.random() > 0.5,
          parallelWith: [],
          dependencies: []
        })),
        defaultApprovers: {},
        estimatedDuration: Math.floor(Math.random() * 14) + 1,
        complexity: ['simple', 'moderate', 'complex'][Math.floor(Math.random() * 3)],
        tags: ['template', 'workflow'],
        isActive: true,
        createdBy: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: Math.floor(Math.random() * 50)
      });
    });

    return templates;
  }

  private generateMockUsers(): any[] {
    const users = [];
    const names = [
      'John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Brown', 'Charlie Wilson',
      'Diana Davis', 'Eve Miller', 'Frank Garcia', 'Grace Martinez', 'Henry Lopez'
    ];

    names.forEach((name, index) => {
      users.push({
        id: `user-${index + 1}`,
        name,
        email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
        avatar: null
      });
    });

    return users;
  }

  private getRandomTitle(): string {
    const titles = [
      'Understanding AI Principles',
      'Advanced Prompt Engineering',
      'Content Creation Strategies',
      'Technical Documentation',
      'User Experience Design',
      'Marketing Campaign Development',
      'Customer Success Stories',
      'Product Feature Analysis'
    ];
    return titles[Math.floor(Math.random() * titles.length)];
  }

  private getRandomAssignees(): string[] {
    const assigneeCount = Math.floor(Math.random() * 4) + 1;
    const assignees = [];
    for (let i = 0; i < assigneeCount; i++) {
      assignees.push(`user-${Math.floor(Math.random() * 10) + 1}`);
    }
    return Array.from(new Set(assignees)); // Remove duplicates
  }

  // Additional Operations
  manageTemplates(): void {
    this.selectedTabIndex = 2; // Switch to templates tab
  }

  exportWorkflows(): void {
    this.snackBar.open('Export workflows functionality would be implemented here', 'Close', {
      duration: 3000
    });
  }

  importWorkflows(): void {
    this.snackBar.open('Import workflows functionality would be implemented here', 'Close', {
      duration: 3000
    });
  }

  bulkOperations(): void {
    this.snackBar.open('Bulk operations functionality would be implemented here', 'Close', {
      duration: 3000
    });
  }

  workflowSettings(): void {
    this.selectedTabIndex = 3; // Switch to settings tab
  }
}