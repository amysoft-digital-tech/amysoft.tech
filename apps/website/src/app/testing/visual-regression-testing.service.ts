import { Injectable } from '@angular/core';

export interface VisualRegressionConfig {
  component: string;
  selectors: string[];
  viewports: ViewportConfig[];
  states: StateConfig[];
  thresholds: ThresholdConfig;
}

export interface ViewportConfig {
  name: string;
  width: number;
  height: number;
}

export interface StateConfig {
  name: string;
  actions?: Action[];
  waitConditions?: WaitCondition[];
}

export interface Action {
  type: 'click' | 'hover' | 'focus' | 'scroll' | 'type';
  selector: string;
  value?: string;
}

export interface WaitCondition {
  type: 'element' | 'timeout' | 'networkIdle';
  selector?: string;
  timeout?: number;
}

export interface ThresholdConfig {
  mismatchPercentage: number;
  pixelThreshold: number;
  globalThreshold: number;
}

export interface VisualTest {
  id: string;
  name: string;
  baseline: string;
  current: string;
  diff?: string;
  passed: boolean;
  mismatchPercentage: number;
  pixelDiff: number;
}

export interface VisualTestResult {
  testSuite: string;
  timestamp: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  overallScore: number;
  tests: VisualTest[];
  summary: string;
}

@Injectable({
  providedIn: 'root'
})
export class VisualRegressionTestingService {

