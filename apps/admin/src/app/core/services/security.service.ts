import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SecurityEvent {
  type: SecurityEventType;
  severity: SecuritySeverity;
  description: string;
  ipAddress: string;
  userAgent: string;
  userId?: string;
  metadata: Record<string, any>;
  timestamp: Date;
}

export enum SecurityEventType {
  FAILED_LOGIN = 'failed_login',
  MULTIPLE_FAILED_LOGINS = 'multiple_failed_logins',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  DATA_BREACH_ATTEMPT = 'data_breach_attempt',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  XSS_ATTEMPT = 'xss_attempt',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  CSRF_VIOLATION = 'csrf_violation'
}

export enum SecuritySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface CSPViolation {
  documentURI: string;
  referrer: string;
  violatedDirective: string;
  originalPolicy: string;
  blockedURI: string;
  lineNumber: number;
  columnNumber: number;
  sourceFile: string;
}

@Injectable({
  providedIn: 'root'
})
export class SecurityService {
  private readonly API_URL = '/api/admin/security';
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  private failedAttempts = new Map<string, { count: number; lastAttempt: Date }>();
  private securityAlertsSubject = new BehaviorSubject<SecurityEvent[]>([]);
  
  public securityAlerts$ = this.securityAlertsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.initializeSecurityFeatures();
  }

  private initializeSecurityFeatures(): void {
    this.setupCSPViolationHandler();
    this.setupXSSProtection();
    this.setupClickjackingProtection();
    this.preventConsoleAccess();
    this.setupSecurityHeaders();
  }

  // OWASP A01: Broken Access Control Prevention
  validatePermission(resource: string, action: string, context?: any): boolean {
    // This would typically validate against user permissions
    // Implementation depends on your permission structure
    return true;
  }

  // OWASP A02: Cryptographic Failures Prevention
  generateSecureToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  hashSensitiveData(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    return crypto.subtle.digest('SHA-256', dataBuffer).then(hashBuffer => {
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    });
  }

  // OWASP A03: Injection Prevention
  sanitizeInput(input: string): string {
    // HTML entity encoding
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  validateInput(input: string, pattern: RegExp): boolean {
    return pattern.test(input);
  }

  // OWASP A04: Insecure Design Prevention
  enforcePasswordPolicy(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 12) {
      errors.push('Password must be at least 12 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check against common passwords
    const commonPasswords = [
      'password', '123456', 'admin', 'qwerty', 'letmein', 'welcome'
    ];
    
    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
      errors.push('Password cannot contain common words');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // OWASP A05: Security Misconfiguration Prevention
  private setupSecurityHeaders(): void {
    // These would typically be set by the server, but we can enforce client-side checks
    const expectedHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    };

    // Log if any expected security headers are missing
    Object.entries(expectedHeaders).forEach(([header, expectedValue]) => {
      // This is informational - actual headers are set by the server
      console.debug(`Expected security header: ${header}: ${expectedValue}`);
    });
  }

  // OWASP A06: Vulnerable and Outdated Components
  checkDependencySecurity(): Observable<any> {
    return this.http.get(`${this.API_URL}/dependency-check`);
  }

  // OWASP A07: Identification and Authentication Failures
  recordFailedLoginAttempt(identifier: string): boolean {
    const now = new Date();
    const attempt = this.failedAttempts.get(identifier);
    
    if (attempt) {
      // Check if lockout period has expired
      if (now.getTime() - attempt.lastAttempt.getTime() > this.LOCKOUT_DURATION) {
        this.failedAttempts.delete(identifier);
        this.failedAttempts.set(identifier, { count: 1, lastAttempt: now });
        return false;
      }
      
      attempt.count++;
      attempt.lastAttempt = now;
      
      if (attempt.count >= this.MAX_LOGIN_ATTEMPTS) {
        this.logSecurityEvent({
          type: SecurityEventType.MULTIPLE_FAILED_LOGINS,
          severity: SecuritySeverity.HIGH,
          description: `Multiple failed login attempts for identifier: ${identifier}`,
          ipAddress: this.getClientIP(),
          userAgent: navigator.userAgent,
          metadata: { 
            identifier,
            attemptCount: attempt.count,
            lockoutUntil: new Date(now.getTime() + this.LOCKOUT_DURATION)
          },
          timestamp: now
        });
        return true; // Account is locked
      }
    } else {
      this.failedAttempts.set(identifier, { count: 1, lastAttempt: now });
    }
    
    return false; // Account is not locked
  }

  isAccountLocked(identifier: string): boolean {
    const attempt = this.failedAttempts.get(identifier);
    if (!attempt) return false;
    
    const now = new Date();
    if (now.getTime() - attempt.lastAttempt.getTime() > this.LOCKOUT_DURATION) {
      this.failedAttempts.delete(identifier);
      return false;
    }
    
    return attempt.count >= this.MAX_LOGIN_ATTEMPTS;
  }

  // OWASP A08: Software and Data Integrity Failures
  validateDataIntegrity(data: any, expectedHash: string): Promise<boolean> {
    return this.hashSensitiveData(JSON.stringify(data)).then(hash => hash === expectedHash);
  }

  // OWASP A09: Security Logging and Monitoring Failures
  logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date()
    };

    // Add to local alerts
    const currentAlerts = this.securityAlertsSubject.value;
    this.securityAlertsSubject.next([securityEvent, ...currentAlerts.slice(0, 99)]);

    // Send to server
    this.http.post(`${this.API_URL}/events`, securityEvent).subscribe({
      error: (error) => console.error('Failed to log security event:', error)
    });

    // High severity events should trigger immediate alerts
    if (event.severity === SecuritySeverity.CRITICAL || event.severity === SecuritySeverity.HIGH) {
      this.triggerSecurityAlert(securityEvent);
    }
  }

  // OWASP A10: Server-Side Request Forgery (SSRF) Prevention
  validateURL(url: string): boolean {
    try {
      const urlObj = new URL(url);
      
      // Only allow HTTP/HTTPS
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return false;
      }
      
      // Block private IP ranges
      const hostname = urlObj.hostname;
      const privateRanges = [
        /^127\./, // 127.0.0.0/8
        /^10\./, // 10.0.0.0/8
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
        /^192\.168\./, // 192.168.0.0/16
        /^169\.254\./, // 169.254.0.0/16
        /^::1$/, // IPv6 localhost
        /^fc00:/, // IPv6 private
        /^fe80:/ // IPv6 link-local
      ];
      
      return !privateRanges.some(range => range.test(hostname));
    } catch {
      return false;
    }
  }

  // Content Security Policy violation handler
  private setupCSPViolationHandler(): void {
    document.addEventListener('securitypolicyviolation', (event) => {
      const violation: CSPViolation = {
        documentURI: event.documentURI,
        referrer: event.referrer,
        violatedDirective: event.violatedDirective,
        originalPolicy: event.originalPolicy,
        blockedURI: event.blockedURI,
        lineNumber: event.lineNumber,
        columnNumber: event.columnNumber,
        sourceFile: event.sourceFile
      };

      this.logSecurityEvent({
        type: SecurityEventType.XSS_ATTEMPT,
        severity: SecuritySeverity.HIGH,
        description: `CSP violation: ${event.violatedDirective}`,
        ipAddress: this.getClientIP(),
        userAgent: navigator.userAgent,
        metadata: { violation }
      });
    });
  }

  // XSS Protection
  private setupXSSProtection(): void {
    // Override eval to prevent XSS
    (window as any).eval = function() {
      this.logSecurityEvent({
        type: SecurityEventType.XSS_ATTEMPT,
        severity: SecuritySeverity.CRITICAL,
        description: 'Attempted to use eval() function',
        ipAddress: this.getClientIP(),
        userAgent: navigator.userAgent,
        metadata: { arguments: Array.from(arguments) }
      });
      throw new Error('eval() is disabled for security reasons');
    }.bind(this);

    // Monitor for suspicious DOM modifications
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            Array.from(mutation.addedNodes).forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;
                if (element.tagName === 'SCRIPT' && !element.getAttribute('data-allowed')) {
                  this.logSecurityEvent({
                    type: SecurityEventType.XSS_ATTEMPT,
                    severity: SecuritySeverity.HIGH,
                    description: 'Suspicious script injection detected',
                    ipAddress: this.getClientIP(),
                    userAgent: navigator.userAgent,
                    metadata: { 
                      scriptContent: element.textContent,
                      scriptSrc: element.getAttribute('src')
                    }
                  });
                }
              }
            });
          }
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }

  // Clickjacking Protection
  private setupClickjackingProtection(): void {
    if (window.top !== window.self) {
      this.logSecurityEvent({
        type: SecurityEventType.SUSPICIOUS_ACTIVITY,
        severity: SecuritySeverity.MEDIUM,
        description: 'Application loaded in iframe - potential clickjacking attempt',
        ipAddress: this.getClientIP(),
        userAgent: navigator.userAgent,
        metadata: { 
          parentOrigin: document.referrer,
          topLocation: window.top?.location.href
        }
      });
      
      // Break out of iframe
      window.top!.location = window.location;
    }
  }

  // Prevent console access in production
  private preventConsoleAccess(): void {
    if (!environment.production) return;

    const originalConsole = { ...console };
    
    Object.keys(console).forEach(key => {
      (console as any)[key] = function() {
        this.logSecurityEvent({
          type: SecurityEventType.SUSPICIOUS_ACTIVITY,
          severity: SecuritySeverity.LOW,
          description: 'Console access attempted in production',
          ipAddress: this.getClientIP(),
          userAgent: navigator.userAgent,
          metadata: { 
            method: key,
            arguments: Array.from(arguments)
          }
        });
        
        // Still allow logging in development builds
        return originalConsole[key as keyof Console];
      }.bind(this);
    });
  }

  private getClientIP(): string {
    // In a real application, this would be determined by the server
    // For client-side, we can only get limited information
    return 'client-side';
  }

  private triggerSecurityAlert(event: SecurityEvent): void {
    // In a real application, this might trigger:
    // - Email notifications to security team
    // - SMS alerts for critical events
    // - Integration with SIEM systems
    console.warn('SECURITY ALERT:', event);
    
    // For now, we'll just show a browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Security Alert', {
        body: event.description,
        icon: '/assets/icons/security-alert.png',
        tag: 'security-alert'
      });
    }
  }

  // Rate limiting for API calls
  private rateLimitMap = new Map<string, { count: number; resetTime: number }>();

  checkRateLimit(endpoint: string, maxRequests: number = 100, windowMs: number = 60000): boolean {
    const now = Date.now();
    const key = `${endpoint}_${this.getClientIP()}`;
    const limit = this.rateLimitMap.get(key);

    if (!limit || now > limit.resetTime) {
      this.rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (limit.count >= maxRequests) {
      this.logSecurityEvent({
        type: SecurityEventType.SUSPICIOUS_ACTIVITY,
        severity: SecuritySeverity.MEDIUM,
        description: `Rate limit exceeded for endpoint: ${endpoint}`,
        ipAddress: this.getClientIP(),
        userAgent: navigator.userAgent,
        metadata: { 
          endpoint,
          requestCount: limit.count,
          maxRequests,
          windowMs
        }
      });
      return false;
    }

    limit.count++;
    return true;
  }

  // Session security
  validateSession(): boolean {
    const sessionData = sessionStorage.getItem('admin_session_id');
    if (!sessionData) return false;

    try {
      // In a real application, validate session with server
      return true;
    } catch {
      this.logSecurityEvent({
        type: SecurityEventType.SUSPICIOUS_ACTIVITY,
        severity: SecuritySeverity.MEDIUM,
        description: 'Invalid session data detected',
        ipAddress: this.getClientIP(),
        userAgent: navigator.userAgent,
        metadata: { sessionData }
      });
      return false;
    }
  }
}