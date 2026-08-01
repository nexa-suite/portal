import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { PortalAuthStateService } from '../../iam/application/portal-auth-state.service';
import { isPublicIdentityRequest, SKIP_AUTH } from './http-context.tokens';

export const accessTokenInterceptor: HttpInterceptorFn = (request, next) => {
  if (request.context.get(SKIP_AUTH) || isPublicIdentityRequest(request.url)) return next(request);

  const token = inject(PortalAuthStateService).accessToken();
  if (!token) return next(request);

  return next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
