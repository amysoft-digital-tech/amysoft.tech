import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const appRoutes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'content',
    canActivate: [authGuard, roleGuard],
    data: { requiredRoles: ['super_admin', 'content_admin'] },
    children: [
      {
        path: '',
        redirectTo: 'editor',
        pathMatch: 'full'
      },
      {
        path: 'editor',
        loadComponent: () => import('./features/content/content-editor.component').then(m => m.ContentEditorComponent)
      },
      {
        path: 'organization',
        loadComponent: () => import('./features/content/content-organization.component').then(m => m.ContentOrganizationComponent)
      },
      {
        path: 'media',
        loadComponent: () => import('./features/content/media-management.component').then(m => m.MediaManagementComponent)
      },
      {
        path: 'workflow',
        loadComponent: () => import('./features/content/content-workflow.component').then(m => m.ContentWorkflowComponent)
      }
    ]
  },
  {
    path: 'users',
    canActivate: [authGuard, roleGuard],
    data: { requiredRoles: ['super_admin', 'support_admin'] },
    children: [
      {
        path: '',
        loadComponent: () => import('./features/users/user-management-dashboard.component').then(m => m.UserManagementDashboardComponent)
      },
      {
        path: 'subscriptions',
        loadComponent: () => import('./features/users/subscription-management.component').then(m => m.SubscriptionManagementComponent)
      },
      {
        path: 'support',
        loadComponent: () => import('./features/users/support-tickets.component').then(m => m.SupportTicketsComponent)
      }
    ]
  },
  {
    path: 'analytics',
    canActivate: [authGuard, roleGuard],
    data: { requiredRoles: ['super_admin', 'analytics_admin'] },
    children: [
      {
        path: '',
        redirectTo: 'business',
        pathMatch: 'full'
      },
      {
        path: 'business',
        loadComponent: () => import('./features/dashboard/business-intelligence-dashboard.component').then(m => m.BusinessIntelligenceDashboardComponent)
      },
      {
        path: 'engagement',
        loadComponent: () => import('./features/analytics/user-engagement.component').then(m => m.UserEngagementComponent)
      },
      {
        path: 'revenue',
        loadComponent: () => import('./features/analytics/revenue-reports.component').then(m => m.RevenueReportsComponent)
      }
    ]
  },
  {
    path: 'system',
    canActivate: [authGuard, roleGuard],
    data: { requiredRoles: ['super_admin'] },
    children: [
      {
        path: '',
        redirectTo: 'health',
        pathMatch: 'full'
      },
      {
        path: 'health',
        loadComponent: () => import('./features/system/system-health.component').then(m => m.SystemHealthComponent)
      },
      {
        path: 'audit',
        loadComponent: () => import('./features/system/audit-logs.component').then(m => m.AuditLogsComponent)
      },
      {
        path: 'config',
        loadComponent: () => import('./features/system/system-config.component').then(m => m.SystemConfigComponent)
      }
    ]
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/user-profile.component').then(m => m.UserProfileComponent),
    canActivate: [authGuard]
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/admin-settings.component').then(m => m.AdminSettingsComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    loadComponent: () => import('./shared/components/not-found.component').then(m => m.NotFoundComponent)
  }
];