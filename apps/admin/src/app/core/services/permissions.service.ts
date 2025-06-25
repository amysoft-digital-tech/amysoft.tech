/**
 * Advanced Permissions Service for Enterprise RBAC
 * Provides granular permission checking with resource-based access control
 */

import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { AuthService, AdminRole, Permission, PermissionAction } from '../auth/auth.service';

export interface ResourcePermission {
  resource: string;
  actions: PermissionAction[];
  conditions?: PermissionCondition[];
  inherit?: string[]; // Resources that inherit these permissions
}

export interface PermissionCondition {
  field: string;
  operator: 'equals' | 'contains' | 'in' | 'greater_than' | 'less_than' | 'starts_with' | 'ends_with';
  value: any;
  description?: string;
}

export interface PermissionContext {
  resource?: any;
  user?: any;
  environment?: 'development' | 'staging' | 'production';
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export interface RoleDefinition {
  role: AdminRole;
  name: string;
  description: string;
  permissions: ResourcePermission[];
  inheritsFrom?: AdminRole[];
  restrictions?: PermissionRestriction[];
}

export interface PermissionRestriction {
  type: 'time_based' | 'location_based' | 'device_based' | 'ip_based';
  configuration: Record<string, any>;
  description: string;
}

export interface PermissionAudit {
  userId: string;
  resource: string;
  action: PermissionAction;
  granted: boolean;
  context: PermissionContext;
  timestamp: Date;
  reason?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PermissionsService {
  private permissionCache = new Map<string, { result: boolean; expiry: number }>();
  private auditLog: PermissionAudit[] = [];
  private permissionUpdatesSubject = new BehaviorSubject<void>(undefined);
  
  // Cache permissions for performance
  private rolePermissions$ = combineLatest([
    this.authService.currentUser$,
    this.permissionUpdatesSubject
  ]).pipe(
    map(([user]) => user ? this.getRolePermissions(user.role) : []),
    shareReplay(1)
  );

  constructor(private authService: AuthService) {}

  /**
   * Check if user has permission for a specific resource and action
   */
  hasPermission(
    resource: string, 
    action: PermissionAction, 
    context?: PermissionContext
  ): Observable<boolean> {
    return this.rolePermissions$.pipe(
      map(permissions => {
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser) {
          this.auditPermission(resource, action, false, context, 'User not authenticated');
          return false;
        }

        // Super admin has all permissions
        if (currentUser.role === AdminRole.SUPER_ADMIN) {
          this.auditPermission(resource, action, true, context, 'Super admin access');
          return true;
        }

        const granted = this.evaluatePermission(permissions, resource, action, context);
        this.auditPermission(resource, action, granted, context);
        return granted;
      })
    );
  }

  /**
   * Check multiple permissions at once
   */
  hasPermissions(checks: Array<{ resource: string; action: PermissionAction; context?: PermissionContext }>): Observable<boolean[]> {
    return this.rolePermissions$.pipe(
      map(permissions => {
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser) {
          return checks.map(() => false);
        }

        if (currentUser.role === AdminRole.SUPER_ADMIN) {
          return checks.map(() => true);
        }

        return checks.map(check => 
          this.evaluatePermission(permissions, check.resource, check.action, check.context)
        );
      })
    );
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(checks: Array<{ resource: string; action: PermissionAction }>): Observable<boolean> {
    return this.hasPermissions(checks).pipe(
      map(results => results.some(result => result))
    );
  }

  /**
   * Check if user has all of the specified permissions
   */
  hasAllPermissions(checks: Array<{ resource: string; action: PermissionAction }>): Observable<boolean> {
    return this.hasPermissions(checks).pipe(
      map(results => results.every(result => result))
    );
  }

  /**
   * Get available actions for a resource
   */
  getAvailableActions(resource: string, context?: PermissionContext): Observable<PermissionAction[]> {
    return this.rolePermissions$.pipe(
      map(permissions => {
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser) return [];

        if (currentUser.role === AdminRole.SUPER_ADMIN) {
          return Object.values(PermissionAction);
        }

        const resourcePermissions = this.findResourcePermissions(permissions, resource);
        if (!resourcePermissions) return [];

        return resourcePermissions.actions.filter(action => 
          this.evaluateConditions(resourcePermissions.conditions, context)
        );
      })
    );
  }

