import { HttpContextToken } from '@angular/common/http';

export const SKIP_AUTH = new HttpContextToken<boolean>(() => false);
export const SKIP_REFRESH = new HttpContextToken<boolean>(() => false);
export const AUTH_RETRY = new HttpContextToken<boolean>(() => false);

export function isPublicIdentityRequest(url: string): boolean {
  return /\/api\/v1\/(authentication\/(sign-in|refresh|sign-out)|auth\/password-reset-(requests|resets))$/.test(url);
}
