import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { isPublicIdentityRequest, SKIP_AUTH } from './http-context.tokens';
import { PORTAL_SECURITY_BOUNDARY } from './portal-security.boundary';

export const accessTokenInterceptor: HttpInterceptorFn = (request, next) => {
  if (request.context.get(SKIP_AUTH) || isPublicIdentityRequest(request.url)) return next(request);

  const token = inject(PORTAL_SECURITY_BOUNDARY).accessToken();
  if (!token) return next(request);

  return next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
