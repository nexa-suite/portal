import { describe, expect, it } from 'vitest';
import { catalogQueryFromParams, catalogQueryToParams } from './catalog.models';

describe('catalog query model', () => {
  it('normalizes query params without losing pagination filters', () => {
    const query = catalogQueryFromParams(
      new URLSearchParams(
        'q=queso&brand=Agriform&category=Cheese&coldChain=REFRIGERATED&page=2&size=20',
      ),
    );
    expect(query).toMatchObject({
      q: 'queso',
      brand: 'Agriform',
      category: 'Cheese',
      coldChain: 'REFRIGERATED',
      page: 2,
      size: 20,
    });
    expect(catalogQueryToParams(query)).toMatchObject({
      q: 'queso',
      brand: 'Agriform',
      page: '2',
      size: '20',
    });
  });
});
