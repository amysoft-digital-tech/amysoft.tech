describe('Analytics Dashboard E2E Tests', () => {
  beforeEach(() => {
    cy.task('db:seed');
    cy.loginAsAdmin();
    cy.visit('/admin/analytics');
  });

  afterEach(() => {
    cy.task('db:cleanup');
  });

  describe('Business Intelligence Dashboard', () => {
    it('should display key performance metrics', () => {
      cy.get('[data-cy="kpi-cards"]').should('be.visible');
      cy.get('[data-cy="revenue-metric"]').should('contain', '$');
      cy.get('[data-cy="user-count-metric"]').should('be.visible');
      cy.get('[data-cy="conversion-rate-metric"]').should('contain', '%');
      cy.get('[data-cy="arr-metric"]').should('be.visible');
    });

    it('should show real-time user activity', () => {
      cy.get('[data-cy="real-time-users"]').should('be.visible');
      cy.get('[data-cy="active-sessions"]').should('be.visible');
      cy.get('[data-cy="current-page-views"]').should('be.visible');
      
      // Verify data updates
      cy.wait(5000);
      cy.get('[data-cy="last-updated"]').should('contain', 'seconds ago');
    });

    it('should display revenue analytics with trends', () => {
      cy.get('[data-cy="revenue-chart"]').should('be.visible');
      cy.get('[data-cy="revenue-trend-up"]').should('be.visible');
      cy.get('[data-cy="monthly-revenue"]').should('be.visible');
      cy.get('[data-cy="revenue-breakdown"]').should('be.visible');
    });

    it('should show user engagement metrics', () => {
      cy.get('[data-cy="engagement-tab"]').click();
      cy.get('[data-cy="session-duration"]').should('be.visible');
      cy.get('[data-cy="page-views-chart"]').should('be.visible');
      cy.get('[data-cy="bounce-rate"]').should('be.visible');
      cy.get('[data-cy="user-retention"]').should('be.visible');
    });

    it('should handle date range filtering', () => {
      cy.get('[data-cy="date-range-picker"]').click();
      cy.get('[data-cy="last-30-days"]').click();
      
      cy.get('[data-cy="loading-indicator"]').should('be.visible');
      cy.get('[data-cy="loading-indicator"]').should('not.exist');
      cy.get('[data-cy="date-range-display"]').should('contain', '30 days');
    });
  });

  describe('User Analytics', () => {
    it('should display user registration trends', () => {
      cy.get('[data-cy="users-tab"]').click();
      cy.get('[data-cy="registration-chart"]').should('be.visible');
      cy.get('[data-cy="new-users-count"]').should('be.visible');
      cy.get('[data-cy="user-growth-rate"]').should('contain', '%');
    });

    it('should show subscription tier distribution', () => {
      cy.get('[data-cy="users-tab"]').click();
      cy.get('[data-cy="subscription-breakdown"]').should('be.visible');
      cy.get('[data-cy="foundation-tier-count"]').should('be.visible');
      cy.get('[data-cy="advanced-tier-count"]').should('be.visible');
      cy.get('[data-cy="elite-tier-count"]').should('be.visible');
    });

    it('should track user engagement by tier', () => {
      cy.get('[data-cy="users-tab"]').click();
      cy.get('[data-cy="engagement-by-tier"]').should('be.visible');
      cy.get('[data-cy="foundation-engagement"]').should('be.visible');
      cy.get('[data-cy="tier-completion-rates"]').should('be.visible');
    });

    it('should analyze churn and retention rates', () => {
      cy.get('[data-cy="retention-tab"]').click();
      cy.get('[data-cy="churn-rate"]').should('be.visible');
      cy.get('[data-cy="retention-cohort"]').should('be.visible');
      cy.get('[data-cy="churn-reasons"]').should('be.visible');
    });
  });

  describe('Content Performance Analytics', () => {
    it('should display chapter completion rates', () => {
      cy.get('[data-cy="content-tab"]').click();
      cy.get('[data-cy="chapter-completion-chart"]').should('be.visible');
      cy.get('[data-cy="completion-rates-table"]').should('be.visible');
      cy.get('[data-cy="avg-completion-time"]').should('be.visible');
    });

    it('should show template usage statistics', () => {
      cy.get('[data-cy="content-tab"]').click();
      cy.get('[data-cy="template-usage"]').should('be.visible');
      cy.get('[data-cy="popular-templates"]').should('be.visible');
      cy.get('[data-cy="template-effectiveness"]').should('be.visible');
    });

    it('should track user feedback and ratings', () => {
      cy.get('[data-cy="feedback-tab"]').click();
      cy.get('[data-cy="average-rating"]').should('be.visible');
      cy.get('[data-cy="feedback-chart"]').should('be.visible');
      cy.get('[data-cy="recent-reviews"]').should('be.visible');
    });

    it('should analyze content drop-off points', () => {
      cy.get('[data-cy="content-tab"]').click();
      cy.get('[data-cy="drop-off-analysis"]').should('be.visible');
      cy.get('[data-cy="problematic-chapters"]').should('be.visible');
      cy.get('[data-cy="improvement-suggestions"]').should('be.visible');
    });
  });

  describe('Marketing Analytics', () => {
    it('should track conversion funnel performance', () => {
      cy.get('[data-cy="marketing-tab"]').click();
      cy.get('[data-cy="conversion-funnel"]').should('be.visible');
      cy.get('[data-cy="funnel-stage-1"]').should('contain', 'Visitors');
      cy.get('[data-cy="funnel-stage-2"]').should('contain', 'Leads');
      cy.get('[data-cy="funnel-stage-3"]').should('contain', 'Customers');
    });

    it('should display traffic source analysis', () => {
      cy.get('[data-cy="marketing-tab"]').click();
      cy.get('[data-cy="traffic-sources"]').should('be.visible');
      cy.get('[data-cy="organic-traffic"]').should('be.visible');
      cy.get('[data-cy="paid-traffic"]').should('be.visible');
      cy.get('[data-cy="social-traffic"]').should('be.visible');
    });

    it('should show campaign performance metrics', () => {
      cy.get('[data-cy="campaigns-tab"]').click();
      cy.get('[data-cy="campaign-list"]').should('be.visible');
      cy.get('[data-cy="campaign-roi"]').should('be.visible');
      cy.get('[data-cy="campaign-conversions"]').should('be.visible');
    });

    it('should calculate customer acquisition cost', () => {
      cy.get('[data-cy="marketing-tab"]').click();
      cy.get('[data-cy="cac-metric"]').should('be.visible');
      cy.get('[data-cy="ltv-cac-ratio"]').should('be.visible');
      cy.get('[data-cy="payback-period"]').should('be.visible');
    });
  });

  describe('Custom Reports and Exports', () => {
    it('should generate custom date range reports', () => {
      cy.get('[data-cy="reports-tab"]').click();
      cy.get('[data-cy="custom-report-btn"]').click();
      
      cy.get('[data-cy="start-date-input"]').type('2024-01-01');
      cy.get('[data-cy="end-date-input"]').type('2024-12-31');
      cy.get('[data-cy="generate-report-btn"]').click();
      
      cy.get('[data-cy="custom-report-results"]').should('be.visible');
    });

    it('should export data in multiple formats', () => {
      cy.get('[data-cy="export-dropdown"]').click();
      cy.get('[data-cy="export-csv"]').click();
      
      cy.readFile('cypress/downloads/analytics-export.csv').should('exist');
    });

    it('should schedule automated report delivery', () => {
      cy.get('[data-cy="reports-tab"]').click();
      cy.get('[data-cy="schedule-report-btn"]').click();
      
      cy.get('[data-cy="report-frequency-select"]').select('Weekly');
      cy.get('[data-cy="email-recipients-input"]').type('admin@amysoft.tech');
      cy.get('[data-cy="save-schedule-btn"]').click();
      
      cy.get('[data-cy="scheduled-reports-list"]').should('contain', 'Weekly');
    });

    it('should create and save custom dashboard views', () => {
      cy.get('[data-cy="customize-dashboard-btn"]').click();
      cy.get('[data-cy="add-widget-btn"]').click();
      cy.get('[data-cy="widget-type-select"]').select('Revenue Chart');
      cy.get('[data-cy="add-widget-confirm"]').click();
      
      cy.get('[data-cy="save-dashboard-btn"]').click();
      cy.get('[data-cy="dashboard-name-input"]').type('Executive Dashboard');
      cy.get('[data-cy="save-custom-dashboard"]').click();
      
      cy.get('[data-cy="dashboard-selector"]').should('contain', 'Executive Dashboard');
    });
  });

  describe('Performance and Data Accuracy', () => {
    it('should load analytics data within acceptable time limits', () => {
      const startTime = Date.now();
      cy.visit('/admin/analytics');
      cy.get('[data-cy="kpi-cards"]').should('be.visible');
      
      cy.then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(3000); // 3 second load time
      });
    });

    it('should validate data accuracy against known test data', () => {
      cy.task('db:seed').then(() => {
        cy.visit('/admin/analytics');
        
        // Verify test data metrics match expected values
        cy.get('[data-cy="total-users"]').should('contain', '150'); // From test seed
        cy.get('[data-cy="revenue-total"]').should('contain', '$3,742.50'); // From test seed
      });
    });

    it('should handle large datasets without performance degradation', () => {
      cy.get('[data-cy="date-range-picker"]').click();
      cy.get('[data-cy="all-time"]').click();
      
      cy.get('[data-cy="loading-indicator"]').should('be.visible');
      cy.get('[data-cy="analytics-content"]', { timeout: 10000 }).should('be.visible');
      cy.get('[data-cy="performance-warning"]').should('not.exist');
    });

    it('should refresh data automatically and show real-time updates', () => {
      cy.get('[data-cy="auto-refresh-toggle"]').should('be.checked');
      
      const initialValue = cy.get('[data-cy="active-users"]').invoke('text');
      cy.wait(30000); // Wait for auto-refresh
      
      cy.get('[data-cy="active-users"]').invoke('text').should('not.equal', initialValue);
      cy.get('[data-cy="last-updated"]').should('contain', 'Just now');
    });
  });
});