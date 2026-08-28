import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { PORTAL_RUNTIME_CONFIG, PortalRuntimeConfig } from '../../../core/security/runtime-config';
import { MockBuyerAccountApiAdapter } from './mock-buyer-account-api.adapter';

function config(): PortalRuntimeConfig {
  return {
    apiBaseUrl: '',
    signInPath: '',
    refreshPath: '',
    signOutPath: '',
    catalogPath: '',
    surface: 'PORTAL',
    dataMode: 'mock',
    tenantProfile: 'icisa',
  };
}

describe('MockBuyerAccountApiAdapter', () => {
  it('serves the ICISA account and keeps address ETag/version transitions coherent', () => {
    TestBed.configureTestingModule({
      providers: [MockBuyerAccountApiAdapter, { provide: PORTAL_RUNTIME_CONFIG, useValue: config() }],
    });
    const adapter = TestBed.inject(MockBuyerAccountApiAdapter);
    let created: { id: string; version: number; etag: string } | undefined;
    let selected: { version: number; etag: string; defaultAddress: boolean } | undefined;
    let staleStatus: number | undefined;

    adapter.createAddress('client-icisa-001', {
      label: 'Secundaria',
      defaultAddress: false,
      address: {
        addressType: 'DELIVERY',
        line: 'Av. Mock 10',
        reference: 'Puerta principal',
        countryCode: 'PE',
        departmentCode: 'LIM',
        provinceCode: 'LIM-01',
        districtCode: 'LIM-0101',
      },
    }).subscribe((value) => created = value);
    adapter.setDefaultAddress('client-icisa-001', created?.id ?? '', created?.etag ?? '"1"').subscribe((value) => selected = value);
    adapter.setDefaultAddress('client-icisa-001', created?.id ?? '', '"1"').subscribe({
      error: (error: { status?: number }) => staleStatus = error.status,
    });

    expect(created).toMatchObject({ version: 1, etag: '"1"' });
    expect(selected).toMatchObject({ version: 2, etag: '"2"', defaultAddress: true });
    expect(staleStatus).toBe(409);
  });
});
