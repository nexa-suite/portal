import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PORTAL_RUNTIME_CONFIG, portalApiUrl } from '../../../core/security/runtime-config';
import { PurchaseRequest, PurchaseRequestDraftCommand, PurchaseRequestPage } from '../domain/purchase-request.models';

@Injectable({ providedIn: 'root' })
export class PurchaseRequestApiClient {
  private readonly http = inject(HttpClient);
  private readonly config = inject(PORTAL_RUNTIME_CONFIG);
  private api(path: string): string { return portalApiUrl(this.config, `/api/v1/purchase-requests${path}`); }
  list(status = ''): Observable<PurchaseRequestPage> { let params = new HttpParams().set('page', 0).set('size', 50).set('sort', 'createdAt,desc'); if (status) params=params.set('status',status); return this.http.get<PurchaseRequestPage>(this.api(''), { params, withCredentials:true }); }
  get(id: string): Observable<PurchaseRequest> { return this.http.get<PurchaseRequest>(this.api(`/${encodeURIComponent(id)}`), { withCredentials:true }); }
  create(command: PurchaseRequestDraftCommand): Observable<PurchaseRequest> { return this.http.post<PurchaseRequest>(this.api(''), command, { withCredentials:true }); }
  update(id: string, version: number, command: Partial<PurchaseRequestDraftCommand>): Observable<PurchaseRequest> { return this.http.patch<PurchaseRequest>(this.api(`/${encodeURIComponent(id)}`), command, { withCredentials:true, headers:this.ifMatch(version) }); }
  submit(id: string, version: number, idempotencyKey: string): Observable<PurchaseRequest> { return this.http.post<PurchaseRequest>(this.api(`/${encodeURIComponent(id)}/submissions`), {}, { withCredentials:true, headers:this.ifMatch(version).set('Idempotency-Key',idempotencyKey) }); }
  cancel(id: string, version: number): Observable<PurchaseRequest> { return this.http.post<PurchaseRequest>(this.api(`/${encodeURIComponent(id)}/cancellations`), {}, { withCredentials:true, headers:this.ifMatch(version) }); }
  private ifMatch(version: number): HttpHeaders { return new HttpHeaders({ 'If-Match': `"${version}"` }); }
}
