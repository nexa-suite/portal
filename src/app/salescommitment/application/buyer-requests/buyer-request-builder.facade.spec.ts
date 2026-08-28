import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BuyerRelationshipPort } from '../ports/buyer-relationship.port';
import { PurchaseRequestDraftApiPort } from '../ports/purchase-request-draft-api.port';
import type { PurchaseRequestCartItem } from '../../domain/buyer-requests/purchase-request-cart.models';
import type { PurchaseRequestDraftView } from '../../domain/buyer-requests/purchase-request-draft.models';
import { PurchaseRequestBuilderFacade } from './buyer-request-builder.facade';

const draft = (id: string, version: number): PurchaseRequestDraftView => ({
  id,
  clientAccountId: 'account-1',
  buyerMembershipId: 'membership-1',
  status: 'PRODUCTS_COMPLETE',
  version,
  requestedDeliveryDate: '2030-01-02',
  paymentPreference: null,
  creditResult: null,
  routeProvider: null,
  lines: [],
  destination: null,
  route: null,
  warehouseSelection: null,
  createdAt: '2030-01-01T00:00:00Z',
  updatedAt: '2030-01-01T00:00:00Z',
  submittedAt: null,
  etag: `"${version}"`,
});

describe('PurchaseRequestBuilderFacade', () => {
  const canonical = {
    create: vi.fn(() => of(draft('draft-1', 0))),
    replaceLines: vi.fn(() => of(draft('draft-1', 1))),
  };
  const item: PurchaseRequestCartItem = {
    catalogItemId: 'catalog-1',
    productId: 'product-1',
    sellableSkuId: 'sku-1',
    itemName: 'Frozen product',
    presentation: '500 g',
    unit: 'UNIT',
    quantity: 2,
    unitPriceAmount: 10,
    currency: 'PEN',
    imageUrl: null,
    notes: '',
  };

  beforeEach(() => {
    vi.resetAllMocks();
    canonical.create.mockReturnValue(of(draft('draft-1', 0)));
    canonical.replaceLines.mockReturnValue(of(draft('draft-1', 1)));
    TestBed.configureTestingModule({
      providers: [
        PurchaseRequestBuilderFacade,
        { provide: BuyerRelationshipPort, useValue: {} },
        { provide: PurchaseRequestDraftApiPort, useValue: canonical },
      ],
    });
  });

  it('links cart lines to a server draft before the builder advances', () => {
    const facade = TestBed.inject(PurchaseRequestBuilderFacade);
    let result: PurchaseRequestDraftView | undefined;

    facade.startDraftFromCart('account-1', '2030-01-02', [item]).subscribe((value) => { result = value; });

    expect(canonical.create).toHaveBeenCalledWith('account-1', '2030-01-02');
    expect(canonical.replaceLines).toHaveBeenCalledWith('draft-1', '"0"', [{
      skuId: 'sku-1',
      quantity: 2,
      unit: 'UNIT',
      notes: '',
    }]);
    expect(result?.id).toBe('draft-1');
    expect(facade.draft()?.etag).toBe('"1"');
  });
});
