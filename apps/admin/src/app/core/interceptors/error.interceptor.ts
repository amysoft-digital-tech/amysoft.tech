import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred';

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = error.error.message;
      } else {
        // Server-side error
        switch (error.status) {
          case 401:
            // Unauthorized - redirect to login
            authService.logout();
            router.navigate(['/login']);
            errorMessage = 'Session expired. Please log in again.';
            break;
          case 403:
            // Forbidden - user doesn't have permission
            errorMessage = 'You do not have permission to perform this action.';
            notificationService.showError(errorMessage);
            break;
          case 404:
            errorMessage = 'The requested resource was not found.';
            break;
          case 422:
            // Validation error
            errorMessage = error.error?.message || 'Invalid data provided.';
            break;
          case 429:
            // Rate limiting
            errorMessage = 'Too many requests. Please try again later.';
            break;
          case 500:
            errorMessage = 'A server error occurred. Please try again later.';
            break;
          case 503:
            errorMessage = 'Service is temporarily unavailable. Please try again later.';
            break;
          default:
            errorMessage = error.error?.message || `Error ${error.status}: ${error.statusText}`;
        }
      }

      // Show error notification for non-401 errors (401 is handled by auth service)
      if (error.status !== 401 && error.status !== 403) {
        notificationService.showError(errorMessage);
      }

      // Log error for debugging (in development)
      if (!req.url.includes('/auth/')) {
        console.error('HTTP Error:', {
          url: req.url,
          method: req.method,
          status: error.status,
          message: errorMessage,
          error: error
        });
      }

      return throwError(() => new Error(errorMessage));
    })
  );
};