  private readonly defaultViewports: ViewportConfig[] = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 800 },
    { name: 'large-desktop', width: 1920, height: 1080 }
  ];

  private readonly defaultThresholds: ThresholdConfig = {
    mismatchPercentage: 0.05, // 0.05% difference allowed
    pixelThreshold: 50,       // Individual pixel difference threshold
    globalThreshold: 0.1      // Global difference threshold
  };

  constructor() {}

  /**
   * Generate visual regression test configurations for brand elements
   */
  generateBrandElementTestConfigs(): VisualRegressionConfig[] {
    return [
      // Header component testing
      {
        component: 'header',
        selectors: ['header', '.nav-link', '.logo', '.mobile-menu'],
        viewports: this.defaultViewports,
        states: [
          { name: 'default' },
          { name: 'scrolled', actions: [{ type: 'scroll', selector: 'body', value: '100' }] },
          { name: 'mobile-menu-open', actions: [{ type: 'click', selector: '.mobile-menu-toggle' }] },
          { name: 'dropdown-open', actions: [{ type: 'hover', selector: '.nav-dropdown-trigger' }] }
        ],
        thresholds: this.defaultThresholds
      },

      // Button component testing
      {
        component: 'buttons',
        selectors: ['.btn-primary', '.btn-secondary', '.btn-outline', '.btn-ghost'],
        viewports: this.defaultViewports,
        states: [
          { name: 'default' },
          { name: 'hover', actions: [{ type: 'hover', selector: '.btn-primary' }] },
          { name: 'focus', actions: [{ type: 'focus', selector: '.btn-primary' }] },
          { name: 'disabled' }
        ],
        thresholds: this.defaultThresholds
      },

      // Card component testing
      {
        component: 'cards',
        selectors: ['.card', '.pricing-card', '.testimonial-card', '.feature-card'],
        viewports: this.defaultViewports,
        states: [
          { name: 'default' },
          { name: 'hover', actions: [{ type: 'hover', selector: '.card' }] },
          { name: 'focused' }
        ],
        thresholds: this.defaultThresholds
      },

      // Form component testing
      {
        component: 'forms',
        selectors: ['input', 'textarea', 'select', '.form-group', '.lead-capture-form'],
        viewports: this.defaultViewports,
        states: [
          { name: 'default' },
          { name: 'focused', actions: [{ type: 'focus', selector: 'input[type="email"]' }] },
          { name: 'filled', actions: [{ type: 'type', selector: 'input[type="email"]', value: 'test@example.com' }] },
          { name: 'error' },
          { name: 'success' }
        ],
        thresholds: this.defaultThresholds
      },

      // Typography testing
      {
        component: 'typography',
        selectors: ['h1', 'h2', 'h3', 'p', '.lead', '.small', 'code', 'pre'],
        viewports: this.defaultViewports,
        states: [
          { name: 'default' },
          { name: 'long-content' },
          { name: 'mixed-content' }
        ],
        thresholds: { ...this.defaultThresholds, mismatchPercentage: 0.02 } // Stricter for typography
      },

      // Logo and branding elements
      {
        component: 'branding',
        selectors: ['.logo', '.brand-mark', '.footer-logo', '.favicon'],
        viewports: this.defaultViewports,
        states: [
          { name: 'default' },
          { name: 'dark-mode' },
          { name: 'high-contrast' }
        ],
        thresholds: { ...this.defaultThresholds, mismatchPercentage: 0.01 } // Very strict for logos
      },

      // Color palette testing
      {
        component: 'color-palette',
        selectors: ['.color-swatch', '.brand-colors', '.accent-colors', '.neutral-colors'],
        viewports: [{ name: 'reference', width: 800, height: 600 }],
        states: [{ name: 'default' }],
        thresholds: { ...this.defaultThresholds, mismatchPercentage: 0 } // No difference allowed for colors
      },

      // Page layouts
      {
        component: 'page-layouts',
        selectors: ['main', '.hero-section', '.features-section', '.pricing-section', '.footer'],
        viewports: this.defaultViewports,
        states: [
          { name: 'default' },
          { name: 'loaded', waitConditions: [{ type: 'networkIdle', timeout: 2000 }] }
        ],
        thresholds: this.defaultThresholds
      }
    ];
  }

  /**
   * Run visual regression tests for brand compliance
   */
  async runBrandVisualTests(): Promise<VisualTestResult> {
    const configs = this.generateBrandElementTestConfigs();
    const allTests: VisualTest[] = [];
    let totalTests = 0;
    let passedTests = 0;

    for (const config of configs) {
      const configTests = await this.runConfigTests(config);
      allTests.push(...configTests);
      totalTests += configTests.length;
      passedTests += configTests.filter(t => t.passed).length;
    }

    const failedTests = totalTests - passedTests;
    const overallScore = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    return {
      testSuite: 'Brand Visual Regression',
      timestamp: new Date().toISOString(),
      totalTests,
      passedTests,
      failedTests,
      overallScore,
      tests: allTests,
      summary: this.generateTestSummary(totalTests, passedTests, failedTests, overallScore)
    };
  }

  /**
   * Run tests for a specific configuration
   */
  private async runConfigTests(config: VisualRegressionConfig): Promise<VisualTest[]> {
    const tests: VisualTest[] = [];

    for (const viewport of config.viewports) {
      for (const state of config.states) {
        for (const selector of config.selectors) {
          const test = await this.runSingleVisualTest(config, viewport, state, selector);
          tests.push(test);
        }
      }
    }

    return tests;
  }

  /**
   * Run a single visual test
   */
  private async runSingleVisualTest(
    config: VisualRegressionConfig,
    viewport: ViewportConfig,
    state: StateConfig,
    selector: string
  ): Promise<VisualTest> {
    const testId = `${config.component}-${viewport.name}-${state.name}-${selector.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const testName = `${config.component} > ${selector} @ ${viewport.name} (${state.name})`;

    try {
      // In a real implementation, this would:
      // 1. Set viewport size
      // 2. Execute state actions
      // 3. Wait for conditions
      // 4. Capture screenshot
      // 5. Compare with baseline
      // 6. Calculate differences

      // For now, simulate the test result
      const mismatchPercentage = Math.random() * 0.1; // Random for demo
      const pixelDiff = Math.floor(mismatchPercentage * 1000);
      const passed = mismatchPercentage <= config.thresholds.mismatchPercentage;

      return {
        id: testId,
        name: testName,
        baseline: `baselines/${testId}.png`,
        current: `current/${testId}.png`,
        diff: passed ? undefined : `diff/${testId}.png`,
        passed,
        mismatchPercentage: mismatchPercentage * 100,
        pixelDiff
      };
    } catch (error) {
      return {
        id: testId,
        name: testName,
        baseline: 'error',
        current: 'error',
        passed: false,
        mismatchPercentage: 100,
        pixelDiff: -1
      };
    }
  }

  /**
   * Generate test summary
   */
  private generateTestSummary(total: number, passed: number, failed: number, score: number): string {
    if (failed === 0) {
      return `🎉 All ${total} visual tests passed! Brand consistency is maintained.`;
    } else if (score >= 90) {
      return `✅ Excellent visual consistency: ${passed}/${total} tests passed (${score.toFixed(1)}%). Minor issues detected.`;
    } else if (score >= 75) {
      return `⚠️ Good visual consistency: ${passed}/${total} tests passed (${score.toFixed(1)}%). Some brand elements need attention.`;
    } else if (score >= 50) {
      return `🔧 Visual inconsistencies detected: ${passed}/${total} tests passed (${score.toFixed(1)}%). Brand compliance needs improvement.`;
    } else {
      return `🚨 Significant visual regressions: ${passed}/${total} tests passed (${score.toFixed(1)}%). Immediate attention required.`;
    }
  }

  /**
   * Create baseline images for new tests
   */
  async createBaselines(): Promise<{ created: number; errors: string[] }> {
    const configs = this.generateBrandElementTestConfigs();
    let created = 0;
    const errors: string[] = [];

    for (const config of configs) {
      for (const viewport of config.viewports) {
        for (const state of config.states) {
          for (const selector of config.selectors) {
            try {
              // In a real implementation, this would capture baseline screenshots
              created++;
            } catch (error) {
              errors.push(`Failed to create baseline for ${config.component}/${selector}: ${error}`);
            }
          }
        }
      }
    }

    return { created, errors };
  }

  /**
   * Update baseline images after approved changes
   */
  async updateBaselines(testIds: string[]): Promise<{ updated: number; errors: string[] }> {
    let updated = 0;
    const errors: string[] = [];

    for (const testId of testIds) {
      try {
        // In a real implementation, this would update baseline screenshots
        updated++;
      } catch (error) {
        errors.push(`Failed to update baseline for ${testId}: ${error}`);
      }
    }

    return { updated, errors };
  }

  /**
   * Generate visual regression testing configuration file
   */
  generateConfigFile(): string {
    const configs = this.generateBrandElementTestConfigs();
    
    return JSON.stringify({
      version: '1.0.0',
      name: 'Brand Visual Regression Tests',
      baseUrl: 'http://localhost:4200',
      outputDir: './visual-test-results',
      baselineDir: './visual-baselines',
      configs: configs,
      globalSettings: {
        captureSettings: {
          fullPage: false,
          omitBackground: false,
          quality: 90,
          format: 'png'
        },
        comparisonSettings: {
          threshold: 0.05,
          includeAA: true,
          alpha: 0.1,
          antialiasing: true
        },
        retrySettings: {
          maxRetries: 3,
          retryDelay: 1000
        }
      },
      reporting: {
        formats: ['html', 'json', 'junit'],
        outputPath: './visual-test-reports',
        includeScreenshots: true,
        includeDiffs: true
      }
    }, null, 2);
  }

  /**
   * Generate Playwright test file for visual regression
   */
  generatePlaywrightTestFile(): string {
    return `
import { test, expect } from '@playwright/test';

// Visual regression tests for brand compliance
${this.generateBrandElementTestConfigs().map(config => `
test.describe('${config.component} visual tests', () => {
  ${config.viewports.map(viewport => `
  test.describe('${viewport.name} viewport', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: ${viewport.width}, height: ${viewport.height} });
      await page.goto('/');
    });

    ${config.states.map(state => `
    ${config.selectors.map(selector => `
    test('${selector} - ${state.name}', async ({ page }) => {
      ${state.actions ? state.actions.map(action => {
        switch (action.type) {
          case 'click':
            return `await page.click('${action.selector}');`;
          case 'hover':
            return `await page.hover('${action.selector}');`;
          case 'focus':
            return `await page.focus('${action.selector}');`;
          case 'type':
            return `await page.fill('${action.selector}', '${action.value}');`;
          case 'scroll':
            return `await page.evaluate(() => window.scrollTo(0, ${action.value}));`;
          default:
            return '';
        }
      }).join('\n      ') : ''}
      
      ${state.waitConditions ? state.waitConditions.map(wait => {
        switch (wait.type) {
          case 'element':
            return `await page.waitForSelector('${wait.selector}');`;
          case 'timeout':
            return `await page.waitForTimeout(${wait.timeout});`;
          case 'networkIdle':
            return `await page.waitForLoadState('networkidle');`;
          default:
            return '';
        }
      }).join('\n      ') : ''}
      
      const element = page.locator('${selector}');
      await expect(element).toHaveScreenshot('${config.component}-${viewport.name}-${state.name}-${selector.replace(/[^a-zA-Z0-9]/g, '_')}.png', {
        threshold: ${config.thresholds.mismatchPercentage}
      });
    });
    `).join('')}
    `).join('')}
  });
  `).join('')}
});
`).join('')}

