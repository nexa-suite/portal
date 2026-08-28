import type { WorkspacePreview } from '../../domain/portal-access.models';
import type { TenantProfile } from '../../../../core/security/runtime-config';

export interface MockPortalAuthFixture {
  readonly tenantProfile: TenantProfile;
  readonly email: string;
  readonly password: string;
  readonly accessToken: string;
  readonly userId: string;
  readonly displayName: string;
  readonly workspaceSlug: string;
  readonly clientAccountId: string;
  readonly buyerMembershipId: string;
  readonly permissions: readonly string[];
  readonly workspacePreview: WorkspacePreview;
  readonly twoFactorCode: string;
  readonly resetToken: string;
  readonly twoFactorChallenge: {
    readonly challengeId: string;
    readonly channel: 'email' | 'authenticator';
    readonly maskedDestination: string;
    readonly expiresInSeconds: number;
  };
}

const BUYER_PERMISSIONS = [
  'catalog:read',
  'sales:buyer:read',
  'sales:buyer:write',
  'orders:buyer:read',
  'document.read',
  'payment.read',
  'tracking:buyer:read',
  'notification.read',
] as const;

const FIXTURES: Record<TenantProfile, MockPortalAuthFixture> = {
  generic: {
    tenantProfile: 'generic',
    email: 'buyer@generic.example',
    password: 'mock-password',
    accessToken: 'mock-generic-buyer-token',
    userId: 'buyer-generic-001',
    displayName: 'Generic Buyer',
    workspaceSlug: 'generic',
    clientAccountId: 'client-generic-001',
    buyerMembershipId: 'membership-generic-001',
    permissions: BUYER_PERMISSIONS,
    twoFactorCode: '246810',
    resetToken: 'mock-reset-token',
    twoFactorChallenge: {
      challengeId: 'mock-generic-two-factor-challenge',
      channel: 'authenticator',
      maskedDestination: 'authenticator app',
      expiresInSeconds: 300,
    },
    workspacePreview: {
      recognized: true,
      displayName: 'Generic Buyer Workspace',
      workspaceUrl: 'generic.nexa.test',
      logoUrl: '/assets/branding/nexa.svg',
      loginAvailable: true,
    },
  },
  icisa: {
    tenantProfile: 'icisa',
    email: 'buyer@icisa.example',
    password: 'mock-password',
    accessToken: 'mock-icisa-buyer-token',
    userId: 'buyer-icisa-001',
    displayName: 'ICISA Buyer',
    workspaceSlug: 'icisa',
    clientAccountId: 'client-icisa-001',
    buyerMembershipId: 'membership-icisa-001',
    permissions: BUYER_PERMISSIONS,
    twoFactorCode: '246810',
    resetToken: 'mock-reset-token',
    twoFactorChallenge: {
      challengeId: 'mock-icisa-two-factor-challenge',
      channel: 'authenticator',
      maskedDestination: 'authenticator app',
      expiresInSeconds: 300,
    },
    workspacePreview: {
      recognized: true,
      displayName: 'ICISA Workspace',
      workspaceUrl: 'icisa.nexa.com.pe',
      logoUrl: '/assets/branding/nexa.svg',
      loginAvailable: true,
    },
  },
};

export function mockPortalAuthFixture(profile: TenantProfile): MockPortalAuthFixture {
  return FIXTURES[profile];
}
