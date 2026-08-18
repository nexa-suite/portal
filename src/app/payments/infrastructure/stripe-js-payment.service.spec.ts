import { TestBed } from '@angular/core/testing';
import { StripeJsPaymentService } from './stripe-js-payment.service';

describe('StripeJsPaymentService', () => {
  let service: StripeJsPaymentService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [StripeJsPaymentService] });
    service = TestBed.inject(StripeJsPaymentService);
  });

  it('rejects local placeholder publishable keys before loading Stripe.js', async () => {
    await expect(service.mountPaymentElement('pk_test_local_foundation', 'pi_test_secret_x', document.body)).rejects.toThrow(
      'Stripe publishable key is not configured for browser payments',
    );
  });

  it('rejects a missing client secret before mounting a payment element', async () => {
    await expect(service.mountPaymentElement('pk_test_realistic', '', document.body)).rejects.toThrow(
      'Stripe Payment Intent is missing its client secret',
    );
  });
});
