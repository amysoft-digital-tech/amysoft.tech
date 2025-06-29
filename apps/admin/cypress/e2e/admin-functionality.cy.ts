describe('Admin Functionality Testing', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  describe('Dashboard Analytics', () => {
    it('should display key performance metrics', () => {
      cy.visit('/dashboard');
      
      cy.get('[data-cy=total-users-metric]').should('be.visible');
      cy.get('[data-cy=sales-metric]').should('be.visible');
      cy.get('[data-cy=content-views-metric]').should('be.visible');
      cy.get('[data-cy=active-sessions-metric]').should('be.visible');
      
      // Validate metric values are numbers
      cy.get('[data-cy=total-users-metric] .metric').invoke('text').should('match', /^\d{1,3}(,\d{3})*$/);
      cy.get('[data-cy=sales-metric] .metric').invoke('text').should('match', /^\$\d{1,3}(,\d{3})*$/);
    });

    it('should update metrics in real-time', () => {
      cy.visit('/dashboard');
      
      cy.get('[data-cy=refresh-metrics]').click();
      cy.get('[data-cy=loading-indicator]').should('be.visible');
      cy.get('[data-cy=loading-indicator]').should('not.exist');
      
      // Verify data integrity
      cy.validateDataIntegrity('/api/admin/metrics', ['totalUsers', 'salesToday', 'contentViews', 'activeSessions']);
    });
  });

  describe('User Management', () => {
    it('should display user list with pagination', () => {
      cy.visit('/admin/users');
      
      cy.get('[data-cy=user-table]').should('be.visible');
      cy.get('[data-cy=user-row]').should('have.length.greaterThan', 0);
      cy.get('[data-cy=pagination]').should('be.visible');
    });

    it('should search users effectively', () => {
      cy.visit('/admin/users');
      
      cy.get('[data-cy=user-search]').type('admin');
      cy.get('[data-cy=search-button]').click();
      
      cy.get('[data-cy=user-row]').each(($row) => {
        cy.wrap($row).should('contain', 'admin');
      });
    });

    it('should create new user with validation', () => {
      cy.visit('/admin/users/create');
      
      // Test form validation
      cy.get('[data-cy=submit]').click();
      cy.get('[data-cy=email-error]').should('be.visible');
      
      // Create valid user
      cy.get('[data-cy=email-input]').type('newuser@test.com');
      cy.get('[data-cy=password-input]').type('SecurePass123!');
      cy.get('[data-cy=role-select]').select('user');
      cy.get('[data-cy=submit]').click();
      
      cy.get('[data-cy=success-message]').should('contain', 'User created successfully');
      cy.url().should('include', '/admin/users');
    });

    it('should edit existing user', () => {
      cy.visit('/admin/users');
      
      cy.get('[data-cy=user-row]').first().find('[data-cy=edit-button]').click();
      
      cy.get('[data-cy=email-input]').should('not.be.empty');
      cy.get('[data-cy=role-select]').select('admin');
      cy.get('[data-cy=submit]').click();
      
      cy.get('[data-cy=success-message]').should('contain', 'User updated successfully');
    });
  });

  describe('Content Management', () => {
    it('should manage content with rich editor', () => {
      cy.visit('/admin/content');
      
      cy.get('[data-cy=create-content]').click();
      
      cy.get('[data-cy=title-input]').type('Test Content Title');
      cy.get('[data-cy=content-editor]').type('This is test content body.');
      cy.get('[data-cy=category-select]').select('learning');
      cy.get('[data-cy=publish-button]').click();
      
      cy.get('[data-cy=success-message]').should('contain', 'Content published');
    });

    it('should preview content before publishing', () => {
      cy.visit('/admin/content/create');
      
      cy.get('[data-cy=title-input]').type('Preview Test');
      cy.get('[data-cy=content-editor]').type('Preview content body.');
      cy.get('[data-cy=preview-button]').click();
      
      cy.get('[data-cy=preview-modal]').should('be.visible');
      cy.get('[data-cy=preview-title]').should('contain', 'Preview Test');
      cy.get('[data-cy=preview-body]').should('contain', 'Preview content body.');
    });
  });

  describe('Analytics and Reporting', () => {
    it('should generate user analytics report', () => {
      cy.visit('/admin/analytics');
      
      cy.get('[data-cy=date-range-picker]').click();
      cy.get('[data-cy=last-30-days]').click();
      cy.get('[data-cy=generate-report]').click();
      
      cy.get('[data-cy=user-growth-chart]').should('be.visible');
      cy.get('[data-cy=engagement-metrics]').should('be.visible');
      
      // Validate data integrity
      cy.validateDataIntegrity('/api/admin/analytics/users', ['totalUsers', 'newUsers', 'activeUsers']);
    });

    it('should export analytics data', () => {
      cy.visit('/admin/analytics');
      
      cy.get('[data-cy=generate-report]').click();
      cy.get('[data-cy=export-csv]').click();
      
      // Verify download (file should exist in downloads)
      cy.readFile('cypress/downloads/user-analytics.csv').should('exist');
    });

    it('should display sales analytics', () => {
      cy.visit('/admin/analytics/sales');
      
      cy.get('[data-cy=revenue-chart]').should('be.visible');
      cy.get('[data-cy=sales-summary]').should('be.visible');
      
      cy.validateDataIntegrity('/api/admin/analytics/sales', ['totalRevenue', 'salesCount', 'averageOrderValue']);
    });
  });

  describe('System Settings', () => {
    it('should update application settings', () => {
      cy.visit('/admin/settings');
      
      cy.get('[data-cy=site-name-input]').clear().type('Updated Site Name');
      cy.get('[data-cy=maintenance-mode-toggle]').click();
      cy.get('[data-cy=save-settings]').click();
      
      cy.get('[data-cy=success-message]').should('contain', 'Settings updated');
    });

    it('should manage email templates', () => {
      cy.visit('/admin/settings/email');
      
      cy.get('[data-cy=template-select]').select('welcome');
      cy.get('[data-cy=template-editor]').clear().type('Updated welcome email template');
      cy.get('[data-cy=preview-email]').click();
      
      cy.get('[data-cy=email-preview]').should('contain', 'Updated welcome email template');
      
      cy.get('[data-cy=save-template]').click();
      cy.get('[data-cy=success-message]').should('contain', 'Template saved');
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle concurrent user management operations', () => {
      const operations = [];
      
      for (let i = 0; i < 5; i++) {
        operations.push(
          cy.request('GET', '/api/admin/users').then((response) => {
            expect(response.status).to.eq(200);
            expect(response.duration).to.be.lessThan(2000); // Response within 2 seconds
          })
        );
      }
      
      Promise.all(operations);
    });

    it('should maintain performance under data load', () => {
      cy.visit('/admin/users');
      
      // Load large dataset
      cy.get('[data-cy=show-all-users]').click();
      
      cy.get('[data-cy=user-table]', { timeout: 10000 }).should('be.visible');
      cy.get('[data-cy=loading-indicator]').should('not.exist');
      
      // Verify search performance
      const startTime = Date.now();
      cy.get('[data-cy=user-search]').type('test');
      cy.get('[data-cy=search-results]').should('be.visible');
      
      cy.then(() => {
        const endTime = Date.now();
        expect(endTime - startTime).to.be.lessThan(3000); // Search within 3 seconds
      });
    });
  });
});