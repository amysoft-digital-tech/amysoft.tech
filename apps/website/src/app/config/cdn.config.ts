export interface CDNConfig {
  enabled: boolean;
  provider: 'cloudflare' | 'cloudfront' | 'fastly';
  baseUrl: string;
  zones: CDNZone[];
  caching: CachingStrategy;
  optimization: OptimizationSettings;
}

export interface CDNZone {
  name: string;
  pattern: string;
  ttl: number;
  staleWhileRevalidate: boolean;
  compression: boolean;
}

export interface CachingStrategy {
  static: CacheRule;
  dynamic: CacheRule;
  api: CacheRule;
  media: CacheRule;
}

export interface CacheRule {
  ttl: number; // Time to live in seconds
  swr: number; // Stale while revalidate in seconds
  vary: string[]; // Vary headers
  bypassCookies?: string[]; // Cookies that bypass cache
}

export interface OptimizationSettings {
  images: ImageOptimization;
  scripts: ScriptOptimization;
  styles: StyleOptimization;
  prefetch: PrefetchStrategy;
}

export interface ImageOptimization {
  formats: string[];
  quality: number;
  lazy: boolean;
  responsive: boolean;
  sizes: ImageSize[];
}

export interface ImageSize {
  width: number;
  suffix: string;
  quality?: number;
}

export interface ScriptOptimization {
  minify: boolean;
  defer: boolean;
  async: boolean;
  bundleSplitting: boolean;
  criticalInline: boolean;
}

export interface StyleOptimization {
  minify: boolean;
  criticalCSS: boolean;
  removeUnused: boolean;
  inlineSmallCSS: boolean;
  inlineThreshold: number; // bytes
}

export interface PrefetchStrategy {
  enabled: boolean;
  dns: string[];
  preconnect: string[];
  prefetch: string[];
  preload: PreloadResource[];
}

export interface PreloadResource {
  href: string;
  as: 'script' | 'style' | 'image' | 'font' | 'document';
  type?: string;
  crossorigin?: 'anonymous' | 'use-credentials';
}

export class CDNConfiguration {
  /**
   * Get production CDN configuration
   */
  static getProductionConfig(): CDNConfig {
    return {
      enabled: true,
      provider: 'cloudflare',
      baseUrl: 'https://cdn.amysoft.tech',
      zones: [
        {
          name: 'static-assets',
          pattern: '/assets/**',
          ttl: 31536000, // 1 year
          staleWhileRevalidate: false,
          compression: true
        },
        {
          name: 'images',
          pattern: '/images/**',
          ttl: 2592000, // 30 days
          staleWhileRevalidate: true,
          compression: true
        },
        {
          name: 'api-responses',
          pattern: '/api/**',
          ttl: 300, // 5 minutes
          staleWhileRevalidate: true,
          compression: true
        },
        {
          name: 'content',
          pattern: '/content/**',
          ttl: 3600, // 1 hour
          staleWhileRevalidate: true,
          compression: true
        }
      ],
      caching: {
        static: {
          ttl: 31536000, // 1 year
          swr: 0,
          vary: ['Accept-Encoding']
        },
        dynamic: {
          ttl: 300, // 5 minutes
          swr: 3600, // 1 hour
          vary: ['Accept-Encoding', 'Authorization', 'Cookie'],
          bypassCookies: ['session', 'auth-token']
        },
        api: {
          ttl: 0, // No cache by default
          swr: 0,
          vary: ['Accept', 'Authorization'],
          bypassCookies: ['*'] // Bypass all cookies
        },
        media: {
          ttl: 2592000, // 30 days
          swr: 86400, // 24 hours
          vary: ['Accept', 'Accept-Encoding']
        }
      },
      optimization: {
        images: {
          formats: ['webp', 'avif', 'jpeg'],
          quality: 85,
          lazy: true,
          responsive: true,
          sizes: [
            { width: 320, suffix: '-sm', quality: 80 },
            { width: 640, suffix: '-md', quality: 85 },
            { width: 1024, suffix: '-lg', quality: 90 },
            { width: 1920, suffix: '-xl', quality: 95 },
            { width: 2560, suffix: '-2xl', quality: 95 }
          ]
        },
        scripts: {
          minify: true,
          defer: true,
          async: false,
          bundleSplitting: true,
          criticalInline: true
        },
        styles: {
          minify: true,
          criticalCSS: true,
          removeUnused: true,
          inlineSmallCSS: true,
          inlineThreshold: 10240 // 10KB
        },
        prefetch: {
          enabled: true,
          dns: [
            'https://api.amysoft.tech',
            'https://cdn.amysoft.tech',
            'https://fonts.googleapis.com',
            'https://js.stripe.com'
          ],
          preconnect: [
            'https://api.amysoft.tech',
            'https://cdn.amysoft.tech',
            'https://fonts.gstatic.com',
            'https://www.google-analytics.com'
          ],
          prefetch: [
            '/assets/fonts/inter-var.woff2',
            '/assets/fonts/jetbrains-mono.woff2'
          ],
          preload: [
            {
              href: '/assets/fonts/inter-var.woff2',
              as: 'font',
              type: 'font/woff2',
              crossorigin: 'anonymous'
            },
            {
              href: '/assets/css/critical.css',
              as: 'style'
            }
          ]
        }
      }
    };
  }

