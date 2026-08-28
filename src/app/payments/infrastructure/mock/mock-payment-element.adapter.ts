import { Injectable } from '@angular/core';
import { PaymentConfirmationResult, PaymentElementPort, PaymentElementSession } from '../../application/ports/payment-element.port';

/** Browser-safe payment-element double used only by the local mock runtime. */
@Injectable({ providedIn: 'root' })
export class MockPaymentElementAdapter implements PaymentElementPort {
  mountPaymentElement(_publishableKey: string, _clientSecret: string, host: HTMLElement): Promise<PaymentElementSession> {
    host.replaceChildren();
    const field = host.ownerDocument.createElement('div');
    field.textContent = 'Demo secure card element';
    field.setAttribute('data-nexa-payment-element', 'mock');
    host.appendChild(field);
    return Promise.resolve({ paymentElement: { unmount: () => field.remove() } });
  }

  confirmPayment(_session: PaymentElementSession, _returnUrl: string): Promise<PaymentConfirmationResult> {
    return Promise.resolve({ paymentIntent: { status: 'succeeded' } });
  }
}
