import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
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
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Schema, DOMParser, DOMSerializer } from 'prosemirror-model';
import { schema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';
import { exampleSetup } from 'prosemirror-example-setup';
import { keymap } from 'prosemirror-keymap';
import { history } from 'prosemirror-history';
import { baseKeymap } from 'prosemirror-commands';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { Subscription, Subject, debounceTime, distinctUntilChanged } from 'rxjs';

// Content Management Interfaces
export interface ContentItem {
  id: string;
  type: ContentType;
  title: string;
  slug: string;
  description?: string;
  content: string;
  status: ContentStatus;
  metadata: ContentMetadata;
  workflow: WorkflowState;
  version: ContentVersion;
  collaborators: ContentCollaborator[];
  tags: string[];
  categories: string[];
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export enum ContentType {
  CHAPTER = 'chapter',
  TEMPLATE = 'template',
  BLOG_POST = 'blog_post',
  MARKETING_PAGE = 'marketing_page',
  EMAIL_TEMPLATE = 'email_template',
  DOCUMENTATION = 'documentation'
}

export enum ContentStatus {
  DRAFT = 'draft',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  PUBLISHED = 'published',
  SCHEDULED = 'scheduled',
  ARCHIVED = 'archived'
}

export interface ContentMetadata {
  wordCount: number;
  readingTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  targetAudience: string[];
  language: string;
  lastModifiedBy: string;
}

export interface WorkflowState {
  currentStage: WorkflowStage;
  comments: WorkflowComment[];
  approvers: WorkflowApprover[];
  automatedChecks: AutomatedCheck[];
}

export enum WorkflowStage {
  CREATION = 'creation',
  CONTENT_REVIEW = 'content_review',
  COPY_EDITING = 'copy_editing',
  FINAL_APPROVAL = 'final_approval',
  READY_TO_PUBLISH = 'ready_to_publish',
  PUBLISHED = 'published'
}

export interface WorkflowComment {
  id: string;
  userId: string;
  type: 'comment' | 'suggestion' | 'approval' | 'rejection';
  content: string;
  position?: ContentPosition;
  resolved: boolean;
  createdAt: Date;
}

export interface ContentPosition {
  start: number;
  end: number;
  line?: number;
  column?: number;
}

export interface WorkflowApprover {
  userId: string;
  role: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  approvedAt?: Date;
}

export interface AutomatedCheck {
  type: 'spell_check' | 'grammar_check' | 'seo_audit' | 'accessibility';
  status: 'pending' | 'passed' | 'failed' | 'warning';
  score?: number;
  issues: CheckIssue[];
  lastRun: Date;
}

export interface CheckIssue {
  severity: 'error' | 'warning' | 'info';
  message: string;
  position?: ContentPosition;
  suggestion?: string;
  autoFixable: boolean;
}

export interface ContentVersion {
  current: number;
  major: number;
  minor: number;
  patch: number;
  history: VersionHistory[];
}

export interface VersionHistory {
  version: string;
  author: string;
  timestamp: Date;
  message: string;
  changes: ContentChange[];
}

export interface ContentChange {
  type: 'addition' | 'deletion' | 'modification';
  path: string;
  oldValue?: any;
  newValue?: any;
  description: string;
}

export interface ContentCollaborator {
  userId: string;
  role: 'owner' | 'editor' | 'reviewer' | 'viewer';
  permissions: string[];
  joinedAt: Date;
  lastActive?: Date;
}

export interface EditorConfiguration {
  toolbar: ToolbarConfiguration;
  plugins: EditorPlugin[];
  shortcuts: KeyboardShortcut[];
  collaboration: CollaborationSettings;
  autosave: AutosaveSettings;
}

export interface ToolbarConfiguration {
  groups: ToolbarGroup[];
  customButtons: CustomToolbarButton[];
  position: 'top' | 'bottom' | 'floating';
  sticky: boolean;
}

export interface ToolbarGroup {
  name: string;
  items: ToolbarItem[];
  separator: boolean;
}

export interface ToolbarItem {
  id: string;
  type: 'button' | 'dropdown' | 'toggle' | 'separator';
  label: string;
  icon: string;
  command: string;
  shortcut?: string;
  enabled: boolean;
  visible: boolean;
}

export interface CustomToolbarButton {
  id: string;
  label: string;
  icon: string;
  action: (view: EditorView) => void;
  enabled: (state: EditorState) => boolean;
}

export interface EditorPlugin {
  name: string;
  enabled: boolean;
  config: Record<string, any>;
}

export interface KeyboardShortcut {
  key: string;
  command: string;
  description: string;
}

export interface CollaborationSettings {
  enabled: boolean;
  realTimeEditing: boolean;
  cursorTracking: boolean;
  commentMode: boolean;
  maxCollaborators: number;
}

export interface AutosaveSettings {
  enabled: boolean;
  interval: number; // milliseconds
  onBlur: boolean;
  onIdle: boolean;
  localBackup: boolean;
}

export interface MediaInsertOptions {
  allowedTypes: string[];
  maxFileSize: number;
  autoOptimize: boolean;
  enableAltText: boolean;
  enableCaption: boolean;
}

export interface CodeHighlightOptions {
  languages: string[];
  theme: string;
  lineNumbers: boolean;
  wordWrap: boolean;
}

export interface LinkValidationOptions {
  checkInternal: boolean;
  checkExternal: boolean;
  showPreview: boolean;
  validateOnPaste: boolean;
}

export interface AccessibilityOptions {
  enforceAltText: boolean;
  headingStructure: boolean;
  colorContrast: boolean;
  readingOrder: boolean;
  keyboardNavigation: boolean;
}

// ProseMirror Plugin Keys
const collaborationPluginKey = new PluginKey('collaboration');
const commentsPluginKey = new PluginKey('comments');
const spellCheckPluginKey = new PluginKey('spellCheck');
const accessibilityPluginKey = new PluginKey('accessibility');

@Component({
  selector: 'app-content-editor',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
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
    MatTabsModule,
    MatExpansionModule,
    MatBadgeModule,
    MatDividerModule,
    DragDropModule
  ],
  template: `
    <div class="content-editor-container">
      <!-- Editor Header -->
      <mat-card class="editor-header">
        <div class="header-content">
          <div class="content-info">
            <mat-form-field appearance="outline" class="title-field">
              <mat-label>Content Title</mat-label>
              <input matInput [formControl]="editorForm.get('title')!" 
                     placeholder="Enter content title...">
            </mat-form-field>
            
            <div class="content-metadata">
              <mat-chip-listbox>
                <mat-chip [selected]="true">{{ getContentTypeLabel(currentContent?.type) }}</mat-chip>
                <mat-chip [ngClass]="'status-' + currentContent?.status">
                  {{ getStatusLabel(currentContent?.status) }}
                </mat-chip>
                <mat-chip>{{ currentContent?.metadata?.wordCount || 0 }} words</mat-chip>
                <mat-chip>{{ currentContent?.metadata?.readingTime || 0 }} min read</mat-chip>
              </mat-chip-listbox>
            </div>
          </div>

          <div class="header-actions">
            <button mat-button [matMenuTriggerFor]="viewMenu">
              <mat-icon>visibility</mat-icon>
              View
            </button>
            <mat-menu #viewMenu="matMenu">
              <button mat-menu-item (click)="togglePreviewMode()">
                <mat-icon>preview</mat-icon>
                {{ previewMode ? 'Edit Mode' : 'Preview Mode' }}
              </button>
              <button mat-menu-item (click)="toggleFullscreen()">
                <mat-icon>fullscreen</mat-icon>
                {{ fullscreenMode ? 'Exit Fullscreen' : 'Fullscreen' }}
              </button>
              <button mat-menu-item (click)="toggleFocusMode()">
                <mat-icon>center_focus_strong</mat-icon>
                {{ focusMode ? 'Exit Focus Mode' : 'Focus Mode' }}
              </button>
            </mat-menu>

            <button mat-button [matMenuTriggerFor]="insertMenu" [disabled]="previewMode">
              <mat-icon>add</mat-icon>
              Insert
            </button>
            <mat-menu #insertMenu="matMenu">
              <button mat-menu-item (click)="insertMedia()">
                <mat-icon>image</mat-icon>
                Image
              </button>
              <button mat-menu-item (click)="insertVideo()">
                <mat-icon>videocam</mat-icon>
                Video
              </button>
              <button mat-menu-item (click)="insertCodeBlock()">
                <mat-icon>code</mat-icon>
                Code Block
              </button>
              <button mat-menu-item (click)="insertTable()">
                <mat-icon>table_chart</mat-icon>
                Table
              </button>
              <button mat-menu-item (click)="insertLink()">
                <mat-icon>link</mat-icon>
                Link
              </button>
            </mat-menu>

            <mat-divider [vertical]="true"></mat-divider>

            <button mat-button (click)="saveContent()" 
                    [disabled]="!hasUnsavedChanges" 
                    matTooltip="Save (Ctrl+S)">
              <mat-icon>save</mat-icon>
              {{ hasUnsavedChanges ? 'Save*' : 'Saved' }}
            </button>

            <button mat-button [matMenuTriggerFor]="moreMenu">
              <mat-icon>more_vert</mat-icon>
            </button>
            <mat-menu #moreMenu="matMenu">
              <button mat-menu-item (click)="showVersionHistory()">
                <mat-icon>history</mat-icon>
                Version History
              </button>
              <button mat-menu-item (click)="showWorkflowPanel()">
                <mat-icon>assignment</mat-icon>
                Workflow & Comments
              </button>
              <button mat-menu-item (click)="showSettings()">
                <mat-icon>settings</mat-icon>
                Editor Settings
              </button>
              <mat-divider></mat-divider>
              <button mat-menu-item (click)="exportContent()">
                <mat-icon>download</mat-icon>
                Export
              </button>
            </mat-menu>
          </div>
        </div>

        <!-- Auto-save indicator -->
        <div class="autosave-indicator" *ngIf="autosaveSettings.enabled">
          <mat-progress-bar mode="indeterminate" *ngIf="isSaving"></mat-progress-bar>
          <div class="autosave-status" [ngClass]="{
            'saving': isSaving,
            'saved': !isSaving && !hasUnsavedChanges,
            'unsaved': !isSaving && hasUnsavedChanges
          }">
            <mat-icon>{{ getSaveStatusIcon() }}</mat-icon>
            <span>{{ getSaveStatusText() }}</span>
          </div>
        </div>
      </mat-card>

      <!-- Main Editor Layout -->
      <div class="editor-layout" [ngClass]="{
        'fullscreen': fullscreenMode,
        'focus-mode': focusMode,
        'preview-mode': previewMode,
        'show-sidebar': showSidebar
      }">
        
        <!-- Editor Toolbar -->
        <mat-toolbar class="editor-toolbar" *ngIf="!previewMode && !focusMode">
          <div class="toolbar-groups">
            <!-- Formatting Group -->
            <div class="toolbar-group">
              <button mat-icon-button 
                      matTooltip="Bold (Ctrl+B)"
                      [class.active]="isMarkActive('strong')"
                      (click)="toggleMark('strong')">
                <mat-icon>format_bold</mat-icon>
              </button>
              <button mat-icon-button 
                      matTooltip="Italic (Ctrl+I)"
                      [class.active]="isMarkActive('em')"
                      (click)="toggleMark('em')">
                <mat-icon>format_italic</mat-icon>
              </button>
              <button mat-icon-button 
                      matTooltip="Underline (Ctrl+U)"
                      [class.active]="isMarkActive('underline')"
                      (click)="toggleMark('underline')">
                <mat-icon>format_underlined</mat-icon>
              </button>
              <button mat-icon-button 
                      matTooltip="Code (Ctrl+`)"
                      [class.active]="isMarkActive('code')"
                      (click)="toggleMark('code')">
                <mat-icon>code</mat-icon>
              </button>
            </div>

            <mat-divider [vertical]="true"></mat-divider>

            <!-- Headings Group -->
            <div class="toolbar-group">
              <mat-select [value]="getCurrentHeadingLevel()" 
                          (selectionChange)="setHeadingLevel($event.value)"
                          class="heading-select">
                <mat-option value="paragraph">Paragraph</mat-option>
                <mat-option value="1">Heading 1</mat-option>
                <mat-option value="2">Heading 2</mat-option>
                <mat-option value="3">Heading 3</mat-option>
                <mat-option value="4">Heading 4</mat-option>
                <mat-option value="5">Heading 5</mat-option>
                <mat-option value="6">Heading 6</mat-option>
              </mat-select>
            </div>

            <mat-divider [vertical]="true"></mat-divider>

            <!-- Lists Group -->
            <div class="toolbar-group">
              <button mat-icon-button 
                      matTooltip="Bullet List"
                      [class.active]="isListActive('bullet_list')"
                      (click)="toggleList('bullet_list')">
                <mat-icon>format_list_bulleted</mat-icon>
              </button>
              <button mat-icon-button 
                      matTooltip="Numbered List"
                      [class.active]="isListActive('ordered_list')"
                      (click)="toggleList('ordered_list')">
                <mat-icon>format_list_numbered</mat-icon>
              </button>
              <button mat-icon-button 
                      matTooltip="Decrease Indent"
                      (click)="decreaseIndent()">
                <mat-icon>format_indent_decrease</mat-icon>
              </button>
              <button mat-icon-button 
                      matTooltip="Increase Indent"
                      (click)="increaseIndent()">
                <mat-icon>format_indent_increase</mat-icon>
              </button>
            </div>

            <mat-divider [vertical]="true"></mat-divider>

            <!-- Alignment Group -->
            <div class="toolbar-group">
              <button mat-icon-button 
                      matTooltip="Align Left"
                      [class.active]="getAlignment() === 'left'"
                      (click)="setAlignment('left')">
                <mat-icon>format_align_left</mat-icon>
              </button>
              <button mat-icon-button 
                      matTooltip="Align Center"
                      [class.active]="getAlignment() === 'center'"
                      (click)="setAlignment('center')">
                <mat-icon>format_align_center</mat-icon>
              </button>
              <button mat-icon-button 
                      matTooltip="Align Right"
                      [class.active]="getAlignment() === 'right'"
                      (click)="setAlignment('right')">
                <mat-icon>format_align_right</mat-icon>
              </button>
              <button mat-icon-button 
                      matTooltip="Justify"
                      [class.active]="getAlignment() === 'justify'"
                      (click)="setAlignment('justify')">
                <mat-icon>format_align_justify</mat-icon>
              </button>
            </div>

            <mat-divider [vertical]="true"></mat-divider>

            <!-- Insert Group -->
            <div class="toolbar-group">
              <button mat-icon-button 
                      matTooltip="Insert Link (Ctrl+K)"
                      (click)="insertLink()">
                <mat-icon>link</mat-icon>
              </button>
              <button mat-icon-button 
                      matTooltip="Insert Image"
                      (click)="insertMedia()">
                <mat-icon>image</mat-icon>
              </button>
              <button mat-icon-button 
                      matTooltip="Insert Table"
                      (click)="insertTable()">
                <mat-icon>table_chart</mat-icon>
              </button>
              <button mat-icon-button 
                      matTooltip="Insert Horizontal Rule"
                      (click)="insertHorizontalRule()">
                <mat-icon>horizontal_rule</mat-icon>
              </button>
            </div>

            <mat-divider [vertical]="true"></mat-divider>

            <!-- History Group -->
            <div class="toolbar-group">
              <button mat-icon-button 
                      matTooltip="Undo (Ctrl+Z)"
                      [disabled]="!canUndo()"
                      (click)="undo()">
                <mat-icon>undo</mat-icon>
              </button>
              <button mat-icon-button 
                      matTooltip="Redo (Ctrl+Y)"
                      [disabled]="!canRedo()"
                      (click)="redo()">
                <mat-icon>redo</mat-icon>
              </button>
            </div>

            <div class="toolbar-spacer"></div>

            <!-- Collaboration Indicators -->
            <div class="collaboration-indicators" *ngIf="collaborationSettings.enabled">
              <div class="active-collaborators">
                <div class="collaborator-avatar" 
                     *ngFor="let collaborator of activeCollaborators"
                     [matTooltip]="collaborator.name"
                     [style.background-color]="collaborator.color">
                  {{ collaborator.initials }}
                </div>
              </div>
              
              <button mat-icon-button 
                      matTooltip="Comments ({{ unreadCommentsCount }})"
                      [matBadge]="unreadCommentsCount"
                      [matBadgeHidden]="unreadCommentsCount === 0"
                      matBadgeColor="accent"
                      (click)="toggleCommentsPanel()">
                <mat-icon>comment</mat-icon>
              </button>
            </div>
          </div>
        </mat-toolbar>

        <!-- Editor Content Area -->
        <div class="editor-content-container">
          <!-- ProseMirror Editor -->
          <div class="editor-content" 
               [class.preview-mode]="previewMode"
               [class.focus-mode]="focusMode">
            <div #editorElement class="prosemirror-editor"></div>
            
            <!-- Content Preview -->
            <div class="content-preview" 
                 *ngIf="previewMode"
                 [innerHTML]="getPreviewContent()"></div>
          </div>

          <!-- Sidebar Panel -->
          <div class="editor-sidebar" *ngIf="showSidebar">
            <mat-tab-group>
              <!-- Document Outline -->
              <mat-tab label="Outline">
                <div class="outline-panel">
                  <div class="outline-item" 
                       *ngFor="let heading of documentOutline"
                       [class]="'level-' + heading.level"
                       (click)="scrollToHeading(heading)">
                    <span class="outline-text">{{ heading.text }}</span>
                    <span class="outline-level">H{{ heading.level }}</span>
                  </div>
                </div>
              </mat-tab>

              <!-- Comments & Reviews -->
              <mat-tab label="Comments" [disabled]="!collaborationSettings.enabled">
                <div class="comments-panel">
                  <div class="comment-thread" 
                       *ngFor="let comment of workflowComments"
                       [class.resolved]="comment.resolved">
                    <div class="comment-header">
                      <div class="comment-author">{{ getUserName(comment.userId) }}</div>
                      <div class="comment-time">{{ comment.createdAt | date:'short' }}</div>
                      <div class="comment-type" [ngClass]="'type-' + comment.type">
                        {{ comment.type }}
                      </div>
                    </div>
                    <div class="comment-content">{{ comment.content }}</div>
                    <div class="comment-actions">
                      <button mat-button (click)="resolveComment(comment.id)" 
                              *ngIf="!comment.resolved">
                        Resolve
                      </button>
                      <button mat-button (click)="replyToComment(comment.id)">
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              </mat-tab>

              <!-- Content Analytics -->
              <mat-tab label="Analytics">
                <div class="analytics-panel">
                  <div class="metric-card">
                    <div class="metric-label">Reading Time</div>
                    <div class="metric-value">{{ currentContent?.metadata?.readingTime || 0 }} min</div>
                  </div>
                  
                  <div class="metric-card">
                    <div class="metric-label">Word Count</div>
                    <div class="metric-value">{{ currentContent?.metadata?.wordCount || 0 }}</div>
                  </div>
                  
                  <div class="metric-card">
                    <div class="metric-label">Characters</div>
                    <div class="metric-value">{{ getCharacterCount() }}</div>
                  </div>
                  
                  <div class="metric-card">
                    <div class="metric-label">Paragraphs</div>
                    <div class="metric-value">{{ getParagraphCount() }}</div>
                  </div>

                  <!-- SEO Analysis -->
                  <mat-expansion-panel>
                    <mat-expansion-panel-header>
                      <mat-panel-title>SEO Analysis</mat-panel-title>
                      <mat-panel-description>
                        Score: {{ getSeoScore() }}/100
                      </mat-panel-description>
                    </mat-expansion-panel-header>
                    
                    <div class="seo-checks">
                      <div class="seo-check" 
                           *ngFor="let check of seoChecks"
                           [ngClass]="'status-' + check.status">
                        <mat-icon>{{ getSeoCheckIcon(check.status) }}</mat-icon>
                        <span>{{ check.name }}</span>
                        <span class="check-score">{{ check.score }}/100</span>
                      </div>
                    </div>
                  </mat-expansion-panel>

                  <!-- Readability Analysis -->
                  <mat-expansion-panel>
                    <mat-expansion-panel-header>
                      <mat-panel-title>Readability</mat-panel-title>
                      <mat-panel-description>
                        {{ getReadabilityLevel() }}
                      </mat-panel-description>
                    </mat-expansion-panel-header>
                    
                    <div class="readability-metrics">
                      <div class="readability-metric">
                        <span>Flesch Score:</span>
                        <span>{{ getFleschScore() }}</span>
                      </div>
                      <div class="readability-metric">
                        <span>Grade Level:</span>
                        <span>{{ getGradeLevel() }}</span>
                      </div>
                      <div class="readability-metric">
                        <span>Avg Sentence Length:</span>
                        <span>{{ getAverageSentenceLength() }} words</span>
                      </div>
                    </div>
                  </mat-expansion-panel>
                </div>
              </mat-tab>

              <!-- Settings -->
              <mat-tab label="Settings">
                <div class="settings-panel">
                  <mat-expansion-panel>
                    <mat-expansion-panel-header>
                      <mat-panel-title>Editor Preferences</mat-panel-title>
                    </mat-expansion-panel-header>
                    
                    <div class="setting-group">
                      <mat-slide-toggle [(ngModel)]="editorSettings.showLineNumbers">
                        Show Line Numbers
                      </mat-slide-toggle>
                      
                      <mat-slide-toggle [(ngModel)]="editorSettings.wordWrap">
                        Word Wrap
                      </mat-slide-toggle>
                      
                      <mat-slide-toggle [(ngModel)]="editorSettings.spellCheck">
                        Spell Check
                      </mat-slide-toggle>
                      
                      <mat-slide-toggle [(ngModel)]="editorSettings.autoComplete">
                        Auto Complete
                      </mat-slide-toggle>
                    </div>

                    <mat-form-field appearance="outline">
                      <mat-label>Font Size</mat-label>
                      <mat-select [(ngModel)]="editorSettings.fontSize">
                        <mat-option value="12">12px</mat-option>
                        <mat-option value="14">14px</mat-option>
                        <mat-option value="16">16px</mat-option>
                        <mat-option value="18">18px</mat-option>
                        <mat-option value="20">20px</mat-option>
                      </mat-select>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Theme</mat-label>
                      <mat-select [(ngModel)]="editorSettings.theme">
                        <mat-option value="light">Light</mat-option>
                        <mat-option value="dark">Dark</mat-option>
                        <mat-option value="auto">Auto</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </mat-expansion-panel>

                  <mat-expansion-panel>
                    <mat-expansion-panel-header>
                      <mat-panel-title>Auto-save</mat-panel-title>
                    </mat-expansion-panel-header>
                    
                    <div class="setting-group">
                      <mat-slide-toggle [(ngModel)]="autosaveSettings.enabled">
                        Enable Auto-save
                      </mat-slide-toggle>
                      
                      <mat-form-field appearance="outline">
                        <mat-label>Save Interval</mat-label>
                        <mat-select [(ngModel)]="autosaveSettings.interval">
                          <mat-option [value]="30000">30 seconds</mat-option>
                          <mat-option [value]="60000">1 minute</mat-option>
                          <mat-option [value]="120000">2 minutes</mat-option>
                          <mat-option [value]="300000">5 minutes</mat-option>
                        </mat-select>
                      </mat-form-field>
                      
                      <mat-slide-toggle [(ngModel)]="autosaveSettings.onBlur">
                        Save on Focus Loss
                      </mat-slide-toggle>
                      
                      <mat-slide-toggle [(ngModel)]="autosaveSettings.localBackup">
                        Local Backup
                      </mat-slide-toggle>
                    </div>
                  </mat-expansion-panel>
                </div>
              </mat-tab>
            </mat-tab-group>
          </div>
        </div>

        <!-- Bottom Status Bar -->
        <div class="editor-status-bar">
          <div class="status-left">
            <span class="cursor-position">Line {{ cursorPosition.line }}, Column {{ cursorPosition.column }}</span>
            <span class="selection-info" *ngIf="hasSelection">{{ selectionLength }} selected</span>
          </div>
          
          <div class="status-center">
            <div class="automated-checks" *ngIf="automatedChecks.length > 0">
              <button mat-button 
                      *ngFor="let check of automatedChecks"
                      [ngClass]="'check-' + check.status"
                      [matTooltip]="check.type + ': ' + check.status"
                      (click)="showCheckDetails(check)">
                <mat-icon>{{ getCheckIcon(check.type, check.status) }}</mat-icon>
                {{ check.issues.length }}
              </button>
            </div>
          </div>
          
          <div class="status-right">
            <button mat-icon-button 
                    matTooltip="Toggle Sidebar"
                    (click)="toggleSidebar()">
              <mat-icon>{{ showSidebar ? 'close_fullscreen' : 'open_in_full' }}</mat-icon>
            </button>
            
            <button mat-icon-button 
                    matTooltip="Editor Help"
                    (click)="showHelp()">
              <mat-icon>help_outline</mat-icon>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./content-editor.component.scss']
})
export class ContentEditorComponent implements OnInit, OnDestroy {
  @Input() contentId?: string;
  @Input() contentType: ContentType = ContentType.CHAPTER;
  @Input() templateId?: string;
  @Output() contentSaved = new EventEmitter<ContentItem>();
  @Output() contentChanged = new EventEmitter<boolean>();

