import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PurchaseRequestApiPort } from '../ports/purchase-request-api.port';
import { PurchaseRequestSelfServiceFacade } from './purchase-request-self-service.facade';
import { PurchaseRequestLiveRefreshService } from '../../../core/change-feed/application/purchase-request-live-refresh.service';

describe('PurchaseRequestSelfServiceFacade', () => {
  const item = { id: 'PR-1', code: 'PR-0001', status: 'DRAFT' as const, priority: 'NORMAL' as const, requestedDeliveryDate: null, deliveryProfileSnapshot: null, paymentOption: null, comment: null, reviewNote: null, lines: [], version: 0 };
  beforeEach(() => TestBed.resetTestingModule());
  it('loads own requests, creates draft and submits with generated key', () => {
    const api = { list: vi.fn(() => of({ items: [item], page: 0, size: 50, total: 1 })), create: vi.fn(() => of(item)), submit: vi.fn(() => of({ ...item, status: 'SUBMITTED' as const })), cancel: vi.fn(() => of({ ...item, status: 'CANCELLED' as const })) };
    TestBed.configureTestingModule({ providers: [PurchaseRequestSelfServiceFacade, { provide: PurchaseRequestApiPort, useValue: api }, { provide: PurchaseRequestLiveRefreshService, useValue: { watch: vi.fn(() => () => undefined) } }] }); const facade = TestBed.inject(PurchaseRequestSelfServiceFacade); facade.loadList(); expect(facade.listState().status).toBe('success'); facade.create({ priority: 'NORMAL', requestedDeliveryDate: null, deliveryProfileSnapshot: '', paymentOption: 'CASH_ON_DELIVERY', comment: '', lines: [] }, () => undefined); facade.submit(item, () => undefined); expect(api.submit).toHaveBeenCalledWith(item, 'portal-PR-1-0');
  });
  it('keeps empty and error states explicit', () => {
    const api = { list: vi.fn(() => of({ items: [], page: 0, size: 50, total: 0 })), get: vi.fn(() => throwError(() => new Error('offline'))) };
    TestBed.configureTestingModule({ providers: [PurchaseRequestSelfServiceFacade, { provide: PurchaseRequestApiPort, useValue: api }, { provide: PurchaseRequestLiveRefreshService, useValue: { watch: vi.fn(() => () => undefined) } }] }); const facade = TestBed.inject(PurchaseRequestSelfServiceFacade); facade.loadList(); expect(facade.listState().status).toBe('empty'); facade.loadDetail('PR-1'); expect(facade.detailState().status).toBe('error');
  });
});
