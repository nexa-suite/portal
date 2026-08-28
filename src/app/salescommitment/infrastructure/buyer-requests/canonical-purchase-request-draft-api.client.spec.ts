import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PORTAL_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import { CanonicalPurchaseRequestDraftApiClient, PurchaseRequestDraftApiClient } from './canonical-purchase-request-draft-api.client';

describe('PurchaseRequestDraftApiClient', () => {
  let client: PurchaseRequestDraftApiClient;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PurchaseRequestDraftApiClient,
        CanonicalPurchaseRequestDraftApiClient,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PORTAL_RUNTIME_CONFIG, useValue: { apiBaseUrl: 'http://api.local', surface: 'PORTAL' } },
      ],
    });
    client = TestBed.inject(PurchaseRequestDraftApiClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('owns the buyer draft endpoint and preserves If-Match on mutations', () => {
    client.replaceLines('draft-1', '"2"', [{ skuId: 'sku-1', quantity: 2, unit: 'unit', notes: '' }]).subscribe();
    const request = http.expectOne('http://api.local/api/v1/buyer/purchase-request-drafts/draft-1/lines');
    expect(request.request.method).toBe('PUT');
    expect(request.request.headers.get('If-Match')).toBe('"2"');
    request.flush({ id: 'draft-1', status: 'DRAFT', version: 3, lines: [] }, { headers: { ETag: '"3"' } });
  });

  it('reads server review readiness and preserves the nested draft version as its concurrency token', () => {
    let result: { readyToSubmit: boolean; draft: { id: string; etag: string } } | undefined;

    client.review('draft-1').subscribe((review) => {
      result = review;
    });

    const request = http.expectOne('http://api.local/api/v1/buyer/purchase-request-drafts/draft-1/review');
    expect(request.request.method).toBe('GET');
    expect(request.request.withCredentials).toBe(true);
    request.flush({
      draft: { id: 'draft-1', status: 'READY_TO_SUBMIT', version: 4, lines: [] },
      productsComplete: true,
      destinationComplete: true,
      routeValidated: true,
      commercialReviewComplete: true,
      readyToSubmit: true,
      missing: [],
    });

    expect(result).toMatchObject({ readyToSubmit: true, draft: { id: 'draft-1', etag: '"4"' } });
  });

  it('keeps the previous draft client token as a compatibility alias', () => {
    expect(TestBed.inject(CanonicalPurchaseRequestDraftApiClient)).toBeInstanceOf(PurchaseRequestDraftApiClient);
  });
});
