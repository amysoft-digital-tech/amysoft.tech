import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snackbar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { SelectionModel } from '@angular/cdk/collections';
import { Subscription, Subject, debounceTime, distinctUntilChanged, interval } from 'rxjs';

// Media Management Interfaces
export interface MediaAsset {
  id: string;
  filename: string;
  originalFilename: string;
  title: string;
  description?: string;
  alt?: string;
  type: MediaType;
  mimeType: string;
  size: number;
  dimensions?: MediaDimensions;
  duration?: number;
  url: string;
  thumbnailUrl?: string;
  cdnUrl?: string;
  variants: MediaVariant[];
  metadata: MediaMetadata;
  optimization: MediaOptimization;
  usage: MediaUsage[];
  tags: string[];
  categories: string[];
  collections: string[];
  uploadedBy: string;
  uploadedAt: Date;
  updatedAt: Date;
  status: MediaStatus;
  processing: MediaProcessing;
  analytics: MediaAnalytics;
}

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  ARCHIVE = 'archive',
  OTHER = 'other'
}

export enum MediaStatus {
  UPLOADING = 'uploading',
  PROCESSING = 'processing',
  READY = 'ready',
  FAILED = 'failed',
  ARCHIVED = 'archived',
  DELETED = 'deleted'
}

export interface MediaDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

export interface MediaVariant {
  id: string;
  name: string;
  type: 'thumbnail' | 'small' | 'medium' | 'large' | 'original' | 'webp' | 'avif' | 'compressed';
  url: string;
  size: number;
  dimensions?: MediaDimensions;
  quality?: number;
  format: string;
  optimized: boolean;
  createdAt: Date;
}

export interface MediaMetadata {
  exif?: Record<string, any>;
  camera?: CameraInfo;
  location?: LocationInfo;
  colorProfile?: string;
  compression?: string;
  bitrate?: number;
  framerate?: number;
  codec?: string;
  duration?: number;
  chapters?: VideoChapter[];
  subtitles?: SubtitleTrack[];
}

export interface CameraInfo {
  make?: string;
  model?: string;
  lens?: string;
  focalLength?: number;
  aperture?: number;
  iso?: number;
  shutterSpeed?: string;
  exposureMode?: string;
  whiteBalance?: string;
}

export interface LocationInfo {
  latitude?: number;
  longitude?: number;
  altitude?: number;
  address?: string;
  city?: string;
  country?: string;
}

export interface VideoChapter {
  title: string;
  startTime: number;
  endTime: number;
  thumbnail?: string;
}

export interface SubtitleTrack {
  language: string;
  url: string;
  type: 'srt' | 'vtt' | 'ass';
}

export interface MediaOptimization {
  isOptimized: boolean;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  qualityScore: number;
  formats: OptimizedFormat[];
  cdn: CDNDistribution;
  seo: SEOOptimization;
}

export interface OptimizedFormat {
  format: string;
  size: number;
  quality: number;
  url: string;
  compatibility: string[];
}

export interface CDNDistribution {
  enabled: boolean;
  provider: string;
  regions: string[];
  cacheControl: string;
  expires: Date;
  bandwidth: number;
  requests: number;
}

export interface SEOOptimization {
  altText: string;
  title: string;
  caption: string;
  structuredData: Record<string, any>;
  sitemap: boolean;
}

export interface MediaUsage {
  contentId: string;
  contentTitle: string;
  contentType: string;
  usageType: 'primary' | 'secondary' | 'thumbnail' | 'background' | 'decoration';
  position: string;
  usedAt: Date;
}

export interface MediaProcessing {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  stage: string;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  logs: ProcessingLog[];
}

export interface ProcessingLog {
  timestamp: Date;
  level: 'info' | 'warning' | 'error';
  message: string;
  details?: any;
}

export interface MediaAnalytics {
  views: number;
  downloads: number;
  shares: number;
  engagement: number;
  performance: PerformanceMetrics;
  usage: UsageMetrics;
  trends: TrendData[];
}

export interface PerformanceMetrics {
  loadTime: number;
  cacheHitRate: number;
  bandwidth: number;
  errors: number;
  uptime: number;
}

export interface UsageMetrics {
  totalUses: number;
  uniqueContent: number;
  popularityScore: number;
  lastUsed: Date;
  trending: boolean;
}

export interface TrendData {
  date: Date;
  views: number;
  downloads: number;
  performance: number;
}

export interface MediaCollection {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  assetCount: number;
  totalSize: number;
  tags: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  permissions: CollectionPermission[];
}

export interface CollectionPermission {
  userId: string;
  permission: 'view' | 'edit' | 'admin';
  grantedBy: string;
  grantedAt: Date;
}

export interface UploadConfig {
  maxFileSize: number;
  allowedTypes: string[];
  autoOptimize: boolean;
  generateThumbnails: boolean;
  extractMetadata: boolean;
  virusScanning: boolean;
  watermark: WatermarkConfig;
  cdn: CDNConfig;
}

export interface WatermarkConfig {
  enabled: boolean;
  type: 'text' | 'image';
  content: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity: number;
  size: number;
}

export interface CDNConfig {
  enabled: boolean;
  provider: string;
  regions: string[];
  caching: boolean;
  compression: boolean;
}

