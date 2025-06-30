import { Component, OnInit, OnDestroy, ViewChild, ElementRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonBackButton,
  IonButtons, IonButton, IonIcon, IonProgressBar, IonFab,
  IonFabButton, IonActionSheet, IonToast, IonSpinner,
  IonCard, IonCardContent, IonItem, IonLabel, IonBadge,
  IonModal, IonList, IonGrid, IonRow, IonCol, IonChip,
  IonSegment, IonSegmentButton, IonTextarea, IonInput
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  bookmarkOutline, bookmark, shareOutline, copyOutline,
  arrowUpCircleOutline, arrowDownCircleOutline, listOutline,
  timeOutline, checkmarkCircleOutline, clipboardOutline,
  searchOutline, textOutline, colorPaletteOutline, settingsOutline
} from 'ionicons/icons';
import { ContentService, ContentChapter, UserProgress } from '../../services/content.service';
import { Subject, takeUntil, BehaviorSubject, combineLatest } from 'rxjs';
import { map, switchMap, tap, debounceTime, distinctUntilChanged } from 'rxjs/operators';

interface ReadingSettings {
  fontSize: number;
  fontFamily: string;
  theme: 'light' | 'dark' | 'sepia';
  lineHeight: number;
  textAlign: 'left' | 'center' | 'justify';
}

interface TableOfContentsItem {
  id: string;
  title: string;
  level: number;
  completed: boolean;
  current: boolean;
}

