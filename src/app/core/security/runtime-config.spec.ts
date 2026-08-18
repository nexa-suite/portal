import { describe, expect, it } from 'vitest';
import { portalApiUrl, resolvePortalRuntimeConfig } from './runtime-config';

describe('portal runtime config', () => {
  it('uses a fixed Portal surface and same-origin API fallback', () => {
    const config = resolvePortalRuntimeConfig();
    expect(config.surface).toBe('PORTAL');
    expect(config.apiBaseUrl).toBe('');
    expect(portalApiUrl(config, '/api/v1/catalog-items')).toBe(
      '/api/v1/catalog-items',
    );
  });
});
