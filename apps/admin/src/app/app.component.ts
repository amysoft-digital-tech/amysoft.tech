import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, Subscription } from 'rxjs';
import { map, filter } from 'rxjs/operators';

import { AuthService } from './core/auth/auth.service';
import { NotificationService } from './core/services/notification.service';
import { AuditService } from './core/services/audit.service';

interface NavigationItem {
  label: string;
  icon: string;
  route: string;
  requiredRoles: string[];
  children?: NavigationItem[];
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatToolbarModule,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatMenuModule,
    MatBadgeModule,
    MatTooltipModule
  ],
  template: `
    <div class="admin-container">
      <!-- Top Toolbar -->
      <mat-toolbar color="primary" class="admin-toolbar">
        <button
          mat-icon-button
          (click)="toggleSidenav()"
          [class.hidden]="!(isHandset$ | async)">
          <mat-icon>menu</mat-icon>
        </button>
        
        <span class="toolbar-title">
          <mat-icon class="title-icon">admin_panel_settings</mat-icon>
          Admin Console
        </span>
        
        <span class="toolbar-spacer"></span>
        
        <!-- Notifications -->
        <button 
          mat-icon-button 
          [matMenuTriggerFor]="notificationMenu"
          matTooltip="Notifications">
          <mat-icon [matBadge]="notificationCount" matBadgeColor="warn">notifications</mat-icon>
        </button>
        
        <!-- User Menu -->
        <button 
          mat-icon-button 
          [matMenuTriggerFor]="userMenu"
          matTooltip="User Account">
          <mat-icon>account_circle</mat-icon>
        </button>
      </mat-toolbar>

      <!-- Side Navigation -->
      <mat-sidenav-container class="admin-content">
        <mat-sidenav
          #sidenav
          class="admin-sidenav"
          [mode]="(isHandset$ | async) ? 'over' : 'side'"
          [opened]="!(isHandset$ | async)"
          [fixedInViewport]="isHandset$ | async"
          fixedTopGap="64">
          
          <!-- User Info -->
          <div class="user-info" *ngIf="currentUser$ | async as user">
            <div class="user-avatar">
              <mat-icon>person</mat-icon>
            </div>
            <div class="user-details">
              <div class="user-name">{{ user.name }}</div>
              <div class="user-role">{{ user.role }}</div>
            </div>
          </div>
          
          <!-- Navigation Menu -->
          <mat-nav-list>
            <ng-container *ngFor="let item of visibleNavItems">
              <!-- Parent Items -->
              <div *ngIf="!item.children">
                <a mat-list-item 
                   [routerLink]="item.route"
                   routerLinkActive="active-route"
                   (click)="onNavigate(item)">
                  <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
                  <span matListItemTitle>{{ item.label }}</span>
                </a>
              </div>
              
              <!-- Items with Children -->
              <div *ngIf="item.children">
                <h3 matSubheader>{{ item.label }}</h3>
                <ng-container *ngFor="let child of item.children">
                  <a mat-list-item 
                     [routerLink]="child.route"
                     routerLinkActive="active-route"
                     class="child-item"
                     (click)="onNavigate(child)">
                    <mat-icon matListItemIcon>{{ child.icon }}</mat-icon>
                    <span matListItemTitle>{{ child.label }}</span>
                  </a>
                </ng-container>
              </div>
            </ng-container>
          </mat-nav-list>
        </mat-sidenav>

        <!-- Main Content -->
        <mat-sidenav-content class="admin-main">
          <router-outlet></router-outlet>
        </mat-sidenav-content>
      </mat-sidenav-container>

      <!-- Notification Menu -->
      <mat-menu #notificationMenu="matMenu">
        <div class="notification-header">
          <span>Notifications</span>
          <button mat-icon-button (click)="markAllNotificationsRead()">
            <mat-icon>done_all</mat-icon>
          </button>
        </div>
        <mat-divider></mat-divider>
        <div class="notification-list" *ngIf="notifications.length > 0; else noNotifications">
          <button mat-menu-item *ngFor="let notification of notifications" class="notification-item">
            <mat-icon [class]="'notification-' + notification.type">{{ getNotificationIcon(notification.type) }}</mat-icon>
            <div class="notification-content">
              <div class="notification-title">{{ notification.title }}</div>
              <div class="notification-time">{{ notification.time | date:'short' }}</div>
            </div>
          </button>
        </div>
        <ng-template #noNotifications>
          <div class="no-notifications">
            <mat-icon>notifications_none</mat-icon>
            <span>No new notifications</span>
          </div>
        </ng-template>
      </mat-menu>

      <!-- User Menu -->
      <mat-menu #userMenu="matMenu">
        <div class="user-menu-header" *ngIf="currentUser$ | async as user">
          <div class="user-avatar-small">
            <mat-icon>person</mat-icon>
          </div>
          <div>
            <div class="user-name-small">{{ user.name }}</div>
            <div class="user-email-small">{{ user.email }}</div>
          </div>
        </div>
        <mat-divider></mat-divider>
        <button mat-menu-item (click)="viewProfile()">
          <mat-icon>person</mat-icon>
          <span>Profile</span>
        </button>
        <button mat-menu-item (click)="openSettings()">
          <mat-icon>settings</mat-icon>
          <span>Settings</span>
        </button>
        <button mat-menu-item (click)="viewAuditLog()">
          <mat-icon>history</mat-icon>
          <span>Activity Log</span>
        </button>
        <mat-divider></mat-divider>
        <button mat-menu-item (click)="logout()" class="logout-item">
          <mat-icon>logout</mat-icon>
          <span>Logout</span>
        </button>
      </mat-menu>
    </div>
  `,
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  title = 'Admin Console';
  
  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(map(result => result.matches));

  currentUser$ = this.authService.currentUser$;
  notificationCount = 0;
  notifications: any[] = [];

  private subscriptions = new Subscription();

  navigationItems: NavigationItem[] = [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/dashboard',
      requiredRoles: ['super_admin', 'content_admin', 'support_admin', 'analytics_admin']
    },
    {
      label: 'Content Management',
      icon: 'article',
      route: '',
      requiredRoles: ['super_admin', 'content_admin'],
      children: [
        {
          label: 'Content Editor',
          icon: 'edit',
          route: '/content/editor',
          requiredRoles: ['super_admin', 'content_admin']
        },
        {
          label: 'Content Organization',
          icon: 'folder',
          route: '/content/organization',
          requiredRoles: ['super_admin', 'content_admin']
        },
        {
          label: 'Media Management',
          icon: 'perm_media',
          route: '/content/media',
          requiredRoles: ['super_admin', 'content_admin']
        },
        {
          label: 'Workflow Management',
          icon: 'workflow',
          route: '/content/workflow',
          requiredRoles: ['super_admin', 'content_admin']
        }
      ]
    },
    {
      label: 'User Management',
      icon: 'people',
      route: '',
      requiredRoles: ['super_admin', 'support_admin'],
      children: [
        {
          label: 'Users',
          icon: 'person',
          route: '/users',
          requiredRoles: ['super_admin', 'support_admin']
        },
        {
          label: 'Subscriptions',
          icon: 'card_membership',
          route: '/users/subscriptions',
          requiredRoles: ['super_admin', 'support_admin']
        },
        {
          label: 'Support Tickets',
          icon: 'support',
          route: '/users/support',
          requiredRoles: ['super_admin', 'support_admin']
        }
      ]
    },
    {
      label: 'Analytics',
      icon: 'analytics',
      route: '',
      requiredRoles: ['super_admin', 'analytics_admin'],
      children: [
        {
          label: 'Business Intelligence',
          icon: 'insights',
          route: '/analytics/business',
          requiredRoles: ['super_admin', 'analytics_admin']
        },
        {
          label: 'User Engagement',
          icon: 'trending_up',
          route: '/analytics/engagement',
          requiredRoles: ['super_admin', 'analytics_admin']
        },
        {
          label: 'Revenue Reports',
          icon: 'monetization_on',
          route: '/analytics/revenue',
          requiredRoles: ['super_admin', 'analytics_admin']
        }
      ]
    },
    {
      label: 'System',
      icon: 'settings',
      route: '',
      requiredRoles: ['super_admin'],
      children: [
        {
          label: 'System Health',
          icon: 'monitor_heart',
          route: '/system/health',
          requiredRoles: ['super_admin']
        },
        {
          label: 'Audit Logs',
          icon: 'history',
          route: '/system/audit',
          requiredRoles: ['super_admin']
        },
        {
          label: 'Configuration',
          icon: 'tune',
          route: '/system/config',
          requiredRoles: ['super_admin']
        }
      ]
    }
  ];

  constructor(
    private breakpointObserver: BreakpointObserver,
    private authService: AuthService,
    private notificationService: NotificationService,
    private auditService: AuditService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Handle mobile navigation
    this.subscriptions.add(
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe(() => {
        if (this.isHandset$.pipe(map(result => result))) {
          this.sidenav?.close();
        }
      })
    );

    // Load notifications
    this.loadNotifications();
    
    // Track page views for audit
    this.subscriptions.add(
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe((event: NavigationEnd) => {
        this.auditService.logPageView(event.urlAfterRedirects);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get visibleNavItems(): NavigationItem[] {
    return this.navigationItems.filter(item => this.hasRequiredRole(item.requiredRoles));
  }

  private hasRequiredRole(requiredRoles: string[]): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;
    return requiredRoles.includes(currentUser.role);
  }

  toggleSidenav(): void {
    this.sidenav.toggle();
  }

  onNavigate(item: NavigationItem): void {
    this.auditService.logAction('navigation', `Navigated to ${item.label}`, { route: item.route });
  }

  private loadNotifications(): void {
    this.subscriptions.add(
      this.notificationService.getNotifications().subscribe(notifications => {
        this.notifications = notifications;
        this.notificationCount = notifications.filter(n => !n.read).length;
      })
    );
  }

  markAllNotificationsRead(): void {
    this.notificationService.markAllAsRead().subscribe(() => {
      this.notificationCount = 0;
      this.notifications.forEach(n => n.read = true);
    });
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      case 'success': return 'check_circle';
      default: return 'notifications';
    }
  }

  viewProfile(): void {
    this.router.navigate(['/profile']);
    this.auditService.logAction('profile_view', 'Viewed user profile');
  }

  openSettings(): void {
    this.router.navigate(['/settings']);
    this.auditService.logAction('settings_view', 'Opened settings');
  }

  viewAuditLog(): void {
    this.router.navigate(['/system/audit']);
    this.auditService.logAction('audit_view', 'Viewed audit log');
  }

  logout(): void {
    this.auditService.logAction('logout', 'User logged out').subscribe(() => {
      this.authService.logout();
      this.router.navigate(['/login']);
    });
  }
}