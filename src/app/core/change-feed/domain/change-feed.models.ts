export type ChangeFeedResource = 'PURCHASE_REQUEST' | 'SALES_ORDER' | 'DISPATCH_ORDER' | 'UNKNOWN';

export interface ChangeFeedEvent {
  readonly id: string;
  readonly type: string;
  readonly resource: ChangeFeedResource;
  readonly resourceId: string | null;
}

export type ChangeFeedListener = (event: ChangeFeedEvent) => void;
