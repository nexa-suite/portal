import { describe, expect, it } from 'vitest';
import en from '../../../../../public/assets/i18n/en.json';
import es from '../../../../../public/assets/i18n/es.json';

type BuyerBuilderTranslations = {
  buyerBuilder: {
    delivery: { origin: string; subtitle: string };
    actions: { submitting: string };
  };
  messages: { BUYER_DELIVERY_REQUIRED: string };
};

describe('Buyer Request Builder translations', () => {
  it('parses both locales and keeps delivery copy server-neutral', () => {
    for (const copy of [en, es] as BuyerBuilderTranslations[]) {
      const deliveryCopy = `${copy.buyerBuilder.delivery.origin} ${copy.buyerBuilder.delivery.subtitle} ${copy.messages.BUYER_DELIVERY_REQUIRED}`.toLowerCase();

      expect(copy.buyerBuilder.actions.submitting).toBeTruthy();
      expect(deliveryCopy).not.toMatch(/warehouse|almac[eé]n/);
    }
  });
});
