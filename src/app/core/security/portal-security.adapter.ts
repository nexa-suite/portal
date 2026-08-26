import { Injectable, Provider, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PortalAuthStateService } from '../../tenantaccessgovernance/iam/application/portal-auth-state.service';
import { SecurityFacade } from '../../tenantaccessgovernance/iam/application/security.facade';
import { PORTAL_SECURITY_BOUNDARY } from './portal-security.contract';
import type {
  PortalProfileUpdate,
  PortalSecurityBoundary,
  SignInCredentials,
} from './portal-security.contract';
import type { Profile } from '../../tenantaccessgovernance/iam/domain/security.models';

/**
 * Infrastructure adapter for the upstream IAM capability. Core consumers use
 * the neutral token and never reach into BC-01 application or infrastructure.
 */
@Injectable()
export class PortalSecurityBoundaryAdapter implements PortalSecurityBoundary {
  private readonly auth = inject(PortalAuthStateService);
  private readonly security = inject(SecurityFacade);

  readonly accessToken = this.auth.accessToken;
  readonly identity = this.auth.identity;
  readonly status = this.auth.status;
  readonly authError = this.auth.error;
  readonly isAuthenticated = this.auth.isAuthenticated;
  readonly canAccessBuyerPortal = this.auth.canAccessBuyerPortal;
  readonly profile = this.security.profile;
  readonly busy = this.security.busy;
  readonly message = this.security.message;
  readonly profileError = this.security.error;

  restore(): Observable<void> { return this.auth.restore(); }
  refreshAccessToken(): Observable<string> { return this.auth.refreshAccessToken(); }
  revalidateSession(): Observable<boolean> { return this.auth.revalidateSession(); }
  expireSession(): void { this.auth.expireSession(); }
  clearSession(): void { this.auth.clearSession(); }
  signIn(credentials: SignInCredentials): Observable<void> { return this.auth.signIn(credentials); }
  signOut(): Observable<void> { return this.auth.signOut(); }
  hasPermission(permission: string): boolean { return this.auth.hasPermission(permission); }
  loadProfile(): Observable<Profile> { return this.security.loadProfile(); }
  saveProfile(value: PortalProfileUpdate, version: number): Observable<Profile> {
    return this.security.saveProfile(value, version);
  }
}

export function providePortalSecurityBoundary(): Provider {
  return { provide: PORTAL_SECURITY_BOUNDARY, useClass: PortalSecurityBoundaryAdapter };
}
