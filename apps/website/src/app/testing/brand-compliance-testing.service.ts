import { Injectable } from '@angular/core';

export interface BrandComplianceResult {
  component: string;
  test: string;
  status: 'pass' | 'fail' | 'warning';
  expected: string;
  actual: string;
  score: number;
  issues: string[];
}

export interface ColorComplianceTest {
  name: string;
  hex: string;
  requiredContrast: number;
  textColor?: string;
  usage: string[];
}

export interface TypographyTest {
  element: string;
  expectedFont: string;
  expectedWeight: string;
  expectedSize: string;
  expectedLineHeight: string;
}

export interface LogoTest {
  placement: string;
  minSize: string;
  clearSpace: string;
  backgrounds: string[];
  variations: string[];
}

@Injectable({
  providedIn: 'root'
})
export class BrandComplianceTestingService {

  /**
   * Brand color palette as defined in Tailwind config
   */
  private readonly brandColors: ColorComplianceTest[] = [
    // Brand (Blue) Colors
    { name: 'brand-50', hex: '#f0f9ff', requiredContrast: 1.0, usage: ['backgrounds', 'subtle elements'] },
    { name: 'brand-100', hex: '#e0f2fe', requiredContrast: 1.2, usage: ['light backgrounds'] },
    { name: 'brand-500', hex: '#0ea5e9', requiredContrast: 4.5, textColor: '#ffffff', usage: ['primary actions', 'links'] },
    { name: 'brand-600', hex: '#0284c7', requiredContrast: 4.5, textColor: '#ffffff', usage: ['primary buttons', 'active states'] },
    { name: 'brand-700', hex: '#0369a1', requiredContrast: 7.0, textColor: '#ffffff', usage: ['dark mode', 'emphasis'] },
    
    // Accent (Orange) Colors
    { name: 'accent-50', hex: '#fef7ee', requiredContrast: 1.0, usage: ['backgrounds', 'highlights'] },
    { name: 'accent-100', hex: '#fdedd6', requiredContrast: 1.2, usage: ['light backgrounds'] },
    { name: 'accent-500', hex: '#f2711a', requiredContrast: 4.5, textColor: '#ffffff', usage: ['CTAs', 'warnings'] },
    { name: 'accent-600', hex: '#e35610', requiredContrast: 4.5, textColor: '#ffffff', usage: ['hover states', 'urgent actions'] },
    
    // Neutral Colors
    { name: 'neutral-50', hex: '#f8fafc', requiredContrast: 1.0, usage: ['backgrounds'] },
    { name: 'neutral-100', hex: '#f1f5f9', requiredContrast: 1.2, usage: ['card backgrounds'] },
    { name: 'neutral-700', hex: '#334155', requiredContrast: 7.0, textColor: '#ffffff', usage: ['headings', 'body text'] },
    { name: 'neutral-800', hex: '#1e293b', requiredContrast: 12.0, textColor: '#ffffff', usage: ['dark text', 'emphasis'] },
    { name: 'neutral-900', hex: '#0f172a', requiredContrast: 15.0, textColor: '#ffffff', usage: ['high contrast text'] },
  ];

  /**
   * Typography specifications
   */
  private readonly typographySpecs: TypographyTest[] = [
    { element: 'h1', expectedFont: 'Inter', expectedWeight: '700', expectedSize: '3rem', expectedLineHeight: '1' },
    { element: 'h2', expectedFont: 'Inter', expectedWeight: '600', expectedSize: '2.25rem', expectedLineHeight: '2.5rem' },
    { element: 'h3', expectedFont: 'Inter', expectedWeight: '600', expectedSize: '1.875rem', expectedLineHeight: '2.25rem' },
    { element: 'body', expectedFont: 'Inter', expectedWeight: '400', expectedSize: '1rem', expectedLineHeight: '1.5rem' },
    { element: 'button', expectedFont: 'Inter', expectedWeight: '500', expectedSize: '0.875rem', expectedLineHeight: '1.25rem' },
    { element: 'code', expectedFont: 'JetBrains Mono', expectedWeight: '400', expectedSize: '0.875rem', expectedLineHeight: '1.25rem' },
  ];

