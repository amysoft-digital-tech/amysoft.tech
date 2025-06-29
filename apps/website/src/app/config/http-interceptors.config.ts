import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { Provider } from '@angular/core';
import { 
  AuthInterceptor, 
  ErrorInterceptor, 
  CacheInterceptor 
} from '@amysoft/shared-data-access';

/**
 * HTTP Interceptor providers in order of execution
 * Order matters - they execute in the order they are provided
 */
export const httpInterceptorProviders: Provider[] = [
  // Cache interceptor - first to check cache before making requests
  {
    provide: HTTP_INTERCEPTORS,
    useClass: CacheInterceptor,
    multi: true
  },
  
  // Auth interceptor - adds auth headers and handles token refresh
  {
    provide: HTTP_INTERCEPTORS,
    useClass: AuthInterceptor,
    multi: true
  },
  
  // Error interceptor - handles errors and retries (should be last)
  {
    provide: HTTP_INTERCEPTORS,
    useClass: ErrorInterceptor,
    multi: true
  }
];