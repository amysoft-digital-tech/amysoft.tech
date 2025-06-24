import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTreeModule, NestedTreeControl } from '@angular/material/tree';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
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
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { Subscription, Subject, debounceTime, distinctUntilChanged } from 'rxjs';

// Content Organization Interfaces
export interface ContentHierarchy {
  id: string;
  name: string;
  type: ContentNodeType;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  parent?: string;
  children: ContentHierarchy[];
  content: ContentReference[];
  metadata: HierarchyMetadata;
  permissions: HierarchyPermission[];
  settings: HierarchySettings;
  analytics: HierarchyAnalytics;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  status: HierarchyStatus;
}

export enum ContentNodeType {
  ROOT = 'root',
  SECTION = 'section',
  CHAPTER = 'chapter',
  CATEGORY = 'category',
  COLLECTION = 'collection',
  FOLDER = 'folder',
  TAG = 'tag'
}

export enum HierarchyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
  DRAFT = 'draft'
}

export interface ContentReference {
  contentId: string;
  title: string;
  type: string;
  status: string;
  position: number;
  isRequired: boolean;
  dependencies: string[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface HierarchyMetadata {
  order: number;
  isVisible: boolean;
  isNavigable: boolean;
  requiresAuth: boolean;
  accessLevel: string;
  keywords: string[];
  tags: string[];
  customProperties: Record<string, any>;
  seo: SEOMetadata;
}

export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl?: string;
  metaTags: Record<string, string>;
  structuredData: Record<string, any>;
}

export interface HierarchyPermission {
  userId: string;
  userType: 'user' | 'role' | 'group';
  permission: 'view' | 'edit' | 'admin' | 'create' | 'delete';
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
}

export interface HierarchySettings {
  allowChildNodes: boolean;
  maxDepth: number;
  sortBy: 'name' | 'date' | 'order' | 'custom';
  sortDirection: 'asc' | 'desc';
  viewMode: 'list' | 'grid' | 'tree';
  pagination: PaginationSettings;
  filters: FilterSettings;
}

export interface PaginationSettings {
  enabled: boolean;
  itemsPerPage: number;
  showPageSizeOptions: boolean;
  pageSizeOptions: number[];
}

export interface FilterSettings {
  enabled: boolean;
  availableFilters: string[];
  defaultFilters: Record<string, any>;
}

export interface HierarchyAnalytics {
  viewCount: number;
  uniqueVisitors: number;
  contentCount: number;
  avgTimeSpent: number;
  popularContent: PopularContent[];
  trends: TrendData[];
  performance: PerformanceData;
}

export interface PopularContent {
  contentId: string;
  title: string;
  views: number;
  engagement: number;
  lastViewed: Date;
}

export interface TrendData {
  date: Date;
  views: number;
  engagement: number;
  contentAdded: number;
}

export interface PerformanceData {
  loadTime: number;
  searchTime: number;
  navigationTime: number;
  errorRate: number;
}

// Content Templates
export interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  type: TemplateType;
  category: string;
  version: string;
  schema: TemplateSchema;
  content: TemplateContent;
  settings: TemplateSettings;
  metadata: TemplateMetadata;
  preview: TemplatePreview;
  usage: TemplateUsage;
  validation: TemplateValidation;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  isPublic: boolean;
}

export enum TemplateType {
  CHAPTER = 'chapter',
  BLOG_POST = 'blog_post',
  MARKETING_PAGE = 'marketing_page',
  EMAIL = 'email',
  DOCUMENTATION = 'documentation',
  TUTORIAL = 'tutorial',
  CASE_STUDY = 'case_study',
  FAQ = 'faq',
  LANDING_PAGE = 'landing_page'
}

export interface TemplateSchema {
  fields: TemplateField[];
  layout: LayoutDefinition;
  styles: StyleDefinition;
  scripts: ScriptDefinition[];
  dependencies: string[];
}

export interface TemplateField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  validation: FieldValidation;
  defaultValue?: any;
  options?: FieldOption[];
  placeholder?: string;
  helpText?: string;
  isRequired: boolean;
  isVisible: boolean;
  order: number;
  conditions: FieldCondition[];
}

export enum FieldType {
  TEXT = 'text',
  TEXTAREA = 'textarea',
  RICH_TEXT = 'rich_text',
  SELECT = 'select',
  MULTISELECT = 'multiselect',
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
  DATE = 'date',
  DATETIME = 'datetime',
  NUMBER = 'number',
  EMAIL = 'email',
  URL = 'url',
  FILE = 'file',
  IMAGE = 'image',
  VIDEO = 'video',
  JSON = 'json',
  REPEATER = 'repeater',
  REFERENCE = 'reference'
}

export interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  customValidator?: string;
  errorMessages: Record<string, string>;
}

export interface FieldOption {
  value: any;
  label: string;
  disabled?: boolean;
  group?: string;
}

export interface FieldCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than';
  value: any;
  action: 'show' | 'hide' | 'enable' | 'disable' | 'require';
}

export interface LayoutDefinition {
  sections: LayoutSection[];
  columns: number;
  spacing: string;
  breakpoints: Record<string, any>;
}

export interface LayoutSection {
  id: string;
  name: string;
  fields: string[];
  columns: number;
  className?: string;
  conditions?: FieldCondition[];
}

export interface StyleDefinition {
  css: string;
  variables: Record<string, string>;
  themes: ThemeDefinition[];
}

export interface ThemeDefinition {
  id: string;
  name: string;
  variables: Record<string, string>;
  isDefault: boolean;
}

export interface ScriptDefinition {
  id: string;
  name: string;
  code: string;
  type: 'javascript' | 'typescript';
  scope: 'global' | 'component';
  dependencies: string[];
}

export interface TemplateContent {
  structure: ContentStructure;
  defaultValues: Record<string, any>;
  sampleData: Record<string, any>;
  placeholders: Record<string, string>;
}

export interface ContentStructure {
  sections: ContentSection[];
  navigation: NavigationStructure;
  metadata: ContentMetadata;
}

export interface ContentSection {
  id: string;
  name: string;
  type: string;
  content: any;
  settings: Record<string, any>;
  order: number;
}

export interface NavigationStructure {
  enabled: boolean;
  type: 'sidebar' | 'tabs' | 'breadcrumb' | 'steps';
  items: NavigationItem[];
}

export interface NavigationItem {
  id: string;
  label: string;
  target: string;
  icon?: string;
  children?: NavigationItem[];
}

export interface ContentMetadata {
  title: string;
  description: string;
  author: string;
  tags: string[];
  categories: string[];
  difficulty: string;
  estimatedTime: number;
}

export interface TemplateSettings {
  editable: boolean;
  customizable: boolean;
  allowComments: boolean;
  requireApproval: boolean;
  versioning: VersioningSettings;
  publishing: PublishingSettings;
  seo: SEOSettings;
}

export interface VersioningSettings {
  enabled: boolean;
  autoSave: boolean;
  maxVersions: number;
  approvalRequired: boolean;
}

export interface PublishingSettings {
  autoPublish: boolean;
  scheduleSupport: boolean;
  multiLanguage: boolean;
  cdn: boolean;
}

