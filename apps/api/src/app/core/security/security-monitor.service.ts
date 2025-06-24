import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  source: string;
  timestamp: Date;
  details: any;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export enum SecurityEventType {
  LOGIN_FAILURE = 'login_failure',
  LOGIN_SUCCESS = 'login_success',
  ACCOUNT_LOCKOUT = 'account_lockout',
  PASSWORD_CHANGE = 'password_change',
  MFA_ENABLED = 'mfa_enabled',
  MFA_DISABLED = 'mfa_disabled',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  DATA_BREACH_ATTEMPT = 'data_breach_attempt',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  MALICIOUS_REQUEST = 'malicious_request',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SECURITY_SCAN_DETECTED = 'security_scan_detected',
  INJECTION_ATTEMPT = 'injection_attempt',
  XSS_ATTEMPT = 'xss_attempt',
  CSRF_ATTEMPT = 'csrf_attempt'
}

export enum SecuritySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface SecurityMetrics {
  totalEvents: number;
  eventsBySeverity: Record<SecuritySeverity, number>;
  eventsByType: Record<SecurityEventType, number>;
  recentEvents: SecurityEvent[];
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  activeThreats: number;
  resolvedThreats: number;
}

export interface ThreatDetectionRule {
  id: string;
  name: string;
  description: string;
  pattern: RegExp | string;
  severity: SecuritySeverity;
  enabled: boolean;
  actions: ThreatAction[];
}

export enum ThreatAction {
  LOG = 'log',
  ALERT = 'alert',
  BLOCK = 'block',
  LOCKOUT = 'lockout',
  NOTIFY_ADMIN = 'notify_admin'
}

@Injectable()
export class SecurityMonitorService {
  private readonly logger = new Logger(SecurityMonitorService.name);
  private securityEvents: SecurityEvent[] = [];
  private threatDetectionRules: ThreatDetectionRule[] = [];
  private suspiciousIPs = new Set<string>();
  private rateLimitCounters = new Map<string, { count: number; resetTime: number }>();

  constructor(private configService: ConfigService) {
    this.initializeThreatDetection();
  }

