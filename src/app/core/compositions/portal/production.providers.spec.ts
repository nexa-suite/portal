import { describe, expect, it } from 'vitest';

import { NotificationsApiPort } from '../../../notifications/application/ports/notifications-api.port';
import { NotificationsApiClient } from '../../../notifications/infrastructure/notifications-api.client';
import { PORTAL_NOTIFICATIONS_PROVIDERS } from './production.providers';

describe('Portal production composition', () => {
  it('binds the notifications facade contract to the HTTP adapter', () => {
    expect(PORTAL_NOTIFICATIONS_PROVIDERS).toEqual(expect.arrayContaining([
      NotificationsApiClient,
      { provide: NotificationsApiPort, useExisting: NotificationsApiClient },
    ]));
  });
});
