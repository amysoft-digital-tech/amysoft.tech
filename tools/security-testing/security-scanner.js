#!/usr/bin/env node

/**
 * Security Scanner for Beyond the AI Plateau Administrative Console
 * Comprehensive security testing tool for OWASP Top 10 vulnerabilities
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class SecurityScanner {
  constructor(baseUrl = 'http://localhost:4201') {
    this.baseUrl = baseUrl;
    this.browser = null;
    this.page = null;
    this.vulnerabilities = [];
    this.testResults = {
      timestamp: new Date().toISOString(),
      baseUrl: baseUrl,
      vulnerabilities: [],
      securityScore: 0,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0
    };
  }

  async initialize() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    
    // Set up request interception for security header analysis
    await this.page.setRequestInterception(true);
    this.page.on('request', request => {
      request.continue();
    });
    
    this.page.on('response', response => {
      this.analyzeSecurityHeaders(response);
    });
  }

  async runSecurityAudit() {
    console.log('🔒 Starting comprehensive security audit...');
    
    try {
      await this.initialize();
      
      // OWASP Top 10 Security Tests
      await this.testInjectionVulnerabilities();
      await this.testBrokenAuthentication();
      await this.testSensitiveDataExposure();
      await this.testXMLExternalEntities();
      await this.testBrokenAccessControl();
      await this.testSecurityMisconfiguration();
      await this.testCrossSiteScripting();
      await this.testInsecureDeserialization();
      await this.testKnownVulnerabilities();
      await this.testInsufficientLogging();
      
      // Additional Admin-Specific Tests
      await this.testSessionManagement();
      await this.testCSRFProtection();
      await this.testInputValidation();
      await this.testFileUploadSecurity();
      await this.testAPISecurityHeaders();
      
      this.calculateSecurityScore();
      await this.generateReport();
      
    } catch (error) {
      console.error('Security audit failed:', error);
    } finally {
      await this.cleanup();
    }
  }

  async testInjectionVulnerabilities() {
    console.log('Testing for injection vulnerabilities...');
    this.testResults.totalTests++;
    
    try {
      await this.page.goto(`${this.baseUrl}/admin/users`);
      
      // SQL Injection tests
      const sqlPayloads = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "admin'/*",
        "' UNION SELECT * FROM users --"
      ];
      
      for (const payload of sqlPayloads) {
        await this.page.type('[data-cy="search-users-input"]', payload);
        await this.page.click('[data-cy="search-btn"]');
        
        const errorElements = await this.page.$$('[data-cy="sql-error"], .error-message');
        if (errorElements.length > 0) {
          this.addVulnerability('SQL Injection', 'HIGH', 
            `SQL injection vulnerability detected with payload: ${payload}`);
        }
        
        await this.page.evaluate(() => {
          const input = document.querySelector('[data-cy="search-users-input"]');
          if (input) input.value = '';
        });
      }
      
      // NoSQL Injection tests
      const noSqlPayloads = [
        '{"$gt":""}',
        '{"$ne":null}',
        '{"$regex":".*"}'
      ];
      
      for (const payload of noSqlPayloads) {
        await this.testAPIEndpoint('/api/admin/users', 'POST', {
          query: payload
        });
      }
      
      this.testResults.passedTests++;
    } catch (error) {
      this.testResults.failedTests++;
      console.error('Injection test failed:', error);
    }
  }

  async testBrokenAuthentication() {
    console.log('Testing authentication mechanisms...');
    this.testResults.totalTests++;
    
    try {
      // Test weak password policy
      await this.page.goto(`${this.baseUrl}/login`);
      
      const weakPasswords = ['123456', 'password', 'admin', ''];
      for (const password of weakPasswords) {
        await this.page.type('[data-cy="email-input"]', 'test@example.com');
        await this.page.type('[data-cy="password-input"]', password);
        await this.page.click('[data-cy="login-btn"]');
        
        const success = await this.page.waitForSelector('[data-cy="dashboard"]', { timeout: 1000 })
          .then(() => true)
          .catch(() => false);
          
        if (success) {
          this.addVulnerability('Weak Authentication', 'HIGH',
            `Weak password accepted: ${password}`);
        }
        
        await this.page.evaluate(() => {
          document.querySelector('[data-cy="email-input"]').value = '';
          document.querySelector('[data-cy="password-input"]').value = '';
        });
      }
      
      // Test session fixation
      const sessionBefore = await this.page.evaluate(() => {
        return document.cookie;
      });
      
      await this.page.goto(`${this.baseUrl}/login`);
      const sessionAfter = await this.page.evaluate(() => {
        return document.cookie;
      });
      
      if (sessionBefore === sessionAfter) {
        this.addVulnerability('Session Fixation', 'MEDIUM',
          'Session ID not regenerated after login');
      }
      
      this.testResults.passedTests++;
    } catch (error) {
      this.testResults.failedTests++;
      console.error('Authentication test failed:', error);
    }
  }

  async testSensitiveDataExposure() {
    console.log('Testing for sensitive data exposure...');
    this.testResults.totalTests++;
    
    try {
      await this.page.goto(`${this.baseUrl}/admin`);
      
      // Check for exposed sensitive data in DOM
      const sensitiveData = await this.page.evaluate(() => {
        const text = document.body.innerText;
        const html = document.body.innerHTML;
        
        const sensitivePatterns = [
          /password/i,
          /api[_-]?key/i,
          /secret/i,
          /token/i,
          /private[_-]?key/i,
          /credit[_-]?card/i,
          /ssn/i,
          /social[_-]?security/i
        ];
        
        const exposedData = [];
        sensitivePatterns.forEach(pattern => {
          if (pattern.test(text) || pattern.test(html)) {
            exposedData.push(pattern.toString());
          }
        });
        
        return exposedData;
      });
      
      if (sensitiveData.length > 0) {
        this.addVulnerability('Sensitive Data Exposure', 'HIGH',
          `Potentially sensitive data exposed: ${sensitiveData.join(', ')}`);
      }
      
      // Check localStorage and sessionStorage
      const storageData = await this.page.evaluate(() => {
        const localStorage = window.localStorage;
        const sessionStorage = window.sessionStorage;
        const exposedKeys = [];
        
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('password') || key.includes('secret') || key.includes('key'))) {
            exposedKeys.push(`localStorage: ${key}`);
          }
        }
        
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && (key.includes('password') || key.includes('secret') || key.includes('key'))) {
            exposedKeys.push(`sessionStorage: ${key}`);
          }
        }
        
        return exposedKeys;
      });
      
      if (storageData.length > 0) {
        this.addVulnerability('Sensitive Data in Storage', 'MEDIUM',
          `Sensitive data in browser storage: ${storageData.join(', ')}`);
      }
      
      this.testResults.passedTests++;
    } catch (error) {
      this.testResults.failedTests++;
      console.error('Sensitive data test failed:', error);
    }
  }

  async testCrossSiteScripting() {
    console.log('Testing for XSS vulnerabilities...');
    this.testResults.totalTests++;
    
    try {
      await this.page.goto(`${this.baseUrl}/admin/content`);
      
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '<img src="x" onerror="alert(1)">',
        'javascript:alert("XSS")',
        '<svg onload="alert(1)">',
        '"><script>alert("XSS")</script>',
        '<iframe src="javascript:alert(1)"></iframe>'
      ];
      
      for (const payload of xssPayloads) {
        // Test input fields
        await this.page.type('[data-cy="chapter-title-input"]', payload);
        await this.page.type('[data-cy="chapter-content-editor"]', payload);
        
        // Check if script is executed
        const dialogHandled = await this.page.evaluate(() => {
          return new Promise((resolve) => {
            const originalAlert = window.alert;
            let alertCalled = false;
            
            window.alert = function() {
              alertCalled = true;
              window.alert = originalAlert;
              resolve(true);
            };
            
            setTimeout(() => {
              if (!alertCalled) {
                window.alert = originalAlert;
                resolve(false);
              }
            }, 1000);
          });
        });
        
        if (dialogHandled) {
          this.addVulnerability('Cross-Site Scripting (XSS)', 'HIGH',
            `XSS vulnerability detected with payload: ${payload}`);
        }
        
        // Clear inputs
        await this.page.evaluate(() => {
          const titleInput = document.querySelector('[data-cy="chapter-title-input"]');
          const contentInput = document.querySelector('[data-cy="chapter-content-editor"]');
          if (titleInput) titleInput.value = '';
          if (contentInput) contentInput.value = '';
        });
      }
      
      this.testResults.passedTests++;
    } catch (error) {
      this.testResults.failedTests++;
      console.error('XSS test failed:', error);
    }
  }

  async testCSRFProtection() {
    console.log('Testing CSRF protection...');
    this.testResults.totalTests++;
    
    try {
      await this.page.goto(`${this.baseUrl}/admin`);
      
      // Check for CSRF token in meta tag
      const csrfToken = await this.page.$eval('meta[name="csrf-token"]', 
        el => el.getAttribute('content')).catch(() => null);
      
      if (!csrfToken) {
        this.addVulnerability('Missing CSRF Protection', 'HIGH',
          'CSRF token not found in page meta tags');
      }
      
      // Test CSRF attack simulation
      const response = await this.page.evaluate(async () => {
        try {
          const response = await fetch('/api/admin/users', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: 'attacker@example.com' })
          });
          return { status: response.status, ok: response.ok };
        } catch (error) {
          return { error: error.message };
        }
      });
      
      if (response.ok) {
        this.addVulnerability('CSRF Vulnerability', 'HIGH',
          'Request succeeded without CSRF token validation');
      }
      
      this.testResults.passedTests++;
    } catch (error) {
      this.testResults.failedTests++;
      console.error('CSRF test failed:', error);
    }
  }

  async analyzeSecurityHeaders(response) {
    const url = response.url();
    const headers = response.headers();
    
    // Required security headers
    const requiredHeaders = {
      'x-frame-options': 'Clickjacking protection',
      'x-content-type-options': 'MIME type sniffing protection',
      'x-xss-protection': 'XSS protection',
      'strict-transport-security': 'HTTPS enforcement',
      'content-security-policy': 'Content Security Policy'
    };
    
    Object.entries(requiredHeaders).forEach(([header, description]) => {
      if (!headers[header]) {
        this.addVulnerability('Missing Security Header', 'MEDIUM',
          `Missing ${header} header (${description}) on ${url}`);
      }
    });
  }

  async testAPIEndpoint(endpoint, method = 'GET', data = null) {
    try {
      const response = await this.page.evaluate(async (endpoint, method, data) => {
        const options = {
          method: method,
          headers: {
            'Content-Type': 'application/json'
          }
        };
        
        if (data) {
          options.body = JSON.stringify(data);
        }
        
        const response = await fetch(endpoint, options);
        return {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          text: await response.text()
        };
      }, endpoint, method, data);
      
      return response;
    } catch (error) {
      console.error(`API test failed for ${endpoint}:`, error);
      return null;
    }
  }

  addVulnerability(type, severity, description) {
    const vulnerability = {
      type,
      severity,
      description,
      timestamp: new Date().toISOString()
    };
    
    this.vulnerabilities.push(vulnerability);
    this.testResults.vulnerabilities.push(vulnerability);
    console.warn(`⚠️  ${severity} - ${type}: ${description}`);
  }

  calculateSecurityScore() {
    const totalVulnerabilities = this.vulnerabilities.length;
    const highSeverity = this.vulnerabilities.filter(v => v.severity === 'HIGH').length;
    const mediumSeverity = this.vulnerabilities.filter(v => v.severity === 'MEDIUM').length;
    const lowSeverity = this.vulnerabilities.filter(v => v.severity === 'LOW').length;
    
    // Calculate score (10 = perfect, 0 = terrible)
    let score = 10;
    score -= (highSeverity * 3);
    score -= (mediumSeverity * 2);
    score -= (lowSeverity * 1);
    
    this.testResults.securityScore = Math.max(0, score);
  }

  async generateReport() {
    const report = {
      ...this.testResults,
      summary: {
        totalVulnerabilities: this.vulnerabilities.length,
        highSeverity: this.vulnerabilities.filter(v => v.severity === 'HIGH').length,
        mediumSeverity: this.vulnerabilities.filter(v => v.severity === 'MEDIUM').length,
        lowSeverity: this.vulnerabilities.filter(v => v.severity === 'LOW').length
      },
      recommendations: this.generateRecommendations()
    };
    
    const reportPath = path.join(__dirname, '../../reports/security-audit-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📊 Security Audit Complete!`);
    console.log(`Security Score: ${this.testResults.securityScore}/10`);
    console.log(`Total Vulnerabilities: ${this.vulnerabilities.length}`);
    console.log(`Report saved to: ${reportPath}`);
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.vulnerabilities.some(v => v.type.includes('Injection'))) {
      recommendations.push('Implement parameterized queries and input validation to prevent injection attacks');
    }
    
    if (this.vulnerabilities.some(v => v.type.includes('XSS'))) {
      recommendations.push('Implement proper output encoding and Content Security Policy headers');
    }
    
    if (this.vulnerabilities.some(v => v.type.includes('Authentication'))) {
      recommendations.push('Strengthen authentication mechanisms and implement proper session management');
    }
    
    if (this.vulnerabilities.some(v => v.type.includes('CSRF'))) {
      recommendations.push('Implement CSRF tokens for all state-changing operations');
    }
    
    if (this.vulnerabilities.some(v => v.type.includes('Security Header'))) {
      recommendations.push('Configure proper security headers to protect against common attacks');
    }
    
    return recommendations;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// CLI interface
if (require.main === module) {
  const baseUrl = process.argv[2] || 'http://localhost:4201';
  const scanner = new SecurityScanner(baseUrl);
  scanner.runSecurityAudit().catch(console.error);
}

module.exports = SecurityScanner;