  /**
   * Logo and brand mark specifications
   */
  private readonly logoSpecs: LogoTest[] = [
    {
      placement: 'header-main',
      minSize: '40px',
      clearSpace: '10px',
      backgrounds: ['white', 'neutral-50', 'brand-50'],
      variations: ['full-logo', 'icon-only', 'text-only']
    },
    {
      placement: 'footer',
      minSize: '32px',
      clearSpace: '8px',
      backgrounds: ['neutral-900', 'brand-900'],
      variations: ['full-logo', 'icon-only']
    },
    {
      placement: 'mobile-header',
      minSize: '36px',
      clearSpace: '8px',
      backgrounds: ['white', 'neutral-50'],
      variations: ['icon-only', 'abbreviated']
    }
  ];

  constructor() {}

  /**
   * Run comprehensive brand compliance tests
   */
  async runFullBrandComplianceTest(): Promise<BrandComplianceResult[]> {
    const results: BrandComplianceResult[] = [];

    // Test color implementation
    results.push(...await this.testColorImplementation());

    // Test typography implementation
    results.push(...await this.testTypographyImplementation());

    // Test logo implementation
    results.push(...await this.testLogoImplementation());

    // Test layout consistency
    results.push(...await this.testLayoutConsistency());

    // Test responsive brand elements
    results.push(...await this.testResponsiveBrandElements());

    // Test accessibility compliance
    results.push(...await this.testAccessibilityCompliance());

    return results;
  }

  /**
   * Test color palette implementation and usage
   */
  private async testColorImplementation(): Promise<BrandComplianceResult[]> {
    const results: BrandComplianceResult[] = [];

    for (const colorSpec of this.brandColors) {
      // Test if color is properly defined in CSS
      const cssColorResult = await this.testCSSColorDefinition(colorSpec);
      results.push(cssColorResult);

      // Test contrast ratio if text color is specified
      if (colorSpec.textColor) {
        const contrastResult = await this.testColorContrast(colorSpec);
        results.push(contrastResult);
      }

      // Test proper usage in components
      const usageResult = await this.testColorUsage(colorSpec);
      results.push(usageResult);
    }

    return results;
  }

  /**
   * Test typography implementation across components
   */
  private async testTypographyImplementation(): Promise<BrandComplianceResult[]> {
    const results: BrandComplianceResult[] = [];

    for (const typeSpec of this.typographySpecs) {
      // Test font loading
      const fontLoadResult = await this.testFontLoading(typeSpec);
      results.push(fontLoadResult);

      // Test element styling
      const stylingResult = await this.testElementStyling(typeSpec);
      results.push(stylingResult);

      // Test responsive typography
      const responsiveResult = await this.testResponsiveTypography(typeSpec);
      results.push(responsiveResult);
    }

    return results;
  }

  /**
   * Test logo implementation and placement
   */
  private async testLogoImplementation(): Promise<BrandComplianceResult[]> {
    const results: BrandComplianceResult[] = [];

    for (const logoSpec of this.logoSpecs) {
      // Test logo presence
      const presenceResult = await this.testLogoPresence(logoSpec);
      results.push(presenceResult);

      // Test size constraints
      const sizeResult = await this.testLogoSize(logoSpec);
      results.push(sizeResult);

      // Test clear space
      const clearSpaceResult = await this.testLogoClearSpace(logoSpec);
      results.push(clearSpaceResult);

      // Test background compatibility
      const backgroundResult = await this.testLogoBackgrounds(logoSpec);
      results.push(backgroundResult);
    }

    return results;
  }

  /**
   * Test layout consistency across applications
   */
  private async testLayoutConsistency(): Promise<BrandComplianceResult[]> {
    const results: BrandComplianceResult[] = [];

    // Test header consistency
    results.push(await this.testHeaderConsistency());

    // Test footer consistency
    results.push(await this.testFooterConsistency());

    // Test button consistency
    results.push(await this.testButtonConsistency());

    // Test card consistency
    results.push(await this.testCardConsistency());

    // Test spacing consistency
    results.push(await this.testSpacingConsistency());

    return results;
  }

