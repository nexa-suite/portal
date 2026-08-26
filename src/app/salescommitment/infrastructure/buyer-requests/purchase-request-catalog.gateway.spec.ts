import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { CatalogApiPort } from '../../../catalogcommercialpolicy/application/ports/catalog-api.port';
import { PurchaseRequestCatalogGateway } from './purchase-request-catalog.gateway';

describe('PurchaseRequestCatalogGateway', () => {
  it('maps catalog results into the purchase-request reference shape', () => {
    const catalog = { list: vi.fn(() => of({ items: [{ catalogItemId: 'cat-1', productId: 'p-1', sellableSkuId: 'sku-1', itemName: 'Queso', presentation: '500 g' }], page: 0, size: 20, totalItems: 1, totalPages: 1 })) };
    TestBed.configureTestingModule({ providers: [PurchaseRequestCatalogGateway, { provide: CatalogApiPort, useValue: catalog }] });

    TestBed.inject(PurchaseRequestCatalogGateway).search('queso').subscribe((page) => expect(page.items).toEqual([{ catalogItemId: 'cat-1', productId: 'p-1', sellableSkuId: 'sku-1', itemName: 'Queso', presentation: '500 g' }]));
    expect(catalog.list).toHaveBeenCalledWith(expect.objectContaining({ q: 'queso', size: 20 }));
  });
});
