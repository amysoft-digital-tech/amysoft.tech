import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError, timer } from 'rxjs';
import { map, catchError, tap, switchMap, take } from 'rxjs/operators';

export interface User {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  permissions: Permission[];
  lastLogin: Date;
  mfaEnabled: boolean;
  avatar?: string;
  preferences: UserPreferences;
}

export enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  CONTENT_ADMIN = 'content_admin',
  SUPPORT_ADMIN = 'support_admin',
  ANALYTICS_ADMIN = 'analytics_admin'
}

export interface Permission {
  resource: string;
  actions: PermissionAction[];
  conditions?: PermissionCondition[];
}

export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  APPROVE = 'approve',
  PUBLISH = 'publish',
  EXPORT = 'export'
}

export interface PermissionCondition {
  field: string;
  operator: 'equals' | 'contains' | 'in' | 'greater_than' | 'less_than';
  value: any;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  notifications: NotificationPreferences;
  dashboard: DashboardPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  browser: boolean;
  mobile: boolean;
  categories: {
    system: boolean;
    content: boolean;
    users: boolean;
    security: boolean;
  };
}

export interface DashboardPreferences {
  defaultView: string;
  widgets: string[];
  refreshInterval: number;
}

export interface LoginRequest {
  email: string;
  password: string;
  mfaCode?: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  mfaRequired?: boolean;
  mfaQrCode?: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = '/api/admin/auth';
  private readonly TOKEN_KEY = 'admin_token';
  private readonly REFRESH_TOKEN_KEY = 'admin_refresh_token';
  private readonly USER_KEY = 'admin_user';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private tokenRefreshTimer: any;

  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const token = this.getStoredToken();
    const user = this.getStoredUser();
    
    if (token && user && !this.isTokenExpired(token)) {
      this.currentUserSubject.next(user);
      this.scheduleTokenRefresh(token);
    } else {
      this.clearAuth();
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, credentials)
      .pipe(
        tap(response => {
          if (!response.mfaRequired) {
            this.handleAuthSuccess(response);
          }
        }),
        catchError(this.handleError)
      );
  }

  verifyMfa(email: string, mfaCode: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/verify-mfa`, { email, mfaCode })
      .pipe(
        tap(response => this.handleAuthSuccess(response)),
        catchError(this.handleError)
      );
  }

  setupMfa(): Observable<{ qrCode: string; secret: string }> {
    return this.http.post<{ qrCode: string; secret: string }>(`${this.API_URL}/setup-mfa`, {})
      .pipe(catchError(this.handleError));
  }

  confirmMfaSetup(mfaCode: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.API_URL}/confirm-mfa`, { mfaCode })
      .pipe(catchError(this.handleError));
  }

  refreshToken(): Observable<RefreshTokenResponse> {
    const refreshToken = this.getStoredRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<RefreshTokenResponse>(`${this.API_URL}/refresh`, { refreshToken })
      .pipe(
        tap(response => {
          this.storeTokens(response.accessToken, response.refreshToken);
          this.scheduleTokenRefresh(response.accessToken);
        }),
        catchError(error => {
          this.logout();
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    this.http.post(`${this.API_URL}/logout`, { 
      refreshToken: this.getStoredRefreshToken() 
    }).subscribe({
      complete: () => this.handleLogout(),
      error: () => this.handleLogout()
    });
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    const token = this.getStoredToken();
    return !!token && !this.isTokenExpired(token);
  }

  hasRole(role: AdminRole): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  hasAnyRole(roles: AdminRole[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }

  hasPermission(resource: string, action: PermissionAction, context?: any): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    // Super admin has all permissions
    if (user.role === AdminRole.SUPER_ADMIN) return true;

    const permission = user.permissions.find(p => p.resource === resource);
    if (!permission) return false;

    if (!permission.actions.includes(action)) return false;

    // Check conditions if provided
    if (permission.conditions && context) {
      return permission.conditions.every(condition => 
        this.evaluateCondition(condition, context)
      );
    }

    return true;
  }

  changePassword(currentPassword: string, newPassword: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.API_URL}/change-password`, {
      currentPassword,
      newPassword
    }).pipe(catchError(this.handleError));
  }

  updateProfile(profile: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.API_URL}/profile`, profile)
      .pipe(
        tap(user => {
          this.currentUserSubject.next(user);
          this.storeUser(user);
        }),
        catchError(this.handleError)
      );
  }

  updatePreferences(preferences: Partial<UserPreferences>): Observable<UserPreferences> {
    return this.http.patch<UserPreferences>(`${this.API_URL}/preferences`, preferences)
      .pipe(
        tap(updatedPreferences => {
          const currentUser = this.getCurrentUser();
          if (currentUser) {
            currentUser.preferences = { ...currentUser.preferences, ...updatedPreferences };
            this.currentUserSubject.next(currentUser);
            this.storeUser(currentUser);
          }
        }),
        catchError(this.handleError)
      );
  }

  requestPasswordReset(email: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.API_URL}/request-password-reset`, { email })
      .pipe(catchError(this.handleError));
  }

  resetPassword(token: string, newPassword: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.API_URL}/reset-password`, {
      token,
      newPassword
    }).pipe(catchError(this.handleError));
  }

  private handleAuthSuccess(response: LoginResponse): void {
    this.storeTokens(response.accessToken, response.refreshToken);
    this.storeUser(response.user);
    this.currentUserSubject.next(response.user);
    this.scheduleTokenRefresh(response.accessToken);
  }

  private handleLogout(): void {
    this.clearAuth();
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  private clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
    }
  }

  private storeTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(this.TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  private storeUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  private getStoredToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private getStoredRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  private getStoredUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }

  private scheduleTokenRefresh(token: string): void {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      const expirationTime = payload.exp;
      
      // Refresh token 5 minutes before expiration
      const refreshTime = (expirationTime - currentTime - 300) * 1000;
      
      if (refreshTime > 0) {
        this.tokenRefreshTimer = setTimeout(() => {
          this.refreshToken().subscribe({
            error: () => this.logout()
          });
        }, refreshTime);
      }
    } catch {
      this.logout();
    }
  }

  private evaluateCondition(condition: PermissionCondition, context: any): boolean {
    const fieldValue = this.getNestedProperty(context, condition.field);
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'contains':
        return Array.isArray(fieldValue) ? 
          fieldValue.includes(condition.value) : 
          String(fieldValue).includes(String(condition.value));
      case 'in':
        return Array.isArray(condition.value) ? 
          condition.value.includes(fieldValue) : false;
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);
      case 'less_than':
        return Number(fieldValue) < Number(condition.value);
      default:
        return false;
    }
  }

  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      switch (error.status) {
        case 401:
          errorMessage = 'Invalid credentials or session expired';
          break;
        case 403:
          errorMessage = 'Access denied';
          break;
        case 404:
          errorMessage = 'Service not found';
          break;
        case 422:
          errorMessage = error.error?.message || 'Invalid data provided';
          break;
        case 429:
          errorMessage = 'Too many attempts. Please try again later.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = error.error?.message || errorMessage;
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}