import { InjectionToken } from '@angular/core';
import type { Signal } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  PortalAuthStatus,
  PortalIdentity,
  PortalSurface,
  SignInCredentials,
} from '../../tenantaccessgovernance/iam/domain/portal-access.models';
import type { Profile } from '../../tenantaccessgovernance/iam/domain/security.models';

/** Neutral Portal surface contract; it has no runtime dependency on IAM. */
export const PORTAL_SURFACE = 'PORTAL' as const;
export type { PortalAuthStatus, PortalIdentity, PortalSurface, SignInCredentials };

export interface PortalProfileUpdate {
  readonly displayName: string;
  readonly phone: string;
  readonly preferredLanguage: string;
  readonly timezone: string;
}

export interface PortalSecurityBoundary {
  readonly accessToken: Signal<string | null>;
  readonly identity: Signal<PortalIdentity | null>;
  readonly status: Signal<PortalAuthStatus>;
  readonly authError: Signal<unknown>;
  readonly isAuthenticated: Signal<boolean>;
  readonly canAccessBuyerPortal: Signal<boolean>;
  readonly profile: Signal<Profile | null>;
  readonly busy: Signal<boolean>;
  readonly message: Signal<string | null>;
  readonly profileError: Signal<string | null>;
  restore(): Observable<void>;
  refreshAccessToken(): Observable<string>;
  revalidateSession(): Observable<boolean>;
  expireSession(): void;
  clearSession(): void;
  signIn(credentials: SignInCredentials): Observable<void>;
  signOut(): Observable<void>;
  hasPermission(permission: string): boolean;
  loadProfile(): Observable<Profile>;
  saveProfile(value: PortalProfileUpdate, version: number): Observable<Profile>;
}

export const PORTAL_SECURITY_BOUNDARY = new InjectionToken<PortalSecurityBoundary>(
  'PORTAL_SECURITY_BOUNDARY',
);
