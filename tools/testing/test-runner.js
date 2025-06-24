#!/usr/bin/env node

/**
 * Comprehensive Test Runner for Beyond the AI Plateau Administrative Console
 * Orchestrates unit tests, integration tests, E2E tests, security tests, and performance tests
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

class ComprehensiveTestRunner {
  constructor(options = {}) {
    this.options = {
      runUnit: options.runUnit !== false,
      runIntegration: options.runIntegration !== false,
      runE2E: options.runE2E !== false,
      runSecurity: options.runSecurity !== false,
      runPerformance: options.runPerformance !== false,
      runAccessibility: options.runAccessibility !== false,
      generateReports: options.generateReports !== false,
      parallel: options.parallel !== false,
      bail: options.bail || false,
      verbose: options.verbose || false
    };
    
    this.testResults = {
      timestamp: new Date().toISOString(),
      configuration: this.options,
      results: {},
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        duration: 0,
        coverage: 0,
        securityScore: 0,
        performanceScore: 0,
        accessibilityScore: 0
      },
      recommendations: []
    };
    
    this.startTime = Date.now();
  }

  async runAllTests() {
    console.log('🧪 Starting comprehensive test suite for administrative console...');
    console.log(`Configuration: ${Object.entries(this.options).filter(([_, v]) => v).map(([k, _]) => k).join(', ')}`);
    
    try {
      // Create reports directory
      this.ensureReportsDirectory();
      
      // Run tests based on configuration
      if (this.options.parallel) {
        await this.runTestsInParallel();
      } else {
        await this.runTestsSequentially();
      }
      
      // Collect and analyze results
      await this.analyzeResults();
      
      // Generate comprehensive report
      if (this.options.generateReports) {
        await this.generateComprehensiveReport();
      }
      
      // Display summary
      this.displaySummary();
      
      // Exit with appropriate code
      process.exit(this.testResults.summary.failedTests > 0 ? 1 : 0);
      
    } catch (error) {
      console.error('Test suite execution failed:', error);
      process.exit(1);
    }
  }

  async runTestsSequentially() {
    const testSuites = [
      { name: 'unit', enabled: this.options.runUnit, runner: this.runUnitTests.bind(this) },
      { name: 'integration', enabled: this.options.runIntegration, runner: this.runIntegrationTests.bind(this) },
      { name: 'e2e', enabled: this.options.runE2E, runner: this.runE2ETests.bind(this) },
      { name: 'security', enabled: this.options.runSecurity, runner: this.runSecurityTests.bind(this) },
      { name: 'performance', enabled: this.options.runPerformance, runner: this.runPerformanceTests.bind(this) },
      { name: 'accessibility', enabled: this.options.runAccessibility, runner: this.runAccessibilityTests.bind(this) }
    ];
    
    for (const suite of testSuites) {
      if (suite.enabled) {
        console.log(`\n📋 Running ${suite.name} tests...`);
        try {
          const result = await suite.runner();
          this.testResults.results[suite.name] = result;
          
          if (result.failed > 0 && this.options.bail) {
            console.log(`❌ ${suite.name} tests failed, stopping execution (bail mode)`);
            break;
          }
        } catch (error) {
          console.error(`❌ ${suite.name} test suite failed:`, error);
          this.testResults.results[suite.name] = { error: error.message, failed: 1 };
          
          if (this.options.bail) {
            break;
          }
        }
      }
    }
  }

  async runTestsInParallel() {
    const testPromises = [];
    
    if (this.options.runUnit) {
      testPromises.push(this.runUnitTests().then(result => ({ type: 'unit', result })));
    }
    
    if (this.options.runIntegration) {
      testPromises.push(this.runIntegrationTests().then(result => ({ type: 'integration', result })));
    }
    
    if (this.options.runE2E) {
      testPromises.push(this.runE2ETests().then(result => ({ type: 'e2e', result })));
    }
    
    if (this.options.runSecurity) {
      testPromises.push(this.runSecurityTests().then(result => ({ type: 'security', result })));
    }
    
    if (this.options.runPerformance) {
      testPromises.push(this.runPerformanceTests().then(result => ({ type: 'performance', result })));
    }
    
    if (this.options.runAccessibility) {
      testPromises.push(this.runAccessibilityTests().then(result => ({ type: 'accessibility', result })));
    }
    
    const results = await Promise.allSettled(testPromises);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const { type, result: testResult } = result.value;
        this.testResults.results[type] = testResult;
      } else {
        console.error(`Test suite failed:`, result.reason);
      }
    });
  }

  async runUnitTests() {
    console.log('🔬 Running unit tests...');
    
    return new Promise((resolve, reject) => {
      const jest = spawn('npx', ['jest', '--config=jest.config.admin.js', '--coverage'], {
        stdio: this.options.verbose ? 'inherit' : 'pipe',
        shell: true
      });
      
      let output = '';
      if (!this.options.verbose) {
        jest.stdout.on('data', (data) => {
          output += data.toString();
        });
      }
      
      jest.on('close', (code) => {
        const result = this.parseJestOutput(output);
        result.exitCode = code;
        
        if (code === 0) {
          console.log('✅ Unit tests passed');
        } else {
          console.log('❌ Unit tests failed');
        }
        
        resolve(result);
      });
      
      jest.on('error', reject);
    });
  }

  async runIntegrationTests() {
    console.log('🔗 Running integration tests...');
    
    return new Promise((resolve, reject) => {
      const cmd = 'npx jest --config=jest.config.integration.js --testPathPattern=integration';
      
      exec(cmd, (error, stdout, stderr) => {
        if (error && error.code !== 1) { // Jest exits with 1 on test failures
          reject(error);
          return;
        }
        
        const result = this.parseJestOutput(stdout);
        result.exitCode = error ? error.code : 0;
        
        if (result.exitCode === 0) {
          console.log('✅ Integration tests passed');
        } else {
          console.log('❌ Integration tests failed');
        }
        
        resolve(result);
      });
    });
  }

  async runE2ETests() {
    console.log('🎭 Running E2E tests...');
    
    return new Promise((resolve, reject) => {
      const cypress = spawn('npx', ['cypress', 'run', '--project', 'apps/admin-e2e'], {
        stdio: this.options.verbose ? 'inherit' : 'pipe',
        shell: true
      });
      
      let output = '';
      if (!this.options.verbose) {
        cypress.stdout.on('data', (data) => {
          output += data.toString();
        });
      }
      
      cypress.on('close', (code) => {
        const result = this.parseCypressOutput(output);
        result.exitCode = code;
        
        if (code === 0) {
          console.log('✅ E2E tests passed');
        } else {
          console.log('❌ E2E tests failed');
        }
        
        resolve(result);
      });
      
      cypress.on('error', reject);
    });
  }

  async runSecurityTests() {
    console.log('🔒 Running security tests...');
    
    return new Promise((resolve, reject) => {
      const SecurityScanner = require('./security-testing/security-scanner.js');
      const scanner = new SecurityScanner('http://localhost:4201');
      
      scanner.runSecurityAudit()
        .then(() => {
          const reportPath = path.join(__dirname, '../reports/security-audit-report.json');
          const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
          
          const result = {
            passed: report.vulnerabilities.length === 0 ? 1 : 0,
            failed: report.vulnerabilities.length,
            total: 1,
            securityScore: report.securityScore,
            vulnerabilities: report.vulnerabilities,
            exitCode: report.vulnerabilities.length > 0 ? 1 : 0
          };
          
          if (result.exitCode === 0) {
            console.log('✅ Security tests passed');
          } else {
            console.log(`❌ Security tests failed (${report.vulnerabilities.length} vulnerabilities)`);
          }
          
          resolve(result);
        })
        .catch(reject);
    });
  }

  async runPerformanceTests() {
    console.log('⚡ Running performance tests...');
    
    return new Promise((resolve, reject) => {
      const LoadTester = require('./performance-testing/load-test.js');
      const tester = new LoadTester('http://localhost:4201', {
        concurrentUsers: 5,
        testDuration: 60000 // 1 minute for CI
      });
      
      tester.runLoadTest()
        .then(() => {
          const reportPath = path.join(__dirname, '../reports/load-test-report.json');
          const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
          
          const performanceScore = this.calculatePerformanceScore(report);
          
          const result = {
            passed: performanceScore >= 7 ? 1 : 0,
            failed: performanceScore < 7 ? 1 : 0,
            total: 1,
            performanceScore,
            metrics: report.performance,
            exitCode: performanceScore >= 7 ? 0 : 1
          };
          
          if (result.exitCode === 0) {
            console.log('✅ Performance tests passed');
          } else {
            console.log('❌ Performance tests failed');
          }
          
          resolve(result);
        })
        .catch(reject);
    });
  }

  async runAccessibilityTests() {
    console.log('♿ Running accessibility tests...');
    
    return new Promise((resolve, reject) => {
      const cmd = 'npx cypress run --spec "apps/admin-e2e/src/e2e/accessibility.cy.ts"';
      
      exec(cmd, (error, stdout, stderr) => {
        const result = this.parseCypressOutput(stdout);
        result.exitCode = error ? error.code : 0;
        
        // Calculate accessibility score based on test results
        const accessibilityScore = result.passed / (result.passed + result.failed) * 10;
        result.accessibilityScore = accessibilityScore;
        
        if (result.exitCode === 0) {
          console.log('✅ Accessibility tests passed');
        } else {
          console.log('❌ Accessibility tests failed');
        }
        
        resolve(result);
      });
    });
  }

  parseJestOutput(output) {
    const result = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      coverage: 0,
      duration: 0
    };
    
    // Parse Jest output for test counts
    const testMatch = output.match(/Tests:\s+(\d+) failed,\s+(\d+) passed,\s+(\d+) total/);
    if (testMatch) {
      result.failed = parseInt(testMatch[1]);
      result.passed = parseInt(testMatch[2]);
      result.total = parseInt(testMatch[3]);
    }
    
    // Parse coverage
    const coverageMatch = output.match(/All files\s+\|\s+([\d.]+)/);
    if (coverageMatch) {
      result.coverage = parseFloat(coverageMatch[1]);
    }
    
    return result;
  }

  parseCypressOutput(output) {
    const result = {
      passed: 0,
      failed: 0,
      total: 0,
      duration: 0
    };
    
    // Parse Cypress output
    const passMatch = output.match(/(\d+) passing/);
    const failMatch = output.match(/(\d+) failing/);
    
    if (passMatch) result.passed = parseInt(passMatch[1]);
    if (failMatch) result.failed = parseInt(failMatch[1]);
    result.total = result.passed + result.failed;
    
    return result;
  }

  calculatePerformanceScore(report) {
    let score = 10;
    
    // Deduct points based on performance metrics
    if (report.performance.responseTimeP95 > 2000) score -= 2;
    if (report.performance.responseTimeP95 > 3000) score -= 2;
    if (report.performance.errorRate > 5) score -= 3;
    if (report.performance.throughput < 10) score -= 2;
    
    return Math.max(0, score);
  }

  analyzeResults() {
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let skippedTests = 0;
    
    Object.values(this.testResults.results).forEach(result => {
      if (result.total) {
        totalTests += result.total;
        passedTests += result.passed || 0;
        failedTests += result.failed || 0;
        skippedTests += result.skipped || 0;
      }
    });
    
    this.testResults.summary = {
      ...this.testResults.summary,
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      duration: Date.now() - this.startTime,
      coverage: this.testResults.results.unit?.coverage || 0,
      securityScore: this.testResults.results.security?.securityScore || 0,
      performanceScore: this.testResults.results.performance?.performanceScore || 0,
      accessibilityScore: this.testResults.results.accessibility?.accessibilityScore || 0
    };
    
    // Generate recommendations
    this.generateRecommendations();
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.testResults.summary.coverage < 80) {
      recommendations.push('Increase test coverage to at least 80%');
    }
    
    if (this.testResults.summary.securityScore < 8) {
      recommendations.push('Address security vulnerabilities to improve security score');
    }
    
    if (this.testResults.summary.performanceScore < 7) {
      recommendations.push('Optimize application performance to meet SLA requirements');
    }
    
    if (this.testResults.summary.accessibilityScore < 9) {
      recommendations.push('Improve accessibility compliance for better user experience');
    }
    
    if (this.testResults.summary.failedTests > 0) {
      recommendations.push('Fix failing tests before deployment');
    }
    
    this.testResults.recommendations = recommendations;
  }

  async generateComprehensiveReport() {
    const reportPath = path.join(__dirname, '../reports/comprehensive-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2));
    
    // Generate HTML report
    const htmlReport = this.generateHTMLReport();
    const htmlPath = path.join(__dirname, '../reports/comprehensive-test-report.html');
    fs.writeFileSync(htmlPath, htmlReport);
    
    console.log(`📊 Comprehensive test report saved to: ${reportPath}`);
    console.log(`🌐 HTML report saved to: ${htmlPath}`);
  }

  generateHTMLReport() {
    const { summary, results, recommendations } = this.testResults;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Administrative Console Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .metric { display: inline-block; margin: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
        .passed { background: #d4edda; }
        .failed { background: #f8d7da; }
        .warning { background: #fff3cd; }
        .recommendations { background: #e7f3ff; padding: 15px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Administrative Console Test Report</h1>
        <p>Generated: ${this.testResults.timestamp}</p>
        <p>Duration: ${(summary.duration / 1000).toFixed(2)} seconds</p>
    </div>
    
    <h2>Summary</h2>
    <div class="metric ${summary.failedTests === 0 ? 'passed' : 'failed'}">
        <strong>Tests:</strong> ${summary.passedTests}/${summary.totalTests} passed
    </div>
    <div class="metric ${summary.coverage >= 80 ? 'passed' : 'warning'}">
        <strong>Coverage:</strong> ${summary.coverage.toFixed(1)}%
    </div>
    <div class="metric ${summary.securityScore >= 8 ? 'passed' : 'warning'}">
        <strong>Security:</strong> ${summary.securityScore}/10
    </div>
    <div class="metric ${summary.performanceScore >= 7 ? 'passed' : 'warning'}">
        <strong>Performance:</strong> ${summary.performanceScore}/10
    </div>
    
    <h2>Test Results</h2>
    ${Object.entries(results).map(([type, result]) => `
        <h3>${type.charAt(0).toUpperCase() + type.slice(1)} Tests</h3>
        <p>Passed: ${result.passed || 0}, Failed: ${result.failed || 0}, Total: ${result.total || 0}</p>
    `).join('')}
    
    <div class="recommendations">
        <h2>Recommendations</h2>
        <ul>
            ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
    </div>
</body>
</html>`;
  }

  displaySummary() {
    const { summary } = this.testResults;
    
    console.log('\n📊 Test Suite Summary');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${summary.totalTests}`);
    console.log(`Passed: ${summary.passedTests}`);
    console.log(`Failed: ${summary.failedTests}`);
    console.log(`Skipped: ${summary.skippedTests}`);
    console.log(`Coverage: ${summary.coverage.toFixed(1)}%`);
    console.log(`Security Score: ${summary.securityScore}/10`);
    console.log(`Performance Score: ${summary.performanceScore}/10`);
    console.log(`Accessibility Score: ${summary.accessibilityScore}/10`);
    console.log(`Duration: ${(summary.duration / 1000).toFixed(2)} seconds`);
    
    if (this.testResults.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      this.testResults.recommendations.forEach(rec => console.log(`  • ${rec}`));
    }
    
    if (summary.failedTests === 0) {
      console.log('\n✅ All tests passed! Ready for deployment.');
    } else {
      console.log('\n❌ Some tests failed. Review and fix before deployment.');
    }
  }

  ensureReportsDirectory() {
    const reportsDir = path.join(__dirname, '../reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  
  args.forEach(arg => {
    if (arg.startsWith('--no-')) {
      options[arg.replace('--no-', '')] = false;
    } else if (arg.startsWith('--')) {
      options[arg.replace('--', '')] = true;
    }
  });
  
  const runner = new ComprehensiveTestRunner(options);
  runner.runAllTests().catch(console.error);
}

module.exports = ComprehensiveTestRunner;