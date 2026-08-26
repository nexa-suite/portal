import { Observable } from 'rxjs';
import {
  CatalogItemDetail,
  CatalogPage,
  CatalogPricingPreview,
  CatalogPricingPreviewRequest,
  CatalogQuery,
} from '../../domain/catalog.models';

/** Application port for the buyer-safe Catalog & Commercial Policy contract. */
export abstract class CatalogApiPort {
  abstract list(query: CatalogQuery): Observable<CatalogPage>;
  abstract getById(catalogItemId: string): Observable<CatalogItemDetail>;
  abstract previewPricing(request: CatalogPricingPreviewRequest): Observable<CatalogPricingPreview>;
}
