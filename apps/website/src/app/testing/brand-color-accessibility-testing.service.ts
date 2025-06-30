import { Injectable } from '@angular/core';

export interface ColorAccessibilityTest {
  colorName: string;
  hexValue: string;
  contrastTests: ContrastTest[];
  colorBlindnessTests: ColorBlindnessTest[];
  overallScore: number;
  wcagCompliance: 'AAA' | 'AA' | 'fail';
  recommendations: string[];
}

export interface ContrastTest {
  backgroundColor: string;
  textColor: string;
  contrastRatio: number;
  wcagAA: boolean;
  wcagAAA: boolean;
  usage: string;
  score: number;
}

export interface ColorBlindnessTest {
  type: 'protanopia' | 'deuteranopia' | 'tritanopia' | 'monochromacy';
  simulatedColor: string;
  distinguishable: boolean;
  score: number;
  impact: 'none' | 'minor' | 'moderate' | 'severe';
}

export interface AccessibilityReport {
  overallScore: number;
  colorTests: ColorAccessibilityTest[];
  criticalIssues: string[];
  recommendations: string[];
  wcagCompliance: {
    aa: number; // percentage of tests passing
    aaa: number; // percentage of tests passing
  };
}

@Injectable({
  providedIn: 'root'
})
export class BrandColorAccessibilityTestingService {

  /**
   * Brand color palette from Tailwind config
   */
  private readonly brandColors = [
    // Brand (Blue) Colors
    { name: 'brand-50', hex: '#f0f9ff', usage: ['backgrounds', 'subtle elements'] },
    { name: 'brand-100', hex: '#e0f2fe', usage: ['light backgrounds', 'hover states'] },
    { name: 'brand-200', hex: '#bae6fd', usage: ['disabled states', 'borders'] },
    { name: 'brand-300', hex: '#7dd3fc', usage: ['placeholders', 'secondary elements'] },
    { name: 'brand-400', hex: '#38bdf8', usage: ['secondary actions', 'links'] },
    { name: 'brand-500', hex: '#0ea5e9', usage: ['primary actions', 'links', 'focus states'] },
    { name: 'brand-600', hex: '#0284c7', usage: ['primary buttons', 'active states'] },
    { name: 'brand-700', hex: '#0369a1', usage: ['dark mode', 'emphasis', 'headings'] },
    { name: 'brand-800', hex: '#075985', usage: ['high contrast', 'dark themes'] },
    { name: 'brand-900', hex: '#0c4a6e', usage: ['maximum contrast', 'dark themes'] },
    
    // Accent (Orange) Colors
    { name: 'accent-50', hex: '#fef7ee', usage: ['backgrounds', 'highlights'] },
    { name: 'accent-100', hex: '#fdedd6', usage: ['light backgrounds', 'warnings'] },
    { name: 'accent-200', hex: '#fbd6ac', usage: ['borders', 'dividers'] },
    { name: 'accent-300', hex: '#f8b977', usage: ['secondary highlights'] },
    { name: 'accent-400', hex: '#f59340', usage: ['attention grabbers'] },
    { name: 'accent-500', hex: '#f2711a', usage: ['CTAs', 'warnings', 'highlights'] },
    { name: 'accent-600', hex: '#e35610', usage: ['hover states', 'urgent actions'] },
    { name: 'accent-700', hex: '#bc4110', usage: ['dark mode accents'] },
    { name: 'accent-800', hex: '#953315', usage: ['high contrast accents'] },
    { name: 'accent-900', hex: '#772c14', usage: ['maximum contrast accents'] },
    
    // Neutral Colors
    { name: 'neutral-50', hex: '#f8fafc', usage: ['page backgrounds'] },
    { name: 'neutral-100', hex: '#f1f5f9', usage: ['card backgrounds', 'input backgrounds'] },
    { name: 'neutral-200', hex: '#e2e8f0', usage: ['borders', 'dividers'] },
    { name: 'neutral-300', hex: '#cbd5e1', usage: ['placeholders', 'disabled text'] },
    { name: 'neutral-400', hex: '#94a3b8', usage: ['secondary text', 'icons'] },
    { name: 'neutral-500', hex: '#64748b', usage: ['body text', 'descriptions'] },
    { name: 'neutral-600', hex: '#475569', usage: ['headings', 'labels'] },
    { name: 'neutral-700', hex: '#334155', usage: ['primary text', 'headings'] },
    { name: 'neutral-800', hex: '#1e293b', usage: ['dark text', 'emphasis'] },
    { name: 'neutral-900', hex: '#0f172a', usage: ['high contrast text', 'dark themes'] },
    
    // Success Colors
    { name: 'success-500', hex: '#22c55e', usage: ['success messages', 'confirmations'] },
    { name: 'success-600', hex: '#16a34a', usage: ['success buttons', 'checkmarks'] },
    
    // Warning Colors
    { name: 'warning-500', hex: '#f59e0b', usage: ['warning messages', 'cautions'] },
    { name: 'warning-600', hex: '#d97706', usage: ['warning buttons', 'alerts'] },
    
    // Danger Colors
    { name: 'danger-500', hex: '#ef4444', usage: ['error messages', 'destructive actions'] },
    { name: 'danger-600', hex: '#dc2626', usage: ['error buttons', 'critical alerts'] }
  ];

