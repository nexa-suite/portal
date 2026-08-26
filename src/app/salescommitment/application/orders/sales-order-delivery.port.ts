import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { SalesOrderDeliveryProjection } from '../../domain/orders/sales-order-delivery.models';

export interface SalesOrderDeliveryPort {
  list(): Observable<readonly SalesOrderDeliveryProjection[]>;
}

export const SALES_ORDER_DELIVERY_PORT = new InjectionToken<SalesOrderDeliveryPort>('SALES_ORDER_DELIVERY_PORT');
