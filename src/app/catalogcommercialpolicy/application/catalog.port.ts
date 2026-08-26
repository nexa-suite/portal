import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  CatalogItemDetail,
  CatalogPage,
  CatalogPricingPreview,
  CatalogPricingPreviewRequest,
  CatalogQuery,
} from '../domain/catalog.models';

export interface CatalogPort {
  list(query: CatalogQuery): Observable<CatalogPage>;
  getById(catalogItemId: string): Observable<CatalogItemDetail>;
  previewPricing(request: CatalogPricingPreviewRequest): Observable<CatalogPricingPreview>;
}

export const CATALOG_PORT = new InjectionToken<CatalogPort>('CATALOG_PORT');
