import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  // Skip adding token for auth endpoints
  if (req.url.includes('/auth/login') || 
      req.url.includes('/auth/refresh') || 
      req.url.includes('/auth/request-password-reset') ||
      req.url.includes('/auth/reset-password')) {
    return next(req);
  }

  const token = localStorage.getItem('admin_token');
  
  if (token) {
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(authReq);
  }

  return next(req);
};