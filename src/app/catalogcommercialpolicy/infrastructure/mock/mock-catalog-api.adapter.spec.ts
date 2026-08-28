import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { PORTAL_RUNTIME_CONFIG, PortalRuntimeConfig } from '../../../core/security/runtime-config';
import { DEFAULT_CATALOG_QUERY } from '../../domain/catalog.models';
import { MockCatalogApiAdapter } from './mock-catalog-api.adapter';

function config(tenantProfile: PortalRuntimeConfig['tenantProfile']): PortalRuntimeConfig {
  return {
    apiBaseUrl: '',
    signInPath: '',
    refreshPath: '',
    signOutPath: '',
    catalogPath: '',
    surface: 'PORTAL',
    dataMode: 'mock',
    tenantProfile,
  };
}

describe('MockCatalogApiAdapter', () => {
  it('filters and paginates the deterministic ICISA fixture', () => {
    TestBed.configureTestingModule({
      providers: [MockCatalogApiAdapter, { provide: PORTAL_RUNTIME_CONFIG, useValue: config('icisa') }],
    });
    const adapter = TestBed.inject(MockCatalogApiAdapter);
    let page: Awaited<ReturnType<typeof adapter.list>> extends never ? never : unknown;

    adapter.list({ ...DEFAULT_CATALOG_QUERY, q: 'queso', size: 1 }).subscribe((value) => page = value);

    expect(page).toMatchObject({ page: 0, size: 1, totalItems: 2, totalPages: 2 });
    expect((page as { items: readonly { catalogItemId: string }[] }).items[0].catalogItemId).toBe('CAT-0001');
  });

  it('calculates deterministic quantity pricing from the selected profile', () => {
    TestBed.configureTestingModule({
      providers: [MockCatalogApiAdapter, { provide: PORTAL_RUNTIME_CONFIG, useValue: config('generic') }],
    });
    const adapter = TestBed.inject(MockCatalogApiAdapter);
    let result: { items: readonly { lineEffectiveTotal: { amount: string } | null }[] } | undefined;

    adapter.previewPricing({ items: [{ productId: 'PROD-GENERIC-001', quantity: 3 }] }).subscribe((value) => result = value);

    expect(result?.items[0].lineEffectiveTotal).toEqual({ amount: '48.60', currency: 'PEN' });
  });
});