  /**
   * Common color combinations used in the application
   */
  private readonly colorCombinations = [
    // Text on backgrounds
    { text: '#ffffff', background: '#0284c7', usage: 'Primary button text' },
    { text: '#ffffff', background: '#e35610', usage: 'Accent button text' },
    { text: '#334155', background: '#ffffff', usage: 'Body text on white' },
    { text: '#0f172a', background: '#f8fafc', usage: 'Headings on light background' },
    { text: '#64748b', background: '#ffffff', usage: 'Secondary text' },
    { text: '#ffffff', background: '#0f172a', usage: 'White text on dark' },
    
    // Interactive elements
    { text: '#0ea5e9', background: '#ffffff', usage: 'Links on white' },
    { text: '#0284c7', background: '#f0f9ff', usage: 'Links on brand background' },
    { text: '#e35610', background: '#fef7ee', usage: 'Accent links' },
    
    // Status messages
    { text: '#16a34a', background: '#ffffff', usage: 'Success text' },
    { text: '#d97706', background: '#ffffff', usage: 'Warning text' },
    { text: '#dc2626', background: '#ffffff', usage: 'Error text' },
    
    // Cards and components
    { text: '#334155', background: '#f1f5f9', usage: 'Text on card background' },
    { text: '#475569', background: '#e2e8f0', usage: 'Text on borders' }
  ];

  constructor() {}

  /**
   * Run comprehensive color accessibility tests
   */
  async runColorAccessibilityTests(): Promise<AccessibilityReport> {
    const colorTests: ColorAccessibilityTest[] = [];

    for (const color of this.brandColors) {
      const test = await this.testColorAccessibility(color);
      colorTests.push(test);
    }

    const overallScore = this.calculateOverallScore(colorTests);
    const criticalIssues = this.identifyCriticalIssues(colorTests);
    const recommendations = this.generateRecommendations(colorTests);
    const wcagCompliance = this.calculateWCAGCompliance(colorTests);

    return {
      overallScore,
      colorTests,
      criticalIssues,
      recommendations,
      wcagCompliance
    };
  }

  /**
   * Test accessibility for a specific color
   */
  private async testColorAccessibility(color: { name: string; hex: string; usage: string[] }): Promise<ColorAccessibilityTest> {
    // Test contrast ratios with common combinations
    const contrastTests = this.testContrastRatios(color);
    
    // Test color blindness simulation
    const colorBlindnessTests = this.testColorBlindness(color);
    
    // Calculate overall score
    const contrastScore = contrastTests.reduce((sum, test) => sum + test.score, 0) / contrastTests.length;
    const colorBlindScore = colorBlindnessTests.reduce((sum, test) => sum + test.score, 0) / colorBlindnessTests.length;
    const overallScore = (contrastScore + colorBlindScore) / 2;
    
    // Determine WCAG compliance
    const wcagCompliance = this.determineWCAGCompliance(contrastTests);
    
    // Generate recommendations
    const recommendations = this.generateColorRecommendations(color, contrastTests, colorBlindnessTests);

    return {
      colorName: color.name,
      hexValue: color.hex,
      contrastTests,
      colorBlindnessTests,
      overallScore,
      wcagCompliance,
      recommendations
    };
  }