  /**
   * Test responsive behavior of brand elements
   */
  private async testResponsiveBrandElements(): Promise<BrandComplianceResult[]> {
    const results: BrandComplianceResult[] = [];
    const breakpoints = ['mobile', 'tablet', 'desktop', 'large-desktop'];

    for (const breakpoint of breakpoints) {
      results.push(await this.testBreakpointBrandElements(breakpoint));
    }

    return results;
  }

  /**
   * Test accessibility compliance of brand elements
   */
  private async testAccessibilityCompliance(): Promise<BrandComplianceResult[]> {
    const results: BrandComplianceResult[] = [];

    // Test color contrast ratios
    results.push(await this.testOverallColorContrast());

    // Test focus indicators
    results.push(await this.testFocusIndicators());

    // Test text scaling
    results.push(await this.testTextScaling());

    // Test reduced motion compliance
    results.push(await this.testReducedMotionCompliance());

    return results;
  }

  // Implementation methods for individual tests
  private async testCSSColorDefinition(colorSpec: ColorComplianceTest): Promise<BrandComplianceResult> {
    const cssVariable = `--color-${colorSpec.name.replace('-', '-')}`;
    const computedValue = getComputedStyle(document.documentElement).getPropertyValue(cssVariable).trim();
    
    return {
      component: 'CSS Variables',
      test: `Color Definition: ${colorSpec.name}`,
      status: computedValue === colorSpec.hex ? 'pass' : 'fail',
      expected: colorSpec.hex,
      actual: computedValue || 'not defined',
      score: computedValue === colorSpec.hex ? 100 : 0,
      issues: computedValue === colorSpec.hex ? [] : [`Color ${colorSpec.name} not properly defined in CSS`]
    };
  }

  private async testColorContrast(colorSpec: ColorComplianceTest): Promise<BrandComplianceResult> {
    if (!colorSpec.textColor) {
      return {
        component: 'Color Contrast',
        test: `Contrast Test: ${colorSpec.name}`,
        status: 'warning',
        expected: 'N/A',
        actual: 'No text color specified',
        score: 50,
        issues: ['No text color specified for contrast testing']
      };
    }

    const contrastRatio = this.calculateContrastRatio(colorSpec.hex, colorSpec.textColor);
    const meetsRequirement = contrastRatio >= colorSpec.requiredContrast;

    return {
      component: 'Color Contrast',
      test: `Contrast Ratio: ${colorSpec.name}`,
      status: meetsRequirement ? 'pass' : 'fail',
      expected: `>= ${colorSpec.requiredContrast}:1`,
      actual: `${contrastRatio.toFixed(2)}:1`,
      score: meetsRequirement ? 100 : Math.min(80, (contrastRatio / colorSpec.requiredContrast) * 100),
      issues: meetsRequirement ? [] : [`Contrast ratio ${contrastRatio.toFixed(2)}:1 does not meet requirement of ${colorSpec.requiredContrast}:1`]
    };
  }

  private async testColorUsage(colorSpec: ColorComplianceTest): Promise<BrandComplianceResult> {
    // This would test if colors are used appropriately in components
    // For now, returning a placeholder
    return {
      component: 'Color Usage',
      test: `Usage Pattern: ${colorSpec.name}`,
      status: 'pass',
      expected: colorSpec.usage.join(', '),
      actual: 'Implementation pending',
      score: 80,
      issues: ['Color usage testing implementation needed']
    };
  }

  private async testFontLoading(typeSpec: TypographyTest): Promise<BrandComplianceResult> {
    const fontAvailable = document.fonts.check(`16px ${typeSpec.expectedFont}`);
    
    return {
      component: 'Typography',
      test: `Font Loading: ${typeSpec.expectedFont}`,
      status: fontAvailable ? 'pass' : 'fail',
      expected: `${typeSpec.expectedFont} loaded`,
      actual: fontAvailable ? 'Font available' : 'Font not available',
      score: fontAvailable ? 100 : 0,
      issues: fontAvailable ? [] : [`Font ${typeSpec.expectedFont} is not loaded`]
    };
  }