// Color palette visual tests
test.describe('Color palette tests', () => {
  test('brand color consistency', async ({ page }) => {
    await page.goto('/style-guide'); // Assuming a style guide page exists
    
    const colorPalette = page.locator('.color-palette');
    await expect(colorPalette).toHaveScreenshot('color-palette.png', {
      threshold: 0
    });
  });
});

// Typography visual tests
test.describe('Typography tests', () => {
  test('font rendering consistency', async ({ page }) => {
    await page.goto('/typography-test'); // Assuming a typography test page exists
    
    const typography = page.locator('.typography-samples');
    await expect(typography).toHaveScreenshot('typography.png', {
      threshold: 0.02
    });
  });
});
`;
  }

  /**
   * Generate Cypress visual testing commands
   */
  generateCypressCommands(): string {
    return `
// Custom Cypress commands for visual regression testing

Cypress.Commands.add('visualTest', (name, options = {}) => {
  const defaultOptions = {
    threshold: 0.05,
    thresholdType: 'percent',
    capture: 'viewport',
    ...options
  };

  cy.matchImageSnapshot(name, defaultOptions);
});

Cypress.Commands.add('visualTestElement', (selector, name, options = {}) => {
  cy.get(selector).matchImageSnapshot(name, {
    threshold: 0.05,
    thresholdType: 'percent',
    ...options
  });
});

// Brand-specific testing commands
Cypress.Commands.add('testBrandColors', () => {
  const brandColors = [
    'brand-50', 'brand-100', 'brand-500', 'brand-600', 'brand-700',
    'accent-50', 'accent-100', 'accent-500', 'accent-600',
    'neutral-50', 'neutral-100', 'neutral-700', 'neutral-800', 'neutral-900'
  ];

  brandColors.forEach(color => {
    cy.get(\`[class*="\${color}"]\`).should('exist');
  });
});

Cypress.Commands.add('testTypography', () => {
  const elements = ['h1', 'h2', 'h3', 'p', 'button', 'code'];
  
  elements.forEach(element => {
    cy.get(element).first().should('have.css', 'font-family').and('include', 'Inter');
  });
});

Cypress.Commands.add('testLogo', (placement) => {
  cy.get(\`[data-logo-placement="\${placement}"]\`)
    .should('be.visible')
    .and('have.css', 'min-width')
    .and('not.equal', '0px');
});

// Usage examples:
//
// cy.visit('/');
// cy.visualTest('homepage-full');
// cy.visualTestElement('.header', 'header-component');
// cy.testBrandColors();
// cy.testTypography();
// cy.testLogo('header-main');
`;
  }
}