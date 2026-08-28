import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PORTAL_SECURITY_BOUNDARY } from '../../../core/security/portal-security.boundary';
import { PurchaseRequestBuilderFacade } from '../../application/buyer-requests/buyer-request-builder.facade';
import { PurchaseRequestCartPort } from '../../application/ports/purchase-request-cart.port';
import {
  BUYER_REQUEST_BUILDER_STEPS,
  BuyerRequestBuilderPageComponent,
} from './buyer-request-builder-page.component';

describe('BuyerRequestBuilderPageComponent', () => {
  const facade = {
    addresses: signal<readonly never[]>([]),
    clientAccount: signal(null),
    departments: signal<readonly never[]>([]),
    provinces: signal<readonly never[]>([]),
    districts: signal<readonly never[]>([]),
    roadTypes: signal<readonly never[]>([]),
    previewState: signal({ status: 'idle' as const, snapshot: null, message: null }),
    busy: signal(false),
    message: signal<string | null>(null),
    loadInitial: vi.fn(() => of(undefined)),
    loadDraft: vi.fn(() => of(null)),
    loadProvinces: vi.fn(() => of([])),
    loadDistricts: vi.fn(() => of([])),
    preview: vi.fn(() => of(null)),
    create: vi.fn(() => of({ id: 'request-1' })),
  };
  const auth = {
    identity: signal({
      clientAccountId: 'account-1',
      displayName: 'Buyer',
      email: 'buyer@nexa.test',
    }),
  };
  const router = { navigate: vi.fn(() => Promise.resolve(true)) };
  const cart = {
    items: signal<readonly never[]>([]),
    count: signal(0),
    subtotal: signal(0),
    setScope: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
    setQuantity: vi.fn(),
    replace: vi.fn(),
    clear: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    facade.previewState.set({ status: 'idle', snapshot: null, message: null });
    facade.busy.set(false);
    facade.message.set(null);
    cart.items.set([]);
    cart.count.set(0);
    cart.subtotal.set(0);
    TestBed.configureTestingModule({
      imports: [BuyerRequestBuilderPageComponent],
      providers: [
        provideTranslateService(),
        { provide: PurchaseRequestBuilderFacade, useValue: facade },
        { provide: PORTAL_SECURITY_BOUNDARY, useValue: auth },
        { provide: PurchaseRequestCartPort, useValue: cart },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('keeps the four canonical step labels in order', () => {
    expect(BUYER_REQUEST_BUILDER_STEPS).toEqual([
      'buyer',
      'products',
      'delivery',
      'confirmation',
    ]);
  });

  it('navigates buyer context to products, delivery preview and confirmation', () => {
    const fixture = TestBed.createComponent(BuyerRequestBuilderPageComponent);
    const page = fixture.componentInstance;
    page.lines.set([
      {
        id: 'line-1',
        catalogItemId: 'catalog-1',
        skuId: 'sku-1',
        itemName: 'Ice cream',
        presentation: '500 g',
        quantity: 2,
        unit: 'unit',
        notes: '',
      },
    ]);
    page.next();
    expect(page.step()).toBe(2);

    page.next();
    expect(page.step()).toBe(3);

    page.form.patchValue({ addressId: 'address-1' });
    page.next();
    expect(facade.preview).toHaveBeenCalledOnce();
    expect(page.step()).toBe(4);
  });

  it('submits the real command from confirmation and navigates to the created request', () => {
    const fixture = TestBed.createComponent(BuyerRequestBuilderPageComponent);
    const page = fixture.componentInstance;
    page.lines.set([
      {
        id: 'line-1',
        catalogItemId: 'catalog-1',
        skuId: 'sku-1',
        itemName: 'Ice cream',
        presentation: '500 g',
        quantity: 2,
        unit: 'unit',
        notes: '',
      },
    ]);
    page.form.patchValue({ addressId: 'address-1' });
    page.step.set(4);

    page.submit();

    expect(facade.create).toHaveBeenCalledOnce();
    expect(facade.create).toHaveBeenCalledWith(
      expect.objectContaining({
        clientAccountId: 'account-1',
        addressId: 'address-1',
        lines: [
          expect.objectContaining({ catalogItemId: 'catalog-1', skuId: 'sku-1', quantity: 2 }),
        ],
      }),
    );
    expect(router.navigate).toHaveBeenCalledWith(['/portal/purchase-requests', 'request-1']);
  });
});