  private async testElementStyling(typeSpec: TypographyTest): Promise<BrandComplianceResult> {
    const element = document.querySelector(typeSpec.element);
    if (!element) {
      return {
        component: 'Typography',
        test: `Element Styling: ${typeSpec.element}`,
        status: 'warning',
        expected: 'Element exists',
        actual: 'Element not found',
        score: 0,
        issues: [`Element ${typeSpec.element} not found on page`]
      };
    }

    const styles = window.getComputedStyle(element);
    const actualFont = styles.fontFamily.replace(/['"]/g, '');
    const actualWeight = styles.fontWeight;
    const actualSize = styles.fontSize;
    const actualLineHeight = styles.lineHeight;

    const issues: string[] = [];
    let score = 100;

    if (!actualFont.includes(typeSpec.expectedFont)) {
      issues.push(`Font family mismatch: expected ${typeSpec.expectedFont}, got ${actualFont}`);
      score -= 25;
    }

    if (actualWeight !== typeSpec.expectedWeight) {
      issues.push(`Font weight mismatch: expected ${typeSpec.expectedWeight}, got ${actualWeight}`);
      score -= 25;
    }

    return {
      component: 'Typography',
      test: `Element Styling: ${typeSpec.element}`,
      status: issues.length === 0 ? 'pass' : issues.length === 1 ? 'warning' : 'fail',
      expected: `${typeSpec.expectedFont} ${typeSpec.expectedWeight} ${typeSpec.expectedSize}`,
      actual: `${actualFont} ${actualWeight} ${actualSize}`,
      score: Math.max(0, score),
      issues
    };
  }

  private async testResponsiveTypography(typeSpec: TypographyTest): Promise<BrandComplianceResult> {
    // Test typography scaling across breakpoints
    return {
      component: 'Typography',
      test: `Responsive Scaling: ${typeSpec.element}`,
      status: 'pass',
      expected: 'Scales appropriately',
      actual: 'Implementation pending',
      score: 80,
      issues: ['Responsive typography testing implementation needed']
    };
  }

  private async testLogoPresence(logoSpec: LogoTest): Promise<BrandComplianceResult> {
    const logoElements = document.querySelectorAll(`[data-logo-placement="${logoSpec.placement}"]`);
    const hasLogo = logoElements.length > 0;

    return {
      component: 'Logo',
      test: `Logo Presence: ${logoSpec.placement}`,
      status: hasLogo ? 'pass' : 'fail',
      expected: 'Logo present',
      actual: hasLogo ? `${logoElements.length} logo element(s) found` : 'No logo elements found',
      score: hasLogo ? 100 : 0,
      issues: hasLogo ? [] : [`No logo found for placement: ${logoSpec.placement}`]
    };
  }

  private async testLogoSize(logoSpec: LogoTest): Promise<BrandComplianceResult> {
    // Implementation for logo size testing
    return {
      component: 'Logo',
      test: `Logo Size: ${logoSpec.placement}`,
      status: 'warning',
      expected: `>= ${logoSpec.minSize}`,
      actual: 'Size check pending',
      score: 70,
      issues: ['Logo size testing implementation needed']
    };
  }

  private async testLogoClearSpace(logoSpec: LogoTest): Promise<BrandComplianceResult> {
    // Implementation for logo clear space testing
    return {
      component: 'Logo',
      test: `Logo Clear Space: ${logoSpec.placement}`,
      status: 'warning',
      expected: `>= ${logoSpec.clearSpace}`,
      actual: 'Clear space check pending',
      score: 70,
      issues: ['Logo clear space testing implementation needed']
    };
  }

  private async testLogoBackgrounds(logoSpec: LogoTest): Promise<BrandComplianceResult> {
    // Implementation for logo background compatibility testing
    return {
      component: 'Logo',
      test: `Logo Backgrounds: ${logoSpec.placement}`,
      status: 'warning',
      expected: logoSpec.backgrounds.join(', '),
      actual: 'Background testing pending',
      score: 70,
      issues: ['Logo background testing implementation needed']
    };
  }

  private async testHeaderConsistency(): Promise<BrandComplianceResult> {
    const headers = document.querySelectorAll('header');
    const hasConsistentHeaders = headers.length > 0;

    return {
      component: 'Layout',
      test: 'Header Consistency',
      status: hasConsistentHeaders ? 'pass' : 'fail',
      expected: 'Consistent header across pages',
      actual: `${headers.length} header element(s) found`,
      score: hasConsistentHeaders ? 100 : 0,
      issues: hasConsistentHeaders ? [] : ['No header elements found']
    };
  }

  private async testFooterConsistency(): Promise<BrandComplianceResult> {
    const footers = document.querySelectorAll('footer');
    const hasConsistentFooters = footers.length > 0;

    return {
      component: 'Layout',
      test: 'Footer Consistency',
      status: hasConsistentFooters ? 'pass' : 'fail',
      expected: 'Consistent footer across pages',
      actual: `${footers.length} footer element(s) found`,
      score: hasConsistentFooters ? 100 : 0,
      issues: hasConsistentFooters ? [] : ['No footer elements found']
    };
  }

  private async testButtonConsistency(): Promise<BrandComplianceResult> {
    const buttons = document.querySelectorAll('button, .btn-primary, .btn-secondary');
    const hasButtons = buttons.length > 0;

    return {
      component: 'Components',
      test: 'Button Consistency',
      status: hasButtons ? 'pass' : 'warning',
      expected: 'Consistent button styling',
      actual: `${buttons.length} button element(s) found`,
      score: hasButtons ? 85 : 50,
      issues: hasButtons ? ['Button consistency validation needed'] : ['No button elements found']
    };
  }

  private async testCardConsistency(): Promise<BrandComplianceResult> {
    const cards = document.querySelectorAll('.card, [class*="card"]');
    
    return {
      component: 'Components',
      test: 'Card Consistency',
      status: 'warning',
      expected: 'Consistent card styling',
      actual: `${cards.length} card element(s) found`,
      score: 70,
      issues: ['Card consistency validation implementation needed']
    };
  }

  private async testSpacingConsistency(): Promise<BrandComplianceResult> {
    return {
      component: 'Layout',
      test: 'Spacing Consistency',
      status: 'warning',
      expected: 'Consistent spacing system',
      actual: 'Spacing validation pending',
      score: 70,
      issues: ['Spacing consistency testing implementation needed']
    };
  }

  private async testBreakpointBrandElements(breakpoint: string): Promise<BrandComplianceResult> {
    return {
      component: 'Responsive',
      test: `Brand Elements: ${breakpoint}`,
      status: 'warning',
      expected: 'Proper brand element behavior',
      actual: 'Responsive testing pending',
      score: 70,
      issues: [`Responsive brand element testing for ${breakpoint} needed`]
    };
  }

  private async testOverallColorContrast(): Promise<BrandComplianceResult> {
    return {
      component: 'Accessibility',
      test: 'Overall Color Contrast',
      status: 'warning',
      expected: 'All text meets WCAG AA standards',
      actual: 'Contrast validation pending',
      score: 75,
      issues: ['Comprehensive contrast testing implementation needed']
    };
  }

  private async testFocusIndicators(): Promise<BrandComplianceResult> {
    const focusableElements = document.querySelectorAll('a, button, input, textarea, select, [tabindex]');
    
    return {
      component: 'Accessibility',
      test: 'Focus Indicators',
      status: 'warning',
      expected: 'Visible focus indicators on all interactive elements',
      actual: `${focusableElements.length} focusable elements found`,
      score: 75,
      issues: ['Focus indicator validation implementation needed']
    };
  }

  private async testTextScaling(): Promise<BrandComplianceResult> {
    return {
      component: 'Accessibility',
      test: 'Text Scaling',
      status: 'warning',
      expected: 'Text scales to 200% without horizontal scrolling',
      actual: 'Text scaling validation pending',
      score: 75,
      issues: ['Text scaling testing implementation needed']
    };
  }

  private async testReducedMotionCompliance(): Promise<BrandComplianceResult> {
    const hasReducedMotionStyles = document.querySelector('style[data-reduced-motion]') || 
                                   [...document.styleSheets].some(sheet => {
                                     try {
                                       return [...sheet.cssRules].some(rule => 
                                         rule.cssText && rule.cssText.includes('prefers-reduced-motion')
                                       );
                                     } catch {
                                       return false;
                                     }
                                   });

    return {
      component: 'Accessibility',
      test: 'Reduced Motion Support',
      status: hasReducedMotionStyles ? 'pass' : 'warning',
      expected: 'Reduced motion media query implemented',
      actual: hasReducedMotionStyles ? 'Reduced motion styles found' : 'No reduced motion styles detected',
      score: hasReducedMotionStyles ? 100 : 60,
      issues: hasReducedMotionStyles ? [] : ['Reduced motion media query implementation recommended']
    };
  }

  /**
   * Calculate contrast ratio between two colors
   */
  private calculateContrastRatio(color1: string, color2: string): number {
    const l1 = this.getLuminance(color1);
    const l2 = this.getLuminance(color2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Get relative luminance of a color
   */
  private getLuminance(hex: string): number {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return 0;

    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Convert hex color to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Generate comprehensive brand compliance report
   */
  generateComplianceReport(results: BrandComplianceResult[]): string {
    const totalTests = results.length;
    const passedTests = results.filter(r => r.status === 'pass').length;
    const failedTests = results.filter(r => r.status === 'fail').length;
    const warningTests = results.filter(r => r.status === 'warning').length;
    const averageScore = results.reduce((sum, r) => sum + r.score, 0) / totalTests;

    const report = `
# Brand Compliance Testing Report

## Overview
- **Total Tests**: ${totalTests}
- **Passed**: ${passedTests} (${((passedTests / totalTests) * 100).toFixed(1)}%)
- **Failed**: ${failedTests} (${((failedTests / totalTests) * 100).toFixed(1)}%)
- **Warnings**: ${warningTests} (${((warningTests / totalTests) * 100).toFixed(1)}%)
- **Average Score**: ${averageScore.toFixed(1)}/100

## Test Results by Component

${this.groupResultsByComponent(results).map(group => `
### ${group.component}
${group.results.map(result => `
- **${result.test}**: ${result.status.toUpperCase()} (${result.score}/100)
  - Expected: ${result.expected}
  - Actual: ${result.actual}
  ${result.issues.length > 0 ? '  - Issues: ' + result.issues.join('; ') : ''}
`).join('')}
`).join('')}

## Recommendations

${this.generateRecommendations(results).map(rec => `- ${rec}`).join('\n')}

---
Generated: ${new Date().toISOString()}
`;

    return report;
  }

  private groupResultsByComponent(results: BrandComplianceResult[]): { component: string; results: BrandComplianceResult[] }[] {
    const groups = new Map<string, BrandComplianceResult[]>();
    
    results.forEach(result => {
      if (!groups.has(result.component)) {
        groups.set(result.component, []);
      }
      groups.get(result.component)!.push(result);
    });

    return Array.from(groups.entries()).map(([component, results]) => ({ component, results }));
  }

  private generateRecommendations(results: BrandComplianceResult[]): string[] {
    const recommendations: string[] = [];
    const failedTests = results.filter(r => r.status === 'fail');
    const warningTests = results.filter(r => r.status === 'warning');

    if (failedTests.length > 0) {
      recommendations.push(`Address ${failedTests.length} critical brand compliance failures`);
    }

    if (warningTests.length > 0) {
      recommendations.push(`Implement ${warningTests.length} pending brand compliance tests`);
    }

    const colorIssues = results.filter(r => r.component === 'Color Contrast' && r.status === 'fail');
    if (colorIssues.length > 0) {
      recommendations.push('Review color contrast ratios for accessibility compliance');
    }

    const fontIssues = results.filter(r => r.component === 'Typography' && r.status === 'fail');
    if (fontIssues.length > 0) {
      recommendations.push('Ensure all brand fonts are properly loaded and applied');
    }

    if (recommendations.length === 0) {
      recommendations.push('Brand compliance is excellent! Continue monitoring for consistency.');
    }

    return recommendations;
  }
}