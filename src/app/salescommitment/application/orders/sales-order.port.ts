import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { SalesOrder, SalesOrderEvent, SalesOrderPage } from '../../domain/orders/sales-order.models';

export interface SalesOrderSummaryDownload {
  readonly body: Blob | null;
  readonly contentDisposition: string | null;
}

export interface SalesOrderPort {
  list(sort?: string): Observable<SalesOrderPage>;
  get(id: string): Observable<SalesOrder>;
  confirm(order: SalesOrder): Observable<SalesOrder>;
  reject(order: SalesOrder, reason: string): Observable<SalesOrder>;
  cancel(order: SalesOrder): Observable<SalesOrder>;
  events(id: string): Observable<readonly SalesOrderEvent[]>;
  summary(id: string, format: 'PDF' | 'CSV'): Observable<SalesOrderSummaryDownload>;
}

export const SALES_ORDER_PORT = new InjectionToken<SalesOrderPort>('SALES_ORDER_PORT');