export interface SEOSettings {
  enabled: boolean;
  autoGenerate: boolean;
  fields: string[];
  templates: Record<string, string>;
}

export interface TemplateMetadata {
  tags: string[];
  categories: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimatedTime: number;
  prerequisites: string[];
  learningObjectives: string[];
  rating: number;
  downloads: number;
  usageCount: number;
}

export interface TemplatePreview {
  thumbnail: string;
  screenshots: string[];
  demoUrl?: string;
  video?: string;
  description: string;
}

export interface TemplateUsage {
  totalUses: number;
  recentUses: TemplateUse[];
  popularFields: FieldUsage[];
  feedback: TemplateFeedback[];
}

export interface TemplateUse {
  userId: string;
  userName: string;
  contentId: string;
  contentTitle: string;
  usedAt: Date;
  customizations: Record<string, any>;
}

export interface FieldUsage {
  fieldId: string;
  fieldName: string;
  usageCount: number;
  averageValue: any;
  popularValues: any[];
}

export interface TemplateFeedback {
  userId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface TemplateValidation {
  rules: ValidationRule[];
  warnings: ValidationWarning[];
  errors: ValidationError[];
  isValid: boolean;
  lastValidated: Date;
}

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  validator: string;
  params: Record<string, any>;
}

export interface ValidationWarning {
  ruleId: string;
  message: string;
  field?: string;
  severity: 'warning' | 'info';
}

export interface ValidationError {
  ruleId: string;
  message: string;
  field?: string;
  severity: 'error';
}

