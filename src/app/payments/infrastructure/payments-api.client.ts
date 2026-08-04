import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PORTAL_RUNTIME_CONFIG, portalApiUrl } from '../../core/security/runtime-config';
import { ApiPage, PaymentIntent, Receivable } from '../domain/payment.models';

@Injectable({ providedIn: 'root' })
export class PaymentsApiClient {
  private readonly http = inject(HttpClient);
  private readonly config = inject(PORTAL_RUNTIME_CONFIG);

  private api(path: string): string { return portalApiUrl(this.config, `/api/v1${path}`); }

  list(page = 0, size = 25): Observable<ApiPage<Receivable>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiPage<Receivable>>(this.api('/receivables'), { params, withCredentials: true });
  }

  createPaymentIntent(receivableId: string, idempotencyKey = crypto.randomUUID()): Observable<PaymentIntent> {
    const headers = new HttpHeaders({ 'Idempotency-Key': idempotencyKey });
    return this.http.post<PaymentIntent>(this.api(`/receivables/${encodeURIComponent(receivableId)}/payment-intents`), {}, { headers, withCredentials: true });
  }
}
