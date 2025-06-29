import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ChapterPreview {
  id: string;
  title: string;
  description: string;
  previewContent: string;
  fullContentLength: number;
  previewLength: number;
  estimatedReadTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  author: {
    name: string;
    title: string;
    avatar?: string;
  };
  publishedDate: Date;
  lastUpdated: Date;
  tags: string[];
  requiredTier: string;
  chapterNumber?: number;
  nextChapter?: string;
  previousChapter?: string;
  completionRate?: number;
  bookmarked?: boolean;
  progress?: number;
}

export interface ChapterCardConfig {
  showProgress?: boolean;
  showBookmark?: boolean;
  showTags?: boolean;
  showAuthor?: boolean;
  enableHover?: boolean;
  cardSize?: 'compact' | 'standard' | 'expanded';
  showPreview?: boolean;
  maxPreviewLines?: number;
}

@Component({
  selector: 'app-chapter-preview-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article 
      class="chapter-preview-card" 
      [class]="'size-' + config.cardSize"
      [class.bookmarked]="chapter.bookmarked"
      [class.completed]="isCompleted"
      [class.locked]="isLocked"
      [class.hover-enabled]="config.enableHover"
      [attr.data-chapter]="chapter.id"
      [attr.data-testid]="'chapter-card-' + chapter.id"
      (click)="onCardClick()"
    >
      <!-- Card Header -->
      <header class="card-header">
        <!-- Chapter Number & Status -->
        <div class="chapter-meta">
          <div class="chapter-number" *ngIf="chapter.chapterNumber">
            <span class="number-text">{{ chapter.chapterNumber }}</span>
          </div>
          
          <div class="status-indicators">
            <!-- Difficulty Badge -->
            <span class="difficulty-badge" [class]="'difficulty-' + chapter.difficulty">
              {{ getDifficultyLabel(chapter.difficulty) }}
            </span>
            
            <!-- Tier Badge -->
            <span class="tier-badge" [class]="'tier-' + chapter.requiredTier">
              {{ getTierLabel(chapter.requiredTier) }}
            </span>
            
            <!-- Lock Icon -->
            <span class="lock-icon" *ngIf="isLocked" [attr.aria-label]="'Requires ' + chapter.requiredTier + ' tier'">
              🔒
            </span>
          </div>
        </div>

        <!-- Bookmark Button -->
        <button 
          class="bookmark-button"
          *ngIf="config.showBookmark"
          (click)="onBookmarkClick($event)"
          [class.active]="chapter.bookmarked"
          [attr.aria-label]="chapter.bookmarked ? 'Remove bookmark' : 'Add bookmark'"
        >
          <span class="bookmark-icon">{{ chapter.bookmarked ? '★' : '☆' }}</span>
        </button>
      </header>

      <!-- Progress Bar -->
      <div class="progress-section" *ngIf="config.showProgress && chapter.progress !== undefined">
        <div class="progress-bar">
          <div class="progress-fill" [style.width.%]="chapter.progress"></div>
        </div>
        <span class="progress-text">{{ chapter.progress }}% complete</span>
      </div>

      <!-- Card Content -->
      <div class="card-content">
        <!-- Title -->
        <h3 class="chapter-title">
          <span class="title-text">{{ chapter.title }}</span>
          <span class="completion-check" *ngIf="isCompleted" aria-label="Completed">✓</span>
        </h3>

        <!-- Description -->
        <p class="chapter-description" *ngIf="chapter.description">
          {{ chapter.description }}
        </p>

        <!-- Preview Content -->
        <div class="preview-section" *ngIf="config.showPreview && chapter.previewContent">
          <div class="preview-content" [class.expanded]="showFullPreview">
            <p class="preview-text" [style.-webkit-line-clamp]="showFullPreview ? 'unset' : config.maxPreviewLines || 3">
              {{ chapter.previewContent }}
            </p>
            
            <!-- Read More/Less Toggle -->
            <button 
              class="preview-toggle"
              *ngIf="isPreviewTruncated"
              (click)="togglePreview($event)"
            >
              {{ showFullPreview ? 'Show less' : 'Read more' }}
            </button>
          </div>

          <!-- Preview Stats -->
          <div class="preview-stats">
            <span class="stat-item">
              <span class="stat-icon">📄</span>
              <span class="stat-text">{{ chapter.previewLength }}/{{ chapter.fullContentLength }} words</span>
            </span>
            <span class="stat-item">
              <span class="stat-icon">⏱️</span>
              <span class="stat-text">{{ chapter.estimatedReadTime }} min read</span>
            </span>
          </div>
        </div>

        <!-- Tags -->
        <div class="tags-section" *ngIf="config.showTags && chapter.tags.length > 0">
          <span 
            class="tag"
            *ngFor="let tag of chapter.tags.slice(0, 3)"
            [attr.title]="tag"
          >
            {{ tag }}
          </span>
          <span class="tag more-tags" *ngIf="chapter.tags.length > 3">
            +{{ chapter.tags.length - 3 }}
          </span>
        </div>
      </div>

      <!-- Card Footer -->
      <footer class="card-footer">
        <!-- Author Info -->
        <div class="author-section" *ngIf="config.showAuthor">
          <div class="author-info">
            <img 
              *ngIf="chapter.author.avatar"
              [src]="chapter.author.avatar"
              [alt]="chapter.author.name"
              class="author-avatar"
              loading="lazy"
              (error)="onAvatarError($event)"
            />
            <div class="author-details">
              <span class="author-name">{{ chapter.author.name }}</span>
              <span class="author-title">{{ chapter.author.title }}</span>
            </div>
          </div>
        </div>

        <!-- Metadata -->
        <div class="metadata-section">
          <time class="publish-date" [dateTime]="chapter.publishedDate.toISOString()">
            {{ formatDate(chapter.publishedDate) }}
          </time>
          <span class="last-updated" *ngIf="isRecentlyUpdated(chapter.lastUpdated)">
            <span class="update-indicator">📝</span>
            <span class="update-text">Recently updated</span>
          </span>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <button 
            class="action-button primary"
            (click)="onReadClick($event)"
            [disabled]="isLocked"
          >
            <span class="button-icon">{{ getActionIcon() }}</span>
            <span class="button-text">{{ getActionText() }}</span>
          </button>

          <button 
            class="action-button secondary"
            *ngIf="!isLocked"
            (click)="onShareClick($event)"
            [attr.aria-label]="'Share ' + chapter.title"
          >
            <span class="button-icon">📤</span>
          </button>
        </div>
      </footer>

      <!-- Unlock Overlay -->
      <div class="unlock-overlay" *ngIf="isLocked">
        <div class="unlock-content">
          <div class="unlock-icon">🔓</div>
          <h4 class="unlock-title">Upgrade to Access</h4>
          <p class="unlock-description">
            This chapter requires the {{ getTierLabel(chapter.requiredTier) }} tier or higher
          </p>
          <button class="unlock-button" (click)="onUpgradeClick($event)">
            Upgrade Now
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-overlay" *ngIf="isLoading">
        <div class="loading-spinner"></div>
      </div>

      <!-- Hover Effects -->
      <div class="hover-effects" *ngIf="config.enableHover">
        <div class="shine-effect"></div>
        <div class="border-glow"></div>
      </div>
    </article>
  `,
  styleUrls: ['./chapter-preview-card.component.scss']
})
export class ChapterPreviewCardComponent {
  @Input() chapter!: ChapterPreview;
  @Input() userTier: string = 'free';
  @Input() config: ChapterCardConfig = {
    showProgress: true,
    showBookmark: true,
    showTags: true,
    showAuthor: true,
    enableHover: true,
    cardSize: 'standard',
    showPreview: true,
    maxPreviewLines: 3
  };
  @Input() isLoading = false;

  @Output() cardClicked = new EventEmitter<ChapterPreview>();
  @Output() readClicked = new EventEmitter<ChapterPreview>();
  @Output() bookmarkToggled = new EventEmitter<{ chapter: ChapterPreview; bookmarked: boolean }>();
  @Output() shareClicked = new EventEmitter<ChapterPreview>();
  @Output() upgradeClicked = new EventEmitter<{ chapter: ChapterPreview; requiredTier: string }>();

  showFullPreview = false;

  onCardClick() {
    if (!this.isLocked) {
      this.cardClicked.emit(this.chapter);
    }
  }

  onReadClick(event: Event) {
    event.stopPropagation();
    if (!this.isLocked) {
      this.readClicked.emit(this.chapter);
    }
  }

  onBookmarkClick(event: Event) {
    event.stopPropagation();
    const newBookmarkState = !this.chapter.bookmarked;
    this.bookmarkToggled.emit({
      chapter: this.chapter,
      bookmarked: newBookmarkState
    });
  }

  onShareClick(event: Event) {
    event.stopPropagation();
    this.shareClicked.emit(this.chapter);
  }

  onUpgradeClick(event: Event) {
    event.stopPropagation();
    this.upgradeClicked.emit({
      chapter: this.chapter,
      requiredTier: this.chapter.requiredTier
    });
  }

  togglePreview(event: Event) {
    event.stopPropagation();
    this.showFullPreview = !this.showFullPreview;
  }

  onAvatarError(event: Event) {
    const target = event.target as HTMLImageElement;
    target.src = '/assets/authors/default-avatar.svg';
  }

  getDifficultyLabel(difficulty: string): string {
    const labels = {
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced'
    };
    return labels[difficulty as keyof typeof labels] || difficulty;
  }

  getTierLabel(tier: string): string {
    const labels = {
      free: 'Free',
      foundation: 'Foundation',
      professional: 'Professional',
      elite: 'Elite'
    };
    return labels[tier as keyof typeof labels] || tier;
  }

  getActionIcon(): string {
    if (this.isCompleted) return '✓';
    if (this.chapter.progress && this.chapter.progress > 0) return '▶';
    return '📖';
  }

  getActionText(): string {
    if (this.isCompleted) return 'Review';
    if (this.chapter.progress && this.chapter.progress > 0) return 'Continue';
    return 'Read Now';
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
    
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  isRecentlyUpdated(lastUpdated: Date): boolean {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastUpdated.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7; // Updated within last week
  }

  get isCompleted(): boolean {
    return this.chapter.progress === 100;
  }

  get isLocked(): boolean {
    const tierHierarchy = {
      'free': 0,
      'foundation': 1,
      'professional': 2,
      'elite': 3
    };

    const userTierLevel = tierHierarchy[this.userTier as keyof typeof tierHierarchy] || 0;
    const requiredTierLevel = tierHierarchy[this.chapter.requiredTier as keyof typeof tierHierarchy] || 0;

    return userTierLevel < requiredTierLevel;
  }

  get isPreviewTruncated(): boolean {
    return this.chapter.previewContent.length > 200; // Approximate truncation threshold
  }
}