import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { CatalogApiPort } from '../../../catalogcommercialpolicy/application/ports/catalog-api.port';
import { PurchaseRequestCatalogPort } from '../../application/ports/purchase-request-catalog.port';
import { PurchaseRequestCatalogItem, PurchaseRequestCatalogPage } from '../../domain/buyer-requests/purchase-request-catalog.models';

/** ACL from the Catalog context into the Purchase Request workflow. */
@Injectable({ providedIn: 'root' })
export class PurchaseRequestCatalogGateway implements PurchaseRequestCatalogPort {
  private readonly catalog = inject(CatalogApiPort);

  search(query = ''): Observable<PurchaseRequestCatalogPage> {
    return this.catalog.list({
      q: query.trim(), brand: '', category: '', coldChain: '', page: 0, size: 20,
      sort: 'itemName', direction: 'asc',
    }).pipe(map((page) => ({
      page: page.page,
      size: page.size,
      totalItems: page.totalItems,
      totalPages: page.totalPages,
      items: page.items.map((item): PurchaseRequestCatalogItem => ({
        catalogItemId: item.catalogItemId,
        productId: item.productId,
        sellableSkuId: item.sellableSkuId,
        itemName: item.itemName,
        presentation: item.presentation,
      })),
    })));
  }
}
