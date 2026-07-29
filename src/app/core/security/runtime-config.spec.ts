import { describe, expect, it } from 'vitest';
import { portalApiUrl, resolvePortalRuntimeConfig } from './runtime-config';

describe('portal runtime config', () => {
  it('uses a fixed Portal surface and safe local API fallback', () => {
    const config = resolvePortalRuntimeConfig();
    expect(config.surface).toBe('PORTAL');
    expect(config.apiBaseUrl).toBe('http://localhost:8081');
    expect(portalApiUrl(config, '/api/v1/catalog-items')).toBe(
      'http://localhost:8081/api/v1/catalog-items',
    );
  });
});
