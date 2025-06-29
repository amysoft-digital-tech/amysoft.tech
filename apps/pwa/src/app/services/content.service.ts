import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

export interface ContentChapter {
  id: string;
  number: number;
  title: string;
  subtitle?: string;
  slug: string;
  description: string;
  content: string;
  estimatedReadTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  prerequisites?: string[];
  learningObjectives: string[];
  sections: ContentSection[];
  templates?: PromptTemplate[];
  exercises?: Exercise[];
  keyTakeaways: string[];
  nextChapter?: string;
  previousChapter?: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentSection {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'code' | 'quote' | 'callout' | 'exercise' | 'template';
  metadata?: {
    language?: string;
    framework?: string;
    difficulty?: string;
    category?: string;
  };
}

export interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  template: string;
  variables: TemplateVariable[];
  examples: TemplateExample[];
  tags: string[];
  usageCount: number;
  rating: number;
}

export interface TemplateVariable {
  name: string;
  description: string;
  type: 'text' | 'number' | 'select' | 'textarea';
  options?: string[];
  placeholder?: string;
  required: boolean;
}

export interface TemplateExample {
  title: string;
  scenario: string;
  input: Record<string, any>;
  output: string;
  metrics?: {
    before: string;
    after: string;
    improvement: string;
  };
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  type: 'quiz' | 'practical' | 'reflection' | 'case-study';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  instructions: string[];
  questions?: QuizQuestion[];
  tasks?: string[];
  resources?: string[];
  solution?: string;
  rubric?: string[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank' | 'essay';
  options?: string[];
  correctAnswer?: string | string[];
  explanation?: string;
  points: number;
}

export interface UserProgress {
  userId: string;
  chapterId: string;
  completed: boolean;
  completedAt?: Date;
  timeSpent: number;
  progress: number; // 0-100
  bookmarked: boolean;
  notes: string;
  exercisesCompleted: string[];
  templatesUsed: string[];
  lastAccessedAt: Date;
}

export interface ContentSearchResult {
  id: string;
  type: 'chapter' | 'template' | 'exercise';
  title: string;
  description: string;
  relevanceScore: number;
  chapter?: string;
  highlights: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ContentService {
  private readonly apiUrl = '/api/content';
  private chaptersSubject = new BehaviorSubject<ContentChapter[]>([]);
  private userProgressSubject = new BehaviorSubject<UserProgress[]>([]);
  
  public chapters$ = this.chaptersSubject.asObservable();
  public userProgress$ = this.userProgressSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadFoundationContent();
  }

  // Content Loading
  getAllChapters(): Observable<ContentChapter[]> {
    return this.http.get<ContentChapter[]>(`${this.apiUrl}/chapters`).pipe(
      tap(chapters => this.chaptersSubject.next(chapters)),
      catchError(() => of(this.getOfflineChapters()))
    );
  }

  getChapter(slug: string): Observable<ContentChapter | null> {
    return this.http.get<ContentChapter>(`${this.apiUrl}/chapters/${slug}`).pipe(
      catchError(() => of(this.getOfflineChapter(slug)))
    );
  }

  getChapterByNumber(number: number): Observable<ContentChapter | null> {
    return this.chapters$.pipe(
      map(chapters => chapters.find(ch => ch.number === number) || null)
    );
  }

  // Template Management
  getTemplates(category?: string): Observable<PromptTemplate[]> {
    const url = category ? `${this.apiUrl}/templates?category=${category}` : `${this.apiUrl}/templates`;
    return this.http.get<PromptTemplate[]>(url).pipe(
      catchError(() => of(this.getOfflineTemplates(category)))
    );
  }

  getTemplate(id: string): Observable<PromptTemplate | null> {
    return this.http.get<PromptTemplate>(`${this.apiUrl}/templates/${id}`).pipe(
      catchError(() => of(this.getOfflineTemplate(id)))
    );
  }

  useTemplate(templateId: string, variables: Record<string, any>): Observable<string> {
    return this.http.post<{result: string}>(`${this.apiUrl}/templates/${templateId}/use`, { variables }).pipe(
      map(response => response.result)
    );
  }

