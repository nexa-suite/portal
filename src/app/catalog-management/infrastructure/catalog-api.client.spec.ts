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
        unitPrice: { amount: '17.30', currency: 'PEN' },
        availabilityStatus: 'OUT_OF_STOCK',
        promotionLabel: 'Buyer launch price',
      });
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
        itemName: 'Queso',
        brandName: 'Agriform',
        categoryName: 'Cheese',
        presentation: '150G',
        coldChainRequirement: 'REFRIGERATED',
        image: { url: '/catalog-items/queso.png', fileName: 'queso.png' },
        unitPrice: { amount: '17.30', currency: 'PEN' },
        availabilityStatus: 'OUT_OF_STOCK',
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
      availabilityStatus: 'AVAILABLE',
      promotionLabel: 'Volume promotion',
    });
  });
});