  @ViewChild('editorElement', { static: true }) editorElement!: ElementRef;

  // Form and data properties
  editorForm: FormGroup;
  currentContent: ContentItem | null = null;
  editorView: EditorView | null = null;
  editorState: EditorState | null = null;
  editorSchema: Schema;

  // UI state
  previewMode = false;
  fullscreenMode = false;
  focusMode = false;
  showSidebar = true;
  hasUnsavedChanges = false;
  isSaving = false;
  hasSelection = false;
  selectionLength = 0;

  // Editor configuration
  editorConfiguration: EditorConfiguration;
  editorSettings = {
    showLineNumbers: false,
    wordWrap: true,
    spellCheck: true,
    autoComplete: true,
    fontSize: 16,
    theme: 'light'
  };

  autosaveSettings: AutosaveSettings = {
    enabled: true,
    interval: 60000,
    onBlur: true,
    onIdle: true,
    localBackup: true
  };

  collaborationSettings: CollaborationSettings = {
    enabled: true,
    realTimeEditing: true,
    cursorTracking: true,
    commentMode: true,
    maxCollaborators: 10
  };

  // Content analysis
  documentOutline: Array<{ level: number; text: string; position: number }> = [];
  workflowComments: WorkflowComment[] = [];
  automatedChecks: AutomatedCheck[] = [];
  unreadCommentsCount = 0;
  cursorPosition = { line: 1, column: 1 };

