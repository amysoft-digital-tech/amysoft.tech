import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonSearchbar,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonButton, IonIcon, IonBadge, IonItem, IonLabel,
  IonList, IonGrid, IonRow, IonCol, IonChip, IonSegment,
  IonSegmentButton, IonFab, IonFabButton, IonProgressBar,
  IonSpinner, IonInfiniteScroll, IonInfiniteScrollContent,
  IonRefresher, IonRefresherContent, IonModal, IonCheckbox,
  IonAccordion, IonAccordionGroup
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  bookOutline, timeOutline, trendingUpOutline, checkmarkCircleOutline,
  bookmarkOutline, bookmark, filterOutline, searchOutline,
  gridOutline, listOutline, refreshOutline, downloadOutline
} from 'ionicons/icons';
import { ContentService, ContentChapter, ContentTier, UserProgress } from '../../services/content.service';
import { Subject, takeUntil, combineLatest, BehaviorSubject } from 'rxjs';
import { map, debounceTime, distinctUntilChanged, switchMap, startWith } from 'rxjs/operators';

interface ChapterFilter {
  difficulty: string[];
  tags: string[];
  tier: string[];
  completed: boolean | null;
  bookmarked: boolean | null;
}

interface ChapterWithProgress extends ContentChapter {
  userProgress?: UserProgress;
  isBookmarked: boolean;
  isCompleted: boolean;
  progressPercent: number;
}

