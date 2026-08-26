import { Observable } from 'rxjs';
import { SalesOrder, SalesOrderEvent, SalesOrderPage } from '../../domain/orders/sales-order.models';

export interface SalesOrderDownload {
  readonly body: Blob | null;
  readonly contentDisposition: string | null;
}

/** Application port for buyer Sales Order queries and lifecycle commands. */
export abstract class SalesOrderApiPort {
  abstract list(sort?: string): Observable<SalesOrderPage>;
  abstract get(id: string): Observable<SalesOrder>;
  abstract confirm(order: SalesOrder): Observable<SalesOrder>;
  abstract reject(order: SalesOrder, reason: string): Observable<SalesOrder>;
  abstract cancel(order: SalesOrder): Observable<SalesOrder>;
  abstract events(id: string): Observable<readonly SalesOrderEvent[]>;
  abstract summary(id: string, format: 'PDF' | 'CSV'): Observable<SalesOrderDownload>;
}
