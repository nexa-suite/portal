import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { CatalogApiPort } from '../../../catalogcommercialpolicy/application/ports/catalog-api.port';
import { BuyerAccountApiPort } from '../../../customerbuyerrelationships/application/ports/buyer-account-api.port';
import { DeliveryTrackingApiPort } from '../../../fulfillmentdelivery/application/ports/delivery-tracking-api.port';
import { RECEIVABLES_PORT } from '../../../creditreceivables/application/receivables.port';
import { PurchaseRequestApiPort } from '../../../salescommitment/application/ports/purchase-request-api.port';
import { SalesOrderApiPort } from '../../../salescommitment/application/ports/sales-order-api.port';
import { PurchaseRequestCartPort } from '../../../salescommitment/application/ports/purchase-request-cart.port';
import { PORTAL_SECURITY_BOUNDARY } from '../../security/portal-security.boundary';
import { HomePageComponent } from './home-page.component';

describe('HomePageComponent', () => {
  let fixture: ComponentFixture<HomePageComponent>;
  let accountApi: { clientAccount: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    accountApi = { clientAccount: vi.fn(() => of({
      id: 'client-1',
      code: 'CLI-001',
      businessName: 'Buyer business',
      commercialName: 'Buyer business',
      countryCode: 'PE',
      taxType: 'RUC',
      taxValue: '20123456789',
      segment: 'STANDARD',
      contactPerson: 'Buyer',
      contactEmail: 'buyer@example.com',
      phone: '+51 999 999 999',
      deliveryProfile: 'COLD_CHAIN',
      paymentCondition: 'CREDIT',
      status: 'ACTIVE',
      buyerMembershipId: 'membership-1',
      version: 1,
    })) };

    await TestBed.configureTestingModule({
      imports: [HomePageComponent],
      providers: [
        provideTranslateService(),
        provideRouter([]),
        { provide: PORTAL_SECURITY_BOUNDARY, useValue: { identity: signal({ id: 'buyer-1', email: 'buyer@example.com', displayName: 'Buyer', roles: ['BUYER'], workspaceSlug: 'demo', clientAccountId: null }) } },
        { provide: PurchaseRequestCartPort, useValue: { items: signal([]), count: signal(0), subtotal: signal(0), setScope: () => undefined, add: () => undefined, remove: () => undefined, setQuantity: () => undefined, replace: () => undefined, clear: () => undefined } },
        { provide: CatalogApiPort, useValue: { list: () => of({ items: [], page: 0, size: 1, totalItems: 0, totalPages: 0, sort: { field: '', direction: '' } }) } },
        { provide: BuyerAccountApiPort, useValue: accountApi },
        { provide: DeliveryTrackingApiPort, useValue: { list: () => of({ items: [], page: 0, size: 100, total: 0 }) } },
        { provide: RECEIVABLES_PORT, useValue: { list: () => of({ items: [], page: 0, size: 25, total: 0 }) } },
        { provide: PurchaseRequestApiPort, useValue: { list: () => of({ items: [], page: 0, size: 50, total: 0 }) } },
        { provide: SalesOrderApiPort, useValue: { list: () => of({ items: [], page: 0, size: 50, total: 0 }) } },
      ],
    }).compileComponents();
  });

  function render(): void {
    fixture = TestBed.createComponent(HomePageComponent);
    fixture.detectChanges();
  }

  it('renders reusable buyer foundations', () => {
    render();
    expect(fixture.nativeElement.querySelector('.buyer-shell-band')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.flow-panel')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.no-client-state')).toBeNull();
  });

  it('keeps available API feeds visible when the Client Account lookup fails', () => {
    accountApi.clientAccount.mockReturnValue(throwError(() => new Error('API unavailable')));

    render();

    expect(fixture.nativeElement.querySelector('.buyer-shell-band')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.account-unavailable')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.no-client-state')).toBeNull();
    expect(fixture.nativeElement.querySelector('.partial-notice nexa-button')).toBeTruthy();
  });
});
