/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      loginAsAdmin(): Chainable<void>;
      loginAsSuperAdmin(): Chainable<void>;
      loginAsContentAdmin(): Chainable<void>;
      loginAsSupportAgent(): Chainable<void>;
      loginAsViewer(): Chainable<void>;
      fillUserForm(): Chainable<void>;
      fillChapterForm(): Chainable<void>;
      validateAccessibility(): Chainable<void>;
      checkPerformance(): Chainable<void>;
      validateSecurity(): Chainable<void>;
    }
  }
}

// Authentication Commands
Cypress.Commands.add('loginAsAdmin', () => {
  cy.session('admin', () => {
    cy.visit('/login');
    cy.get('[data-cy="email-input"]').type(Cypress.env('testUser.email'));
    cy.get('[data-cy="password-input"]').type(Cypress.env('testUser.password'));
    cy.get('[data-cy="login-btn"]').click();
    cy.url().should('include', '/admin');
  });
});

Cypress.Commands.add('loginAsSuperAdmin', () => {
  cy.session('superAdmin', () => {
    cy.visit('/login');
    cy.get('[data-cy="email-input"]').type(Cypress.env('testUserRoles.superAdmin'));
    cy.get('[data-cy="password-input"]').type('super-admin-password');
    cy.get('[data-cy="login-btn"]').click();
    cy.url().should('include', '/admin');
  });
});

Cypress.Commands.add('loginAsContentAdmin', () => {
  cy.session('contentAdmin', () => {
    cy.visit('/login');
    cy.get('[data-cy="email-input"]').type(Cypress.env('testUserRoles.contentAdmin'));
    cy.get('[data-cy="password-input"]').type('content-admin-password');
    cy.get('[data-cy="login-btn"]').click();
    cy.url().should('include', '/admin');
  });
});

Cypress.Commands.add('loginAsSupportAgent', () => {
  cy.session('supportAgent', () => {
    cy.visit('/login');
    cy.get('[data-cy="email-input"]').type(Cypress.env('testUserRoles.supportAgent'));
    cy.get('[data-cy="password-input"]').type('support-password');
    cy.get('[data-cy="login-btn"]').click();
    cy.url().should('include', '/admin');
  });
});

Cypress.Commands.add('loginAsViewer', () => {
  cy.session('viewer', () => {
    cy.visit('/login');
    cy.get('[data-cy="email-input"]').type(Cypress.env('testUserRoles.viewer'));
    cy.get('[data-cy="password-input"]').type('viewer-password');
    cy.get('[data-cy="login-btn"]').click();
    cy.url().should('include', '/admin');
  });
});

// Form Helper Commands
Cypress.Commands.add('fillUserForm', () => {
  cy.get('[data-cy="user-email-input"]').type('newuser@example.com');
  cy.get('[data-cy="user-first-name-input"]').type('Test');
  cy.get('[data-cy="user-last-name-input"]').type('User');
  cy.get('[data-cy="user-role-select"]').select('viewer');
  cy.get('[data-cy="user-tier-select"]').select('foundation');
});

Cypress.Commands.add('fillChapterForm', () => {
  cy.get('[data-cy="chapter-title-input"]').type('Test Chapter: Automated Testing');
  cy.get('[data-cy="chapter-content-editor"]').type('This chapter covers automated testing best practices...');
  cy.get('[data-cy="chapter-order-input"]').type('10');
  cy.get('[data-cy="chapter-category-select"]').select('Advanced');
});

// Quality Assurance Commands
Cypress.Commands.add('validateAccessibility', () => {
  cy.injectAxe();
  cy.checkA11y(null, {
    rules: {
      'color-contrast': { enabled: true },
      'keyboard-navigation': { enabled: true },
      'focus-management': { enabled: true }
    }
  });
});

Cypress.Commands.add('checkPerformance', () => {
  cy.window().its('performance').then((performance) => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const loadTime = navigation.loadEventEnd - navigation.fetchStart;
    
    expect(loadTime).to.be.lessThan(3000, 'Page load time should be under 3 seconds');
    
    // Check Core Web Vitals
    cy.window().then((win) => {
      return new Promise((resolve) => {
        new (win as any).PerformanceObserver((list: any) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'largest-contentful-paint') {
              expect(entry.startTime).to.be.lessThan(2500, 'LCP should be under 2.5 seconds');
            }
            if (entry.entryType === 'first-input') {
              expect(entry.processingStart - entry.startTime).to.be.lessThan(100, 'FID should be under 100ms');
            }
          }
          resolve(true);
        }).observe({ entryTypes: ['largest-contentful-paint', 'first-input'] });
      });
    });
  });
});

Cypress.Commands.add('validateSecurity', () => {
  // Check for HTTPS
  cy.url().should('include', 'https://');
  
  // Validate security headers
  cy.request('/').then((response) => {
    expect(response.headers).to.have.property('x-frame-options');
    expect(response.headers).to.have.property('x-content-type-options');
    expect(response.headers).to.have.property('x-xss-protection');
    expect(response.headers).to.have.property('strict-transport-security');
  });
  
  // Check for exposed sensitive information
  cy.window().then((win) => {
    expect(win.localStorage.getItem('apiKey')).to.be.null;
    expect(win.localStorage.getItem('adminSecret')).to.be.null;
  });
  
  // Validate CSRF protection
  cy.get('meta[name="csrf-token"]').should('exist');
});

// Custom drag and drop command
Cypress.Commands.add('drag', { prevSubject: 'element' }, (subject, target) => {
  cy.wrap(subject).trigger('mousedown', { which: 1 });
  cy.get(target).trigger('mousemove').trigger('mouseup');
});

// Database and API helper commands
Cypress.Commands.add('seedTestData', (dataType: string) => {
  cy.task(`db:seed:${dataType}`);
});

Cypress.Commands.add('cleanupTestData', () => {
  cy.task('db:cleanup');
});

// Wait for API calls to complete
Cypress.Commands.add('waitForAPI', (alias: string) => {
  cy.wait(alias).then((interception) => {
    expect(interception.response?.statusCode).to.be.oneOf([200, 201, 204]);
  });
});

// Screenshot and video helpers for debugging
Cypress.Commands.add('takeScreenshotOnFailure', () => {
  cy.screenshot({ capture: 'fullPage' });
});

// Network stubbing helpers for testing error scenarios
Cypress.Commands.add('stubAPIError', (endpoint: string, statusCode: number) => {
  cy.intercept('GET', endpoint, { statusCode }).as('apiError');
});

// Local storage helpers for token management
Cypress.Commands.add('setAuthToken', (token: string) => {
  cy.window().then((win) => {
    win.localStorage.setItem('authToken', token);
  });
});

Cypress.Commands.add('clearAuthToken', () => {
  cy.window().then((win) => {
    win.localStorage.removeItem('authToken');
  });
});

export {};