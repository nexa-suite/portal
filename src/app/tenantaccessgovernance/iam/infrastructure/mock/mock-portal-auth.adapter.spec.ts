import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { PORTAL_RUNTIME_CONFIG, PortalRuntimeConfig } from '../../../../core/security/runtime-config';
import { MockPortalAuthAdapter } from './mock-portal-auth.adapter';

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

describe('MockPortalAuthAdapter', () => {
  afterEach(() => {
    sessionStorage.removeItem('nexa.portal.session.active');
    TestBed.resetTestingModule();
  });

  it('authenticates the deterministic ICISA Buyer fixture and preserves refresh identity', () => {
    TestBed.configureTestingModule({
      providers: [MockPortalAuthAdapter, { provide: PORTAL_RUNTIME_CONFIG, useValue: config('icisa') }],
    });
    const adapter = TestBed.inject(MockPortalAuthAdapter);
    let signInResponse: unknown;
    let refreshResponse: unknown;
    let challenge: unknown;
    let verifiedResponse: unknown;

    adapter.workspacePreview('icisa').subscribe((preview) => expect(preview).toMatchObject({ recognized: true, loginAvailable: true }));
    adapter.signIn({ email: 'buyer@icisa.example', password: 'mock-password', workspaceSlug: 'icisa' }).subscribe((value) => { signInResponse = value; challenge = value; });
    expect(challenge).toMatchObject({ twoFactorRequired: true });
    adapter.verifyTwoFactor('mock-icisa-two-factor-challenge', '246810').subscribe((value) => verifiedResponse = value);
    adapter.refresh().subscribe((value) => refreshResponse = value);

    expect(verifiedResponse).toEqual(refreshResponse);
    expect(verifiedResponse).toMatchObject({
      accessToken: 'mock-icisa-buyer-token',
      clientAccountId: 'client-icisa-001',
      session: { roles: ['BUYER'], workspaceSlug: 'icisa', surface: 'PORTAL' },
    });
  });

  it('rejects credentials for a different workspace profile', () => {
    TestBed.configureTestingModule({
      providers: [MockPortalAuthAdapter, { provide: PORTAL_RUNTIME_CONFIG, useValue: config('generic') }],
    });
    const adapter = TestBed.inject(MockPortalAuthAdapter);
    let status: number | undefined;

    adapter.signIn({ email: 'buyer@icisa.example', password: 'mock-password', workspaceSlug: 'icisa' }).subscribe({
      error: (error: { status?: number }) => status = error.status,
    });

    expect(status).toBe(401);
  });
});
