import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';

import { AuthService, AdminRole } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: spy }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should login successfully', () => {
    const mockResponse = {
      user: {
        id: '1',
        email: 'admin@test.com',
        name: 'Admin User',
        role: AdminRole.SUPER_ADMIN,
        permissions: [],
        lastLogin: new Date(),
        mfaEnabled: false,
        preferences: {
          theme: 'light',
          language: 'en',
          timezone: 'UTC',
          notifications: {
            email: true,
            browser: true,
            mobile: false,
            categories: {
              system: true,
              content: true,
              users: true,
              security: true
            }
          },
          dashboard: {
            defaultView: 'overview',
            widgets: ['metrics', 'activity'],
            refreshInterval: 30000
          }
        }
      },
      accessToken: 'mock-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600
    };

    const credentials = {
      email: 'admin@test.com',
      password: 'password123'
    };

    service.login(credentials).subscribe(response => {
      expect(response).toEqual(mockResponse);
      expect(service.isAuthenticated()).toBeTruthy();
      expect(service.getCurrentUser()).toEqual(mockResponse.user);
    });

    const req = httpMock.expectOne('/api/admin/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(credentials);
    req.flush(mockResponse);
  });

  it('should handle login with MFA', () => {
    const mockResponse = {
      mfaRequired: true,
      user: null,
      accessToken: '',
      refreshToken: '',
      expiresIn: 0
    };

    const credentials = {
      email: 'admin@test.com',
      password: 'password123'
    };

    service.login(credentials).subscribe(response => {
      expect(response.mfaRequired).toBeTruthy();
      expect(service.isAuthenticated()).toBeFalsy();
    });

    const req = httpMock.expectOne('/api/admin/auth/login');
    req.flush(mockResponse);
  });

  it('should check roles correctly', () => {
    const mockUser = {
      id: '1',
      email: 'admin@test.com',
      name: 'Admin User',
      role: AdminRole.CONTENT_ADMIN,
      permissions: [],
      lastLogin: new Date(),
      mfaEnabled: false,
      preferences: {
        theme: 'light',
        language: 'en',
        timezone: 'UTC',
        notifications: {
          email: true,
          browser: true,
          mobile: false,
          categories: {
            system: true,
            content: true,
            users: true,
            security: true
          }
        },
        dashboard: {
          defaultView: 'overview',
          widgets: ['metrics', 'activity'],
          refreshInterval: 30000
        }
      }
    };

    // Simulate logged in user
    localStorage.setItem('admin_user', JSON.stringify(mockUser));
    localStorage.setItem('admin_token', 'mock-token');
    service['currentUserSubject'].next(mockUser);

    expect(service.hasRole(AdminRole.CONTENT_ADMIN)).toBeTruthy();
    expect(service.hasRole(AdminRole.SUPER_ADMIN)).toBeFalsy();
    expect(service.hasAnyRole([AdminRole.CONTENT_ADMIN, AdminRole.SUPER_ADMIN])).toBeTruthy();
    expect(service.hasAnyRole([AdminRole.SUPER_ADMIN, AdminRole.ANALYTICS_ADMIN])).toBeFalsy();
  });

  it('should logout correctly', () => {
    // Setup logged in state
    localStorage.setItem('admin_token', 'mock-token');
    localStorage.setItem('admin_refresh_token', 'mock-refresh-token');
    localStorage.setItem('admin_user', JSON.stringify({ id: '1' }));

    service.logout();

    const req = httpMock.expectOne('/api/admin/auth/logout');
    expect(req.request.method).toBe('POST');
    req.flush({});

    expect(localStorage.getItem('admin_token')).toBeNull();
    expect(localStorage.getItem('admin_refresh_token')).toBeNull();
    expect(localStorage.getItem('admin_user')).toBeNull();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should handle token refresh', () => {
    localStorage.setItem('admin_refresh_token', 'mock-refresh-token');

    const mockResponse = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      expiresIn: 3600
    };

    service.refreshToken().subscribe(response => {
      expect(response).toEqual(mockResponse);
      expect(localStorage.getItem('admin_token')).toBe('new-access-token');
      expect(localStorage.getItem('admin_refresh_token')).toBe('new-refresh-token');
    });

    const req = httpMock.expectOne('/api/admin/auth/refresh');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should detect expired tokens', () => {
    // Create an expired token (past timestamp)
    const expiredToken = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 1000 }));
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const signature = 'mock-signature';
    const fullToken = `${header}.${expiredToken}.${signature}`;

    localStorage.setItem('admin_token', fullToken);
    expect(service.isAuthenticated()).toBeFalsy();
  });

  it('should validate permissions for super admin', () => {
    const superAdminUser = {
      id: '1',
      role: AdminRole.SUPER_ADMIN,
      permissions: []
    };

    service['currentUserSubject'].next(superAdminUser as any);

    // Super admin should have all permissions
    expect(service.hasPermission('users', 'create' as any)).toBeTruthy();
    expect(service.hasPermission('content', 'delete' as any)).toBeTruthy();
    expect(service.hasPermission('system', 'configure' as any)).toBeTruthy();
  });
});