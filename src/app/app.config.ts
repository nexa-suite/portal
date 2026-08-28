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
import { provideChangeFeedAdapter, provideNotificationsApiAdapter, providePaymentElementAdapter, providePortalAuthAdapter, provideSecurityAdapter } from './core/compositions/portal/data-mode.providers';
import { PurchaseRequestCartPort } from './salescommitment/application/ports/purchase-request-cart.port';
import { PurchaseRequestCartStoragePort } from './salescommitment/application/ports/purchase-request-cart-storage.port';
import { PurchaseRequestCartService } from './salescommitment/application/buyer-requests/purchase-request-cart.service';
import { BrowserPurchaseRequestCartStorageAdapter } from './salescommitment/infrastructure/buyer-requests/browser-purchase-request-cart-storage.adapter';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    providePortalRuntimeConfig(),
    provideHttpClient(
      withInterceptors([portalSurfaceInterceptor, accessTokenInterceptor, refreshInterceptor]),
    ),
    providePortalAuthAdapter(),
    provideSecurityAdapter(),
    providePortalSecurityBoundary(),
    provideChangeFeedAdapter(),
    provideNotificationsApiAdapter(),
    providePaymentElementAdapter(),
    PurchaseRequestCartService,
    BrowserPurchaseRequestCartStorageAdapter,
    { provide: PurchaseRequestCartPort, useExisting: PurchaseRequestCartService },
    { provide: PurchaseRequestCartStoragePort, useExisting: BrowserPurchaseRequestCartStorageAdapter },
    provideAppInitializer(() => inject(PORTAL_SECURITY_BOUNDARY).restore()),
    provideRouter(routes, withComponentInputBinding()),
    provideTranslateService({
      fallbackLang: 'en',
      lang: 'en',
      loader: provideTranslateHttpLoader({ prefix: './assets/i18n/', suffix: '.json' }),
    }),
  ],
};
