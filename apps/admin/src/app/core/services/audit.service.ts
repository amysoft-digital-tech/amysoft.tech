import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';

export interface AuditLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  resource: string;
  details: string;
  metadata: AuditMetadata;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  severity: AuditSeverity;
}

export interface AuditMetadata {
  resourceId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  requestId?: string;
  sessionId?: string;
  additionalInfo?: Record<string, any>;
}

export enum AuditSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ApiCallLog {
  requestId: string;
  method: string;
  url: string;
  status: 'success' | 'error';
  duration: number;
  userAgent: string;
  timestamp: Date;
}

export interface AuditLogQuery {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  action?: string;
  resource?: string;
  severity?: AuditSeverity;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AuditLogResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private readonly API_URL = '/api/admin/audit';
  private auditEventSubject = new Subject<AuditLog>();
  
  public auditEvent$ = this.auditEventSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  logAction(
    action: string, 
    details: string, 
    metadata: Partial<AuditMetadata> = {},
    severity: AuditSeverity = AuditSeverity.MEDIUM
  ): Observable<AuditLog> {
    const user = this.authService.getCurrentUser();
    
    const auditLog: Omit<AuditLog, 'id'> = {
      userId: user?.id || 'anonymous',
      username: user?.email || 'anonymous',
      action,
      resource: this.extractResourceFromAction(action),
      details,
      metadata: {
        sessionId: this.getSessionId(),
        ...metadata
      },
      ipAddress: 'client', // In a real app, this would be set by the server
      userAgent: navigator.userAgent,
      timestamp: new Date(),
      severity
    };

    return this.http.post<AuditLog>(`${this.API_URL}/log`, auditLog).pipe(
      tap(savedLog => {
        this.auditEventSubject.next(savedLog);
        this.logToConsole(savedLog);
      })
    );
  }

  logApiCall(apiCall: ApiCallLog): void {
    this.http.post(`${this.API_URL}/api-calls`, apiCall).subscribe({
      error: (error) => console.warn('Failed to log API call:', error)
    });
  }

  logPageView(url: string): void {
    this.logAction('page_view', `Viewed page: ${url}`, { 
      url,
      additionalInfo: {
        referrer: document.referrer,
        timestamp: new Date().toISOString()
      }
    }, AuditSeverity.LOW).subscribe({
      error: (error) => console.warn('Failed to log page view:', error)
    });
  }

  logLogin(success: boolean, reason?: string): Observable<AuditLog> {
    return this.logAction(
      success ? 'login_success' : 'login_failure',
      success ? 'User logged in successfully' : `Login failed: ${reason}`,
      { 
        loginTime: new Date().toISOString(),
        success,
        failureReason: reason
      },
      success ? AuditSeverity.LOW : AuditSeverity.MEDIUM
    );
  }

  logLogout(): Observable<AuditLog> {
    return this.logAction(
      'logout',
      'User logged out',
      { 
        logoutTime: new Date().toISOString()
      },
      AuditSeverity.LOW
    );
  }

  logDataChange(
    resource: string,
    resourceId: string,
    oldValues: Record<string, any>,
    newValues: Record<string, any>,
    action: string = 'update'
  ): Observable<AuditLog> {
    const changes = this.calculateChanges(oldValues, newValues);
    
    return this.logAction(
      `${resource}_${action}`,
      `${action.charAt(0).toUpperCase() + action.slice(1)} ${resource}: ${resourceId}`,
      {
        resourceId,
        oldValues,
        newValues,
        additionalInfo: {
          changedFields: Object.keys(changes),
          changeCount: Object.keys(changes).length
        }
      },
      this.determineSeverityFromChanges(changes)
    );
  }

  logSecurityEvent(
    event: string,
    details: string,
    metadata: Partial<AuditMetadata> = {}
  ): Observable<AuditLog> {
    return this.logAction(
      `security_${event}`,
      details,
      {
        ...metadata,
        additionalInfo: {
          ...metadata.additionalInfo,
          securityEvent: true,
          timestamp: new Date().toISOString()
        }
      },
      AuditSeverity.HIGH
    );
  }

