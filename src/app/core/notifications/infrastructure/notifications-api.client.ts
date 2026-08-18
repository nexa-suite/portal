import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { PORTAL_RUNTIME_CONFIG, portalApiUrl } from '../../security/runtime-config';
import { NotificationPage, PortalNotification } from '../domain/notification.models';

type Raw = Record<string, unknown>;
function raw(value: unknown): Raw { return value !== null && typeof value === 'object' ? value as Raw : {}; }
function text(value: unknown): string { return typeof value === 'string' ? value.trim() : ''; }
function nullableText(value: unknown): string | null { const result = text(value); return result || null; }
function number(value: unknown): number { const result = typeof value === 'number' ? value : Number(value); return Number.isFinite(result) ? result : 0; }

function notification(value: unknown): PortalNotification {
  const item = raw(value);
  return {
    id: text(item['id']),
    category: text(item['category']),
    title: text(item['title']),
    message: text(item['message']),
    deepLink: nullableText(item['deepLink']),
    subjectType: nullableText(item['subjectType']),
    subjectId: nullableText(item['subjectId']),
    createdAt: text(item['createdAt']),
    readAt: nullableText(item['readAt']),
  };
}

@Injectable({ providedIn: 'root' })
export class NotificationsApiClient {
  private readonly http = inject(HttpClient);
  private readonly config = inject(PORTAL_RUNTIME_CONFIG);

  private api(path: string): string { return portalApiUrl(this.config, `/api/v1/notifications${path}`); }

  list(unread = false, limit = 25): Observable<NotificationPage> {
    const params = new HttpParams().set('unread', unread).set('limit', limit);
    return this.http.get<unknown>(this.api(''), { params, withCredentials: true }).pipe(map((value) => {
      const payload = raw(value);
      const items = Array.isArray(payload['items']) ? payload['items'].map(notification) : [];
      return { items, unreadCount: number(payload['unreadCount']), limit: number(payload['limit']) || limit };
    }));
  }

  unreadCount(): Observable<number> {
    return this.http.get<unknown>(this.api('/unread-count'), { withCredentials: true }).pipe(map((value) => number(raw(value)['unreadCount'])));
  }

  markRead(id: string): Observable<void> {
    return this.http.post<void>(this.api(`/${encodeURIComponent(id)}/read`), null, { withCredentials: true });
  }

  markAllRead(): Observable<void> {
    return this.http.post<void>(this.api('/read-all'), null, { withCredentials: true });
  }
}
