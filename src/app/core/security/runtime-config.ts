import { InjectionToken, Provider } from '@angular/core';
import { PORTAL_SURFACE } from './portal-security.contract';
import type { PortalSurface } from './portal-security.contract';

export interface PortalRuntimeConfig {
  readonly apiBaseUrl: string;
  readonly signInPath: string;
  readonly refreshPath: string;
  readonly signOutPath: string;
  readonly catalogPath: string;
  readonly pricingPreviewPath?: string;
  readonly surface: PortalSurface;
}

const DEFAULT_RUNTIME_CONFIG: PortalRuntimeConfig = {
  // Frontends are served by the same origin as the API proxy in production
  // and in the local Docker topology. An absolute URL is still supported as
  // an explicit runtime override for isolated development.
  apiBaseUrl: '',
  signInPath: '/api/v1/authentication/sign-in',
  refreshPath: '/api/v1/authentication/refresh',
  signOutPath: '/api/v1/authentication/sign-out',
  catalogPath: '/api/v1/catalog-items',
  pricingPreviewPath: '/api/v1/catalog/pricing-preview',
  surface: PORTAL_SURFACE,
};

export const PORTAL_RUNTIME_CONFIG = new InjectionToken<PortalRuntimeConfig>(
  'PORTAL_RUNTIME_CONFIG',
);

type RuntimeGlobal = typeof globalThis & {
  __NEXA_RUNTIME_CONFIG__?: Partial<PortalRuntimeConfig> & { readonly apiBase?: string };
};

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

export function resolvePortalRuntimeConfig(): PortalRuntimeConfig {
  const runtime = (globalThis as RuntimeGlobal).__NEXA_RUNTIME_CONFIG__;
  const apiBaseUrl = runtime?.apiBaseUrl ?? runtime?.apiBase ?? DEFAULT_RUNTIME_CONFIG.apiBaseUrl;
  return {
    ...DEFAULT_RUNTIME_CONFIG,
    ...runtime,
    apiBaseUrl: trimTrailingSlash(apiBaseUrl),
    surface: PORTAL_SURFACE,
  };
}

export function providePortalRuntimeConfig(): Provider {
  return { provide: PORTAL_RUNTIME_CONFIG, useFactory: resolvePortalRuntimeConfig };
}

export function portalApiUrl(config: PortalRuntimeConfig, path: string): string {
  return `${config.apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}
