import { inject, Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';

import { PORTAL_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import { CatalogApiPort } from '../../application/ports/catalog-api.port';
import {
  CatalogItemDetail,
  CatalogPage,
  CatalogPricingPreview,
  CatalogPricingPreviewItem,
  CatalogPricingPreviewRequest,
  CatalogQuery,
} from '../../domain/catalog.models';
import { mockCatalogFixtures, MockCatalogFixture } from './mock-catalog.fixtures';

@Injectable({ providedIn: 'root' })
export class MockCatalogApiAdapter implements CatalogApiPort {
  private readonly config = inject(PORTAL_RUNTIME_CONFIG);
  private readonly fixtures = mockCatalogFixtures(this.config.tenantProfile);

  list(query: CatalogQuery): Observable<CatalogPage> {
    const filtered = this.fixtures
      .filter(({ item }) => this.matches(item, query))
      .sort((left, right) => this.compare(left.item, right.item, query));
    const size = Number.isInteger(query.size) && query.size > 0 ? query.size : 20;
    const page = Number.isInteger(query.page) && query.page >= 0 ? query.page : 0;
    const start = page * size;
    return of({
      items: filtered.slice(start, start + size).map(({ item }) => item),
      page,
      size,
      totalItems: filtered.length,
      totalPages: Math.ceil(filtered.length / size),
      sort: { field: query.sort, direction: query.direction },
    });
  }

  getById(catalogItemId: string): Observable<CatalogItemDetail> {
    const fixture = this.fixtures.find(({ item }) => item.catalogItemId === catalogItemId);
    if (!fixture) return throwError(() => new Error(`Mock catalog item not found: ${catalogItemId}`));
    return of({ ...fixture.item, description: fixture.description });
  }

  previewPricing(request: CatalogPricingPreviewRequest): Observable<CatalogPricingPreview> {
    try {
      const items = request.items.map((requested) => this.previewItem(requested.productId, requested.quantity));
      return of({ items });
    } catch (error: unknown) {
      return throwError(() => error);
    }
  }

  private previewItem(productId: string, quantity: number): CatalogPricingPreviewItem {
    const fixture = this.fixtures.find(({ item }) => item.productId === productId);
    if (!fixture) throw new Error(`Mock catalog product not found: ${productId}`);
    if (!Number.isFinite(quantity) || quantity <= 0) throw new Error('Mock catalog quantity must be positive');

    const { item } = fixture;
    const baseUnitPrice = item.basePrice;
    const effectiveUnitPrice = item.effectivePrice;
    const lineBaseTotal = multiply(baseUnitPrice, quantity);
    const lineEffectiveTotal = multiply(effectiveUnitPrice, quantity);
    const discountAmount = baseUnitPrice && effectiveUnitPrice
      ? { amount: (Number(baseUnitPrice.amount) - Number(effectiveUnitPrice.amount)) * quantity, currency: item.currency }
      : null;
    return {
      productId,
      quantity,
      baseUnitPrice,
      effectiveUnitPrice,
      lineBaseTotal,
      lineEffectiveTotal,
      basePrice: baseUnitPrice,
      effectivePrice: effectiveUnitPrice,
      discountAmount: discountAmount ? { ...discountAmount, amount: discountAmount.amount.toFixed(2) } : null,
      currency: item.currency,
      appliedPromotions: item.appliedPromotions,
      pricingAsOf: item.pricingAsOf,
    };
  }

  private matches(item: MockCatalogFixture['item'], query: CatalogQuery): boolean {
    const search = query.q.trim().toLowerCase();
    const matchesSearch = !search || [item.itemName, item.brandName, item.categoryName, item.productId]
      .some((value) => value.toLowerCase().includes(search));
    return matchesSearch
      && (!query.brand || item.brandName.toLowerCase() === query.brand.trim().toLowerCase())
      && (!query.category || item.categoryName.toLowerCase() === query.category.trim().toLowerCase())
      && (!query.coldChain || item.coldChainRequirement === query.coldChain);
  }

  private compare(
    left: MockCatalogFixture['item'],
    right: MockCatalogFixture['item'],
    query: CatalogQuery,
  ): number {
    const value = (item: MockCatalogFixture['item']): string => {
      if (query.sort === 'brandName') return item.brandName;
      if (query.sort === 'categoryName') return item.categoryName;
      return item.itemName;
    };
    const result = value(left).localeCompare(value(right), 'en', { sensitivity: 'base' });
    return query.direction === 'desc' ? -result : result;
  }
}

function multiply(price: { readonly amount: string; readonly currency: string } | null, quantity: number) {
  return price ? { amount: (Number(price.amount) * quantity).toFixed(2), currency: price.currency } : null;
}
