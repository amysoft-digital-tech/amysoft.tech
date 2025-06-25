/**
 * Playwright Global Teardown
 * Cleans up the test environment after cross-browser and mobile testing
 */

import { FullConfig } from '@playwright/test';
import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting Playwright teardown...');

  try {
    // Generate test execution summary
    console.log('📊 Generating test execution summary...');
    
    const testSummary = {
      timestamp: new Date().toISOString(),
      configuration: {
        testDir: config.testDir,
        fullyParallel: config.fullyParallel,
        workers: config.workers,
        retries: config.retries,
        timeout: config.timeout,
        projects: config.projects?.map(project => ({
          name: project.name,
          use: {
            browserName: project.use?.browserName,
            viewport: project.use?.viewport,
            isMobile: project.use?.isMobile,
            hasTouch: project.use?.hasTouch
          }
        }))
      },
      environment: {
        ci: !!process.env.CI,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      },
      baseURL: config.use?.baseURL,
      webServer: config.webServer ? {
        command: config.webServer.command,
        port: config.webServer.port,
        reuseExistingServer: config.webServer.reuseExistingServer
      } : null
    };

    // Write summary to file
    const summaryPath = join(process.cwd(), 'cross-browser-reports', 'test-summary.json');
    const reportsDir = join(process.cwd(), 'cross-browser-reports');
    
    // Ensure reports directory exists
    if (!existsSync(reportsDir)) {
      const { mkdirSync } = require('fs');
      mkdirSync(reportsDir, { recursive: true });
    }

    writeFileSync(summaryPath, JSON.stringify(testSummary, null, 2));
    console.log(`✅ Test summary written to: ${summaryPath}`);

    // Generate coverage report if available
    console.log('📈 Checking for coverage data...');
    const coveragePath = join(process.cwd(), 'coverage');
    if (existsSync(coveragePath)) {
      console.log('✅ Coverage data found');
      
      const coverageSummary = {
        timestamp: new Date().toISOString(),
        location: coveragePath,
        note: 'Coverage data available for analysis'
      };
      
      const coverageSummaryPath = join(reportsDir, 'coverage-summary.json');
      writeFileSync(coverageSummaryPath, JSON.stringify(coverageSummary, null, 2));
      console.log(`✅ Coverage summary written to: ${coverageSummaryPath}`);
    } else {
      console.log('⚠️ No coverage data found');
    }

    // Check for performance artifacts
    console.log('⚡ Checking for performance artifacts...');
    const performanceDir = join(process.cwd(), 'performance-reports');
    if (existsSync(performanceDir)) {
      console.log('✅ Performance reports found');
    } else {
      console.log('⚠️ No performance reports found');
    }

    // Check for accessibility artifacts
    console.log('♿ Checking for accessibility artifacts...');
    const a11yDir = join(process.cwd(), 'a11y-reports');
    if (existsSync(a11yDir)) {
      console.log('✅ Accessibility reports found');
    } else {
      console.log('⚠️ No accessibility reports found');
    }

    // Check for Lighthouse artifacts
    console.log('🏮 Checking for Lighthouse artifacts...');
    const lighthouseDir = join(process.cwd(), 'lighthouse-reports');
    if (existsSync(lighthouseDir)) {
      console.log('✅ Lighthouse reports found');
    } else {
      console.log('⚠️ No Lighthouse reports found');
    }

    // Generate final test report summary
    console.log('📋 Generating final test report...');
    
    const finalReport = {
      testExecution: {
        timestamp: new Date().toISOString(),
        duration: 'See individual test reports',
        status: 'completed'
      },
      artifacts: {
        crossBrowserReports: existsSync(join(reportsDir, 'html')),
        performanceReports: existsSync(performanceDir),
        accessibilityReports: existsSync(a11yDir),
        lighthouseReports: existsSync(lighthouseDir),
        coverageReports: existsSync(coveragePath)
      },
      recommendations: [
        'Review cross-browser compatibility results',
        'Check performance metrics against thresholds',
        'Validate accessibility compliance',
        'Ensure PWA standards are met',
        'Monitor coverage trends'
      ],
      nextSteps: [
        'Deploy to staging if all tests pass',
        'Update documentation with test results',
        'Address any failing tests or performance issues',
        'Schedule follow-up testing if needed'
      ]
    };

    const finalReportPath = join(reportsDir, 'final-report.json');
    writeFileSync(finalReportPath, JSON.stringify(finalReport, null, 2));
    console.log(`✅ Final report written to: ${finalReportPath}`);

    // Log summary of artifacts created
    console.log('\n📂 Test Artifacts Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const artifacts = [
      { name: 'Cross-Browser Reports', path: join(reportsDir, 'html'), exists: existsSync(join(reportsDir, 'html')) },
      { name: 'Test Results JSON', path: join(reportsDir, 'results.json'), exists: existsSync(join(reportsDir, 'results.json')) },
      { name: 'JUnit XML', path: join(reportsDir, 'junit.xml'), exists: existsSync(join(reportsDir, 'junit.xml')) },
      { name: 'Test Summary', path: summaryPath, exists: existsSync(summaryPath) },
      { name: 'Final Report', path: finalReportPath, exists: existsSync(finalReportPath) },
      { name: 'Performance Reports', path: performanceDir, exists: existsSync(performanceDir) },
      { name: 'Accessibility Reports', path: a11yDir, exists: existsSync(a11yDir) },
      { name: 'Lighthouse Reports', path: lighthouseDir, exists: existsSync(lighthouseDir) },
      { name: 'Coverage Reports', path: coveragePath, exists: existsSync(coveragePath) }
    ];

    artifacts.forEach(artifact => {
      const status = artifact.exists ? '✅' : '❌';
      console.log(`${status} ${artifact.name}: ${artifact.path}`);
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Clean up any temporary files created during testing
    console.log('🗑️ Cleaning up temporary files...');
    
    const tempFiles = [
      'playwright-report.zip',
      'test-results.json',
      '.auth'
    ];

    tempFiles.forEach(file => {
      const filePath = join(process.cwd(), file);
      if (existsSync(filePath)) {
        try {
          const { unlinkSync, rmSync } = require('fs');
          const { statSync } = require('fs');
          
          if (statSync(filePath).isDirectory()) {
            rmSync(filePath, { recursive: true, force: true });
          } else {
            unlinkSync(filePath);
          }
          console.log(`🗑️ Removed: ${file}`);
        } catch (error) {
          console.warn(`⚠️ Failed to remove ${file}:`, error);
        }
      }
    });

    // Performance metrics if available
    if (global.testStartTime) {
      const testDuration = Date.now() - global.testStartTime;
      console.log(`⏱️ Total test execution time: ${Math.round(testDuration / 1000)}s`);
    }

    console.log('\n🎉 Playwright teardown complete!');
    console.log('📊 Test results and artifacts are ready for review');
    console.log('🚀 Ready for deployment if all tests passed');

  } catch (error) {
    console.error('❌ Teardown failed:', error);
    // Don't throw the error to avoid masking test failures
    console.log('⚠️ Continuing despite teardown errors...');
  }
}

export default globalTeardown;