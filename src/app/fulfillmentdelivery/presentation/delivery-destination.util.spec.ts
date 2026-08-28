import { describe, expect, it } from 'vitest';
import { formatBuyerDeliveryDestination } from './delivery-destination.util';

describe('formatBuyerDeliveryDestination', () => {
  it('keeps a plain destination readable', () => {
    expect(formatBuyerDeliveryDestination({ destination: 'Av. Néstor Gambetta 850, Callao' })).toBe('Av. Néstor Gambetta 850, Callao');
  });

  it('extracts buyer-safe address copy from the persisted snapshot', () => {
    const destination = JSON.stringify({
      delivery: {
        address: {
          label: 'Buyer delivery · Pueblo Libre',
          address: { line: 'Av. Sucre 1992', districtCode: '150121' },
        },
      },
    });
    expect(formatBuyerDeliveryDestination({ destination })).toBe('Buyer delivery · Pueblo Libre · Av. Sucre 1992');
  });

  it('does not leak malformed or empty snapshots', () => {
    expect(formatBuyerDeliveryDestination({ destination: '{not-json' })).toBe('—');
    expect(formatBuyerDeliveryDestination({ destination: null })).toBe('—');
  });
});
