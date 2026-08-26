import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { DeliveryTrackingApiPort } from '../../../fulfillmentdelivery/application/ports/delivery-tracking-api.port';
import { SalesOrderDeliveryGateway } from './sales-order-delivery.gateway';

describe('SalesOrderDeliveryGateway', () => {
  it('maps only the delivery link used by Sales Order detail', () => {
    const delivery = { list: vi.fn(() => of({ items: [{ id: 'delivery-1', salesOrderNumber: 'SO-1' }] })) };
    TestBed.configureTestingModule({ providers: [SalesOrderDeliveryGateway, { provide: DeliveryTrackingApiPort, useValue: delivery }] });

    TestBed.inject(SalesOrderDeliveryGateway).list().subscribe((items) => expect(items).toEqual([{ id: 'delivery-1', salesOrderNumber: 'SO-1' }]));
    expect(delivery.list).toHaveBeenCalledOnce();
  });
});
