import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout, retry } from 'rxjs/operators';
import { ApiConfig } from '../config/api.config';
import { ApiResponse, ApiError, QueryParams } from '../types/api.types';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfig);

  /**
   * Generic GET request
   */
  get<T>(endpoint: string, params?: QueryParams): Observable<T> {
    const httpParams = this.buildHttpParams(params);
    
    return this.http.get<T>(`${this.config.baseUrl}${endpoint}`, {
      params: httpParams,
      headers: this.getHeaders()
    }).pipe(
      timeout(this.config.timeout),
      retry(this.config.retryAttempts),
      catchError(this.handleError)
    );
  }

  /**
   * Generic POST request
   */
  post<T>(endpoint: string, data: any, options?: { timeout?: number }): Observable<T> {
    return this.http.post<T>(`${this.config.baseUrl}${endpoint}`, data, {
      headers: this.getHeaders()
    }).pipe(
      timeout(options?.timeout || this.config.timeout),
      catchError(this.handleError)
    );
  }

  /**
   * Generic PUT request
   */
  put<T>(endpoint: string, data: any): Observable<T> {
    return this.http.put<T>(`${this.config.baseUrl}${endpoint}`, data, {
      headers: this.getHeaders()
    }).pipe(
      timeout(this.config.timeout),
      catchError(this.handleError)
    );
  }

  /**
   * Generic PATCH request
   */
  patch<T>(endpoint: string, data: any): Observable<T> {
    return this.http.patch<T>(`${this.config.baseUrl}${endpoint}`, data, {
      headers: this.getHeaders()
    }).pipe(
      timeout(this.config.timeout),
      catchError(this.handleError)
    );
  }

  /**
   * Generic DELETE request
   */
  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.config.baseUrl}${endpoint}`, {
      headers: this.getHeaders()
    }).pipe(
      timeout(this.config.timeout),
      catchError(this.handleError)
    );
  }

  /**
   * Upload file
   */
  upload<T>(endpoint: string, file: File, additionalData?: any): Observable<T> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }

    return this.http.post<T>(`${this.config.baseUrl}${endpoint}`, formData, {
      headers: this.getUploadHeaders()
    }).pipe(
      timeout(this.config.uploadTimeout),
      catchError(this.handleError)
    );
  }

  /**
   * Download file
   */
  download(endpoint: string, filename?: string): Observable<Blob> {
    return this.http.get(`${this.config.baseUrl}${endpoint}`, {
      responseType: 'blob',
      headers: this.getHeaders()
    }).pipe(
      timeout(this.config.downloadTimeout),
      catchError(this.handleError)
    );
  }

  /**
   * Paginated GET request
   */
  getPaginated<T>(
    endpoint: string, 
    page: number = 1, 
    limit: number = 10, 
    params?: QueryParams
  ): Observable<ApiResponse<T[]>> {
    const paginationParams = {
      page: page.toString(),
      limit: limit.toString(),
      ...params
    };

    return this.get<ApiResponse<T[]>>(endpoint, paginationParams);
  }

  /**
   * Build HTTP parameters from object
   */
  private buildHttpParams(params?: QueryParams): HttpParams {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key];
        if (value !== null && value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(item => {
              httpParams = httpParams.append(key, item.toString());
            });
          } else {
            httpParams = httpParams.set(key, value.toString());
          }
        }
      });
    }
    
    return httpParams;
  }

  /**
   * Get standard headers
   */
  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    // Add authorization header if token exists
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    // Add API version header
    if (this.config.version) {
      headers = headers.set('API-Version', this.config.version);
    }

    return headers;
  }

  /**
   * Get headers for file upload
   */
  private getUploadHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Accept': 'application/json'
      // Don't set Content-Type for FormData, let browser set it with boundary
    });

    // Add authorization header if token exists
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  /**
   * Handle HTTP errors
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let apiError: ApiError;

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      apiError = {
        code: 'CLIENT_ERROR',
        message: error.error.message,
        details: 'A client-side error occurred'
      };
    } else {
      // Server-side error
      apiError = {
        code: error.status.toString(),
        message: error.error?.message || error.message,
        details: error.error?.details || 'A server error occurred',
        statusCode: error.status
      };
    }

    console.error('API Error:', apiError);
    return throwError(() => apiError);
  };
}