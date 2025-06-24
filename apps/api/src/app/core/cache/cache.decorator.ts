import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const CACHE_KEY = 'cache:key';
export const CACHE_TTL = 'cache:ttl';
export const CACHE_TAGS = 'cache:tags';
export const CACHE_INVALIDATE = 'cache:invalidate';

export interface CacheConfig {
  key?: string;
  ttl?: number;
  tags?: string[];
  condition?: (result: any, ...args: any[]) => boolean;
}

export function Cache(config: CacheConfig = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    SetMetadata(CACHE_KEY, config.key || `${target.constructor.name}.${propertyKey}`)(target, propertyKey, descriptor);
    SetMetadata(CACHE_TTL, config.ttl || 3600)(target, propertyKey, descriptor);
    SetMetadata(CACHE_TAGS, config.tags || [])(target, propertyKey, descriptor);

    return descriptor;
  };
}

export function CacheEvict(tags: string | string[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const tagsArray = Array.isArray(tags) ? tags : [tags];
    SetMetadata(CACHE_INVALIDATE, tagsArray)(target, propertyKey, descriptor);
    return descriptor;
  };
}

export function CacheKey(keyTemplate: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    SetMetadata(CACHE_KEY, keyTemplate)(target, propertyKey, descriptor);
    return descriptor;
  };
}

export const CacheParam = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return data ? request.params[data] : request.params;
  },
);

// Cache key generation utilities
export class CacheKeyBuilder {
  static userSpecific(userId: string, suffix: string): string {
    return `user:${userId}:${suffix}`;
  }

  static analyticsData(type: string, timeRange: string, filters?: Record<string, any>): string {
    const filterKey = filters ? `:${Object.values(filters).join(':')}` : '';
    return `analytics:${type}:${timeRange}${filterKey}`;
  }

  static contentData(contentType: string, id: string): string {
    return `content:${contentType}:${id}`;
  }

  static listData(resource: string, page: number, limit: number, filters?: Record<string, any>): string {
    const filterKey = filters ? `:${JSON.stringify(filters)}` : '';
    return `list:${resource}:${page}:${limit}${filterKey}`;
  }

  static searchResults(query: string, filters?: Record<string, any>): string {
    const filterKey = filters ? `:${JSON.stringify(filters)}` : '';
    return `search:${encodeURIComponent(query)}${filterKey}`;
  }

  static fromTemplate(template: string, params: Record<string, any>): string {
    let key = template;
    Object.entries(params).forEach(([param, value]) => {
      key = key.replace(new RegExp(`{${param}}`, 'g'), String(value));
    });
    return key;
  }
}

// Cache tags for organized invalidation
export const CacheTags = {
  USERS: 'users',
  USER_PROFILE: 'user-profile',
  CONTENT: 'content',
  CHAPTERS: 'chapters',
  TEMPLATES: 'templates',
  ANALYTICS: 'analytics',
  ANALYTICS_USERS: 'analytics-users',
  ANALYTICS_CONTENT: 'analytics-content',
  ANALYTICS_MARKETING: 'analytics-marketing',
  SETTINGS: 'settings',
  PERMISSIONS: 'permissions',
  AUDIT_LOGS: 'audit-logs'
} as const;

export type CacheTag = typeof CacheTags[keyof typeof CacheTags];