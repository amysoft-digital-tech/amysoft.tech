import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap, finalize } from 'rxjs/operators';
import { AuditService } from '../services/audit.service';

export const auditInterceptor: HttpInterceptorFn = (req, next) => {
  const auditService = inject(AuditService);
  
  // Skip audit logging for certain endpoints
  if (shouldSkipAudit(req.url)) {
    return next(req);
  }

  const startTime = Date.now();
  const requestId = generateRequestId();

  return next(req).pipe(
    tap(response => {
      // Log successful API calls
      if (isAuditableMethod(req.method)) {
        auditService.logApiCall({
          requestId,
          method: req.method,
          url: req.url,
          status: 'success',
          duration: Date.now() - startTime,
          userAgent: navigator.userAgent,
          timestamp: new Date()
        });
      }
    }),
    finalize(() => {
      // This runs whether the request succeeds or fails
      // Additional cleanup or final audit logging can go here
    })
  );
};

function shouldSkipAudit(url: string): boolean {
  const skipPatterns = [
    '/auth/refresh',
    '/notifications',
    '/health',
    '/metrics'
  ];
  
  return skipPatterns.some(pattern => url.includes(pattern));
}

function isAuditableMethod(method: string): boolean {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
}

function generateRequestId(): string {
  return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}