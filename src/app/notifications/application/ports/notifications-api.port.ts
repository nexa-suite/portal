import { Observable } from 'rxjs';
import { NotificationPage } from '../../domain/notification.models';

/** Application port for buyer notification queries and commands. */
export abstract class NotificationsApiPort {
  abstract list(unread?: boolean, limit?: number): Observable<NotificationPage>;
  abstract unreadCount(): Observable<number>;
  abstract markRead(id: string): Observable<void>;
  abstract markAllRead(): Observable<void>;
}
