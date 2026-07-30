import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { signal } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CatalogApiClient } from '../../../../catalog-management/infrastructure/catalog-api.client';
import { PurchaseRequestSelfServiceFacade } from '../../application/purchase-request-self-service.facade';
import { RequestBuilderPageComponent } from './request-builder-page.component';

describe('RequestBuilderPageComponent', () => {
  let fixture: ComponentFixture<RequestBuilderPageComponent>;
  const item = { id: 'pr-1', code: 'PR-0001', status: 'DRAFT' as const, priority: 'NORMAL' as const, requestedDeliveryDate: null, deliveryProfileSnapshot: null, paymentOption: 'CASH_ON_DELIVERY' as const, comment: null, reviewNote: null, lines: [], version: 0, etag: '"0"' };
  const facade = {
    detailState: signal({ status: 'success' as const, item, message: null }),
    loadOrCreateDraft: vi.fn(),
    addLine: vi.fn(),
    updateLine: vi.fn(),
    deleteLine: vi.fn(),
    save: vi.fn(),
    submit: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestBuilderPageComponent],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
        { provide: PurchaseRequestSelfServiceFacade, useValue: facade },
        { provide: CatalogApiClient, useValue: { list: vi.fn(), getById: vi.fn() } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(RequestBuilderPageComponent);
    fixture.detectChanges();
  });

  it('hydrates and keeps an empty persisted draft editable', () => {
    expect(facade.loadOrCreateDraft).toHaveBeenCalledWith(null);
    expect(fixture.nativeElement.querySelector('form')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('purchaseRequests.catalog.empty');
  });

  it('allows saving an empty draft without inventing a line', () => {
    fixture.componentInstance.saveDraft();
    expect(facade.save).toHaveBeenCalledWith(item, expect.objectContaining({ priority: 'NORMAL', requestedDeliveryDate: null }), expect.any(Function));
  });
});
