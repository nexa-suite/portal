import { Injectable } from '@angular/core';

import { ChangeFeedFetchPort } from '../../application/change-feed-fetch.port';

/** No-op adapter used by mock mode; it never opens the API SSE stream. */
@Injectable({ providedIn: 'root' })
export class MockChangeFeedFetchClient implements ChangeFeedFetchPort {
  watch(): () => void {
    return () => undefined;
  }
}