@Component({
  selector: 'app-chapter-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    IonHeader, IonToolbar, IonTitle, IonContent, IonBackButton,
    IonButtons, IonButton, IonIcon, IonProgressBar, IonFab,
    IonFabButton, IonActionSheet, IonToast, IonSpinner,
    IonCard, IonCardContent, IonItem, IonLabel, IonBadge,
    IonModal, IonList, IonGrid, IonRow, IonCol, IonChip,
    IonSegment, IonSegmentButton, IonTextarea, IonInput
  ],
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/chapters"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ chapter()?.title || 'Loading...' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="toggleBookmark()" [disabled]="!chapter()">
            <ion-icon [name]="isBookmarked() ? 'bookmark' : 'bookmark-outline'"></ion-icon>
          </ion-button>
          <ion-button (click)="openTableOfContents()">
            <ion-icon name="list-outline"></ion-icon>
          </ion-button>
          <ion-button (click)="openSettings()">
            <ion-icon name="settings-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      
      <ion-progress-bar 
        *ngIf="chapter()" 
        [value]="readingProgress() / 100"
        color="primary">
      </ion-progress-bar>
    </ion-header>

    <ion-content [fullscreen]="true" [class]="'theme-' + readingSettings().theme">
      
      <!-- Chapter Header -->
      <div *ngIf="chapter()" class="chapter-header" [style.font-size.px]="readingSettings().fontSize">
        <div class="chapter-meta">
          <ion-chip color="primary">
            <ion-label>Chapter {{ chapter()!.number }}</ion-label>
          </ion-chip>
          <ion-chip color="medium" *ngIf="chapter()!.difficulty">
            <ion-label>{{ chapter()!.difficulty | titlecase }}</ion-label>
          </ion-chip>
          <ion-chip color="tertiary">
            <ion-icon name="time-outline"></ion-icon>
            <ion-label>{{ chapter()!.estimatedReadTime }} min</ion-label>
          </ion-chip>
        </div>

        <h1 class="chapter-title">{{ chapter()!.title }}</h1>
        <p class="chapter-subtitle" *ngIf="chapter()!.subtitle">{{ chapter()!.subtitle }}</p>
        <p class="chapter-description">{{ chapter()!.description }}</p>

        <!-- Learning Objectives -->
        <ion-card *ngIf="chapter()!.learningObjectives?.length">
          <ion-card-content>
            <h3>What You'll Learn</h3>
            <ul class="learning-objectives">
              <li *ngFor="let objective of chapter()!.learningObjectives">
                {{ objective }}
              </li>
            </ul>
          </ion-card-content>
        </ion-card>

        <!-- Prerequisites -->
        <ion-card *ngIf="chapter()!.prerequisites?.length" class="prerequisites-card">
          <ion-card-content>
            <h3>Prerequisites</h3>
            <div class="prerequisites">
              <ion-chip 
                *ngFor="let prereq of chapter()!.prerequisites" 
                color="warning"
                routerLink="/chapters/{{ prereq }}">
                {{ prereq }}
              </ion-chip>
            </div>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- Chapter Content -->
      <div 
        *ngIf="chapter()" 
        class="chapter-content"
        [style.font-size.px]="readingSettings().fontSize"
        [style.font-family]="readingSettings().fontFamily"
        [style.line-height]="readingSettings().lineHeight"
        [style.text-align]="readingSettings().textAlign"
        #chapterContent>
        
        <!-- Content Sections -->
        <div *ngFor="let section of chapter()!.sections; trackBy: trackBySection" class="content-section">
          <h3 *ngIf="section.title" class="section-title">{{ section.title }}</h3>
          
          <!-- Text Content -->
          <div *ngIf="section.type === 'text'" class="text-content" [innerHTML]="formatContent(section.content)">
          </div>

          <!-- Code Content -->
          <div *ngIf="section.type === 'code'" class="code-content">
            <div class="code-header">
              <span class="code-language">{{ section.metadata?.language || 'Code' }}</span>
              <ion-button fill="clear" size="small" (click)="copyToClipboard(section.content)">
                <ion-icon name="copy-outline"></ion-icon>
              </ion-button>
            </div>
            <pre><code>{{ section.content }}</code></pre>
          </div>

          <!-- Quote Content -->
          <blockquote *ngIf="section.type === 'quote'" class="quote-content">
            {{ section.content }}
          </blockquote>

          <!-- Callout Content -->
          <ion-card *ngIf="section.type === 'callout'" class="callout-content" color="light">
            <ion-card-content>
              <div [innerHTML]="formatContent(section.content)"></div>
            </ion-card-content>
          </ion-card>

          <!-- Template Preview -->
          <ion-card *ngIf="section.type === 'template'" class="template-content">
            <ion-card-content>
              <h4>{{ section.title }}</h4>
              <div class="template-preview">{{ section.content }}</div>
              <ion-button fill="outline" size="small" (click)="useTemplate(section.id)">
                Use Template
              </ion-button>
            </ion-card-content>
          </ion-card>
        </div>

        <!-- Key Takeaways -->
        <ion-card *ngIf="chapter()!.keyTakeaways?.length" class="takeaways-card">
          <ion-card-content>
            <h3>Key Takeaways</h3>
            <ul class="key-takeaways">
              <li *ngFor="let takeaway of chapter()!.keyTakeaways">
                <ion-icon name="checkmark-circle-outline" color="success"></ion-icon>
                {{ takeaway }}
              </li>
            </ul>
          </ion-card-content>
        </ion-card>

        <!-- Exercises -->
        <div *ngIf="chapter()!.exercises?.length" class="exercises-section">
          <h3>Practice Exercises</h3>
          <ion-card *ngFor="let exercise of chapter()!.exercises" class="exercise-card">
            <ion-card-content>
              <div class="exercise-header">
                <h4>{{ exercise.title }}</h4>
                <ion-chip [color]="getExerciseDifficultyColor(exercise.difficulty)">
                  {{ exercise.difficulty | titlecase }}
                </ion-chip>
              </div>
              <p>{{ exercise.description }}</p>
              <ion-button fill="outline" (click)="startExercise(exercise.id)">
                Start Exercise
              </ion-button>
            </ion-card-content>
          </ion-card>
        </div>
      </div>

      <!-- Navigation -->
      <div *ngIf="chapter()" class="chapter-navigation">
        <ion-grid>
          <ion-row>
            <ion-col size="6">
              <ion-button 
                *ngIf="chapter()!.previousChapter"
                expand="block" 
                fill="outline"
                routerLink="/chapters/{{ chapter()!.previousChapter }}">
                <ion-icon name="arrow-back-outline" slot="start"></ion-icon>
                Previous
              </ion-button>
            </ion-col>
            <ion-col size="6">
              <ion-button 
                *ngIf="chapter()!.nextChapter"
                expand="block"
                routerLink="/chapters/{{ chapter()!.nextChapter }}">
                Next
                <ion-icon name="arrow-forward-outline" slot="end"></ion-icon>
              </ion-button>
            </ion-col>
          </ion-row>
        </ion-grid>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading()" class="loading-container">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Loading chapter...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error()" class="error-container">
        <ion-icon name="alert-circle-outline" color="danger"></ion-icon>
        <h3>Error Loading Chapter</h3>
        <p>{{ error() }}</p>
        <ion-button (click)="retryLoad()">Retry</ion-button>
      </div>
    </ion-content>

    <!-- Floating Action Button -->
    <ion-fab vertical="bottom" horizontal="end" slot="fixed">
      <ion-fab-button (click)="openActionSheet()">
        <ion-icon name="ellipsis-vertical"></ion-icon>
      </ion-fab-button>
    </ion-fab>

    <!-- Table of Contents Modal -->
    <ion-modal #tocModal>
      <ng-template>
        <ion-header>
          <ion-toolbar>
            <ion-title>Table of Contents</ion-title>
            <ion-buttons slot="end">
              <ion-button (click)="closeToc()">Close</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <ion-list>
            <ion-item 
              *ngFor="let item of tableOfContents()" 
              button
              (click)="navigateToSection(item.id)"
              [class.active]="item.current">
              <ion-label>
                <h3 [style.margin-left.px]="item.level * 16">{{ item.title }}</h3>
              </ion-label>
              <ion-icon 
                *ngIf="item.completed" 
                name="checkmark-circle" 
                color="success" 
                slot="end">
              </ion-icon>
            </ion-item>
          </ion-list>
        </ion-content>
      </ng-template>
    </ion-modal>

    <!-- Reading Settings Modal -->
    <ion-modal #settingsModal>
      <ng-template>
        <ion-header>
          <ion-toolbar>
            <ion-title>Reading Settings</ion-title>
            <ion-buttons slot="end">
              <ion-button (click)="closeSettings()">Close</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <div class="settings-content">
            
            <!-- Font Size -->
            <ion-item>
              <ion-label>Font Size</ion-label>
              <ion-button 
                fill="clear" 
                size="small" 
                (click)="adjustFontSize(-2)">
                A-
              </ion-button>
              <span class="font-size-display">{{ readingSettings().fontSize }}px</span>
              <ion-button 
                fill="clear" 
                size="small" 
                (click)="adjustFontSize(2)">
                A+
              </ion-button>
            </ion-item>

            <!-- Theme -->
            <ion-item>
              <ion-label>Theme</ion-label>
              <ion-segment 
                [(ngModel)]="readingSettings().theme" 
                (ionChange)="updateTheme($event)">
                <ion-segment-button value="light">
                  <ion-label>Light</ion-label>
                </ion-segment-button>
                <ion-segment-button value="dark">
                  <ion-label>Dark</ion-label>
                </ion-segment-button>
                <ion-segment-button value="sepia">
                  <ion-label>Sepia</ion-label>
                </ion-segment-button>
              </ion-segment>
            </ion-item>

            <!-- Font Family -->
            <ion-item>
              <ion-label>Font</ion-label>
              <ion-segment 
                [(ngModel)]="readingSettings().fontFamily" 
                (ionChange)="updateFontFamily($event)">
                <ion-segment-button value="Inter">
                  <ion-label>Inter</ion-label>
                </ion-segment-button>
                <ion-segment-button value="serif">
                  <ion-label>Serif</ion-label>
                </ion-segment-button>
                <ion-segment-button value="monospace">
                  <ion-label>Mono</ion-label>
                </ion-segment-button>
              </ion-segment>
            </ion-item>

            <!-- Line Height -->
            <ion-item>
              <ion-label>Line Height</ion-label>
              <ion-segment 
                [(ngModel)]="readingSettings().lineHeight" 
                (ionChange)="updateLineHeight($event)">
                <ion-segment-button value="1.4">
                  <ion-label>Tight</ion-label>
                </ion-segment-button>
                <ion-segment-button value="1.6">
                  <ion-label>Normal</ion-label>
                </ion-segment-button>
                <ion-segment-button value="1.8">
                  <ion-label>Loose</ion-label>
                </ion-segment-button>
              </ion-segment>
            </ion-item>

          </div>
        </ion-content>
      </ng-template>
    </ion-modal>

    <!-- Action Sheet -->
    <ion-action-sheet
      #actionSheet
      header="Chapter Actions"
      [buttons]="actionSheetButtons">
    </ion-action-sheet>

    <!-- Toast Messages -->
    <ion-toast
      #toast
      [message]="toastMessage()"
      [duration]="3000"
      position="bottom">
    </ion-toast>
  `,
  styles: [`
    .chapter-header {
      padding: 1rem;
      border-bottom: 1px solid var(--ion-color-light);
    }

    .chapter-meta {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }

    .chapter-title {
      font-size: 1.8rem;
      font-weight: 700;
      margin: 0 0 0.5rem 0;
      color: var(--ion-color-primary);
    }

    .chapter-subtitle {
      font-size: 1.2rem;
      color: var(--ion-color-medium);
      margin: 0 0 1rem 0;
    }

    .chapter-description {
      font-size: 1rem;
      line-height: 1.6;
      margin: 0 0 1rem 0;
    }

    .learning-objectives {
      list-style: none;
      padding: 0;
    }

    .learning-objectives li {
      padding: 0.25rem 0;
      position: relative;
      padding-left: 1.5rem;
    }

    .learning-objectives li::before {
      content: '✓';
      position: absolute;
      left: 0;
      color: var(--ion-color-success);
      font-weight: bold;
    }

    .prerequisites {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .chapter-content {
      padding: 1rem;
      max-width: 100%;
      overflow-wrap: break-word;
    }

    .content-section {
      margin: 2rem 0;
    }

    .section-title {
      color: var(--ion-color-primary);
      border-bottom: 2px solid var(--ion-color-primary);
      padding-bottom: 0.5rem;
      margin-bottom: 1rem;
    }

    .text-content {
      line-height: inherit;
    }

    .text-content p {
      margin: 1rem 0;
    }

    .code-content {
      background: var(--ion-color-light);
      border-radius: 8px;
      overflow: hidden;
      margin: 1rem 0;
    }

    .code-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 1rem;
      background: var(--ion-color-medium-shade);
      border-bottom: 1px solid var(--ion-color-medium);
    }

    .code-language {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--ion-color-dark);
    }

    .code-content pre {
      margin: 0;
      padding: 1rem;
      overflow-x: auto;
      background: var(--ion-color-light);
    }

    .code-content code {
      font-family: 'Courier New', monospace;
      font-size: 0.9rem;
    }

    .quote-content {
      border-left: 4px solid var(--ion-color-secondary);
      padding-left: 1rem;
      margin: 1.5rem 0;
      font-style: italic;
      color: var(--ion-color-medium-shade);
    }

    .callout-content {
      margin: 1.5rem 0;
    }

    .template-content {
      border: 2px dashed var(--ion-color-tertiary);
    }

    .template-preview {
      background: var(--ion-color-light);
      padding: 1rem;
      margin: 1rem 0;
      border-radius: 4px;
      font-family: monospace;
      white-space: pre-wrap;
    }

    .takeaways-card {
      background: linear-gradient(135deg, var(--ion-color-success-tint), var(--ion-color-light));
      margin: 2rem 0;
    }

    .key-takeaways {
      list-style: none;
      padding: 0;
    }

    .key-takeaways li {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      margin: 0.75rem 0;
    }

    .exercises-section {
      margin: 2rem 0;
    }

    .exercise-card {
      margin: 1rem 0;
    }

    .exercise-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .chapter-navigation {
      padding: 1rem;
      border-top: 1px solid var(--ion-color-light);
      margin-top: 2rem;
    }

    .loading-container,
    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1rem;
      text-align: center;
    }

    .error-container ion-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .settings-content {
      padding: 1rem;
    }

    .font-size-display {
      margin: 0 1rem;
      font-weight: 600;
      min-width: 50px;
      text-align: center;
    }

    /* Theme Styles */
    .theme-light {
      --ion-background-color: #ffffff;
      --ion-text-color: #000000;
    }

    .theme-dark {
      --ion-background-color: #1a1a1a;
      --ion-text-color: #ffffff;
    }

    .theme-sepia {
      --ion-background-color: #f4f1ea;
      --ion-text-color: #5c4b37;
    }

    .active {
      --ion-item-background: var(--ion-color-primary-tint);
    }

    @media (min-width: 768px) {
      .chapter-content {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem;
      }
    }
  `]
})
export class ChapterDetailPage implements OnInit, OnDestroy {
  @ViewChild('tocModal') tocModal!: IonModal;
  @ViewChild('settingsModal') settingsModal!: IonModal;
  @ViewChild('actionSheet') actionSheet!: IonActionSheet;
  @ViewChild('toast') toast!: IonToast;
  @ViewChild('chapterContent') chapterContent!: ElementRef;

  private destroy$ = new Subject<void>();
  private chapterSlug$ = new BehaviorSubject<string>('');

  // Signals for reactive state
  chapter = signal<ContentChapter | null>(null);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  readingProgress = signal<number>(0);
  isBookmarked = signal<boolean>(false);
  tableOfContents = signal<TableOfContentsItem[]>([]);
  toastMessage = signal<string>('');

  readingSettings = signal<ReadingSettings>({
    fontSize: 16,
    fontFamily: 'Inter',
    theme: 'light',
    lineHeight: 1.6,
    textAlign: 'left'
  });

  actionSheetButtons = [
    {
      text: 'Share Chapter',
      icon: 'share-outline',
      handler: () => this.shareChapter()
    },
    {
      text: 'Copy Link',
      icon: 'copy-outline',
      handler: () => this.copyChapterLink()
    },
    {
      text: 'Mark as Complete',
      icon: 'checkmark-circle-outline',
      handler: () => this.markComplete()
    },
    {
      text: 'Take Notes',
      icon: 'text-outline',
      handler: () => this.openNotes()
    },
    {
      text: 'Cancel',
      icon: 'close',
      role: 'cancel'
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private contentService: ContentService
  ) {
    addIcons({ 
      bookmarkOutline, bookmark, shareOutline, copyOutline,
      arrowUpCircleOutline, arrowDownCircleOutline, listOutline,
      timeOutline, checkmarkCircleOutline, clipboardOutline,
      searchOutline, textOutline, colorPaletteOutline, settingsOutline
    });

    this.loadReadingSettings();
  }

  ngOnInit() {
    // Get chapter slug from route
    this.route.params.pipe(
      map(params => params['slug']),
      tap(slug => {
        this.chapterSlug$.next(slug);
        this.isLoading.set(true);
        this.error.set(null);
      }),
      switchMap(slug => this.contentService.getChapter(slug)),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (chapter) => {
        if (chapter) {
          this.chapter.set(chapter);
          this.generateTableOfContents(chapter);
          this.checkBookmarkStatus(chapter.id);
          this.loadProgress(chapter.id);
        } else {
          this.error.set('Chapter not found');
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load chapter');
        this.isLoading.set(false);
        console.error('Error loading chapter:', err);
      }
    });

    // Track reading progress
    this.setupProgressTracking();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.saveReadingSettings();
  }

  private setupProgressTracking() {
    // Implement scroll-based progress tracking
    let scrollTimeout: any;
    
    const trackProgress = () => {
      if (this.chapterContent?.nativeElement) {
        const element = this.chapterContent.nativeElement;
        const scrollTop = element.scrollTop;
        const scrollHeight = element.scrollHeight - element.clientHeight;
        const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
        
        this.readingProgress.set(Math.min(100, Math.max(0, progress)));
        
        // Update progress in service (debounced)
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          this.updateProgressInService(progress);
        }, 1000);
      }
    };

    // Add scroll listener (would need actual implementation)
    // This is a simplified version
    setTimeout(() => trackProgress(), 100);
  }

  private updateProgressInService(progress: number) {
    const chapter = this.chapter();
    if (chapter) {
      const userId = 'current-user'; // Would get from auth service
      this.contentService.updateProgress(userId, chapter.id, {
        progress: Math.round(progress),
        lastAccessedAt: new Date(),
        timeSpent: 0 // Would track actual time
      }).subscribe();
    }
  }

  private generateTableOfContents(chapter: ContentChapter) {
    const tocItems: TableOfContentsItem[] = [];
    
    // Add learning objectives
    if (chapter.learningObjectives?.length) {
      tocItems.push({
        id: 'learning-objectives',
        title: 'Learning Objectives',
        level: 0,
        completed: false,
        current: false
      });
    }

    // Add sections
    chapter.sections.forEach((section, index) => {
      if (section.title) {
        tocItems.push({
          id: section.id,
          title: section.title,
          level: 1,
          completed: false,
          current: false
        });
      }
    });

    // Add key takeaways
    if (chapter.keyTakeaways?.length) {
      tocItems.push({
        id: 'key-takeaways',
        title: 'Key Takeaways',
        level: 0,
        completed: false,
        current: false
      });
    }

    // Add exercises
    if (chapter.exercises?.length) {
      tocItems.push({
        id: 'exercises',
        title: 'Practice Exercises',
        level: 0,
        completed: false,
        current: false
      });
    }

    this.tableOfContents.set(tocItems);
  }

  private checkBookmarkStatus(chapterId: string) {
    const userId = 'current-user'; // Would get from auth service
    this.contentService.getUserProgress(userId).pipe(
      map(progress => progress.some(p => p.chapterId === chapterId && p.bookmarked)),
      takeUntil(this.destroy$)
    ).subscribe(bookmarked => {
      this.isBookmarked.set(bookmarked);
    });
  }

  private loadProgress(chapterId: string) {
    const userId = 'current-user'; // Would get from auth service
    this.contentService.getUserProgress(userId).pipe(
      map(progress => progress.find(p => p.chapterId === chapterId)),
      takeUntil(this.destroy$)
    ).subscribe(progress => {
      if (progress) {
        this.readingProgress.set(progress.progress);
      }
    });
  }

  toggleBookmark() {
    const chapter = this.chapter();
    if (chapter) {
      const userId = 'current-user'; // Would get from auth service
      this.contentService.toggleBookmark(userId, chapter.id).subscribe(() => {
        const newState = !this.isBookmarked();
        this.isBookmarked.set(newState);
        this.showToast(newState ? 'Bookmarked!' : 'Bookmark removed');
      });
    }
  }

  openTableOfContents() {
    this.tocModal.present();
  }

  closeToc() {
    this.tocModal.dismiss();
  }

  navigateToSection(sectionId: string) {
    // Scroll to section (simplified implementation)
    this.closeToc();
    this.showToast(`Navigating to ${sectionId}`);
  }

  openSettings() {
    this.settingsModal.present();
  }

  closeSettings() {
    this.settingsModal.dismiss();
    this.saveReadingSettings();
  }

  adjustFontSize(delta: number) {
    const current = this.readingSettings();
    const newSize = Math.max(12, Math.min(24, current.fontSize + delta));
    this.readingSettings.set({ ...current, fontSize: newSize });
  }

  updateTheme(event: any) {
    const current = this.readingSettings();
    this.readingSettings.set({ ...current, theme: event.detail.value });
  }

  updateFontFamily(event: any) {
    const current = this.readingSettings();
    this.readingSettings.set({ ...current, fontFamily: event.detail.value });
  }

  updateLineHeight(event: any) {
    const current = this.readingSettings();
    this.readingSettings.set({ ...current, lineHeight: parseFloat(event.detail.value) });
  }

  openActionSheet() {
    this.actionSheet.present();
  }

  shareChapter() {
    const chapter = this.chapter();
    if (chapter && navigator.share) {
      navigator.share({
        title: chapter.title,
        text: chapter.description,
        url: window.location.href
      });
    } else {
      this.copyChapterLink();
    }
  }

  async copyChapterLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      this.showToast('Link copied to clipboard!');
    } catch (err) {
      this.showToast('Failed to copy link');
    }
  }

  markComplete() {
    const chapter = this.chapter();
    if (chapter) {
      const userId = 'current-user'; // Would get from auth service
      this.contentService.markChapterComplete(userId, chapter.id).subscribe(() => {
        this.showToast('Chapter marked as complete!');
        this.readingProgress.set(100);
      });
    }
  }

  openNotes() {
    this.showToast('Notes feature coming soon!');
  }

  copyToClipboard(content: string) {
    navigator.clipboard.writeText(content).then(() => {
      this.showToast('Code copied to clipboard!');
    }).catch(() => {
      this.showToast('Failed to copy code');
    });
  }

  formatContent(content: string): string {
    // Basic markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  useTemplate(templateId: string) {
    this.router.navigate(['/templates', templateId]);
  }

  startExercise(exerciseId: string) {
    this.showToast('Exercise feature coming soon!');
  }

  getExerciseDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'danger';
      default: return 'medium';
    }
  }

  trackBySection(index: number, section: any): string {
    return section.id;
  }

  retryLoad() {
    const slug = this.chapterSlug$.value;
    if (slug) {
      this.chapterSlug$.next(slug);
    }
  }

  private showToast(message: string) {
    this.toastMessage.set(message);
    this.toast.present();
  }

  private loadReadingSettings() {
    const saved = localStorage.getItem('reading-settings');
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        this.readingSettings.set({ ...this.readingSettings(), ...settings });
      } catch (e) {
        console.warn('Failed to load reading settings');
      }
    }
  }

  private saveReadingSettings() {
    localStorage.setItem('reading-settings', JSON.stringify(this.readingSettings()));
  }
}