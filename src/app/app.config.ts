import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { routes } from './app.routes';
import { providePortalRuntimeConfig } from './core/security/runtime-config';
import { accessTokenInterceptor } from './core/security/access-token.interceptor';
import { portalSurfaceInterceptor } from './core/security/portal-surface.interceptor';
import { refreshInterceptor } from './core/security/refresh.interceptor';
import { providePortalSecurityBoundary, PORTAL_SECURITY_BOUNDARY } from './core/security/portal-security.boundary';
import { CHANGE_FEED_FETCH_PORT } from './core/change-feed/application/change-feed-fetch.port';
import { ChangeFeedFetchClient } from './core/change-feed/infrastructure/change-feed-fetch.client';
import { providePortalAuthPort } from './tenantaccessgovernance/iam/infrastructure/portal-auth-api.client';
import { provideSecurityPort } from './tenantaccessgovernance/iam/infrastructure/security-api.client';
import { NotificationsApiPort } from './notifications/application/ports/notifications-api.port';
import { NotificationsApiClient } from './notifications/infrastructure/notifications-api.client';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    providePortalRuntimeConfig(),
    provideHttpClient(
      withInterceptors([portalSurfaceInterceptor, accessTokenInterceptor, refreshInterceptor]),
    ),
    providePortalAuthPort(),
    provideSecurityPort(),
    providePortalSecurityBoundary(),
    { provide: CHANGE_FEED_FETCH_PORT, useExisting: ChangeFeedFetchClient },
    { provide: NotificationsApiPort, useExisting: NotificationsApiClient },
    provideAppInitializer(() => inject(PORTAL_SECURITY_BOUNDARY).restore()),
    provideRouter(routes, withComponentInputBinding()),
    provideTranslateService({
      fallbackLang: 'en',
      lang: 'en',
      loader: provideTranslateHttpLoader({ prefix: './assets/i18n/', suffix: '.json' }),
    }),
  ],
};
