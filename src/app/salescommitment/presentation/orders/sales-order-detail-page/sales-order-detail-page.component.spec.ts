import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { Observable, of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';
import { SalesOrderSelfServiceFacade } from '../../../application/orders/sales-order-self-service.facade';
import { SalesOrderDeliveryPort } from '../../../application/ports/sales-order-delivery.port';
import { SalesOrder } from '../../../domain/orders/sales-order.models';
import { SalesOrderDetailPageComponent } from './sales-order-detail-page.component';

const order: SalesOrder = {
  id: 'SO-1',
  number: 'SO-0001',
  status: 'CONFIRMED',
  purchaseRequestId: null,
  purchaseRequestCode: null,
  clientAccountId: 'CLIENT-1',
  currency: 'PEN',
  totalAmount: 120,
  createdAt: '2026-08-29T00:00:00Z',
  rejectionReason: null,
  lines: [{ id: 'LINE-1', catalogItemId: 'CAT-1', itemName: 'Frozen item', presentation: '1 kg', quantity: 2, unit: 'unit', unitPriceAmount: 60, currency: 'PEN', totalAmount: 120 }],
  version: 1,
};

function setup(deliveryFactory: () => Observable<readonly { readonly id: string; readonly salesOrderNumber: string }[]>): {
  fixture: ComponentFixture<SalesOrderDetailPageComponent>;
  delivery: { list: ReturnType<typeof vi.fn> };
} {
  const facade = {
    detailState: signal({ status: 'success' as const, item: order, events: [], message: null }),
    loadDetail: vi.fn(),
    reloadCurrent: vi.fn(),
    confirm: vi.fn(),
    downloadSummary: vi.fn(),
  };
  const delivery = { list: vi.fn(deliveryFactory) };

  TestBed.configureTestingModule({
    imports: [SalesOrderDetailPageComponent],
    providers: [
      provideRouter([]),
      provideTranslateService(),
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ salesOrderId: 'SO-1' }) } } },
      { provide: SalesOrderSelfServiceFacade, useValue: facade },
      { provide: SalesOrderDeliveryPort, useValue: delivery },
    ],
  });

  const fixture = TestBed.createComponent(SalesOrderDetailPageComponent);
  fixture.detectChanges();
  return { fixture, delivery };
}

describe('SalesOrderDetailPageComponent', () => {
  it('keeps the order visible and retries delivery tracking after a source failure', () => {
    const deliveryFactory = vi.fn()
      .mockReturnValueOnce(throwError(() => new Error('offline')))
      .mockReturnValueOnce(of([{ id: 'DELIVERY-1', salesOrderNumber: 'SO-0001' }]));
    const { fixture, delivery } = setup(deliveryFactory);
    const component = fixture.componentInstance;

    expect(component.deliveryError()).toBe(true);
    expect(fixture.nativeElement.querySelector('.data-warning')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('SO-0001');

    component.retryDelivery();
    fixture.detectChanges();

    expect(component.deliveryError()).toBe(false);
    expect(delivery.list).toHaveBeenCalledTimes(2);
    expect(component.matchingDeliveryId()).toBe('DELIVERY-1');
    expect(fixture.nativeElement.querySelector('.flow-action')).toBeTruthy();
  });
});
