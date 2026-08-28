import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { PORTAL_RUNTIME_CONFIG, PortalRuntimeConfig } from '../../../core/security/runtime-config';
import type { PurchaseRequestDraftView } from '../../domain/buyer-requests/purchase-request-draft.models';
import type { PurchaseRequest } from '../../domain/purchase-requests/purchase-request.models';
import { MockPurchaseRequestApiAdapter } from './mock-purchase-request-api.adapter';
import { MockPurchaseRequestDraftApiAdapter } from './mock-purchase-request-draft-api.adapter';

function config(): PortalRuntimeConfig {
  return {
    apiBaseUrl: '',
    signInPath: '',
    refreshPath: '',
    signOutPath: '',
    catalogPath: '',
    surface: 'PORTAL',
    dataMode: 'mock',
    tenantProfile: 'icisa',
  };
}

describe('Mock Sales Commitment adapters', () => {
  it('runs the canonical draft workflow with monotonic ETags and publishes the request projection', () => {
    TestBed.configureTestingModule({
      providers: [
        MockPurchaseRequestDraftApiAdapter,
        MockPurchaseRequestApiAdapter,
        { provide: PORTAL_RUNTIME_CONFIG, useValue: config() },
      ],
    });
    const drafts = TestBed.inject(MockPurchaseRequestDraftApiAdapter);
    const requests = TestBed.inject(MockPurchaseRequestApiAdapter);
    const versions: number[] = [];
    let draft = undefined as unknown as PurchaseRequestDraftView;

    drafts.create('client-icisa-001', '2026-09-10').subscribe((value) => { draft = value; versions.push(value.version); });
    drafts.replaceLines(draft.id, draft.etag, [
      { skuId: 'PROD-0001', quantity: 1, unit: 'unit', notes: '' },
      { skuId: 'PROD-0002', quantity: 1, unit: 'unit', notes: '' },
      { skuId: 'PROD-0003', quantity: 1, unit: 'unit', notes: '' },
    ]).subscribe((value) => { draft = value; versions.push(value.version); });
    drafts.setDestination(draft.id, draft.etag, 'address-icisa-001').subscribe((value) => { draft = value; versions.push(value.version); });
    drafts.previewRoute(draft.id, draft.etag).subscribe((value) => { draft = value; versions.push(value.version); });
    drafts.setPreferences(draft.id, draft.etag, 'CREDIT_LINE', '2026-09-10').subscribe((value) => { draft = value; versions.push(value.version); });
    drafts.submit(draft.id, draft.etag, 'mock-idempotency-001').subscribe((value) => { draft = value; versions.push(value.version); });

    let requestId: string | undefined;
    requests.get(draft.id).subscribe((request) => {
      requestId = request.id;
      expect(request).toMatchObject({ id: draft.id, status: 'SUBMITTED', version: draft.version, etag: draft.etag });
      expect(request.lines.map((line) => line.unitPriceAmount)).toEqual([17.3, 19.8, 86]);
    });
    requests.list('SUBMITTED').subscribe((page) => expect(page.items.some((item) => item.id === requestId)).toBe(true));

    expect(versions).toEqual([1, 2, 3, 4, 5, 6]);
    expect(draft).toMatchObject({ status: 'SUBMITTED', version: 6, etag: '"6"', routeProvider: 'LOCAL_ESTIMATE', paymentPreference: 'CREDIT_LINE' });
  });

  it('rejects a stale Purchase Request update through the existing 409-shaped error contract', () => {
    TestBed.configureTestingModule({
      providers: [MockPurchaseRequestApiAdapter, { provide: PORTAL_RUNTIME_CONFIG, useValue: config() }],
    });
    const requests = TestBed.inject(MockPurchaseRequestApiAdapter);
    let request = undefined as unknown as PurchaseRequest;
    let staleStatus: number | undefined;

    requests.create({
      priority: 'NORMAL',
      requestedDeliveryDate: '2026-09-10',
      deliveryProfileSnapshot: 'REFRIGERATED_STANDARD',
      paymentOption: 'CREDIT_LINE',
      comment: '',
      lines: [{ catalogItemId: 'PROD-0001', quantity: 1, unit: 'unit', notes: '' }],
    }).subscribe((value) => request = value);
    const staleRequest = request;
    requests.update(request.id, request, {
      priority: 'HIGH',
      requestedDeliveryDate: '2026-09-11',
      deliveryProfileSnapshot: 'REFRIGERATED_STANDARD',
      paymentOption: 'CREDIT_LINE',
      comment: 'Updated mock request',
    }).subscribe((value) => request = value);
    requests.update(request.id, staleRequest, {
      priority: 'URGENT',
      requestedDeliveryDate: '2026-09-12',
      deliveryProfileSnapshot: 'REFRIGERATED_STANDARD',
      paymentOption: 'CREDIT_LINE',
      comment: 'Stale update',
    }).subscribe({ error: (error: { status?: number }) => staleStatus = error.status });

    expect(request?.version).toBe(2);
    expect(staleStatus).toBe(409);
  });
});
