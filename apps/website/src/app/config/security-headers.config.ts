export interface SecurityHeaders {
  [key: string]: string;
}

export interface CSPDirectives {
  defaultSrc: string[];
  scriptSrc: string[];
  styleSrc: string[];
  imgSrc: string[];
  fontSrc: string[];
  connectSrc: string[];
  mediaSrc: string[];
  objectSrc: string[];
  childSrc: string[];
  frameSrc: string[];
  workerSrc: string[];
  formAction: string[];
  frameAncestors: string[];
  baseUri: string[];
  reportUri?: string;
}

export class SecurityHeadersConfig {
  /**
   * Content Security Policy directives for production
   */
  static getCSPDirectives(): CSPDirectives {
    return {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for Angular
        "'unsafe-eval'", // Required for Angular development
        'https://www.googletagmanager.com',
        'https://www.google-analytics.com',
        'https://js.stripe.com',
        'https://cdn.amysoft.tech'
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for Angular styles
        'https://fonts.googleapis.com',
        'https://cdn.amysoft.tech'
      ],
      imgSrc: [
        "'self'",
        'data:',
        'blob:',
        'https:',
        'https://www.google-analytics.com',
        'https://www.googletagmanager.com',
        'https://cdn.amysoft.tech'
      ],
      fontSrc: [
        "'self'",
        'https://fonts.gstatic.com',
        'https://cdn.amysoft.tech'
      ],
      connectSrc: [
        "'self'",
        'https://api.amysoft.tech',
        'https://www.google-analytics.com',
        'https://analytics.google.com',
        'https://stats.g.doubleclick.net',
        'https://api.stripe.com',
        'https://cdn.amysoft.tech',
        'wss://api.amysoft.tech' // WebSocket connections
      ],
      mediaSrc: [
        "'self'",
        'https://cdn.amysoft.tech'
      ],
      objectSrc: ["'none'"],
      childSrc: [
        "'self'",
        'https://js.stripe.com' // Stripe checkout iframe
      ],
      frameSrc: [
        "'self'",
        'https://js.stripe.com',
        'https://hooks.stripe.com'
      ],
      workerSrc: [
        "'self'",
        'blob:' // Service worker support
      ],
      formAction: [
        "'self'",
        'https://api.amysoft.tech'
      ],
      frameAncestors: ["'self'"],
      baseUri: ["'self'"],
      reportUri: 'https://api.amysoft.tech/v1/csp-report'
    };
  }

  /**
   * Generate CSP header string from directives
   */
  static generateCSPHeader(directives: CSPDirectives): string {
    return Object.entries(directives)
      .filter(([_, values]) => values && values.length > 0)
      .map(([directive, values]) => {
        const kebabCase = directive.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${kebabCase} ${values.join(' ')}`;
      })
      .join('; ');
  }

  /**
   * Get all security headers for production
   */
  static getProductionHeaders(): SecurityHeaders {
    const cspDirectives = this.getCSPDirectives();
    const cspHeader = this.generateCSPHeader(cspDirectives);

    return {
      // Content Security Policy
      'Content-Security-Policy': cspHeader,
      
      // HSTS - Force HTTPS for 1 year
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      
      // Prevent MIME type sniffing
      'X-Content-Type-Options': 'nosniff',
      
      // XSS Protection (legacy browsers)
      'X-XSS-Protection': '1; mode=block',
      
      // Prevent clickjacking
      'X-Frame-Options': 'SAMEORIGIN',
      
      // Referrer Policy
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      
      // Permissions Policy (formerly Feature Policy)
      'Permissions-Policy': 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(self), usb=()',
      
      // Additional security headers
      'X-Permitted-Cross-Domain-Policies': 'none',
      'X-Download-Options': 'noopen',
      'X-DNS-Prefetch-Control': 'on',
      
      // CORS headers (if needed)
      'Access-Control-Allow-Origin': 'https://www.amysoft.tech',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400', // 24 hours
      
      // Cache control for security
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };
  }

  /**
   * Get security headers for static assets
   */
  static getStaticAssetHeaders(): SecurityHeaders {
    return {
      'Cache-Control': 'public, max-age=31536000, immutable', // 1 year for static assets
      'X-Content-Type-Options': 'nosniff',
      'Access-Control-Allow-Origin': '*' // Allow CDN access
    };
  }

  /**
   * Get security headers for API endpoints
   */
  static getAPIHeaders(): SecurityHeaders {
    return {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'no-referrer',
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0'
    };
  }

  /**
   * Validate CSP report
   */
  static validateCSPReport(report: any): boolean {
    return report &&
           report['csp-report'] &&
           report['csp-report']['violated-directive'] &&
           report['csp-report']['blocked-uri'] &&
           report['csp-report']['document-uri'];
  }

  /**
   * Get nonce for inline scripts (if needed)
   */
  static generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, Array.from(array)));
  }

  /**
   * Security headers for development environment
   */
  static getDevelopmentHeaders(): SecurityHeaders {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'no-referrer-when-downgrade'
    };
  }
}