import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { PORTAL_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import { NotificationsApiPort } from '../../application/ports/notifications-api.port';
import { NotificationPage, PortalNotification } from '../../domain/notification.models';

/** BC-10 buyer-scoped notification adapter for the local runtime. */
@Injectable({ providedIn: 'root' })
export class MockNotificationsApiAdapter implements NotificationsApiPort {
  private readonly config = inject(PORTAL_RUNTIME_CONFIG);
  private notifications: PortalNotification[] = [
    { id: `${this.config.tenantProfile}-notification-001`, category: 'order', title: 'Order status updated', message: 'Your order is ready for delivery tracking.', deepLink: '/portal/sales-orders', subjectType: 'SALES_ORDER', subjectId: `${this.config.tenantProfile}-order-001`, createdAt: '2026-08-26T09:30:00Z', readAt: null },
    { id: `${this.config.tenantProfile}-notification-002`, category: 'delivery', title: 'Delivery window confirmed', message: 'Your next delivery has a confirmed window.', deepLink: '/portal/deliveries', subjectType: 'DELIVERY', subjectId: `${this.config.tenantProfile}-delivery-001`, createdAt: '2026-08-26T08:45:00Z', readAt: null },
    { id: `${this.config.tenantProfile}-notification-003`, category: 'document', title: 'Document available', message: 'A business document is ready to download.', deepLink: '/portal/documents', subjectType: 'BUSINESS_DOCUMENT', subjectId: `${this.config.tenantProfile}-document-001`, createdAt: '2026-08-25T11:00:00Z', readAt: '2026-08-25T11:01:00Z' },
  ];

  list(unread = false, limit = 25): Observable<NotificationPage> { const items = this.notifications.filter((item) => !unread || !item.readAt).slice(0, limit); return of({ items, unreadCount: this.notifications.filter((item) => !item.readAt).length, limit }); }
  unreadCount(): Observable<number> { return of(this.notifications.filter((item) => !item.readAt).length); }
  markRead(id: string): Observable<void> { this.notifications = this.notifications.map((item) => item.id === id ? { ...item, readAt: '2026-08-26T10:00:00Z' } : item); return of(void 0); }
  markAllRead(): Observable<void> { this.notifications = this.notifications.map((item) => ({ ...item, readAt: '2026-08-26T10:00:00Z' })); return of(void 0); }
}
