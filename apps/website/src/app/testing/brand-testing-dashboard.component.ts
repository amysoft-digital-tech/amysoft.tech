import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrandComplianceTestingService, BrandComplianceResult } from './brand-compliance-testing.service';
import { VisualRegressionTestingService, VisualTestResult } from './visual-regression-testing.service';
import { EbookCoverValidationService, CoverValidationResult } from './ebook-cover-validation.service';
import { CrossApplicationBrandTestingService, BrandConsistencyReport } from './cross-application-brand-testing.service';
import { BrandColorAccessibilityTestingService, AccessibilityReport } from './brand-color-accessibility-testing.service';
import { TypographyBrandTestingService, TypographyReport } from './typography-brand-testing.service';

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  status: 'not-run' | 'running' | 'completed' | 'failed';
  score: number;
  duration: number;
  lastRun: Date | null;
  criticalIssues: number;
}

export interface DashboardStats {
  overallScore: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  warningTests: number;
  criticalIssues: number;
  lastUpdate: Date;
}

@Component({
  selector: 'app-brand-testing-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-7xl mx-auto p-6 space-y-8">
      
      <!-- Header -->
      <div class="text-center">
        <h1 class="text-4xl font-bold text-neutral-900 mb-4">
          Brand Compliance Testing Dashboard
        </h1>
        <p class="text-lg text-neutral-600 max-w-3xl mx-auto">
          Comprehensive testing suite for brand identity, design system compliance, 
          and accessibility validation across all applications.
        </p>
      </div>

      <!-- Overall Stats -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white rounded-xl border border-neutral-200 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-neutral-600">Overall Score</p>
              <p class="text-3xl font-bold" [class]="getScoreColorClass(dashboardStats().overallScore)">
                {{ dashboardStats().overallScore.toFixed(1) }}%
              </p>
            </div>
            <div class="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-neutral-200 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-neutral-600">Total Tests</p>
              <p class="text-3xl font-bold text-neutral-900">{{ dashboardStats().totalTests }}</p>
            </div>
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-neutral-200 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-neutral-600">Passed</p>
              <p class="text-3xl font-bold text-success-600">{{ dashboardStats().passedTests }}</p>
            </div>
            <div class="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-neutral-200 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-neutral-600">Critical Issues</p>
              <p class="text-3xl font-bold text-danger-600">{{ dashboardStats().criticalIssues }}</p>
            </div>
            <div class="w-12 h-12 bg-danger-100 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Test Suites -->
      <div class="space-y-6">
        <h2 class="text-2xl font-bold text-neutral-900">Test Suites</h2>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div *ngFor="let suite of testSuites()" 
               class="bg-white rounded-xl border border-neutral-200 p-6 hover:shadow-medium transition-shadow duration-200">
            
            <div class="flex items-start justify-between mb-4">
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-neutral-900 mb-2">{{ suite.name }}</h3>
                <p class="text-sm text-neutral-600 mb-3">{{ suite.description }}</p>
                
                <div class="flex items-center space-x-4 text-sm">
                  <span class="flex items-center space-x-1">
                    <div class="w-2 h-2 rounded-full" [class]="getStatusColor(suite.status)"></div>
                    <span class="capitalize text-neutral-600">{{ suite.status.replace('-', ' ') }}</span>
                  </span>
                  
                  <span *ngIf="suite.score > 0" class="text-neutral-600">
                    Score: <span [class]="getScoreColorClass(suite.score)">{{ suite.score.toFixed(1) }}%</span>
                  </span>
                  
                  <span *ngIf="suite.criticalIssues > 0" class="text-danger-600">
                    {{ suite.criticalIssues }} critical issue{{ suite.criticalIssues !== 1 ? 's' : '' }}
                  </span>
                </div>
              </div>
              
              <button (click)="runTestSuite(suite.id)"
                      [disabled]="suite.status === 'running'"
                      class="ml-4 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors duration-200">
                {{ suite.status === 'running' ? 'Running...' : 'Run Tests' }}
              </button>
            </div>

            <!-- Progress bar for running tests -->
            <div *ngIf="suite.status === 'running'" class="mb-4">
              <div class="w-full bg-neutral-200 rounded-full h-2">
                <div class="bg-brand-600 h-2 rounded-full transition-all duration-300" 
                     [style.width.%]="getTestProgress(suite.id)"></div>
              </div>
              <p class="text-xs text-neutral-500 mt-1">Running tests... {{ getTestProgress(suite.id).toFixed(0) }}% complete</p>
            </div>

            <!-- Last run info -->
            <div *ngIf="suite.lastRun" class="text-xs text-neutral-500">
              Last run: {{ suite.lastRun | date:'medium' }} ({{ suite.duration.toFixed(2) }}s)
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="bg-white rounded-xl border border-neutral-200 p-6">
        <h3 class="text-lg font-semibold text-neutral-900 mb-4">Quick Actions</h3>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button (click)="runAllTests()"
                  [disabled]="isRunningTests()"
                  class="flex items-center justify-center space-x-2 px-4 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors duration-200">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
            <span>Run All Tests</span>
          </button>

          <button (click)="generateReport()"
                  class="flex items-center justify-center space-x-2 px-4 py-3 bg-neutral-600 text-white rounded-lg hover:bg-neutral-700 transition-colors duration-200">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <span>Generate Report</span>
          </button>

          <button (click)="exportResults()"
                  class="flex items-center justify-center space-x-2 px-4 py-3 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors duration-200">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <span>Export Results</span>
          </button>

          <button (click)="viewHistory()"
                  class="flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>View History</span>
          </button>
        </div>
      </div>

      <!-- Test Results -->
      <div *ngIf="showResults()" class="space-y-6">
        <h2 class="text-2xl font-bold text-neutral-900">Latest Test Results</h2>
        
        <!-- Compliance Results -->
        <div *ngIf="complianceResults().length > 0" class="bg-white rounded-xl border border-neutral-200 p-6">
          <h3 class="text-lg font-semibold text-neutral-900 mb-4">Brand Compliance Results</h3>
          
          <div class="space-y-3">
            <div *ngFor="let result of complianceResults().slice(0, 10)" 
                 class="flex items-center justify-between py-2 border-b border-neutral-100 last:border-b-0">
              <div class="flex-1">
                <p class="font-medium text-neutral-900">{{ result.component }} - {{ result.test }}</p>
                <p class="text-sm text-neutral-600">Expected: {{ result.expected }}</p>
                <p class="text-sm text-neutral-500">Actual: {{ result.actual }}</p>
              </div>
              <div class="flex items-center space-x-3 ml-4">
                <span class="text-sm font-medium" [class]="getScoreColorClass(result.score)">
                  {{ result.score }}/100
                </span>
                <div class="w-3 h-3 rounded-full" [class]="getStatusColor(result.status)"></div>
              </div>
            </div>
          </div>
          
          <button *ngIf="complianceResults().length > 10" 
                  (click)="showAllCompliance = !showAllCompliance"
                  class="mt-4 text-brand-600 hover:text-brand-700 text-sm font-medium">
            {{ showAllCompliance ? 'Show Less' : 'Show All (' + complianceResults().length + ' results)' }}
          </button>
        </div>

        <!-- Critical Issues -->
        <div *ngIf="criticalIssues().length > 0" class="bg-danger-50 border border-danger-200 rounded-xl p-6">
          <h3 class="text-lg font-semibold text-danger-900 mb-4 flex items-center space-x-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
            <span>Critical Issues Requiring Immediate Attention</span>
          </h3>
          
          <div class="space-y-2">
            <div *ngFor="let issue of criticalIssues()" 
                 class="p-3 bg-white rounded-lg border border-danger-200">
              <p class="text-danger-900 font-medium">{{ issue }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Help & Documentation -->
      <div class="bg-neutral-50 rounded-xl p-6 text-center">
        <h3 class="text-lg font-semibold text-neutral-900 mb-2">Need Help?</h3>
        <p class="text-neutral-600 mb-4">
          Learn more about brand testing and compliance requirements.
        </p>
        <div class="flex items-center justify-center space-x-4">
          <a href="/docs/brand-testing" class="text-brand-600 hover:text-brand-700 font-medium">
            Testing Documentation
          </a>
          <span class="text-neutral-300">|</span>
          <a href="/docs/design-system" class="text-brand-600 hover:text-brand-700 font-medium">
            Design System Guide
          </a>
          <span class="text-neutral-300">|</span>
          <a href="/docs/accessibility" class="text-brand-600 hover:text-brand-700 font-medium">
            Accessibility Guidelines
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .gradient-text {
      background: linear-gradient(135deg, #0ea5e9, #f2711a);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  `]
})
export class BrandTestingDashboardComponent implements OnInit {
  
  // Signal-based state management
  private testSuites = signal<TestSuite[]>([]);
  private dashboardStats = signal<DashboardStats>({
    overallScore: 0,
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    warningTests: 0,
    criticalIssues: 0,
    lastUpdate: new Date()
  });
  private complianceResults = signal<BrandComplianceResult[]>([]);
  private showResults = signal<boolean>(false);
  private criticalIssues = signal<string[]>([]);
  
  // UI state
  showAllCompliance = false;
  private testProgress = new Map<string, number>();

  constructor(
    private brandComplianceService: BrandComplianceTestingService,
    private visualRegressionService: VisualRegressionTestingService,
    private ebookCoverService: EbookCoverValidationService,
    private crossAppService: CrossApplicationBrandTestingService,
    private colorAccessibilityService: BrandColorAccessibilityTestingService,
    private typographyService: TypographyBrandTestingService
  ) {}

  ngOnInit(): void {
    this.initializeTestSuites();
    this.loadLastResults();
  }

  private initializeTestSuites(): void {
    const suites: TestSuite[] = [
      {
        id: 'brand-compliance',
        name: 'Brand Compliance Testing',
        description: 'Validates brand color, typography, and component consistency across the design system.',
        status: 'not-run',
        score: 0,
        duration: 0,
        lastRun: null,
        criticalIssues: 0
      },
      {
        id: 'visual-regression',
        name: 'Visual Regression Testing',
        description: 'Detects unintended visual changes in brand elements across different viewports and states.',
        status: 'not-run',
        score: 0,
        duration: 0,
        lastRun: null,
        criticalIssues: 0
      },
      {
        id: 'ebook-cover',
        name: 'Ebook Cover Validation',
        description: 'Ensures ebook cover meets marketplace requirements and brand standards.',
        status: 'not-run',
        score: 0,
        duration: 0,
        lastRun: null,
        criticalIssues: 0
      },
      {
        id: 'cross-application',
        name: 'Cross-Application Consistency',
        description: 'Verifies brand consistency across website, PWA, admin, and API applications.',
        status: 'not-run',
        score: 0,
        duration: 0,
        lastRun: null,
        criticalIssues: 0
      },
      {
        id: 'color-accessibility',
        name: 'Color Accessibility Testing',
        description: 'Tests color contrast ratios and color blindness accessibility compliance.',
        status: 'not-run',
        score: 0,
        duration: 0,
        lastRun: null,
        criticalIssues: 0
      },
      {
        id: 'typography',
        name: 'Typography Brand Testing',
        description: 'Validates font loading, typography consistency, and readability across components.',
        status: 'not-run',
        score: 0,
        duration: 0,
        lastRun: null,
        criticalIssues: 0
      }
    ];

    this.testSuites.set(suites);
  }

  private loadLastResults(): void {
    // Load any cached results from localStorage
    const cachedStats = localStorage.getItem('brand-testing-stats');
    if (cachedStats) {
      try {
        const stats = JSON.parse(cachedStats);
        this.dashboardStats.set(stats);
      } catch (error) {
        console.warn('Failed to load cached testing stats:', error);
      }
    }
  }

  async runTestSuite(suiteId: string): Promise<void> {
    const suites = this.testSuites();
    const suite = suites.find(s => s.id === suiteId);
    if (!suite) return;

    // Update status to running
    suite.status = 'running';
    suite.criticalIssues = 0;
    this.testSuites.set([...suites]);
    this.testProgress.set(suiteId, 0);

    const startTime = performance.now();

    try {
      let results: any;
      let score = 0;
      let criticalIssues: string[] = [];

      switch (suiteId) {
        case 'brand-compliance':
          this.updateProgress(suiteId, 25);
          results = await this.brandComplianceService.runFullBrandComplianceTest();
          this.updateProgress(suiteId, 75);
          score = this.calculateComplianceScore(results);
          criticalIssues = results.filter((r: BrandComplianceResult) => r.status === 'fail').map((r: BrandComplianceResult) => r.test);
          this.complianceResults.set(results);
          break;

        case 'visual-regression':
          this.updateProgress(suiteId, 30);
          results = await this.visualRegressionService.runBrandVisualTests();
          this.updateProgress(suiteId, 80);
          score = results.overallScore;
          criticalIssues = results.tests.filter((t: any) => !t.passed).map((t: any) => t.name);
          break;

        case 'ebook-cover':
          this.updateProgress(suiteId, 40);
          // Mock cover path for testing
          results = await this.ebookCoverService.validateEbookCover('/assets/ebook-cover.jpg');
          this.updateProgress(suiteId, 85);
          score = results.reduce((sum: number, r: CoverValidationResult) => sum + r.score, 0) / results.length;
          criticalIssues = results.filter((r: CoverValidationResult) => r.status === 'fail').map((r: CoverValidationResult) => r.test);
          break;

        case 'cross-application':
          this.updateProgress(suiteId, 20);
          results = await this.crossAppService.runCrossApplicationBrandTests();
          this.updateProgress(suiteId, 70);
          score = results.overallScore;
          criticalIssues = results.criticalIssues;
          break;

        case 'color-accessibility':
          this.updateProgress(suiteId, 35);
          results = await this.colorAccessibilityService.runColorAccessibilityTests();
          this.updateProgress(suiteId, 90);
          score = results.overallScore;
          criticalIssues = results.criticalIssues;
          break;

        case 'typography':
          this.updateProgress(suiteId, 30);
          results = await this.typographyService.runTypographyBrandTests();
          this.updateProgress(suiteId, 85);
          score = results.overallScore;
          criticalIssues = results.criticalIssues;
          break;
      }

      this.updateProgress(suiteId, 100);

      // Update suite with results
      suite.status = 'completed';
      suite.score = score;
      suite.duration = (performance.now() - startTime) / 1000;
      suite.lastRun = new Date();
      suite.criticalIssues = criticalIssues.length;

      // Update critical issues
      const allCriticalIssues = this.criticalIssues();
      const updatedIssues = [...allCriticalIssues, ...criticalIssues];
      this.criticalIssues.set([...new Set(updatedIssues)]); // Remove duplicates

    } catch (error) {
      console.error(`Failed to run test suite ${suiteId}:`, error);
      suite.status = 'failed';
      suite.duration = (performance.now() - startTime) / 1000;
    }

    this.testSuites.set([...suites]);
    this.updateDashboardStats();
    this.showResults.set(true);
    this.testProgress.delete(suiteId);
  }

  private updateProgress(suiteId: string, progress: number): void {
    this.testProgress.set(suiteId, progress);
  }

  getTestProgress(suiteId: string): number {
    return this.testProgress.get(suiteId) || 0;
  }

  private calculateComplianceScore(results: BrandComplianceResult[]): number {
    if (results.length === 0) return 0;
    return results.reduce((sum, result) => sum + result.score, 0) / results.length;
  }

  private updateDashboardStats(): void {
    const suites = this.testSuites();
    const completedSuites = suites.filter(s => s.status === 'completed');
    
    if (completedSuites.length === 0) return;

    const totalTests = completedSuites.length;
    const overallScore = completedSuites.reduce((sum, suite) => sum + suite.score, 0) / totalTests;
    const passedTests = completedSuites.filter(s => s.score >= 80).length;
    const failedTests = completedSuites.filter(s => s.score < 60).length;
    const warningTests = totalTests - passedTests - failedTests;
    const criticalIssues = completedSuites.reduce((sum, suite) => sum + suite.criticalIssues, 0);

    const stats: DashboardStats = {
      overallScore,
      totalTests,
      passedTests,
      failedTests,
      warningTests,
      criticalIssues,
      lastUpdate: new Date()
    };

    this.dashboardStats.set(stats);

    // Cache stats
    localStorage.setItem('brand-testing-stats', JSON.stringify(stats));
  }

  async runAllTests(): Promise<void> {
    const suites = this.testSuites();
    for (const suite of suites) {
      if (suite.status !== 'running') {
        await this.runTestSuite(suite.id);
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  generateReport(): void {
    // Generate comprehensive report
    const suites = this.testSuites();
    const stats = this.dashboardStats();
    const issues = this.criticalIssues();

    const report = `
# Brand Testing Comprehensive Report

Generated: ${new Date().toISOString()}

## Executive Summary
- **Overall Score**: ${stats.overallScore.toFixed(1)}/100
- **Total Tests**: ${stats.totalTests}
- **Passed**: ${stats.passedTests} | **Failed**: ${stats.failedTests} | **Warnings**: ${stats.warningTests}
- **Critical Issues**: ${stats.criticalIssues}

## Test Suite Results
${suites.map(suite => `
### ${suite.name}
- **Status**: ${suite.status.toUpperCase()}
- **Score**: ${suite.score.toFixed(1)}/100
- **Duration**: ${suite.duration.toFixed(2)}s
- **Critical Issues**: ${suite.criticalIssues}
- **Last Run**: ${suite.lastRun?.toISOString() || 'Never'}
`).join('')}

## Critical Issues
${issues.length > 0 ? issues.map(issue => `- ${issue}`).join('\n') : 'No critical issues identified'}

## Recommendations
1. Address all critical issues immediately
2. Improve test scores below 80%
3. Implement automated testing in CI/CD
4. Regular brand compliance audits
5. Update design system documentation

---
Report generated by Brand Testing Dashboard
    `.trim();

    // Download report
    this.downloadTextFile(report, `brand-testing-report-${new Date().toISOString().split('T')[0]}.md`);
  }

  exportResults(): void {
    const data = {
      stats: this.dashboardStats(),
      suites: this.testSuites(),
      results: this.complianceResults(),
      criticalIssues: this.criticalIssues(),
      exportDate: new Date().toISOString()
    };

    this.downloadTextFile(JSON.stringify(data, null, 2), `brand-testing-results-${new Date().toISOString().split('T')[0]}.json`);
  }

  private downloadTextFile(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  viewHistory(): void {
    // Implementation for viewing test history
    console.log('View history feature - to be implemented');
  }

  isRunningTests(): boolean {
    return this.testSuites().some(suite => suite.status === 'running');
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
      case 'pass':
        return 'bg-success-500';
      case 'running':
        return 'bg-brand-500';
      case 'failed':
      case 'fail':
        return 'bg-danger-500';
      case 'warning':
        return 'bg-warning-500';
      default:
        return 'bg-neutral-400';
    }
  }

  getScoreColorClass(score: number): string {
    if (score >= 90) return 'text-success-600';
    if (score >= 80) return 'text-success-500';
    if (score >= 70) return 'text-warning-500';
    if (score >= 60) return 'text-warning-600';
    return 'text-danger-600';
  }

  // Expose signals to template
  protected testSuites = this.testSuites.asReadonly();
  protected dashboardStats = this.dashboardStats.asReadonly();
  protected complianceResults = this.complianceResults.asReadonly();
  protected showResults = this.showResults.asReadonly();
  protected criticalIssues = this.criticalIssues.asReadonly();
}