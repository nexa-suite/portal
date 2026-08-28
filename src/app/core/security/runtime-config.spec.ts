import { afterEach, describe, expect, it, vi } from 'vitest';
import { portalApiUrl, resolvePortalRuntimeConfig } from './runtime-config';

describe('portal runtime config', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('uses a fixed Portal surface and same-origin API fallback', () => {
    const config = resolvePortalRuntimeConfig();
    expect(config.surface).toBe('PORTAL');
    expect(config.apiBaseUrl).toBe('');
    expect(config.dataMode).toBe('api');
    expect(config.tenantProfile).toBe('generic');
    expect(portalApiUrl(config, '/api/v1/catalog-items')).toBe(
      '/api/v1/catalog-items',
    );
  });

  it('accepts mock mode and a tenant profile only through the runtime global', () => {
    vi.stubGlobal('__NEXA_RUNTIME_CONFIG__', {
      dataMode: 'mock',
      tenantProfile: 'icisa',
      apiBase: 'http://api.local///',
    });

    const config = resolvePortalRuntimeConfig();

    expect(config.dataMode).toBe('mock');
    expect(config.tenantProfile).toBe('icisa');
    expect(config.apiBaseUrl).toBe('http://api.local');
    expect(config.surface).toBe('PORTAL');
  });

  it('falls back to API/generic for unsupported runtime values', () => {
    vi.stubGlobal('__NEXA_RUNTIME_CONFIG__', { dataMode: 'fixture', tenantProfile: 'unknown' });

    const config = resolvePortalRuntimeConfig();

    expect(config.dataMode).toBe('api');
    expect(config.tenantProfile).toBe('generic');
  });
});
