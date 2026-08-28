import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PORTAL_RUNTIME_CONFIG, portalApiUrl } from '../../core/security/runtime-config';
import { ReceivablesPort } from '../application/receivables.port';
import { Receivable, ReceivablesPage } from '../domain/receivables.models';

@Injectable({ providedIn: 'root' })
export class ReceivablesApiClient implements ReceivablesPort {
  private readonly http = inject(HttpClient);
  private readonly config = inject(PORTAL_RUNTIME_CONFIG);

  list(page = 0, size = 25): Observable<ReceivablesPage<Receivable>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ReceivablesPage<Receivable>>(portalApiUrl(this.config, '/api/v1/receivables'), { params, withCredentials: true });
  }
}
