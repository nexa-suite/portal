import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';

export interface StripeError {
  readonly message?: string;
  readonly type?: string;
}

export interface StripePaymentElement {
  mount(host: HTMLElement): void;
  unmount(): void;
}

export interface StripeElements {
  create(type: 'payment', options?: { layout?: 'accordion' | 'tabs' }): StripePaymentElement;
  submit(): Promise<{ readonly error?: StripeError }>;
}

export interface StripePaymentIntentResult {
  readonly status?: string;
}

export interface StripeInstance {
  elements(options: { clientSecret: string }): StripeElements;
  confirmPayment(options: {
    elements: StripeElements;
    confirmParams: { return_url: string };
    redirect: 'if_required';
  }): Promise<{ readonly error?: StripeError; readonly paymentIntent?: StripePaymentIntentResult }>;
}

type StripeFactory = (publishableKey: string) => StripeInstance;

declare global {
  interface Window {
    Stripe?: StripeFactory;
  }
}

@Injectable({ providedIn: 'root' })
export class StripeJsPaymentService {
  private readonly document = inject(DOCUMENT);
  private loadPromise: Promise<StripeFactory> | null = null;

  async mountPaymentElement(publishableKey: string, clientSecret: string, host: HTMLElement): Promise<PaymentElementSession> {
    if (!publishableKey || publishableKey.startsWith('pk_test_local_')) {
      throw new Error('Stripe publishable key is not configured for browser payments');
    }
    if (!clientSecret) throw new Error('Stripe Payment Intent is missing its client secret');
    const factory = await this.loadStripe();
    const stripe = factory(publishableKey);
    const elements = stripe.elements({ clientSecret });
    const paymentElement = elements.create('payment', { layout: 'accordion' });
    paymentElement.mount(host);
    return { stripe, elements, paymentElement };
  }

  async confirmPayment(session: PaymentElementSession, returnUrl: string): Promise<{ readonly error?: StripeError; readonly paymentIntent?: StripePaymentIntentResult }> {
    const submitted = await session.elements.submit();
    if (submitted.error) return submitted;
    return session.stripe.confirmPayment({ elements: session.elements, confirmParams: { return_url: returnUrl }, redirect: 'if_required' });
  }

  private loadStripe(): Promise<StripeFactory> {
    if (window.Stripe) return Promise.resolve(window.Stripe);
    if (this.loadPromise) return this.loadPromise;
    this.loadPromise = new Promise<StripeFactory>((resolve, reject) => {
      const existing = this.document.querySelector<HTMLScriptElement>('script[data-nexa-stripe-js]');
      if (existing) {
        existing.addEventListener('load', () => window.Stripe ? resolve(window.Stripe) : reject(new Error('Stripe.js loaded without a Stripe factory')));
        existing.addEventListener('error', () => reject(new Error('Stripe.js could not be loaded')));
        return;
      }
      const script = this.document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.async = true;
      script.dataset['nexaStripeJs'] = 'true';
      script.onload = () => window.Stripe ? resolve(window.Stripe) : reject(new Error('Stripe.js loaded without a Stripe factory'));
      script.onerror = () => reject(new Error('Stripe.js could not be loaded'));
      this.document.head.appendChild(script);
    });
    return this.loadPromise;
  }
}

export interface PaymentElementSession {
  readonly stripe: StripeInstance;
  readonly elements: StripeElements;
  readonly paymentElement: StripePaymentElement;
}
