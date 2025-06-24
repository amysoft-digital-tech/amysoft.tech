describe('Content Management E2E Tests', () => {
  beforeEach(() => {
    cy.task('db:seed');
    cy.loginAsContentAdmin();
    cy.visit('/content');
  });

  afterEach(() => {
    cy.task('db:cleanup');
  });

  describe('Ebook Content Administration', () => {
    it('should allow content admins to create new chapters', () => {
      cy.get('[data-cy="create-chapter-btn"]').click();
      cy.get('[data-cy="chapter-title-input"]').type('Test Chapter: Advanced Prompting Techniques');
      cy.get('[data-cy="chapter-content-editor"]').type('This chapter covers advanced techniques...');
      cy.get('[data-cy="chapter-order-input"]').type('5');
      cy.get('[data-cy="save-chapter-btn"]').click();

      cy.get('[data-cy="success-notification"]').should('contain', 'Chapter created successfully');
      cy.get('[data-cy="chapters-list"]').should('contain', 'Test Chapter: Advanced Prompting Techniques');
    });

    it('should allow editing existing chapter content', () => {
      cy.get('[data-cy="chapter-item"]').first().click();
      cy.get('[data-cy="edit-chapter-btn"]').click();
      cy.get('[data-cy="chapter-content-editor"]').clear().type('Updated chapter content...');
      cy.get('[data-cy="save-changes-btn"]').click();

      cy.get('[data-cy="success-notification"]').should('contain', 'Chapter updated successfully');
    });

    it('should handle chapter reordering', () => {
      cy.get('[data-cy="reorder-mode-btn"]').click();
      cy.get('[data-cy="chapter-item"]').first().drag('[data-cy="chapter-item"]').eq(2);
      cy.get('[data-cy="save-order-btn"]').click();

      cy.get('[data-cy="success-notification"]').should('contain', 'Chapter order updated');
    });

    it('should validate chapter content before publishing', () => {
      cy.get('[data-cy="create-chapter-btn"]').click();
      cy.get('[data-cy="chapter-title-input"]').type('');
      cy.get('[data-cy="save-chapter-btn"]').click();

      cy.get('[data-cy="error-notification"]').should('contain', 'Chapter title is required');
      cy.get('[data-cy="validation-errors"]').should('be.visible');
    });

    it('should support media asset management', () => {
      cy.get('[data-cy="media-assets-tab"]').click();
      cy.get('[data-cy="upload-media-btn"]').click();
      cy.get('[data-cy="file-upload-input"]').selectFile('cypress/fixtures/test-image.png');
      cy.get('[data-cy="upload-confirm-btn"]').click();

      cy.get('[data-cy="media-grid"]').should('contain', 'test-image.png');
      cy.get('[data-cy="media-item"]').should('have.length.greaterThan', 0);
    });
  });

  describe('Template Library Management', () => {
    it('should allow adding new prompt templates', () => {
      cy.get('[data-cy="templates-tab"]').click();
      cy.get('[data-cy="add-template-btn"]').click();
      
      cy.get('[data-cy="template-title-input"]').type('Code Review Optimizer');
      cy.get('[data-cy="template-category-select"]').select('Development');
      cy.get('[data-cy="template-content-textarea"]').type('Review this code for...');
      cy.get('[data-cy="template-tags-input"]').type('code, review, optimization');
      cy.get('[data-cy="save-template-btn"]').click();

      cy.get('[data-cy="templates-list"]').should('contain', 'Code Review Optimizer');
    });

    it('should validate template effectiveness metrics', () => {
      cy.get('[data-cy="templates-tab"]').click();
      cy.get('[data-cy="template-item"]').first().click();
      cy.get('[data-cy="analytics-tab"]').click();

      cy.get('[data-cy="usage-count"]').should('be.visible');
      cy.get('[data-cy="effectiveness-score"]').should('be.visible');
      cy.get('[data-cy="user-ratings"]').should('be.visible');
    });

    it('should support template categorization and search', () => {
      cy.get('[data-cy="templates-tab"]').click();
      cy.get('[data-cy="category-filter"]').select('Development');
      cy.get('[data-cy="search-templates-input"]').type('code review');

      cy.get('[data-cy="filtered-templates"]').should('be.visible');
      cy.get('[data-cy="template-item"]').should('contain', 'Code Review');
    });
  });

  describe('Version Control and Publishing', () => {
    it('should track content revision history', () => {
      cy.get('[data-cy="chapter-item"]').first().click();
      cy.get('[data-cy="revision-history-tab"]').click();

      cy.get('[data-cy="revision-list"]').should('have.length.greaterThan', 0);
      cy.get('[data-cy="revision-item"]').should('contain', 'Created by');
      cy.get('[data-cy="revision-item"]').should('contain', 'Modified');
    });

    it('should support content approval workflow', () => {
      cy.get('[data-cy="create-chapter-btn"]').click();
      cy.fillChapterForm();
      cy.get('[data-cy="submit-for-review-btn"]').click();

      cy.get('[data-cy="chapter-status"]').should('contain', 'Pending Review');
      
      cy.loginAsSuperAdmin();
      cy.visit('/content/pending-review');
      cy.get('[data-cy="approve-chapter-btn"]').first().click();
      
      cy.get('[data-cy="chapter-status"]').should('contain', 'Approved');
    });

    it('should handle draft and published states', () => {
      cy.get('[data-cy="chapter-item"]').first().click();
      cy.get('[data-cy="publish-status-toggle"]').click();
      cy.get('[data-cy="confirm-publish-btn"]').click();

      cy.get('[data-cy="chapter-status"]').should('contain', 'Published');
      cy.get('[data-cy="live-indicator"]').should('be.visible');
    });
  });

  describe('Quality Assurance', () => {
    it('should validate content accessibility', () => {
      cy.get('[data-cy="chapter-item"]').first().click();
      cy.get('[data-cy="accessibility-check-btn"]').click();

      cy.get('[data-cy="accessibility-report"]').should('be.visible');
      cy.get('[data-cy="accessibility-score"]').should('be.visible');
      cy.get('[data-cy="accessibility-issues"]').should('be.visible');
    });

    it('should check for broken links and media', () => {
      cy.get('[data-cy="quality-check-tab"]').click();
      cy.get('[data-cy="run-link-check-btn"]').click();

      cy.get('[data-cy="link-check-results"]').should('be.visible');
      cy.get('[data-cy="broken-links-count"]').should('be.visible');
    });

    it('should validate content SEO optimization', () => {
      cy.get('[data-cy="chapter-item"]').first().click();
      cy.get('[data-cy="seo-analysis-tab"]').click();

      cy.get('[data-cy="seo-score"]').should('be.visible');
      cy.get('[data-cy="seo-recommendations"]').should('be.visible');
      cy.get('[data-cy="meta-description"]').should('be.visible');
    });
  });
});