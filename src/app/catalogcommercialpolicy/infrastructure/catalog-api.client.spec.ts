import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PORTAL_RUNTIME_CONFIG } from '../../core/security/runtime-config';
import { DEFAULT_CATALOG_QUERY } from '../domain/catalog.models';
import { CatalogApiClient } from './catalog-api.client';

describe('CatalogApiClient', () => {
  let client: CatalogApiClient;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CatalogApiClient,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: PORTAL_RUNTIME_CONFIG,
          useValue: {
            apiBaseUrl: 'http://api.local',
            signInPath: '',
            refreshPath: '',
            signOutPath: '',
            catalogPath: '/api/v1/catalog-items',
            surface: 'PORTAL',
          },
        },
      ],
    });
    client = TestBed.inject(CatalogApiClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('maps effective price, promotion and coarse availability from the catalog contract', () => {
    client.list({ ...DEFAULT_CATALOG_QUERY, q: 'queso', brand: 'Agriform', category: 'Cheese' }).subscribe((page) => {
      expect(page.items[0]).toMatchObject({
        catalogItemId: 'CAT-0001',
        productFamilyCode: 'FAM-CAT-0001',
        productFamilyName: 'QUESO GRANA PADANO DOP',
        skuCode: 'PROD-0001',
        unitOfMeasure: 'UNIT',
        unitPrice: { amount: '17.30', currency: 'PEN' },
        basePrice: { amount: '20.00', currency: 'PEN' },
        effectivePrice: { amount: '17.30', currency: 'PEN' },
        discountAmount: { amount: '2.70', currency: 'PEN' },
        currency: 'PEN',
        availabilityStatus: 'OUT_OF_STOCK',
        promotionLabel: 'Buyer launch price',
      });
      expect(page.items[0].appliedPromotions).toEqual([{
        id: 'PROMO-1',
        name: 'Buyer launch price',
        discountType: 'FIXED_AMOUNT',
        discountAmount: '2.7',
      }]);
      expect(page.items[0].pricingAsOf).toBe('2026-08-02T12:30:00Z');
    });

    const request = http.expectOne((candidate) => candidate.url === 'http://api.local/api/v1/catalog-items');
    expect(request.request.params.get('q')).toBe('queso');
    expect(request.request.params.get('brand')).toBe('Agriform');
    expect(request.request.params.get('category')).toBe('Cheese');
    expect(request.request.withCredentials).toBe(true);
    request.flush({
      items: [{
        catalogItemId: 'CAT-0001',
        productId: 'PROD-0001',
        productFamilyId: 'FAMILY-0001',
        productFamilyCode: 'FAM-CAT-0001',
        productFamilyName: 'QUESO GRANA PADANO DOP',
        sellableSkuId: 'PROD-0001',
        skuCode: 'PROD-0001',
        itemName: 'Queso',
        brandName: 'Agriform',
        categoryName: 'Cheese',
        presentation: '150G',
        unitOfMeasure: 'UNIT',
        packagingType: 'BOX',
        netWeight: '1.5',
        grossWeight: '1.6',
        coldChainRequirement: 'REFRIGERATED',
        image: { url: '/catalog-items/queso.png', fileName: 'queso.png' },
        unitPrice: { amount: '17.30', currency: 'PEN' },
        basePrice: { amount: '20.00', currency: 'PEN' },
        effectivePrice: { amount: '17.30', currency: 'PEN' },
        discountAmount: { amount: '2.70', currency: 'PEN' },
        currency: 'PEN',
        appliedPromotions: [{
          id: 'PROMO-1',
          name: 'Buyer launch price',
          discountType: 'FIXED_AMOUNT',
          discountAmount: 2.7,
        }],
        pricingAsOf: '2026-08-02T12:30:00Z',
        availabilityStatus: 'OUT_OF_STOCK',
        nearExpiry: false,
        promotionLabel: 'Buyer launch price',
      }],
      page: 0,
      size: 20,
      totalItems: 1,
      totalPages: 1,
      sort: { field: 'itemName', direction: 'asc' },
    });
  });

  it('uses the existing catalog item detail route and maps the detail projection', () => {
    client.getById('CAT-0001').subscribe((item) => {
      expect(item.description).toBe('Buyer-safe description');
      expect(item.unitPrice).toEqual({ amount: '17.30', currency: 'PEN' });
      expect(item.basePrice).toEqual({ amount: '20.00', currency: 'PEN' });
      expect(item.effectivePrice).toEqual({ amount: '17.30', currency: 'PEN' });
      expect(item.discountAmount).toEqual({ amount: '2.70', currency: 'PEN' });
      expect(item.currency).toBe('PEN');
      expect(item.appliedPromotions).toEqual([{
        id: 'PROMO-2',
        name: 'Volume promotion',
        discountType: 'PERCENTAGE',
        discountAmount: '10',
      }]);
      expect(item.pricingAsOf).toBe('2026-08-02T12:30:00Z');
      expect(item.availabilityStatus).toBe('AVAILABLE');
      expect(item.promotionLabel).toBe('Volume promotion');
    });

    const request = http.expectOne('http://api.local/api/v1/catalog-items/CAT-0001');
    request.flush({
      catalogItemId: 'CAT-0001',
      productId: 'PROD-0001',
      itemName: 'Queso',
      brandName: 'Agriform',
      categoryName: 'Cheese',
      description: 'Buyer-safe description',
      presentation: '150G',
      coldChainRequirement: 'REFRIGERATED',
      image: null,
      unitPrice: { amount: '17.30', currency: 'PEN' },
      basePrice: { amount: '20.00', currency: 'PEN' },
      effectivePrice: { amount: '17.30', currency: 'PEN' },
      discountAmount: { amount: '2.70', currency: 'PEN' },
      currency: 'PEN',
      appliedPromotions: [{
        id: 'PROMO-2',
        name: 'Volume promotion',
        discountType: 'PERCENTAGE',
        discountAmount: 10,
      }],
      pricingAsOf: '2026-08-02T12:30:00Z',
      availabilityStatus: 'AVAILABLE',
      promotionLabel: 'Volume promotion',
    });
  });

  it('posts quantity pricing previews and maps unit and line totals', () => {
    client.previewPricing({ items: [{ productId: 'PRODUCT-1', quantity: 5 }] }).subscribe((preview) => {
      expect(preview.items[0]).toMatchObject({
        productId: 'PRODUCT-1',
        quantity: 5,
        baseUnitPrice: { amount: '390.00', currency: 'PEN' },
        effectiveUnitPrice: { amount: '351.00', currency: 'PEN' },
        lineBaseTotal: { amount: '1950.00', currency: 'PEN' },
        lineEffectiveTotal: { amount: '1755.00', currency: 'PEN' },
        discountAmount: { amount: '195.00', currency: 'PEN' },
        appliedPromotions: [{ name: '10% volume', discountType: 'PERCENTAGE' }],
      });
    });

    const request = http.expectOne('http://api.local/api/v1/catalog/pricing-preview');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ items: [{ productId: 'PRODUCT-1', quantity: 5 }] });
    expect(request.request.withCredentials).toBe(true);
    request.flush({ items: [{
      productId: 'PRODUCT-1', quantity: 5,
      baseUnitPrice: { amount: 390, currency: 'PEN' },
      effectiveUnitPrice: { amount: 351, currency: 'PEN' },
      lineBaseTotal: { amount: 1950, currency: 'PEN' },
      lineEffectiveTotal: { amount: 1755, currency: 'PEN' },
      discountAmount: { amount: 195, currency: 'PEN' }, currency: 'PEN',
      appliedPromotions: [{ id: 'promo-1', name: '10% volume', discountType: 'PERCENTAGE', discountAmount: '39.00' }],
      pricingAsOf: '2026-08-02T12:30:00Z',
    }] });
  });
});