  // Progress Tracking
  getUserProgress(userId: string): Observable<UserProgress[]> {
    return this.http.get<UserProgress[]>(`${this.apiUrl}/progress/${userId}`).pipe(
      tap(progress => this.userProgressSubject.next(progress)),
      catchError(() => of(this.getOfflineProgress(userId)))
    );
  }

  updateProgress(userId: string, chapterId: string, progress: Partial<UserProgress>): Observable<UserProgress> {
    return this.http.patch<UserProgress>(`${this.apiUrl}/progress/${userId}/${chapterId}`, progress).pipe(
      tap(updatedProgress => {
        const currentProgress = this.userProgressSubject.value;
        const index = currentProgress.findIndex(p => p.chapterId === chapterId);
        if (index >= 0) {
          currentProgress[index] = updatedProgress;
        } else {
          currentProgress.push(updatedProgress);
        }
        this.userProgressSubject.next([...currentProgress]);
      })
    );
  }

  markChapterComplete(userId: string, chapterId: string): Observable<UserProgress> {
    return this.updateProgress(userId, chapterId, {
      completed: true,
      completedAt: new Date(),
      progress: 100
    });
  }

  // Bookmarking
  toggleBookmark(userId: string, chapterId: string): Observable<UserProgress> {
    const currentProgress = this.userProgressSubject.value;
    const progress = currentProgress.find(p => p.chapterId === chapterId);
    const bookmarked = !progress?.bookmarked;

    return this.updateProgress(userId, chapterId, { bookmarked });
  }

  getBookmarkedChapters(userId: string): Observable<ContentChapter[]> {
    return this.userProgress$.pipe(
      map(progress => {
        const bookmarkedIds = progress.filter(p => p.bookmarked).map(p => p.chapterId);
        return this.chaptersSubject.value.filter(ch => bookmarkedIds.includes(ch.id));
      })
    );
  }

  // Search
  searchContent(query: string, filters?: {
    type?: string[];
    difficulty?: string[];
    tags?: string[];
  }): Observable<ContentSearchResult[]> {
    const params = new URLSearchParams();
    params.append('q', query);
    if (filters?.type) params.append('type', filters.type.join(','));
    if (filters?.difficulty) params.append('difficulty', filters.difficulty.join(','));
    if (filters?.tags) params.append('tags', filters.tags.join(','));

    return this.http.get<ContentSearchResult[]>(`${this.apiUrl}/search?${params}`).pipe(
      catchError(() => of(this.performOfflineSearch(query, filters)))
    );
  }

  // Assessment
  getAssessment(chapterId: string): Observable<Exercise | null> {
    return this.http.get<Exercise>(`${this.apiUrl}/chapters/${chapterId}/assessment`).pipe(
      catchError(() => of(null))
    );
  }

  submitAssessment(userId: string, exerciseId: string, answers: any): Observable<{
    score: number;
    feedback: string;
    passed: boolean;
  }> {
    return this.http.post<any>(`${this.apiUrl}/assessments/${exerciseId}/submit`, {
      userId,
      answers
    });
  }

  // Offline Support
  private loadFoundationContent(): void {
    // Load foundation content if online, fallback to offline
    this.getAllChapters().subscribe();
  }

  private getOfflineChapters(): ContentChapter[] {
    return [
      {
        id: 'ch1-great-ai-betrayal',
        number: 1,
        title: 'The Great AI Betrayal',
        slug: 'great-ai-betrayal',
        description: 'Understanding why AI promises fall short and how to break free from the plateau.',
        content: 'Foundation content chapter 1...',
        estimatedReadTime: 15,
        difficulty: 'beginner',
        tags: ['fundamentals', 'mindset', 'ai-plateau'],
        learningObjectives: [
          'Identify common AI implementation pitfalls',
          'Understand the psychology of AI expectations',
          'Recognize plateau patterns in your organization'
        ],
        sections: [],
        keyTakeaways: [
          'Most AI initiatives fail due to unrealistic expectations',
          'The plateau is a mindset, not a technical limitation',
          'Success requires systematic thinking, not just tools'
        ],
        nextChapter: 'ch2-five-elite-principles',
        published: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15')
      },
      {
        id: 'ch2-five-elite-principles',
        number: 2,
        title: 'Five Elite Principles Framework',
        slug: 'five-elite-principles',
        description: 'The core framework that separates AI leaders from followers.',
        content: 'Foundation content chapter 2...',
        estimatedReadTime: 25,
        difficulty: 'intermediate',
        tags: ['framework', 'principles', 'strategy'],
        prerequisites: ['ch1-great-ai-betrayal'],
        learningObjectives: [
          'Master the Five Elite Principles',
          'Apply the framework to real scenarios',
          'Develop strategic AI thinking'
        ],
        sections: [],
        keyTakeaways: [
          'Elite AI users follow systematic principles',
          'Framework thinking beats ad-hoc approaches',
          'Principles scale across industries and use cases'
        ],
        previousChapter: 'ch1-great-ai-betrayal',
        nextChapter: 'ch3-prompt-mastery',
        published: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15')
      }
      // Additional chapters would follow...
    ];
  }

