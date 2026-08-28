import { computed, inject, Injectable, signal } from '@angular/core';
import { PurchaseRequestCartPort } from '../ports/purchase-request-cart.port';
import { PurchaseRequestCartStoragePort } from '../ports/purchase-request-cart-storage.port';
import type { PurchaseRequestCartItem } from '../../domain/buyer-requests/purchase-request-cart.models';

@Injectable({ providedIn: 'root' })
export class PurchaseRequestCartService extends PurchaseRequestCartPort {
  private readonly storage = inject(PurchaseRequestCartStoragePort);
  private readonly itemsState = signal<readonly PurchaseRequestCartItem[]>([]);
  private scope = '';

  readonly items = this.itemsState.asReadonly();
  readonly count = computed(() => this.itemsState().reduce((total, item) => total + item.quantity, 0));
  readonly subtotal = computed(() => this.itemsState().reduce(
    (total, item) => total + (item.unitPriceAmount ?? 0) * item.quantity,
    0,
  ));

  setScope(scope: string | null): void {
    const nextScope = scope?.trim() ?? '';
    if (nextScope === this.scope) return;
    this.scope = nextScope;
    this.itemsState.set(nextScope ? this.storage.read(nextScope) : []);
  }

  add(item: PurchaseRequestCartItem): void {
    if (!this.scope || item.quantity <= 0) return;
    const current = this.itemsState();
    const existing = current.find((candidate) => candidate.catalogItemId === item.catalogItemId);
    const next = existing
      ? current.map((candidate) => candidate.catalogItemId === item.catalogItemId
        ? { ...candidate, quantity: candidate.quantity + item.quantity }
        : candidate)
      : [...current, { ...item, quantity: item.quantity }];
    this.persist(next);
  }

  remove(catalogItemId: string): void {
    this.persist(this.itemsState().filter((item) => item.catalogItemId !== catalogItemId));
  }

  setQuantity(catalogItemId: string, quantity: number): void {
    const normalized = Number.isFinite(quantity) ? Math.max(0.01, quantity) : 0.01;
    this.persist(this.itemsState().map((item) => item.catalogItemId === catalogItemId
      ? { ...item, quantity: Number(normalized.toFixed(2)) }
      : item));
  }

  replace(items: readonly PurchaseRequestCartItem[]): void {
    const unique = new Map<string, PurchaseRequestCartItem>();
    for (const item of items) {
      if (!item.catalogItemId || item.quantity <= 0) continue;
      unique.set(item.catalogItemId, { ...item, quantity: Number(item.quantity.toFixed(2)) });
    }
    this.persist([...unique.values()]);
  }

  clear(): void {
    this.itemsState.set([]);
    if (this.scope) this.storage.clear(this.scope);
  }

  private persist(items: readonly PurchaseRequestCartItem[]): void {
    this.itemsState.set(items);
    if (this.scope) this.storage.write(this.scope, items);
  }
}
