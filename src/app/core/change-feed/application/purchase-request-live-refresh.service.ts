import { Injectable, inject } from '@angular/core';
import { ChangeFeedFetchClient } from '../infrastructure/change-feed-fetch.client';

@Injectable({ providedIn: 'root' })
export class PurchaseRequestLiveRefreshService {
  private readonly feed = inject(ChangeFeedFetchClient);

  watch(listener: (purchaseRequestId: string | null) => void): () => void {
    return this.feed.watch((event) => {
      if (event.resource === 'PURCHASE_REQUEST') listener(event.resourceId);
    });
  }
}
