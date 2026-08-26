import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { PurchaseRequestCatalogPage } from '../../domain/buyer-requests/purchase-request-catalog.models';

export interface PurchaseRequestCatalogPort {
  search(query?: string): Observable<PurchaseRequestCatalogPage>;
}

export const PURCHASE_REQUEST_CATALOG_PORT = new InjectionToken<PurchaseRequestCatalogPort>('PURCHASE_REQUEST_CATALOG_PORT');
