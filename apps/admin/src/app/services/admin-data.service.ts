import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, retry, timeout } from 'rxjs/operators';
import { CacheService } from './cache.service';
import { PerformanceService } from './performance.service';

export interface DashboardMetrics {
  totalUsers: number;
  salesToday: number;
  contentViews: number;
  activeSessions: number;
  userGrowth: {
    daily: number[];
    labels: string[];
  };
  revenueData: {
    monthly: number[];
    labels: string[];
  };
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'moderator';
  active: boolean;
  lastLogin: string;
  createdAt: string;
}

export interface Content {
  id: number;
  title: string;
  slug: string;
  category: string;
  status: 'published' | 'draft' | 'archived';
  author: string;
  createdAt: string;
  updatedAt: string;
  views: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

@Injectable({
  providedIn: 'root'
})
export class AdminDataService {
  private readonly http = inject(HttpClient);
  private readonly cache = inject(CacheService);
  private readonly performance = inject(PerformanceService);
  private readonly baseUrl = '/api/admin';

  /**
   * Get dashboard metrics with caching
   */
  getDashboardMetrics(): Observable<DashboardMetrics> {
    return this.performance.measureAsync('getDashboardMetrics', async () => {
      return this.cache.get(
        'dashboard-metrics',
        () => this.http.get<DashboardMetrics>(`${this.baseUrl}/dashboard`).pipe(
          timeout(5000),
          retry(2),
          catchError(this.handleError)
        ),
        { ttl: 2 * 60 * 1000 } // 2 minutes cache
      ).toPromise();
    }).then(data => of(data)).catch(err => throwError(() => err));
  }

  /**
   * Get users with pagination and caching
   */
  getUsers(params: QueryParams = {}): Observable<PaginatedResponse<User>> {
    const cacheKey = `users-${JSON.stringify(params)}`;
    
    return this.cache.get(
      cacheKey,
      () => {
        const httpParams = this.buildHttpParams(params);
        return this.http.get<PaginatedResponse<User>>(`${this.baseUrl}/users`, { params: httpParams }).pipe(
          timeout(10000),
          retry(1),
          catchError(this.handleError)
        );
      },
      { ttl: 5 * 60 * 1000 } // 5 minutes cache
    );
  }

  /**
   * Get single user by ID
   */
  getUser(id: number): Observable<User> {
    return this.cache.get(
      `user-${id}`,
      () => this.http.get<User>(`${this.baseUrl}/users/${id}`).pipe(
        timeout(5000),
        catchError(this.handleError)
      ),
      { ttl: 10 * 60 * 1000 } // 10 minutes cache
    );
  }

