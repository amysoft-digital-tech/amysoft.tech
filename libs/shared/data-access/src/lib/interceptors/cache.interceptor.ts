import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, share } from 'rxjs/operators';
import { CacheService } from '../services/cache.service';

export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum cache size
  excludePatterns?: RegExp[]; // Patterns to exclude from caching
}

@Injectable()
export class CacheInterceptor implements HttpInterceptor {
  private cacheService = inject(CacheService);
  
  private readonly defaultConfig: CacheConfig = {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 100,
    excludePatterns: [
      /\/auth\//,
      /\/api\/analytics\//,
      /\/api\/leads\//
    ]
  };

  // Store ongoing requests to prevent duplicate API calls
  private ongoingRequests = new Map<string, Observable<HttpEvent<any>>>();

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Only cache GET requests
    if (request.method !== 'GET') {
      return next.handle(request);
    }

    // Check if request should be excluded from caching
    if (this.shouldExcludeFromCache(request)) {
      return next.handle(request);
    }

    const cacheKey = this.generateCacheKey(request);

    // Check if we have a cached response
    const cachedResponse = this.cacheService.get(cacheKey);
    if (cachedResponse) {
      // Return cached response
      return of(new HttpResponse({
        body: cachedResponse,
        status: 200,
        statusText: 'OK (Cached)',
        url: request.url
      }));
    }

    // Check if there's an ongoing request for the same endpoint
    const ongoingRequest = this.ongoingRequests.get(cacheKey);
    if (ongoingRequest) {
      return ongoingRequest;
    }

    // Make the request and cache the response
    const httpRequest = next.handle(request).pipe(
      tap((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse && event.status === 200) {
          // Cache successful responses
          this.cacheService.set(cacheKey, event.body, this.defaultConfig.ttl);
        }
      }),
      share() // Share the observable to prevent multiple subscriptions
    );

    // Store the ongoing request
    this.ongoingRequests.set(cacheKey, httpRequest);

    // Remove from ongoing requests when completed
    httpRequest.subscribe({
      complete: () => this.ongoingRequests.delete(cacheKey),
      error: () => this.ongoingRequests.delete(cacheKey)
    });

    return httpRequest;
  }

  private shouldExcludeFromCache(request: HttpRequest<any>): boolean {
    const url = request.url;
    
    // Exclude patterns
    if (this.defaultConfig.excludePatterns) {
      for (const pattern of this.defaultConfig.excludePatterns) {
        if (pattern.test(url)) {
          return true;
        }
      }
    }

    // Exclude requests with no-cache headers
    if (request.headers.get('Cache-Control') === 'no-cache') {
      return true;
    }

    // Exclude requests with dynamic parameters that indicate real-time data
    if (url.includes('timestamp=') || url.includes('_t=')) {
      return true;
    }

    return false;
  }

  private generateCacheKey(request: HttpRequest<any>): string {
    // Create a unique key based on URL and relevant headers
    const url = request.urlWithParams;
    const method = request.method;
    const authHeader = request.headers.get('Authorization') || '';
    
    // Include user context in cache key for user-specific data
    const userContext = authHeader ? btoa(authHeader).slice(-8) : 'anonymous';
    
    return `${method}:${url}:${userContext}`;
  }
}