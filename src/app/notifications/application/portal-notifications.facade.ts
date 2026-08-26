import { Injectable, inject, signal } from '@angular/core';
import { catchError, finalize, Observable, throwError } from 'rxjs';
import { NotificationPage, PortalNotification } from '../domain/notification.models';
import { NotificationsApiPort } from './ports/notifications-api.port';

type NotificationState = 'idle' | 'loading' | 'success' | 'error';

@Injectable({ providedIn: 'root' })
export class PortalNotificationsFacade {
  private readonly api = inject(NotificationsApiPort);
  readonly state = signal<NotificationState>('idle');
  readonly page = signal<NotificationPage>({ items: [], unreadCount: 0, limit: 25 });
  readonly message = signal<string | null>(null);
  readonly busy = signal(false);

  load(): void {
    this.state.set('loading');
    this.message.set(null);
    this.api.list(false, 25).subscribe({
      next: (page) => { this.page.set(page); this.state.set('success'); },
      error: () => { this.state.set('error'); this.message.set('NOTIFICATIONS_LOAD_FAILED'); },
    });
  }

  markRead(item: PortalNotification): void {
    if (item.readAt) return;
    this.run(() => this.api.markRead(item.id)).subscribe({
      next: () => this.page.update((page) => ({ ...page, unreadCount: Math.max(0, page.unreadCount - 1), items: page.items.map((current) => current.id === item.id ? { ...current, readAt: new Date().toISOString() } : current) })),
      error: () => undefined,
    });
  }

  markAllRead(): void {
    if (this.page().unreadCount === 0) return;
    this.run(() => this.api.markAllRead()).subscribe({
      next: () => this.page.update((page) => ({ ...page, unreadCount: 0, items: page.items.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })) })),
      error: () => undefined,
    });
  }

  private run<T>(factory: () => Observable<T>): Observable<T> {
    this.busy.set(true);
    return factory().pipe(
      catchError((error: unknown) => { this.message.set('NOTIFICATIONS_ACTION_FAILED'); return throwError(() => error); }),
      finalize(() => this.busy.set(false)),
    );
  }
}
