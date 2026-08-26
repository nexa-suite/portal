import { Injectable, inject, signal } from '@angular/core';
import { SalesOrderLiveRefreshService } from '../../../core/change-feed/application/sales-order-live-refresh.service';
import { SalesOrderApiPort } from '../ports/sales-order-api.port';
import { SalesOrder, SalesOrderEvent, SalesOrderPage } from '../../domain/orders/sales-order.models';

type OrderState = 'idle' | 'loading' | 'success' | 'empty' | 'error';
function messageFor(error: unknown, fallback: string): string { return (error as { status?: unknown })?.status === 409 ? 'SALES_ORDER_STALE_RELOAD' : fallback; }

@Injectable({ providedIn: 'root' })
export class SalesOrderSelfServiceFacade {
  private readonly api = inject(SalesOrderApiPort);
  private readonly liveRefresh = inject(SalesOrderLiveRefreshService);
  readonly listState = signal<{ readonly status: OrderState; readonly page: SalesOrderPage | null; readonly message: string | null }>({ status: 'idle', page: null, message: null });
  readonly detailState = signal<{ readonly status: Exclude<OrderState, 'empty'>; readonly item: SalesOrder | null; readonly events: readonly SalesOrderEvent[]; readonly message: string | null }>({ status: 'idle', item: null, events: [], message: null });

  constructor() {
    this.liveRefresh.watch((salesOrderId) => {
      const current = this.detailState().item;
      if (current?.id === salesOrderId) this.loadDetail(salesOrderId);
      else this.loadList();
    });
  }

  loadList(): void {
    this.listState.update((state) => ({ ...state, status: 'loading', message: null }));
    this.api.list().subscribe({ next: (page) => this.listState.set({ status: page.items.length ? 'success' : 'empty', page, message: null }), error: () => this.listState.update((state) => ({ ...state, status: 'error', message: 'SALES_ORDERS_LOAD_FAILED' })) });
  }

  loadDetail(id: string): void {
    this.detailState.set({ status: 'loading', item: null, events: [], message: null });
    this.api.get(id).subscribe({
      next: (item) => {
        this.detailState.set({ status: 'success', item, events: [], message: null });
        this.api.events(id).subscribe({ next: (events) => this.detailState.update((state) => ({ ...state, events })), error: () => undefined });
      },
      error: (error: unknown) => this.detailState.set({ status: 'error', item: null, events: [], message: messageFor(error, 'SALES_ORDER_LOAD_FAILED') }),
    });
  }

  confirm(): void { this.action((order) => this.api.confirm(order), 'SALES_ORDER_CONFIRM_FAILED'); }
  reject(reason: string): void { this.action((order) => this.api.reject(order, reason), 'SALES_ORDER_REJECT_FAILED'); }
  cancel(): void { this.action((order) => this.api.cancel(order), 'SALES_ORDER_CANCEL_FAILED'); }
  downloadSummary(format: 'PDF' | 'CSV'): void {
    const order = this.detailState().item;
    if (!order) return;
    this.api.summary(order.id, format).subscribe({
      next: (response) => {
        if (!response.body) return;
        const disposition = response.contentDisposition ?? '';
        const match = /filename="?([^";]+)"?/i.exec(disposition);
        const fallback = `nexa-order-summary-${order.number || order.id}.${format.toLowerCase()}`;
        const filename = (match?.[1] ?? fallback).replace(/[\\/]/g, '-');
        const url = URL.createObjectURL(response.body);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        anchor.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.detailState.update((state) => ({ ...state, message: 'SALES_ORDER_SUMMARY_EXPORT_FAILED' })),
    });
  }
  reloadCurrent(): void { const id = this.detailState().item?.id; if (id) this.loadDetail(id); }

  private action(action: (order: SalesOrder) => ReturnType<SalesOrderApiPort['confirm']>, fallback: string): void {
    const order = this.detailState().item;
    if (!order || order.status !== 'PENDING') return;
    action(order).subscribe({ next: (item) => this.detailState.update((state) => ({ ...state, status: 'success', item, message: null })), error: (error: unknown) => this.detailState.update((state) => ({ ...state, message: messageFor(error, fallback) })) });
  }
}
