import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PortalAuthStateService } from '../../iam/application/portal-auth-state.service';

export function safeReturnUrl(url: string | null | undefined): string {
  if (typeof url !== 'string') return '/portal/home';

  const candidate = url.trim();
  if (!candidate.startsWith('/') || candidate.startsWith('//')) return '/portal/home';

  let decoded: string;
  try {
    decoded = decodeURIComponent(candidate);
  } catch {
    return '/portal/home';
  }

  if (decoded.startsWith('//') || decoded.includes('\\') || /[\u0000-\u001f\u007f]/.test(decoded)) {
    return '/portal/home';
  }

  let normalizedPathname: string;
  try {
    const parsed = new URL(candidate, 'http://nexa.internal');
    if (parsed.origin !== 'http://nexa.internal' || !parsed.pathname.startsWith('/') || parsed.pathname.startsWith('//')) {
      return '/portal/home';
    }
    normalizedPathname = parsed.pathname;
  } catch {
    return '/portal/home';
  }

  if (/^\/(sign-in|forbidden)(?:\/|\?|$)/.test(decoded)
      || /^\/(sign-in|forbidden)(?:\/|$)/.test(normalizedPathname)) return '/portal/home';
  return candidate;
}

export const portalAuthGuard: CanActivateFn = (_route, state) => {
  const auth = inject(PortalAuthStateService);
  const router = inject(Router);
  return auth.isAuthenticated()
    ? true
    : router.createUrlTree(['/sign-in'], { queryParams: { returnUrl: safeReturnUrl(state.url) } });
};

export const buyerRoleGuard: CanActivateFn = (_route, state) => {
  const auth = inject(PortalAuthStateService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/sign-in'], {
      queryParams: { returnUrl: safeReturnUrl(state.url) },
    });
  }
  return auth.canAccessBuyerPortal()
    ? true
    : router.createUrlTree(['/forbidden'], {
        queryParams: { returnUrl: safeReturnUrl(state.url) },
      });
};

export const publicOnlyGuard: CanActivateFn = (_route, state) => {
  const auth = inject(PortalAuthStateService);
  const router = inject(Router);
  if (!auth.canAccessBuyerPortal()) return true;
  const returnUrl = state.root.queryParams['returnUrl'];
  return router.parseUrl(safeReturnUrl(typeof returnUrl === 'string' ? returnUrl : '/portal/home'));
};

export const portalAccessGuard = portalAuthGuard;
export const buyerOnlyGuard = buyerRoleGuard;

export function buyerPermissionGuard(permission: string): CanActivateFn {
  return (_route, state) => {
    const auth = inject(PortalAuthStateService);
    const router = inject(Router);
    if (!auth.isAuthenticated()) return router.createUrlTree(['/sign-in'], { queryParams: { returnUrl: safeReturnUrl(state.url) } });
    return auth.hasPermission(permission) ? true : router.createUrlTree(['/forbidden'], { queryParams: { returnUrl: safeReturnUrl(state.url) } });
  };
}
