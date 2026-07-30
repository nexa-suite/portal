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
import { PortalAuthStateService } from './iam/application/portal-auth-state.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    providePortalRuntimeConfig(),
    provideHttpClient(
      withInterceptors([portalSurfaceInterceptor, accessTokenInterceptor, refreshInterceptor]),
    ),
    provideAppInitializer(() => inject(PortalAuthStateService).restore()),
    provideRouter(routes, withComponentInputBinding()),
    provideTranslateService({
      fallbackLang: 'en',
      lang: 'en',
      loader: provideTranslateHttpLoader({ prefix: './assets/i18n/', suffix: '.json' }),
    }),
  ],
};
