import { describe, expect, it } from 'vitest';
import {
  catalogAvailabilityFromValue,
  catalogItemsWithOutOfStockLast,
  catalogQueryFromParams,
  catalogQueryToParams,
  formatCatalogPrice,
  CatalogItemSummary,
} from './catalog.models';

function item(availabilityStatus: CatalogItemSummary['availabilityStatus'], catalogItemId: string): CatalogItemSummary {
  return {
    catalogItemId,
    productId: `PROD-${catalogItemId}`,
    itemName: catalogItemId,
    brandName: 'Brand',
    categoryName: 'Category',
    presentation: 'Unit',
    coldChainRequirement: 'REFRIGERATED',
    image: null,
    unitPrice: { amount: '17.30', currency: 'PEN' },
    basePrice: { amount: '20.00', currency: 'PEN' },
    effectivePrice: { amount: '17.30', currency: 'PEN' },
    discountAmount: { amount: '2.70', currency: 'PEN' },
    currency: 'PEN',
    appliedPromotions: [],
    pricingAsOf: '2026-08-02T12:30:00Z',
    availabilityStatus,
    promotionLabel: null,
  };
}

describe('catalog query model', () => {
  it('normalizes query params without losing pagination filters', () => {
    const query = catalogQueryFromParams(
      new URLSearchParams(
        'q=queso&brand=Agriform&category=Cheese&coldChain=REFRIGERATED&page=2&size=20',
      ),
    );
    expect(query).toMatchObject({
      q: 'queso',
      brand: 'Agriform',
      category: 'Cheese',
      coldChain: 'REFRIGERATED',
      page: 2,
      size: 20,
    });
    expect(catalogQueryToParams(query)).toMatchObject({
      q: 'queso',
      brand: 'Agriform',
      page: '2',
      size: '20',
    });
  });
});

describe('catalog buyer projections', () => {
  it('normalizes coarse availability and keeps unavailable products visible at the end', () => {
    expect(catalogAvailabilityFromValue('out-of-stock')).toBe('OUT_OF_STOCK');
    expect(catalogAvailabilityFromValue('not-a-status')).toBe('UNKNOWN');
    expect(catalogItemsWithOutOfStockLast([
      item('OUT_OF_STOCK', 'out'),
      item('AVAILABLE', 'available'),
      item('UNAVAILABLE', 'unavailable'),
      item('LOW', 'low'),
    ]).map(({ catalogItemId }) => catalogItemId)).toEqual(['available', 'low', 'out', 'unavailable']);
  });

  it('formats the server-authoritative effective unit price without exposing quantities', () => {
    expect(formatCatalogPrice({ amount: '17.3', currency: 'PEN' })).toBe('PEN 17.30');
    expect(formatCatalogPrice(null)).toBe('');
  });
});
