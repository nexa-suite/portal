import '@angular/compiler';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PORTAL_RUNTIME_CONFIG } from '../../core/security/runtime-config';
import { PaymentsApiClient } from './payments-api.client';

describe('PaymentsApiClient', () => {
  let api: PaymentsApiClient;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PaymentsApiClient,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PORTAL_RUNTIME_CONFIG, useValue: { apiBaseUrl: 'http://api.local', surface: 'PORTAL', signInPath: '', refreshPath: '', signOutPath: '', catalogPath: '' } },
      ],
    });
    api = TestBed.inject(PaymentsApiClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('reports a bank transfer without inventing an attachment', () => {
    api.createBankTransferPayment('receivable-1', 'BT-123', undefined, '00000000-0000-4000-8000-000000000001').subscribe();
    const request = http.expectOne('http://api.local/api/v1/receivables/receivable-1/bank-transfer-payments');
    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.headers.get('Idempotency-Key')).toBe('00000000-0000-4000-8000-000000000001');
    expect(request.request.body).toEqual({ reference: 'BT-123' });
    request.flush({ id: 'payment-1' });
  });
});
