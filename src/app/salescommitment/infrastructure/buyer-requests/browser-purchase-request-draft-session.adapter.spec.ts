import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BrowserPurchaseRequestDraftSessionAdapter } from './browser-purchase-request-draft-session.adapter';

describe('BrowserPurchaseRequestDraftSessionAdapter', () => {
  const values = new Map<string, string>();

  beforeEach(() => {
    values.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it('stores only a scoped pointer to the canonical draft', () => {
    const adapter = new BrowserPurchaseRequestDraftSessionAdapter();

    adapter.write('workspace:buyer', 'draft-1');

    expect(adapter.read('workspace:buyer')).toBe('draft-1');
    expect(adapter.read('workspace:other')).toBeNull();
    expect(JSON.parse(values.get('nexa.portal.active-purchase-request-draft') ?? '{}')).toEqual({
      scope: 'workspace:buyer',
      draftId: 'draft-1',
    });
  });

  it('clears only the matching scope', () => {
    const adapter = new BrowserPurchaseRequestDraftSessionAdapter();
    adapter.write('workspace:buyer', 'draft-1');

    adapter.clear('workspace:other');
    expect(adapter.read('workspace:buyer')).toBe('draft-1');

    adapter.clear('workspace:buyer');
    expect(adapter.read('workspace:buyer')).toBeNull();
  });
});
