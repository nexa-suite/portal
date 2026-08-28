import { inject, Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { PORTAL_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import { SalesOrderApiPort, SalesOrderDownload } from '../../application/ports/sales-order-api.port';
import { SalesOrder, SalesOrderEvent, SalesOrderPage } from '../../domain/orders/sales-order.models';
import { MOCK_SALES_ORDER_FIXTURES } from './mock-sales-order.fixtures';

const DEMO_NOW = '2026-08-26T10:00:00Z';

/** BC-04 buyer-scoped order adapter for the local demo runtime. */
@Injectable({ providedIn: 'root' })
export class MockSalesOrderApiAdapter implements SalesOrderApiPort {
  private readonly config = inject(PORTAL_RUNTIME_CONFIG);
  private readonly seed = MOCK_SALES_ORDER_FIXTURES[this.config.tenantProfile];
  private readonly orders = new Map(this.seed.orders.map((item) => [item.id, item]));
  private readonly eventStore = new Map(this.seed.orders.map((item) => [item.id, this.seed.events.filter((event) => event.id.startsWith(item.id))]));

  list(_sort = 'createdAt,desc'): Observable<SalesOrderPage> { const items = [...this.orders.values()].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')); return of({ items, page: 0, size: 50, total: items.length }); }
  get(id: string): Observable<SalesOrder> { const value = this.orders.get(id); return value ? of(value) : throwError(() => new Error('MOCK_SALES_ORDER_NOT_FOUND')); }
  confirm(order: SalesOrder): Observable<SalesOrder> { return this.change(order, 'CONFIRMED', 'ORDER_CONFIRMED'); }
  reject(order: SalesOrder, reason: string): Observable<SalesOrder> { return this.change(order, 'REJECTED', 'ORDER_REJECTED', reason.trim() || 'Rejected by buyer.'); }
  cancel(order: SalesOrder): Observable<SalesOrder> { return this.change(order, 'CANCELLED', 'ORDER_CANCELLED'); }
  events(id: string): Observable<readonly SalesOrderEvent[]> { return this.eventStore.has(id) ? of(this.eventStore.get(id) ?? []) : throwError(() => new Error('MOCK_SALES_ORDER_NOT_FOUND')); }
  summary(id: string, format: 'PDF' | 'CSV'): Observable<SalesOrderDownload> { return this.orders.has(id) ? of({ body: new Blob([`Nexa demo sales order ${id}`], { type: format === 'PDF' ? 'application/pdf' : 'text/csv' }), contentDisposition: `attachment; filename="${id}.${format.toLowerCase()}"` }) : throwError(() => new Error('MOCK_SALES_ORDER_NOT_FOUND')); }

  private change(order: SalesOrder, status: SalesOrder['status'], eventType: string, detail?: string): Observable<SalesOrder> {
    const current = this.orders.get(order.id);
    if (!current) return throwError(() => new Error('MOCK_SALES_ORDER_NOT_FOUND'));
    if (current.version !== order.version) return throwError(() => Object.assign(new Error('MOCK_SALES_ORDER_CONCURRENCY_CONFLICT'), { status: 409 }));
    if (current.status !== 'PENDING') return throwError(() => new Error('MOCK_SALES_ORDER_NOT_ACTIONABLE'));
    const updated: SalesOrder = { ...current, status, rejectionReason: status === 'REJECTED' ? detail ?? null : null, version: current.version + 1, etag: `"${current.version + 1}"` };
    this.orders.set(order.id, updated); this.eventStore.set(order.id, [...(this.eventStore.get(order.id) ?? []), { id: `${order.id}-event-${current.version + 1}`, type: eventType, occurredAt: DEMO_NOW, detail: detail ?? `Order changed to ${status}.` }]); return of(updated);
  }
}