  /**
   * Create new user
   */
  createUser(userData: Partial<User>): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/users`, userData).pipe(
      timeout(10000),
      catchError(this.handleError),
      map(user => {
        // Invalidate users cache
        this.cache.invalidatePattern(/^users-/);
        return user;
      })
    );
  }

  /**
   * Update user
   */
  updateUser(id: number, userData: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/users/${id}`, userData).pipe(
      timeout(10000),
      catchError(this.handleError),
      map(user => {
        // Invalidate related caches
        this.cache.remove(`user-${id}`);
        this.cache.invalidatePattern(/^users-/);
        return user;
      })
    );
  }

  /**
   * Delete user
   */
  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/users/${id}`).pipe(
      timeout(10000),
      catchError(this.handleError),
      map(() => {
        // Invalidate related caches
        this.cache.remove(`user-${id}`);
        this.cache.invalidatePattern(/^users-/);
      })
    );
  }

  /**
   * Get content with pagination and caching
   */
  getContent(params: QueryParams = {}): Observable<PaginatedResponse<Content>> {
    const cacheKey = `content-${JSON.stringify(params)}`;
    
    return this.cache.get(
      cacheKey,
      () => {
        const httpParams = this.buildHttpParams(params);
        return this.http.get<PaginatedResponse<Content>>(`${this.baseUrl}/content`, { params: httpParams }).pipe(
          timeout(10000),
          retry(1),
          catchError(this.handleError)
        );
      },
      { ttl: 3 * 60 * 1000 } // 3 minutes cache
    );
  }

  /**
   * Get analytics data
   */
  getAnalytics(dateRange: { start: string; end: string }, type: string): Observable<any> {
    const cacheKey = `analytics-${type}-${dateRange.start}-${dateRange.end}`;
    
    return this.cache.get(
      cacheKey,
      () => {
        const params = new HttpParams()
          .set('start', dateRange.start)
          .set('end', dateRange.end)
          .set('type', type);
          
        return this.http.get(`${this.baseUrl}/analytics`, { params }).pipe(
          timeout(15000),
          retry(1),
          catchError(this.handleError)
        );
      },
      { ttl: 10 * 60 * 1000 } // 10 minutes cache
    );
  }

  /**
   * Get system settings
   */
  getSettings(): Observable<Record<string, any>> {
    return this.cache.get(
      'system-settings',
      () => this.http.get<Record<string, any>>(`${this.baseUrl}/settings`).pipe(
        timeout(5000),
        catchError(this.handleError)
      ),
      { ttl: 30 * 60 * 1000 } // 30 minutes cache
    );
  }

  /**
   * Update system settings
   */
  updateSettings(settings: Record<string, any>): Observable<Record<string, any>> {
    return this.http.put<Record<string, any>>(`${this.baseUrl}/settings`, settings).pipe(
      timeout(10000),
      catchError(this.handleError),
      map(updatedSettings => {
        // Invalidate settings cache
        this.cache.remove('system-settings');
        return updatedSettings;
      })
    );
  }

  /**
   * Search across multiple entities
   */
  globalSearch(query: string, entities: string[] = ['users', 'content']): Observable<any> {
    if (!query.trim()) {
      return of({ users: [], content: [], total: 0 });
    }

    const cacheKey = `search-${query}-${entities.join(',')}`;
    
    return this.cache.get(
      cacheKey,
      () => {
        const params = new HttpParams()
          .set('q', query)
          .set('entities', entities.join(','));
          
        return this.http.get(`${this.baseUrl}/search`, { params }).pipe(
          timeout(8000),
          catchError(this.handleError)
        );
      },
      { ttl: 2 * 60 * 1000 } // 2 minutes cache
    );
  }

  /**
   * Get real-time notifications
   */
  getNotifications(): Observable<any[]> {
    // Don't cache real-time data
    return this.http.get<any[]>(`${this.baseUrl}/notifications`).pipe(
      timeout(5000),
      catchError(this.handleError)
    );
  }

  /**
   * Bulk operations for better performance
   */
  bulkUpdateUsers(updates: { id: number; data: Partial<User> }[]): Observable<User[]> {
    return this.http.post<User[]>(`${this.baseUrl}/users/bulk-update`, { updates }).pipe(
      timeout(30000), // Longer timeout for bulk operations
      catchError(this.handleError),
      map(users => {
        // Invalidate all user caches
        this.cache.invalidatePattern(/^users?-/);
        return users;
      })
    );
  }

  /**
   * Export data with streaming support
   */
  exportData(type: 'users' | 'content' | 'analytics', format: 'csv' | 'json' | 'xlsx'): Observable<Blob> {
    const params = new HttpParams().set('format', format);
    
    return this.http.get(`${this.baseUrl}/export/${type}`, {
      params,
      responseType: 'blob',
      timeout: 60000 // 1 minute for exports
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Build HTTP params from query object
   */
  private buildHttpParams(params: QueryParams): HttpParams {
    let httpParams = new HttpParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'filters' && typeof value === 'object') {
          // Handle nested filter objects
          Object.entries(value).forEach(([filterKey, filterValue]) => {
            if (filterValue !== undefined && filterValue !== null) {
              httpParams = httpParams.set(`filter[${filterKey}]`, String(filterValue));
            }
          });
        } else {
          httpParams = httpParams.set(key, String(value));
        }
      }
    });
    
    return httpParams;
  }

  /**
   * Handle HTTP errors
   */
  private handleError = (error: any): Observable<never> => {
    console.error('Admin Data Service Error:', error);
    
    // Return user-friendly error message
    let errorMessage = 'An unexpected error occurred';
    
    if (error.status === 0) {
      errorMessage = 'Network connection error';
    } else if (error.status === 401) {
      errorMessage = 'Unauthorized access';
    } else if (error.status === 403) {
      errorMessage = 'Forbidden access';
    } else if (error.status === 404) {
      errorMessage = 'Data not found';
    } else if (error.status === 500) {
      errorMessage = 'Server error';
    } else if (error.name === 'TimeoutError') {
      errorMessage = 'Request timeout';
    }
    
    return throwError(() => new Error(errorMessage));
  };

  /**
   * Preload critical data for performance
   */
  preloadCriticalData(): void {
    // Preload dashboard metrics
    this.getDashboardMetrics().subscribe({
      next: () => console.log('Dashboard metrics preloaded'),
      error: (err) => console.warn('Failed to preload dashboard metrics:', err)
    });

    // Preload first page of users
    this.getUsers({ page: 1, limit: 20 }).subscribe({
      next: () => console.log('User data preloaded'),
      error: (err) => console.warn('Failed to preload user data:', err)
    });

    // Preload system settings
    this.getSettings().subscribe({
      next: () => console.log('Settings preloaded'),
      error: (err) => console.warn('Failed to preload settings:', err)
    });
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): any {
    return this.cache.getStats();
  }
}