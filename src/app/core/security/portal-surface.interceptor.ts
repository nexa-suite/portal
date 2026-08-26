import { HttpInterceptorFn } from '@angular/common/http';
import { PORTAL_SURFACE } from './portal-security.contract';

export const portalSurfaceInterceptor: HttpInterceptorFn = (request, next) =>
  next(
    request.clone({
      setHeaders: { 'X-Nexa-Surface': PORTAL_SURFACE },
    }),
  );
