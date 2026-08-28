import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable, Provider } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { PORTAL_AUTH_PORT } from '../application/portal-auth.port';
import type { PortalAuthPort } from '../application/portal-auth.port';
import { PortalTwoFactorUnavailableError, type SignInCredentials, type WorkspacePreview } from '../domain/portal-access.models';
import {
  portalApiUrl,
  PORTAL_RUNTIME_CONFIG,
  PortalRuntimeConfig,
} from '../../../core/security/runtime-config';
import { SKIP_AUTH, SKIP_REFRESH } from '../../../core/security/http-context.tokens';

@Injectable({ providedIn: 'root' })
export class PortalAuthApiClient implements PortalAuthPort {
  private readonly http = inject(HttpClient);
  private readonly config = inject(PORTAL_RUNTIME_CONFIG);

  signIn(credentials: SignInCredentials): Observable<unknown> {
    return this.http.post<unknown>(
      portalApiUrl(this.config, this.config.signInPath),
      {
        identifier: credentials.email,
        password: credentials.password,
        workspaceSlug: credentials.workspaceSlug,
        surface: 'PORTAL',
      },
      {
        context: new HttpContext().set(SKIP_AUTH, true).set(SKIP_REFRESH, true),
        withCredentials: true,
      },
    );
  }

  workspacePreview(workspaceSlug: string): Observable<WorkspacePreview> {
    return this.http.post<WorkspacePreview>(portalApiUrl(this.config, '/api/v1/auth/workspace-previews'), { workspaceSlug }, {
      context: new HttpContext().set(SKIP_AUTH, true).set(SKIP_REFRESH, true),
    });
  }

  refresh(): Observable<unknown> {
    return this.http.post<unknown>(
      portalApiUrl(this.config, this.config.refreshPath),
      null,
      {
        context: new HttpContext().set(SKIP_AUTH, true).set(SKIP_REFRESH, true),
        withCredentials: true,
      },
    );
  }

  currentSession(accessToken: string): Observable<unknown> {
    return this.http.get<unknown>(
      portalApiUrl(this.config, '/api/v1/session'),
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
  }

  signOut(): Observable<unknown> {
    return this.http.post<unknown>(
      portalApiUrl(this.config, this.config.signOutPath),
      null,
      {
        context: new HttpContext().set(SKIP_REFRESH, true),
        withCredentials: true,
      },
    );
  }

  verifyTwoFactor(_challengeId: string, _code: string): Observable<unknown> {
    // The current API contract has no second-factor verification endpoint.
    // Keep the application boundary explicit until that contract is published.
    return throwError(() => new PortalTwoFactorUnavailableError());
  }
}

export function providePortalAuthPort(): Provider {
  return { provide: PORTAL_AUTH_PORT, useExisting: PortalAuthApiClient };
}