  /**
   * Test contrast ratios for a color
   */
  private testContrastRatios(color: { name: string; hex: string; usage: string[] }): ContrastTest[] {
    const tests: ContrastTest[] = [];
    
    // Find relevant combinations for this color
    const relevantCombinations = this.colorCombinations.filter(combo => 
      combo.text === color.hex || combo.background === color.hex
    );

    // If no specific combinations, test with common backgrounds/texts
    if (relevantCombinations.length === 0) {
      const commonBackgrounds = ['#ffffff', '#000000', '#f8fafc', '#0f172a'];
      const commonTexts = ['#ffffff', '#000000', '#334155', '#64748b'];
      
      // Test as background color
      commonTexts.forEach(textColor => {
        const contrastRatio = this.calculateContrastRatio(color.hex, textColor);
        tests.push({
          backgroundColor: color.hex,
          textColor: textColor,
          contrastRatio,
          wcagAA: contrastRatio >= 4.5,
          wcagAAA: contrastRatio >= 7,
          usage: `${color.name} background with text`,
          score: this.calculateContrastScore(contrastRatio)
        });
      });

      // Test as text color
      commonBackgrounds.forEach(backgroundColor => {
        const contrastRatio = this.calculateContrastRatio(color.hex, backgroundColor);
        tests.push({
          backgroundColor: backgroundColor,
          textColor: color.hex,
          contrastRatio,
          wcagAA: contrastRatio >= 4.5,
          wcagAAA: contrastRatio >= 7,
          usage: `${color.name} text on background`,
          score: this.calculateContrastScore(contrastRatio)
        });
      });
    } else {
      // Test specific combinations
      relevantCombinations.forEach(combo => {
        const contrastRatio = this.calculateContrastRatio(combo.background, combo.text);
        tests.push({
          backgroundColor: combo.background,
          textColor: combo.text,
          contrastRatio,
          wcagAA: contrastRatio >= 4.5,
          wcagAAA: contrastRatio >= 7,
          usage: combo.usage,
          score: this.calculateContrastScore(contrastRatio)
        });
      });
    }

    return tests;
  }

