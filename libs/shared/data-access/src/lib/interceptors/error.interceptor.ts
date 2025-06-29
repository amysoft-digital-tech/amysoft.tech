import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, retryWhen, concatMap, take } from 'rxjs/operators';
import { NotificationService } from '../services/notification.service';
import { AnalyticsService } from '../services/analytics.service';

interface RetryConfig {
  retryAttempts: number;
  retryDelay: number;
  retryCondition?: (error: HttpErrorResponse) => boolean;
}

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private notificationService = inject(NotificationService);
  private analyticsService = inject(AnalyticsService);

  private readonly defaultRetryConfig: RetryConfig = {
    retryAttempts: 3,
    retryDelay: 1000,
    retryCondition: (error: HttpErrorResponse) => {
      // Retry on network errors and 5xx server errors
      return error.status === 0 || (error.status >= 500 && error.status < 600);
    }
  };

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      retryWhen(errors => this.getRetryStrategy(errors, request)),
      catchError((error: HttpErrorResponse) => this.handleError(error, request))
    );
  }

  private getRetryStrategy(errors: Observable<HttpErrorResponse>, request: HttpRequest<any>) {
    return errors.pipe(
      concatMap((error: HttpErrorResponse, index: number) => {
        const retryCondition = this.defaultRetryConfig.retryCondition!;
        const shouldRetry = retryCondition(error) && index < this.defaultRetryConfig.retryAttempts;

        if (shouldRetry) {
          // Log retry attempt
          this.analyticsService.trackEvent('api_retry', {
            attempt: index + 1,
            endpoint: request.url,
            method: request.method,
            errorStatus: error.status,
            errorMessage: error.message
          });

          // Exponential backoff: delay increases with each retry
          const delay = this.defaultRetryConfig.retryDelay * Math.pow(2, index);
          return timer(delay);
        }

        // Don't retry, propagate the error
        return throwError(() => error);
      }),
      take(this.defaultRetryConfig.retryAttempts)
    );
  }

  private handleError(error: HttpErrorResponse, request: HttpRequest<any>): Observable<never> {
    // Track error for analytics
    this.analyticsService.trackEvent('api_error', {
      endpoint: request.url,
      method: request.method,
      statusCode: error.status,
      errorMessage: error.message,
      timestamp: new Date().toISOString()
    });

    // Determine error type and show appropriate user notification
    this.handleUserNotification(error);

    // Transform error for consistent handling
    const transformedError = this.transformError(error);

    return throwError(() => transformedError);
  }

  private handleUserNotification(error: HttpErrorResponse): void {
    // Don't show notifications for certain status codes
    const silentErrors = [401, 403]; // Unauthorized, Forbidden
    if (silentErrors.includes(error.status)) {
      return;
    }

    let message: string;
    let type: 'error' | 'warning' = 'error';

    switch (error.status) {
      case 0:
        message = 'Unable to connect to the server. Please check your internet connection.';
        break;
      case 400:
        message = error.error?.message || 'Invalid request. Please check your input and try again.';
        break;
      case 404:
        message = 'The requested resource was not found.';
        break;
      case 409:
        message = error.error?.message || 'This action conflicts with existing data.';
        type = 'warning';
        break;
      case 422:
        message = error.error?.message || 'Please check your input and try again.';
        type = 'warning';
        break;
      case 429:
        message = 'Too many requests. Please wait a moment and try again.';
        type = 'warning';
        break;
      case 500:
        message = 'A server error occurred. We\'ve been notified and are working to fix it.';
        break;
      case 502:
      case 503:
      case 504:
        message = 'The service is temporarily unavailable. Please try again in a few moments.';
        break;
      default:
        message = 'An unexpected error occurred. Please try again.';
    }

    this.notificationService.show(message, type);
  }

  private transformError(error: HttpErrorResponse): any {
    return {
      status: error.status,
      statusText: error.statusText,
      message: error.error?.message || error.message,
      details: error.error?.details,
      timestamp: new Date().toISOString(),
      url: error.url
    };
  }
}