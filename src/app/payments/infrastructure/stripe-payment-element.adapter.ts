import { Injectable, inject } from '@angular/core';
import { PaymentConfirmationResult, PaymentElementPort, PaymentElementSession } from '../application/ports/payment-element.port';
import { PaymentElementSession as StripeSession, StripeJsPaymentService } from './stripe-js-payment.service';

/** Infrastructure adapter keeps the external Stripe SDK behind the application port. */
@Injectable({ providedIn: 'root' })
export class StripePaymentElementAdapter implements PaymentElementPort {
  private readonly stripe = inject(StripeJsPaymentService);

  mountPaymentElement(publishableKey: string, clientSecret: string, host: HTMLElement): Promise<PaymentElementSession> {
    return this.stripe.mountPaymentElement(publishableKey, clientSecret, host);
  }

  confirmPayment(session: PaymentElementSession, returnUrl: string): Promise<PaymentConfirmationResult> {
    return this.stripe.confirmPayment(session as StripeSession, returnUrl);
  }
}
