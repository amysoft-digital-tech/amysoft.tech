import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { roleGuard } from './role.guard';
import { AuthService, AdminRole } from '../auth/auth.service';

describe('roleGuard', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let route: ActivatedRouteSnapshot;
  let state: RouterStateSnapshot;

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated', 'hasAnyRole']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    route = { data: {} } as ActivatedRouteSnapshot;
    state = { url: '/content' } as RouterStateSnapshot;
  });

  it('should redirect to login when user is not authenticated', () => {
    authService.isAuthenticated.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() => roleGuard(route, state));

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should allow access when no required roles are specified', () => {
    authService.isAuthenticated.and.returnValue(true);
    route.data = {};

    const result = TestBed.runInInjectionContext(() => roleGuard(route, state));

    expect(result).toBe(true);
    expect(authService.hasAnyRole).not.toHaveBeenCalled();
  });

  it('should allow access when user has required role', () => {
    authService.isAuthenticated.and.returnValue(true);
    authService.hasAnyRole.and.returnValue(true);
    route.data = { requiredRoles: [AdminRole.CONTENT_ADMIN] };

    const result = TestBed.runInInjectionContext(() => roleGuard(route, state));

    expect(result).toBe(true);
    expect(authService.hasAnyRole).toHaveBeenCalledWith([AdminRole.CONTENT_ADMIN]);
  });

  it('should redirect to dashboard when user lacks required role', () => {
    authService.isAuthenticated.and.returnValue(true);
    authService.hasAnyRole.and.returnValue(false);
    route.data = { requiredRoles: [AdminRole.SUPER_ADMIN] };

    const result = TestBed.runInInjectionContext(() => roleGuard(route, state));

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});