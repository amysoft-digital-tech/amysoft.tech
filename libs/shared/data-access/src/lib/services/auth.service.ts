import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface User {
  id: string;
  email: string;
  name: string;
  tier: string;
  profile: {
    experienceLevel: string;
    primaryLanguage: string;
    joinedDate: string;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  tier: string;
  paymentToken?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);
  private apiService = inject(ApiService);

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor() {
    this.initializeAuth();
  }

  /**
   * Login user with email and password
   */
  login(credentials: LoginCredentials): Observable<AuthTokens> {
    return this.apiService.post<AuthTokens>('/api/auth/login', credentials).pipe(
      tap((tokens) => {
        this.setTokens(tokens);
        this.setCurrentUser(tokens.user);
      }),
      catchError((error) => {
        console.error('Login failed:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Register new user
   */
  register(userData: RegisterData): Observable<AuthTokens> {
    return this.apiService.post<AuthTokens>('/api/auth/register', userData).pipe(
      tap((tokens) => {
        this.setTokens(tokens);
        this.setCurrentUser(tokens.user);
      }),
      catchError((error) => {
        console.error('Registration failed:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Logout user
   */
  logout(): void {
    this.clearTokens();
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  /**
   * Refresh access token using refresh token
   */
  refreshAccessToken(): Observable<AuthTokens> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.apiService.post<AuthTokens>('/api/auth/refresh', { refreshToken }).pipe(
      tap((tokens) => {
        this.setTokens(tokens);
        this.setCurrentUser(tokens.user);
      }),
      catchError((error) => {
        console.error('Token refresh failed:', error);
        this.logout();
        return throwError(() => error);
      })
    );
  }

  /**
   * Get current user profile
   */
  getUserProfile(): Observable<User> {
    return this.apiService.get<User>('/api/auth/profile').pipe(
      tap((user) => {
        this.setCurrentUser(user);
      }),
      catchError((error) => {
        console.error('Failed to get user profile:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update user profile
   */
  updateProfile(profileData: Partial<User>): Observable<User> {
    return this.apiService.patch<User>('/api/auth/profile', profileData).pipe(
      tap((user) => {
        this.setCurrentUser(user);
      })
    );
  }

  /**
   * Change password
   */
  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.apiService.post<void>('/api/auth/change-password', {
      currentPassword,
      newPassword
    });
  }

  /**
   * Request password reset
   */
  requestPasswordReset(email: string): Observable<void> {
    return this.apiService.post<void>('/api/auth/forgot-password', { email });
  }

  /**
   * Reset password with token
   */
  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.apiService.post<void>('/api/auth/reset-password', {
      token,
      newPassword
    });
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  /**
   * Check if user has specific tier access
   */
  hasTierAccess(requiredTier: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    const tierHierarchy = ['freemium', 'foundation', 'advanced', 'elite'];
    const userTierIndex = tierHierarchy.indexOf(user.tier);
    const requiredTierIndex = tierHierarchy.indexOf(requiredTier);

    return userTierIndex >= requiredTierIndex;
  }

  /**
   * Initialize authentication state on app startup
   */
  private initializeAuth(): void {
    const accessToken = this.getAccessToken();
    const userData = localStorage.getItem('user_data');

    if (accessToken && userData) {
      try {
        const user = JSON.parse(userData) as User;
        this.setCurrentUser(user);
        
        // Verify token is still valid by fetching user profile
        this.getUserProfile().subscribe({
          error: () => {
            // Token is invalid, clear everything
            this.logout();
          }
        });
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        this.clearTokens();
      }
    }
  }

  /**
   * Set authentication tokens
   */
  private setTokens(tokens: AuthTokens): void {
    localStorage.setItem('access_token', tokens.accessToken);
    localStorage.setItem('refresh_token', tokens.refreshToken);
    
    // Set token expiration
    const expirationTime = Date.now() + (tokens.expiresIn * 1000);
    localStorage.setItem('token_expiration', expirationTime.toString());
  }

  /**
   * Set current user
   */
  private setCurrentUser(user: User): void {
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
    localStorage.setItem('user_data', JSON.stringify(user));
  }

  /**
   * Clear all authentication data
   */
  private clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expiration');
    localStorage.removeItem('user_data');
  }

  /**
   * Check if access token is expired
   */
  isTokenExpired(): boolean {
    const expiration = localStorage.getItem('token_expiration');
    if (!expiration) return true;

    return Date.now() >= parseInt(expiration);
  }
}