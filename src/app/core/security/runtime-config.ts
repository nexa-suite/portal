import { InjectionToken, Provider } from '@angular/core';
import { PORTAL_SURFACE, PortalSurface } from '../../iam/domain/portal-access.models';

export interface PortalRuntimeConfig {
  readonly apiBaseUrl: string;
  readonly signInPath: string;
  readonly refreshPath: string;
  readonly signOutPath: string;
  readonly catalogPath: string;
  readonly surface: PortalSurface;
}

const DEFAULT_RUNTIME_CONFIG: PortalRuntimeConfig = {
  apiBaseUrl: 'http://localhost:8081',
  signInPath: '/api/v1/authentication/sign-in',
  refreshPath: '/api/v1/authentication/refresh',
  signOutPath: '/api/v1/authentication/sign-out',
  catalogPath: '/api/v1/catalog-items',
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
