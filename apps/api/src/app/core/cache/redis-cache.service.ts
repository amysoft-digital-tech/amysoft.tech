import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface CacheOptions {
  ttl?: number;
  compress?: boolean;
  tags?: string[];
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: number;
}

@Injectable()
export class RedisCacheService {
  private readonly logger = new Logger(RedisCacheService.name);
  private redis: Redis;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    hitRate: 0
  };

  constructor(private configService: ConfigService) {
    this.initializeRedis();
  }

  private initializeRedis(): void {
    const redisConfig = {
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
      db: this.configService.get<number>('REDIS_DB', 0),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000
    };

    this.redis = new Redis(redisConfig);

    this.redis.on('connect', () => {
      this.logger.log('Redis connected successfully');
    });

    this.redis.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
    });

    this.redis.on('ready', () => {
      this.logger.log('Redis is ready for operations');
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.redis.get(this.formatKey(key));
      
      if (cached) {
        this.stats.hits++;
        this.updateHitRate();
        return JSON.parse(cached);
      }
      
      this.stats.misses++;
      this.updateHitRate();
      return null;
    } catch (error) {
      this.logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, options: CacheOptions = {}): Promise<boolean> {
    try {
      const { ttl = 3600, compress = false, tags = [] } = options;
      const serializedValue = JSON.stringify(value);
      const formattedKey = this.formatKey(key);

      // Set the main cache entry
      if (ttl > 0) {
        await this.redis.setex(formattedKey, ttl, serializedValue);
      } else {
        await this.redis.set(formattedKey, serializedValue);
      }

      // Handle cache tags for invalidation
      if (tags.length > 0) {
        await this.setTags(formattedKey, tags, ttl);
      }

      this.stats.sets++;
      return true;
    } catch (error) {
      this.logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const formattedKey = this.formatKey(key);
      const result = await this.redis.del(formattedKey);
      
      if (result > 0) {
        this.stats.deletes++;
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  async invalidateByTag(tag: string): Promise<number> {
    try {
      const tagKey = this.formatTagKey(tag);
      const keys = await this.redis.smembers(tagKey);
      
      if (keys.length === 0) {
        return 0;
      }

      // Delete all keys associated with the tag
      const pipeline = this.redis.pipeline();
      keys.forEach(key => pipeline.del(key));
      pipeline.del(tagKey);
      
      const results = await pipeline.exec();
      const deletedCount = results.filter(([err, result]) => !err && result > 0).length;
      
      this.stats.deletes += deletedCount;
      this.logger.log(`Invalidated ${deletedCount} cache entries for tag: ${tag}`);
      
      return deletedCount;
    } catch (error) {
      this.logger.error(`Cache invalidation error for tag ${tag}:`, error);
      return 0;
    }
  }

  async flush(): Promise<boolean> {
    try {
      await this.redis.flushdb();
      this.logger.log('Cache flushed successfully');
      return true;
    } catch (error) {
      this.logger.error('Cache flush error:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(this.formatKey(key));
      return result === 1;
    } catch (error) {
      this.logger.error(`Cache exists check error for key ${key}:`, error);
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.redis.ttl(this.formatKey(key));
    } catch (error) {
      this.logger.error(`Cache TTL check error for key ${key}:`, error);
      return -1;
    }
  }

  async extend(key: string, ttl: number): Promise<boolean> {
    try {
      const result = await this.redis.expire(this.formatKey(key), ttl);
      return result === 1;
    } catch (error) {
      this.logger.error(`Cache extend error for key ${key}:`, error);
      return false;
    }
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const formattedKeys = keys.map(key => this.formatKey(key));
      const values = await this.redis.mget(...formattedKeys);
      
      return values.map(value => {
        if (value) {
          this.stats.hits++;
          return JSON.parse(value);
        }
        this.stats.misses++;
        return null;
      });
    } catch (error) {
      this.logger.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  }

  async mset(entries: Array<{ key: string; value: any; ttl?: number }>): Promise<boolean> {
    try {
      const pipeline = this.redis.pipeline();
      
      entries.forEach(({ key, value, ttl = 3600 }) => {
        const formattedKey = this.formatKey(key);
        const serializedValue = JSON.stringify(value);
        
        if (ttl > 0) {
          pipeline.setex(formattedKey, ttl, serializedValue);
        } else {
          pipeline.set(formattedKey, serializedValue);
        }
      });

      await pipeline.exec();
      this.stats.sets += entries.length;
      return true;
    } catch (error) {
      this.logger.error('Cache mset error:', error);
      return false;
    }
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      hitRate: 0
    };
  }

  async getHealth(): Promise<{ status: string; latency: number; memory: any }> {
    try {
      const start = Date.now();
      await this.redis.ping();
      const latency = Date.now() - start;
      
      const info = await this.redis.info('memory');
      const memoryMatch = info.match(/used_memory_human:(.+)/);
      const memory = memoryMatch ? memoryMatch[1].trim() : 'unknown';

      return {
        status: 'healthy',
        latency,
        memory: { used: memory }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: -1,
        memory: { error: error.message }
      };
    }
  }

  private formatKey(key: string): string {
    const prefix = this.configService.get<string>('CACHE_PREFIX', 'amysoft');
    return `${prefix}:${key}`;
  }

  private formatTagKey(tag: string): string {
    return this.formatKey(`tag:${tag}`);
  }

  private async setTags(key: string, tags: string[], ttl: number): Promise<void> {
    const pipeline = this.redis.pipeline();
    
    tags.forEach(tag => {
      const tagKey = this.formatTagKey(tag);
      pipeline.sadd(tagKey, key);
      if (ttl > 0) {
        pipeline.expire(tagKey, ttl);
      }
    });
    
    await pipeline.exec();
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.logger.log('Redis connection closed');
    }
  }
}