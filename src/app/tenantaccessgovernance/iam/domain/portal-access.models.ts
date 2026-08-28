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
  readonly roles: readonly PortalRole[];
  readonly workspaceSlug: string | null;
  readonly clientAccountId: string | null;
  readonly membershipStatus: string | null;
  readonly permissions?: readonly string[];
}

export interface PortalSession {
  readonly accessToken: string;
  readonly identity: PortalIdentity;
  readonly surface: PortalSurface;
}

export type PortalAuthStatus =
  | 'signed-out'
  | 'authenticating'
  | 'authenticated'
  | 'refreshing'
  | 'two-factor-challenge'
  | 'verifying-two-factor'
  | 'error'
  | 'forbidden';

export type PortalTwoFactorChannel = 'email' | 'authenticator';

export interface PortalTwoFactorChallenge {
  readonly challengeId: string;
  readonly channel: PortalTwoFactorChannel;
  readonly maskedDestination: string;
  readonly expiresInSeconds: number;
}

export type PortalTwoFactorStatus =
  | 'idle'
  | 'pending'
  | 'verifying'
  | 'verified'
  | 'unavailable'
  | 'error';

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

export class PortalTwoFactorUnavailableError extends Error {
  readonly code = 'TWO_FACTOR_BACKEND_UNAVAILABLE';

  constructor() {
    super('The Portal API does not expose a two-factor verification contract yet.');
    this.name = 'PortalTwoFactorUnavailableError';
  }
}

export class NoPendingTwoFactorChallengeError extends Error {
  readonly code = 'NO_PENDING_TWO_FACTOR_CHALLENGE';

  constructor() {
    super('There is no pending two-factor challenge for this Portal session.');
    this.name = 'NoPendingTwoFactorChallengeError';
  }
}

export class InvalidTwoFactorChallengeError extends Error {
  readonly code = 'INVALID_TWO_FACTOR_CHALLENGE';

  constructor() {
    super('The authentication response did not contain a valid two-factor challenge.');
    this.name = 'InvalidTwoFactorChallengeError';
  }
}

export interface WorkspacePreview {
  readonly recognized: boolean;
  readonly displayName: string | null;
  readonly workspaceUrl: string | null;
  readonly logoUrl: string | null;
  readonly loginAvailable: boolean;
}

/** Keeps workspace discovery identical to the canonical Vue IAM flow. */
export function normalizeWorkspaceSlug(value: string): string {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const PERSONAL_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'hotmail.com',
  'outlook.com',
  'yahoo.com',
  'icloud.com',
  'live.com',
]);

