import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PORTAL_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import { BuyerRequestCommand } from '../domain/buyer-request.models';
import { BuyerRequestApiClient } from './buyer-request-api.client';

describe('BuyerRequestApiClient', () => {
  let client: BuyerRequestApiClient;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BuyerRequestApiClient,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PORTAL_RUNTIME_CONFIG, useValue: { apiBaseUrl: 'http://api.local', surface: 'PORTAL' } },
      ],
    });
    client = TestBed.inject(BuyerRequestApiClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('uses the Buyer warehouse and Peru reference contracts', () => {
    client.warehouses().subscribe();
    const warehouses = http.expectOne('http://api.local/api/v1/buyer/warehouses');
    expect(warehouses.request.method).toBe('GET');
    warehouses.flush([{ id: 'wh-1', code: 'LIM-01', name: 'Cold Hub', address: 'Lima', serviceable: true, version: 2 }]);

    client.reference('provinces', 'LIM').subscribe();
    const provinces = http.expectOne('http://api.local/api/v1/reference/provinces?parentCode=LIM');
    expect(provinces.request.method).toBe('GET');
    provinces.flush([{ id: 1, code: 'LIM-01', label: 'Lima', parentCode: 'LIM', active: true }]);
  });

  it('resolves the Buyer client account through the safe self-service contract', () => {
    client.clientAccount().subscribe((account) => expect(account.id).toBe('client-1'));
    const request = http.expectOne('http://api.local/api/v1/client-accounts/me');
    expect(request.request.method).toBe('GET');
    request.flush({ id: 'client-1', code: 'CLI-001', businessName: 'ICISA', status: 'ACTIVE', version: 3 });
  });

  it('sends a real saved-address request with an If-Match precondition', () => {
    client.setDefaultAddress('client-1', 'address-1', '"3"').subscribe();
    const request = http.expectOne('http://api.local/api/v1/client-accounts/client-1/addresses/address-1/default');
    expect(request.request.method).toBe('PUT');
    expect(request.request.headers.get('If-Match')).toBe('"3"');
    request.flush({ id: 'address-1', clientAccountId: 'client-1', label: 'Principal', line: 'Av. Lima 1', countryCode: 'PE', departmentCode: 'LIM', provinceCode: 'LIM-01', districtCode: 'LIM-0101', defaultAddress: true, active: true, version: 4 }, { headers: { ETag: '"4"' } });
  });

  it('posts the buyer builder command without changing the API contract', () => {
    const command: BuyerRequestCommand = {
      clientAccountId: 'client-1',
      addressId: 'address-1',
      manualAddress: null,
      requestedDeliveryDate: '2030-01-10',
      deliveryNotes: 'Gate 2',
      warehouseId: 'warehouse-1',
      paymentOption: 'CREDIT_LINE',
      comments: 'Urgent cold-chain delivery',
      lines: [{ catalogItemId: 'catalog-1', quantity: 2, unit: 'unit', notes: '' }],
    };
    client.create(command).subscribe();
    const request = http.expectOne('http://api.local/api/v1/buyer-requests');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(command);
    request.flush({ id: 'br-1', code: 'BR-0001', status: 'SUBMITTED', clientAccountId: 'client-1', lines: [], version: 0 });
  });
});
