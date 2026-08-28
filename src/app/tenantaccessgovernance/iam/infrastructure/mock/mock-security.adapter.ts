import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { MockPortalIamStore } from './mock-portal-iam.store';
import type { SecurityPort, SecurityProfileUpdate } from '../../application/security.port';
import type { ActiveSession, Profile } from '../../domain/security.models';

/** Mock counterpart of the published IAM security contract used by local flows. */
@Injectable({ providedIn: 'root' })
export class MockSecurityAdapter implements SecurityPort {
  private readonly store = inject(MockPortalIamStore);

  profile(): Observable<Profile> {
    return of(this.store.profile);
  }

  updateProfile(value: SecurityProfileUpdate, version: number): Observable<Profile> {
    const updated = this.store.updateProfile(value, version);
    return updated ? of(updated) : throwError(() => new Error('PROFILE_VERSION_CONFLICT'));
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.store.changePassword(currentPassword, newPassword)
      ? of(undefined)
      : throwError(() => new Error('PASSWORD_CHANGE_FAILED'));
  }

  sessions(): Observable<{ readonly sessions: ActiveSession[] }> {
    return of({ sessions: [...this.store.sessions] });
  }

  revokeSession(id: string): Observable<void> {
    this.store.removeSession(id);
    return of(undefined);
  }

  revokeOthers(): Observable<void> {
    this.store.removeOtherSessions();
    return of(undefined);
  }

  requestReset(_email: string): Observable<{ readonly message: string }> {
    return of({ message: 'RESET_REQUEST_ACCEPTED' });
  }

  resetPassword(_token: string, newPassword: string): Observable<void> {
    this.store.setPassword(newPassword);
    return of(undefined);
  }
}
