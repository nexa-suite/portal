import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';

import { PORTAL_RUNTIME_CONFIG } from '../../../../core/security/runtime-config';
import { PortalAuthPort } from '../../application/portal-auth.port';
import {
  normalizeWorkspaceSlug,
  type SignInCredentials,
  type WorkspacePreview,
} from '../../domain/portal-access.models';
import { mockPortalAuthFixture, MockPortalAuthFixture } from './mock-portal-auth.fixtures';
import { MockPortalIamStore } from './mock-portal-iam.store';

@Injectable({ providedIn: 'root' })
export class MockPortalAuthAdapter implements PortalAuthPort {
  private readonly config = inject(PORTAL_RUNTIME_CONFIG);
  private readonly fixture = mockPortalAuthFixture(this.config.tenantProfile);
  private readonly store = inject(MockPortalIamStore);
  private active = this.hasPersistedSession();
  private pendingChallengeId: string | null = null;

  signIn(credentials: SignInCredentials): Observable<unknown> {
    const valid = credentials.email.trim().toLowerCase() === this.fixture.email
      && this.store.matchesPassword(credentials.password)
      && normalizeWorkspaceSlug(credentials.workspaceSlug) === this.fixture.workspaceSlug;
    if (!valid) return throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' }));

    this.active = false;
    this.persistSession(false);
    this.pendingChallengeId = this.fixture.twoFactorChallenge.challengeId;
    return of({
      twoFactorRequired: true,
      challenge: this.fixture.twoFactorChallenge,
    });
  }

  workspacePreview(workspaceSlug: string): Observable<WorkspacePreview> {
    if (normalizeWorkspaceSlug(workspaceSlug) !== this.fixture.workspaceSlug) {
      return of({
        recognized: false,
        displayName: null,
        workspaceUrl: null,
        logoUrl: null,
        loginAvailable: false,
      });
    }
    return of(this.fixture.workspacePreview);
  }

  refresh(): Observable<unknown> {
    if (!this.active || !this.hasPersistedSession()) {
      return throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' }));
    }
    return of(this.sessionResponse());
  }

  currentSession(accessToken: string): Observable<unknown> {
    if (!this.active || !this.hasPersistedSession() || accessToken !== this.fixture.accessToken) {
      return throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' }));
    }
    return of(this.sessionResponse());
  }

  signOut(): Observable<unknown> {
    this.active = false;
    this.persistSession(false);
    this.pendingChallengeId = null;
    return of(undefined);
  }

  verifyTwoFactor(challengeId: string, code: string): Observable<unknown> {
    if (challengeId !== this.pendingChallengeId || code !== this.fixture.twoFactorCode) {
      return throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' }));
    }

    this.active = true;
    this.persistSession(true);
    this.pendingChallengeId = null;
    return of(this.sessionResponse());
  }

  private hasPersistedSession(): boolean {
    return typeof sessionStorage !== 'undefined'
      && sessionStorage.getItem('nexa.portal.session.active') === 'true';
  }

  private persistSession(active: boolean): void {
    if (typeof sessionStorage === 'undefined') return;
    if (active) sessionStorage.setItem('nexa.portal.session.active', 'true');
    else sessionStorage.removeItem('nexa.portal.session.active');
  }

  private sessionResponse(): Record<string, unknown> {
    const fixture: MockPortalAuthFixture = this.fixture;
    return {
      accessToken: fixture.accessToken,
      user: {
        userId: fixture.userId,
        email: fixture.email,
        displayName: fixture.displayName,
      },
      workspace: {
        workspaceSlug: fixture.workspaceSlug,
      },
      clientAccountId: fixture.clientAccountId,
      permissions: fixture.permissions,
      membership: {
        id: fixture.buyerMembershipId,
        clientAccountId: fixture.clientAccountId,
        workspaceSlug: fixture.workspaceSlug,
        roles: ['BUYER'],
        permissions: fixture.permissions,
        status: 'ACTIVE',
      },
      session: {
        userId: fixture.userId,
        displayName: fixture.displayName,
        email: fixture.email,
        workspaceSlug: fixture.workspaceSlug,
        roles: ['BUYER'],
        surface: 'PORTAL',
      },
    };
  }
}