  // Collaboration
  activeCollaborators: Array<{ id: string; name: string; initials: string; color: string }> = [];

  // SEO and Analytics
  seoChecks = [
    { name: 'Title Length', status: 'passed', score: 95 },
    { name: 'Meta Description', status: 'warning', score: 70 },
    { name: 'Heading Structure', status: 'passed', score: 90 },
    { name: 'Image Alt Text', status: 'failed', score: 45 }
  ];

  // Subscriptions
  private subscriptions = new Subscription();
  private contentChangeSubject = new Subject<string>();
  private autosaveTimer?: NodeJS.Timeout;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.editorForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(1)]],
      description: [''],
      content: [''],
      type: [this.contentType],
      tags: [[]],
      categories: [[]]
    });

    // Create enhanced ProseMirror schema
    this.editorSchema = new Schema({
      nodes: addListNodes(schema.spec.nodes, 'paragraph block*', 'block'),
      marks: schema.spec.marks
    });

    this.editorConfiguration = {
      toolbar: {
        groups: [],
        customButtons: [],
        position: 'top',
        sticky: true
      },
      plugins: [],
      shortcuts: [],
      collaboration: this.collaborationSettings,
      autosave: this.autosaveSettings
    };
  }

  ngOnInit(): void {
    this.initializeEditor();
    this.setupAutosave();
    this.setupContentAnalysis();
    
    if (this.contentId) {
      this.loadContent(this.contentId);
    } else if (this.templateId) {
      this.loadTemplate(this.templateId);
    } else {
      this.createNewContent();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.autosaveTimer) {
      clearInterval(this.autosaveTimer);
    }
    if (this.editorView) {
      this.editorView.destroy();
    }
  }

  private initializeEditor(): void {
    const state = EditorState.create({
      schema: this.editorSchema,
      plugins: [
        ...exampleSetup({ schema: this.editorSchema }),
        history(),
        keymap(baseKeymap),
        this.createCollaborationPlugin(),
        this.createCommentsPlugin(),
        this.createSpellCheckPlugin(),
        this.createAccessibilityPlugin()
      ]
    });

    this.editorView = new EditorView(this.editorElement.nativeElement, {
      state,
      dispatchTransaction: (transaction: Transaction) => {
        const newState = this.editorView!.state.apply(transaction);
        this.editorView!.updateState(newState);
        this.onContentChange();
      },
      attributes: {
        class: 'prose-mirror-editor',
        spellcheck: 'true'
      }
    });

    this.editorState = state;
  }

  private createCollaborationPlugin(): Plugin {
    return new Plugin({
      key: collaborationPluginKey,
      state: {
        init() {
          return {
            collaborators: new Map(),
            cursors: new Map()
          };
        },
        apply(tr, value) {
          return value;
        }
      },
      view() {
        return {
          update: (view, prevState) => {
            // Handle collaboration updates
            this.updateCollaborationState();
          }
        };
      }
    });
  }

  private createCommentsPlugin(): Plugin {
    return new Plugin({
      key: commentsPluginKey,
      state: {
        init() {
          return {
            comments: new Map(),
            activeComment: null
          };
        },
        apply(tr, value) {
          return value;
        }
      },
      props: {
        decorations: (state) => {
          return this.createCommentDecorations(state);
        }
      }
    });
  }

  private createSpellCheckPlugin(): Plugin {
    return new Plugin({
      key: spellCheckPluginKey,
      state: {
        init() {
          return {
            misspelledWords: new Set(),
            suggestions: new Map()
          };
        },
        apply(tr, value) {
          return value;
        }
      },
      view() {
        return {
          update: (view, prevState) => {
            if (this.editorSettings.spellCheck) {
              this.runSpellCheck();
            }
          }
        };
      }
    });
  }

  private createAccessibilityPlugin(): Plugin {
    return new Plugin({
      key: accessibilityPluginKey,
      props: {
        attributes: {
          role: 'textbox',
          'aria-multiline': 'true',
          'aria-label': 'Content editor'
        },
        handleKeyDown: (view, event) => {
          return this.handleAccessibilityKeydown(view, event);
        }
      }
    });
  }

  private setupAutosave(): void {
    // Content change debouncing
    this.subscriptions.add(
      this.contentChangeSubject
        .pipe(
          debounceTime(this.autosaveSettings.interval),
          distinctUntilChanged()
        )
        .subscribe(() => {
          if (this.autosaveSettings.enabled && this.hasUnsavedChanges) {
            this.saveContent();
          }
        })
    );

    // Periodic autosave
    if (this.autosaveSettings.enabled) {
      this.autosaveTimer = setInterval(() => {
        if (this.hasUnsavedChanges) {
          this.saveContent();
        }
      }, this.autosaveSettings.interval);
    }
  }

  private setupContentAnalysis(): void {
    // Real-time content analysis
    this.subscriptions.add(
      this.contentChangeSubject
        .pipe(debounceTime(1000))
        .subscribe(() => {
          this.analyzeContent();
        })
    );
  }

  private onContentChange(): void {
    this.hasUnsavedChanges = true;
    this.contentChanged.emit(true);
    this.updateCursorPosition();
    this.updateSelection();
    this.contentChangeSubject.next(this.getContent());
  }

  private analyzeContent(): void {
    const content = this.getContent();
    this.updateWordCount(content);
    this.updateDocumentOutline();
    this.runAutomatedChecks();
  }

  private updateWordCount(content: string): void {
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
    const readingTime = Math.ceil(wordCount / 200); // 200 words per minute
    
    if (this.currentContent) {
      this.currentContent.metadata.wordCount = wordCount;
      this.currentContent.metadata.readingTime = readingTime;
    }
  }

  private updateDocumentOutline(): void {
    // Extract headings from content for outline
    this.documentOutline = [];
    const doc = this.editorView?.state.doc;
    
    if (!doc) return;

    doc.descendants((node, pos) => {
      if (node.type.name.startsWith('heading')) {
        const level = parseInt(node.type.name.replace('heading', ''));
        const text = node.textContent;
        this.documentOutline.push({ level, text, position: pos });
      }
    });
  }

  private updateCursorPosition(): void {
    if (!this.editorView) return;

    const { from } = this.editorView.state.selection;
    const pos = this.editorView.state.doc.resolve(from);
    
    this.cursorPosition = {
      line: pos.lineCharAt(from, 1).line,
      column: pos.lineCharAt(from, 1).ch
    };
  }

  private updateSelection(): void {
    if (!this.editorView) return;

    const { from, to } = this.editorView.state.selection;
    this.hasSelection = from !== to;
    this.selectionLength = to - from;
  }

  // Editor Commands
  toggleMark(markType: string): void {
    if (!this.editorView) return;
    
    // Implementation would use ProseMirror commands
    // This is a simplified version
    console.log(`Toggle mark: ${markType}`);
  }

  isMarkActive(markType: string): boolean {
    if (!this.editorView) return false;
    
    // Check if mark is active at current selection
    return false; // Simplified
  }

  setHeadingLevel(level: string): void {
    if (!this.editorView) return;
    
    console.log(`Set heading level: ${level}`);
  }

  getCurrentHeadingLevel(): string {
    // Get current heading level
    return 'paragraph'; // Simplified
  }

  toggleList(listType: string): void {
    if (!this.editorView) return;
    
    console.log(`Toggle list: ${listType}`);
  }

  isListActive(listType: string): boolean {
    return false; // Simplified
  }

  setAlignment(alignment: string): void {
    console.log(`Set alignment: ${alignment}`);
  }

  getAlignment(): string {
    return 'left'; // Simplified
  }

  insertLink(): void {
    // Open link dialog
    console.log('Insert link');
  }

  insertMedia(): void {
    // Open media dialog
    console.log('Insert media');
  }

  insertTable(): void {
    console.log('Insert table');
  }

  insertCodeBlock(): void {
    console.log('Insert code block');
  }

  insertVideo(): void {
    console.log('Insert video');
  }

  insertHorizontalRule(): void {
    console.log('Insert horizontal rule');
  }

  decreaseIndent(): void {
    console.log('Decrease indent');
  }

  increaseIndent(): void {
    console.log('Increase indent');
  }

  undo(): void {
    if (this.editorView) {
      // Use ProseMirror undo
      console.log('Undo');
    }
  }

  redo(): void {
    if (this.editorView) {
      // Use ProseMirror redo
      console.log('Redo');
    }
  }

  canUndo(): boolean {
    return true; // Simplified
  }

  canRedo(): boolean {
    return true; // Simplified
  }

  // Content Management
  private async loadContent(contentId: string): Promise<void> {
    try {
      // Load content from service
      this.currentContent = await this.mockLoadContent(contentId);
      this.populateForm();
      this.setEditorContent(this.currentContent.content);
    } catch (error) {
      this.showError('Failed to load content');
    }
  }

  private async loadTemplate(templateId: string): Promise<void> {
    try {
      // Load template and create new content
      console.log(`Loading template: ${templateId}`);
      this.createNewContent();
    } catch (error) {
      this.showError('Failed to load template');
    }
  }

  private createNewContent(): void {
    this.currentContent = {
      id: `content_${Date.now()}`,
      type: this.contentType,
      title: '',
      slug: '',
      content: '',
      status: ContentStatus.DRAFT,
      metadata: {
        wordCount: 0,
        readingTime: 0,
        difficulty: 'intermediate',
        targetAudience: [],
        language: 'en',
        lastModifiedBy: 'current_user'
      },
      workflow: {
        currentStage: WorkflowStage.CREATION,
        comments: [],
        approvers: [],
        automatedChecks: []
      },
      version: {
        current: 1,
        major: 1,
        minor: 0,
        patch: 0,
        history: []
      },
      collaborators: [],
      tags: [],
      categories: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.populateForm();
  }

  private populateForm(): void {
    if (this.currentContent) {
      this.editorForm.patchValue({
        title: this.currentContent.title,
        description: this.currentContent.description,
        content: this.currentContent.content,
        type: this.currentContent.type,
        tags: this.currentContent.tags,
        categories: this.currentContent.categories
      });
    }
  }

  private setEditorContent(content: string): void {
    if (this.editorView) {
      // Set content in ProseMirror editor
      console.log('Setting editor content');
    }
  }

  private getContent(): string {
    if (this.editorView) {
      // Get content from ProseMirror editor
      return this.editorView.state.doc.textContent;
    }
    return '';
  }

  async saveContent(): Promise<void> {
    if (!this.currentContent || this.isSaving) return;

    this.isSaving = true;

    try {
      // Update content with form values
      this.currentContent.title = this.editorForm.value.title;
      this.currentContent.description = this.editorForm.value.description;
      this.currentContent.content = this.getContent();
      this.currentContent.tags = this.editorForm.value.tags;
      this.currentContent.categories = this.editorForm.value.categories;
      this.currentContent.updatedAt = new Date();

      // Save to service
      await this.mockSaveContent(this.currentContent);

      this.hasUnsavedChanges = false;
      this.contentSaved.emit(this.currentContent);
      this.contentChanged.emit(false);
      this.showSuccess('Content saved successfully');

    } catch (error) {
      this.showError('Failed to save content');
    } finally {
      this.isSaving = false;
    }
  }

  // UI Actions
  togglePreviewMode(): void {
    this.previewMode = !this.previewMode;
  }

  toggleFullscreen(): void {
    this.fullscreenMode = !this.fullscreenMode;
  }

  toggleFocusMode(): void {
    this.focusMode = !this.focusMode;
  }

  toggleSidebar(): void {
    this.showSidebar = !this.showSidebar;
  }

  toggleCommentsPanel(): void {
    // Toggle comments panel
    console.log('Toggle comments panel');
  }

  showVersionHistory(): void {
    // Show version history dialog
    console.log('Show version history');
  }

  showWorkflowPanel(): void {
    // Show workflow panel
    console.log('Show workflow panel');
  }

  showSettings(): void {
    // Show settings dialog
    console.log('Show settings');
  }

  exportContent(): void {
    // Export content
    console.log('Export content');
  }

  showHelp(): void {
    // Show help dialog
    console.log('Show help');
  }

  // Utility methods
  getContentTypeLabel(type?: ContentType): string {
    const labels: Record<ContentType, string> = {
      [ContentType.CHAPTER]: 'Chapter',
      [ContentType.TEMPLATE]: 'Template',
      [ContentType.BLOG_POST]: 'Blog Post',
      [ContentType.MARKETING_PAGE]: 'Marketing Page',
      [ContentType.EMAIL_TEMPLATE]: 'Email Template',
      [ContentType.DOCUMENTATION]: 'Documentation'
    };
    return type ? labels[type] : 'Content';
  }

  getStatusLabel(status?: ContentStatus): string {
    const labels: Record<ContentStatus, string> = {
      [ContentStatus.DRAFT]: 'Draft',
      [ContentStatus.IN_REVIEW]: 'In Review',
      [ContentStatus.APPROVED]: 'Approved',
      [ContentStatus.PUBLISHED]: 'Published',
      [ContentStatus.SCHEDULED]: 'Scheduled',
      [ContentStatus.ARCHIVED]: 'Archived'
    };
    return status ? labels[status] : 'Unknown';
  }

  getSaveStatusIcon(): string {
    if (this.isSaving) return 'sync';
    if (this.hasUnsavedChanges) return 'edit';
    return 'check_circle';
  }

  getSaveStatusText(): string {
    if (this.isSaving) return 'Saving...';
    if (this.hasUnsavedChanges) return 'Unsaved changes';
    return 'All changes saved';
  }

  getPreviewContent(): string {
    // Convert content to HTML for preview
    return this.getContent();
  }

  getCharacterCount(): number {
    return this.getContent().length;
  }

  getParagraphCount(): number {
    return this.getContent().split('\n\n').length;
  }

  getSeoScore(): number {
    return Math.round(this.seoChecks.reduce((sum, check) => sum + check.score, 0) / this.seoChecks.length);
  }

  getSeoCheckIcon(status: string): string {
    const icons: Record<string, string> = {
      'passed': 'check_circle',
      'warning': 'warning',
      'failed': 'error'
    };
    return icons[status] || 'help';
  }

  getReadabilityLevel(): string {
    const score = this.getFleschScore();
    if (score >= 90) return 'Very Easy';
    if (score >= 80) return 'Easy';
    if (score >= 70) return 'Fairly Easy';
    if (score >= 60) return 'Standard';
    if (score >= 50) return 'Fairly Difficult';
    if (score >= 30) return 'Difficult';
    return 'Very Difficult';
  }

  getFleschScore(): number {
    // Simplified Flesch reading ease calculation
    return 75; // Mock value
  }

  getGradeLevel(): string {
    return '8th Grade'; // Mock value
  }

  getAverageSentenceLength(): number {
    const content = this.getContent();
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.split(/\s+/).filter(w => w.length > 0);
    return sentences.length > 0 ? Math.round(words.length / sentences.length) : 0;
  }

  getCheckIcon(type: string, status: string): string {
    if (status === 'passed') return 'check_circle';
    if (status === 'warning') return 'warning';
    if (status === 'failed') return 'error';
    return 'pending';
  }

  scrollToHeading(heading: { position: number }): void {
    if (this.editorView) {
      // Scroll to heading position
      console.log(`Scroll to heading at position: ${heading.position}`);
    }
  }

  resolveComment(commentId: string): void {
    const comment = this.workflowComments.find(c => c.id === commentId);
    if (comment) {
      comment.resolved = true;
    }
  }

  replyToComment(commentId: string): void {
    // Open reply dialog
    console.log(`Reply to comment: ${commentId}`);
  }

  getUserName(userId: string): string {
    return 'User ' + userId; // Mock implementation
  }

  showCheckDetails(check: AutomatedCheck): void {
    // Show detailed check results
    console.log('Show check details:', check);
  }

  // Mock methods
  private async mockLoadContent(contentId: string): Promise<ContentItem> {
    // Mock content loading
    return {
      id: contentId,
      type: ContentType.CHAPTER,
      title: 'Sample Content',
      slug: 'sample-content',
      content: 'This is sample content for the editor.',
      status: ContentStatus.DRAFT,
      metadata: {
        wordCount: 8,
        readingTime: 1,
        difficulty: 'intermediate',
        targetAudience: ['developers'],
        language: 'en',
        lastModifiedBy: 'current_user'
      },
      workflow: {
        currentStage: WorkflowStage.CREATION,
        comments: [],
        approvers: [],
        automatedChecks: []
      },
      version: {
        current: 1,
        major: 1,
        minor: 0,
        patch: 0,
        history: []
      },
      collaborators: [],
      tags: [],
      categories: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private async mockSaveContent(content: ContentItem): Promise<void> {
    // Mock content saving
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private runAutomatedChecks(): void {
    // Run automated content checks
    this.automatedChecks = [
      {
        type: 'spell_check',
        status: 'passed',
        score: 95,
        issues: [],
        lastRun: new Date()
      },
      {
        type: 'seo_audit',
        status: 'warning',
        score: 75,
        issues: [
          {
            severity: 'warning',
            message: 'Missing meta description',
            suggestion: 'Add a meta description for better SEO',
            autoFixable: false
          }
        ],
        lastRun: new Date()
      }
    ];
  }

  private runSpellCheck(): void {
    // Run spell check
    console.log('Running spell check');
  }

  private createCommentDecorations(state: EditorState): DecorationSet {
    // Create decorations for comments
    return DecorationSet.empty;
  }

  private updateCollaborationState(): void {
    // Update collaboration state
    this.activeCollaborators = [
      { id: 'user1', name: 'John Doe', initials: 'JD', color: '#1976d2' },
      { id: 'user2', name: 'Jane Smith', initials: 'JS', color: '#388e3c' }
    ];
  }

  private handleAccessibilityKeydown(view: EditorView, event: KeyboardEvent): boolean {
    // Handle accessibility-specific keyboard shortcuts
    return false;
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
}