  /**
   * Test color blindness simulation
   */
  private testColorBlindness(color: { name: string; hex: string; usage: string[] }): ColorBlindnessTest[] {
    const tests: ColorBlindnessTest[] = [];
    const colorBlindnessTypes: Array<'protanopia' | 'deuteranopia' | 'tritanopia' | 'monochromacy'> = 
      ['protanopia', 'deuteranopia', 'tritanopia', 'monochromacy'];

    colorBlindnessTypes.forEach(type => {
      const simulatedColor = this.simulateColorBlindness(color.hex, type);
      const distinguishable = this.isColorDistinguishable(color.hex, simulatedColor);
      const impact = this.assessColorBlindnessImpact(distinguishable, color.usage);
      
      tests.push({
        type,
        simulatedColor,
        distinguishable,
        score: distinguishable ? 100 : this.calculateColorBlindnessScore(impact),
        impact
      });
    });

    return tests;
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
   * Calculate contrast score
   */
  private calculateContrastScore(contrastRatio: number): number {
    if (contrastRatio >= 7) return 100;  // AAA
    if (contrastRatio >= 4.5) return 85; // AA
    if (contrastRatio >= 3) return 60;   // Large text AA
    if (contrastRatio >= 2) return 40;   // Below standards
    return 20; // Poor contrast
  }

  /**
   * Simulate color blindness (simplified simulation)
   */
  private simulateColorBlindness(hex: string, type: 'protanopia' | 'deuteranopia' | 'tritanopia' | 'monochromacy'): string {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return hex;

    let { r, g, b } = rgb;

    switch (type) {
      case 'protanopia': // Red-blind
        r = 0.567 * r + 0.433 * g;
        g = 0.558 * r + 0.442 * g;
        break;
      case 'deuteranopia': // Green-blind
        r = 0.625 * r + 0.375 * g;
        g = 0.7 * r + 0.3 * g;
        break;
      case 'tritanopia': // Blue-blind
        r = 0.95 * r + 0.05 * b;
        b = 0.433 * g + 0.567 * b;
        break;
      case 'monochromacy': // Complete color blindness
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        r = g = b = gray;
        break;
    }

    // Convert back to hex
    const toHex = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  /**
   * Check if color is distinguishable from original
   */
  private isColorDistinguishable(original: string, simulated: string): boolean {
    const threshold = 10; // Minimum difference in RGB values
    const origRgb = this.hexToRgb(original);
    const simRgb = this.hexToRgb(simulated);
    
    if (!origRgb || !simRgb) return false;

    const diff = Math.abs(origRgb.r - simRgb.r) + 
                 Math.abs(origRgb.g - simRgb.g) + 
                 Math.abs(origRgb.b - simRgb.b);

    return diff >= threshold;
  }

  /**
   * Assess impact of color blindness on usage
   */
  private assessColorBlindnessImpact(distinguishable: boolean, usage: string[]): 'none' | 'minor' | 'moderate' | 'severe' {
    if (distinguishable) return 'none';

    const criticalUsage = ['error messages', 'warning messages', 'success messages', 'CTAs', 'primary buttons'];
    const hasCriticalUsage = usage.some(use => 
      criticalUsage.some(critical => use.includes(critical))
    );

    if (hasCriticalUsage) return 'severe';
    
    const importantUsage = ['links', 'buttons', 'highlights', 'focus states'];
    const hasImportantUsage = usage.some(use => 
      importantUsage.some(important => use.includes(important))
    );

    if (hasImportantUsage) return 'moderate';
    
    return 'minor';
  }

  /**
   * Calculate color blindness score based on impact
   */
  private calculateColorBlindnessScore(impact: 'none' | 'minor' | 'moderate' | 'severe'): number {
    switch (impact) {
      case 'none': return 100;
      case 'minor': return 80;
      case 'moderate': return 60;
      case 'severe': return 30;
      default: return 50;
    }
  }

  /**
   * Determine WCAG compliance level
   */
  private determineWCAGCompliance(contrastTests: ContrastTest[]): 'AAA' | 'AA' | 'fail' {
    const aaaTests = contrastTests.filter(test => test.wcagAAA);
    const aaTests = contrastTests.filter(test => test.wcagAA);

    if (aaaTests.length === contrastTests.length) return 'AAA';
    if (aaTests.length >= contrastTests.length * 0.8) return 'AA';
    return 'fail';
  }

  /**
   * Generate color-specific recommendations
   */
  private generateColorRecommendations(
    color: { name: string; hex: string; usage: string[] },
    contrastTests: ContrastTest[],
    colorBlindnessTests: ColorBlindnessTest[]
  ): string[] {
    const recommendations: string[] = [];

    // Contrast recommendations
    const failedContrast = contrastTests.filter(test => !test.wcagAA);
    if (failedContrast.length > 0) {
      recommendations.push(`Improve contrast ratio for ${color.name} - currently failing WCAG AA standards`);
      recommendations.push('Consider using darker/lighter alternatives for better readability');
    }

    // Color blindness recommendations
    const severeImpact = colorBlindnessTests.filter(test => test.impact === 'severe');
    if (severeImpact.length > 0) {
      recommendations.push(`${color.name} may not be distinguishable for color-blind users`);
      recommendations.push('Add visual indicators (icons, patterns) alongside color coding');
    }

    const moderateImpact = colorBlindnessTests.filter(test => test.impact === 'moderate');
    if (moderateImpact.length > 0) {
      recommendations.push('Consider providing alternative visual cues for color-blind users');
    }

    // Usage-specific recommendations
    if (color.usage.includes('links') || color.usage.includes('CTAs')) {
      recommendations.push('Ensure interactive elements have additional hover/focus states');
    }

    if (color.usage.includes('error') || color.usage.includes('warning')) {
      recommendations.push('Critical messaging should not rely solely on color');
    }

    return recommendations;
  }

  /**
   * Calculate overall accessibility score
   */
  private calculateOverallScore(colorTests: ColorAccessibilityTest[]): number {
    if (colorTests.length === 0) return 0;
    return colorTests.reduce((sum, test) => sum + test.overallScore, 0) / colorTests.length;
  }

  /**
   * Identify critical accessibility issues
   */
  private identifyCriticalIssues(colorTests: ColorAccessibilityTest[]): string[] {
    const issues: string[] = [];

    colorTests.forEach(test => {
      // Critical contrast failures
      const criticalContrast = test.contrastTests.filter(ct => 
        ct.contrastRatio < 3 && (ct.usage.includes('text') || ct.usage.includes('button'))
      );
      
      if (criticalContrast.length > 0) {
        issues.push(`${test.colorName}: Critical contrast failure - ${criticalContrast[0].usage}`);
      }

      // Severe color blindness impact
      const severeColorBlind = test.colorBlindnessTests.filter(cb => cb.impact === 'severe');
      if (severeColorBlind.length > 0) {
        issues.push(`${test.colorName}: Severe color blindness impact for ${severeColorBlind.map(s => s.type).join(', ')}`);
      }

      // Overall failing grade
      if (test.overallScore < 50) {
        issues.push(`${test.colorName}: Overall accessibility score below acceptable threshold`);
      }
    });

    return issues;
  }

  /**
   * Generate comprehensive recommendations
   */
  private generateRecommendations(colorTests: ColorAccessibilityTest[]): string[] {
    const recommendations: string[] = [];
    const allRecommendations = colorTests.flatMap(test => test.recommendations);

    // Aggregate common recommendations
    const commonIssues = {
      contrast: allRecommendations.filter(r => r.includes('contrast')).length,
      colorBlind: allRecommendations.filter(r => r.includes('color-blind')).length,
      visual: allRecommendations.filter(r => r.includes('visual')).length
    };

    if (commonIssues.contrast > 0) {
      recommendations.push('Implement systematic contrast checking in design workflow');
      recommendations.push('Consider darker alternatives for better text readability');
    }

    if (commonIssues.colorBlind > 0) {
      recommendations.push('Add non-color visual indicators (icons, patterns, typography)');
      recommendations.push('Test designs with color blindness simulators');
    }

    if (commonIssues.visual > 0) {
      recommendations.push('Provide multiple ways to convey information beyond color alone');
    }

    // Add general accessibility recommendations
    recommendations.push('Regular accessibility audits with assistive technology testing');
    recommendations.push('User testing with individuals who have visual impairments');

    return [...new Set(recommendations)]; // Remove duplicates
  }

  /**
   * Calculate WCAG compliance statistics
   */
  private calculateWCAGCompliance(colorTests: ColorAccessibilityTest[]): { aa: number; aaa: number } {
    const totalTests = colorTests.length;
    if (totalTests === 0) return { aa: 0, aaa: 0 };

    const aaCompliant = colorTests.filter(test => test.wcagCompliance === 'AA' || test.wcagCompliance === 'AAA').length;
    const aaaCompliant = colorTests.filter(test => test.wcagCompliance === 'AAA').length;

    return {
      aa: (aaCompliant / totalTests) * 100,
      aaa: (aaaCompliant / totalTests) * 100
    };
  }

  /**
   * Generate accessibility testing report
   */
  generateAccessibilityReport(report: AccessibilityReport): string {
    return `
# Brand Color Accessibility Report

## Executive Summary
- **Overall Accessibility Score**: ${report.overallScore.toFixed(1)}/100
- **WCAG AA Compliance**: ${report.wcagCompliance.aa.toFixed(1)}%
- **WCAG AAA Compliance**: ${report.wcagCompliance.aaa.toFixed(1)}%
- **Critical Issues**: ${report.criticalIssues.length}
- **Colors Tested**: ${report.colorTests.length}

## WCAG Compliance Breakdown
${report.colorTests.map(test => 
  `- **${test.colorName}**: ${test.wcagCompliance.toUpperCase()} (${test.overallScore.toFixed(1)}/100)`
).join('\n')}

## Critical Issues
${report.criticalIssues.length > 0 ? 
  report.criticalIssues.map(issue => `⚠️ ${issue}`).join('\n') : 
  '✅ No critical accessibility issues identified'}

## Detailed Color Analysis

${report.colorTests.map(test => `
### ${test.colorName} (${test.hexValue})
- **Overall Score**: ${test.overallScore.toFixed(1)}/100
- **WCAG Compliance**: ${test.wcagCompliance.toUpperCase()}
- **Contrast Tests**: ${test.contrastTests.length}
- **Color Blindness Impact**: ${test.colorBlindnessTests.filter(cb => cb.impact !== 'none').length > 0 ? 'Yes' : 'No'}

#### Contrast Ratios
${test.contrastTests.map(ct => 
  `- ${ct.usage}: ${ct.contrastRatio.toFixed(2)}:1 ${ct.wcagAA ? '✅' : '❌'} ${ct.wcagAAA ? '(AAA)' : ''}`
).join('\n')}

#### Color Blindness Simulation
${test.colorBlindnessTests.map(cb => 
  `- ${cb.type}: ${cb.distinguishable ? '✅' : '❌'} ${cb.impact !== 'none' ? `(${cb.impact} impact)` : ''}`
).join('\n')}

${test.recommendations.length > 0 ? `
#### Recommendations
${test.recommendations.map(rec => `- ${rec}`).join('\n')}
` : ''}
`).join('')}

## Priority Recommendations

${report.recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n')}

## Implementation Guidelines

### Immediate Actions
1. Address all critical contrast failures
2. Add visual indicators for color-coded information
3. Test with color blindness simulators

### Design System Updates
1. Document minimum contrast requirements
2. Provide accessible color combinations
3. Create alternative visual patterns

### Development Guidelines
1. Automated contrast checking in build process
2. Color blindness testing in QA workflow
3. Regular accessibility audits

---
Generated: ${new Date().toISOString()}
    `.trim();
  }
}