@Component({
  selector: 'app-content-organization',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatTreeModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
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
    <div class="organization-container">
      <!-- Header -->
      <mat-card class="organization-header">
        <mat-card-header>
          <div class="header-content">
            <div class="header-info">
              <h2>Content Organization & Templates</h2>
              <p class="header-subtitle">Organize content hierarchy and manage reusable templates</p>
            </div>
            <div class="header-actions">
              <button mat-raised-button color="primary" (click)="createHierarchyNode()">
                <mat-icon>add</mat-icon>
                New Section
              </button>
              <button mat-button (click)="createTemplate()">
                <mat-icon>description</mat-icon>
                New Template
              </button>
              <button mat-icon-button [matMenuTriggerFor]="headerMenu">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #headerMenu="matMenu">
                <button mat-menu-item (click)="importHierarchy()">
                  <mat-icon>upload</mat-icon>
                  Import Structure
                </button>
                <button mat-menu-item (click)="exportHierarchy()">
                  <mat-icon>download</mat-icon>
                  Export Structure
                </button>
                <button mat-menu-item (click)="validateStructure()">
                  <mat-icon>check_circle</mat-icon>
                  Validate Structure
                </button>
                <mat-divider></mat-divider>
                <button mat-menu-item (click)="organizationSettings()">
                  <mat-icon>settings</mat-icon>
                  Settings
                </button>
              </mat-menu>
            </div>
          </div>
        </mat-card-header>
      </mat-card>

      <!-- Organization Dashboard -->
      <div class="organization-dashboard">
        <mat-tab-group [(selectedIndex)]="selectedTabIndex" (selectedTabChange)="onTabChange($event)">
          <!-- Hierarchy Tab -->
          <mat-tab label="Content Hierarchy">
            <ng-template matTabContent>
              <div class="tab-content">
                <div class="hierarchy-layout">
                  <!-- Hierarchy Tree -->
                  <div class="hierarchy-panel">
                    <mat-card class="tree-card">
                      <mat-card-header>
                        <mat-card-title>Content Structure</mat-card-title>
                        <div class="tree-actions">
                          <button mat-icon-button (click)="expandAll()" matTooltip="Expand All">
                            <mat-icon>unfold_more</mat-icon>
                          </button>
                          <button mat-icon-button (click)="collapseAll()" matTooltip="Collapse All">
                            <mat-icon>unfold_less</mat-icon>
                          </button>
                          <button mat-icon-button [matMenuTriggerFor]="treeMenu" matTooltip="Tree Options">
                            <mat-icon>more_vert</mat-icon>
                          </button>
                          <mat-menu #treeMenu="matMenu">
                            <button mat-menu-item (click)="sortByName()">
                              <mat-icon>sort_by_alpha</mat-icon>
                              Sort by Name
                            </button>
                            <button mat-menu-item (click)="sortByDate()">
                              <mat-icon>schedule</mat-icon>
                              Sort by Date
                            </button>
                            <button mat-menu-item (click)="sortByOrder()">
                              <mat-icon>reorder</mat-icon>
                              Sort by Order
                            </button>
                          </mat-menu>
                        </div>
                      </mat-card-header>
                      
                      <mat-card-content>
                        <mat-tree [dataSource]="hierarchyDataSource" [treeControl]="treeControl">
                          <mat-tree-node *matTreeNodeDef="let node" matTreeNodeToggle 
                                         class="tree-node"
                                         [class.selected]="selectedNode?.id === node.id"
                                         (click)="selectNode(node)"
                                         cdkDrag
                                         [cdkDragData]="node">
                            <div class="node-content">
                              <mat-icon class="node-icon" [ngClass]="'type-' + node.type">
                                {{getNodeIcon(node.type)}}
                              </mat-icon>
                              <span class="node-name">{{node.name}}</span>
                              <div class="node-badges">
                                <mat-chip-listbox>
                                  <mat-chip class="content-count" *ngIf="node.content.length > 0">
                                    {{node.content.length}}
                                  </mat-chip>
                                  <mat-chip class="status-chip" [ngClass]="'status-' + node.status">
                                    {{node.status}}
                                  </mat-chip>
                                </mat-chip-listbox>
                              </div>
                              <div class="node-actions">
                                <button mat-icon-button (click)="editNode(node, $event)" matTooltip="Edit">
                                  <mat-icon>edit</mat-icon>
                                </button>
                                <button mat-icon-button [matMenuTriggerFor]="nodeMenu" 
                                        (click)="$event.stopPropagation()" matTooltip="More Actions">
                                  <mat-icon>more_horiz</mat-icon>
                                </button>
                                <mat-menu #nodeMenu="matMenu">
                                  <button mat-menu-item (click)="addChildNode(node)">
                                    <mat-icon>add</mat-icon>
                                    Add Child
                                  </button>
                                  <button mat-menu-item (click)="addContent(node)">
                                    <mat-icon>note_add</mat-icon>
                                    Add Content
                                  </button>
                                  <button mat-menu-item (click)="duplicateNode(node)">
                                    <mat-icon>content_copy</mat-icon>
                                    Duplicate
                                  </button>
                                  <mat-divider></mat-divider>
                                  <button mat-menu-item (click)="moveNode(node)">
                                    <mat-icon>drive_file_move</mat-icon>
                                    Move
                                  </button>
                                  <button mat-menu-item (click)="exportNode(node)">
                                    <mat-icon>download</mat-icon>
                                    Export
                                  </button>
                                  <mat-divider></mat-divider>
                                  <button mat-menu-item (click)="deleteNode(node)" class="warn-action">
                                    <mat-icon>delete</mat-icon>
                                    Delete
                                  </button>
                                </mat-menu>
                              </div>
                            </div>
                          </mat-tree-node>

                          <mat-nested-tree-node *matTreeNodeDef="let node; when: hasChildren" 
                                                class="tree-node nested"
                                                [class.selected]="selectedNode?.id === node.id"
                                                cdkDrag
                                                [cdkDragData]="node">
                            <div class="node-content" (click)="selectNode(node)">
                              <button mat-icon-button matTreeNodeToggle 
                                      [attr.aria-label]="'Toggle ' + node.name"
                                      class="expand-button">
                                <mat-icon class="expand-icon">
                                  {{treeControl.isExpanded(node) ? 'expand_more' : 'chevron_right'}}
                                </mat-icon>
                              </button>
                              
                              <mat-icon class="node-icon" [ngClass]="'type-' + node.type">
                                {{getNodeIcon(node.type)}}
                              </mat-icon>
                              <span class="node-name">{{node.name}}</span>
                              <div class="node-badges">
                                <mat-chip-listbox>
                                  <mat-chip class="children-count" *ngIf="node.children.length > 0">
                                    {{node.children.length}}
                                  </mat-chip>
                                  <mat-chip class="content-count" *ngIf="node.content.length > 0">
                                    {{node.content.length}}
                                  </mat-chip>
                                  <mat-chip class="status-chip" [ngClass]="'status-' + node.status">
                                    {{node.status}}
                                  </mat-chip>
                                </mat-chip-listbox>
                              </div>
                              <div class="node-actions">
                                <button mat-icon-button (click)="editNode(node, $event)" matTooltip="Edit">
                                  <mat-icon>edit</mat-icon>
                                </button>
                                <button mat-icon-button [matMenuTriggerFor]="nestedNodeMenu" 
                                        (click)="$event.stopPropagation()" matTooltip="More Actions">
                                  <mat-icon>more_horiz</mat-icon>
                                </button>
                                <mat-menu #nestedNodeMenu="matMenu">
                                  <button mat-menu-item (click)="addChildNode(node)">
                                    <mat-icon>add</mat-icon>
                                    Add Child
                                  </button>
                                  <button mat-menu-item (click)="addContent(node)">
                                    <mat-icon>note_add</mat-icon>
                                    Add Content
                                  </button>
                                  <button mat-menu-item (click)="duplicateNode(node)">
                                    <mat-icon>content_copy</mat-icon>
                                    Duplicate
                                  </button>
                                  <mat-divider></mat-divider>
                                  <button mat-menu-item (click)="moveNode(node)">
                                    <mat-icon>drive_file_move</mat-icon>
                                    Move
                                  </button>
                                  <button mat-menu-item (click)="exportNode(node)">
                                    <mat-icon>download</mat-icon>
                                    Export
                                  </button>
                                  <mat-divider></mat-divider>
                                  <button mat-menu-item (click)="deleteNode(node)" class="warn-action">
                                    <mat-icon>delete</mat-icon>
                                    Delete
                                  </button>
                                </mat-menu>
                              </div>
                            </div>
                            
                            <div class="children-container" 
                                 cdkDropList
                                 [cdkDropListData]="node.children"
                                 (cdkDropListDropped)="dropNode($event)">
                              <ng-container matTreeNodeOutlet></ng-container>
                            </div>
                          </mat-nested-tree-node>
                        </mat-tree>
                      </mat-card-content>
                    </mat-card>
                  </div>

                  <!-- Node Details -->
                  <div class="details-panel">
                    <mat-card class="details-card" *ngIf="selectedNode">
                      <mat-card-header>
                        <mat-card-title>{{selectedNode.name}}</mat-card-title>
                        <mat-card-subtitle>{{selectedNode.type | titlecase}} Node</mat-card-subtitle>
                        <div class="details-actions">
                          <button mat-icon-button (click)="editNode(selectedNode)" matTooltip="Edit Node">
                            <mat-icon>edit</mat-icon>
                          </button>
                          <button mat-icon-button (click)="refreshNodeAnalytics()" matTooltip="Refresh Analytics">
                            <mat-icon>refresh</mat-icon>
                          </button>
                        </div>
                      </mat-card-header>
                      
                      <mat-card-content>
                        <mat-tab-group>
                          <!-- Content Tab -->
                          <mat-tab label="Content">
                            <div class="content-list">
                              <div class="content-header">
                                <h4>Content Items ({{selectedNode.content.length}})</h4>
                                <button mat-button (click)="addContent(selectedNode)">
                                  <mat-icon>add</mat-icon>
                                  Add Content
                                </button>
                              </div>
                              
                              <div class="content-items" 
                                   cdkDropList
                                   [cdkDropListData]="selectedNode.content"
                                   (cdkDropListDropped)="dropContent($event)">
                                <div class="content-item" 
                                     *ngFor="let content of selectedNode.content"
                                     cdkDrag>
                                  <div class="content-info">
                                    <mat-icon class="drag-handle" cdkDragHandle>drag_indicator</mat-icon>
                                    <div class="content-details">
                                      <h5>{{content.title}}</h5>
                                      <div class="content-meta">
                                        <span class="content-type">{{content.type}}</span>
                                        <span class="content-status">{{content.status}}</span>
                                        <span class="content-date">{{formatDate(content.updatedAt)}}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div class="content-actions">
                                    <button mat-icon-button (click)="editContent(content)" matTooltip="Edit">
                                      <mat-icon>edit</mat-icon>
                                    </button>
                                    <button mat-icon-button (click)="removeContent(content)" matTooltip="Remove">
                                      <mat-icon>remove</mat-icon>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </mat-tab>

                          <!-- Settings Tab -->
                          <mat-tab label="Settings">
                            <div class="node-settings">
                              <form [formGroup]="nodeSettingsForm">
                                <mat-form-field appearance="outline">
                                  <mat-label>Display Name</mat-label>
                                  <input matInput formControlName="name">
                                </mat-form-field>
                                
                                <mat-form-field appearance="outline">
                                  <mat-label>Description</mat-label>
                                  <textarea matInput formControlName="description" rows="3"></textarea>
                                </mat-form-field>
                                
                                <mat-form-field appearance="outline">
                                  <mat-label>Status</mat-label>
                                  <mat-select formControlName="status">
                                    <mat-option value="active">Active</mat-option>
                                    <mat-option value="inactive">Inactive</mat-option>
                                    <mat-option value="archived">Archived</mat-option>
                                    <mat-option value="draft">Draft</mat-option>
                                  </mat-select>
                                </mat-form-field>
                                
                                <div class="settings-row">
                                  <mat-slide-toggle formControlName="isVisible">
                                    Visible in navigation
                                  </mat-slide-toggle>
                                </div>
                                
                                <div class="settings-row">
                                  <mat-slide-toggle formControlName="isNavigable">
                                    Allow direct navigation
                                  </mat-slide-toggle>
                                </div>
                                
                                <div class="settings-row">
                                  <mat-slide-toggle formControlName="requiresAuth">
                                    Requires authentication
                                  </mat-slide-toggle>
                                </div>
                                
                                <div class="settings-actions">
                                  <button mat-raised-button color="primary" (click)="saveNodeSettings()">
                                    Save Changes
                                  </button>
                                  <button mat-button (click)="resetNodeSettings()">
                                    Reset
                                  </button>
                                </div>
                              </form>
                            </div>
                          </mat-tab>

                          <!-- Analytics Tab -->
                          <mat-tab label="Analytics">
                            <div class="node-analytics">
                              <div class="analytics-summary">
                                <div class="metric-card">
                                  <h4>{{selectedNode.analytics.viewCount}}</h4>
                                  <p>Total Views</p>
                                </div>
                                <div class="metric-card">
                                  <h4>{{selectedNode.analytics.uniqueVisitors}}</h4>
                                  <p>Unique Visitors</p>
                                </div>
                                <div class="metric-card">
                                  <h4>{{selectedNode.analytics.contentCount}}</h4>
                                  <p>Content Items</p>
                                </div>
                                <div class="metric-card">
                                  <h4>{{formatDuration(selectedNode.analytics.avgTimeSpent)}}</h4>
                                  <p>Avg Time Spent</p>
                                </div>
                              </div>
                              
                              <div class="popular-content" *ngIf="selectedNode.analytics.popularContent.length > 0">
                                <h4>Popular Content</h4>
                                <div class="popular-list">
                                  <div class="popular-item" *ngFor="let item of selectedNode.analytics.popularContent">
                                    <div class="popular-info">
                                      <h5>{{item.title}}</h5>
                                      <div class="popular-meta">
                                        <span class="views">{{item.views}} views</span>
                                        <span class="engagement">{{item.engagement}}% engagement</span>
                                      </div>
                                    </div>
                                    <div class="popular-actions">
                                      <button mat-icon-button (click)="viewContent(item.contentId)" matTooltip="View">
                                        <mat-icon>visibility</mat-icon>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </mat-tab>
                        </mat-tab-group>
                      </mat-card-content>
                    </mat-card>
                    
                    <mat-card class="empty-state" *ngIf="!selectedNode">
                      <mat-card-content>
                        <div class="empty-content">
                          <mat-icon>folder_open</mat-icon>
                          <h3>Select a Node</h3>
                          <p>Choose a node from the hierarchy to view its details and manage its content.</p>
                        </div>
                      </mat-card-content>
                    </mat-card>
                  </div>
                </div>
              </div>
            </ng-template>
          </mat-tab>

          <!-- Templates Tab -->
          <mat-tab label="Content Templates">
            <ng-template matTabContent>
              <div class="templates-content">
                <!-- Template Filters -->
                <mat-card class="filters-card">
                  <div class="filters-container">
                    <mat-form-field appearance="outline" class="search-field">
                      <mat-label>Search templates...</mat-label>
                      <input matInput [formControl]="templateSearchControl" placeholder="Search by name, category, or tag">
                      <mat-icon matSuffix>search</mat-icon>
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline">
                      <mat-label>Type</mat-label>
                      <mat-select [formControl]="templateTypeFilterControl" multiple>
                        <mat-option *ngFor="let type of templateTypes" [value]="type.value">
                          {{type.label}}
                        </mat-option>
                      </mat-select>
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline">
                      <mat-label>Category</mat-label>
                      <mat-select [formControl]="templateCategoryFilterControl">
                        <mat-option value="">All Categories</mat-option>
                        <mat-option *ngFor="let category of templateCategories" [value]="category">
                          {{category}}
                        </mat-option>
                      </mat-select>
                    </mat-form-field>
                    
                    <button mat-button (click)="clearTemplateFilters()">
                      <mat-icon>clear</mat-icon>
                      Clear Filters
                    </button>
                  </div>
                </mat-card>

                <!-- Template Grid -->
                <div class="template-grid">
                  <mat-card class="template-card" *ngFor="let template of filteredTemplates">
                    <div class="template-thumbnail">
                      <img *ngIf="template.preview.thumbnail" 
                           [src]="template.preview.thumbnail" 
                           [alt]="template.name">
                      <div *ngIf="!template.preview.thumbnail" class="placeholder-thumbnail">
                        <mat-icon>description</mat-icon>
                      </div>
                      <div class="template-overlay">
                        <div class="template-type">{{template.type}}</div>
                        <div class="template-rating" *ngIf="template.metadata.rating > 0">
                          <mat-icon>star</mat-icon>
                          <span>{{template.metadata.rating}}</span>
                        </div>
                      </div>
                    </div>
                    
                    <mat-card-content>
                      <h4>{{template.name}}</h4>
                      <p>{{template.description}}</p>
                      <div class="template-meta">
                        <div class="template-info">
                          <span class="category">{{template.category}}</span>
                          <span class="version">v{{template.version}}</span>
                          <span class="usage-count">{{template.metadata.usageCount}} uses</span>
                        </div>
                        <div class="template-tags" *ngIf="template.metadata.tags.length > 0">
                          <mat-chip-listbox>
                            <mat-chip *ngFor="let tag of template.metadata.tags.slice(0, 3)">{{tag}}</mat-chip>
                            <mat-chip *ngIf="template.metadata.tags.length > 3" class="overflow-chip">
                              +{{template.metadata.tags.length - 3}}
                            </mat-chip>
                          </mat-chip-listbox>
                        </div>
                      </div>
                    </mat-card-content>
                    
                    <mat-card-actions>
                      <button mat-button (click)="useTemplate(template)">
                        <mat-icon>play_arrow</mat-icon>
                        Use Template
                      </button>
                      <button mat-button (click)="previewTemplate(template)">
                        <mat-icon>visibility</mat-icon>
                        Preview
                      </button>
                      <button mat-icon-button [matMenuTriggerFor]="templateMenu">
                        <mat-icon>more_vert</mat-icon>
                      </button>
                      <mat-menu #templateMenu="matMenu">
                        <button mat-menu-item (click)="editTemplate(template)">
                          <mat-icon>edit</mat-icon>
                          Edit
                        </button>
                        <button mat-menu-item (click)="duplicateTemplate(template)">
                          <mat-icon>content_copy</mat-icon>
                          Duplicate
                        </button>
                        <button mat-menu-item (click)="exportTemplate(template)">
                          <mat-icon>download</mat-icon>
                          Export
                        </button>
                        <button mat-menu-item (click)="shareTemplate(template)">
                          <mat-icon>share</mat-icon>
                          Share
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

          <!-- Analytics Tab -->
          <mat-tab label="Analytics">
            <ng-template matTabContent>
              <div class="analytics-content">
                <!-- Organization Analytics -->
                <div class="analytics-summary">
                  <mat-card class="metric-card">
                    <h3>{{totalNodes}}</h3>
                    <p>Total Nodes</p>
                  </mat-card>
                  <mat-card class="metric-card">
                    <h3>{{totalContent}}</h3>
                    <p>Content Items</p>
                  </mat-card>
                  <mat-card class="metric-card">
                    <h3>{{totalTemplates}}</h3>
                    <p>Templates</p>
                  </mat-card>
                  <mat-card class="metric-card">
                    <h3>{{averageDepth}}</h3>
                    <p>Avg Depth</p>
                  </mat-card>
                </div>

                <!-- Structure Analytics -->
                <div class="structure-analytics">
                  <mat-card class="chart-card">
                    <mat-card-header>
                      <mat-card-title>Content Distribution</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="distribution-chart">
                        <div class="distribution-item" *ngFor="let item of contentDistribution">
                          <div class="distribution-bar">
                            <div class="distribution-fill" [style.width.%]="item.percentage"></div>
                          </div>
                          <div class="distribution-info">
                            <span class="distribution-type">{{item.type}}</span>
                            <span class="distribution-count">{{item.count}}</span>
                            <span class="distribution-percent">{{item.percentage}}%</span>
                          </div>
                        </div>
                      </div>
                    </mat-card-content>
                  </mat-card>

                  <mat-card class="chart-card">
                    <mat-card-header>
                      <mat-card-title>Template Usage</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="template-usage">
                        <div class="usage-item" *ngFor="let item of templateUsageStats">
                          <div class="usage-info">
                            <h5>{{item.name}}</h5>
                            <div class="usage-meta">
                              <span class="usage-count">{{item.usageCount}} uses</span>
                              <span class="usage-rating">{{item.rating}}/5</span>
                            </div>
                          </div>
                          <div class="usage-bar">
                            <div class="usage-fill" [style.width.%]="item.usagePercentage"></div>
                          </div>
                        </div>
                      </div>
                    </mat-card-content>
                  </mat-card>
                </div>
              </div>
            </ng-template>
          </mat-tab>

          <!-- Settings Tab -->
          <mat-tab label="Settings">
            <ng-template matTabContent>
              <div class="settings-content">
                <form [formGroup]="organizationSettingsForm" (ngSubmit)="saveOrganizationSettings()">
                  <mat-card class="settings-section">
                    <mat-card-header>
                      <mat-card-title>Hierarchy Settings</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <mat-form-field appearance="outline">
                        <mat-label>Maximum Depth</mat-label>
                        <input matInput type="number" formControlName="maxDepth" min="1" max="10">
                      </mat-form-field>
                      
                      <mat-form-field appearance="outline">
                        <mat-label>Default Sort Order</mat-label>
                        <mat-select formControlName="defaultSortOrder">
                          <mat-option value="name">Name</mat-option>
                          <mat-option value="date">Date Created</mat-option>
                          <mat-option value="order">Custom Order</mat-option>
                        </mat-select>
                      </mat-form-field>
                      
                      <div class="settings-row">
                        <mat-slide-toggle formControlName="allowDragDrop">
                          Enable drag and drop reordering
                        </mat-slide-toggle>
                      </div>
                      
                      <div class="settings-row">
                        <mat-slide-toggle formControlName="autoExpandNodes">
                          Auto-expand nodes with children
                        </mat-slide-toggle>
                      </div>
                    </mat-card-content>
                  </mat-card>

                  <mat-card class="settings-section">
                    <mat-card-header>
                      <mat-card-title>Template Settings</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="settings-row">
                        <mat-slide-toggle formControlName="enableTemplateSharing">
                          Allow template sharing between users
                        </mat-slide-toggle>
                      </div>
                      
                      <div class="settings-row">
                        <mat-slide-toggle formControlName="requireTemplateApproval">
                          Require approval for new templates
                        </mat-slide-toggle>
                      </div>
                      
                      <div class="settings-row">
                        <mat-slide-toggle formControlName="enableTemplateVersioning">
                          Enable template versioning
                        </mat-slide-toggle>
                      </div>
                      
                      <mat-form-field appearance="outline">
                        <mat-label>Default Template Category</mat-label>
                        <mat-select formControlName="defaultTemplateCategory">
                          <mat-option *ngFor="let category of templateCategories" [value]="category">
                            {{category}}
                          </mat-option>
                        </mat-select>
                      </mat-form-field>
                    </mat-card-content>
                  </mat-card>

                  <div class="settings-actions">
                    <button mat-raised-button type="submit" color="primary">
                      Save Settings
                    </button>
                    <button mat-button type="button" (click)="resetOrganizationSettings()">
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
  styleUrls: ['./content-organization.component.scss']
})
export class ContentOrganizationComponent implements OnInit, OnDestroy {
  // Tree Control
  treeControl = new NestedTreeControl<ContentHierarchy>(node => node.children);
  hierarchyDataSource = new MatTreeNestedDataSource<ContentHierarchy>();

