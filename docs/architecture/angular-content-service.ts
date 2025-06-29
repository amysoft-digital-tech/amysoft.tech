// src/app/core/services/content.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ContentTier {
  id: string;
  name: string;
  price: number;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  _count?: { chapters: number };
}

export interface Chapter {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  content: string;
  wordCount: number;
  estimatedReadTime: number;
  sortOrder: number;
  isPublished: boolean;
  tier: ContentTier;
  sections?: ChapterSection[];
  tags: Tag[];
  metadata?: ChapterMetadata;
  _count?: {
    sections: number;
    templates: number;
    caseStudies: number;
  };
}

export interface ChapterSection {
  id: string;
  slug: string;
  title: string;
  content: string;
  sortOrder: number;
}

export interface ChapterMetadata {
  completionStatus: string;
  technicalAccuracy: boolean;
  qualityScore?: number;
  lastReviewDate?: Date;
  reviewNotes?: string;
}

export interface PromptTemplate {
  id: string;
  slug: string;
  title: string;
  description?: string;
  template: string;
  category: string;
  difficulty: string;
  usageContext?: string;
  expectedOutcome?: string;
  customizationGuide?: string;
  effectivenessScore?: number;
  usageCount: number;
  successRate?: number;
  variables: TemplateVariable[];
  examples: TemplateExample[];
  tags: Tag[];
  chapter?: { slug: string; title: string };
  isActive: boolean;
}

export interface TemplateVariable {
  id: string;
  name: string;
  description?: string;
  dataType: string;
  isRequired: boolean;
  defaultValue?: string;
  validationRules?: any;
}

export interface TemplateExample {
  id: string;
  title: string;
  description?: string;
  input: any;
  output: string;
}

export interface CaseStudy {
  id: string;
  slug: string;
  title: string;
  description?: string;
  content: string;
  industry?: string;
  companySize?: string;
  beforeMetrics?: any;
  afterMetrics?: any;
  improvementPercentage?: number;
  timeframeWeeks?: number;
  isPublished: boolean;
  tags: Tag[];
  chapter?: { slug: string; title: string };
}

export interface Tag {
  id: string;
  name: string;
  description?: string;
  category?: string;
  color?: string;
}

export interface SearchResults {
  chapters: Partial<Chapter>[];
  templates: Partial<PromptTemplate>[];
  caseStudies: Partial<CaseStudy>[];
}

@Injectable({
  providedIn: 'root'
})
export class ContentService {
  private readonly apiUrl = environment.apiUrl;
  private readonly baseUrl = `${this.apiUrl}/content`;

  // Cache subjects for offline support
  private tiersSubject = new BehaviorSubject<ContentTier[]>([]);
  private chaptersSubject = new BehaviorSubject<Chapter[]>([]);
  private templatesSubject = new BehaviorSubject<PromptTemplate[]>([]);

  public tiers$ = this.tiersSubject.asObservable();
  public chapters$ = this.chaptersSubject.asObservable();
  public templates$ = this.templatesSubject.asObservable();

  constructor(private http: HttpClient) {
    this.initializeCache();
  }

  private initializeCache(): void {
    // Load cached data on service initialization
    this.loadContentTiers().subscribe();
    this.loadChapters().subscribe();
    this.loadPromptTemplates().subscribe();
  }

  // Content Tiers
  loadContentTiers(): Observable<ContentTier[]> {
    return this.http.get<ContentTier[]>(`${this.baseUrl}/tiers`).pipe(
      tap(tiers => this.tiersSubject.next(tiers)),
      catchError(this.handleError<ContentTier[]>('loadContentTiers', []))
    );
  }

  getContentTiers(): Observable<ContentTier[]> {
    return this.tiers$;
  }

  // Chapters
  loadChapters(filters?: { tier?: string; published?: boolean }): Observable<Chapter[]> {
    let params = new HttpParams();
    if (filters?.tier) params = params.set('tier', filters.tier);
    if (filters?.published !== undefined) params = params.set('published', filters.published.toString());

    return this.http.get<Chapter[]>(`${this.baseUrl}/chapters`, { params }).pipe(
      tap(chapters => this.chaptersSubject.next(chapters)),
      catchError(this.handleError<Chapter[]>('loadChapters', []))
    );
  }

  getChapters(tier?: string): Observable<Chapter[]> {
    return this.chapters$.pipe(
      map(chapters => tier ? chapters.filter(c => c.tier.name === tier) : chapters)
    );
  }

