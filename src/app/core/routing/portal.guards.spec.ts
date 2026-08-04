import { describe, expect, it } from 'vitest';
import { safeReturnUrl } from './portal.guards';

describe('portal return URLs', () => {
  it('keeps an internal portal route and rejects external destinations', () => {
    expect(safeReturnUrl('/portal/purchase-requests?status=OPEN')).toBe('/portal/purchase-requests?status=OPEN');
    expect(safeReturnUrl('https://evil.example')).toBe('/portal/home');
    expect(safeReturnUrl('//evil.example')).toBe('/portal/home');
    expect(safeReturnUrl('/%2F%2Fevil.example')).toBe('/portal/home');
    expect(safeReturnUrl('/foo/%2e%2e/sign-in')).toBe('/portal/home');
  });
});