  // Form Controls
  templateSearchControl = this.fb.control('');
  templateTypeFilterControl = this.fb.control([]);
  templateCategoryFilterControl = this.fb.control('');
  
  nodeSettingsForm: FormGroup;
  organizationSettingsForm: FormGroup;

  // Component State
  selectedTabIndex = 0;
  selectedNode: ContentHierarchy | null = null;
  
  // Data
  contentHierarchy: ContentHierarchy[] = [];
  contentTemplates: ContentTemplate[] = [];
  filteredTemplates: ContentTemplate[] = [];
  
  // Options
  templateTypes = [
    { value: TemplateType.CHAPTER, label: 'Chapter' },
    { value: TemplateType.BLOG_POST, label: 'Blog Post' },
    { value: TemplateType.MARKETING_PAGE, label: 'Marketing Page' },
    { value: TemplateType.EMAIL, label: 'Email' },
    { value: TemplateType.DOCUMENTATION, label: 'Documentation' },
    { value: TemplateType.TUTORIAL, label: 'Tutorial' },
    { value: TemplateType.CASE_STUDY, label: 'Case Study' },
    { value: TemplateType.FAQ, label: 'FAQ' },
    { value: TemplateType.LANDING_PAGE, label: 'Landing Page' }
  ];

  templateCategories = [
    'Educational', 'Marketing', 'Documentation', 'Communication', 
    'Product', 'Support', 'Legal', 'Technical', 'Creative'
  ];