@Component({
  selector: 'app-media-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
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
    <div class="media-container">
      <!-- Header -->
      <mat-card class="media-header">
        <mat-card-header>
          <div class="header-content">
            <div class="header-info">
              <h2>Media Asset Management</h2>
              <p class="header-subtitle">Upload, organize, and optimize media assets for content creation</p>
            </div>
            <div class="header-actions">
              <input #fileInput type="file" multiple hidden 
                     (change)="onFilesSelected($event)"
                     [accept]="acceptedFileTypes">
              <button mat-raised-button color="primary" (click)="fileInput.click()">
                <mat-icon>cloud_upload</mat-icon>
                Upload Media
              </button>
              <button mat-button (click)="createCollection()">
                <mat-icon>folder</mat-icon>
                New Collection
              </button>
              <button mat-icon-button [matMenuTriggerFor]="headerMenu">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #headerMenu="matMenu">
                <button mat-menu-item (click)="bulkUpload()">
                  <mat-icon>cloud_upload</mat-icon>
                  Bulk Upload
                </button>
                <button mat-menu-item (click)="importFromUrl()">
                  <mat-icon>link</mat-icon>
                  Import from URL
                </button>
                <button mat-menu-item (click)="optimizeAll()">
                  <mat-icon>tune</mat-icon>
                  Optimize All
                </button>
                <mat-divider></mat-divider>
                <button mat-menu-item (click)="mediaSettings()">
                  <mat-icon>settings</mat-icon>
                  Settings
                </button>
              </mat-menu>
            </div>
          </div>
        </mat-card-header>
      </mat-card>

      <!-- Media Dashboard -->
      <div class="media-dashboard">
        <mat-tab-group [(selectedIndex)]="selectedTabIndex" (selectedTabChange)="onTabChange($event)">
          <!-- Assets Tab -->
          <mat-tab label="Assets">
            <ng-template matTabContent>
              <div class="tab-content">
                <!-- Filters and Search -->
                <mat-card class="filters-card">
                  <div class="filters-container">
                    <mat-form-field appearance="outline" class="search-field">
                      <mat-label>Search assets...</mat-label>
                      <input matInput [formControl]="searchControl" placeholder="Search by name, tag, or type">
                      <mat-icon matSuffix>search</mat-icon>
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline">
                      <mat-label>Type</mat-label>
                      <mat-select [formControl]="typeFilterControl" multiple>
                        <mat-option *ngFor="let type of mediaTypes" [value]="type.value">
                          {{type.label}}
                        </mat-option>
                      </mat-select>
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline">
                      <mat-label>Status</mat-label>
                      <mat-select [formControl]="statusFilterControl" multiple>
                        <mat-option *ngFor="let status of mediaStatuses" [value]="status.value">
                          {{status.label}}
                        </mat-option>
                      </mat-select>
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline">
                      <mat-label>Collection</mat-label>
                      <mat-select [formControl]="collectionFilterControl">
                        <mat-option value="">All Collections</mat-option>
                        <mat-option *ngFor="let collection of mediaCollections" [value]="collection.id">
                          {{collection.name}}
                        </mat-option>
                      </mat-select>
                    </mat-form-field>
                    
                    <button mat-button (click)="clearFilters()">
                      <mat-icon>clear</mat-icon>
                      Clear Filters
                    </button>
                  </div>
                </mat-card>

                <!-- Asset Grid -->
                <div class="assets-container" *ngIf="viewMode === 'grid'">
                  <div class="asset-grid">
                    <div class="asset-card" *ngFor="let asset of filteredAssets" 
                         (click)="selectAsset(asset)"
                         [class.selected]="assetSelection.isSelected(asset)">
                      <div class="asset-thumbnail">
                        <img *ngIf="asset.type === 'image'" 
                             [src]="asset.thumbnailUrl || asset.url" 
                             [alt]="asset.alt || asset.title"
                             (error)="onImageError($event)">
                        <div *ngIf="asset.type === 'video'" class="video-thumbnail">
                          <img [src]="asset.thumbnailUrl" 
                               [alt]="asset.title"
                               (error)="onImageError($event)">
                          <div class="video-overlay">
                            <mat-icon>play_circle_filled</mat-icon>
                            <span class="duration" *ngIf="asset.duration">
                              {{formatDuration(asset.duration)}}
                            </span>
                          </div>
                        </div>
                        <div *ngIf="asset.type === 'audio'" class="audio-thumbnail">
                          <mat-icon>audiotrack</mat-icon>
                          <span class="duration" *ngIf="asset.duration">
                            {{formatDuration(asset.duration)}}
                          </span>
                        </div>
                        <div *ngIf="asset.type === 'document'" class="document-thumbnail">
                          <mat-icon>description</mat-icon>
                          <span class="file-type">{{getFileExtension(asset.filename)}}</span>
                        </div>
                        
                        <div class="asset-status" *ngIf="asset.status !== 'ready'">
                          <mat-icon *ngIf="asset.status === 'processing'">hourglass_empty</mat-icon>
                          <mat-icon *ngIf="asset.status === 'failed'" color="warn">error</mat-icon>
                          <mat-progress-bar *ngIf="asset.processing.status === 'processing'" 
                                           [value]="asset.processing.progress">
                          </mat-progress-bar>
                        </div>
                        
                        <div class="asset-actions">
                          <button mat-icon-button (click)="previewAsset(asset, $event)">
                            <mat-icon>visibility</mat-icon>
                          </button>
                          <button mat-icon-button [matMenuTriggerFor]="assetMenu" 
                                  (click)="$event.stopPropagation()">
                            <mat-icon>more_vert</mat-icon>
                          </button>
                          <mat-menu #assetMenu="matMenu">
                            <button mat-menu-item (click)="editAsset(asset)">
                              <mat-icon>edit</mat-icon>
                              Edit
                            </button>
                            <button mat-menu-item (click)="downloadAsset(asset)">
                              <mat-icon>download</mat-icon>
                              Download
                            </button>
                            <button mat-menu-item (click)="copyAssetUrl(asset)">
                              <mat-icon>link</mat-icon>
                              Copy URL
                            </button>
                            <button mat-menu-item (click)="optimizeAsset(asset)">
                              <mat-icon>tune</mat-icon>
                              Optimize
                            </button>
                            <mat-divider></mat-divider>
                            <button mat-menu-item (click)="moveToCollection(asset)">
                              <mat-icon>folder</mat-icon>
                              Move to Collection
                            </button>
                            <button mat-menu-item (click)="duplicateAsset(asset)">
                              <mat-icon>content_copy</mat-icon>
                              Duplicate
                            </button>
                            <button mat-menu-item (click)="deleteAsset(asset)" class="warn-action">
                              <mat-icon>delete</mat-icon>
                              Delete
                            </button>
                          </mat-menu>
                        </div>
                      </div>
                      
                      <div class="asset-info">
                        <h4 class="asset-title">{{asset.title}}</h4>
                        <div class="asset-meta">
                          <span class="file-size">{{formatFileSize(asset.size)}}</span>
                          <span class="upload-date">{{formatDate(asset.uploadedAt)}}</span>
                        </div>
                        <div class="asset-tags" *ngIf="asset.tags.length > 0">
                          <mat-chip-listbox>
                            <mat-chip *ngFor="let tag of asset.tags.slice(0, 3)">{{tag}}</mat-chip>
                            <mat-chip *ngIf="asset.tags.length > 3" class="overflow-chip">
                              +{{asset.tags.length - 3}}
                            </mat-chip>
                          </mat-chip-listbox>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Asset Table -->
                <div class="table-container" *ngIf="viewMode === 'table'">
                  <mat-card>
                    <table mat-table [dataSource]="assetDataSource" class="asset-table">
                      <!-- Selection Column -->
                      <ng-container matColumnDef="select">
                        <th mat-header-cell *matHeaderCellDef>
                          <mat-checkbox (change)="$event ? masterToggle() : null"
                                        [checked]="assetSelection.hasValue() && isAllSelected()"
                                        [indeterminate]="assetSelection.hasValue() && !isAllSelected()">
                          </mat-checkbox>
                        </th>
                        <td mat-cell *matCellDef="let asset">
                          <mat-checkbox (click)="$event.stopPropagation()"
                                        (change)="$event ? assetSelection.toggle(asset) : null"
                                        [checked]="assetSelection.isSelected(asset)">
                          </mat-checkbox>
                        </td>
                      </ng-container>

                      <!-- Thumbnail Column -->
                      <ng-container matColumnDef="thumbnail">
                        <th mat-header-cell *matHeaderCellDef>Preview</th>
                        <td mat-cell *matCellDef="let asset">
                          <div class="table-thumbnail">
                            <img *ngIf="asset.type === 'image'" 
                                 [src]="asset.thumbnailUrl || asset.url" 
                                 [alt]="asset.title">
                            <mat-icon *ngIf="asset.type === 'video'">videocam</mat-icon>
                            <mat-icon *ngIf="asset.type === 'audio'">audiotrack</mat-icon>
                            <mat-icon *ngIf="asset.type === 'document'">description</mat-icon>
                          </div>
                        </td>
                      </ng-container>

                      <!-- Name Column -->
                      <ng-container matColumnDef="name">
                        <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
                        <td mat-cell *matCellDef="let asset">
                          <div class="asset-name-cell">
                            <span class="asset-title">{{asset.title}}</span>
                            <span class="asset-filename">{{asset.filename}}</span>
                          </div>
                        </td>
                      </ng-container>

                      <!-- Type Column -->
                      <ng-container matColumnDef="type">
                        <th mat-header-cell *matHeaderCellDef>Type</th>
                        <td mat-cell *matCellDef="let asset">
                          <mat-chip-listbox>
                            <mat-chip [ngClass]="'type-' + asset.type">{{asset.type}}</mat-chip>
                          </mat-chip-listbox>
                        </td>
                      </ng-container>

                      <!-- Size Column -->
                      <ng-container matColumnDef="size">
                        <th mat-header-cell *matHeaderCellDef mat-sort-header>Size</th>
                        <td mat-cell *matCellDef="let asset">{{formatFileSize(asset.size)}}</td>
                      </ng-container>

                      <!-- Dimensions Column -->
                      <ng-container matColumnDef="dimensions">
                        <th mat-header-cell *matHeaderCellDef>Dimensions</th>
                        <td mat-cell *matCellDef="let asset">
                          <span *ngIf="asset.dimensions">
                            {{asset.dimensions.width}} × {{asset.dimensions.height}}
                          </span>
                          <span *ngIf="!asset.dimensions">—</span>
                        </td>
                      </ng-container>

                      <!-- Status Column -->
                      <ng-container matColumnDef="status">
                        <th mat-header-cell *matHeaderCellDef>Status</th>
                        <td mat-cell *matCellDef="let asset">
                          <mat-chip-listbox>
                            <mat-chip [ngClass]="'status-' + asset.status">{{asset.status}}</mat-chip>
                          </mat-chip-listbox>
                        </td>
                      </ng-container>

                      <!-- Upload Date Column -->
                      <ng-container matColumnDef="uploadDate">
                        <th mat-header-cell *matHeaderCellDef mat-sort-header>Uploaded</th>
                        <td mat-cell *matCellDef="let asset">{{formatDate(asset.uploadedAt)}}</td>
                      </ng-container>

                      <!-- Actions Column -->
                      <ng-container matColumnDef="actions">
                        <th mat-header-cell *matHeaderCellDef>Actions</th>
                        <td mat-cell *matCellDef="let asset">
                          <button mat-icon-button (click)="previewAsset(asset, $event)">
                            <mat-icon>visibility</mat-icon>
                          </button>
                          <button mat-icon-button [matMenuTriggerFor]="tableAssetMenu" 
                                  (click)="$event.stopPropagation()">
                            <mat-icon>more_vert</mat-icon>
                          </button>
                          <mat-menu #tableAssetMenu="matMenu">
                            <button mat-menu-item (click)="editAsset(asset)">
                              <mat-icon>edit</mat-icon>
                              Edit
                            </button>
                            <button mat-menu-item (click)="downloadAsset(asset)">
                              <mat-icon>download</mat-icon>
                              Download
                            </button>
                            <button mat-menu-item (click)="deleteAsset(asset)" class="warn-action">
                              <mat-icon>delete</mat-icon>
                              Delete
                            </button>
                          </mat-menu>
                        </td>
                      </ng-container>

                      <tr mat-header-row *matHeaderRowDef="assetDisplayedColumns"></tr>
                      <tr mat-row *matRowDef="let asset; columns: assetDisplayedColumns;"
                          (click)="selectAsset(asset)"
                          class="asset-row"></tr>
                    </table>
                    <mat-paginator [pageSizeOptions]="[25, 50, 100]" showFirstLastButtons></mat-paginator>
                  </mat-card>
                </div>

                <!-- View Mode Toggle and Bulk Actions -->
                <div class="bottom-controls">
                  <div class="bulk-actions" *ngIf="assetSelection.hasValue()">
                    <span class="selection-count">{{assetSelection.selected.length}} selected</span>
                    <button mat-button (click)="bulkDownload()">
                      <mat-icon>download</mat-icon>
                      Download
                    </button>
                    <button mat-button (click)="bulkOptimize()">
                      <mat-icon>tune</mat-icon>
                      Optimize
                    </button>
                    <button mat-button (click)="bulkMove()">
                      <mat-icon>folder</mat-icon>
                      Move
                    </button>
                    <button mat-button (click)="bulkDelete()" class="warn-action">
                      <mat-icon>delete</mat-icon>
                      Delete
                    </button>
                  </div>
                  
                  <div class="view-controls">
                    <mat-button-toggle-group [value]="viewMode" (change)="changeViewMode($event)">
                      <mat-button-toggle value="grid">
                        <mat-icon>grid_view</mat-icon>
                        Grid
                      </mat-button-toggle>
                      <mat-button-toggle value="table">
                        <mat-icon>table_view</mat-icon>
                        Table
                      </mat-button-toggle>
                    </mat-button-toggle-group>
                  </div>
                </div>
              </div>
            </ng-template>
          </mat-tab>

          <!-- Collections Tab -->
          <mat-tab label="Collections">
            <ng-template matTabContent>
              <div class="collections-content">
                <!-- Collections Header -->
                <div class="collections-header">
                  <h3>Media Collections</h3>
                  <button mat-raised-button color="primary" (click)="createCollection()">
                    <mat-icon>add</mat-icon>
                    New Collection
                  </button>
                </div>

                <!-- Collection Grid -->
                <div class="collection-grid">
                  <mat-card class="collection-card" *ngFor="let collection of mediaCollections">
                    <div class="collection-thumbnail">
                      <img *ngIf="collection.thumbnail" [src]="collection.thumbnail" [alt]="collection.name">
                      <div *ngIf="!collection.thumbnail" class="placeholder-thumbnail">
                        <mat-icon>folder</mat-icon>
                      </div>
                      <div class="collection-overlay">
                        <span class="asset-count">{{collection.assetCount}} assets</span>
                      </div>
                    </div>
                    
                    <mat-card-content>
                      <h4>{{collection.name}}</h4>
                      <p>{{collection.description}}</p>
                      <div class="collection-meta">
                        <span class="total-size">{{formatFileSize(collection.totalSize)}}</span>
                        <span class="created-date">{{formatDate(collection.createdAt)}}</span>
                      </div>
                      <div class="collection-tags" *ngIf="collection.tags.length > 0">
                        <mat-chip-listbox>
                          <mat-chip *ngFor="let tag of collection.tags">{{tag}}</mat-chip>
                        </mat-chip-listbox>
                      </div>
                    </mat-card-content>
                    
                    <mat-card-actions>
                      <button mat-button (click)="openCollection(collection)">
                        <mat-icon>folder_open</mat-icon>
                        Open
                      </button>
                      <button mat-button (click)="editCollection(collection)">
                        <mat-icon>edit</mat-icon>
                        Edit
                      </button>
                      <button mat-icon-button [matMenuTriggerFor]="collectionMenu">
                        <mat-icon>more_vert</mat-icon>
                      </button>
                      <mat-menu #collectionMenu="matMenu">
                        <button mat-menu-item (click)="shareCollection(collection)">
                          <mat-icon>share</mat-icon>
                          Share
                        </button>
                        <button mat-menu-item (click)="exportCollection(collection)">
                          <mat-icon>download</mat-icon>
                          Export
                        </button>
                        <button mat-menu-item (click)="duplicateCollection(collection)">
                          <mat-icon>content_copy</mat-icon>
                          Duplicate
                        </button>
                        <mat-divider></mat-divider>
                        <button mat-menu-item (click)="deleteCollection(collection)" class="warn-action">
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
                <!-- Analytics Summary -->
                <div class="analytics-summary">
                  <mat-card class="metric-card">
                    <h3>{{totalAssets}}</h3>
                    <p>Total Assets</p>
                  </mat-card>
                  <mat-card class="metric-card">
                    <h3>{{formatFileSize(totalStorage)}}</h3>
                    <p>Storage Used</p>
                  </mat-card>
                  <mat-card class="metric-card">
                    <h3>{{formatFileSize(optimizedSavings)}}</h3>
                    <p>Space Saved</p>
                  </mat-card>
                  <mat-card class="metric-card">
                    <h3>{{averageOptimization}}%</h3>
                    <p>Avg Optimization</p>
                  </mat-card>
                </div>

                <!-- Usage Analytics -->
                <div class="usage-analytics">
                  <mat-card class="chart-card">
                    <mat-card-header>
                      <mat-card-title>Storage Usage by Type</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="storage-breakdown">
                        <div class="storage-item" *ngFor="let item of storageBreakdown">
                          <div class="storage-bar">
                            <div class="storage-fill" [style.width.%]="item.percentage"></div>
                          </div>
                          <div class="storage-info">
                            <span class="storage-type">{{item.type}}</span>
                            <span class="storage-size">{{formatFileSize(item.size)}}</span>
                            <span class="storage-percent">{{item.percentage}}%</span>
                          </div>
                        </div>
                      </div>
                    </mat-card-content>
                  </mat-card>

                  <mat-card class="chart-card">
                    <mat-card-header>
                      <mat-card-title>Upload Trends</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="trend-chart">
                        <!-- Chart would be implemented with Chart.js -->
                        <p>Upload trends chart would be displayed here</p>
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
                <form [formGroup]="mediaSettingsForm" (ngSubmit)="saveSettings()">
                  <mat-card class="settings-section">
                    <mat-card-header>
                      <mat-card-title>Upload Settings</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <mat-form-field appearance="outline">
                        <mat-label>Max File Size (MB)</mat-label>
                        <input matInput type="number" formControlName="maxFileSize">
                      </mat-form-field>
                      
                      <div class="settings-row">
                        <mat-slide-toggle formControlName="autoOptimize">
                          Automatically optimize uploaded images
                        </mat-slide-toggle>
                      </div>
                      
                      <div class="settings-row">
                        <mat-slide-toggle formControlName="generateThumbnails">
                          Generate thumbnails for images and videos
                        </mat-slide-toggle>
                      </div>
                      
                      <div class="settings-row">
                        <mat-slide-toggle formControlName="extractMetadata">
                          Extract metadata from uploaded files
                        </mat-slide-toggle>
                      </div>
                    </mat-card-content>
                  </mat-card>

                  <mat-card class="settings-section">
                    <mat-card-header>
                      <mat-card-title>Optimization Settings</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <mat-form-field appearance="outline">
                        <mat-label>Image Quality (%)</mat-label>
                        <input matInput type="number" formControlName="imageQuality" min="10" max="100">
                      </mat-form-field>
                      
                      <mat-form-field appearance="outline">
                        <mat-label>Thumbnail Size (px)</mat-label>
                        <input matInput type="number" formControlName="thumbnailSize">
                      </mat-form-field>
                      
                      <div class="settings-row">
                        <mat-slide-toggle formControlName="webpConversion">
                          Convert images to WebP format
                        </mat-slide-toggle>
                      </div>
                    </mat-card-content>
                  </mat-card>

                  <mat-card class="settings-section">
                    <mat-card-header>
                      <mat-card-title>CDN Settings</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="settings-row">
                        <mat-slide-toggle formControlName="cdnEnabled">
                          Enable CDN distribution
                        </mat-slide-toggle>
                      </div>
                      
                      <mat-form-field appearance="outline">
                        <mat-label>CDN Provider</mat-label>
                        <mat-select formControlName="cdnProvider">
                          <mat-option value="cloudflare">Cloudflare</mat-option>
                          <mat-option value="aws">AWS CloudFront</mat-option>
                          <mat-option value="gcp">Google Cloud CDN</mat-option>
                        </mat-select>
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
  styleUrls: ['./media-management.component.scss']
})
export class MediaManagementComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Form Controls
  searchControl = this.fb.control('');
  typeFilterControl = this.fb.control([]);
  statusFilterControl = this.fb.control([]);
  collectionFilterControl = this.fb.control('');
  
  mediaSettingsForm: FormGroup;

  // Component State
  selectedTabIndex = 0;
  viewMode: 'grid' | 'table' = 'grid';
  
  // Data
  mediaAssets: MediaAsset[] = [];
  filteredAssets: MediaAsset[] = [];
  mediaCollections: MediaCollection[] = [];
  
  // Table
  assetDataSource = new MatTableDataSource<MediaAsset>();
  assetSelection = new SelectionModel<MediaAsset>(true, []);
  assetDisplayedColumns = ['select', 'thumbnail', 'name', 'type', 'size', 'dimensions', 'status', 'uploadDate', 'actions'];

  // Options
  mediaTypes = [
    { value: MediaType.IMAGE, label: 'Images' },
    { value: MediaType.VIDEO, label: 'Videos' },
    { value: MediaType.AUDIO, label: 'Audio' },
    { value: MediaType.DOCUMENT, label: 'Documents' },
    { value: MediaType.ARCHIVE, label: 'Archives' },
    { value: MediaType.OTHER, label: 'Other' }
  ];

  mediaStatuses = [
    { value: MediaStatus.READY, label: 'Ready' },
    { value: MediaStatus.PROCESSING, label: 'Processing' },
    { value: MediaStatus.UPLOADING, label: 'Uploading' },
    { value: MediaStatus.FAILED, label: 'Failed' },
    { value: MediaStatus.ARCHIVED, label: 'Archived' }
  ];

  acceptedFileTypes = 'image/*,video/*,audio/*,.pdf,.doc,.docx,.txt';

  // Analytics
  totalAssets = 0;
  totalStorage = 0;
  optimizedSavings = 0;
  averageOptimization = 0;
  storageBreakdown: any[] = [];

  private subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.mediaSettingsForm = this.fb.group({
      maxFileSize: [100, [Validators.min(1), Validators.max(1000)]],
      autoOptimize: [true],
      generateThumbnails: [true],
      extractMetadata: [true],
      imageQuality: [85, [Validators.min(10), Validators.max(100)]],
      thumbnailSize: [300, [Validators.min(50), Validators.max(1000)]],
      webpConversion: [true],
      cdnEnabled: [false],
      cdnProvider: ['cloudflare']
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
    this.mediaAssets = this.generateMockAssets();
    this.mediaCollections = this.generateMockCollections();
    
    this.updateDataSource();
  }

  private setupFilters(): void {
    // Search filter
    this.subscription.add(
      this.searchControl.valueChanges
        .pipe(debounceTime(300), distinctUntilChanged())
        .subscribe(() => this.applyFilters())
    );

    // Type filter
    this.subscription.add(
      this.typeFilterControl.valueChanges.subscribe(() => this.applyFilters())
    );

    // Status filter
    this.subscription.add(
      this.statusFilterControl.valueChanges.subscribe(() => this.applyFilters())
    );

    // Collection filter
    this.subscription.add(
      this.collectionFilterControl.valueChanges.subscribe(() => this.applyFilters())
    );
  }

  private applyFilters(): void {
    let filtered = [...this.mediaAssets];

    // Apply search filter
    const searchTerm = this.searchControl.value?.toLowerCase();
    if (searchTerm) {
      filtered = filtered.filter(asset =>
        asset.title.toLowerCase().includes(searchTerm) ||
        asset.filename.toLowerCase().includes(searchTerm) ||
        asset.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Apply type filter
    const selectedTypes = this.typeFilterControl.value;
    if (selectedTypes && selectedTypes.length > 0) {
      filtered = filtered.filter(asset => selectedTypes.includes(asset.type));
    }

    // Apply status filter
    const selectedStatuses = this.statusFilterControl.value;
    if (selectedStatuses && selectedStatuses.length > 0) {
      filtered = filtered.filter(asset => selectedStatuses.includes(asset.status));
    }

    // Apply collection filter
    const selectedCollection = this.collectionFilterControl.value;
    if (selectedCollection) {
      filtered = filtered.filter(asset => asset.collections.includes(selectedCollection));
    }

    this.filteredAssets = filtered;
    this.assetDataSource.data = filtered;
  }

  private updateDataSource(): void {
    this.filteredAssets = this.mediaAssets;
    this.assetDataSource.data = this.mediaAssets;
    this.assetDataSource.paginator = this.paginator;
    this.assetDataSource.sort = this.sort;
    this.applyFilters();
  }

  private calculateAnalytics(): void {
    this.totalAssets = this.mediaAssets.length;
    this.totalStorage = this.mediaAssets.reduce((total, asset) => total + asset.size, 0);
    this.optimizedSavings = this.mediaAssets.reduce((total, asset) => {
      if (asset.optimization.isOptimized) {
        return total + (asset.optimization.originalSize - asset.optimization.optimizedSize);
      }
      return total;
    }, 0);

    const optimizedAssets = this.mediaAssets.filter(a => a.optimization.isOptimized);
    if (optimizedAssets.length > 0) {
      const totalOptimization = optimizedAssets.reduce((total, asset) => {
        return total + (asset.optimization.compressionRatio * 100);
      }, 0);
      this.averageOptimization = Math.round(totalOptimization / optimizedAssets.length);
    }

    // Calculate storage breakdown by type
    const typeStorage: Record<string, number> = {};
    this.mediaAssets.forEach(asset => {
      typeStorage[asset.type] = (typeStorage[asset.type] || 0) + asset.size;
    });

    this.storageBreakdown = Object.entries(typeStorage).map(([type, size]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      size,
      percentage: Math.round((size / this.totalStorage) * 100)
    })).sort((a, b) => b.size - a.size);
  }

  // Event Handlers
  onTabChange(event: any): void {
    this.selectedTabIndex = event.index;
  }

  onFilesSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (files && files.length > 0) {
      this.uploadFiles(Array.from(files));
    }
  }

  changeViewMode(mode: string): void {
    this.viewMode = mode as 'grid' | 'table';
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.typeFilterControl.setValue([]);
    this.statusFilterControl.setValue([]);
    this.collectionFilterControl.setValue('');
  }

  selectAsset(asset: MediaAsset): void {
    this.assetSelection.toggle(asset);
  }

  // Asset Operations
  uploadFiles(files: File[]): void {
    files.forEach(file => {
      const mockAsset: MediaAsset = {
        id: `asset-${Date.now()}-${Math.random()}`,
        filename: file.name,
        originalFilename: file.name,
        title: file.name.replace(/\.[^/.]+$/, ""),
        type: this.getFileType(file.type),
        mimeType: file.type,
        size: file.size,
        url: URL.createObjectURL(file),
        variants: [],
        metadata: {} as MediaMetadata,
        optimization: {
          isOptimized: false,
          originalSize: file.size,
          optimizedSize: file.size,
          compressionRatio: 0,
          qualityScore: 0,
          formats: [],
          cdn: {
            enabled: false,
            provider: '',
            regions: [],
            cacheControl: '',
            expires: new Date(),
            bandwidth: 0,
            requests: 0
          },
          seo: {
            altText: '',
            title: '',
            caption: '',
            structuredData: {},
            sitemap: false
          }
        },
        usage: [],
        tags: [],
        categories: [],
        collections: [],
        uploadedBy: 'current-user',
        uploadedAt: new Date(),
        updatedAt: new Date(),
        status: MediaStatus.UPLOADING,
        processing: {
          status: 'processing',
          progress: 0,
          stage: 'uploading',
          logs: []
        },
        analytics: {
          views: 0,
          downloads: 0,
          shares: 0,
          engagement: 0,
          performance: {
            loadTime: 0,
            cacheHitRate: 0,
            bandwidth: 0,
            errors: 0,
            uptime: 0
          },
          usage: {
            totalUses: 0,
            uniqueContent: 0,
            popularityScore: 0,
            lastUsed: new Date(),
            trending: false
          },
          trends: []
        }
      };

      this.mediaAssets.unshift(mockAsset);
      this.updateDataSource();
      this.calculateAnalytics();

      // Simulate upload progress
      this.simulateUpload(mockAsset);
    });

    this.snackBar.open(`Uploading ${files.length} file(s)`, 'Close', {
      duration: 3000
    });
  }

  private simulateUpload(asset: MediaAsset): void {
    const interval = setInterval(() => {
      asset.processing.progress += Math.random() * 20;
      
      if (asset.processing.progress >= 100) {
        asset.processing.progress = 100;
        asset.processing.status = 'completed';
        asset.status = MediaStatus.READY;
        clearInterval(interval);
        
        this.snackBar.open(`Upload completed: ${asset.title}`, 'Close', {
          duration: 2000
        });
      }
    }, 500);
  }

  private getFileType(mimeType: string): MediaType {
    if (mimeType.startsWith('image/')) return MediaType.IMAGE;
    if (mimeType.startsWith('video/')) return MediaType.VIDEO;
    if (mimeType.startsWith('audio/')) return MediaType.AUDIO;
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) {
      return MediaType.DOCUMENT;
    }
    if (mimeType.includes('zip') || mimeType.includes('archive')) return MediaType.ARCHIVE;
    return MediaType.OTHER;
  }

  previewAsset(asset: MediaAsset, event: Event): void {
    event.stopPropagation();
    this.snackBar.open(`Preview: ${asset.title}`, 'Close', {
      duration: 2000
    });
  }

  editAsset(asset: MediaAsset): void {
    this.snackBar.open(`Edit: ${asset.title}`, 'Close', {
      duration: 2000
    });
  }

  downloadAsset(asset: MediaAsset): void {
    // Create download link
    const link = document.createElement('a');
    link.href = asset.url;
    link.download = asset.filename;
    link.click();
    
    this.snackBar.open(`Downloaded: ${asset.title}`, 'Close', {
      duration: 2000
    });
  }

  copyAssetUrl(asset: MediaAsset): void {
    navigator.clipboard.writeText(asset.url).then(() => {
      this.snackBar.open('URL copied to clipboard', 'Close', {
        duration: 2000
      });
    });
  }

  optimizeAsset(asset: MediaAsset): void {
    asset.processing.status = 'processing';
    asset.processing.progress = 0;
    asset.processing.stage = 'optimizing';

    // Simulate optimization
    const interval = setInterval(() => {
      asset.processing.progress += Math.random() * 15;
      
      if (asset.processing.progress >= 100) {
        asset.processing.progress = 100;
        asset.processing.status = 'completed';
        asset.optimization.isOptimized = true;
        asset.optimization.optimizedSize = Math.round(asset.size * 0.7);
        asset.optimization.compressionRatio = 0.3;
        clearInterval(interval);
        
        this.snackBar.open(`Optimized: ${asset.title}`, 'Close', {
          duration: 2000
        });
        this.calculateAnalytics();
      }
    }, 300);
  }

  deleteAsset(asset: MediaAsset): void {
    const index = this.mediaAssets.indexOf(asset);
    if (index > -1) {
      this.mediaAssets.splice(index, 1);
      this.updateDataSource();
      this.calculateAnalytics();
      
      this.snackBar.open(`Deleted: ${asset.title}`, 'Close', {
        duration: 2000
      });
    }
  }

  // Bulk Operations
  isAllSelected(): boolean {
    const numSelected = this.assetSelection.selected.length;
    const numRows = this.assetDataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle(): void {
    if (this.isAllSelected()) {
      this.assetSelection.clear();
    } else {
      this.assetDataSource.data.forEach(row => this.assetSelection.select(row));
    }
  }

  bulkDownload(): void {
    const selectedAssets = this.assetSelection.selected;
    this.snackBar.open(`Downloading ${selectedAssets.length} assets`, 'Close', {
      duration: 3000
    });
  }

  bulkOptimize(): void {
    const selectedAssets = this.assetSelection.selected;
    selectedAssets.forEach(asset => this.optimizeAsset(asset));
  }

  bulkMove(): void {
    const selectedAssets = this.assetSelection.selected;
    this.snackBar.open(`Move ${selectedAssets.length} assets functionality would be implemented here`, 'Close', {
      duration: 3000
    });
  }

  bulkDelete(): void {
    const selectedAssets = this.assetSelection.selected;
    selectedAssets.forEach(asset => this.deleteAsset(asset));
    this.assetSelection.clear();
  }

  // Collection Operations
  createCollection(): void {
    this.snackBar.open('Create collection functionality would be implemented here', 'Close', {
      duration: 3000
    });
  }

  openCollection(collection: MediaCollection): void {
    this.collectionFilterControl.setValue(collection.id);
    this.selectedTabIndex = 0; // Switch to assets tab
  }

  editCollection(collection: MediaCollection): void {
    this.snackBar.open(`Edit collection: ${collection.name}`, 'Close', {
      duration: 2000
    });
  }

  shareCollection(collection: MediaCollection): void {
    this.snackBar.open(`Share collection: ${collection.name}`, 'Close', {
      duration: 2000
    });
  }

  exportCollection(collection: MediaCollection): void {
    this.snackBar.open(`Export collection: ${collection.name}`, 'Close', {
      duration: 2000
    });
  }

  duplicateCollection(collection: MediaCollection): void {
    this.snackBar.open(`Duplicate collection: ${collection.name}`, 'Close', {
      duration: 2000
    });
  }

  deleteCollection(collection: MediaCollection): void {
    const index = this.mediaCollections.indexOf(collection);
    if (index > -1) {
      this.mediaCollections.splice(index, 1);
      this.snackBar.open(`Deleted collection: ${collection.name}`, 'Close', {
        duration: 2000
      });
    }
  }

  // Settings
  saveSettings(): void {
    if (this.mediaSettingsForm.valid) {
      this.snackBar.open('Settings saved successfully', 'Close', {
        duration: 3000
      });
    }
  }

  resetSettings(): void {
    this.mediaSettingsForm.reset({
      maxFileSize: 100,
      autoOptimize: true,
      generateThumbnails: true,
      extractMetadata: true,
      imageQuality: 85,
      thumbnailSize: 300,
      webpConversion: true,
      cdnEnabled: false,
      cdnProvider: 'cloudflare'
    });
  }

  // Helper Methods
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }

  getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toUpperCase() || '';
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/placeholder.png';
  }

  // Additional Operations
  bulkUpload(): void {
    this.snackBar.open('Bulk upload functionality would be implemented here', 'Close', {
      duration: 3000
    });
  }

  importFromUrl(): void {
    this.snackBar.open('Import from URL functionality would be implemented here', 'Close', {
      duration: 3000
    });
  }

  optimizeAll(): void {
    const unoptimizedAssets = this.mediaAssets.filter(asset => !asset.optimization.isOptimized);
    unoptimizedAssets.forEach(asset => this.optimizeAsset(asset));
    
    this.snackBar.open(`Optimizing ${unoptimizedAssets.length} assets`, 'Close', {
      duration: 3000
    });
  }

  mediaSettings(): void {
    this.selectedTabIndex = 3; // Switch to settings tab
  }

  moveToCollection(asset: MediaAsset): void {
    this.snackBar.open('Move to collection functionality would be implemented here', 'Close', {
      duration: 3000
    });
  }

  duplicateAsset(asset: MediaAsset): void {
    const duplicatedAsset = { ...asset };
    duplicatedAsset.id = `asset-${Date.now()}-${Math.random()}`;
    duplicatedAsset.title = `${asset.title} (Copy)`;
    duplicatedAsset.filename = `copy-${asset.filename}`;
    duplicatedAsset.uploadedAt = new Date();
    
    this.mediaAssets.unshift(duplicatedAsset);
    this.updateDataSource();
    this.calculateAnalytics();
    
    this.snackBar.open(`Duplicated: ${asset.title}`, 'Close', {
      duration: 2000
    });
  }

  // Mock Data Generators
  private generateMockAssets(): MediaAsset[] {
    const assets: MediaAsset[] = [];
    const types = Object.values(MediaType);
    const statuses = Object.values(MediaStatus);

    for (let i = 0; i < 25; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      assets.push({
        id: `asset-${i + 1}`,
        filename: `file-${i + 1}.${this.getExtensionForType(type)}`,
        originalFilename: `original-file-${i + 1}.${this.getExtensionForType(type)}`,
        title: `Asset ${i + 1} - ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        description: `Description for asset ${i + 1}`,
        alt: `Alt text for asset ${i + 1}`,
        type,
        mimeType: this.getMimeTypeForType(type),
        size: Math.floor(Math.random() * 10000000) + 100000,
        dimensions: type === MediaType.IMAGE || type === MediaType.VIDEO ? {
          width: Math.floor(Math.random() * 2000) + 800,
          height: Math.floor(Math.random() * 1500) + 600,
          aspectRatio: 16/9
        } : undefined,
        duration: type === MediaType.VIDEO || type === MediaType.AUDIO ? Math.floor(Math.random() * 600) + 30 : undefined,
        url: `https://example.com/assets/asset-${i + 1}`,
        thumbnailUrl: type === MediaType.IMAGE ? `https://picsum.photos/300/200?random=${i}` : undefined,
        cdnUrl: `https://cdn.example.com/assets/asset-${i + 1}`,
        variants: [],
        metadata: {} as MediaMetadata,
        optimization: {
          isOptimized: Math.random() > 0.5,
          originalSize: Math.floor(Math.random() * 10000000) + 100000,
          optimizedSize: Math.floor(Math.random() * 5000000) + 50000,
          compressionRatio: Math.random() * 0.5 + 0.1,
          qualityScore: Math.floor(Math.random() * 40) + 60,
          formats: [],
          cdn: {
            enabled: Math.random() > 0.5,
            provider: 'cloudflare',
            regions: ['us', 'eu'],
            cacheControl: 'max-age=31536000',
            expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            bandwidth: Math.floor(Math.random() * 1000),
            requests: Math.floor(Math.random() * 10000)
          },
          seo: {
            altText: `Alt text for asset ${i + 1}`,
            title: `SEO title for asset ${i + 1}`,
            caption: `Caption for asset ${i + 1}`,
            structuredData: {},
            sitemap: true
          }
        },
        usage: [],
        tags: this.generateRandomTags(),
        categories: this.generateRandomCategories(),
        collections: [],
        uploadedBy: `user-${Math.floor(Math.random() * 5) + 1}`,
        uploadedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        status,
        processing: {
          status: status === MediaStatus.PROCESSING ? 'processing' : 'completed',
          progress: status === MediaStatus.PROCESSING ? Math.floor(Math.random() * 80) + 10 : 100,
          stage: 'processing',
          logs: []
        },
        analytics: {
          views: Math.floor(Math.random() * 1000),
          downloads: Math.floor(Math.random() * 100),
          shares: Math.floor(Math.random() * 50),
          engagement: Math.floor(Math.random() * 100),
          performance: {
            loadTime: Math.random() * 2000 + 500,
            cacheHitRate: Math.random() * 100,
            bandwidth: Math.random() * 1000,
            errors: Math.floor(Math.random() * 10),
            uptime: 99.9
          },
          usage: {
            totalUses: Math.floor(Math.random() * 50),
            uniqueContent: Math.floor(Math.random() * 20),
            popularityScore: Math.floor(Math.random() * 100),
            lastUsed: new Date(),
            trending: Math.random() > 0.8
          },
          trends: []
        }
      });
    }

    return assets;
  }

  private generateMockCollections(): MediaCollection[] {
    const collections: MediaCollection[] = [];
    const collectionNames = [
      'Product Images',
      'Blog Post Media',
      'Marketing Materials',
      'User Generated Content',
      'Stock Photos',
      'Video Content',
      'Brand Assets'
    ];

    collectionNames.forEach((name, index) => {
      collections.push({
        id: `collection-${index + 1}`,
        name,
        description: `Collection for ${name.toLowerCase()}`,
        thumbnail: `https://picsum.photos/400/300?random=${index + 100}`,
        assetCount: Math.floor(Math.random() * 50) + 5,
        totalSize: Math.floor(Math.random() * 500000000) + 10000000,
        tags: this.generateRandomTags().slice(0, 3),
        createdBy: 'admin',
        createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        isPublic: Math.random() > 0.5,
        permissions: []
      });
    });

    return collections;
  }

  private getExtensionForType(type: MediaType): string {
    switch (type) {
      case MediaType.IMAGE: return 'jpg';
      case MediaType.VIDEO: return 'mp4';
      case MediaType.AUDIO: return 'mp3';
      case MediaType.DOCUMENT: return 'pdf';
      case MediaType.ARCHIVE: return 'zip';
      default: return 'bin';
    }
  }

  private getMimeTypeForType(type: MediaType): string {
    switch (type) {
      case MediaType.IMAGE: return 'image/jpeg';
      case MediaType.VIDEO: return 'video/mp4';
      case MediaType.AUDIO: return 'audio/mpeg';
      case MediaType.DOCUMENT: return 'application/pdf';
      case MediaType.ARCHIVE: return 'application/zip';
      default: return 'application/octet-stream';
    }
  }

  private generateRandomTags(): string[] {
    const allTags = ['product', 'marketing', 'blog', 'hero', 'thumbnail', 'banner', 'social', 'email', 'print', 'web'];
    const count = Math.floor(Math.random() * 5) + 1;
    const shuffled = allTags.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  private generateRandomCategories(): string[] {
    const allCategories = ['Marketing', 'Product', 'Editorial', 'Brand', 'User Content'];
    const count = Math.floor(Math.random() * 3) + 1;
    const shuffled = allCategories.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
}