  private getOfflineChapter(slug: string): ContentChapter | null {
    return this.getOfflineChapters().find(ch => ch.slug === slug) || null;
  }

  private getOfflineTemplates(category?: string): PromptTemplate[] {
    const templates: PromptTemplate[] = [
      {
        id: 'business-strategy-analyzer',
        title: 'Business Strategy Analyzer',
        description: 'Analyze business strategies using AI frameworks',
        category: 'strategy',
        difficulty: 'intermediate',
        template: 'Analyze the following business strategy: {strategy}\n\nConsider these factors: {factors}\n\nProvide insights on: {focus_areas}',
        variables: [
          {
            name: 'strategy',
            description: 'The business strategy to analyze',
            type: 'textarea',
            required: true,
            placeholder: 'Describe the business strategy...'
          },
          {
            name: 'factors',
            description: 'Key factors to consider',
            type: 'text',
            required: true,
            placeholder: 'market conditions, competition, resources...'
          },
          {
            name: 'focus_areas',
            description: 'Specific areas to focus on',
            type: 'select',
            options: ['risks', 'opportunities', 'implementation', 'metrics'],
            required: true
          }
        ],
        examples: [],
        tags: ['business', 'strategy', 'analysis'],
        usageCount: 0,
        rating: 4.5
      }
      // Additional templates...
    ];

    return category ? templates.filter(t => t.category === category) : templates;
  }

  private getOfflineTemplate(id: string): PromptTemplate | null {
    return this.getOfflineTemplates().find(t => t.id === id) || null;
  }

  private getOfflineProgress(userId: string): UserProgress[] {
    // Return cached progress from localStorage or empty array
    const cached = localStorage.getItem(`progress_${userId}`);
    return cached ? JSON.parse(cached) : [];
  }

  private performOfflineSearch(query: string, filters?: any): ContentSearchResult[] {
    const chapters = this.getOfflineChapters();
    const templates = this.getOfflineTemplates();
    
    const results: ContentSearchResult[] = [];
    
    // Search chapters
    chapters.forEach(chapter => {
      if (this.matchesQuery(chapter.title + ' ' + chapter.description, query)) {
        results.push({
          id: chapter.id,
          type: 'chapter',
          title: chapter.title,
          description: chapter.description,
          relevanceScore: this.calculateRelevance(chapter.title + ' ' + chapter.description, query),
          highlights: this.getHighlights(chapter.title + ' ' + chapter.description, query)
        });
      }
    });

    // Search templates
    templates.forEach(template => {
      if (this.matchesQuery(template.title + ' ' + template.description, query)) {
        results.push({
          id: template.id,
          type: 'template',
          title: template.title,
          description: template.description,
          relevanceScore: this.calculateRelevance(template.title + ' ' + template.description, query),
          highlights: this.getHighlights(template.title + ' ' + template.description, query)
        });
      }
    });

    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private matchesQuery(text: string, query: string): boolean {
    return text.toLowerCase().includes(query.toLowerCase());
  }

  private calculateRelevance(text: string, query: string): number {
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    
    if (lowerText.includes(lowerQuery)) {
      return lowerText.indexOf(lowerQuery) === 0 ? 1.0 : 0.8;
    }
    
    const words = lowerQuery.split(' ');
    const matchedWords = words.filter(word => lowerText.includes(word));
    
    return matchedWords.length / words.length;
  }

  private getHighlights(text: string, query: string): string[] {
    const regex = new RegExp(`(${query})`, 'gi');
    const matches = text.match(regex);
    return matches ? matches.slice(0, 3) : [];
  }
}