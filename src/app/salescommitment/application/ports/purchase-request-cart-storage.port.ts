import type { PurchaseRequestCartItem } from '../../domain/buyer-requests/purchase-request-cart.models';

/** Persistence port for the browser-backed Buyer cart adapter. */
export abstract class PurchaseRequestCartStoragePort {
  abstract read(scope: string): readonly PurchaseRequestCartItem[];
  abstract write(scope: string, items: readonly PurchaseRequestCartItem[]): void;
  abstract clear(scope: string): void;
}
