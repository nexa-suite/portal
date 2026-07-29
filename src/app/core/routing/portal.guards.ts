import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PortalAuthStateService } from '../../iam/application/portal-auth-state.service';

function safeReturnUrl(url: string): string {
  return url.startsWith('/') && !url.startsWith('//') ? url : '/portal/home';
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
  return router.createUrlTree([
    safeReturnUrl(typeof returnUrl === 'string' ? returnUrl : '/portal/home'),
  ]);
};

export const portalAccessGuard = portalAuthGuard;
export const buyerOnlyGuard = buyerRoleGuard;
