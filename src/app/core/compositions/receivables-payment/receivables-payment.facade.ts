import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { BankTransferPayment, PaymentHistoryItem, PaymentIntent, PaymentPage } from '../../../payments/domain/payment.models';
import { PAYMENTS_PORT } from '../../../payments/application/ports/payments-api.port';

/**
 * Composition facade for the existing BC-08 client.
 *
 * Composition boundary for the buyer payment workflow. The runtime selects
 * the API or local adapter behind the application port.
 */
@Injectable()
export class ReceivablesPaymentFacade {
  private readonly api = inject(PAYMENTS_PORT);

  createPaymentIntent(receivableId: string): Observable<PaymentIntent> {
    return this.api.createPaymentIntent(receivableId);
  }

  createBankTransferPayment(receivableId: string, reference: string): Observable<BankTransferPayment> {
    return this.api.createBankTransferPayment(receivableId, reference);
  }

  listPaymentsForReceivable(receivableId: string): Observable<PaymentPage<PaymentHistoryItem>> {
    return this.api.listPaymentsForReceivable(receivableId);
  }
}
