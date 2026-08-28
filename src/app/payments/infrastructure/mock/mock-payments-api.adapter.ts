import { inject, Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { PORTAL_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import type { BankTransferPayment, PaymentHistoryItem, PaymentIntent, PaymentPage } from '../../domain/payment.models';
import { PaymentsApiPort } from '../../application/ports/payments-api.port';

const DEMO_NOW = '2026-08-26T10:00:00Z';

/** BC-08 buyer-safe local payment adapter; it never contacts Stripe or the API. */
@Injectable({ providedIn: 'root' })
export class MockPaymentsApiAdapter implements PaymentsApiPort {
  private readonly config = inject(PORTAL_RUNTIME_CONFIG);
  private readonly history = new Map<string, PaymentHistoryItem[]>();
  private nextPayment = 1;

  createPaymentIntent(receivableId: string): Observable<PaymentIntent> {
    return of({ paymentId: `${this.config.tenantProfile}-card-payment-001`, receivableId, status: 'requires_payment_method', amount: this.amountFor(receivableId), currency: 'PEN', clientSecret: `mock-client-secret-${receivableId}`, publishableKey: 'pk_test_local_nexa_demo', providerPaymentIntentId: `mock-pi-${receivableId}`, createdAt: DEMO_NOW });
  }

  createBankTransferPayment(receivableId: string, reference: string): Observable<BankTransferPayment> {
    if (!reference.trim()) return throwError(() => new Error('MOCK_PAYMENT_REFERENCE_REQUIRED'));
    const value: PaymentHistoryItem = { id: `${this.config.tenantProfile}-bank-payment-${String(this.nextPayment++).padStart(3, '0')}`, receivableId, method: 'BANK_TRANSFER', status: 'PROCESSING', amount: this.amountFor(receivableId), currency: 'PEN', createdAt: DEMO_NOW, completedAt: null, reference: reference.trim(), reviewReason: null, receivableNumber: `AR-${this.config.tenantProfile.toUpperCase()}-${receivableId.endsWith('-002') ? '002' : '001'}` };
    this.history.set(receivableId, [...(this.history.get(receivableId) ?? []), value]);
    return of(value);
  }

  listPaymentsForReceivable(receivableId: string, page = 0, size = 25): Observable<PaymentPage<PaymentHistoryItem>> { const items = this.history.get(receivableId) ?? []; return of({ items: items.slice(page * size, page * size + size), page, size, total: items.length }); }

  private amountFor(receivableId: string): number { return receivableId.endsWith('-002') ? 730 : 2490.75; }
}
