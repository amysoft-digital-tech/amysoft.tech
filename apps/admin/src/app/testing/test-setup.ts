import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Component, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

// Global test setup for Angular admin application
import 'zone.js/dist/zone-testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

// Initialize the Angular testing environment
declare const require: {
  context(path: string, deep?: boolean, filter?: RegExp): {
    keys(): string[];
    <T>(id: string): T;
  };
};

// Configure testing module
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);

// Mock Services for Testing
@Injectable()
export class MockAuthService {
  isAuthenticated = true;
  currentUser = {
    id: '1',
    email: 'test@amysoft.tech',
    role: 'admin',
    permissions: ['read', 'write', 'delete']
  };

  login(credentials: any): Observable<any> {
    return of({ token: 'mock-jwt-token', user: this.currentUser });
  }

  logout(): Observable<boolean> {
    return of(true);
  }

  hasPermission(permission: string): boolean {
    return this.currentUser.permissions.includes(permission);
  }

  hasRole(role: string): boolean {
    return this.currentUser.role === role;
  }
}

@Injectable()
export class MockUserService {
  users = [
    { id: '1', email: 'user1@test.com', role: 'user', tier: 'foundation' },
    { id: '2', email: 'user2@test.com', role: 'admin', tier: 'advanced' },
    { id: '3', email: 'user3@test.com', role: 'viewer', tier: 'elite' }
  ];

  getUsers(): Observable<any[]> {
    return of(this.users);
  }

  getUser(id: string): Observable<any> {
    return of(this.users.find(user => user.id === id));
  }

  createUser(user: any): Observable<any> {
    const newUser = { ...user, id: Date.now().toString() };
    this.users.push(newUser);
    return of(newUser);
  }

  updateUser(id: string, updates: any): Observable<any> {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex !== -1) {
      this.users[userIndex] = { ...this.users[userIndex], ...updates };
      return of(this.users[userIndex]);
    }
    throw new Error('User not found');
  }

  deleteUser(id: string): Observable<boolean> {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex !== -1) {
      this.users.splice(userIndex, 1);
      return of(true);
    }
    return of(false);
  }
}

@Injectable()
export class MockContentService {
  chapters = [
    { id: '1', title: 'Introduction to Elite Principles', order: 1, published: true },
    { id: '2', title: 'Advanced Prompting Techniques', order: 2, published: false },
    { id: '3', title: 'Code Generation Mastery', order: 3, published: true }
  ];

  templates = [
    { id: '1', title: 'Code Review Template', category: 'Development', usage: 150 },
    { id: '2', title: 'Bug Fix Template', category: 'Development', usage: 89 },
    { id: '3', title: 'Feature Request Template', category: 'Planning', usage: 67 }
  ];

  getChapters(): Observable<any[]> {
    return of(this.chapters);
  }

  getChapter(id: string): Observable<any> {
    return of(this.chapters.find(chapter => chapter.id === id));
  }

  createChapter(chapter: any): Observable<any> {
    const newChapter = { ...chapter, id: Date.now().toString() };
    this.chapters.push(newChapter);
    return of(newChapter);
  }

  updateChapter(id: string, updates: any): Observable<any> {
    const chapterIndex = this.chapters.findIndex(chapter => chapter.id === id);
    if (chapterIndex !== -1) {
      this.chapters[chapterIndex] = { ...this.chapters[chapterIndex], ...updates };
      return of(this.chapters[chapterIndex]);
    }
    throw new Error('Chapter not found');
  }

  getTemplates(): Observable<any[]> {
    return of(this.templates);
  }

  createTemplate(template: any): Observable<any> {
    const newTemplate = { ...template, id: Date.now().toString(), usage: 0 };
    this.templates.push(newTemplate);
    return of(newTemplate);
  }
}

@Injectable()
export class MockAnalyticsService {
  getKPIMetrics(): Observable<any> {
    return of({
      totalRevenue: 125000,
      totalUsers: 1850,
      conversionRate: 3.2,
      arr: 250000,
      activeUsers: 423
    });
  }

  getUserAnalytics(): Observable<any> {
    return of({
      newUsers: 45,
      userGrowthRate: 12.5,
      subscriptionBreakdown: {
        foundation: 1200,
        advanced: 450,
        elite: 200
      },
      retentionRate: 85.3
    });
  }

  getContentAnalytics(): Observable<any> {
    return of({
      completionRates: [
        { chapter: 'Introduction', rate: 92 },
        { chapter: 'Advanced Techniques', rate: 78 },
        { chapter: 'Code Mastery', rate: 65 }
      ],
      popularTemplates: [
        { name: 'Code Review', usage: 150 },
        { name: 'Bug Fix', usage: 89 }
      ]
    });
  }

