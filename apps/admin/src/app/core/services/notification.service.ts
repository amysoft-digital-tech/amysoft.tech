import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  time: Date;
  read: boolean;
  action?: NotificationAction;
  metadata?: Record<string, any>;
}

export interface NotificationAction {
  label: string;
  url?: string;
  callback?: () => void;
}

export interface NotificationPreferences {
  browser: boolean;
  email: boolean;
  categories: {
    system: boolean;
    content: boolean;
    users: boolean;
    security: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly API_URL = '/api/admin/notifications';
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  
  public notifications$ = this.notificationsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {
    this.initializeRealTimeNotifications();
    this.loadNotifications();
  }

  // Toast Notifications (immediate feedback)
  showSuccess(message: string, duration: number = 4000): void {
    this.snackBar.open(message, 'Close', {
      duration,
      panelClass: ['snackbar-success'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  showError(message: string, duration: number = 6000): void {
    this.snackBar.open(message, 'Close', {
      duration,
      panelClass: ['snackbar-error'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  showWarning(message: string, duration: number = 5000): void {
    this.snackBar.open(message, 'Close', {
      duration,
      panelClass: ['snackbar-warning'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  showInfo(message: string, duration: number = 4000): void {
    this.snackBar.open(message, 'Close', {
      duration,
      panelClass: ['snackbar-info'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  // Persistent Notifications (notification center)
  getNotifications(): Observable<Notification[]> {
    return this.notifications$;
  }

  loadNotifications(): void {
    this.http.get<Notification[]>(`${this.API_URL}`).subscribe({
      next: (notifications) => {
        this.notificationsSubject.next(notifications);
      },
      error: () => {
        // Fallback to mock data if API is not available
        this.notificationsSubject.next(this.getMockNotifications());
      }
    });
  }

  markAsRead(notificationId: string): Observable<void> {
    return this.http.patch<void>(`${this.API_URL}/${notificationId}/read`, {});
  }

  markAllAsRead(): Observable<void> {
    return this.http.patch<void>(`${this.API_URL}/read-all`, {}).pipe(
      map(() => {
        const currentNotifications = this.notificationsSubject.value;
        const updatedNotifications = currentNotifications.map(n => ({ ...n, read: true }));
        this.notificationsSubject.next(updatedNotifications);
      })
    );
  }

  deleteNotification(notificationId: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${notificationId}`).pipe(
      map(() => {
        const currentNotifications = this.notificationsSubject.value;
        const updatedNotifications = currentNotifications.filter(n => n.id !== notificationId);
        this.notificationsSubject.next(updatedNotifications);
      })
    );
  }

  createNotification(notification: Omit<Notification, 'id' | 'time' | 'read'>): Observable<Notification> {
    const newNotification: Notification = {
      ...notification,
      id: this.generateNotificationId(),
      time: new Date(),
      read: false
    };

    return this.http.post<Notification>(`${this.API_URL}`, newNotification).pipe(
      map((savedNotification) => {
        const currentNotifications = this.notificationsSubject.value;
        this.notificationsSubject.next([savedNotification, ...currentNotifications]);
        return savedNotification;
      })
    );
  }

  getNotificationPreferences(): Observable<NotificationPreferences> {
    return this.http.get<NotificationPreferences>(`${this.API_URL}/preferences`);
  }

  updateNotificationPreferences(preferences: NotificationPreferences): Observable<NotificationPreferences> {
    return this.http.put<NotificationPreferences>(`${this.API_URL}/preferences`, preferences);
  }

  // Real-time notifications via polling (can be replaced with WebSocket)
  private initializeRealTimeNotifications(): void {
    // Poll for new notifications every 30 seconds
    timer(0, 30000).pipe(
      switchMap(() => this.http.get<Notification[]>(`${this.API_URL}/recent`))
    ).subscribe({
      next: (recentNotifications) => {
        if (recentNotifications.length > 0) {
          const currentNotifications = this.notificationsSubject.value;
          const newNotifications = recentNotifications.filter(
            recent => !currentNotifications.some(current => current.id === recent.id)
          );
          
          if (newNotifications.length > 0) {
            this.notificationsSubject.next([...newNotifications, ...currentNotifications]);
            
            // Show browser notification for new items
            newNotifications.forEach(notification => {
              this.showBrowserNotification(notification);
            });
          }
        }
      },
      error: (error) => {
        console.warn('Failed to fetch recent notifications:', error);
      }
    });
  }

  private showBrowserNotification(notification: Notification): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/assets/icons/notification-icon.png',
        badge: '/assets/icons/badge-icon.png',
        tag: notification.id
      });
    }
  }

  requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      return Notification.requestPermission();
    }
    return Promise.resolve('denied');
  }

  private generateNotificationId(): string {
    return 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private getMockNotifications(): Notification[] {
    return [
      {
        id: 'notif_1',
        type: 'info',
        title: 'Welcome to Admin Console',
        message: 'Your admin console is ready to use.',
        time: new Date(Date.now() - 3600000), // 1 hour ago
        read: false
      },
      {
        id: 'notif_2',
        type: 'success',
        title: 'Content Published',
        message: 'Chapter 5 has been successfully published.',
        time: new Date(Date.now() - 7200000), // 2 hours ago
        read: true
      },
      {
        id: 'notif_3',
        type: 'warning',
        title: 'Storage Usage Alert',
        message: 'Media storage is at 85% capacity.',
        time: new Date(Date.now() - 86400000), // 1 day ago
        read: false,
        action: {
          label: 'View Storage',
          url: '/system/health'
        }
      }
    ];
  }
}