  private initializeThreatDetection(): void {
    this.threatDetectionRules = [
      {
        id: 'sql_injection',
        name: 'SQL Injection Detection',
        description: 'Detects potential SQL injection attempts',
        pattern: /(union|select|insert|delete|drop|create|alter|exec|script)/i,
        severity: SecuritySeverity.HIGH,
        enabled: true,
        actions: [ThreatAction.LOG, ThreatAction.BLOCK, ThreatAction.ALERT]
      },
      {
        id: 'xss_detection',
        name: 'XSS Attack Detection',
        description: 'Detects potential cross-site scripting attempts',
        pattern: /<script|javascript:|onload=|onerror=|onclick=/i,
        severity: SecuritySeverity.HIGH,
        enabled: true,
        actions: [ThreatAction.LOG, ThreatAction.BLOCK, ThreatAction.ALERT]
      },
      {
        id: 'directory_traversal',
        name: 'Directory Traversal Detection',
        description: 'Detects directory traversal attempts',
        pattern: /\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c/i,
        severity: SecuritySeverity.MEDIUM,
        enabled: true,
        actions: [ThreatAction.LOG, ThreatAction.BLOCK]
      },
      {
        id: 'command_injection',
        name: 'Command Injection Detection',
        description: 'Detects potential command injection attempts',
        pattern: /[;&|`$()]/,
        severity: SecuritySeverity.HIGH,
        enabled: true,
        actions: [ThreatAction.LOG, ThreatAction.BLOCK, ThreatAction.ALERT]
      },
      {
        id: 'brute_force',
        name: 'Brute Force Detection',
        description: 'Detects brute force login attempts',
        pattern: '', // Handled by logic
        severity: SecuritySeverity.HIGH,
        enabled: true,
        actions: [ThreatAction.LOG, ThreatAction.LOCKOUT, ThreatAction.NOTIFY_ADMIN]
      }
    ];

    this.logger.log(`Initialized ${this.threatDetectionRules.length} threat detection rules`);
  }

  async logSecurityEvent(
    type: SecurityEventType,
    severity: SecuritySeverity,
    source: string,
    details: any,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<string> {
    const event: SecurityEvent = {
      id: this.generateEventId(),
      type,
      severity,
      source,
      timestamp: new Date(),
      details,
      userId,
      ipAddress,
      userAgent,
      resolved: false
    };

    this.securityEvents.push(event);

    // Keep only last 10000 events in memory
    if (this.securityEvents.length > 10000) {
      this.securityEvents = this.securityEvents.slice(-10000);
    }

    this.logger.log(`Security event logged: ${type} (${severity}) from ${source}`);

    // Check for patterns and trigger responses
    await this.analyzeSecurityEvent(event);

    return event.id;
  }

  async analyzeRequest(
    url: string,
    method: string,
    headers: Record<string, string>,
    body: any,
    ipAddress: string,
    userId?: string
  ): Promise<{ allowed: boolean; threats: string[] }> {
    const threats: string[] = [];
    let allowed = true;

    // Check rate limiting
    const rateLimitResult = this.checkRateLimit(ipAddress, userId);
    if (!rateLimitResult.allowed) {
      threats.push('rate_limit_exceeded');
      allowed = false;
      
      await this.logSecurityEvent(
        SecurityEventType.RATE_LIMIT_EXCEEDED,
        SecuritySeverity.MEDIUM,
        'rate_limiter',
        { url, method, attempts: rateLimitResult.attempts },
        userId,
        ipAddress
      );
    }

    // Check for malicious patterns in URL and body
    const requestData = `${url} ${JSON.stringify(body)}`;
    
    for (const rule of this.threatDetectionRules) {
      if (!rule.enabled) continue;

      let matched = false;
      
      if (rule.pattern instanceof RegExp) {
        matched = rule.pattern.test(requestData);
      } else if (typeof rule.pattern === 'string' && rule.pattern) {
        matched = requestData.toLowerCase().includes(rule.pattern.toLowerCase());
      }

      if (matched) {
        threats.push(rule.id);
        
        if (rule.actions.includes(ThreatAction.BLOCK)) {
          allowed = false;
        }

        await this.logSecurityEvent(
          SecurityEventType.MALICIOUS_REQUEST,
          rule.severity,
          'threat_detection',
          { rule: rule.id, url, method, pattern: rule.pattern.toString() },
          userId,
          ipAddress
        );

        if (rule.actions.includes(ThreatAction.ALERT)) {
          await this.sendSecurityAlert(rule, { url, method, ipAddress, userId });
        }
      }
    }

    // Check for suspicious IP addresses
    if (this.suspiciousIPs.has(ipAddress)) {
      threats.push('suspicious_ip');
      
      await this.logSecurityEvent(
        SecurityEventType.SUSPICIOUS_ACTIVITY,
        SecuritySeverity.HIGH,
        'ip_monitor',
        { url, method },
        userId,
        ipAddress
      );
    }

    return { allowed, threats };
  }

  async detectBruteForce(
    email: string,
    ipAddress: string,
    success: boolean
  ): Promise<{ isBruteForce: boolean; shouldLockout: boolean }> {
    const key = `${email}:${ipAddress}`;
    const now = Date.now();
    const timeWindow = 15 * 60 * 1000; // 15 minutes
    const maxAttempts = 5;

    // Get recent failed attempts
    const recentEvents = this.securityEvents.filter(event => 
      event.type === SecurityEventType.LOGIN_FAILURE &&
      event.details?.email === email &&
      event.ipAddress === ipAddress &&
      (now - event.timestamp.getTime()) < timeWindow
    );

    const failedAttempts = recentEvents.length;
    const isBruteForce = failedAttempts >= maxAttempts;
    const shouldLockout = failedAttempts >= maxAttempts;

    if (isBruteForce) {
      await this.logSecurityEvent(
        SecurityEventType.SUSPICIOUS_ACTIVITY,
        SecuritySeverity.HIGH,
        'brute_force_detector',
        { email, attempts: failedAttempts, timeWindow },
        undefined,
        ipAddress
      );

      // Add IP to suspicious list
      this.suspiciousIPs.add(ipAddress);
    }

    return { isBruteForce, shouldLockout };
  }

  async getSecurityMetrics(): Promise<SecurityMetrics> {
    const now = Date.now();
    const last24Hours = now - (24 * 60 * 60 * 1000);
    
    const recentEvents = this.securityEvents.filter(
      event => event.timestamp.getTime() > last24Hours
    );

    const eventsBySeverity = {
      [SecuritySeverity.LOW]: 0,
      [SecuritySeverity.MEDIUM]: 0,
      [SecuritySeverity.HIGH]: 0,
      [SecuritySeverity.CRITICAL]: 0
    };

    const eventsByType = {} as Record<SecurityEventType, number>;

    recentEvents.forEach(event => {
      eventsBySeverity[event.severity]++;
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
    });

    const activeThreats = recentEvents.filter(event => !event.resolved).length;
    const resolvedThreats = recentEvents.filter(event => event.resolved).length;

    // Calculate threat level
    let threatLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    
    if (eventsBySeverity.critical > 0) {
      threatLevel = 'critical';
    } else if (eventsBySeverity.high > 5) {
      threatLevel = 'high';
    } else if (eventsBySeverity.medium > 10) {
      threatLevel = 'medium';
    }

    return {
      totalEvents: recentEvents.length,
      eventsBySeverity,
      eventsByType,
      recentEvents: recentEvents.slice(-20), // Last 20 events
      threatLevel,
      activeThreats,
      resolvedThreats
    };
  }

  async resolveSecurityEvent(eventId: string, resolvedBy: string): Promise<boolean> {
    const event = this.securityEvents.find(e => e.id === eventId);
    
    if (!event) {
      return false;
    }

    event.resolved = true;
    event.resolvedAt = new Date();
    event.resolvedBy = resolvedBy;

    this.logger.log(`Security event resolved: ${eventId} by ${resolvedBy}`);
    return true;
  }

  async getSecurityEvents(
    limit: number = 100,
    severity?: SecuritySeverity,
    type?: SecurityEventType,
    resolved?: boolean
  ): Promise<SecurityEvent[]> {
    let filteredEvents = [...this.securityEvents];

    if (severity) {
      filteredEvents = filteredEvents.filter(event => event.severity === severity);
    }

    if (type) {
      filteredEvents = filteredEvents.filter(event => event.type === type);
    }

    if (resolved !== undefined) {
      filteredEvents = filteredEvents.filter(event => event.resolved === resolved);
    }

    // Sort by timestamp descending
    filteredEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return filteredEvents.slice(0, limit);
  }

  async addSuspiciousIP(ipAddress: string, reason: string): Promise<void> {
    this.suspiciousIPs.add(ipAddress);
    
    await this.logSecurityEvent(
      SecurityEventType.SUSPICIOUS_ACTIVITY,
      SecuritySeverity.MEDIUM,
      'manual_ip_block',
      { reason },
      undefined,
      ipAddress
    );

    this.logger.log(`IP address marked as suspicious: ${ipAddress} (${reason})`);
  }

  async removeSuspiciousIP(ipAddress: string): Promise<boolean> {
    const removed = this.suspiciousIPs.delete(ipAddress);
    
    if (removed) {
      this.logger.log(`IP address removed from suspicious list: ${ipAddress}`);
    }
    
    return removed;
  }

  async updateThreatDetectionRule(ruleId: string, updates: Partial<ThreatDetectionRule>): Promise<boolean> {
    const ruleIndex = this.threatDetectionRules.findIndex(rule => rule.id === ruleId);
    
    if (ruleIndex === -1) {
      return false;
    }

    this.threatDetectionRules[ruleIndex] = {
      ...this.threatDetectionRules[ruleIndex],
      ...updates
    };

    this.logger.log(`Threat detection rule updated: ${ruleId}`);
    return true;
  }

  private checkRateLimit(ipAddress: string, userId?: string): { allowed: boolean; attempts: number } {
    const key = userId ? `user:${userId}` : `ip:${ipAddress}`;
    const now = Date.now();
    const windowSize = 60 * 1000; // 1 minute
    const maxRequests = userId ? 100 : 20; // Higher limit for authenticated users

    const counter = this.rateLimitCounters.get(key);
    
    if (!counter || now > counter.resetTime) {
      // Reset or initialize counter
      this.rateLimitCounters.set(key, {
        count: 1,
        resetTime: now + windowSize
      });
      return { allowed: true, attempts: 1 };
    }

    counter.count++;
    
    return {
      allowed: counter.count <= maxRequests,
      attempts: counter.count
    };
  }

  private async analyzeSecurityEvent(event: SecurityEvent): Promise<void> {
    // Look for patterns that might indicate coordinated attacks
    
    // Check for multiple events from same IP
    if (event.ipAddress) {
      const recentFromSameIP = this.securityEvents.filter(e => 
        e.ipAddress === event.ipAddress &&
        e.timestamp.getTime() > (Date.now() - 60 * 60 * 1000) // Last hour
      );

      if (recentFromSameIP.length > 10) {
        await this.logSecurityEvent(
          SecurityEventType.SUSPICIOUS_ACTIVITY,
          SecuritySeverity.HIGH,
          'pattern_analyzer',
          { pattern: 'multiple_events_same_ip', count: recentFromSameIP.length },
          undefined,
          event.ipAddress
        );
      }
    }

    // Check for privilege escalation attempts
    if (event.type === SecurityEventType.UNAUTHORIZED_ACCESS && event.userId) {
      const recentUnauthorized = this.securityEvents.filter(e =>
        e.userId === event.userId &&
        e.type === SecurityEventType.UNAUTHORIZED_ACCESS &&
        e.timestamp.getTime() > (Date.now() - 30 * 60 * 1000) // Last 30 minutes
      );

      if (recentUnauthorized.length > 3) {
        await this.logSecurityEvent(
          SecurityEventType.PRIVILEGE_ESCALATION,
          SecuritySeverity.CRITICAL,
          'pattern_analyzer',
          { pattern: 'repeated_unauthorized_access', count: recentUnauthorized.length },
          event.userId,
          event.ipAddress
        );
      }
    }
  }

  private async sendSecurityAlert(rule: ThreatDetectionRule, details: any): Promise<void> {
    // In production, this would send notifications via email, Slack, etc.
    this.logger.warn(`SECURITY ALERT: ${rule.name} - ${JSON.stringify(details)}`);
  }

  private generateEventId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  @Cron(CronExpression.EVERY_HOUR)
  private async cleanupOldEvents(): Promise<void> {
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days
    const originalLength = this.securityEvents.length;
    
    this.securityEvents = this.securityEvents.filter(
      event => event.timestamp.getTime() > cutoff
    );

    const cleaned = originalLength - this.securityEvents.length;
    if (cleaned > 0) {
      this.logger.log(`Cleaned up ${cleaned} old security events`);
    }
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  private async cleanupRateLimitCounters(): Promise<void> {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.rateLimitCounters.forEach((counter, key) => {
      if (now > counter.resetTime) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.rateLimitCounters.delete(key));
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  private async generateSecurityReport(): Promise<void> {
    const metrics = await this.getSecurityMetrics();
    
    this.logger.log('Daily Security Report:', {
      totalEvents: metrics.totalEvents,
      threatLevel: metrics.threatLevel,
      activeThreats: metrics.activeThreats,
      criticalEvents: metrics.eventsBySeverity.critical,
      highSeverityEvents: metrics.eventsBySeverity.high
    });

    // In production, this would generate and send detailed reports
  }
}