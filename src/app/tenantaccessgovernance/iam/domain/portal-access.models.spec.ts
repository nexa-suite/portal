import { describe, expect, it } from 'vitest';
import { PortalAccessDeniedError, toPortalSession } from './portal-access.models';

describe('portal access model', () => {
  it('maps the secured Nexa session contract for a Buyer', () => {
    const session = toPortalSession({
      accessToken: 'memory-token',
      session: {
        userId: 'buyer-1',
        displayName: 'Buyer',
        email: 'buyer@icisa.pe',
        workspaceSlug: 'icisa',
        roles: ['BUYER'],
        surface: 'PORTAL',
      },
    });

    expect(session.identity.id).toBe('buyer-1');
    expect(session.identity.workspaceSlug).toBe('icisa');
    expect(session.identity.roles).toContain('BUYER');
  });

  it('maps the existing flat authentication response for a Buyer', () => {
    const session = toPortalSession({
      id: 42,
      email: 'buyer@icisa.example',
      fullName: 'ICISA Buyer',
      roles: ['B2B Buyer'],
      accessToken: 'memory-token',
      workspaceSlug: 'icisa',
      clientAccountId: 7,
    });

    expect(session.surface).toBe('PORTAL');
    expect(session.identity.roles).toContain('BUYER');
    expect(session.accessToken).toBe('memory-token');
  });

  it('rejects roles that are not Buyer', () => {
    expect(() =>
      toPortalSession({ email: 'sales@icisa.example', roles: ['Sales'], accessToken: 'token' }),
    ).toThrowError(PortalAccessDeniedError);
  });
});
