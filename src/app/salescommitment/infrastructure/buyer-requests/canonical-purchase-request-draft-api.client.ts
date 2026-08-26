import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { PORTAL_RUNTIME_CONFIG, portalApiUrl } from '../../../core/security/runtime-config';
import { PurchaseRequestDraftApiPort } from '../../application/ports/purchase-request-draft-api.port';
import { CanonicalDraftLine, PurchaseRequestDraftView } from '../../domain/buyer-requests/purchase-request-draft.models';

export type { CanonicalDraftLine, PurchaseRequestDraftView } from '../../domain/buyer-requests/purchase-request-draft.models';

type Raw = Record<string, unknown>;

function raw(value: unknown): Raw { return value !== null && typeof value === 'object' ? value as Raw : {}; }
function text(value: unknown): string { return typeof value === 'string' ? value.trim() : ''; }
function number(value: unknown): number { const result = typeof value === 'number' ? value : Number(value); return Number.isFinite(result) ? result : 0; }

function draft(response: HttpResponse<unknown>): PurchaseRequestDraftView {
  const item = raw(response.body);
  const version = number(item['version']);
  return {
    id: text(item['id']),
    clientAccountId: text(item['clientAccountId']),
    buyerMembershipId: text(item['buyerMembershipId']),
    status: text(item['status']).toUpperCase(),
    version,
    requestedDeliveryDate: text(item['requestedDeliveryDate']) || null,
    paymentPreference: text(item['paymentPreference']) || null,
    creditResult: text(item['creditResult']) || null,
    routeProvider: text(item['routeProvider']) || null,
    lines: Array.isArray(item['lines']) ? item['lines'].map((line) => raw(line)) : [],
    destination: item['destination'] == null ? null : raw(item['destination']),
    route: item['route'] == null ? null : raw(item['route']),
    warehouseSelection: item['warehouseSelection'] == null ? null : raw(item['warehouseSelection']),
    createdAt: text(item['createdAt']),
    updatedAt: text(item['updatedAt']),
    submittedAt: text(item['submittedAt']) || null,
    etag: response.headers.get('ETag') ?? `"${version}"`,
  };
}

@Injectable({ providedIn: 'root' })
export class PurchaseRequestDraftApiClient implements PurchaseRequestDraftApiPort {
  private readonly http = inject(HttpClient);
  private readonly config = inject(PORTAL_RUNTIME_CONFIG);

  create(clientAccountId: string, requestedDeliveryDate: string): Observable<PurchaseRequestDraftView> {
    return this.http.post<unknown>(this.api('/buyer/purchase-request-drafts'), { clientAccountId, requestedDeliveryDate }, { observe: 'response', withCredentials: true })
      .pipe(map(draft));
  }

  get(draftId: string): Observable<PurchaseRequestDraftView> {
    return this.http.get<unknown>(this.api(`/buyer/purchase-request-drafts/${encodeURIComponent(draftId)}`), { observe: 'response', withCredentials: true })
      .pipe(map(draft));
  }

  replaceLines(draftId: string, etag: string, lines: readonly CanonicalDraftLine[]): Observable<PurchaseRequestDraftView> {
    return this.mutate('put', `/buyer/purchase-request-drafts/${encodeURIComponent(draftId)}/lines`, { lines }, etag);
  }

  setDestination(draftId: string, etag: string, addressId: string): Observable<PurchaseRequestDraftView> {
    return this.mutate('put', `/buyer/purchase-request-drafts/${encodeURIComponent(draftId)}/destination`, { addressId }, etag);
  }

  previewRoute(draftId: string, etag: string): Observable<PurchaseRequestDraftView> {
    return this.mutate('post', `/buyer/purchase-request-drafts/${encodeURIComponent(draftId)}/route-previews`, { provider: 'LOCAL_ESTIMATE' }, etag);
  }

  setPreferences(draftId: string, etag: string, paymentPreference: string, requestedDeliveryDate: string): Observable<PurchaseRequestDraftView> {
    return this.mutate('put', `/buyer/purchase-request-drafts/${encodeURIComponent(draftId)}/preferences`, { paymentPreference, requestedDeliveryDate }, etag);
  }

  submit(draftId: string, etag: string, idempotencyKey: string): Observable<PurchaseRequestDraftView> {
    const headers = new HttpHeaders({ 'If-Match': etag, 'Idempotency-Key': idempotencyKey });
    return this.http.post<unknown>(this.api(`/buyer/purchase-request-drafts/${encodeURIComponent(draftId)}/submissions`), null, { observe: 'response', withCredentials: true, headers })
      .pipe(map(draft));
  }

  private mutate(method: 'put' | 'post', path: string, body: unknown, etag: string): Observable<PurchaseRequestDraftView> {
    const headers = new HttpHeaders({ 'If-Match': etag });
    const options = { observe: 'response' as const, withCredentials: true, headers };
    const request = method === 'put' ? this.http.put<unknown>(this.api(path), body, options) : this.http.post<unknown>(this.api(path), body, options);
    return request.pipe(map(draft));
  }

  private api(path: string): string { return portalApiUrl(this.config, `/api/v1${path}`); }
}

/** @deprecated Use PurchaseRequestDraftView. */
export type CanonicalDraftView = PurchaseRequestDraftView;

/** @deprecated Use PurchaseRequestDraftApiClient. Kept as a compatibility alias for existing consumers. */
@Injectable({ providedIn: 'root' })
export class CanonicalPurchaseRequestDraftApiClient extends PurchaseRequestDraftApiClient {}