  /**
   * Get permission audit log
   */
  getAuditLog(filters?: { 
    userId?: string; 
    resource?: string; 
    action?: PermissionAction;
    startDate?: Date;
    endDate?: Date;
  }): PermissionAudit[] {
    let filtered = [...this.auditLog];

    if (filters) {
      if (filters.userId) {
        filtered = filtered.filter(entry => entry.userId === filters.userId);
      }
      if (filters.resource) {
        filtered = filtered.filter(entry => entry.resource === filters.resource);
      }
      if (filters.action) {
        filtered = filtered.filter(entry => entry.action === filters.action);
      }
      if (filters.startDate) {
        filtered = filtered.filter(entry => entry.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        filtered = filtered.filter(entry => entry.timestamp <= filters.endDate!);
      }
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Clear permission cache
   */
  clearCache(): void {
    this.permissionCache.clear();
    this.permissionUpdatesSubject.next();
  }

  /**
   * Get role-based permissions configuration
   */
  private getRolePermissions(role: AdminRole): ResourcePermission[] {
    const roleDefinitions = this.getRoleDefinitions();
    const roleDefinition = roleDefinitions.find(def => def.role === role);
    
    if (!roleDefinition) return [];

    let permissions = [...roleDefinition.permissions];

    // Inherit permissions from parent roles
    if (roleDefinition.inheritsFrom) {
      for (const parentRole of roleDefinition.inheritsFrom) {
        const parentPermissions = this.getRolePermissions(parentRole);
        permissions = this.mergePermissions(permissions, parentPermissions);
      }
    }

    return permissions;
  }

  /**
   * Evaluate permission with conditions
   */
  private evaluatePermission(
    permissions: ResourcePermission[], 
    resource: string, 
    action: PermissionAction, 
    context?: PermissionContext
  ): boolean {
    const cacheKey = `${resource}:${action}:${JSON.stringify(context)}`;
    const cached = this.permissionCache.get(cacheKey);
    
    if (cached && cached.expiry > Date.now()) {
      return cached.result;
    }

    const resourcePermission = this.findResourcePermissions(permissions, resource);
    if (!resourcePermission) {
      this.cacheResult(cacheKey, false);
      return false;
    }

    if (!resourcePermission.actions.includes(action)) {
      this.cacheResult(cacheKey, false);
      return false;
    }

    const conditionsMatch = this.evaluateConditions(resourcePermission.conditions, context);
    this.cacheResult(cacheKey, conditionsMatch);
    return conditionsMatch;
  }

  /**
   * Find permissions for a specific resource
   */
  private findResourcePermissions(permissions: ResourcePermission[], resource: string): ResourcePermission | undefined {
    // Direct match
    let found = permissions.find(p => p.resource === resource);
    if (found) return found;

    // Check for wildcard matches
    found = permissions.find(p => {
      if (p.resource.endsWith('*')) {
        const prefix = p.resource.slice(0, -1);
        return resource.startsWith(prefix);
      }
      return false;
    });
    if (found) return found;

    // Check inheritance
    for (const permission of permissions) {
      if (permission.inherit?.includes(resource)) {
        return permission;
      }
    }

    return undefined;
  }

  /**
   * Evaluate permission conditions
   */
  private evaluateConditions(conditions?: PermissionCondition[], context?: PermissionContext): boolean {
    if (!conditions || conditions.length === 0) return true;
    if (!context) return false;

    return conditions.every(condition => {
      const fieldValue = this.getFieldValue(context, condition.field);
      return this.evaluateCondition(condition, fieldValue);
    });
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(condition: PermissionCondition, fieldValue: any): boolean {
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'contains':
        return Array.isArray(fieldValue) 
          ? fieldValue.includes(condition.value)
          : String(fieldValue).includes(String(condition.value));
      case 'in':
        return Array.isArray(condition.value) 
          ? condition.value.includes(fieldValue) 
          : false;
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);
      case 'less_than':
        return Number(fieldValue) < Number(condition.value);
      case 'starts_with':
        return String(fieldValue).startsWith(String(condition.value));
      case 'ends_with':
        return String(fieldValue).endsWith(String(condition.value));
      default:
        return false;
    }
  }

  /**
   * Get field value from context using dot notation
   */
  private getFieldValue(context: PermissionContext, field: string): any {
    return field.split('.').reduce((obj, key) => obj?.[key], context);
  }

  /**
   * Merge permissions from multiple sources
   */
  private mergePermissions(base: ResourcePermission[], inherited: ResourcePermission[]): ResourcePermission[] {
    const merged = new Map<string, ResourcePermission>();

    // Add base permissions
    base.forEach(permission => {
      merged.set(permission.resource, { ...permission });
    });

    // Merge inherited permissions
    inherited.forEach(permission => {
      const existing = merged.get(permission.resource);
      if (existing) {
        // Merge actions
        const combinedActions = [...new Set([...existing.actions, ...permission.actions])];
        existing.actions = combinedActions;
        
        // Merge conditions (take most restrictive)
        if (permission.conditions) {
          existing.conditions = [...(existing.conditions || []), ...permission.conditions];
        }
      } else {
        merged.set(permission.resource, { ...permission });
      }
    });

    return Array.from(merged.values());
  }

  /**
   * Cache permission result
   */
  private cacheResult(key: string, result: boolean, ttlMs: number = 5 * 60 * 1000): void {
    this.permissionCache.set(key, {
      result,
      expiry: Date.now() + ttlMs
    });
  }

  /**
   * Audit permission check
   */
  private auditPermission(
    resource: string, 
    action: PermissionAction, 
    granted: boolean, 
    context?: PermissionContext,
    reason?: string
  ): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    const audit: PermissionAudit = {
      userId: currentUser.id,
      resource,
      action,
      granted,
      context: context || {},
      timestamp: new Date(),
      reason
    };

    this.auditLog.push(audit);

    // Keep only last 1000 entries
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }
  }

