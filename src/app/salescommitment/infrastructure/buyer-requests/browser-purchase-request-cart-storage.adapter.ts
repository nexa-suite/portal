import { Injectable } from '@angular/core';
import { PurchaseRequestCartStoragePort } from '../../application/ports/purchase-request-cart-storage.port';
import type { PurchaseRequestCartItem } from '../../domain/buyer-requests/purchase-request-cart.models';

const STORAGE_KEY = 'nexa.portal.purchase-request-cart';

/** Browser adapter; the scope prevents a Buyer cart crossing workspaces/users. */
@Injectable({ providedIn: 'root' })
export class BrowserPurchaseRequestCartStorageAdapter extends PurchaseRequestCartStoragePort {
  read(scope: string): readonly PurchaseRequestCartItem[] {
    const storage = this.browserStorage();
    if (!storage) return [];
    try {
      const parsed: unknown = JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null');
      if (!isRecord(parsed) || parsed['scope'] !== scope || !Array.isArray(parsed['items'])) return [];
      return parsed['items'].filter(isCartItem);
    } catch {
      return [];
    }
  }

  write(scope: string, items: readonly PurchaseRequestCartItem[]): void {
    this.browserStorage()?.setItem(STORAGE_KEY, JSON.stringify({ scope, items }));
  }

  clear(scope: string): void {
    const storage = this.browserStorage();
    if (!storage) return;
    try {
      const parsed: unknown = JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null');
      if (!isRecord(parsed) || parsed['scope'] === scope) storage.removeItem(STORAGE_KEY);
    } catch {
      storage.removeItem(STORAGE_KEY);
    }
  }

  private browserStorage(): Storage | null {
    return typeof globalThis.localStorage === 'undefined' ? null : globalThis.localStorage;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

function isCartItem(value: unknown): value is PurchaseRequestCartItem {
  if (!isRecord(value)) return false;
  return typeof value['catalogItemId'] === 'string'
    && typeof value['productId'] === 'string'
    && typeof value['itemName'] === 'string'
    && typeof value['presentation'] === 'string'
    && typeof value['quantity'] === 'number'
    && Number.isFinite(value['quantity'])
    && value['quantity'] > 0;
}
