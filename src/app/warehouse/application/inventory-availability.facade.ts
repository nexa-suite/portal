import { Injectable, inject, signal } from '@angular/core';
import { InventoryAvailabilityApiClient } from '../infrastructure/inventory-availability-api.client';
import { InventoryAvailability } from '../domain/inventory-availability.model';

@Injectable({ providedIn: 'root' })
export class InventoryAvailabilityFacade {
  private readonly api = inject(InventoryAvailabilityApiClient, { optional: true });
  private lastIds: readonly string[] = [];
  readonly items = signal<readonly InventoryAvailability[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  load(ids: readonly string[]): void {
    const values = [...new Set(ids.filter(Boolean))];
    this.lastIds = values;
    this.error.set(null);
    if (!values.length) {
      this.items.set([]);
      this.loading.set(false);
      return;
    }
    if (!this.api) { this.items.set(values.map((catalogItemId) => ({ catalogItemId, status: 'UNKNOWN' as const, asOf: new Date().toISOString() }))); return; }
    this.loading.set(true);
    this.api.list(values).subscribe({
      next: (items) => { this.items.set(items); this.loading.set(false); this.error.set(null); },
      error: () => { this.loading.set(false); this.error.set('AVAILABILITY_LOAD_FAILED'); }
    });
  }

  retry(): void { this.load(this.lastIds); }
  forItem(id: string): InventoryAvailability { return this.items().find((item) => item.catalogItemId === id) ?? { catalogItemId: id, status: 'UNKNOWN', asOf: '' }; }
}
