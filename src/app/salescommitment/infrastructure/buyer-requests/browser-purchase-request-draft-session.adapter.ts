import { Injectable } from '@angular/core';
import { PurchaseRequestDraftSessionPort } from '../../application/ports/purchase-request-draft-session.port';

const STORAGE_KEY = 'nexa.portal.active-purchase-request-draft';

/** Browser pointer only; draft data and lifecycle remain server-owned. */
@Injectable({ providedIn: 'root' })
export class BrowserPurchaseRequestDraftSessionAdapter extends PurchaseRequestDraftSessionPort {
  read(scope: string): string | null {
    const storage = this.browserStorage();
    if (!storage) return null;
    try {
      const value: unknown = JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null');
      if (!isRecord(value) || value['scope'] !== scope || typeof value['draftId'] !== 'string') return null;
      const draftId = value['draftId'].trim();
      return draftId || null;
    } catch {
      return null;
    }
  }

  write(scope: string, draftId: string): void {
    const normalized = draftId.trim();
    if (!scope.trim() || !normalized) return;
    this.browserStorage()?.setItem(STORAGE_KEY, JSON.stringify({ scope, draftId: normalized }));
  }

  clear(scope: string): void {
    const storage = this.browserStorage();
    if (!storage) return;
    try {
      const value: unknown = JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null');
      if (!isRecord(value) || value['scope'] === scope) storage.removeItem(STORAGE_KEY);
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
