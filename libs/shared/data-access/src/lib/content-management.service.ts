/**
 * Content Management Service
 * Comprehensive service for content creation, editing, publishing, and lifecycle management
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject, combineLatest } from 'rxjs';
import { map, tap, catchError, debounceTime, distinctUntilChanged, shareReplay } from 'rxjs/operators';
import {
  ContentEntity,
  ContentType,
  ContentTemplate,
  ContentCollection,
  WorkflowState,
  ContentVersion,
  ContentAnalytics,
  MediaReference,
  ContentFilter,
  SortingConfiguration,
  ValidationRule,
  AuditEntry
} from '@amysoft/shared-types';

export interface ContentQuery {
  type?: ContentType[];
  status?: string[];
  search?: string;
  tags?: string[];
  categories?: string[];
  author?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  filters?: ContentFilter[];
  sorting?: SortingConfiguration;
  pagination?: {
    page: number;
    limit: number;
  };
}

export interface ContentQueryResult {
  items: ContentEntity[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  facets: QueryFacets;
}

export interface QueryFacets {
  types: FacetCount[];
  statuses: FacetCount[];
  authors: FacetCount[];
  tags: FacetCount[];
  categories: FacetCount[];
}

export interface FacetCount {
  value: string;
  count: number;
  selected: boolean;
}

export interface ContentCreateRequest {
  type: ContentType;
  title: string;
  description?: string;
  templateId?: string;
  parentId?: string;
  metadata?: Partial<ContentEntity['metadata']>;
  initialContent?: string;
}

export interface ContentUpdateRequest {
  title?: string;
  description?: string;
  content?: Partial<ContentEntity['content']>;
  metadata?: Partial<ContentEntity['metadata']>;
  seo?: Partial<ContentEntity['seo']>;
  workflow?: Partial<WorkflowState>;
  versionMessage?: string;
}

export interface ContentPublishRequest {
  publishDate?: string;
  notifications?: NotificationRequest[];
  distribution?: DistributionChannel[];
  seo?: boolean;
  socialMedia?: SocialMediaPost[];
}

export interface NotificationRequest {
  recipients: string[];
  template: string;
  channels: string[];
  schedule?: string;
}

export interface DistributionChannel {
  type: 'rss' | 'newsletter' | 'api' | 'cdn';
  configuration: Record<string, any>;
  enabled: boolean;
}

export interface SocialMediaPost {
  platform: 'twitter' | 'linkedin' | 'facebook';
  content: string;
  schedule?: string;
  hashtags?: string[];
}

export interface ContentBulkOperation {
  action: 'update' | 'delete' | 'publish' | 'archive' | 'tag' | 'categorize';
  contentIds: string[];
  parameters?: Record<string, any>;
  schedule?: string;
}

export interface BulkOperationResult {
  success: number;
  failed: number;
  errors: BulkOperationError[];
  results: BulkOperationItem[];
}

export interface BulkOperationError {
  contentId: string;
  error: string;
  details?: any;
}

export interface BulkOperationItem {
  contentId: string;
  status: 'success' | 'failed' | 'skipped';
  message?: string;
}

export interface AutoSaveState {
  contentId: string;
  content: any;
  timestamp: string;
  userId: string;
  conflicts?: ConflictInfo[];
}

export interface ConflictInfo {
  field: string;
  localValue: any;
  remoteValue: any;
  timestamp: string;
  userId: string;
}

export interface CollaborationEvent {
  type: 'user-joined' | 'user-left' | 'cursor-moved' | 'selection-changed' | 'content-changed';
  userId: string;
  data: any;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContentManagementService {
  private readonly baseUrl = '/api/content';
  
  // State management
  private contentListSubject = new BehaviorSubject<ContentEntity[]>([]);
  private currentContentSubject = new BehaviorSubject<ContentEntity | null>(null);
  private templatesSubject = new BehaviorSubject<ContentTemplate[]>([]);
  private collectionsSubject = new BehaviorSubject<ContentCollection[]>([]);
  private querySubject = new BehaviorSubject<ContentQuery>({});
  private autoSaveSubject = new Subject<AutoSaveState>();
  private collaborationSubject = new Subject<CollaborationEvent>();

  // Public observables
  public readonly contentList$ = this.contentListSubject.asObservable();
  public readonly currentContent$ = this.currentContentSubject.asObservable();
  public readonly templates$ = this.templatesSubject.asObservable();
  public readonly collections$ = this.collectionsSubject.asObservable();
  public readonly autoSave$ = this.autoSaveSubject.asObservable();
  public readonly collaboration$ = this.collaborationSubject.asObservable();

  // Combined observables
  public readonly filteredContent$ = combineLatest([
    this.contentList$,
    this.querySubject.asObservable()
  ]).pipe(
    map(([content, query]) => this.filterContent(content, query)),
    shareReplay(1)
  );

  constructor(private http: HttpClient) {
    this.initializeAutoSave();
    this.initializeCollaboration();
  }

  // Content CRUD Operations
  getContent(query: ContentQuery = {}): Observable<ContentQueryResult> {
    const params = this.buildQueryParams(query);
    
    return this.http.get<ContentQueryResult>(`${this.baseUrl}`, { params }).pipe(
      tap(result => {
        this.contentListSubject.next(result.items);
        this.querySubject.next(query);
      }),
      catchError(this.handleError('getContent'))
    );
  }

  getContentById(id: string, includeVersions = false): Observable<ContentEntity> {
    const params = new HttpParams().set('includeVersions', includeVersions.toString());
    
    return this.http.get<ContentEntity>(`${this.baseUrl}/${id}`, { params }).pipe(
      tap(content => this.currentContentSubject.next(content)),
      catchError(this.handleError('getContentById'))
    );
  }

  createContent(request: ContentCreateRequest): Observable<ContentEntity> {
    return this.http.post<ContentEntity>(`${this.baseUrl}`, request).pipe(
      tap(content => {
        this.addToContentList(content);
        this.currentContentSubject.next(content);
      }),
      catchError(this.handleError('createContent'))
    );
  }

  updateContent(id: string, request: ContentUpdateRequest): Observable<ContentEntity> {
    return this.http.put<ContentEntity>(`${this.baseUrl}/${id}`, request).pipe(
      tap(content => {
        this.updateContentInList(content);
        this.currentContentSubject.next(content);
      }),
      catchError(this.handleError('updateContent'))
    );
  }

  deleteContent(id: string, permanent = false): Observable<void> {
    const params = new HttpParams().set('permanent', permanent.toString());
    
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { params }).pipe(
      tap(() => this.removeFromContentList(id)),
      catchError(this.handleError('deleteContent'))
    );
  }

  duplicateContent(id: string, title?: string): Observable<ContentEntity> {
    const body = { title };
    
    return this.http.post<ContentEntity>(`${this.baseUrl}/${id}/duplicate`, body).pipe(
      tap(content => this.addToContentList(content)),
      catchError(this.handleError('duplicateContent'))
    );
  }

  // Publishing and Workflow
  publishContent(id: string, request: ContentPublishRequest = {}): Observable<ContentEntity> {
    return this.http.post<ContentEntity>(`${this.baseUrl}/${id}/publish`, request).pipe(
      tap(content => {
        this.updateContentInList(content);
        this.currentContentSubject.next(content);
      }),
      catchError(this.handleError('publishContent'))
    );
  }

  unpublishContent(id: string, reason?: string): Observable<ContentEntity> {
    const body = { reason };
    
    return this.http.post<ContentEntity>(`${this.baseUrl}/${id}/unpublish`, body).pipe(
      tap(content => {
        this.updateContentInList(content);
        this.currentContentSubject.next(content);
      }),
      catchError(this.handleError('unpublishContent'))
    );
  }

  scheduleContent(id: string, publishDate: string): Observable<ContentEntity> {
    const body = { publishDate };
    
    return this.http.post<ContentEntity>(`${this.baseUrl}/${id}/schedule`, body).pipe(
      tap(content => {
        this.updateContentInList(content);
        this.currentContentSubject.next(content);
      }),
      catchError(this.handleError('scheduleContent'))
    );
  }

  updateWorkflow(id: string, workflow: Partial<WorkflowState>): Observable<ContentEntity> {
    return this.http.put<ContentEntity>(`${this.baseUrl}/${id}/workflow`, workflow).pipe(
      tap(content => {
        this.updateContentInList(content);
        this.currentContentSubject.next(content);
      }),
      catchError(this.handleError('updateWorkflow'))
    );
  }

  assignContent(id: string, userId: string, role: string): Observable<ContentEntity> {
    const body = { userId, role };
    
    return this.http.post<ContentEntity>(`${this.baseUrl}/${id}/assign`, body).pipe(
      tap(content => {
        this.updateContentInList(content);
        this.currentContentSubject.next(content);
      }),
      catchError(this.handleError('assignContent'))
    );
  }

  addWorkflowComment(id: string, content: string, type: string): Observable<ContentEntity> {
    const body = { content, type };
    
    return this.http.post<ContentEntity>(`${this.baseUrl}/${id}/comments`, body).pipe(
      tap(content => {
        this.updateContentInList(content);
        this.currentContentSubject.next(content);
      }),
      catchError(this.handleError('addWorkflowComment'))
    );
  }

  // Version Control
  getVersionHistory(id: string): Observable<ContentVersion[]> {
    return this.http.get<ContentVersion[]>(`${this.baseUrl}/${id}/versions`).pipe(
      catchError(this.handleError('getVersionHistory'))
    );
  }

  getVersionDiff(id: string, version1: string, version2: string): Observable<any> {
    const params = new HttpParams()
      .set('version1', version1)
      .set('version2', version2);
    
    return this.http.get<any>(`${this.baseUrl}/${id}/diff`, { params }).pipe(
      catchError(this.handleError('getVersionDiff'))
    );
  }

  revertToVersion(id: string, version: string): Observable<ContentEntity> {
    const body = { version };
    
    return this.http.post<ContentEntity>(`${this.baseUrl}/${id}/revert`, body).pipe(
      tap(content => {
        this.updateContentInList(content);
        this.currentContentSubject.next(content);
      }),
      catchError(this.handleError('revertToVersion'))
    );
  }

  createBranch(id: string, branchName: string): Observable<ContentEntity> {
    const body = { branchName };
    
    return this.http.post<ContentEntity>(`${this.baseUrl}/${id}/branch`, body).pipe(
      catchError(this.handleError('createBranch'))
    );
  }

  mergeBranch(id: string, sourceBranch: string, targetBranch: string): Observable<ContentEntity> {
    const body = { sourceBranch, targetBranch };
    
    return this.http.post<ContentEntity>(`${this.baseUrl}/${id}/merge`, body).pipe(
      tap(content => {
        this.updateContentInList(content);
        this.currentContentSubject.next(content);
      }),
      catchError(this.handleError('mergeBranch'))
    );
  }

  // Templates
  getTemplates(category?: string): Observable<ContentTemplate[]> {
    const params = category ? new HttpParams().set('category', category) : new HttpParams();
    
    return this.http.get<ContentTemplate[]>(`${this.baseUrl}/templates`, { params }).pipe(
      tap(templates => this.templatesSubject.next(templates)),
      catchError(this.handleError('getTemplates'))
    );
  }

  getTemplate(id: string): Observable<ContentTemplate> {
    return this.http.get<ContentTemplate>(`${this.baseUrl}/templates/${id}`).pipe(
      catchError(this.handleError('getTemplate'))
    );
  }

  createTemplate(template: Omit<ContentTemplate, 'id' | 'metadata' | 'usage'>): Observable<ContentTemplate> {
    return this.http.post<ContentTemplate>(`${this.baseUrl}/templates`, template).pipe(
      tap(newTemplate => {
        const templates = this.templatesSubject.value;
        this.templatesSubject.next([...templates, newTemplate]);
      }),
      catchError(this.handleError('createTemplate'))
    );
  }

  updateTemplate(id: string, template: Partial<ContentTemplate>): Observable<ContentTemplate> {
    return this.http.put<ContentTemplate>(`${this.baseUrl}/templates/${id}`, template).pipe(
      tap(updatedTemplate => {
        const templates = this.templatesSubject.value;
        const index = templates.findIndex(t => t.id === id);
        if (index !== -1) {
          templates[index] = updatedTemplate;
          this.templatesSubject.next([...templates]);
        }
      }),
      catchError(this.handleError('updateTemplate'))
    );
  }

  deleteTemplate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/templates/${id}`).pipe(
      tap(() => {
        const templates = this.templatesSubject.value.filter(t => t.id !== id);
        this.templatesSubject.next(templates);
      }),
      catchError(this.handleError('deleteTemplate'))
    );
  }

  // Collections
  getCollections(): Observable<ContentCollection[]> {
    return this.http.get<ContentCollection[]>(`${this.baseUrl}/collections`).pipe(
      tap(collections => this.collectionsSubject.next(collections)),
      catchError(this.handleError('getCollections'))
    );
  }

  getCollection(id: string): Observable<ContentCollection> {
    return this.http.get<ContentCollection>(`${this.baseUrl}/collections/${id}`).pipe(
      catchError(this.handleError('getCollection'))
    );
  }

  createCollection(collection: Omit<ContentCollection, 'id' | 'metadata' | 'analytics'>): Observable<ContentCollection> {
    return this.http.post<ContentCollection>(`${this.baseUrl}/collections`, collection).pipe(
      tap(newCollection => {
        const collections = this.collectionsSubject.value;
        this.collectionsSubject.next([...collections, newCollection]);
      }),
      catchError(this.handleError('createCollection'))
    );
  }

  updateCollection(id: string, collection: Partial<ContentCollection>): Observable<ContentCollection> {
    return this.http.put<ContentCollection>(`${this.baseUrl}/collections/${id}`, collection).pipe(
      tap(updatedCollection => {
        const collections = this.collectionsSubject.value;
        const index = collections.findIndex(c => c.id === id);
        if (index !== -1) {
          collections[index] = updatedCollection;
          this.collectionsSubject.next([...collections]);
        }
      }),
      catchError(this.handleError('updateCollection'))
    );
  }

  addToCollection(collectionId: string, contentIds: string[]): Observable<ContentCollection> {
    const body = { contentIds };
    
    return this.http.post<ContentCollection>(`${this.baseUrl}/collections/${collectionId}/items`, body).pipe(
      tap(collection => {
        const collections = this.collectionsSubject.value;
        const index = collections.findIndex(c => c.id === collectionId);
        if (index !== -1) {
          collections[index] = collection;
          this.collectionsSubject.next([...collections]);
        }
      }),
      catchError(this.handleError('addToCollection'))
    );
  }

  removeFromCollection(collectionId: string, contentIds: string[]): Observable<ContentCollection> {
    const body = { contentIds };
    
    return this.http.delete<ContentCollection>(`${this.baseUrl}/collections/${collectionId}/items`, { body }).pipe(
      tap(collection => {
        const collections = this.collectionsSubject.value;
        const index = collections.findIndex(c => c.id === collectionId);
        if (index !== -1) {
          collections[index] = collection;
          this.collectionsSubject.next([...collections]);
        }
      }),
      catchError(this.handleError('removeFromCollection'))
    );
  }

  // Bulk Operations
  executeBulkOperation(operation: ContentBulkOperation): Observable<BulkOperationResult> {
    return this.http.post<BulkOperationResult>(`${this.baseUrl}/bulk`, operation).pipe(
      tap(result => {
        // Refresh content list after bulk operations
        const currentQuery = this.querySubject.value;
        this.getContent(currentQuery).subscribe();
      }),
      catchError(this.handleError('executeBulkOperation'))
    );
  }

  getBulkOperationStatus(operationId: string): Observable<BulkOperationResult> {
    return this.http.get<BulkOperationResult>(`${this.baseUrl}/bulk/${operationId}`).pipe(
      catchError(this.handleError('getBulkOperationStatus'))
    );
  }

  // Media Management
  uploadMedia(file: File, metadata?: Partial<MediaReference>): Observable<MediaReference> {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }
    
    return this.http.post<MediaReference>(`${this.baseUrl}/media`, formData).pipe(
      catchError(this.handleError('uploadMedia'))
    );
  }

  getMediaLibrary(query?: any): Observable<MediaReference[]> {
    const params = this.buildQueryParams(query || {});
    
    return this.http.get<MediaReference[]>(`${this.baseUrl}/media`, { params }).pipe(
      catchError(this.handleError('getMediaLibrary'))
    );
  }

  updateMedia(id: string, metadata: Partial<MediaReference>): Observable<MediaReference> {
    return this.http.put<MediaReference>(`${this.baseUrl}/media/${id}`, metadata).pipe(
      catchError(this.handleError('updateMedia'))
    );
  }

  deleteMedia(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/media/${id}`).pipe(
      catchError(this.handleError('deleteMedia'))
    );
  }

  optimizeMedia(id: string, options?: any): Observable<MediaReference> {
    return this.http.post<MediaReference>(`${this.baseUrl}/media/${id}/optimize`, options || {}).pipe(
      catchError(this.handleError('optimizeMedia'))
    );
  }

  // Analytics
  getContentAnalytics(id: string, period?: string): Observable<ContentAnalytics> {
    const params = period ? new HttpParams().set('period', period) : new HttpParams();
    
    return this.http.get<ContentAnalytics>(`${this.baseUrl}/${id}/analytics`, { params }).pipe(
      catchError(this.handleError('getContentAnalytics'))
    );
  }

  getContentPerformance(query?: any): Observable<any> {
    const params = this.buildQueryParams(query || {});
    
    return this.http.get<any>(`${this.baseUrl}/analytics/performance`, { params }).pipe(
      catchError(this.handleError('getContentPerformance'))
    );
  }

  // Search and Discovery
  searchContent(query: string, filters?: any): Observable<ContentEntity[]> {
    const params = new HttpParams()
      .set('q', query)
      .set('filters', JSON.stringify(filters || {}));
    
    return this.http.get<ContentEntity[]>(`${this.baseUrl}/search`, { params }).pipe(
      catchError(this.handleError('searchContent'))
    );
  }

  getSuggestions(query: string, type?: ContentType): Observable<string[]> {
    let params = new HttpParams().set('q', query);
    if (type) {
      params = params.set('type', type);
    }
    
    return this.http.get<string[]>(`${this.baseUrl}/suggestions`, { params }).pipe(
      catchError(this.handleError('getSuggestions'))
    );
  }

  getRelatedContent(id: string, limit = 10): Observable<ContentEntity[]> {
    const params = new HttpParams().set('limit', limit.toString());
    
    return this.http.get<ContentEntity[]>(`${this.baseUrl}/${id}/related`, { params }).pipe(
      catchError(this.handleError('getRelatedContent'))
    );
  }

  // Validation and Quality Assurance
  validateContent(id: string, rules?: ValidationRule[]): Observable<any> {
    const body = { rules: rules || [] };
    
    return this.http.post<any>(`${this.baseUrl}/${id}/validate`, body).pipe(
      catchError(this.handleError('validateContent'))
    );
  }

  runQualityCheck(id: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/${id}/quality-check`, {}).pipe(
      catchError(this.handleError('runQualityCheck'))
    );
  }

  getContentAudit(id: string): Observable<AuditEntry[]> {
    return this.http.get<AuditEntry[]>(`${this.baseUrl}/${id}/audit`).pipe(
      catchError(this.handleError('getContentAudit'))
    );
  }

  // Auto-save and Collaboration
  private initializeAutoSave(): void {
    this.autoSave$.pipe(
      debounceTime(2000),
      distinctUntilChanged((a, b) => JSON.stringify(a.content) === JSON.stringify(b.content))
    ).subscribe(autoSave => {
      this.saveAutoSave(autoSave).subscribe();
    });
  }

  private initializeCollaboration(): void {
    // Initialize WebSocket connection for real-time collaboration
    // This would typically connect to a WebSocket service
  }

  autoSaveContent(contentId: string, content: any): void {
    const autoSave: AutoSaveState = {
      contentId,
      content,
      timestamp: new Date().toISOString(),
      userId: 'current-user' // Get from auth service
    };
    
    this.autoSaveSubject.next(autoSave);
  }

  private saveAutoSave(autoSave: AutoSaveState): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${autoSave.contentId}/autosave`, autoSave).pipe(
      catchError(this.handleError('saveAutoSave'))
    );
  }

  getAutoSave(contentId: string): Observable<AutoSaveState | null> {
    return this.http.get<AutoSaveState | null>(`${this.baseUrl}/${contentId}/autosave`).pipe(
      catchError(this.handleError('getAutoSave'))
    );
  }

  clearAutoSave(contentId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${contentId}/autosave`).pipe(
      catchError(this.handleError('clearAutoSave'))
    );
  }

  // Helper Methods
  private buildQueryParams(query: any): HttpParams {
    let params = new HttpParams();
    
    Object.keys(query).forEach(key => {
      const value = query[key];
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(item => {
            params = params.append(key, item.toString());
          });
        } else if (typeof value === 'object') {
          params = params.set(key, JSON.stringify(value));
        } else {
          params = params.set(key, value.toString());
        }
      }
    });
    
    return params;
  }

  private filterContent(content: ContentEntity[], query: ContentQuery): ContentEntity[] {
    let filtered = [...content];
    
    if (query.type?.length) {
      filtered = filtered.filter(item => query.type!.includes(item.type));
    }
    
    if (query.status?.length) {
      filtered = filtered.filter(item => query.status!.includes(item.status.current));
    }
    
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower) ||
        item.content.raw.toLowerCase().includes(searchLower)
      );
    }
    
    if (query.tags?.length) {
      filtered = filtered.filter(item => 
        query.tags!.some(tag => item.metadata.tags.includes(tag))
      );
    }
    
    if (query.categories?.length) {
      filtered = filtered.filter(item => 
        query.categories!.some(category => item.metadata.categories.includes(category))
      );
    }
    
    if (query.author) {
      filtered = filtered.filter(item => 
        item.audit.entries.some(entry => 
          entry.action === 'create' && entry.userId === query.author
        )
      );
    }
    
    if (query.dateRange) {
      const start = new Date(query.dateRange.start);
      const end = new Date(query.dateRange.end);
      filtered = filtered.filter(item => {
        const created = new Date(item.created);
        return created >= start && created <= end;
      });
    }
    
    // Apply custom filters
    if (query.filters?.length) {
      query.filters.forEach(filter => {
        filtered = this.applyContentFilter(filtered, filter);
      });
    }
    
    // Apply sorting
    if (query.sorting) {
      filtered = this.sortContent(filtered, query.sorting);
    }
    
    return filtered;
  }

  private applyContentFilter(content: ContentEntity[], filter: ContentFilter): ContentEntity[] {
    if (!filter.enabled) return content;
    
    return content.filter(item => {
      const fieldValue = this.getFieldValue(item, filter.field);
      
      switch (filter.operator) {
        case 'equals':
          return fieldValue === filter.value;
        case 'not-equals':
          return fieldValue !== filter.value;
        case 'contains':
          return String(fieldValue).toLowerCase().includes(String(filter.value).toLowerCase());
        case 'greater-than':
          return Number(fieldValue) > Number(filter.value);
        case 'less-than':
          return Number(fieldValue) < Number(filter.value);
        case 'in':
          return Array.isArray(filter.value) && filter.value.includes(fieldValue);
        case 'not-in':
          return Array.isArray(filter.value) && !filter.value.includes(fieldValue);
        default:
          return true;
      }
    });
  }

  private getFieldValue(item: ContentEntity, path: string): any {
    return path.split('.').reduce((obj, key) => obj?.[key], item);
  }

  private sortContent(content: ContentEntity[], sorting: SortingConfiguration): ContentEntity[] {
    const sorted = [...content].sort((a, b) => {
      const aValue = this.getFieldValue(a, sorting.field);
      const bValue = this.getFieldValue(b, sorting.field);
      
      let comparison = 0;
      
      if (aValue < bValue) comparison = -1;
      else if (aValue > bValue) comparison = 1;
      
      return sorting.direction === 'desc' ? -comparison : comparison;
    });
    
    // Apply secondary sorting if specified
    if (sorting.secondary) {
      return this.sortContent(sorted, sorting.secondary);
    }
    
    return sorted;
  }

  private addToContentList(content: ContentEntity): void {
    const currentList = this.contentListSubject.value;
    this.contentListSubject.next([content, ...currentList]);
  }

  private updateContentInList(content: ContentEntity): void {
    const currentList = this.contentListSubject.value;
    const index = currentList.findIndex(item => item.id === content.id);
    
    if (index !== -1) {
      currentList[index] = content;
      this.contentListSubject.next([...currentList]);
    }
  }

  private removeFromContentList(id: string): void {
    const currentList = this.contentListSubject.value;
    const filtered = currentList.filter(item => item.id !== id);
    this.contentListSubject.next(filtered);
  }

  private handleError<T>(operation = 'operation') {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      
      // Log error to monitoring service
      // this.errorService.log(error, operation);
      
      // Return empty result or rethrow based on operation
      throw error;
    };
  }
}