  /**
   * Generate resource hints for HTML head
   */
  static generateResourceHints(config: CDNConfig): string[] {
    const hints: string[] = [];
    const { prefetch } = config.optimization;

    if (!prefetch.enabled) return hints;

    // DNS prefetch
    prefetch.dns.forEach(url => {
      hints.push(`<link rel="dns-prefetch" href="${url}">`);
    });

    // Preconnect
    prefetch.preconnect.forEach(url => {
      hints.push(`<link rel="preconnect" href="${url}" crossorigin>`);
    });

    // Prefetch
    prefetch.prefetch.forEach(url => {
      hints.push(`<link rel="prefetch" href="${url}">`);
    });

    // Preload
    prefetch.preload.forEach(resource => {
      let tag = `<link rel="preload" href="${resource.href}" as="${resource.as}"`;
      if (resource.type) tag += ` type="${resource.type}"`;
      if (resource.crossorigin) tag += ` crossorigin="${resource.crossorigin}"`;
      tag += '>';
      hints.push(tag);
    });

    return hints;
  }

  /**
   * Get cache headers for a specific path
   */
  static getCacheHeaders(path: string, config: CDNConfig): Record<string, string> {
    const headers: Record<string, string> = {};
    
    // Find matching zone
    const zone = config.zones.find(z => 
      new RegExp(z.pattern.replace('**', '.*')).test(path)
    );

    if (!zone) {
      // Default cache headers
      headers['Cache-Control'] = 'public, max-age=300';
      return headers;
    }

    // Build Cache-Control header
    const cacheControl: string[] = ['public'];
    cacheControl.push(`max-age=${zone.ttl}`);
    
    if (zone.staleWhileRevalidate) {
      cacheControl.push(`stale-while-revalidate=${zone.ttl / 10}`);
    }

    headers['Cache-Control'] = cacheControl.join(', ');

    // Add compression hint
    if (zone.compression) {
      headers['Accept-Encoding'] = 'gzip, deflate, br';
    }

    return headers;
  }

  /**
   * Purge CDN cache
   */
  static async purgeCache(patterns: string[], config: CDNConfig): Promise<boolean> {
    switch (config.provider) {
      case 'cloudflare':
        return this.purgeCloudflareCache(patterns, config);
      case 'cloudfront':
        return this.purgeCloudfrontCache(patterns, config);
      case 'fastly':
        return this.purgeFastlyCache(patterns, config);
      default:
        throw new Error(`Unsupported CDN provider: ${config.provider}`);
    }
  }

  private static async purgeCloudflareCache(patterns: string[], config: CDNConfig): Promise<boolean> {
    // Implementation would use Cloudflare API
    console.log('Purging Cloudflare cache for patterns:', patterns);
    return true;
  }

  private static async purgeCloudfrontCache(patterns: string[], config: CDNConfig): Promise<boolean> {
    // Implementation would use AWS CloudFront API
    console.log('Purging CloudFront cache for patterns:', patterns);
    return true;
  }

  private static async purgeFastlyCache(patterns: string[], config: CDNConfig): Promise<boolean> {
    // Implementation would use Fastly API
    console.log('Purging Fastly cache for patterns:', patterns);
    return true;
  }

  /**
   * Get image optimization URL
   */
  static getOptimizedImageUrl(
    originalUrl: string, 
    width: number, 
    format: string, 
    config: CDNConfig
  ): string {
    if (!config.enabled) return originalUrl;

    const params = new URLSearchParams({
      w: width.toString(),
      f: format,
      q: config.optimization.images.quality.toString()
    });

    return `${config.baseUrl}/image?url=${encodeURIComponent(originalUrl)}&${params}`;
  }
}