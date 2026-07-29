export const PORTAL_SURFACE = 'PORTAL' as const;
export const BUYER_ROLE = 'BUYER' as const;

export type PortalSurface = typeof PORTAL_SURFACE;
export type PortalRole = typeof BUYER_ROLE;

export interface SignInCredentials {
  readonly email: string;
  readonly password: string;
  readonly workspaceSlug: string;
}

export interface PortalIdentity {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly role: PortalRole;
  readonly workspaceSlug: string | null;
  readonly clientAccountId: number | null;
  readonly membershipStatus: string | null;
}

export interface PortalSession {
  readonly accessToken: string;
  readonly identity: PortalIdentity;
  readonly surface: PortalSurface;
}

export type PortalAuthStatus =
  'signed-out' | 'authenticating' | 'authenticated' | 'refreshing' | 'error' | 'forbidden';

export class PortalAccessDeniedError extends Error {
  readonly code = 'BUYER_ROLE_REQUIRED';

  constructor() {
    super('The Portal surface is restricted to the Buyer role.');
    this.name = 'PortalAccessDeniedError';
  }
}

export class MissingAccessTokenError extends Error {
  constructor() {
    super('Authentication response did not contain an access token.');
    this.name = 'MissingAccessTokenError';
  }
}

export class InvalidPortalSessionError extends Error {
  constructor() {
    super('Authentication response did not contain a valid Buyer session.');
    this.name = 'InvalidPortalSessionError';
  }
}

type RecordValue = Record<string, unknown>;

function recordValue(value: unknown): RecordValue {
  return value !== null && typeof value === 'object' ? (value as RecordValue) : {};
}

function property(record: RecordValue, key: string): unknown {
  return record[key];
}

function firstString(...values: unknown[]): string | null {
  return (
    values
      .find((value): value is string => typeof value === 'string' && value.trim().length > 0)
      ?.trim() ?? null
  );
}

function firstNumber(...values: unknown[]): number | null {
  const value = values.find(
    (candidate) =>
      typeof candidate === 'number' ||
      (typeof candidate === 'string' && candidate.trim().length > 0),
  );
  if (value === undefined) return null;
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeRole(...values: unknown[]): PortalRole {
  const normalized =
    firstString(...values)
      ?.toUpperCase()
      .replace(/[\s_-]+/g, '') ?? '';
  if (normalized === 'BUYER' || normalized === 'B2BBUYER') return BUYER_ROLE;
  throw new PortalAccessDeniedError();
}

function identityFromResponse(
  response: RecordValue,
  previousIdentity: PortalIdentity | null,
): PortalIdentity {
  const user = recordValue(property(response, 'user') ?? property(response, 'User'));
  const membership = recordValue(
    property(response, 'membership') ?? property(response, 'Membership'),
  );
  const email = firstString(
    property(user, 'email'),
    property(user, 'Email'),
    property(response, 'email'),
    property(response, 'Email'),
    property(user, 'username'),
    property(user, 'Username'),
  );
  const id = firstString(
    property(user, 'id'),
    property(user, 'Id'),
    property(response, 'id'),
    property(response, 'Id'),
    email,
  );
  const displayName = firstString(
    property(user, 'displayName'),
    property(user, 'DisplayName'),
    property(user, 'fullName'),
    property(user, 'FullName'),
    property(response, 'displayName'),
    property(response, 'DisplayName'),
    property(response, 'fullName'),
    property(response, 'FullName'),
    email,
  );
  const role = normalizeRole(
    property(membership, 'role'),
    property(membership, 'Role'),
    property(membership, 'roleKey'),
    property(membership, 'RoleKey'),
    property(membership, 'roleName'),
    property(membership, 'RoleName'),
    property(user, 'role'),
    property(user, 'Role'),
    property(user, 'roleName'),
    property(user, 'RoleName'),
    property(response, 'role'),
    property(response, 'Role'),
    property(response, 'roleName'),
    property(response, 'RoleName'),
    previousIdentity?.role,
  );

  if (!id || !email || !displayName) {
    if (previousIdentity) return { ...previousIdentity, role };
    throw new InvalidPortalSessionError();
  }

  return {
    id,
    email,
    displayName,
    role,
    workspaceSlug: firstString(
      property(membership, 'workspaceSlug'),
      property(membership, 'WorkspaceSlug'),
      property(response, 'workspaceSlug'),
      property(response, 'WorkspaceSlug'),
      previousIdentity?.workspaceSlug,
    ),
    clientAccountId: firstNumber(
      property(membership, 'clientAccountId'),
      property(membership, 'ClientAccountId'),
      property(response, 'clientAccountId'),
      property(response, 'ClientAccountId'),
      previousIdentity?.clientAccountId,
    ),
    membershipStatus: firstString(
      property(membership, 'status'),
      property(membership, 'Status'),
      property(response, 'membershipStatus'),
      property(response, 'MembershipStatus'),
      previousIdentity?.membershipStatus,
    ),
  };
}

export function toPortalSession(
  responseValue: unknown,
  previousIdentity: PortalIdentity | null = null,
): PortalSession {
  const response = recordValue(responseValue);
  const accessToken = firstString(
    property(response, 'accessToken'),
    property(response, 'AccessToken'),
    property(response, 'token'),
    property(response, 'Token'),
  );
  if (!accessToken) throw new MissingAccessTokenError();

  return {
    accessToken,
    identity: identityFromResponse(response, previousIdentity),
    surface: PORTAL_SURFACE,
  };
}
