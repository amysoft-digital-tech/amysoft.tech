// cypress/support/e2e.ts
import './commands';

// Security testing utilities
Cypress.Commands.add('loginAsAdmin', () => {
  cy.visit('/login');
  cy.get('[data-cy=username]').type(Cypress.env('admin_username'));
  cy.get('[data-cy=password]').type(Cypress.env('admin_password'));
  cy.get('[data-cy=login-button]').click();
  cy.url().should('include', '/dashboard');
});

Cypress.Commands.add('loginAsUser', () => {
  cy.visit('/login');
  cy.get('[data-cy=username]').type(Cypress.env('test_user_username'));
  cy.get('[data-cy=password]').type(Cypress.env('test_user_password'));
  cy.get('[data-cy=login-button]').click();
});

Cypress.Commands.add('checkAccessDenied', () => {
  cy.get('[data-cy=access-denied]').should('be.visible');
  cy.get('[data-cy=error-message]').should('contain', 'Unauthorized');
});

Cypress.Commands.add('validateDataIntegrity', (endpoint: string, expectedFields: string[]) => {
  cy.request('GET', endpoint).then((response) => {
    expect(response.status).to.eq(200);
    expect(response.body).to.have.property('data');
    
    expectedFields.forEach(field => {
      expect(response.body.data).to.have.property(field);
    });
  });
});

declare global {
  namespace Cypress {
    interface Chainable {
      loginAsAdmin(): Chainable<void>;
      loginAsUser(): Chainable<void>;
      checkAccessDenied(): Chainable<void>;
      validateDataIntegrity(endpoint: string, expectedFields: string[]): Chainable<void>;
    }
  }
}