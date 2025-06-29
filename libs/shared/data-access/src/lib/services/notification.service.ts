import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  persistent?: boolean;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications$ = new BehaviorSubject<Notification[]>([]);
  private notificationId = 0;

  /**
   * Get observable of current notifications
   */
  getNotifications(): Observable<Notification[]> {
    return this.notifications$.asObservable();
  }

  /**
   * Show a notification
   */
  show(
    message: string, 
    type: Notification['type'] = 'info', 
    options?: { duration?: number; persistent?: boolean }
  ): string {
    const notification: Notification = {
      id: (++this.notificationId).toString(),
      message,
      type,
      duration: options?.duration || this.getDefaultDuration(type),
      persistent: options?.persistent || false,
      timestamp: new Date()
    };

    const currentNotifications = this.notifications$.value;
    this.notifications$.next([...currentNotifications, notification]);

    // Auto-remove notification after duration (unless persistent)
    if (!notification.persistent && notification.duration) {
      setTimeout(() => {
        this.dismiss(notification.id);
      }, notification.duration);
    }

    return notification.id;
  }

  /**
   * Show success notification
   */
  success(message: string, duration?: number): string {
    return this.show(message, 'success', { duration });
  }

  /**
   * Show error notification
   */
  error(message: string, persistent = false): string {
    return this.show(message, 'error', { 
      duration: persistent ? undefined : 8000,
      persistent 
    });
  }

  /**
   * Show warning notification
   */
  warning(message: string, duration?: number): string {
    return this.show(message, 'warning', { duration });
  }

  /**
   * Show info notification
   */
  info(message: string, duration?: number): string {
    return this.show(message, 'info', { duration });
  }

  /**
   * Dismiss a specific notification
   */
  dismiss(notificationId: string): void {
    const currentNotifications = this.notifications$.value;
    const filteredNotifications = currentNotifications.filter(
      notification => notification.id !== notificationId
    );
    this.notifications$.next(filteredNotifications);
  }

  /**
   * Dismiss all notifications
   */
  dismissAll(): void {
    this.notifications$.next([]);
  }

  /**
   * Dismiss notifications by type
   */
  dismissByType(type: Notification['type']): void {
    const currentNotifications = this.notifications$.value;
    const filteredNotifications = currentNotifications.filter(
      notification => notification.type !== type
    );
    this.notifications$.next(filteredNotifications);
  }

  /**
   * Get current notifications count
   */
  getCount(): number {
    return this.notifications$.value.length;
  }

  /**
   * Get notifications by type
   */
  getByType(type: Notification['type']): Notification[] {
    return this.notifications$.value.filter(notification => notification.type === type);
  }

  /**
   * Get default duration based on notification type
   */
  private getDefaultDuration(type: Notification['type']): number {
    const durations = {
      success: 4000,
      info: 5000,
      warning: 6000,
      error: 8000
    };
    return durations[type];
  }
}