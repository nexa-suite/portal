import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { PortalAuthStateService } from '../../iam/application/portal-auth-state.service';
import { AUTH_RETRY, SKIP_REFRESH } from './http-context.tokens';

export const refreshInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(PortalAuthStateService);
  const router = inject(Router);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401)
        return throwError(() => error);
      if (
        request.context.get(SKIP_REFRESH) ||
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
          auth.clearSession();
          void router.navigateByUrl('/sign-in');
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