  getChapterBySlug(slug: string): Observable<Chapter> {
    return this.http.get<Chapter>(`${this.baseUrl}/chapters/${slug}`).pipe(
      catchError(this.handleError<Chapter>('getChapterBySlug'))
    );
  }

  getChapterSections(slug: string): Observable<ChapterSection[]> {
    return this.http.get<ChapterSection[]>(`${this.baseUrl}/chapters/${slug}/sections`).pipe(
      catchError(this.handleError<ChapterSection[]>('getChapterSections', []))
    );
  }

  // Prompt Templates  
  loadPromptTemplates(filters?: { 
    category?: string; 
    difficulty?: string; 
    chapter?: string; 
  }): Observable<PromptTemplate[]> {
    let params = new HttpParams();
    if (filters?.category) params = params.set('category', filters.category);
    if (filters?.difficulty) params = params.set('difficulty', filters.difficulty);
    if (filters?.chapter) params = params.set('chapter', filters.chapter);

    return this.http.get<PromptTemplate[]>(`${this.baseUrl}/templates`, { params }).pipe(
      tap(templates => this.templatesSubject.next(templates)),
      catchError(this.handleError<PromptTemplate[]>('loadPromptTemplates', []))
    );
  }

  getPromptTemplates(category?: string): Observable<PromptTemplate[]> {
    return this.templates$.pipe(
      map(templates => category ? templates.filter(t => t.category === category) : templates)
    );
  }

  getPromptTemplateBySlug(slug: string): Observable<PromptTemplate> {
    return this.http.get<PromptTemplate>(`${this.baseUrl}/templates/${slug}`).pipe(
      catchError(this.handleError<PromptTemplate>('getPromptTemplateBySlug'))
    );
  }

  // Case Studies
  getCaseStudies(filters?: { industry?: string; companySize?: string }): Observable<CaseStudy[]> {
    let params = new HttpParams();
    if (filters?.industry) params = params.set('industry', filters.industry);
    if (filters?.companySize) params = params.set('companySize', filters.companySize);

    return this.http.get<CaseStudy[]>(`${this.baseUrl}/case-studies`, { params }).pipe(
      catchError(this.handleError<CaseStudy[]>('getCaseStudies', []))
    );
  }

  // Search
  searchContent(query: string, type?: string): Observable<SearchResults> {
    let params = new HttpParams().set('q', query);
    if (type) params = params.set('type', type);

    return this.http.get<SearchResults>(`${this.baseUrl}/search`, { params }).pipe(
      catchError(this.handleError<SearchResults>('searchContent', { chapters: [], templates: [], caseStudies: [] }))
    );
  }

  // Utility methods
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      return of(result as T);
    };
  }
}

// src/app/pages/chapter/chapter.page.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingController, AlertController, ToastController } from '@ionic/angular';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { ContentService, Chapter, ChapterSection } from '../../core/services/content.service';

@Component({
  selector: 'app-chapter',
  templateUrl: './chapter.page.html',
  styleUrls: ['./chapter.page.scss'],
})
export class ChapterPage implements OnInit, OnDestroy {
  chapter: Chapter | null = null;
  sections: ChapterSection[] = [];
  loading = false;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private contentService: ContentService,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.route.params.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      if (params['slug']) {
        this.loadChapter(params['slug']);
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async loadChapter(slug: string) {
    const loading = await this.loadingController.create({
      message: 'Loading chapter...',
      spinner: 'circular'
    });
    await loading.present();

    this.loading = true;

    this.contentService.getChapterBySlug(slug).pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.loading = false;
        loading.dismiss();
      })
    ).subscribe({
      next: (chapter) => {
        this.chapter = chapter;
        this.sections = chapter.sections || [];
      },
      error: (error) => {
        console.error('Error loading chapter:', error);
        this.showError('Failed to load chapter. Please try again.');
      }
    });
  }

  private async showError(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  }

  navigateToSection(sectionSlug: string) {
    const element = document.getElementById(sectionSlug);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  async copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      const toast = await this.toastController.create({
        message: 'Copied to clipboard!',
        duration: 2000,
        position: 'bottom',
        color: 'success'
      });
      await toast.present();
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }

  getProgressPercentage(): number {
    if (!this.chapter || !this.sections.length) return 0;
    
    const currentSectionIndex = 0; // You would track this based on scroll position
    return (currentSectionIndex / this.sections.length) * 100;
  }
}