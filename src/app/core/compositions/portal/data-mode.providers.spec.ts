import { InjectionToken } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { PortalRuntimeConfig, PORTAL_RUNTIME_CONFIG } from '../../security/runtime-config';
import { provideApiOnlyPortalAdapter, provideSelectedPortalAdapter, selectPortalAdapter } from './data-mode.providers';

class ApiAdapter { readonly mode: string = 'api'; }
class MockAdapter { readonly mode: string = 'mock'; }

const ADAPTER_PORT = new InjectionToken<ApiAdapter | MockAdapter>('TEST_ADAPTER_PORT');

function config(dataMode: PortalRuntimeConfig['dataMode']): PortalRuntimeConfig {
  return {
    apiBaseUrl: '',
    signInPath: '',
    refreshPath: '',
    signOutPath: '',
    catalogPath: '',
    surface: 'PORTAL',
    dataMode,
    tenantProfile: 'generic',
  };
}

describe('portal data mode selector', () => {
  it('selects only the mock implementation in mock mode', () => {
    const api = new ApiAdapter();
    const mock = new MockAdapter();

    expect(selectPortalAdapter('api', api, mock)).toBe(api);
    expect(selectPortalAdapter('mock', api, mock)).toBe(mock);
  });

  it('resolves the selected implementation through an explicit provider factory', () => {
    TestBed.configureTestingModule({
      providers: [
        ApiAdapter,
        MockAdapter,
        { provide: PORTAL_RUNTIME_CONFIG, useValue: config('mock') },
        provideSelectedPortalAdapter(ADAPTER_PORT, ApiAdapter, MockAdapter),
      ],
    });

    expect(TestBed.inject(ADAPTER_PORT)).toBeInstanceOf(MockAdapter);
  });

  it('keeps an API-only route on its HTTP implementation in mock mode', () => {
    TestBed.configureTestingModule({
      providers: [
        ApiAdapter,
        MockAdapter,
        { provide: PORTAL_RUNTIME_CONFIG, useValue: config('mock') },
        provideApiOnlyPortalAdapter(ADAPTER_PORT, ApiAdapter),
      ],
    });

    expect(TestBed.inject(ADAPTER_PORT)).toBeInstanceOf(ApiAdapter);
  });
});
