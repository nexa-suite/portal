import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { NotificationPage, PortalNotification } from '../domain/notification.models';

export interface NotificationsPort {
  list(unread?: boolean, limit?: number): Observable<NotificationPage>;
  unreadCount(): Observable<number>;
  markRead(id: string): Observable<void>;
  markAllRead(): Observable<void>;
}

export const NOTIFICATIONS_PORT = new InjectionToken<NotificationsPort>('NOTIFICATIONS_PORT');
