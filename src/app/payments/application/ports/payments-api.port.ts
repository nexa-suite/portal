import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { BankTransferPayment, PaymentHistoryItem, PaymentIntent, PaymentPage } from '../../domain/payment.models';

export interface PaymentsApiPort {
  createPaymentIntent(receivableId: string, idempotencyKey?: string): Observable<PaymentIntent>;
  createBankTransferPayment(receivableId: string, reference: string, proofEvidenceId?: string, idempotencyKey?: string): Observable<BankTransferPayment>;
  listPaymentsForReceivable(receivableId: string, page?: number, size?: number): Observable<PaymentPage<PaymentHistoryItem>>;
}

export const PAYMENTS_PORT = new InjectionToken<PaymentsApiPort>('PAYMENTS_PORT');