export function isPersonalEmail(value: string): boolean {
  const domain = value.trim().toLowerCase().split('@').at(-1) ?? '';
  return PERSONAL_EMAIL_DOMAINS.has(domain);
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

function firstIdentifier(...values: unknown[]): string | null {
  const value = values.find((candidate) => {
    if (typeof candidate === 'string') return candidate.trim().length > 0;
    return typeof candidate === 'number' && Number.isFinite(candidate);
  });
  return value === undefined ? null : String(value).trim() || null;
}

function normalizeRoles(...values: unknown[]): readonly PortalRole[] {
  const candidates = values.flatMap((value) => Array.isArray(value) ? value : []);
  const normalized = candidates.map((value) => typeof value === 'string' ? value.toUpperCase().replace(/[\s_-]+/g, '') : '')
    .filter((value) => value === 'BUYER' || value === 'B2BBUYER');
  if (normalized.includes('BUYER') || normalized.includes('B2BBUYER')) return [BUYER_ROLE];
  throw new PortalAccessDeniedError();
}

function toTwoFactorChannel(value: unknown): PortalTwoFactorChannel | null {
  if (value === 'email' || value === 'authenticator') return value;
  return null;
}

export function toPortalTwoFactorChallenge(responseValue: unknown): PortalTwoFactorChallenge | null {
  const response = recordValue(responseValue);
  if (property(response, 'twoFactorRequired') !== true) return null;

  const challenge = recordValue(property(response, 'challenge') ?? property(response, 'twoFactorChallenge'));
  const challengeId = firstString(
    property(challenge, 'challengeId'),
    property(challenge, 'id'),
  );
  const channel = toTwoFactorChannel(property(challenge, 'channel'));
  const maskedDestination = firstString(
    property(challenge, 'maskedDestination'),
    property(challenge, 'destination'),
  );
  const expiresInSeconds = property(challenge, 'expiresInSeconds');

  if (!challengeId || !channel || !maskedDestination
    || typeof expiresInSeconds !== 'number'
    || !Number.isFinite(expiresInSeconds)
    || expiresInSeconds <= 0) {
    throw new InvalidTwoFactorChallengeError();
  }

  return { challengeId, channel, maskedDestination, expiresInSeconds };
}

function identityFromResponse(
  response: RecordValue,
  previousIdentity: PortalIdentity | null,
): PortalIdentity {
  const session = recordValue(property(response, 'session') ?? property(response, 'Session'));
  const user = recordValue(property(response, 'user') ?? property(response, 'User') ?? session);
  const membership = recordValue(
    property(response, 'membership') ?? property(response, 'Membership') ?? session,
  );
  const workspace = recordValue(
    property(response, 'workspace') ?? property(response, 'Workspace')
      ?? property(session, 'workspace') ?? property(session, 'Workspace'),
  );
  const email = firstString(
    property(user, 'email'),
    property(user, 'Email'),
    property(response, 'email'),
    property(response, 'Email'),
    property(session, 'email'),
    property(user, 'username'),
    property(user, 'Username'),
  );
  const id = firstIdentifier(
    property(user, 'id'),
    property(user, 'Id'),
    property(user, 'userId'),
    property(user, 'UserId'),
    property(response, 'id'),
    property(response, 'Id'),
    property(response, 'userId'),
    property(response, 'UserId'),
    property(session, 'userId'),
    property(session, 'UserId'),
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
    property(session, 'displayName'),
    email,
  );
  const roles = normalizeRoles(
    property(membership, 'roles'), property(membership, 'Roles'),
    property(user, 'roles'), property(user, 'Roles'),
    property(response, 'roles'), property(response, 'Roles'),
    property(session, 'roles'), property(session, 'Roles'),
    previousIdentity?.roles,
  );

  if (!id || !email || !displayName) {
    if (previousIdentity) return { ...previousIdentity, roles };
    throw new InvalidPortalSessionError();
  }

  return {
    id,
    email,
    displayName,
    roles,
    workspaceSlug: firstString(
    property(membership, 'workspaceSlug'),
    property(membership, 'WorkspaceSlug'),
    property(workspace, 'workspaceSlug'),
    property(workspace, 'WorkspaceSlug'),
    property(response, 'workspaceSlug'),
    property(response, 'WorkspaceSlug'),
      property(session, 'workspaceSlug'),
      previousIdentity?.workspaceSlug,
    ),
    clientAccountId: firstIdentifier(
      property(membership, 'clientAccountId'),
      property(membership, 'ClientAccountId'),
      property(user, 'clientAccountId'),
      property(user, 'ClientAccountId'),
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
    permissions: Array.from(new Set([
      ...(Array.isArray(property(membership, 'permissions')) ? property(membership, 'permissions') as unknown[] : []),
      ...(Array.isArray(property(user, 'permissions')) ? property(user, 'permissions') as unknown[] : []),
      ...(Array.isArray(property(response, 'permissions')) ? property(response, 'permissions') as unknown[] : []),
      ...(previousIdentity?.permissions ?? []),
    ].filter((value): value is string => typeof value === 'string').map((value) => value.toLowerCase()))),
  };
}

export function toPortalSession(
  responseValue: unknown,
  previousIdentity: PortalIdentity | null = null,
  accessTokenOverride?: string,
): PortalSession {
  const response = recordValue(responseValue);
  const accessToken = accessTokenOverride ?? firstString(
    property(response, 'accessToken'),
    property(response, 'AccessToken'),
    property(response, 'token'),
    property(response, 'Token'),
  );
  if (!accessToken) throw new MissingAccessTokenError();

  const session = recordValue(property(response, 'session') ?? property(response, 'Session'));
  const surface = firstString(property(session, 'surface'), property(response, 'surface'));
  if (surface && surface.toUpperCase() !== PORTAL_SURFACE) throw new PortalAccessDeniedError();

  return {
    accessToken,
    identity: identityFromResponse(response, previousIdentity),
    surface: PORTAL_SURFACE,
  };
}
