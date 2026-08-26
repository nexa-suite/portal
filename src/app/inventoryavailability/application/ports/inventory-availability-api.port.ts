import { Observable } from 'rxjs';
import { InventoryAvailability } from '../../domain/inventory-availability.model';

/** Application port for buyer-safe inventory availability projections. */
export abstract class InventoryAvailabilityApiPort {
  abstract list(ids: readonly string[]): Observable<readonly InventoryAvailability[]>;
}
