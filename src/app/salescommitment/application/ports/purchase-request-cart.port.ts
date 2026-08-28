import type { Signal } from '@angular/core';
import type { PurchaseRequestCartItem } from '../../domain/buyer-requests/purchase-request-cart.models';

/** Application port for the Buyer request cart. */
export abstract class PurchaseRequestCartPort {
  abstract readonly items: Signal<readonly PurchaseRequestCartItem[]>;
  abstract readonly count: Signal<number>;
  abstract readonly subtotal: Signal<number>;
  abstract setScope(scope: string | null): void;
  abstract add(item: PurchaseRequestCartItem): void;
  abstract remove(catalogItemId: string): void;
  abstract setQuantity(catalogItemId: string, quantity: number): void;
  abstract replace(items: readonly PurchaseRequestCartItem[]): void;
  abstract clear(): void;
}
