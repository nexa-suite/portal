import { Injectable, inject, signal } from '@angular/core';
import { InventoryAvailabilityApiClient } from '../infrastructure/inventory-availability-api.client';
import { InventoryAvailability } from '../domain/inventory-availability.model';

@Injectable({ providedIn: 'root' })
export class InventoryAvailabilityFacade {
  private readonly api = inject(InventoryAvailabilityApiClient, { optional: true }); readonly items = signal<readonly InventoryAvailability[]>([]); readonly loading = signal(false);
  load(ids: readonly string[]): void { const values = ids.filter(Boolean); if (!values.length) return; if (!this.api) { this.items.set(values.map((catalogItemId) => ({ catalogItemId, status: 'UNKNOWN' as const, asOf: new Date().toISOString() }))); return; } this.loading.set(true); this.api.list(values).subscribe({ next: (items) => { this.items.set(items); this.loading.set(false); }, error: () => { this.items.set(values.map((catalogItemId) => ({ catalogItemId, status: 'UNKNOWN' as const, asOf: new Date().toISOString() }))); this.loading.set(false); } }); }
  forItem(id: string): InventoryAvailability { return this.items().find((item) => item.catalogItemId === id) ?? { catalogItemId: id, status: 'UNKNOWN', asOf: '' }; }
}
