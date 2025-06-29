export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  permissions: AdminPermission[];
  lastLogin: Date;
}

export enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  CUSTOMER_SUPPORT = 'customer_support',
  CONTENT_MANAGER = 'content_manager',
  BUSINESS_ANALYST = 'business_analyst',
}

export enum AdminPermission {
  // Customer Management
  VIEW_CUSTOMERS = 'view_customers',
  EDIT_CUSTOMERS = 'edit_customers',
  DELETE_CUSTOMERS = 'delete_customers',
  MANAGE_SUBSCRIPTIONS = 'manage_subscriptions',
  VIEW_CUSTOMER_ANALYTICS = 'view_customer_analytics',
  
  // Content Management
  VIEW_CONTENT = 'view_content',
  CREATE_CONTENT = 'create_content',
  EDIT_CONTENT = 'edit_content',
  DELETE_CONTENT = 'delete_content',
  PUBLISH_CONTENT = 'publish_content',
  
  // Business Intelligence
  VIEW_REVENUE = 'view_revenue',
  VIEW_ANALYTICS = 'view_analytics',
  EXPORT_REPORTS = 'export_reports',
  VIEW_BUSINESS_METRICS = 'view_business_metrics',
  
  // System Administration
  VIEW_AUDIT_LOGS = 'view_audit_logs',
  MANAGE_ADMIN_USERS = 'manage_admin_users',
  CONFIGURE_SYSTEM = 'configure_system',
}

export interface AuditLog {
  id: string;
  adminUserId: string;
  adminEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

export interface CustomerSearchParams {
  query?: string;
  email?: string;
  subscriptionStatus?: 'active' | 'cancelled' | 'expired' | 'trial';
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
  sortBy?: 'created' | 'lastActive' | 'revenue';
  sortOrder?: 'asc' | 'desc';
}

export interface ContentSearchParams {
  query?: string;
  type?: 'chapter' | 'template' | 'resource';
  status?: 'draft' | 'published' | 'archived';
  authorId?: string;
  categoryId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

export interface BusinessMetrics {
  revenue: {
    total: number;
    monthly: number;
    growth: number;
    byProduct: Record<string, number>;
  };
  customers: {
    total: number;
    active: number;
    churnRate: number;
    acquisitionRate: number;
    lifetimeValue: number;
  };
  content: {
    totalItems: number;
    engagementRate: number;
    popularItems: Array<{ id: string; title: string; views: number }>;
  };
  performance: {
    apiLatency: number;
    errorRate: number;
    uptime: number;
  };
}