  getMarketingAnalytics(): Observable<any> {
    return of({
      conversionFunnel: [
        { stage: 'Visitors', count: 10000 },
        { stage: 'Leads', count: 800 },
        { stage: 'Customers', count: 320 }
      ],
      trafficSources: {
        organic: 45,
        paid: 30,
        social: 25
      },
      customerAcquisitionCost: 25
    });
  }
}

// Mock Component for routing tests
@Component({
  template: '<div>Mock Component</div>'
})
export class MockComponent { }

// Test utilities
export class TestUtils {
  static createMockTestingModule(options: {
    declarations?: any[];
    imports?: any[];
    providers?: any[];
  } = {}) {
    return TestBed.configureTestingModule({
      declarations: [
        ...(options.declarations || [])
      ],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        NoopAnimationsModule,
        ...(options.imports || [])
      ],
      providers: [
        MockAuthService,
        MockUserService,
        MockContentService,
        MockAnalyticsService,
        ...(options.providers || [])
      ]
    });
  }

  static createMockUser(overrides: any = {}) {
    return {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
      tier: 'foundation',
      createdAt: new Date(),
      ...overrides
    };
  }

  static createMockChapter(overrides: any = {}) {
    return {
      id: '1',
      title: 'Test Chapter',
      content: 'Test chapter content',
      order: 1,
      published: false,
      createdAt: new Date(),
      ...overrides
    };
  }

  static createMockTemplate(overrides: any = {}) {
    return {
      id: '1',
      title: 'Test Template',
      content: 'Test template content',
      category: 'Development',
      tags: ['test', 'development'],
      usage: 0,
      ...overrides
    };
  }

  static async waitForAsync(fn: () => void | Promise<void>) {
    await TestBed.inject(TestBed as any);
    if (fn) {
      await fn();
    }
    await TestBed.compileComponents();
  }
}

// Performance testing utilities
export class PerformanceTestUtils {
  static measureComponentRenderTime(componentFixture: any): number {
    const start = performance.now();
    componentFixture.detectChanges();
    const end = performance.now();
    return end - start;
  }

  static expectRenderTimeUnder(renderTime: number, maxTime: number) {
    expect(renderTime).toBeLessThan(maxTime);
  }

  static measureMemoryUsage(): number {
    return (performance as any).memory?.usedJSHeapSize || 0;
  }
}

// Security testing utilities
export class SecurityTestUtils {
  static testXSSPrevention(element: HTMLElement, testScript: string) {
    element.innerHTML = testScript;
    expect(element.innerHTML).not.toContain('<script>');
    expect(element.innerHTML).not.toContain('javascript:');
  }

  static testCSRFTokenPresence() {
    const csrfToken = document.querySelector('meta[name="csrf-token"]');
    expect(csrfToken).toBeTruthy();
    expect(csrfToken?.getAttribute('content')).toBeTruthy();
  }

  static testSensitiveDataExposure() {
    const localStorage = window.localStorage;
    const sessionStorage = window.sessionStorage;
    
    // Check that sensitive data is not exposed in browser storage
    expect(localStorage.getItem('password')).toBeNull();
    expect(localStorage.getItem('apiSecret')).toBeNull();
    expect(sessionStorage.getItem('adminKey')).toBeNull();
  }
}

// Accessibility testing utilities
export class AccessibilityTestUtils {
  static testKeyboardNavigation(element: HTMLElement) {
    // Test Tab navigation
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    expect(focusableElements.length).toBeGreaterThan(0);
    
    focusableElements.forEach((el, index) => {
      (el as HTMLElement).focus();
      expect(document.activeElement).toBe(el);
    });
  }

  static testAriaLabels(element: HTMLElement) {
    const interactiveElements = element.querySelectorAll(
      'button, [role="button"], input, select, textarea'
    );
    
    interactiveElements.forEach(el => {
      const hasAriaLabel = el.getAttribute('aria-label') || 
                          el.getAttribute('aria-labelledby') ||
                          el.textContent?.trim();
      expect(hasAriaLabel).toBeTruthy();
    });
  }

  static testColorContrast(element: HTMLElement) {
    const style = window.getComputedStyle(element);
    const backgroundColor = style.backgroundColor;
    const color = style.color;
    
    // Basic contrast check (simplified)
    expect(backgroundColor).not.toBe(color);
    expect(color).not.toBe('rgb(255, 255, 255)'); // White text on white background
    expect(backgroundColor).not.toBe('rgb(0, 0, 0)'); // Black background with black text
  }
}

export {
  MockAuthService,
  MockUserService,
  MockContentService,
  MockAnalyticsService,
  MockComponent
};