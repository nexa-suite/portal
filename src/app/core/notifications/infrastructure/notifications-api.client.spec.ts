import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PORTAL_RUNTIME_CONFIG } from '../../security/runtime-config';
import { NotificationsApiClient } from './notifications-api.client';

describe('NotificationsApiClient', () => {
  let client: NotificationsApiClient;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NotificationsApiClient, provideHttpClient(), provideHttpClientTesting(), { provide: PORTAL_RUNTIME_CONFIG, useValue: { apiBaseUrl: 'http://api.local', surface: 'PORTAL' } }],
    });
    client = TestBed.inject(NotificationsApiClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the scoped notification inbox and unread count', () => {
    client.list(false, 25).subscribe((page) => expect(page.unreadCount).toBe(1));
    const request = http.expectOne('http://api.local/api/v1/notifications?unread=false&limit=25');
    expect(request.request.method).toBe('GET');
    request.flush({ items: [{ id: 'n-1', category: 'ORDER', title: 'Order updated', message: 'Ready', deepLink: '/portal/sales-orders/1', createdAt: '2030-01-01T00:00:00Z', readAt: null }], unreadCount: 1, limit: 25 });
  });

  it('marks a notification read through the real action endpoint', () => {
    client.markRead('n-1').subscribe();
    const request = http.expectOne('http://api.local/api/v1/notifications/n-1/read');
    expect(request.request.method).toBe('POST');
    request.flush(null);
  });
});
