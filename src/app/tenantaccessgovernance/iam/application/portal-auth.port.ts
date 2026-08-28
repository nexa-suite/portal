import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import type { PortalTwoFactorPort } from './portal-two-factor.port';
import type { SignInCredentials, WorkspacePreview } from '../domain/portal-access.models';

/** Inbound application contract for the IAM HTTP adapter. */
export interface PortalAuthPort extends PortalTwoFactorPort {
  signIn(credentials: SignInCredentials): Observable<unknown>;
  workspacePreview(workspaceSlug: string): Observable<WorkspacePreview>;
  refresh(): Observable<unknown>;
  currentSession(accessToken: string): Observable<unknown>;
  signOut(): Observable<unknown>;
}

export const PORTAL_AUTH_PORT = new InjectionToken<PortalAuthPort>('PORTAL_AUTH_PORT');
