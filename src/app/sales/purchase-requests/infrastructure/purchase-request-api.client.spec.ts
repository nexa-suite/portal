import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { PORTAL_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import { PurchaseRequestApiClient } from './purchase-request-api.client';

describe('PurchaseRequestApiClient', () => {
  let client: PurchaseRequestApiClient;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [PurchaseRequestApiClient, provideHttpClient(), provideHttpClientTesting(), { provide: PORTAL_RUNTIME_CONFIG, useValue: { apiBaseUrl: 'http://api.local', surface: 'PORTAL', signInPath: '', refreshPath: '', signOutPath: '', catalogPath: '' } }] });
    client = TestBed.inject(PurchaseRequestApiClient); http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('creates a request with line set and no client account selector', () => {
    const command = { priority: 'NORMAL', requestedDeliveryDate: null, deliveryProfileSnapshot: '', paymentOption: 'cash_on_delivery', comment: '', lines: [{ catalogItemId: 'CAT-001', quantity: 2, unit: 'unit', notes: '' }] };
    client.create(command).subscribe();
    const request = http.expectOne('http://api.local/api/v1/purchase-requests');
    expect(request.request.method).toBe('POST'); expect(request.request.withCredentials).toBe(true); expect(request.request.body).toEqual(command); request.flush({});
  });

  it('sends If-Match and idempotency key on submission', () => {
    client.submit('PR-001', 5, 'portal-PR-001-5').subscribe();
    const request = http.expectOne('http://api.local/api/v1/purchase-requests/PR-001/submissions');
    expect(request.request.headers.get('If-Match')).toBe('"5"'); expect(request.request.headers.get('Idempotency-Key')).toBe('portal-PR-001-5'); request.flush({});
  });
});
