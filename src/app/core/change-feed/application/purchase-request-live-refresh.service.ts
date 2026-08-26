import { Injectable, inject } from '@angular/core';
import { CHANGE_FEED_FETCH_PORT } from './change-feed-fetch.port';

@Injectable({ providedIn: 'root' })
export class PurchaseRequestLiveRefreshService {
  private readonly feed = inject(CHANGE_FEED_FETCH_PORT);

  watch(listener: (purchaseRequestId: string | null) => void): () => void {
    return this.feed.watch((event) => {
      if (event.resource === 'PURCHASE_REQUEST') listener(event.resourceId);
    });
  }
}