  // Analytics
  totalNodes = 0;
  totalContent = 0;
  totalTemplates = 0;
  averageDepth = 0;
  contentDistribution: any[] = [];
  templateUsageStats: any[] = [];

  private subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.nodeSettingsForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      status: ['active'],
      isVisible: [true],
      isNavigable: [true],
      requiresAuth: [false]
    });

    this.organizationSettingsForm = this.fb.group({
      maxDepth: [5, [Validators.min(1), Validators.max(10)]],
      defaultSortOrder: ['name'],
      allowDragDrop: [true],
      autoExpandNodes: [false],
      enableTemplateSharing: [true],
      requireTemplateApproval: [false],
      enableTemplateVersioning: [true],
      defaultTemplateCategory: ['Educational']
    });
  }

  ngOnInit(): void {
    this.initializeData();
    this.setupFilters();
    this.calculateAnalytics();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private initializeData(): void {
    // Initialize with mock data for development
    this.contentHierarchy = this.generateMockHierarchy();
    this.contentTemplates = this.generateMockTemplates();
    
    this.hierarchyDataSource.data = this.contentHierarchy;
    this.updateTemplateFilters();
  }

  private setupFilters(): void {
    // Template search filter
    this.subscription.add(
      this.templateSearchControl.valueChanges
        .pipe(debounceTime(300), distinctUntilChanged())
        .subscribe(() => this.applyTemplateFilters())
    );

    // Template type filter
    this.subscription.add(
      this.templateTypeFilterControl.valueChanges.subscribe(() => this.applyTemplateFilters())
    );

    // Template category filter
    this.subscription.add(
      this.templateCategoryFilterControl.valueChanges.subscribe(() => this.applyTemplateFilters())
    );
  }

  private applyTemplateFilters(): void {
    let filtered = [...this.contentTemplates];

    // Apply search filter
    const searchTerm = this.templateSearchControl.value?.toLowerCase();
    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchTerm) ||
        template.description.toLowerCase().includes(searchTerm) ||
        template.category.toLowerCase().includes(searchTerm) ||
        template.metadata.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Apply type filter
    const selectedTypes = this.templateTypeFilterControl.value;
    if (selectedTypes && selectedTypes.length > 0) {
      filtered = filtered.filter(template => selectedTypes.includes(template.type));
    }

    // Apply category filter
    const selectedCategory = this.templateCategoryFilterControl.value;
    if (selectedCategory) {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    this.filteredTemplates = filtered;
  }

  private updateTemplateFilters(): void {
    this.filteredTemplates = this.contentTemplates;
    this.applyTemplateFilters();
  }

  private calculateAnalytics(): void {
    this.totalNodes = this.countTotalNodes(this.contentHierarchy);
    this.totalContent = this.countTotalContent(this.contentHierarchy);
    this.totalTemplates = this.contentTemplates.length;
    this.averageDepth = this.calculateAverageDepth(this.contentHierarchy);

    // Calculate content distribution
    const typeCount: Record<string, number> = {};
    this.countNodeTypes(this.contentHierarchy, typeCount);
    
    const total = Object.values(typeCount).reduce((sum, count) => sum + count, 0);
    this.contentDistribution = Object.entries(typeCount).map(([type, count]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    })).sort((a, b) => b.count - a.count);

    // Calculate template usage stats
    this.templateUsageStats = this.contentTemplates
      .map(template => ({
        name: template.name,
        usageCount: template.metadata.usageCount,
        rating: template.metadata.rating,
        usagePercentage: 0
      }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10);

    const maxUsage = Math.max(...this.templateUsageStats.map(t => t.usageCount));
    this.templateUsageStats.forEach(stat => {
      stat.usagePercentage = maxUsage > 0 ? (stat.usageCount / maxUsage) * 100 : 0;
    });
  }

  private countTotalNodes(nodes: ContentHierarchy[]): number {
    let count = nodes.length;
    nodes.forEach(node => {
      count += this.countTotalNodes(node.children);
    });
    return count;
  }

  private countTotalContent(nodes: ContentHierarchy[]): number {
    let count = 0;
    nodes.forEach(node => {
      count += node.content.length;
      count += this.countTotalContent(node.children);
    });
    return count;
  }

  private calculateAverageDepth(nodes: ContentHierarchy[], currentDepth: number = 1): number {
    if (nodes.length === 0) return 0;
    
    let totalDepth = 0;
    let nodeCount = 0;
    
    nodes.forEach(node => {
      totalDepth += currentDepth;
      nodeCount++;
      
      if (node.children.length > 0) {
        const childResult = this.calculateAverageDepth(node.children, currentDepth + 1);
        totalDepth += childResult * node.children.length;
        nodeCount += node.children.length;
      }
    });
    
    return nodeCount > 0 ? Math.round(totalDepth / nodeCount) : 0;
  }

  private countNodeTypes(nodes: ContentHierarchy[], typeCount: Record<string, number>): void {
    nodes.forEach(node => {
      typeCount[node.type] = (typeCount[node.type] || 0) + 1;
      this.countNodeTypes(node.children, typeCount);
    });
  }

  // Event Handlers
  onTabChange(event: any): void {
    this.selectedTabIndex = event.index;
  }

  // Tree Operations
  hasChildren = (_: number, node: ContentHierarchy) => !!node.children && node.children.length > 0;

  selectNode(node: ContentHierarchy): void {
    this.selectedNode = node;
    this.updateNodeSettings();
  }

  private updateNodeSettings(): void {
    if (this.selectedNode) {
      this.nodeSettingsForm.patchValue({
        name: this.selectedNode.name,
        description: this.selectedNode.description || '',
        status: this.selectedNode.status,
        isVisible: this.selectedNode.metadata.isVisible,
        isNavigable: this.selectedNode.metadata.isNavigable,
        requiresAuth: this.selectedNode.metadata.requiresAuth
      });
    }
  }

  expandAll(): void {
    this.treeControl.expandAll();
  }

  collapseAll(): void {
    this.treeControl.collapseAll();
  }

  sortByName(): void {
    this.sortHierarchy('name');
  }

  sortByDate(): void {
    this.sortHierarchy('date');
  }

  sortByOrder(): void {
    this.sortHierarchy('order');
  }

  private sortHierarchy(sortBy: string): void {
    const sortFunction = (a: ContentHierarchy, b: ContentHierarchy) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'order':
          return a.metadata.order - b.metadata.order;
        default:
          return 0;
      }
    };

    const sortRecursive = (nodes: ContentHierarchy[]) => {
      nodes.sort(sortFunction);
      nodes.forEach(node => {
        if (node.children.length > 0) {
          sortRecursive(node.children);
        }
      });
    };

    sortRecursive(this.contentHierarchy);
    this.hierarchyDataSource.data = [...this.contentHierarchy];
  }

  // Node Operations
  createHierarchyNode(): void {
    this.snackBar.open('Create hierarchy node functionality would be implemented here', 'Close', {
      duration: 3000
    });
  }

  editNode(node: ContentHierarchy, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.snackBar.open(`Edit node: ${node.name}`, 'Close', {
      duration: 2000
    });
  }

  addChildNode(node: ContentHierarchy): void {
    this.snackBar.open(`Add child to: ${node.name}`, 'Close', {
      duration: 2000
    });
  }

  addContent(node: ContentHierarchy): void {
    this.snackBar.open(`Add content to: ${node.name}`, 'Close', {
      duration: 2000
    });
  }

  duplicateNode(node: ContentHierarchy): void {
    this.snackBar.open(`Duplicate node: ${node.name}`, 'Close', {
      duration: 2000
    });
  }

  moveNode(node: ContentHierarchy): void {
    this.snackBar.open(`Move node: ${node.name}`, 'Close', {
      duration: 2000
    });
  }

  exportNode(node: ContentHierarchy): void {
    this.snackBar.open(`Export node: ${node.name}`, 'Close', {
      duration: 2000
    });
  }

  deleteNode(node: ContentHierarchy): void {
    this.snackBar.open(`Delete node: ${node.name}`, 'Close', {
      duration: 2000
    });
  }

  // Content Operations
  editContent(content: ContentReference): void {
    this.snackBar.open(`Edit content: ${content.title}`, 'Close', {
      duration: 2000
    });
  }

  removeContent(content: ContentReference): void {
    if (this.selectedNode) {
      const index = this.selectedNode.content.indexOf(content);
      if (index > -1) {
        this.selectedNode.content.splice(index, 1);
        this.snackBar.open(`Removed: ${content.title}`, 'Close', {
          duration: 2000
        });
      }
    }
  }

  viewContent(contentId: string): void {
    this.snackBar.open(`View content: ${contentId}`, 'Close', {
      duration: 2000
    });
  }

  // Drag and Drop
  dropNode(event: CdkDragDrop<ContentHierarchy[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
    this.hierarchyDataSource.data = [...this.contentHierarchy];
  }

  dropContent(event: CdkDragDrop<ContentReference[]>): void {
    moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    // Update position values
    event.container.data.forEach((content, index) => {
      content.position = index;
    });
  }

  // Node Settings
  saveNodeSettings(): void {
    if (this.nodeSettingsForm.valid && this.selectedNode) {
      const formValue = this.nodeSettingsForm.value;
      this.selectedNode.name = formValue.name;
      this.selectedNode.description = formValue.description;
      this.selectedNode.status = formValue.status;
      this.selectedNode.metadata.isVisible = formValue.isVisible;
      this.selectedNode.metadata.isNavigable = formValue.isNavigable;
      this.selectedNode.metadata.requiresAuth = formValue.requiresAuth;
      this.selectedNode.updatedAt = new Date();

      this.hierarchyDataSource.data = [...this.contentHierarchy];
      
      this.snackBar.open('Node settings saved successfully', 'Close', {
        duration: 2000
      });
    }
  }

  resetNodeSettings(): void {
    this.updateNodeSettings();
  }

  refreshNodeAnalytics(): void {
    this.snackBar.open('Analytics refreshed', 'Close', {
      duration: 2000
    });
  }

  // Template Operations
  createTemplate(): void {
    this.snackBar.open('Create template functionality would be implemented here', 'Close', {
      duration: 3000
    });
  }

  useTemplate(template: ContentTemplate): void {
    this.snackBar.open(`Using template: ${template.name}`, 'Close', {
      duration: 2000
    });
  }

  previewTemplate(template: ContentTemplate): void {
    this.snackBar.open(`Preview template: ${template.name}`, 'Close', {
      duration: 2000
    });
  }

  editTemplate(template: ContentTemplate): void {
    this.snackBar.open(`Edit template: ${template.name}`, 'Close', {
      duration: 2000
    });
  }

  duplicateTemplate(template: ContentTemplate): void {
    this.snackBar.open(`Duplicate template: ${template.name}`, 'Close', {
      duration: 2000
    });
  }

  exportTemplate(template: ContentTemplate): void {
    this.snackBar.open(`Export template: ${template.name}`, 'Close', {
      duration: 2000
    });
  }

  shareTemplate(template: ContentTemplate): void {
    this.snackBar.open(`Share template: ${template.name}`, 'Close', {
      duration: 2000
    });
  }

  deleteTemplate(template: ContentTemplate): void {
    const index = this.contentTemplates.indexOf(template);
    if (index > -1) {
      this.contentTemplates.splice(index, 1);
      this.updateTemplateFilters();
      this.calculateAnalytics();
      
      this.snackBar.open(`Deleted template: ${template.name}`, 'Close', {
        duration: 2000
      });
    }
  }

  clearTemplateFilters(): void {
    this.templateSearchControl.setValue('');
    this.templateTypeFilterControl.setValue([]);
    this.templateCategoryFilterControl.setValue('');
  }

  // Organization Settings
  saveOrganizationSettings(): void {
    if (this.organizationSettingsForm.valid) {
      this.snackBar.open('Organization settings saved successfully', 'Close', {
        duration: 3000
      });
    }
  }

  resetOrganizationSettings(): void {
    this.organizationSettingsForm.reset({
      maxDepth: 5,
      defaultSortOrder: 'name',
      allowDragDrop: true,
      autoExpandNodes: false,
      enableTemplateSharing: true,
      requireTemplateApproval: false,
      enableTemplateVersioning: true,
      defaultTemplateCategory: 'Educational'
    });
  }

  // Helper Methods
  getNodeIcon(type: ContentNodeType): string {
    switch (type) {
      case ContentNodeType.ROOT: return 'home';
      case ContentNodeType.SECTION: return 'folder';
      case ContentNodeType.CHAPTER: return 'menu_book';
      case ContentNodeType.CATEGORY: return 'category';
      case ContentNodeType.COLLECTION: return 'collections';
      case ContentNodeType.FOLDER: return 'folder_open';
      case ContentNodeType.TAG: return 'label';
      default: return 'folder';
    }
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `${seconds}s`;
    }
  }

  // Additional Operations
  importHierarchy(): void {
    this.snackBar.open('Import hierarchy functionality would be implemented here', 'Close', {
      duration: 3000
    });
  }

  exportHierarchy(): void {
    this.snackBar.open('Export hierarchy functionality would be implemented here', 'Close', {
      duration: 3000
    });
  }

  validateStructure(): void {
    this.snackBar.open('Structure validation complete', 'Close', {
      duration: 3000
    });
  }

  organizationSettings(): void {
    this.selectedTabIndex = 3; // Switch to settings tab
  }

  // Mock Data Generators
  private generateMockHierarchy(): ContentHierarchy[] {
    const hierarchy: ContentHierarchy[] = [];
    
    // Root sections
    const sections = [
      { name: 'Foundation Principles', type: ContentNodeType.SECTION, icon: 'foundation' },
      { name: 'Advanced Techniques', type: ContentNodeType.SECTION, icon: 'trending_up' },
      { name: 'Case Studies', type: ContentNodeType.SECTION, icon: 'cases' },
      { name: 'Resources', type: ContentNodeType.SECTION, icon: 'library_books' }
    ];

    sections.forEach((section, index) => {
      const node: ContentHierarchy = {
        id: `section-${index + 1}`,
        name: section.name,
        type: section.type,
        slug: section.name.toLowerCase().replace(/\s+/g, '-'),
        description: `${section.name} section description`,
        icon: section.icon,
        parent: undefined,
        children: this.generateMockChildren(section.name, 3),
        content: this.generateMockContent(Math.floor(Math.random() * 5) + 2),
        metadata: {
          order: index,
          isVisible: true,
          isNavigable: true,
          requiresAuth: false,
          accessLevel: 'public',
          keywords: ['keyword1', 'keyword2'],
          tags: ['tag1', 'tag2'],
          customProperties: {},
          seo: {
            title: `SEO Title for ${section.name}`,
            description: `SEO description for ${section.name}`,
            keywords: ['seo1', 'seo2'],
            metaTags: {},
            structuredData: {}
          }
        },
        permissions: [],
        settings: {
          allowChildNodes: true,
          maxDepth: 3,
          sortBy: 'order',
          sortDirection: 'asc',
          viewMode: 'tree',
          pagination: {
            enabled: false,
            itemsPerPage: 10,
            showPageSizeOptions: true,
            pageSizeOptions: [5, 10, 25]
          },
          filters: {
            enabled: true,
            availableFilters: ['type', 'status'],
            defaultFilters: {}
          }
        },
        analytics: {
          viewCount: Math.floor(Math.random() * 1000) + 100,
          uniqueVisitors: Math.floor(Math.random() * 500) + 50,
          contentCount: Math.floor(Math.random() * 20) + 5,
          avgTimeSpent: Math.floor(Math.random() * 300) + 120,
          popularContent: [],
          trends: [],
          performance: {
            loadTime: Math.random() * 1000 + 200,
            searchTime: Math.random() * 100 + 50,
            navigationTime: Math.random() * 200 + 100,
            errorRate: Math.random() * 0.05
          }
        },
        createdBy: 'admin',
        createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        status: HierarchyStatus.ACTIVE
      };
      
      hierarchy.push(node);
    });

    return hierarchy;
  }

  private generateMockChildren(parentName: string, count: number): ContentHierarchy[] {
    const children: ContentHierarchy[] = [];
    const childTypes = [ContentNodeType.CHAPTER, ContentNodeType.CATEGORY, ContentNodeType.FOLDER];

    for (let i = 0; i < count; i++) {
      const type = childTypes[Math.floor(Math.random() * childTypes.length)];
      const child: ContentHierarchy = {
        id: `child-${parentName}-${i + 1}`,
        name: `${parentName} Chapter ${i + 1}`,
        type,
        slug: `${parentName.toLowerCase()}-chapter-${i + 1}`.replace(/\s+/g, '-'),
        description: `Description for chapter ${i + 1}`,
        parent: parentName,
        children: Math.random() > 0.7 ? this.generateMockChildren(`${parentName} Chapter ${i + 1}`, 2) : [],
        content: this.generateMockContent(Math.floor(Math.random() * 3) + 1),
        metadata: {
          order: i,
          isVisible: true,
          isNavigable: true,
          requiresAuth: false,
          accessLevel: 'public',
          keywords: [],
          tags: [],
          customProperties: {},
          seo: {
            title: '',
            description: '',
            keywords: [],
            metaTags: {},
            structuredData: {}
          }
        },
        permissions: [],
        settings: {
          allowChildNodes: true,
          maxDepth: 2,
          sortBy: 'order',
          sortDirection: 'asc',
          viewMode: 'list',
          pagination: {
            enabled: false,
            itemsPerPage: 10,
            showPageSizeOptions: false,
            pageSizeOptions: [10]
          },
          filters: {
            enabled: false,
            availableFilters: [],
            defaultFilters: {}
          }
        },
        analytics: {
          viewCount: Math.floor(Math.random() * 500) + 50,
          uniqueVisitors: Math.floor(Math.random() * 250) + 25,
          contentCount: Math.floor(Math.random() * 10) + 1,
          avgTimeSpent: Math.floor(Math.random() * 200) + 60,
          popularContent: [],
          trends: [],
          performance: {
            loadTime: Math.random() * 800 + 150,
            searchTime: Math.random() * 80 + 30,
            navigationTime: Math.random() * 150 + 75,
            errorRate: Math.random() * 0.03
          }
        },
        createdBy: 'admin',
        createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        status: HierarchyStatus.ACTIVE
      };

      children.push(child);
    }

    return children;
  }

  private generateMockContent(count: number): ContentReference[] {
    const content: ContentReference[] = [];
    const contentTypes = ['chapter', 'tutorial', 'example', 'exercise', 'reference'];
    const statuses = ['draft', 'published', 'in_review', 'archived'];

    for (let i = 0; i < count; i++) {
      content.push({
        contentId: `content-${Date.now()}-${i}`,
        title: `Content Item ${i + 1}`,
        type: contentTypes[Math.floor(Math.random() * contentTypes.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        position: i,
        isRequired: Math.random() > 0.5,
        dependencies: [],
        metadata: {},
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      });
    }

    return content;
  }

  private generateMockTemplates(): ContentTemplate[] {
    const templates: ContentTemplate[] = [];
    const templateNames = [
      'Chapter Introduction',
      'Tutorial Step',
      'Case Study Analysis',
      'FAQ Section',
      'Product Landing Page',
      'Email Newsletter',
      'Documentation Page',
      'Blog Post Article',
      'Marketing Banner',
      'Technical Reference'
    ];

    templateNames.forEach((name, index) => {
      const type = Object.values(TemplateType)[Math.floor(Math.random() * Object.values(TemplateType).length)];
      const category = this.templateCategories[Math.floor(Math.random() * this.templateCategories.length)];

      templates.push({
        id: `template-${index + 1}`,
        name,
        description: `Template for creating ${name.toLowerCase()} content`,
        type,
        category,
        version: `1.${Math.floor(Math.random() * 10)}`,
        schema: {
          fields: [],
          layout: {
            sections: [],
            columns: 1,
            spacing: 'medium',
            breakpoints: {}
          },
          styles: {
            css: '',
            variables: {},
            themes: []
          },
          scripts: [],
          dependencies: []
        },
        content: {
          structure: {
            sections: [],
            navigation: {
              enabled: false,
              type: 'sidebar',
              items: []
            },
            metadata: {
              title: '',
              description: '',
              author: '',
              tags: [],
              categories: [],
              difficulty: '',
              estimatedTime: 0
            }
          },
          defaultValues: {},
          sampleData: {},
          placeholders: {}
        },
        settings: {
          editable: true,
          customizable: true,
          allowComments: true,
          requireApproval: false,
          versioning: {
            enabled: true,
            autoSave: true,
            maxVersions: 10,
            approvalRequired: false
          },
          publishing: {
            autoPublish: false,
            scheduleSupport: true,
            multiLanguage: false,
            cdn: true
          },
          seo: {
            enabled: true,
            autoGenerate: true,
            fields: ['title', 'description'],
            templates: {}
          }
        },
        metadata: {
          tags: ['template', 'content', type],
          categories: [category],
          difficulty: ['beginner', 'intermediate', 'advanced', 'expert'][Math.floor(Math.random() * 4)] as any,
          estimatedTime: Math.floor(Math.random() * 120) + 15,
          prerequisites: [],
          learningObjectives: [],
          rating: Math.floor(Math.random() * 5) + 1,
          downloads: Math.floor(Math.random() * 1000) + 50,
          usageCount: Math.floor(Math.random() * 500) + 10
        },
        preview: {
          thumbnail: `https://picsum.photos/400/300?random=${index + 50}`,
          screenshots: [],
          description: `Preview of ${name} template`
        },
        usage: {
          totalUses: Math.floor(Math.random() * 500) + 10,
          recentUses: [],
          popularFields: [],
          feedback: []
        },
        validation: {
          rules: [],
          warnings: [],
          errors: [],
          isValid: true,
          lastValidated: new Date()
        },
        createdBy: 'admin',
        createdAt: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        isActive: true,
        isPublic: Math.random() > 0.3
      });
    });

    return templates;
  }
}