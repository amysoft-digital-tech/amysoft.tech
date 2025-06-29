// cypress/support/commands.ts

// Security testing commands
Cypress.Commands.add('testSQLInjection', (selector: string) => {
  const sqlInjectionPayloads = [
    "'; DROP TABLE users; --",
    "' OR '1'='1",
    "'; SELECT * FROM admin; --",
    "' UNION SELECT * FROM sensitive_data --"
  ];

  sqlInjectionPayloads.forEach(payload => {
    cy.get(selector).clear().type(payload);
    cy.get('[data-cy=submit]').click();
    cy.get('[data-cy=error-message]').should('be.visible');
    cy.get('body').should('not.contain', 'admin');
    cy.get('body').should('not.contain', 'password');
  });
});

Cypress.Commands.add('testXSSVulnerability', (selector: string) => {
  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    '<svg onload=alert("XSS")>',
    'javascript:alert("XSS")'
  ];

  xssPayloads.forEach(payload => {
    cy.get(selector).clear().type(payload);
    cy.get('[data-cy=submit]').click();
    
    // Should not execute JavaScript
    cy.window().its('alert').should('not.exist');
    // Should escape HTML
    cy.get('body').should('not.contain', '<script>');
  });
});

Cypress.Commands.add('testCSRFProtection', (endpoint: string, method: string = 'POST') => {
  // Test CSRF protection by making request without proper token
  cy.request({
    method: method,
    url: endpoint,
    failOnStatusCode: false,
    body: { test: 'data' }
  }).then((response) => {
    expect(response.status).to.be.oneOf([403, 419, 422]); // Common CSRF error codes
  });
});

Cypress.Commands.add('validateAccessControl', (role: string, allowedRoutes: string[], forbiddenRoutes: string[]) => {
  // Test allowed routes
  allowedRoutes.forEach(route => {
    cy.visit(route);
    cy.get('[data-cy=access-denied]').should('not.exist');
    cy.url().should('include', route);
  });

  // Test forbidden routes
  forbiddenRoutes.forEach(route => {
    cy.visit(route);
    cy.url().should('not.include', route);
    // Should redirect to unauthorized page or login
    cy.url().should('match', /(login|unauthorized|403)/);
  });
});

declare global {
  namespace Cypress {
    interface Chainable {
      testSQLInjection(selector: string): Chainable<void>;
      testXSSVulnerability(selector: string): Chainable<void>;
      testCSRFProtection(endpoint: string, method?: string): Chainable<void>;
      validateAccessControl(role: string, allowedRoutes: string[], forbiddenRoutes: string[]): Chainable<void>;
    }
  }
}