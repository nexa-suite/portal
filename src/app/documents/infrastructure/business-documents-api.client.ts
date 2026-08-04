import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PORTAL_RUNTIME_CONFIG, portalApiUrl } from '../../core/security/runtime-config';
import { ApiPage, BusinessDocument, EvidenceObject } from '../domain/business-document.models';

@Injectable({ providedIn: 'root' })
export class BusinessDocumentsApiClient {
  private readonly http = inject(HttpClient);
  private readonly config = inject(PORTAL_RUNTIME_CONFIG);

  private api(path: string): string { return portalApiUrl(this.config, `/api/v1${path}`); }
  private headers(key?: string): HttpHeaders { return new HttpHeaders({ 'Idempotency-Key': key?.trim() || crypto.randomUUID() }); }

  list(page = 0, size = 25): Observable<ApiPage<BusinessDocument>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiPage<BusinessDocument>>(this.api('/business-documents'), { params, withCredentials: true });
  }

  download(id: string): Observable<HttpResponse<Blob>> {
    return this.http.get(this.api(`/business-documents/${encodeURIComponent(id)}/downloads`), { observe: 'response', responseType: 'blob', withCredentials: true });
  }

  listEvidence(page = 0, size = 25, subjectType?: string, subjectId?: string): Observable<ApiPage<EvidenceObject>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (subjectType) params = params.set('subjectType', subjectType);
    if (subjectId) params = params.set('subjectId', subjectId);
    return this.http.get<ApiPage<EvidenceObject>>(this.api('/business-document-evidence'), { params, withCredentials: true });
  }

  downloadEvidence(id: string): Observable<HttpResponse<Blob>> {
    return this.http.get(this.api(`/business-document-evidence/${encodeURIComponent(id)}/downloads`), { observe: 'response', responseType: 'blob', withCredentials: true });
  }
}
