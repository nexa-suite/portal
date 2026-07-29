import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SignInCredentials } from '../domain/portal-access.models';
import {
  portalApiUrl,
  PORTAL_RUNTIME_CONFIG,
  PortalRuntimeConfig,
} from '../../core/security/runtime-config';
import { SKIP_AUTH, SKIP_REFRESH } from '../../core/security/http-context.tokens';

@Injectable({ providedIn: 'root' })
export class PortalAuthApiClient {
  private readonly http = inject(HttpClient);
  private readonly config = inject(PORTAL_RUNTIME_CONFIG);

  signIn(credentials: SignInCredentials): Observable<unknown> {
    return this.http.post<unknown>(
      portalApiUrl(this.config, this.config.signInPath),
      {
        email: credentials.email,
        username: credentials.email,
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

  refresh(): Observable<unknown> {
    return this.http.post<unknown>(
      portalApiUrl(this.config, this.config.refreshPath),
      {},
      {
        context: new HttpContext().set(SKIP_AUTH, true).set(SKIP_REFRESH, true),
        withCredentials: true,
      },
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
}
