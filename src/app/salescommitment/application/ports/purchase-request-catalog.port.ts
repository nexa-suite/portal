import { Observable } from 'rxjs';
import { PurchaseRequestCatalogPage } from '../../domain/buyer-requests/purchase-request-catalog.models';

/** Anti-corruption port from Catalog & Commercial Policy into Sales Commitment. */
export abstract class PurchaseRequestCatalogPort {
  abstract search(query?: string): Observable<PurchaseRequestCatalogPage>;
}
