import { Injectable } from '@angular/core';

export interface ApiConfiguration {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  uploadTimeout: number;
  downloadTimeout: number;
  version?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiConfig implements ApiConfiguration {
  baseUrl: string;
  timeout: number = 30000; // 30 seconds
  retryAttempts: number = 3;
  uploadTimeout: number = 120000; // 2 minutes
  downloadTimeout: number = 60000; // 1 minute
  version?: string = 'v1';

  constructor() {
    this.baseUrl = this.getBaseUrl();
  }

  private getBaseUrl(): string {
    // Check environment variables first
    if (typeof window !== 'undefined' && (window as any).ENV?.API_BASE_URL) {
      return (window as any).ENV.API_BASE_URL;
    }

    // Default based on current hostname
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:3000';
      }
      
      if (hostname.includes('amysoft.tech')) {
        return 'https://api.amysoft.tech';
      }
    }

    // Fallback
    return 'http://localhost:3000';
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ApiConfiguration>): void {
    Object.assign(this, config);
  }

  /**
   * Get full API endpoint URL
   */
  getEndpointUrl(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${this.baseUrl}${cleanEndpoint}`;
  }

  /**
   * Check if running in development mode
   */
  isDevelopment(): boolean {
    return this.baseUrl.includes('localhost') || this.baseUrl.includes('127.0.0.1');
  }

  /**
   * Check if running in production mode
   */
  isProduction(): boolean {
    return !this.isDevelopment();
  }
}