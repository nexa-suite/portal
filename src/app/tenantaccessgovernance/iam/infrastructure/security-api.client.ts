import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable, Provider } from '@angular/core';
import { Observable } from 'rxjs';
import { portalApiUrl, PORTAL_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import { SKIP_AUTH, SKIP_REFRESH } from '../../../core/security/http-context.tokens';
import { SECURITY_PORT } from '../application/security.port';
import type { SecurityPort, SecurityProfileUpdate } from '../application/security.port';
import type { ActiveSession, Profile } from '../domain/security.models';

@Injectable({ providedIn: 'root' })
export class SecurityApiClient implements SecurityPort {
  private readonly http = inject(HttpClient); private readonly config = inject(PORTAL_RUNTIME_CONFIG);
  private url(path: string): string { return portalApiUrl(this.config, path); }
  profile(): Observable<Profile> { return this.http.get<Profile>(this.url('/api/v1/me/profile')); }
  updateProfile(value: SecurityProfileUpdate, version: number): Observable<Profile> { return this.http.patch<Profile>(this.url('/api/v1/me/profile'), value, { headers: { 'If-Match': `"${version}"` } }); }
  changePassword(currentPassword: string, newPassword: string): Observable<void> { return this.http.post<void>(this.url('/api/v1/me/password-changes'), { currentPassword, newPassword }); }
  sessions(): Observable<{ sessions: ActiveSession[] }> { return this.http.get<{ sessions: ActiveSession[] }>(this.url('/api/v1/me/sessions')); }
  revokeSession(id: string): Observable<void> { return this.http.delete<void>(this.url(`/api/v1/me/sessions/${id}`)); }
  revokeOthers(): Observable<void> { return this.http.post<void>(this.url('/api/v1/me/session-revocations'), {}); }
  requestReset(email: string): Observable<{ message: string }> { return this.http.post<{ message: string }>(this.url('/api/v1/auth/password-reset-requests'), { email, surface: 'PORTAL' }, { context: new HttpContext().set(SKIP_AUTH, true).set(SKIP_REFRESH, true) }); }
  resetPassword(token: string, newPassword: string): Observable<void> { return this.http.post<void>(this.url('/api/v1/auth/password-resets'), { token, newPassword }, { context: new HttpContext().set(SKIP_AUTH, true).set(SKIP_REFRESH, true) }); }
}

export function provideSecurityPort(): Provider {
  return { provide: SECURITY_PORT, useExisting: SecurityApiClient };
}
