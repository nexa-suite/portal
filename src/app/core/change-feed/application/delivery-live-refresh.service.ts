import { Injectable, inject } from '@angular/core';
import { ChangeFeedFetchClient } from '../infrastructure/change-feed-fetch.client';

@Injectable({ providedIn: 'root' })
export class DeliveryLiveRefreshService {
  private readonly feed = inject(ChangeFeedFetchClient);
  watch(listener: (dispatchOrderId: string | null) => void): () => void { return this.feed.watch((event) => { if (event.resource === 'DISPATCH_ORDER') listener(event.resourceId); }); }
}
