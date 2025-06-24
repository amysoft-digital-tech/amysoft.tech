import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of, EMPTY } from 'rxjs';
import { tap, catchError, shareReplay, map } from 'rxjs/operators';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  tags: string[];
  size: number;
}

export interface CacheConfig {
  ttl?: number;
  maxSize?: number;
  tags?: string[];
  persist?: boolean;
}

export interface CacheStats {
  entries: number;
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
}

@Injectable({
  providedIn: 'root'
})
export class ClientCacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private observableCache = new Map<string, Observable<any>>();
  private tagIndex = new Map<string, Set<string>>();
  
  private maxCacheSize = 50 * 1024 * 1024; // 50MB
  private currentCacheSize = 0;
  private stats: CacheStats = {
    entries: 0,
    size: 0,
    hits: 0,
    misses: 0,
    hitRate: 0
  };

  private statsSubject = new BehaviorSubject<CacheStats>(this.stats);

  constructor() {
    this.startCleanupTimer();
    this.loadPersistedCache();
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.updateStats();
      return null;
    }

    if (this.isExpired(entry)) {
      this.delete(key);
      this.stats.misses++;
      this.updateStats();
      return null;
    }

    this.stats.hits++;
    this.updateStats();
    return entry.data;
  }

  set<T>(key: string, data: T, config: CacheConfig = {}): boolean {
    const {
      ttl = 3600000, // 1 hour default
      tags = [],
      persist = false
    } = config;

    const dataSize = this.calculateSize(data);
    
    // Check if adding this entry would exceed max cache size
    if (this.currentCacheSize + dataSize > this.maxCacheSize) {
      this.evictLeastRecentlyUsed(dataSize);
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      tags,
      size: dataSize
    };

    // Remove existing entry if it exists
    if (this.cache.has(key)) {
      this.delete(key);
    }

    this.cache.set(key, entry);
    this.currentCacheSize += dataSize;
    
    // Update tag index
    tags.forEach(tag => {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    });

    // Persist to localStorage if requested
    if (persist) {
      this.persistEntry(key, entry);
    }

    this.updateStats();
    return true;
  }

  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    this.cache.delete(key);
    this.currentCacheSize -= entry.size;

    // Remove from tag index
    entry.tags.forEach(tag => {
      const tagSet = this.tagIndex.get(tag);
      if (tagSet) {
        tagSet.delete(key);
        if (tagSet.size === 0) {
          this.tagIndex.delete(tag);
        }
      }
    });

    // Remove from localStorage
    this.removePersistedEntry(key);
    
    this.updateStats();
    return true;
  }

  invalidateByTag(tag: string): number {
    const keys = this.tagIndex.get(tag);
    if (!keys) {
      return 0;
    }

    let count = 0;
    keys.forEach(key => {
      if (this.delete(key)) {
        count++;
      }
    });

    return count;
  }

  exists(key: string): boolean {
    const entry = this.cache.get(key);
    return entry !== undefined && !this.isExpired(entry);
  }

  clear(): void {
    this.cache.clear();
    this.observableCache.clear();
    this.tagIndex.clear();
    this.currentCacheSize = 0;
    this.clearPersistedCache();
    this.updateStats();
  }

  // Observable caching methods
  getObservable<T>(key: string, factory: () => Observable<T>, config: CacheConfig = {}): Observable<T> {
    // Check memory cache first
    const cached = this.get<T>(key);
    if (cached !== null) {
      return of(cached);
    }

    // Check if observable is already in progress
    if (this.observableCache.has(key)) {
      return this.observableCache.get(key)!;
    }

    // Create new observable and cache it
    const observable = factory().pipe(
      tap(data => {
        this.set(key, data, config);
        this.observableCache.delete(key);
      }),
      catchError(error => {
        this.observableCache.delete(key);
        throw error;
      }),
      shareReplay(1)
    );

    this.observableCache.set(key, observable);
    return observable;
  }

  // Cache key helpers
  static buildKey(prefix: string, ...parts: (string | number)[]): string {
    return `${prefix}:${parts.join(':')}`;
  }

  static userKey(userId: string, suffix: string): string {
    return this.buildKey('user', userId, suffix);
  }

  static listKey(resource: string, page: number, limit: number, filters?: any): string {
    const filterHash = filters ? btoa(JSON.stringify(filters)) : '';
    return this.buildKey('list', resource, page, limit, filterHash);
  }

  static searchKey(query: string, filters?: any): string {
    const filterHash = filters ? btoa(JSON.stringify(filters)) : '';
    return this.buildKey('search', encodeURIComponent(query), filterHash);
  }

  // Cache management
  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private evictLeastRecentlyUsed(requiredSpace: number): void {
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

    let freedSpace = 0;
    for (const [key, entry] of entries) {
      this.delete(key);
      freedSpace += entry.size;
      
      if (freedSpace >= requiredSpace || this.currentCacheSize <= this.maxCacheSize * 0.8) {
        break;
      }
    }
  }

  private calculateSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      // Fallback calculation
      return JSON.stringify(data).length * 2; // Approximate UTF-16 bytes
    }
  }

  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 300000); // Clean up every 5 minutes
  }

  private cleanupExpiredEntries(): void {
    const expiredKeys: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (this.isExpired(entry)) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => this.delete(key));
    
    if (expiredKeys.length > 0) {
      console.log(`Cleaned up ${expiredKeys.length} expired cache entries`);
    }
  }

  private updateStats(): void {
    this.stats = {
      entries: this.cache.size,
      size: this.currentCacheSize,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: this.calculateHitRate()
    };
    
    this.statsSubject.next(this.stats);
  }

  private calculateHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    return total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  // Persistence methods
  private persistEntry(key: string, entry: CacheEntry<any>): void {
    try {
      const persistKey = `cache:${key}`;
      localStorage.setItem(persistKey, JSON.stringify(entry));
    } catch (error) {
      console.warn('Failed to persist cache entry:', error);
    }
  }

  private removePersistedEntry(key: string): void {
    try {
      const persistKey = `cache:${key}`;
      localStorage.removeItem(persistKey);
    } catch (error) {
      console.warn('Failed to remove persisted cache entry:', error);
    }
  }

  private loadPersistedCache(): void {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cache:')) {
          const cacheKey = key.substring(6);
          const data = localStorage.getItem(key);
          
          if (data) {
            const entry: CacheEntry<any> = JSON.parse(data);
            if (!this.isExpired(entry)) {
              this.cache.set(cacheKey, entry);
              this.currentCacheSize += entry.size;
              
              // Rebuild tag index
              entry.tags.forEach(tag => {
                if (!this.tagIndex.has(tag)) {
                  this.tagIndex.set(tag, new Set());
                }
                this.tagIndex.get(tag)!.add(cacheKey);
              });
            } else {
              localStorage.removeItem(key);
            }
          }
        }
      }
      
      this.updateStats();
    } catch (error) {
      console.warn('Failed to load persisted cache:', error);
    }
  }

  private clearPersistedCache(): void {
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cache:')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear persisted cache:', error);
    }
  }

  // Public API for monitoring
  getStats(): Observable<CacheStats> {
    return this.statsSubject.asObservable();
  }

  getCurrentStats(): CacheStats {
    return { ...this.stats };
  }

  getCacheSize(): number {
    return this.currentCacheSize;
  }

  getMaxCacheSize(): number {
    return this.maxCacheSize;
  }

  setMaxCacheSize(size: number): void {
    this.maxCacheSize = size;
    
    if (this.currentCacheSize > this.maxCacheSize) {
      this.evictLeastRecentlyUsed(this.currentCacheSize - this.maxCacheSize);
    }
  }

  exportCache(): any {
    const cacheData: any = {};
    
    this.cache.forEach((entry, key) => {
      cacheData[key] = entry;
    });
    
    return {
      cache: cacheData,
      stats: this.stats,
      timestamp: Date.now()
    };
  }

  importCache(data: any): void {
    if (data.cache) {
      this.clear();
      
      Object.entries(data.cache).forEach(([key, entry]: [string, any]) => {
        if (!this.isExpired(entry)) {
          this.cache.set(key, entry);
          this.currentCacheSize += entry.size;
          
          // Rebuild tag index
          entry.tags.forEach((tag: string) => {
            if (!this.tagIndex.has(tag)) {
              this.tagIndex.set(tag, new Set());
            }
            this.tagIndex.get(tag)!.add(key);
          });
        }
      });
      
      this.updateStats();
    }
  }
}