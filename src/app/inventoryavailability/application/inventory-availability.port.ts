import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { InventoryAvailability } from '../domain/inventory-availability.model';

export interface InventoryAvailabilityPort {
  list(ids: readonly string[]): Observable<readonly InventoryAvailability[]>;
}

export const INVENTORY_AVAILABILITY_PORT = new InjectionToken<InventoryAvailabilityPort>('INVENTORY_AVAILABILITY_PORT');
