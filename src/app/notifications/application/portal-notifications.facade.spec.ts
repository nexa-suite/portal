import { TestBed } from '@angular/core/testing';
import { throwError } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { NotificationPage, PortalNotification } from '../domain/notification.models';
import { NotificationsApiPort } from './ports/notifications-api.port';
import { PortalNotificationsFacade } from './portal-notifications.facade';

const unreadNotification: PortalNotification = {
  id: 'notification-1', category: 'order', title: 'Order updated', message: 'Ready', deepLink: null,
  subjectType: 'SALES_ORDER', subjectId: 'order-1', createdAt: '2030-01-01T00:00:00Z', readAt: null,
};
const page: NotificationPage = { items: [unreadNotification], unreadCount: 1, limit: 25 };

describe('PortalNotificationsFacade', () => {
  let facade: PortalNotificationsFacade;
  let api: { markRead: ReturnType<typeof vi.fn>; markAllRead: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    api = {
      markRead: vi.fn(() => throwError(() => new Error('API unavailable'))),
      markAllRead: vi.fn(() => throwError(() => new Error('API unavailable'))),
    };
    TestBed.configureTestingModule({ providers: [{ provide: NotificationsApiPort, useValue: api }] });
    facade = TestBed.inject(PortalNotificationsFacade);
    facade.page.set(page);
    facade.state.set('success');
  });

  it('exposes markRead failures through the existing message state and keeps data unchanged', () => {
    facade.markRead(unreadNotification);

    expect(api.markRead).toHaveBeenCalledWith('notification-1');
    expect(facade.message()).toBe('NOTIFICATIONS_ACTION_FAILED');
    expect(facade.busy()).toBe(false);
    expect(facade.page()).toEqual(page);
  });

  it('exposes markAllRead failures through the existing message state and keeps data unchanged', () => {
    facade.markAllRead();

    expect(api.markAllRead).toHaveBeenCalledOnce();
    expect(facade.message()).toBe('NOTIFICATIONS_ACTION_FAILED');
    expect(facade.busy()).toBe(false);
    expect(facade.page()).toEqual(page);
  });
});
