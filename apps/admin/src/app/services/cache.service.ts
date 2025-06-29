import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, timer } from 'rxjs';
import { map, shareReplay, switchMap, tap } from 'rxjs/operators';

export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of items in cache
}

export interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private cache = new Map<string, CacheItem<any>>();
  private readonly defaultConfig: CacheConfig = {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 100
  };

  constructor() {
    // Clean up expired cache items every minute
    timer(0, 60000).subscribe(() => this.cleanupExpiredItems());
  }

  /**
   * Get cached data or execute factory function if cache miss
   */
  get<T>(key: string, factory: () => Observable<T>, config?: Partial<CacheConfig>): Observable<T> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const cached = this.cache.get(key);

    // Check if cached item exists and is not expired
    if (cached && this.isValid(cached)) {
      return of(cached.data);
    }

    // Cache miss or expired - fetch new data
    return factory().pipe(
      tap(data => this.set(key, data, finalConfig)),
      shareReplay(1)
    );
  }

  /**
   * Set data in cache
   */
  set<T>(key: string, data: T, config?: Partial<CacheConfig>): void {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    // Remove oldest items if cache is full
    if (this.cache.size >= finalConfig.maxSize) {
      this.removeOldestItem();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: finalConfig.ttl
    });
  }

  /**
   * Remove item from cache
   */
  remove(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; hitRate: number; memoryUsage: number } {
    const memoryUsage = this.estimateMemoryUsage();
    
    return {
      size: this.cache.size,
      hitRate: this.calculateHitRate(),
      memoryUsage
    };
  }

  /**
   * Invalidate cache items by pattern
   */
  invalidatePattern(pattern: RegExp): void {
    const keysToRemove = Array.from(this.cache.keys()).filter(key => pattern.test(key));
    keysToRemove.forEach(key => this.cache.delete(key));
  }

  private isValid(item: CacheItem<any>): boolean {
    return Date.now() - item.timestamp < item.ttl;
  }

  private cleanupExpiredItems(): void {
    const now = Date.now();
    const expiredKeys = Array.from(this.cache.entries())
      .filter(([_, item]) => now - item.timestamp >= item.ttl)
      .map(([key]) => key);

    expiredKeys.forEach(key => this.cache.delete(key));
  }

  private removeOldestItem(): void {
    let oldestKey = '';
    let oldestTimestamp = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTimestamp) {
        oldestTimestamp = item.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private calculateHitRate(): number {
    // This would need to be tracked over time in a real implementation
    // For now, returning a placeholder
    return 0.85; // 85% hit rate
  }

  private estimateMemoryUsage(): number {
    // Rough estimation of memory usage in bytes
    let totalSize = 0;
    
    for (const [key, item] of this.cache.entries()) {
      totalSize += key.length * 2; // Unicode characters are 2 bytes
      totalSize += JSON.stringify(item.data).length * 2;
      totalSize += 16; // Approximate overhead for timestamp and ttl
    }
    
    return totalSize;
  }
}

/**
 * Browser Storage Cache Service for persistent caching
 */
@Injectable({
  providedIn: 'root'
})
export class StorageCacheService {
  private readonly prefix = 'admin_cache_';
  
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    try {
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl
      };
      
      localStorage.setItem(this.prefix + key, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to set localStorage cache:', error);
    }
  }

  get<T>(key: string): T | null {
    try {
      const stored = localStorage.getItem(this.prefix + key);
      if (!stored) return null;

      const item: CacheItem<T> = JSON.parse(stored);
      
      // Check if expired
      if (Date.now() - item.timestamp >= item.ttl) {
        this.remove(key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.warn('Failed to get localStorage cache:', error);
      return null;
    }
  }

  remove(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }

  clear(): void {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
    keys.forEach(key => localStorage.removeItem(key));
  }

  cleanup(): void {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
    const now = Date.now();
    
    keys.forEach(key => {
      try {
        const stored = localStorage.getItem(key);
        if (!stored) return;

        const item: CacheItem<any> = JSON.parse(stored);
        if (now - item.timestamp >= item.ttl) {
          localStorage.removeItem(key);
        }
      } catch (error) {
        // Remove corrupted entries
        localStorage.removeItem(key);
      }
    });
  }
}