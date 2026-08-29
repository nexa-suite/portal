import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { describe, expect, it, vi } from 'vitest';
import { PurchaseRequestSelfServiceFacade } from '../../../application/purchase-requests/purchase-request-self-service.facade';
import { MyRequestsPageComponent } from './my-requests-page.component';

describe('MyRequestsPageComponent', () => {
  let fixture: ComponentFixture<MyRequestsPageComponent>;
  const request = {
    id: 'PR-001',
    code: 'PR-0001',
    status: 'SUBMITTED' as const,
    priority: 'NORMAL' as const,
    requestedDeliveryDate: '2026-09-05',
    deliveryProfileSnapshot: null,
    paymentOption: null,
    comment: null,
    reviewNote: null,
    lines: [],
    lineCount: 3,
    version: 1,
  };

  it('shows summary line count without fabricating product details', async () => {
    const facade = {
      listState: signal({
        status: 'success' as const,
        page: { items: [request], page: 0, size: 50, total: 1 },
        message: null,
      }),
      loadList: vi.fn(),
      retryList: vi.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [MyRequestsPageComponent],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: PurchaseRequestSelfServiceFacade, useValue: facade },
      ],
    }).compileComponents();
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {
      purchaseRequests: {
        eyebrow: 'Requests',
        list: { title: 'My requests', subtitle: 'Requests', filter: 'Filter', allStatuses: 'All', datePending: 'Pending' },
        metrics: { title: 'Summary', open: 'Open', openHint: 'Open', approved: 'Approved', approvedHint: 'Approved', latest: 'Latest', noActivity: 'None' },
        card: { lines: 'Lines', lineSummary: '{{count}} line items included.', noSpecifications: 'No specifications' },
        actions: { newRequest: 'New request', open: 'Open', retry: 'Retry' },
        status: { SUBMITTED: 'Submitted' },
        priority: { NORMAL: 'Normal' },
        fields: { deliveryDate: 'Delivery date', payment: 'Payment' },
        states: { loading: 'Loading', errorTitle: 'Error', errorDescription: 'Error' },
      },
    });
    translate.use('en');
    fixture = TestBed.createComponent(MyRequestsPageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('3');
    expect(fixture.nativeElement.querySelector('.request-lines-summary')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.request-product-strip')).toBeNull();
  });
});
