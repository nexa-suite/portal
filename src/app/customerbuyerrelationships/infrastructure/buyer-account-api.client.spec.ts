import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PORTAL_RUNTIME_CONFIG } from '../../core/security/runtime-config';
import { BuyerAccountApiClient } from './buyer-account-api.client';

describe('BuyerAccountApiClient', () => {
  let client: BuyerAccountApiClient;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BuyerAccountApiClient,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PORTAL_RUNTIME_CONFIG, useValue: { apiBaseUrl: 'http://api.local', surface: 'PORTAL' } },
      ],
    });
    client = TestBed.inject(BuyerAccountApiClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('exposes the BC-02 account client', () => {
    expect(TestBed.inject(BuyerAccountApiClient)).toBeInstanceOf(BuyerAccountApiClient);
  });

  it('uses the Buyer-safe Peru reference contract', () => {
    client.reference('provinces', 'LIM').subscribe();
    const provinces = http.expectOne('http://api.local/api/v1/reference/departments/LIM/provinces');
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

});
