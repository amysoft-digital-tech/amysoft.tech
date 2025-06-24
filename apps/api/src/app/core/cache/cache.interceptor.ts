import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RedisCacheService } from './redis-cache.service';
import { CACHE_KEY, CACHE_TTL, CACHE_TAGS, CACHE_INVALIDATE } from './cache.decorator';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    private readonly cacheService: RedisCacheService,
    private readonly reflector: Reflector
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const cacheKey = this.reflector.get<string>(CACHE_KEY, context.getHandler());
    const cacheTtl = this.reflector.get<number>(CACHE_TTL, context.getHandler());
    const cacheTags = this.reflector.get<string[]>(CACHE_TAGS, context.getHandler());
    const invalidateTags = this.reflector.get<string[]>(CACHE_INVALIDATE, context.getHandler());

    // Handle cache invalidation first
    if (invalidateTags && invalidateTags.length > 0) {
      await this.invalidateCacheTags(invalidateTags);
    }

    // If no cache key is defined, skip caching
    if (!cacheKey) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const finalCacheKey = this.buildCacheKey(cacheKey, request);

    try {
      // Try to get from cache first
      const cachedValue = await this.cacheService.get(finalCacheKey);
      if (cachedValue !== null) {
        this.logger.debug(`Cache hit for key: ${finalCacheKey}`);
        return of(cachedValue);
      }

      this.logger.debug(`Cache miss for key: ${finalCacheKey}`);

      // Execute the original method and cache the result
      return next.handle().pipe(
        tap(async (result) => {
          if (result !== null && result !== undefined) {
            await this.cacheService.set(finalCacheKey, result, {
              ttl: cacheTtl,
              tags: cacheTags
            });
            this.logger.debug(`Cached result for key: ${finalCacheKey}`);
          }
        })
      );
    } catch (error) {
      this.logger.error(`Cache interceptor error for key ${finalCacheKey}:`, error);
      // Continue without caching if there's an error
      return next.handle();
    }
  }

  private buildCacheKey(template: string, request: any): string {
    let key = template;

    // Replace common placeholders
    if (request.params) {
      Object.entries(request.params).forEach(([param, value]) => {
        key = key.replace(new RegExp(`{${param}}`, 'g'), String(value));
      });
    }

    if (request.query) {
      Object.entries(request.query).forEach(([param, value]) => {
        key = key.replace(new RegExp(`{query.${param}}`, 'g'), String(value));
      });
    }

    if (request.user) {
      key = key.replace(/{user\.id}/g, request.user.id);
      key = key.replace(/{user\.role}/g, request.user.role);
    }

    // Add query parameters for list endpoints
    if (request.query && this.isListEndpoint(key)) {
      const queryString = this.buildQueryString(request.query);
      if (queryString) {
        key += `:${queryString}`;
      }
    }

    return key;
  }

  private buildQueryString(query: Record<string, any>): string {
    const relevantParams = ['page', 'limit', 'sort', 'filter', 'search'];
    const queryPairs: string[] = [];

    relevantParams.forEach(param => {
      if (query[param] !== undefined) {
        queryPairs.push(`${param}=${encodeURIComponent(String(query[param]))}`);
      }
    });

    return queryPairs.join('&');
  }

  private isListEndpoint(key: string): boolean {
    return key.includes('list') || key.includes('search') || key.includes('filter');
  }

  private async invalidateCacheTags(tags: string[]): Promise<void> {
    try {
      for (const tag of tags) {
        const count = await this.cacheService.invalidateByTag(tag);
        this.logger.debug(`Invalidated ${count} cache entries for tag: ${tag}`);
      }
    } catch (error) {
      this.logger.error('Cache tag invalidation error:', error);
    }
  }
}