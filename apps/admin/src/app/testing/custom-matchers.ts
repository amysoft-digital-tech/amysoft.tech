/**
 * Custom Jest matchers for admin console testing
 * Provides domain-specific assertions for administrative functions
 */

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveValidRole(expectedRole: string): R;
      toHavePermission(permission: string): R;
      toBeAccessibleComponent(): R;
      toHaveSecureHeaders(): R;
      toBeWithinPerformanceThreshold(maxTime: number): R;
      toPassSecurityValidation(): R;
      toHaveValidCSRFToken(): R;
      toSanitizeUserInput(): R;
      toPreventSQLInjection(payload: string): R;
      toPreventXSS(payload: string): R;
      toHaveValidAuditLog(): R;
      toCompleteWithinSLA(maxDuration: number): R;
    }
  }
}

// Role-based access control matchers
expect.extend({
  toHaveValidRole(received: any, expectedRole: string) {
    const pass = received && received.role === expectedRole;
    
    if (pass) {
      return {
        message: () => `Expected user not to have role ${expectedRole}`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected user to have role ${expectedRole}, but got ${received?.role || 'no role'}`,
        pass: false,
      };
    }
  },

  toHavePermission(received: any, permission: string) {
    const hasPermission = received && 
                         received.permissions && 
                         received.permissions.includes(permission);
    
    if (hasPermission) {
      return {
        message: () => `Expected user not to have permission ${permission}`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected user to have permission ${permission}`,
        pass: false,
      };
    }
  }
});

// Accessibility testing matchers
expect.extend({
  toBeAccessibleComponent(received: HTMLElement) {
    const issues = [];
    
    // Check for aria-labels on interactive elements
    const interactiveElements = received.querySelectorAll('button, [role="button"], input, select, textarea');
    interactiveElements.forEach((element, index) => {
      const hasLabel = element.getAttribute('aria-label') || 
                      element.getAttribute('aria-labelledby') ||
                      element.textContent?.trim();
      if (!hasLabel) {
        issues.push(`Interactive element ${index} missing aria-label`);
      }
    });
    
    // Check for proper heading hierarchy
    const headings = received.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;
    headings.forEach((heading) => {
      const level = parseInt(heading.tagName.charAt(1));
      if (level > previousLevel + 1) {
        issues.push(`Heading level ${level} skips level ${previousLevel + 1}`);
      }
      previousLevel = level;
    });
    
    // Check for form labels
    const inputs = received.querySelectorAll('input:not([type="hidden"]), textarea, select');
    inputs.forEach((input, index) => {
      const id = input.id;
      const hasLabel = id && received.querySelector(`label[for="${id}"]`);
      if (!hasLabel && !input.getAttribute('aria-label')) {
        issues.push(`Form input ${index} missing associated label`);
      }
    });
    
    const pass = issues.length === 0;
    
    return {
      message: () => pass 
        ? 'Expected component to have accessibility issues'
        : `Component has accessibility issues: ${issues.join(', ')}`,
      pass,
    };
  }
});

