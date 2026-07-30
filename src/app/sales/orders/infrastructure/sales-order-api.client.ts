import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { PORTAL_RUNTIME_CONFIG, portalApiUrl } from '../../../core/security/runtime-config';
import {
  salesOrderEtag,
  SalesOrder,
  SalesOrderEvent,
  SalesOrderPage,
  validSalesOrderSort,
} from '../domain/sales-order.models';

type RawRecord = Record<string, unknown>;
function record(value: unknown): RawRecord { return value !== null && typeof value === 'object' ? value as RawRecord : {}; }
function text(value: unknown): string { return typeof value === 'string' ? value.trim() : ''; }
function nullableText(value: unknown): string | null { const result = text(value); return result || null; }
function number(value: unknown): number { const result = typeof value === 'number' ? value : Number(value); return Number.isFinite(result) ? result : 0; }

function mapOrderLine(value: unknown): SalesOrder['lines'][number] {
  const raw = record(value);
  return {
    id: text(raw['id'] ?? raw['lineId']),
    catalogItemId: text(raw['catalogItemId']),
    itemName: text(raw['itemName']),
    presentation: text(raw['presentation']),
    quantity: number(raw['quantity']),
    unit: text(raw['unit']) || 'unit',
    unitPriceAmount: number(raw['unitPriceAmount'] ?? record(raw['unitPrice'])['amount']),
    currency: text(raw['currency'] ?? raw['unitPriceCurrency'] ?? record(raw['unitPrice'])['currency']),
    totalAmount: number(raw['totalAmount'] ?? raw['lineTotalAmount']),
  };
}

function mapOrder(value: unknown, etag?: string): SalesOrder {
  const raw = record(value);
  const version = number(raw['version']);
  return {
    id: text(raw['id']),
    number: text(raw['number'] ?? raw['orderNumber']),
    status: text(raw['status']).toUpperCase() as SalesOrder['status'],
    purchaseRequestId: text(raw['purchaseRequestId'] ?? record(raw['purchaseRequest'])['id']),
    purchaseRequestCode: nullableText(raw['purchaseRequestCode'] ?? record(raw['purchaseRequest'])['code']),
    clientAccountId: text(raw['clientAccountId'] ?? record(raw['client'])['id']),
    currency: text(raw['currency'] ?? raw['totalCurrency']),
    totalAmount: number(raw['totalAmount'] ?? raw['total']),
    createdAt: nullableText(raw['createdAt']),
    rejectionReason: nullableText(raw['rejectionReason'] ?? raw['rejectReason']),
    lines: Array.isArray(raw['lines']) ? raw['lines'].map(mapOrderLine) : [],
    version,
    etag: etag ?? `"${version}"`,
  };
}

function fromResponse(response: HttpResponse<unknown>): SalesOrder { return mapOrder(response.body, response.headers.get('ETag') ?? undefined); }

@Injectable({ providedIn: 'root' })
export class SalesOrderApiClient {
  private readonly http = inject(HttpClient);
  private readonly config = inject(PORTAL_RUNTIME_CONFIG);

  private api(path: string): string { return portalApiUrl(this.config, `/api/v1/sales-orders${path}`); }

  list(sort = 'createdAt,desc'): Observable<SalesOrderPage> {
    const params = new HttpParams().set('page', 0).set('size', 50).set('sort', validSalesOrderSort(sort));
    return this.http.get<RawRecord>(this.api(''), { params, withCredentials: true }).pipe(map((raw) => ({
      items: Array.isArray(raw['items']) ? raw['items'].map((item) => mapOrder(item)) : [],
      page: number(raw['page']),
      size: number(raw['size']) || 50,
      total: number(raw['total'] ?? raw['totalElements']),
    })));
  }

  get(id: string): Observable<SalesOrder> {
    return this.http.get<unknown>(this.api(`/${encodeURIComponent(id)}`), { observe: 'response', withCredentials: true }).pipe(map(fromResponse));
  }

  confirm(order: SalesOrder): Observable<SalesOrder> {
    return this.action(order, 'confirmations', {});
  }

  reject(order: SalesOrder, reason: string): Observable<SalesOrder> {
    return this.action(order, 'rejections', { reason });
  }

  cancel(order: SalesOrder): Observable<SalesOrder> {
    return this.action(order, 'cancellations', {});
  }

  events(id: string): Observable<readonly SalesOrderEvent[]> {
    return this.http.get<unknown>(this.api(`/${encodeURIComponent(id)}/events`), { withCredentials: true }).pipe(map((raw) => {
      const payload = record(raw);
      const values: readonly unknown[] = Array.isArray(raw) ? raw : Array.isArray(payload['items']) ? payload['items'] : [];
      return values.map((value): SalesOrderEvent => {
        const item = record(value);
        return { id: text(item['id']), type: text(item['type'] ?? item['eventType']), occurredAt: nullableText(item['occurredAt'] ?? item['createdAt']), detail: nullableText(item['detail'] ?? item['description']) };
      });
    }));
  }

  private action(order: SalesOrder, action: string, body: unknown): Observable<SalesOrder> {
    return this.http.post<unknown>(this.api(`/${encodeURIComponent(order.id)}/${action}`), body, {
      observe: 'response',
      withCredentials: true,
      headers: new HttpHeaders({ 'If-Match': salesOrderEtag(order) }),
    }).pipe(map(fromResponse));
  }
}
