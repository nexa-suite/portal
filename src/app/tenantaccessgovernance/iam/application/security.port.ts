import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import type { ActiveSession, Profile } from '../domain/security.models';

export interface SecurityProfileUpdate {
  readonly displayName: string;
  readonly phone: string;
  readonly preferredLanguage: string;
  readonly timezone: string;
}

/** Inbound application contract for the IAM security HTTP adapter. */
export interface SecurityPort {
  profile(): Observable<Profile>;
  updateProfile(value: SecurityProfileUpdate, version: number): Observable<Profile>;
  changePassword(currentPassword: string, newPassword: string): Observable<void>;
  sessions(): Observable<{ readonly sessions: ActiveSession[] }>;
  revokeSession(id: string): Observable<void>;
  revokeOthers(): Observable<void>;
  requestReset(email: string): Observable<{ readonly message: string }>;
  resetPassword(token: string, newPassword: string): Observable<void>;
}

export const SECURITY_PORT = new InjectionToken<SecurityPort>('SECURITY_PORT');
