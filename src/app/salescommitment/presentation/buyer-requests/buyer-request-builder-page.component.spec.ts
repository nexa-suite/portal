import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PORTAL_SECURITY_BOUNDARY } from '../../../core/security/portal-security.boundary';
import { PurchaseRequestBuilderFacade } from '../../application/buyer-requests/buyer-request-builder.facade';
import { PurchaseRequestCartPort } from '../../application/ports/purchase-request-cart.port';
import { PurchaseRequestDraftSessionPort } from '../../application/ports/purchase-request-draft-session.port';
import type { SalesCommitmentBuyerAccountReference } from '../../domain/buyer-requests/sales-commitment-buyer-reference.models';
import type { PurchaseRequestDraftView } from '../../domain/buyer-requests/purchase-request-draft.models';
import {
  BUYER_REQUEST_BUILDER_STEPS,
  BuyerRequestBuilderPageComponent,
  paymentOptionFromCondition,
} from './buyer-request-builder-page.component';

describe('BuyerRequestBuilderPageComponent', () => {
  const facade = {
    addresses: signal<readonly never[]>([]),
    clientAccount: signal<SalesCommitmentBuyerAccountReference | null>(null),
    departments: signal<readonly never[]>([]),
    provinces: signal<readonly never[]>([]),
    districts: signal<readonly never[]>([]),
    roadTypes: signal<readonly never[]>([]),
    previewState: signal({ status: 'idle' as const, snapshot: null, message: null }),
    draft: signal<PurchaseRequestDraftView | null>(null),
    busy: signal(false),
    message: signal<string | null>(null),
    loadInitial: vi.fn(() => of(undefined)),
    loadDraft: vi.fn(() => of(null)),
    startDraftFromCart: vi.fn(() => of(null)),
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
    facade.draft.set(null);
    facade.busy.set(false);
    facade.message.set(null);
    facade.clientAccount.set(null);
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
        { provide: PurchaseRequestDraftSessionPort, useValue: { read: vi.fn(() => null), write: vi.fn(), clear: vi.fn() } },
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

  it('normalizes server payment conditions to the canonical request options', () => {
    expect(paymentOptionFromCondition('credit_30')).toBe('CREDIT_LINE');
    expect(paymentOptionFromCondition('cash_on_delivery')).toBe('CASH_ON_DELIVERY');
    expect(paymentOptionFromCondition('BANK_TRANSFER')).toBe('BANK_TRANSFER');
    expect(paymentOptionFromCondition('unknown-condition')).toBeNull();
  });

  it('initializes a new request from the payment condition returned by the buyer account API', () => {
    facade.clientAccount.set({
      id: 'account-1',
      businessName: 'Buyer business',
      commercialName: 'Buyer business',
      taxType: 'RUC',
      taxValue: '20123456789',
      segment: 'STANDARD',
      paymentCondition: 'credit_30',
    });

    const fixture = TestBed.createComponent(BuyerRequestBuilderPageComponent);

    expect(fixture.componentInstance.form.controls.paymentOption.value).toBe('CREDIT_LINE');
  });

  it('does not fabricate a warehouse before the server calculates the route', () => {
    const fixture = TestBed.createComponent(BuyerRequestBuilderPageComponent);

    expect(fixture.componentInstance.warehouse()).toEqual({
      id: '',
      name: '',
      address: '',
      originLabel: '',
    });
    expect(fixture.componentInstance.routeDirectionsUrl()).toBe('');
  });

  it('uses the warehouse and route snapshots returned by the canonical draft', () => {
    facade.draft.set({
      id: 'draft-1',
      clientAccountId: 'account-1',
      buyerMembershipId: 'membership-1',
      status: 'READY_TO_SUBMIT',
      version: 4,
      requestedDeliveryDate: '2099-12-31',
      paymentPreference: 'BANK_TRANSFER',
      creditResult: 'NOT_APPLICABLE',
      routeProvider: 'LOCAL_ESTIMATE',
      lines: [],
      destination: null,
      route: { snapshot: JSON.stringify({ originLabel: 'Server route origin', previewUrl: 'https://maps.example/route' }) },
      warehouseSelection: {
        warehouseId: 'warehouse-1',
        snapshot: JSON.stringify({ name: 'Server Cold Hub', address: 'Server address 123' }),
      },
      createdAt: '2099-01-01T00:00:00Z',
      updatedAt: '2099-01-01T00:00:00Z',
      submittedAt: null,
      etag: '"4"',
    });
    const fixture = TestBed.createComponent(BuyerRequestBuilderPageComponent);

    expect(fixture.componentInstance.warehouse()).toEqual({
      id: 'warehouse-1',
      name: 'Server Cold Hub',
      address: 'Server address 123',
      originLabel: 'Server route origin',
    });
    expect(fixture.componentInstance.routePreviewUrl()).toBe('https://maps.example/route');
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
