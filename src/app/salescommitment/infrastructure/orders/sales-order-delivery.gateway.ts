import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { DeliveryTrackingApiPort } from '../../../fulfillmentdelivery/application/ports/delivery-tracking-api.port';
import { SalesOrderDeliveryPort } from '../../application/ports/sales-order-delivery.port';
import { SalesOrderDeliveryProjection } from '../../domain/orders/sales-order-delivery.models';

/** ACL exposing only the delivery projection needed by an order detail. */
@Injectable({ providedIn: 'root' })
export class SalesOrderDeliveryGateway implements SalesOrderDeliveryPort {
  private readonly delivery = inject(DeliveryTrackingApiPort);

  list(): Observable<readonly SalesOrderDeliveryProjection[]> {
    return this.delivery.list().pipe(map((page) => page.items.map((item) => ({
      id: item.id,
      salesOrderNumber: item.salesOrderNumber,
    }))));
  }
}
