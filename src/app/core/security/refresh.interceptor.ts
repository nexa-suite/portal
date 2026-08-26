import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AUTH_RETRY, isPublicIdentityRequest, SKIP_REFRESH } from './http-context.tokens';
import { PORTAL_SECURITY_BOUNDARY } from './portal-security.boundary';

export const refreshInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(PORTAL_SECURITY_BOUNDARY);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401)
        return throwError(() => error);
      if (
        request.context.get(SKIP_REFRESH) || isPublicIdentityRequest(request.url) ||
        request.context.get(AUTH_RETRY) ||
        !auth.accessToken()
      ) {
        return throwError(() => error);
      }

      return auth.refreshAccessToken().pipe(
        switchMap((token) =>
          next(
            request.clone({
              context: request.context.set(AUTH_RETRY, true),
              setHeaders: { Authorization: `Bearer ${token}` },
            }),
          ),
        ),
        catchError((refreshError: unknown) => {
          auth.expireSession();
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
