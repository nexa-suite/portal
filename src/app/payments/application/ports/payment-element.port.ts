import { InjectionToken } from '@angular/core';

export interface PaymentElementSession {
  readonly paymentElement: { unmount(): void };
}

export interface PaymentConfirmationResult {
  readonly error?: { readonly message?: string };
  readonly paymentIntent?: { readonly status?: string };
}

export interface PaymentElementPort {
  mountPaymentElement(publishableKey: string, clientSecret: string, host: HTMLElement): Promise<PaymentElementSession>;
  confirmPayment(session: PaymentElementSession, returnUrl: string): Promise<PaymentConfirmationResult>;
}

export const PAYMENT_ELEMENT_PORT = new InjectionToken<PaymentElementPort>('PAYMENT_ELEMENT_PORT');
