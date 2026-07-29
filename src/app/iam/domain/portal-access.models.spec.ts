import { describe, expect, it } from 'vitest';
import { PortalAccessDeniedError, toPortalSession } from './portal-access.models';

describe('portal access model', () => {
  it('maps the existing flat authentication response for a Buyer', () => {
    const session = toPortalSession({
      id: 42,
      email: 'buyer@icisa.example',
      fullName: 'ICISA Buyer',
      role: 'B2B Buyer',
      accessToken: 'memory-token',
      workspaceSlug: 'icisa',
      clientAccountId: 7,
    });

    expect(session.surface).toBe('PORTAL');
    expect(session.identity.role).toBe('BUYER');
    expect(session.accessToken).toBe('memory-token');
  });

  it('rejects roles that are not Buyer', () => {
    expect(() =>
      toPortalSession({ email: 'sales@icisa.example', role: 'Sales', accessToken: 'token' }),
    ).toThrowError(PortalAccessDeniedError);
  });
});
