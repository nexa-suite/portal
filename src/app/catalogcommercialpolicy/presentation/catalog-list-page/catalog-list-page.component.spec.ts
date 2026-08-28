import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { CatalogQueryService, CatalogListStatus } from '../../application/catalog-query.service';
import {
  CatalogItemSummary,
  CatalogPage,
} from '../../domain/catalog.models';
import { CatalogListPageComponent } from './catalog-list-page.component';
import { PortalCatalogCartFacade } from '../../../core/compositions/portal/catalog-cart.facade';

function catalogItem(): CatalogItemSummary {
  return {
    catalogItemId: 'CAT-0001',
    productId: 'PROD-0001',
    itemName: 'Queso buyer-safe',
    brandName: 'Agriform',
    categoryName: 'Cheese',
    presentation: '150G',
    coldChainRequirement: 'REFRIGERATED',
    image: null,
    unitPrice: { amount: '17.30', currency: 'PEN' },
    basePrice: { amount: '20.00', currency: 'PEN' },
    effectivePrice: { amount: '17.30', currency: 'PEN' },
    discountAmount: { amount: '2.70', currency: 'PEN' },
    currency: 'PEN',
    appliedPromotions: [{
      id: 'PROMO-1',
      name: 'Buyer launch price',
      discountType: 'FIXED_AMOUNT',
      discountAmount: '2.70',
    }],
    pricingAsOf: '2026-08-02T12:30:00Z',
    availabilityStatus: 'AVAILABLE',
    promotionLabel: 'Buyer launch price',
  };
}

function catalogPage(items: readonly CatalogItemSummary[]): CatalogPage {
  return {
    items,
    page: 0,
    size: 20,
    totalItems: items.length,
    totalPages: 1,
    sort: { field: 'itemName', direction: 'asc' },
  };
}

function mockCatalog(status: CatalogListStatus) {
  return {
    listStatus: signal(status),
    items: signal<readonly CatalogItemSummary[]>([]),
    page: signal<CatalogPage | null>(null),
    loadList: vi.fn(),
    retryList: vi.fn(),
  };
}

function mockCart() {
  return {
    count: signal(0),
    activate: vi.fn(),
    has: vi.fn(() => false),
    toggle: vi.fn(),
  };
}

describe('CatalogListPageComponent', () => {
  let fixture: ComponentFixture<CatalogListPageComponent>;

  async function render(status: CatalogListStatus) {
    const catalog = mockCatalog(status);
    const cart = mockCart();
    await TestBed.configureTestingModule({
      imports: [CatalogListPageComponent],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: of(convertToParamMap({})),
            snapshot: { queryParamMap: convertToParamMap({}) },
          },
        },
        { provide: CatalogQueryService, useValue: catalog },
        { provide: PortalCatalogCartFacade, useValue: cart },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CatalogListPageComponent);
    fixture.detectChanges();
    return catalog;
  }

  it('renders a loading state while the buyer catalog is loading', async () => {
    const catalog = await render('loading');

    expect(fixture.nativeElement.querySelector('.loading-state')).toBeTruthy();
    expect(catalog.loadList).toHaveBeenCalled();
  });

  it('renders an explicit empty state', async () => {
    await render('empty');

    expect(fixture.nativeElement.querySelector('.empty-state')).toBeTruthy();
  });

  it('renders a retryable error state', async () => {
    const catalog = await render('error');
    const retry = fixture.nativeElement.querySelector('.error-state button') as HTMLButtonElement;

    retry.click();

    expect(catalog.retryList).toHaveBeenCalledTimes(1);
  });

  it('renders server pricing and does not expose administration controls', async () => {
    const catalog = await render('success');
    catalog.items.set([catalogItem()]);
    catalog.page.set(catalogPage(catalog.items()));
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('PEN 20.00');
    expect(text).toContain('PEN 17.30');
    expect(text).toContain('PEN 2.70');
    expect(text).toContain('Buyer launch price');
    expect(fixture.nativeElement.querySelector('[routerlink*="admin"], [href*="admin"]')).toBeNull();
  });
});
