import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PORTAL_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import { SalesOrderApiClient } from './sales-order-api.client';

describe('SalesOrderApiClient', () => {
  let client: SalesOrderApiClient;
  let http: HttpTestingController;
  const order = { id: 'so-1', number: 'SO-2026-000001', status: 'PENDING', purchaseRequestId: 'pr-1', clientAccountId: 'client-1', currency: 'PEN', totalAmount: 100, version: 3, lines: [] };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [SalesOrderApiClient, provideHttpClient(), provideHttpClientTesting(), { provide: PORTAL_RUNTIME_CONFIG, useValue: { apiBaseUrl: 'http://api.local', signInPath: '', refreshPath: '', signOutPath: '', catalogPath: '', surface: 'PORTAL' } }] });
    client = TestBed.inject(SalesOrderApiClient); http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('uses the buyer Sales Orders collection and validated default sort', () => {
    client.list('unsupported,sort').subscribe();
    const request = http.expectOne((candidate) => candidate.url === 'http://api.local/api/v1/sales-orders');
    expect(request.request.params.get('sort')).toBe('createdAt,desc');
    request.flush({ items: [order], page: 0, size: 50, total: 1 });
  });

  it('sends If-Match and the required rejection reason', () => {
    client.reject({ ...order, etag: '"3"' } as never, 'Buyer declined the commercial terms').subscribe();
    const request = http.expectOne('http://api.local/api/v1/sales-orders/so-1/rejections');
    expect(request.request.headers.get('If-Match')).toBe('"3"');
    expect(request.request.body).toEqual({ reason: 'Buyer declined the commercial terms' });
    request.flush(order, { headers: { ETag: '"4"' } });
  });

  it('requests the buyer-safe PDF/CSV summary endpoint', () => {
    client.summary('so-1', 'PDF').subscribe();
    const request = http.expectOne('http://api.local/api/v1/sales-orders/so-1/summary?format=PDF');
    expect(request.request.method).toBe('GET');
    expect(request.request.responseType).toBe('blob');
    request.flush(new Blob(['summary'], { type: 'application/pdf' }), { headers: { 'Content-Disposition': 'attachment; filename="nexa-order-summary-SO-1.pdf"' } });
  });
});
