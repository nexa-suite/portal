import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { PORTAL_RUNTIME_CONFIG, portalApiUrl } from '../../../core/security/runtime-config';
import { PurchaseRequestApiPort } from '../../application/ports/purchase-request-api.port';
import {
  etagFor,
  PurchaseRequest,
  PurchaseRequestDetailsCommand,
  PurchaseRequestDraftCommand,
  PurchaseRequestLine,
  PurchaseRequestPage,
  validPurchaseRequestSort,
} from '../../domain/purchase-requests/purchase-request.models';

type RawRecord = Record<string, unknown>;

function record(value: unknown): RawRecord {
  return value !== null && typeof value === 'object' ? (value as RawRecord) : {};
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function nullableText(value: unknown): string | null {
  const result = text(value);
  return result || null;
}

function number(value: unknown, fallback = 0): number {
  const result = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(result) ? result : fallback;
}

function line(rawValue: unknown): PurchaseRequestLine {
  const raw = record(rawValue);
  return {
    id: text(raw['id'] ?? raw['lineId']),
    catalogItemId: text(raw['catalogItemId']),
    itemName: text(raw['itemName']),
    presentation: text(raw['presentation']),
    quantity: number(raw['quantity']),
    unit: text(raw['unit']) || 'unit',
    unitPriceAmount: number(raw['unitPriceAmount'] ?? record(raw['unitPrice'])['amount']),
    unitPriceCurrency: text(raw['unitPriceCurrency'] ?? record(raw['unitPrice'])['currency']),
    notes: nullableText(raw['notes']),
  };
}

function purchaseRequest(rawValue: unknown, etag?: string): PurchaseRequest {
  const raw = record(rawValue);
  const version = number(raw['version']);
  const priority = text(raw['priority']).toUpperCase();
  const payment = text(raw['paymentOption']).toUpperCase();
  return {
    id: text(raw['id']),
    code: text(raw['code']),
    status: text(raw['status']).toUpperCase() as PurchaseRequest['status'],
    priority: (priority === 'HIGH' || priority === 'URGENT' ? priority : 'NORMAL') as PurchaseRequest['priority'],
    requestedDeliveryDate: nullableText(raw['requestedDeliveryDate']),
    deliveryProfileSnapshot: nullableText(raw['deliveryProfileSnapshot']),
    paymentOption: ['CREDIT_LINE', 'BANK_TRANSFER', 'CARD_STRIPE', 'CASH', 'CASH_ON_DELIVERY'].includes(payment)
      ? (payment as PurchaseRequest['paymentOption'])
      : null,
    comment: nullableText(raw['comment']),
    reviewNote: nullableText(raw['reviewNote']),
    lines: Array.isArray(raw['lines']) ? raw['lines'].map(line) : [],
    version,
    etag: etag ?? `"${version}"`,
  };
}

function fromResponse(response: HttpResponse<unknown>): PurchaseRequest {
  return purchaseRequest(response.body, response.headers.get('ETag') ?? undefined);
}

@Injectable({ providedIn: 'root' })
export class PurchaseRequestApiClient implements PurchaseRequestApiPort {
  private readonly http = inject(HttpClient);
  private readonly config = inject(PORTAL_RUNTIME_CONFIG);

  private api(path: string): string {
    return portalApiUrl(this.config, `/api/v1/purchase-requests${path}`);
  }

  list(status = '', sort: string = 'createdAt,desc'): Observable<PurchaseRequestPage> {
    let params = new HttpParams()
      .set('page', 0)
      .set('size', 50)
      .set('sort', validPurchaseRequestSort(sort));
    if (status) params = params.set('status', status);
    return this.http.get<RawRecord>(this.api(''), { params, withCredentials: true }).pipe(
      map((raw) => ({
        items: Array.isArray(raw['items']) ? raw['items'].map((item) => purchaseRequest(item)) : [],
        page: number(raw['page']),
        size: number(raw['size'], 50),
        total: number(raw['total'] ?? raw['totalElements']),
      })),
    );
  }

  get(id: string): Observable<PurchaseRequest> {
    return this.http.get<unknown>(this.api(`/${encodeURIComponent(id)}`), {
      observe: 'response',
      withCredentials: true,
    }).pipe(map(fromResponse));
  }

  create(command: PurchaseRequestDraftCommand): Observable<PurchaseRequest> {
    return this.http.post<unknown>(this.api(''), command, {
      observe: 'response',
      withCredentials: true,
    }).pipe(map(fromResponse));
  }

  update(id: string, request: PurchaseRequest, command: PurchaseRequestDetailsCommand): Observable<PurchaseRequest> {
    return this.http.patch<unknown>(this.api(`/${encodeURIComponent(id)}`), command, {
      observe: 'response',
      withCredentials: true,
      headers: this.ifMatch(etagFor(request)),
    }).pipe(map(fromResponse));
  }

  addLine(id: string, request: PurchaseRequest, lineCommand: { readonly catalogItemId: string; readonly quantity: number; readonly unit: string; readonly notes: string }): Observable<PurchaseRequest> {
    return this.http.post<unknown>(this.api(`/${encodeURIComponent(id)}/lines`), lineCommand, {
      observe: 'response',
      withCredentials: true,
      headers: this.ifMatch(etagFor(request)),
    }).pipe(map(fromResponse));
  }

  updateLine(id: string, request: PurchaseRequest, lineId: string, lineCommand: { readonly quantity: number; readonly notes: string }): Observable<PurchaseRequest> {
    return this.http.patch<unknown>(this.api(`/${encodeURIComponent(id)}/lines/${encodeURIComponent(lineId)}`), lineCommand, {
      observe: 'response',
      withCredentials: true,
      headers: this.ifMatch(etagFor(request)),
    }).pipe(map(fromResponse));
  }

  deleteLine(id: string, request: PurchaseRequest, lineId: string): Observable<PurchaseRequest> {
    return this.http.delete<unknown>(this.api(`/${encodeURIComponent(id)}/lines/${encodeURIComponent(lineId)}`), {
      observe: 'response',
      withCredentials: true,
      headers: this.ifMatch(etagFor(request)),
    }).pipe(map(fromResponse));
  }

  submit(request: PurchaseRequest, idempotencyKey: string): Observable<PurchaseRequest> {
    return this.http.post<unknown>(this.api(`/${encodeURIComponent(request.id)}/submissions`), {}, {
      observe: 'response',
      withCredentials: true,
      headers: this.ifMatch(etagFor(request)).set('Idempotency-Key', idempotencyKey),
    }).pipe(map(fromResponse));
  }

  cancel(request: PurchaseRequest): Observable<PurchaseRequest> {
    return this.http.post<unknown>(this.api(`/${encodeURIComponent(request.id)}/cancellations`), {}, {
      observe: 'response',
      withCredentials: true,
      headers: this.ifMatch(etagFor(request)),
    }).pipe(map(fromResponse));
  }

  private ifMatch(etag: string): HttpHeaders {
    return new HttpHeaders({ 'If-Match': etag });
  }
}
