import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { CatalogQueryService, CatalogDetailStatus } from '../../application/catalog-query.service';
import { CatalogItemDetail } from '../../domain/catalog.models';
import { CatalogDetailPageComponent } from './catalog-detail-page.component';

function catalogItem(): CatalogItemDetail {
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
    description: 'Buyer-safe description',
  };
}

function mockCatalog(status: CatalogDetailStatus) {
  return {
    detailStatus: signal(status),
    detail: signal<CatalogItemDetail | null>(null),
    previewStatus: signal('idle'),
    pricingPreview: signal(null),
    loadDetail: vi.fn(),
    retryDetail: vi.fn(),
    previewPricing: vi.fn(),
  };
}

describe('CatalogDetailPageComponent', () => {
  let fixture: ComponentFixture<CatalogDetailPageComponent>;

  async function render(status: CatalogDetailStatus) {
    const catalog = mockCatalog(status);
    await TestBed.configureTestingModule({
      imports: [CatalogDetailPageComponent],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ catalogItemId: 'CAT-0001' })),
            queryParamMap: of(convertToParamMap({})),
            snapshot: {
              paramMap: convertToParamMap({ catalogItemId: 'CAT-0001' }),
              queryParamMap: convertToParamMap({}),
            },
          },
        },
        { provide: CatalogQueryService, useValue: catalog },
      ],
    }).compileComponents();
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', { catalog: {
      pricingDetails: 'Pricing details', basePrice: 'Base price', effectivePrice: 'Effective price',
      discountAmount: 'Discount', currency: 'Currency', appliedPromotions: 'Applied promotions',
      noPromotions: 'None', pricingAsOf: 'Pricing as of: {{value}}'
    }});
    translate.use('en');
    fixture = TestBed.createComponent(CatalogDetailPageComponent);
    fixture.detectChanges();
    return catalog;
  }

  it('renders a loading state while the buyer detail is loading', async () => {
    const catalog = await render('loading');

    expect(fixture.nativeElement.querySelector('.loading-state')).toBeTruthy();
    expect(catalog.loadDetail).toHaveBeenCalledWith('CAT-0001');
  });

  it('renders a retryable detail error state', async () => {
    const catalog = await render('error');
    const retry = fixture.nativeElement.querySelector('.error-state button') as HTMLButtonElement;

    retry.click();

    expect(catalog.retryDetail).toHaveBeenCalledTimes(1);
  });

  it('renders the buyer-safe pricing projection without administration controls', async () => {
    const catalog = await render('success');
    catalog.detail.set(catalogItem());
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('PEN 20.00');
    expect(text).toContain('PEN 17.30');
    expect(text).toContain('PEN 2.70');
    expect(text).toContain('Applied promotions');
    expect(text).toContain('Buyer launch price');
    expect(fixture.nativeElement.querySelector('[routerlink*="admin"], [href*="admin"]')).toBeNull();
  });
});
