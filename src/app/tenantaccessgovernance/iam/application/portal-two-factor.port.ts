import { Observable } from 'rxjs';

/** Application boundary for completing an already-issued Portal challenge. */
export interface PortalTwoFactorPort {
  verifyTwoFactor(challengeId: string, code: string): Observable<unknown>;
}
