#!/usr/bin/env node

/**
 * Performance Load Testing for Beyond the AI Plateau Administrative Console
 * Comprehensive performance testing with realistic admin workloads
 */

const { performance } = require('perf_hooks');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class AdminLoadTester {
  constructor(baseUrl = 'http://localhost:4201', options = {}) {
    this.baseUrl = baseUrl;
    this.options = {
      concurrentUsers: options.concurrentUsers || 10,
      testDuration: options.testDuration || 300000, // 5 minutes
      rampUpTime: options.rampUpTime || 60000, // 1 minute
      scenarios: options.scenarios || [
        'userManagement',
        'contentManagement',
        'analyticsViewing',
        'systemAdministration'
      ]
    };
    
    this.browsers = [];
    this.testResults = {
      timestamp: new Date().toISOString(),
      configuration: this.options,
      scenarios: {},
      performance: {
        responseTimeP50: 0,
        responseTimeP95: 0,
        responseTimeP99: 0,
        throughput: 0,
        errorRate: 0,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0
      },
      resourceUsage: {
        memoryUsage: [],
        cpuUsage: [],
        networkUsage: []
      }
    };
    
    this.performanceMetrics = [];
    this.errors = [];
  }

  async runLoadTest() {
    console.log('🚀 Starting administrative console load test...');
    console.log(`Configuration: ${this.options.concurrentUsers} users, ${this.options.testDuration/1000}s duration`);
    
    try {
      await this.initializeBrowsers();
      await this.rampUpUsers();
      await this.runTestScenarios();
      await this.collectResults();
      await this.generateReport();
    } catch (error) {
      console.error('Load test failed:', error);
    } finally {
      await this.cleanup();
    }
  }

  async initializeBrowsers() {
    console.log('Initializing browser instances...');
    
    for (let i = 0; i < this.options.concurrentUsers; i++) {
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-extensions'
        ]
      });
      
      this.browsers.push(browser);
    }
  }

  async rampUpUsers() {
    console.log('Ramping up users...');
    const rampUpInterval = this.options.rampUpTime / this.options.concurrentUsers;
    
    for (let i = 0; i < this.options.concurrentUsers; i++) {
      setTimeout(async () => {
        await this.startUserSession(i);
      }, i * rampUpInterval);
    }
    
    // Wait for ramp-up to complete
    await new Promise(resolve => setTimeout(resolve, this.options.rampUpTime));
  }

  async startUserSession(userIndex) {
    const browser = this.browsers[userIndex];
    const page = await browser.newPage();
    
    // Set up performance monitoring
    await page.setRequestInterception(true);
    page.on('request', request => {
      const startTime = performance.now();
      request.startTime = startTime;
      request.continue();
    });
    
    page.on('response', response => {
      const endTime = performance.now();
      const request = response.request();
      const responseTime = endTime - (request.startTime || endTime);
      
      this.recordPerformanceMetric({
        url: response.url(),
        status: response.status(),
        responseTime,
        timestamp: Date.now(),
        userIndex
      });
    });
    
    // Authenticate user
    await this.authenticateUser(page, userIndex);
    
    // Start scenario execution
    this.executeUserScenarios(page, userIndex);
  }

  async authenticateUser(page, userIndex) {
    try {
      await page.goto(`${this.baseUrl}/login`);
      await page.type('[data-cy="email-input"]', `testuser${userIndex}@amysoft.tech`);
      await page.type('[data-cy="password-input"]', 'loadtest-password');
      await page.click('[data-cy="login-btn"]');
      await page.waitForNavigation();
    } catch (error) {
      this.recordError('Authentication', error.message, userIndex);
    }
  }

  async executeUserScenarios(page, userIndex) {
    const scenarioInterval = this.options.testDuration / this.options.scenarios.length;
    let currentScenario = 0;
    
    const scenarioRunner = setInterval(async () => {
      if (currentScenario >= this.options.scenarios.length) {
        currentScenario = 0; // Loop back to beginning
      }
      
      const scenario = this.options.scenarios[currentScenario];
      await this.executeScenario(page, scenario, userIndex);
      currentScenario++;
    }, scenarioInterval);
    
    // Stop scenarios after test duration
    setTimeout(() => {
      clearInterval(scenarioRunner);
    }, this.options.testDuration);
  }

  async executeScenario(page, scenarioName, userIndex) {
    const startTime = performance.now();
    
    try {
      switch (scenarioName) {
        case 'userManagement':
          await this.userManagementScenario(page);
          break;
        case 'contentManagement':
          await this.contentManagementScenario(page);
          break;
        case 'analyticsViewing':
          await this.analyticsViewingScenario(page);
          break;
        case 'systemAdministration':
          await this.systemAdministrationScenario(page);
          break;
      }
      
      const endTime = performance.now();
      this.recordScenarioMetric(scenarioName, endTime - startTime, 'success', userIndex);
    } catch (error) {
      const endTime = performance.now();
      this.recordScenarioMetric(scenarioName, endTime - startTime, 'error', userIndex);
      this.recordError(scenarioName, error.message, userIndex);
    }
  }

  async userManagementScenario(page) {
    // Navigate to user management
    await page.goto(`${this.baseUrl}/admin/users`);
    await page.waitForSelector('[data-cy="users-table"]');
    
    // Search for users
    await page.type('[data-cy="search-users-input"]', 'test');
    await page.click('[data-cy="search-btn"]');
    await page.waitForSelector('[data-cy="search-results"]');
    
    // View user details
    await page.click('[data-cy="user-item"]:first-child');
    await page.waitForSelector('[data-cy="user-details"]');
    
    // Edit user information
    await page.click('[data-cy="edit-user-btn"]');
    await page.waitForSelector('[data-cy="edit-user-form"]');
    
    // Random wait to simulate thinking time
    await page.waitForTimeout(Math.random() * 2000 + 1000);
    
    // Save changes
    await page.click('[data-cy="save-user-btn"]');
    await page.waitForSelector('[data-cy="success-notification"]');
  }

  async contentManagementScenario(page) {
    // Navigate to content management
    await page.goto(`${this.baseUrl}/admin/content`);
    await page.waitForSelector('[data-cy="chapters-list"]');
    
    // View chapter list
    await page.click('[data-cy="chapters-tab"]');
    await page.waitForSelector('[data-cy="chapter-item"]');
    
    // Edit a chapter
    await page.click('[data-cy="chapter-item"]:first-child');
    await page.waitForSelector('[data-cy="chapter-editor"]');
    
    // Make minor edit
    await page.focus('[data-cy="chapter-content-editor"]');
    await page.keyboard.type(' Updated content...');
    
    // Random wait to simulate editing time
    await page.waitForTimeout(Math.random() * 3000 + 2000);
    
    // Save changes
    await page.click('[data-cy="save-chapter-btn"]');
    await page.waitForSelector('[data-cy="save-success"]');
    
    // Check template library
    await page.click('[data-cy="templates-tab"]');
    await page.waitForSelector('[data-cy="templates-list"]');
  }

  async analyticsViewingScenario(page) {
    // Navigate to analytics dashboard
    await page.goto(`${this.baseUrl}/admin/analytics`);
    await page.waitForSelector('[data-cy="kpi-cards"]');
    
    // View different analytics tabs
    const tabs = ['[data-cy="users-tab"]', '[data-cy="content-tab"]', '[data-cy="marketing-tab"]'];
    
    for (const tab of tabs) {
      await page.click(tab);
      await page.waitForSelector('[data-cy="analytics-content"]');
      await page.waitForTimeout(Math.random() * 1500 + 500);
    }
    
    // Generate custom report
    await page.click('[data-cy="reports-tab"]');
    await page.waitForSelector('[data-cy="reports-content"]');
    
    // Change date range
    await page.click('[data-cy="date-range-picker"]');
    await page.click('[data-cy="last-30-days"]');
    await page.waitForSelector('[data-cy="loading-indicator"]');
    await page.waitForSelector('[data-cy="analytics-updated"]');
  }

  async systemAdministrationScenario(page) {
    // Navigate to system settings
    await page.goto(`${this.baseUrl}/admin/system`);
    await page.waitForSelector('[data-cy="system-settings"]');
    
    // Check system health
    await page.click('[data-cy="health-check-btn"]');
    await page.waitForSelector('[data-cy="health-status"]');
    
    // View audit logs
    await page.click('[data-cy="audit-logs-tab"]');
    await page.waitForSelector('[data-cy="audit-log-list"]');
    
    // Filter logs
    await page.select('[data-cy="log-level-filter"]', 'INFO');
    await page.waitForSelector('[data-cy="filtered-logs"]');
    
    // Random wait to simulate review time
    await page.waitForTimeout(Math.random() * 2000 + 1000);
  }

  recordPerformanceMetric(metric) {
    this.performanceMetrics.push(metric);
    this.testResults.performance.totalRequests++;
    
    if (metric.status >= 200 && metric.status < 400) {
      this.testResults.performance.successfulRequests++;
    } else {
      this.testResults.performance.failedRequests++;
    }
  }

  recordScenarioMetric(scenario, duration, status, userIndex) {
    if (!this.testResults.scenarios[scenario]) {
      this.testResults.scenarios[scenario] = {
        executions: 0,
        totalDuration: 0,
        averageDuration: 0,
        successCount: 0,
        errorCount: 0,
        successRate: 0
      };
    }
    
    const scenarioData = this.testResults.scenarios[scenario];
    scenarioData.executions++;
    scenarioData.totalDuration += duration;
    scenarioData.averageDuration = scenarioData.totalDuration / scenarioData.executions;
    
    if (status === 'success') {
      scenarioData.successCount++;
    } else {
      scenarioData.errorCount++;
    }
    
    scenarioData.successRate = (scenarioData.successCount / scenarioData.executions) * 100;
  }

  recordError(context, message, userIndex) {
    this.errors.push({
      context,
      message,
      userIndex,
      timestamp: Date.now()
    });
  }

  async collectResults() {
    console.log('Collecting test results...');
    
    // Calculate response time percentiles
    const responseTimes = this.performanceMetrics.map(m => m.responseTime).sort((a, b) => a - b);
    const total = responseTimes.length;
    
    if (total > 0) {
      this.testResults.performance.responseTimeP50 = responseTimes[Math.floor(total * 0.5)];
      this.testResults.performance.responseTimeP95 = responseTimes[Math.floor(total * 0.95)];
      this.testResults.performance.responseTimeP99 = responseTimes[Math.floor(total * 0.99)];
    }
    
    // Calculate throughput (requests per second)
    const testDurationSeconds = this.options.testDuration / 1000;
    this.testResults.performance.throughput = this.testResults.performance.totalRequests / testDurationSeconds;
    
    // Calculate error rate
    this.testResults.performance.errorRate = 
      (this.testResults.performance.failedRequests / this.testResults.performance.totalRequests) * 100;
  }

  async generateReport() {
    const report = {
      ...this.testResults,
      errors: this.errors,
      summary: {
        totalUsers: this.options.concurrentUsers,
        testDuration: this.options.testDuration / 1000,
        totalRequests: this.testResults.performance.totalRequests,
        averageResponseTime: this.testResults.performance.responseTimeP50,
        throughput: this.testResults.performance.throughput.toFixed(2),
        errorRate: this.testResults.performance.errorRate.toFixed(2),
        successRate: (100 - this.testResults.performance.errorRate).toFixed(2)
      },
      recommendations: this.generatePerformanceRecommendations()
    };
    
    const reportPath = path.join(__dirname, '../../reports/load-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n📊 Load Test Complete!');
    console.log(`Total Requests: ${report.summary.totalRequests}`);
    console.log(`Throughput: ${report.summary.throughput} req/sec`);
    console.log(`Average Response Time: ${report.summary.averageResponseTime.toFixed(2)}ms`);
    console.log(`Error Rate: ${report.summary.errorRate}%`);
    console.log(`Report saved to: ${reportPath}`);
  }

  generatePerformanceRecommendations() {
    const recommendations = [];
    
    if (this.testResults.performance.responseTimeP95 > 2000) {
      recommendations.push('Consider implementing caching strategies to improve response times');
    }
    
    if (this.testResults.performance.errorRate > 5) {
      recommendations.push('High error rate detected - investigate application stability');
    }
    
    if (this.testResults.performance.throughput < 10) {
      recommendations.push('Low throughput detected - consider scaling infrastructure');
    }
    
    Object.entries(this.testResults.scenarios).forEach(([scenario, data]) => {
      if (data.successRate < 95) {
        recommendations.push(`${scenario} scenario has low success rate (${data.successRate.toFixed(1)}%)`);
      }
      
      if (data.averageDuration > 5000) {
        recommendations.push(`${scenario} scenario is slow (${data.averageDuration.toFixed(0)}ms average)`);
      }
    });
    
    return recommendations;
  }

  async cleanup() {
    console.log('Cleaning up browser instances...');
    
    for (const browser of this.browsers) {
      try {
        await browser.close();
      } catch (error) {
        console.error('Error closing browser:', error);
      }
    }
  }
}

// CLI interface
if (require.main === module) {
  const baseUrl = process.argv[2] || 'http://localhost:4201';
  const concurrentUsers = parseInt(process.argv[3]) || 10;
  const testDuration = parseInt(process.argv[4]) * 1000 || 300000; // Convert to ms
  
  const loadTester = new AdminLoadTester(baseUrl, {
    concurrentUsers,
    testDuration,
    rampUpTime: 60000
  });
  
  loadTester.runLoadTest().catch(console.error);
}

module.exports = AdminLoadTester;