// Security testing matchers
expect.extend({
  toHaveSecureHeaders(received: Response | any) {
    const headers = received.headers || new Map();
    const requiredHeaders = [
      'x-frame-options',
      'x-content-type-options',
      'x-xss-protection',
      'strict-transport-security'
    ];
    
    const missingHeaders = requiredHeaders.filter(header => 
      !headers.get || !headers.get(header)
    );
    
    const pass = missingHeaders.length === 0;
    
    return {
      message: () => pass
        ? 'Expected response not to have secure headers'
        : `Response missing security headers: ${missingHeaders.join(', ')}`,
      pass,
    };
  },

  toHaveValidCSRFToken(received: HTMLElement | Document) {
    const csrfToken = received.querySelector('meta[name="csrf-token"]');
    const tokenValue = csrfToken?.getAttribute('content');
    
    const pass = csrfToken && tokenValue && tokenValue.length > 10;
    
    return {
      message: () => pass
        ? 'Expected page not to have valid CSRF token'
        : 'Expected page to have valid CSRF token in meta tag',
      pass,
    };
  },

  toSanitizeUserInput(received: string) {
    const dangerousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi
    ];
    
    const hasDangerousContent = dangerousPatterns.some(pattern => 
      pattern.test(received)
    );
    
    const pass = !hasDangerousContent;
    
    return {
      message: () => pass
        ? 'Expected input to contain dangerous content'
        : 'Expected input to be sanitized of dangerous content',
      pass,
    };
  },

  toPreventSQLInjection(received: any, payload: string) {
    // Check if SQL injection payload was escaped/prevented
    const sqlPatterns = [
      /;\s*drop\s+table/gi,
      /'\s*or\s+'1'\s*=\s*'1/gi,
      /union\s+select/gi,
      /--/g,
      /\/\*/g
    ];
    
    const containsSQLInjection = sqlPatterns.some(pattern => 
      pattern.test(received.toString())
    );
    
    const pass = !containsSQLInjection;
    
    return {
      message: () => pass
        ? 'Expected SQL injection to be present'
        : `SQL injection vulnerability detected with payload: ${payload}`,
      pass,
    };
  },

  toPreventXSS(received: HTMLElement, payload: string) {
    const innerHTML = received.innerHTML;
    const textContent = received.textContent || '';
    
    // Check if XSS payload was executed or rendered as HTML
    const xssExecuted = innerHTML.includes('<script>') || 
                       innerHTML.includes('javascript:') ||
                       innerHTML.includes('onerror=');
    
    // Check if payload was properly escaped
    const properlyEscaped = textContent.includes(payload) && !xssExecuted;
    
    const pass = !xssExecuted && properlyEscaped;
    
    return {
      message: () => pass
        ? 'Expected XSS payload to be executed'
        : `XSS vulnerability detected with payload: ${payload}`,
      pass,
    };
  }
});

// Performance testing matchers
expect.extend({
  toBeWithinPerformanceThreshold(received: number, maxTime: number) {
    const pass = received <= maxTime;
    
    return {
      message: () => pass
        ? `Expected operation to take longer than ${maxTime}ms, but completed in ${received}ms`
        : `Expected operation to complete within ${maxTime}ms, but took ${received}ms`,
      pass,
    };
  },

  toCompleteWithinSLA(received: Promise<any> | number, maxDuration: number) {
    let duration: number;
    
    if (typeof received === 'number') {
      duration = received;
    } else {
      // If it's a promise, we need to measure its execution time
      const start = Date.now();
      return received.then(() => {
        duration = Date.now() - start;
        const pass = duration <= maxDuration;
        
        return {
          message: () => pass
            ? `Expected operation to exceed SLA of ${maxDuration}ms`
            : `Operation exceeded SLA: ${duration}ms > ${maxDuration}ms`,
          pass,
        };
      });
    }
    
    const pass = duration <= maxDuration;
    
    return {
      message: () => pass
        ? `Expected operation to exceed SLA of ${maxDuration}ms`
        : `Operation exceeded SLA: ${duration}ms > ${maxDuration}ms`,
      pass,
    };
  }
});

// Business logic matchers
expect.extend({
  toHaveValidAuditLog(received: any) {
    const requiredFields = ['userId', 'action', 'timestamp', 'resource'];
    const missingFields = requiredFields.filter(field => !received[field]);
    
    const hasValidTimestamp = received.timestamp && 
                             new Date(received.timestamp).getTime() > 0;
    
    const hasValidAction = received.action && 
                          typeof received.action === 'string' &&
                          received.action.length > 0;
    
    const pass = missingFields.length === 0 && hasValidTimestamp && hasValidAction;
    
    return {
      message: () => pass
        ? 'Expected audit log to be invalid'
        : `Invalid audit log: missing fields [${missingFields.join(', ')}], valid timestamp: ${hasValidTimestamp}, valid action: ${hasValidAction}`,
      pass,
    };
  },

  toPassSecurityValidation(received: any) {
    const securityChecks = {
      hasEncryption: received.encrypted === true,
      hasAuthentication: received.authenticated === true,
      hasAuthorization: received.authorized === true,
      hasInputValidation: received.inputValidated === true,
      hasAuditLogging: received.auditLogged === true
    };
    
    const failedChecks = Object.entries(securityChecks)
      .filter(([_, passed]) => !passed)
      .map(([check, _]) => check);
    
    const pass = failedChecks.length === 0;
    
    return {
      message: () => pass
        ? 'Expected security validation to fail'
        : `Security validation failed: ${failedChecks.join(', ')}`,
      pass,
    };
  }
});

export {};