@Component({
  selector: 'app-chapters',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    IonHeader, IonToolbar, IonTitle, IonContent, IonSearchbar,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonButton, IonIcon, IonBadge, IonItem, IonLabel,
    IonList, IonGrid, IonRow, IonCol, IonChip, IonSegment,
    IonSegmentButton, IonFab, IonFabButton, IonProgressBar,
    IonSpinner, IonInfiniteScroll, IonInfiniteScrollContent,
    IonRefresher, IonRefresherContent, IonModal, IonCheckbox,
    IonAccordion, IonAccordionGroup
  ],
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-title>Chapters</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="toggleView()">
            <ion-icon [name]="viewMode() === 'grid' ? 'list-outline' : 'grid-outline'"></ion-icon>
          </ion-button>
          <ion-button (click)="openFilters()">
            <ion-icon name="filter-outline"></ion-icon>
            <ion-badge *ngIf="hasActiveFilters()" color="danger">{{ activeFilterCount() }}</ion-badge>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Search Bar -->
      <div class="search-container">
        <ion-searchbar
          [(ngModel)]="searchQuery"
          (ionInput)="onSearchInput($event)"
          placeholder="Search chapters..."
          debounce="300">
        </ion-searchbar>
      </div>

      <!-- Progress Overview -->
      <ion-card class="progress-overview">
        <ion-card-content>
          <div class="progress-stats">
            <div class="stat">
              <h3>{{ completedChapters() }}</h3>
              <p>Completed</p>
            </div>
            <div class="stat">
              <h3>{{ totalChapters() }}</h3>
              <p>Total</p>
            </div>
            <div class="stat">
              <h3>{{ overallProgress() }}%</h3>
              <p>Progress</p>
            </div>
          </div>
          <ion-progress-bar [value]="overallProgress() / 100" color="success"></ion-progress-bar>
        </ion-card-content>
      </ion-card>

      <!-- Content Tiers -->
      <ion-accordion-group *ngIf="tiers().length > 0">
        <ion-accordion *ngFor="let tier of tiers()" [value]="tier.id">
          <ion-item slot="header" color="light">
            <ion-label>
              <h3>{{ tier.displayName }}</h3>
              <p>{{ tier.description }}</p>
            </ion-label>
            <ion-chip slot="end" [color]="tier.popular ? 'primary' : 'medium'">
              ${{ tier.price }}
            </ion-chip>
          </ion-item>
          
          <div class="ion-padding" slot="content">
            <div class="tier-features">
              <h4>Features:</h4>
              <ul>
                <li *ngFor="let feature of tier.features">{{ feature }}</li>
              </ul>
            </div>
            
            <div class="tier-chapters">
              <h4>Chapters ({{ getChaptersForTier(tier).length }}):</h4>
              
              <!-- Grid View -->
              <ion-grid *ngIf="viewMode() === 'grid'">
                <ion-row>
                  <ion-col 
                    *ngFor="let chapter of getChaptersForTier(tier)" 
                    size="12" 
                    size-md="6" 
                    size-lg="4">
                    <ion-card 
                      class="chapter-card" 
                      [routerLink]="'/chapters/' + chapter.slug"
                      [class.completed]="chapter.isCompleted">
                      
                      <ion-card-header>
                        <div class="chapter-header">
                          <ion-chip color="primary" size="small">
                            Ch. {{ chapter.number }}
                          </ion-chip>
                          <ion-chip 
                            [color]="getDifficultyColor(chapter.difficulty)" 
                            size="small">
                            {{ chapter.difficulty | titlecase }}
                          </ion-chip>
                        </div>
                        <ion-card-title>{{ chapter.title }}</ion-card-title>
                      </ion-card-header>

                      <ion-card-content>
                        <p class="chapter-description">{{ chapter.description }}</p>
                        
                        <div class="chapter-meta">
                          <div class="meta-item">
                            <ion-icon name="time-outline"></ion-icon>
                            <span>{{ chapter.estimatedReadTime }} min</span>
                          </div>
                          <div class="meta-item">
                            <ion-icon name="trending-up-outline"></ion-icon>
                            <span>{{ chapter.difficulty }}</span>
                          </div>
                        </div>

                        <div class="chapter-tags">
                          <ion-chip 
                            *ngFor="let tag of chapter.tags.slice(0, 3)" 
                            size="small" 
                            color="tertiary">
                            {{ tag }}
                          </ion-chip>
                        </div>

                        <div class="chapter-progress">
                          <ion-progress-bar 
                            [value]="chapter.progressPercent / 100"
                            [color]="chapter.isCompleted ? 'success' : 'primary'">
                          </ion-progress-bar>
                          <span class="progress-text">{{ chapter.progressPercent }}%</span>
                        </div>

                        <div class="chapter-actions">
                          <ion-button 
                            fill="clear" 
                            size="small"
                            (click)="toggleBookmark(chapter, $event)">
                            <ion-icon 
                              [name]="chapter.isBookmarked ? 'bookmark' : 'bookmark-outline'"
                              [color]="chapter.isBookmarked ? 'warning' : 'medium'">
                            </ion-icon>
                          </ion-button>
                          <ion-icon 
                            *ngIf="chapter.isCompleted"
                            name="checkmark-circle"
                            color="success">
                          </ion-icon>
                        </div>
                      </ion-card-content>
                    </ion-card>
                  </ion-col>
                </ion-row>
              </ion-grid>

              <!-- List View -->
              <ion-list *ngIf="viewMode() === 'list'">
                <ion-item 
                  *ngFor="let chapter of getChaptersForTier(tier)"
                  [routerLink]="'/chapters/' + chapter.slug"
                  [class.completed]="chapter.isCompleted">
                  
                  <div slot="start" class="chapter-number">
                    {{ chapter.number }}
                  </div>

                  <ion-label>
                    <h3>{{ chapter.title }}</h3>
                    <p>{{ chapter.description }}</p>
                    <div class="list-meta">
                      <ion-chip size="small" [color]="getDifficultyColor(chapter.difficulty)">
                        {{ chapter.difficulty }}
                      </ion-chip>
                      <span class="time-badge">
                        <ion-icon name="time-outline"></ion-icon>
                        {{ chapter.estimatedReadTime }}m
                      </span>
                    </div>
                  </ion-label>

                  <div slot="end" class="chapter-status">
                    <div class="progress-circle" *ngIf="!chapter.isCompleted">
                      <span>{{ chapter.progressPercent }}%</span>
                    </div>
                    <ion-icon 
                      *ngIf="chapter.isCompleted"
                      name="checkmark-circle"
                      color="success"
                      size="large">
                    </ion-icon>
                    <ion-icon 
                      *ngIf="chapter.isBookmarked"
                      name="bookmark"
                      color="warning">
                    </ion-icon>
                  </div>
                </ion-item>
              </ion-list>
            </div>
          </div>
        </ion-accordion>
      </ion-accordion-group>

      <!-- Loading State -->
      <div *ngIf="isLoading()" class="loading-container">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Loading chapters...</p>
      </div>

      <!-- Empty State -->
      <div *ngIf="!isLoading() && filteredChapters().length === 0" class="empty-state">
        <ion-icon name="book-outline" size="large"></ion-icon>
        <h3>No chapters found</h3>
        <p>Try adjusting your search or filters</p>
        <ion-button (click)="clearFilters()">Clear Filters</ion-button>
      </div>

      <!-- Infinite Scroll -->
      <ion-infinite-scroll 
        *ngIf="hasMoreChapters()" 
        (ionInfinite)="loadMoreChapters($event)">
        <ion-infinite-scroll-content
          loadingSpinner="bubbles"
          loadingText="Loading more chapters...">
        </ion-infinite-scroll-content>
      </ion-infinite-scroll>
    </ion-content>

    <!-- Filter Modal -->
    <ion-modal #filterModal>
      <ng-template>
        <ion-header>
          <ion-toolbar>
            <ion-title>Filter Chapters</ion-title>
            <ion-buttons slot="end">
              <ion-button (click)="closeFilters()">Done</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <div class="filter-content">
            
            <!-- Difficulty Filter -->
            <div class="filter-section">
              <h3>Difficulty</h3>
              <ion-item *ngFor="let difficulty of availableDifficulties()">
                <ion-checkbox 
                  [(ngModel)]="isDifficultySelected(difficulty)"
                  (ionChange)="toggleDifficultyFilter(difficulty)">
                </ion-checkbox>
                <ion-label class="ion-margin-start">{{ difficulty | titlecase }}</ion-label>
              </ion-item>
            </div>

            <!-- Tags Filter -->
            <div class="filter-section">
              <h3>Tags</h3>
              <div class="tag-chips">
                <ion-chip 
                  *ngFor="let tag of availableTags()"
                  [outline]="!isTagSelected(tag)"
                  [color]="isTagSelected(tag) ? 'primary' : 'medium'"
                  (click)="toggleTagFilter(tag)">
                  {{ tag }}
                </ion-chip>
              </div>
            </div>

            <!-- Content Tier Filter -->
            <div class="filter-section">
              <h3>Content Tier</h3>
              <ion-item *ngFor="let tier of tiers()">
                <ion-checkbox 
                  [(ngModel)]="isTierSelected(tier.id)"
                  (ionChange)="toggleTierFilter(tier.id)">
                </ion-checkbox>
                <ion-label class="ion-margin-start">{{ tier.displayName }}</ion-label>
              </ion-item>
            </div>

            <!-- Progress Filter -->
            <div class="filter-section">
              <h3>Progress</h3>
              <ion-item>
                <ion-checkbox 
                  [(ngModel)]="filters().completed === true"
                  (ionChange)="setCompletedFilter($event.detail.checked ? true : null)">
                </ion-checkbox>
                <ion-label class="ion-margin-start">Completed only</ion-label>
              </ion-item>
              <ion-item>
                <ion-checkbox 
                  [(ngModel)]="filters().bookmarked === true"
                  (ionChange)="setBookmarkedFilter($event.detail.checked ? true : null)">
                </ion-checkbox>
                <ion-label class="ion-margin-start">Bookmarked only</ion-label>
              </ion-item>
            </div>

            <!-- Clear Filters -->
            <div class="filter-actions">
              <ion-button expand="block" fill="outline" (click)="clearFilters()">
                Clear All Filters
              </ion-button>
            </div>
          </div>
        </ion-content>
      </ng-template>
    </ion-modal>

    <!-- Floating Action Button -->
    <ion-fab vertical="bottom" horizontal="end" slot="fixed">
      <ion-fab-button (click)="downloadOfflineContent()">
        <ion-icon name="download-outline"></ion-icon>
      </ion-fab-button>
    </ion-fab>
  `,
  styles: [`
    .search-container {
      padding: 1rem;
      padding-bottom: 0;
    }

    .progress-overview {
      margin: 1rem;
    }

    .progress-stats {
      display: flex;
      justify-content: space-around;
      margin-bottom: 1rem;
    }

    .stat {
      text-align: center;
    }

    .stat h3 {
      margin: 0;
      font-size: 2rem;
      font-weight: bold;
      color: var(--ion-color-primary);
    }

    .stat p {
      margin: 0;
      font-size: 0.9rem;
      color: var(--ion-color-medium);
    }

    .tier-features ul {
      list-style: none;
      padding: 0;
    }

    .tier-features li {
      padding: 0.25rem 0;
      position: relative;
      padding-left: 1.5rem;
    }

    .tier-features li::before {
      content: '✓';
      position: absolute;
      left: 0;
      color: var(--ion-color-success);
      font-weight: bold;
    }

    .tier-chapters {
      margin-top: 1rem;
    }

    .chapter-card {
      height: 100%;
      transition: transform 0.2s;
    }

    .chapter-card:hover {
      transform: translateY(-2px);
    }

    .chapter-card.completed {
      border-left: 4px solid var(--ion-color-success);
    }

    .chapter-header {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .chapter-description {
      color: var(--ion-color-medium);
      font-size: 0.9rem;
      margin-bottom: 1rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .chapter-meta {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      font-size: 0.8rem;
      color: var(--ion-color-medium);
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .chapter-tags {
      display: flex;
      gap: 0.25rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }

    .chapter-progress {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .progress-text {
      font-size: 0.8rem;
      color: var(--ion-color-medium);
      min-width: 35px;
    }

    .chapter-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .chapter-number {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--ion-color-primary);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 1.1rem;
    }

    .list-meta {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-top: 0.5rem;
    }

    .time-badge {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      color: var(--ion-color-medium);
      font-size: 0.8rem;
    }

    .chapter-status {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .progress-circle {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--ion-color-light);
      border: 2px solid var(--ion-color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      font-weight: bold;
      color: var(--ion-color-primary);
    }

    .completed ion-item {
      --ion-item-background: var(--ion-color-success-tint);
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1rem;
      text-align: center;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1rem;
      text-align: center;
    }

    .empty-state ion-icon {
      font-size: 4rem;
      color: var(--ion-color-medium);
      margin-bottom: 1rem;
    }

    .filter-content {
      padding: 1rem;
    }

    .filter-section {
      margin-bottom: 2rem;
    }

    .filter-section h3 {
      color: var(--ion-color-primary);
      margin-bottom: 1rem;
    }

    .tag-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .filter-actions {
      margin-top: 2rem;
    }

    @media (min-width: 768px) {
      .progress-overview {
        margin: 1rem 2rem;
      }
    }
  `]
})
export class ChaptersPage implements OnInit, OnDestroy {
  @ViewChild('filterModal') filterModal!: IonModal;

  private destroy$ = new Subject<void>();
  private searchSubject$ = new BehaviorSubject<string>('');

  // Signals for reactive state
  chapters = signal<ChapterWithProgress[]>([]);
  tiers = signal<ContentTier[]>([]);
  filteredChapters = signal<ChapterWithProgress[]>([]);
  isLoading = signal<boolean>(true);
  viewMode = signal<'grid' | 'list'>('grid');
  
  filters = signal<ChapterFilter>({
    difficulty: [],
    tags: [],
    tier: [],
    completed: null,
    bookmarked: null
  });

  // Computed values
  totalChapters = signal<number>(0);
  completedChapters = signal<number>(0);
  overallProgress = signal<number>(0);

  searchQuery = '';

  constructor(private contentService: ContentService) {
    addIcons({ 
      bookOutline, timeOutline, trendingUpOutline, checkmarkCircleOutline,
      bookmarkOutline, bookmark, filterOutline, searchOutline,
      gridOutline, listOutline, refreshOutline, downloadOutline
    });
  }

  ngOnInit() {
    this.loadData();
    this.setupSearch();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData() {
    const userId = 'current-user'; // Would get from auth service

    combineLatest([
      this.contentService.chapters$,
      this.contentService.tiers$,
      this.contentService.getUserProgress(userId),
      this.searchSubject$.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        startWith('')
      )
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(([chapters, tiers, progress, searchQuery]) => {
      // Combine chapters with progress
      const chaptersWithProgress = chapters.map(chapter => {
        const userProgress = progress.find(p => p.chapterId === chapter.id);
        return {
          ...chapter,
          userProgress,
          isBookmarked: userProgress?.bookmarked || false,
          isCompleted: userProgress?.completed || false,
          progressPercent: userProgress?.progress || 0
        } as ChapterWithProgress;
      });

      this.chapters.set(chaptersWithProgress);
      this.tiers.set(tiers);
      this.updateStats(chaptersWithProgress);
      this.applyFilters(chaptersWithProgress, searchQuery);
      this.isLoading.set(false);
    });
  }

  private setupSearch() {
    this.searchSubject$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.applyFilters(this.chapters(), this.searchSubject$.value);
    });
  }

  private updateStats(chapters: ChapterWithProgress[]) {
    const total = chapters.length;
    const completed = chapters.filter(c => c.isCompleted).length;
    const totalProgress = chapters.reduce((sum, c) => sum + c.progressPercent, 0);
    const overallProgress = total > 0 ? Math.round(totalProgress / total) : 0;

    this.totalChapters.set(total);
    this.completedChapters.set(completed);
    this.overallProgress.set(overallProgress);
  }

  private applyFilters(chapters: ChapterWithProgress[], searchQuery: string) {
    let filtered = [...chapters];
    const currentFilters = this.filters();

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(chapter =>
        chapter.title.toLowerCase().includes(query) ||
        chapter.description.toLowerCase().includes(query) ||
        chapter.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Difficulty filter
    if (currentFilters.difficulty.length > 0) {
      filtered = filtered.filter(chapter =>
        currentFilters.difficulty.includes(chapter.difficulty)
      );
    }

    // Tags filter
    if (currentFilters.tags.length > 0) {
      filtered = filtered.filter(chapter =>
        currentFilters.tags.some(tag => chapter.tags.includes(tag))
      );
    }

    // Tier filter
    if (currentFilters.tier.length > 0) {
      filtered = filtered.filter(chapter =>
        currentFilters.tier.includes(chapter.tier?.id || '')
      );
    }

    // Completed filter
    if (currentFilters.completed !== null) {
      filtered = filtered.filter(chapter =>
        chapter.isCompleted === currentFilters.completed
      );
    }

    // Bookmarked filter
    if (currentFilters.bookmarked !== null) {
      filtered = filtered.filter(chapter =>
        chapter.isBookmarked === currentFilters.bookmarked
      );
    }

    this.filteredChapters.set(filtered);
  }

  onSearchInput(event: any) {
    this.searchQuery = event.target.value;
    this.searchSubject$.next(this.searchQuery);
  }

  toggleView() {
    const current = this.viewMode();
    this.viewMode.set(current === 'grid' ? 'list' : 'grid');
  }

  openFilters() {
    this.filterModal.present();
  }

  closeFilters() {
    this.filterModal.dismiss();
  }

  hasActiveFilters(): boolean {
    const filters = this.filters();
    return filters.difficulty.length > 0 ||
           filters.tags.length > 0 ||
           filters.tier.length > 0 ||
           filters.completed !== null ||
           filters.bookmarked !== null;
  }

  activeFilterCount(): number {
    const filters = this.filters();
    let count = 0;
    if (filters.difficulty.length > 0) count++;
    if (filters.tags.length > 0) count++;
    if (filters.tier.length > 0) count++;
    if (filters.completed !== null) count++;
    if (filters.bookmarked !== null) count++;
    return count;
  }

  clearFilters() {
    this.filters.set({
      difficulty: [],
      tags: [],
      tier: [],
      completed: null,
      bookmarked: null
    });
    this.searchQuery = '';
    this.searchSubject$.next('');
    this.applyFilters(this.chapters(), '');
  }

  getChaptersForTier(tier: ContentTier): ChapterWithProgress[] {
    return this.filteredChapters().filter(chapter =>
      tier.chapterAccess.includes(chapter.number)
    );
  }

  getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'danger';
      default: return 'medium';
    }
  }

  toggleBookmark(chapter: ChapterWithProgress, event: Event) {
    event.stopPropagation();
    event.preventDefault();
    
    const userId = 'current-user'; // Would get from auth service
    this.contentService.toggleBookmark(userId, chapter.id).subscribe(() => {
      // Update local state
      const chapters = this.chapters();
      const index = chapters.findIndex(c => c.id === chapter.id);
      if (index >= 0) {
        chapters[index].isBookmarked = !chapters[index].isBookmarked;
        this.chapters.set([...chapters]);
        this.applyFilters(chapters, this.searchSubject$.value);
      }
    });
  }

  handleRefresh(event: any) {
    this.contentService.refreshContent().subscribe(() => {
      event.target.complete();
    });
  }

  hasMoreChapters(): boolean {
    // Implement pagination logic
    return false;
  }

  loadMoreChapters(event: any) {
    // Implement infinite scroll
    setTimeout(() => {
      event.target.complete();
    }, 500);
  }

  downloadOfflineContent() {
    // Implement offline content download
    console.log('Downloading offline content...');
  }

  // Filter helper methods
  availableDifficulties(): string[] {
    const difficulties = new Set(this.chapters().map(c => c.difficulty));
    return Array.from(difficulties);
  }

  availableTags(): string[] {
    const tags = new Set(this.chapters().flatMap(c => c.tags));
    return Array.from(tags);
  }

  isDifficultySelected(difficulty: string): boolean {
    return this.filters().difficulty.includes(difficulty);
  }

  toggleDifficultyFilter(difficulty: string) {
    const current = this.filters();
    const difficulties = current.difficulty.includes(difficulty)
      ? current.difficulty.filter(d => d !== difficulty)
      : [...current.difficulty, difficulty];
    
    this.filters.set({ ...current, difficulty: difficulties });
    this.applyFilters(this.chapters(), this.searchSubject$.value);
  }

  isTagSelected(tag: string): boolean {
    return this.filters().tags.includes(tag);
  }

  toggleTagFilter(tag: string) {
    const current = this.filters();
    const tags = current.tags.includes(tag)
      ? current.tags.filter(t => t !== tag)
      : [...current.tags, tag];
    
    this.filters.set({ ...current, tags });
    this.applyFilters(this.chapters(), this.searchSubject$.value);
  }

  isTierSelected(tierId: string): boolean {
    return this.filters().tier.includes(tierId);
  }

  toggleTierFilter(tierId: string) {
    const current = this.filters();
    const tier = current.tier.includes(tierId)
      ? current.tier.filter(t => t !== tierId)
      : [...current.tier, tierId];
    
    this.filters.set({ ...current, tier });
    this.applyFilters(this.chapters(), this.searchSubject$.value);
  }

  setCompletedFilter(value: boolean | null) {
    const current = this.filters();
    this.filters.set({ ...current, completed: value });
    this.applyFilters(this.chapters(), this.searchSubject$.value);
  }

  setBookmarkedFilter(value: boolean | null) {
    const current = this.filters();
    this.filters.set({ ...current, bookmarked: value });
    this.applyFilters(this.chapters(), this.searchSubject$.value);
  }
}