  /**
   * Define role-based permissions
   */
  private getRoleDefinitions(): RoleDefinition[] {
    return [
      {
        role: AdminRole.SUPER_ADMIN,
        name: 'Super Administrator',
        description: 'Complete system access with all permissions',
        permissions: [
          {
            resource: '*',
            actions: Object.values(PermissionAction)
          }
        ]
      },
      {
        role: AdminRole.CONTENT_ADMIN,
        name: 'Content Administrator',
        description: 'Full content management and publishing permissions',
        permissions: [
          {
            resource: 'content',
            actions: [PermissionAction.CREATE, PermissionAction.READ, PermissionAction.UPDATE, PermissionAction.DELETE, PermissionAction.PUBLISH]
          },
          {
            resource: 'content.chapters',
            actions: [PermissionAction.CREATE, PermissionAction.READ, PermissionAction.UPDATE, PermissionAction.DELETE, PermissionAction.PUBLISH]
          },
          {
            resource: 'content.templates',
            actions: [PermissionAction.CREATE, PermissionAction.READ, PermissionAction.UPDATE, PermissionAction.DELETE]
          },
          {
            resource: 'media',
            actions: [PermissionAction.CREATE, PermissionAction.READ, PermissionAction.UPDATE, PermissionAction.DELETE]
          },
          {
            resource: 'users',
            actions: [PermissionAction.READ],
            conditions: [
              {
                field: 'user.role',
                operator: 'in',
                value: ['user', 'subscriber'],
                description: 'Can only view regular users'
              }
            ]
          }
        ]
      },
      {
        role: AdminRole.SUPPORT_ADMIN,
        name: 'Support Administrator',
        description: 'Customer support and user management permissions',
        permissions: [
          {
            resource: 'users',
            actions: [PermissionAction.READ, PermissionAction.UPDATE]
          },
          {
            resource: 'users.subscriptions',
            actions: [PermissionAction.READ, PermissionAction.UPDATE]
          },
          {
            resource: 'support.tickets',
            actions: [PermissionAction.CREATE, PermissionAction.READ, PermissionAction.UPDATE]
          },
          {
            resource: 'payments',
            actions: [PermissionAction.READ],
            conditions: [
              {
                field: 'payment.userId',
                operator: 'equals',
                value: '{{current_user_support_assignment}}',
                description: 'Can only view payments for assigned users'
              }
            ]
          },
          {
            resource: 'content',
            actions: [PermissionAction.READ]
          }
        ]
      },
      {
        role: AdminRole.ANALYTICS_ADMIN,
        name: 'Analytics Administrator',
        description: 'Business intelligence and analytics access',
        permissions: [
          {
            resource: 'analytics',
            actions: [PermissionAction.READ, PermissionAction.EXPORT]
          },
          {
            resource: 'analytics.revenue',
            actions: [PermissionAction.READ, PermissionAction.EXPORT]
          },
          {
            resource: 'analytics.users',
            actions: [PermissionAction.READ, PermissionAction.EXPORT]
          },
          {
            resource: 'analytics.content',
            actions: [PermissionAction.READ, PermissionAction.EXPORT]
          },
          {
            resource: 'reports',
            actions: [PermissionAction.CREATE, PermissionAction.READ, PermissionAction.EXPORT]
          },
          {
            resource: 'users',
            actions: [PermissionAction.READ],
            conditions: [
              {
                field: 'user.personalData',
                operator: 'equals',
                value: false,
                description: 'Can only view anonymized user data'
              }
            ]
          }
        ]
      }
    ];
  }
}