  logError(
    error: Error,
    context: string,
    metadata: Partial<AuditMetadata> = {}
  ): Observable<AuditLog> {
    return this.logAction(
      'error',
      `Error in ${context}: ${error.message}`,
      {
        ...metadata,
        additionalInfo: {
          ...metadata.additionalInfo,
          errorName: error.name,
          errorStack: error.stack,
          context
        }
      },
      AuditSeverity.HIGH
    );
  }

  getAuditLogs(query: AuditLogQuery = {}): Observable<AuditLogResponse> {
    const params = this.buildQueryParams(query);
    return this.http.get<AuditLogResponse>(`${this.API_URL}/logs`, { params });
  }

  getAuditLogById(id: string): Observable<AuditLog> {
    return this.http.get<AuditLog>(`${this.API_URL}/logs/${id}`);
  }

  exportAuditLogs(query: AuditLogQuery = {}, format: 'csv' | 'json' = 'csv'): Observable<Blob> {
    const params = this.buildQueryParams({ ...query, format });
    return this.http.get(`${this.API_URL}/export`, { 
      params, 
      responseType: 'blob' 
    });
  }

  getAuditStatistics(timeRange: 'day' | 'week' | 'month' = 'week'): Observable<any> {
    return this.http.get(`${this.API_URL}/statistics`, {
      params: { timeRange }
    });
  }

  private extractResourceFromAction(action: string): string {
    const actionParts = action.split('_');
    if (actionParts.length > 1) {
      return actionParts[0];
    }
    return 'system';
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('admin_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('admin_session_id', sessionId);
    }
    return sessionId;
  }

  private calculateChanges(oldValues: Record<string, any>, newValues: Record<string, any>): Record<string, any> {
    const changes: Record<string, any> = {};
    
    // Check for changed and new values
    for (const key in newValues) {
      if (newValues[key] !== oldValues[key]) {
        changes[key] = {
          old: oldValues[key],
          new: newValues[key]
        };
      }
    }
    
    // Check for removed values
    for (const key in oldValues) {
      if (!(key in newValues)) {
        changes[key] = {
          old: oldValues[key],
          new: undefined
        };
      }
    }
    
    return changes;
  }

  private determineSeverityFromChanges(changes: Record<string, any>): AuditSeverity {
    const criticalFields = ['role', 'permissions', 'password', 'email'];
    const highFields = ['status', 'published', 'archived'];
    
    for (const field in changes) {
      if (criticalFields.includes(field.toLowerCase())) {
        return AuditSeverity.CRITICAL;
      }
      if (highFields.includes(field.toLowerCase())) {
        return AuditSeverity.HIGH;
      }
    }
    
    return Object.keys(changes).length > 5 ? AuditSeverity.MEDIUM : AuditSeverity.LOW;
  }

  private buildQueryParams(query: AuditLogQuery & { format?: string }): any {
    const params: any = {};
    
    if (query.startDate) params.startDate = query.startDate.toISOString();
    if (query.endDate) params.endDate = query.endDate.toISOString();
    if (query.userId) params.userId = query.userId;
    if (query.action) params.action = query.action;
    if (query.resource) params.resource = query.resource;
    if (query.severity) params.severity = query.severity;
    if (query.page) params.page = query.page.toString();
    if (query.limit) params.limit = query.limit.toString();
    if (query.sortBy) params.sortBy = query.sortBy;
    if (query.sortOrder) params.sortOrder = query.sortOrder;
    if ((query as any).format) params.format = (query as any).format;
    
    return params;
  }

  private logToConsole(auditLog: AuditLog): void {
    if (auditLog.severity === AuditSeverity.CRITICAL || auditLog.severity === AuditSeverity.HIGH) {
      console.warn('AUDIT LOG:', {
        action: auditLog.action,
        user: auditLog.username,
        details: auditLog.details,
        severity: auditLog.severity,
        timestamp: auditLog.timestamp
      });
    } else {
      console.log('AUDIT LOG:', {
        action: auditLog.action,
        user: auditLog.username,
        details: auditLog.details
      });
    }
  }
}