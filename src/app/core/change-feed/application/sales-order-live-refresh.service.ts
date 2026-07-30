import { Injectable, inject } from '@angular/core';
import { ChangeFeedFetchClient } from '../infrastructure/change-feed-fetch.client';

@Injectable({ providedIn: 'root' })
export class SalesOrderLiveRefreshService {
  private readonly feed = inject(ChangeFeedFetchClient);

  watch(listener: (salesOrderId: string | null) => void): () => void {
    return this.feed.watch((event) => {
      if (event.resource === 'SALES_ORDER') listener(event.resourceId);
    });
  }
}
