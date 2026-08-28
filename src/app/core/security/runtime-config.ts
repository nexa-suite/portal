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
  readonly dataMode: PortalDataMode;
  readonly tenantProfile: TenantProfile;
}

export type PortalDataMode = 'api' | 'mock';
export type TenantProfile = 'generic' | 'icisa';

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
  dataMode: 'api',
  tenantProfile: 'generic',
};

export const PORTAL_RUNTIME_CONFIG = new InjectionToken<PortalRuntimeConfig>(
  'PORTAL_RUNTIME_CONFIG',
);
const LOCAL_RUNTIME_STORAGE_KEY = 'nexa.portal.local-runtime';

type RuntimeGlobal = typeof globalThis & {
  __NEXA_RUNTIME_CONFIG__?: (Partial<PortalRuntimeConfig> & { readonly apiBase?: string }) | null;
};

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function dataModeValue(value: unknown): PortalDataMode {
  return typeof value === 'string' && value.trim().toLowerCase() === 'mock' ? 'mock' : 'api';
}

function tenantProfileValue(value: unknown): TenantProfile {
  return typeof value === 'string' && value.trim().toLowerCase() === 'icisa' ? 'icisa' : 'generic';
}

function localQueryRuntimeConfig(): Partial<PortalRuntimeConfig> {
  const location = globalThis.location;
  if (!location || !['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)) return {};
  const params = new URLSearchParams(location.search);
  const stored = readLocalRuntimeConfig();
  const hasExplicitOverride = params.has('nexaDataMode') || params.has('nexaTenantProfile');
  const resolved = {
    dataMode: params.has('nexaDataMode')
      ? params.get('nexaDataMode') === 'mock' ? 'mock' : 'api'
      : stored?.dataMode ?? 'api',
    tenantProfile: params.has('nexaTenantProfile')
      ? params.get('nexaTenantProfile') === 'icisa' ? 'icisa' : 'generic'
      : stored?.tenantProfile ?? 'generic',
  } as const;
  if (hasExplicitOverride) writeLocalRuntimeConfig(resolved);
  return resolved;
}

function readLocalRuntimeConfig(): Pick<PortalRuntimeConfig, 'dataMode' | 'tenantProfile'> | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(LOCAL_RUNTIME_STORAGE_KEY) ?? 'null');
    if (!value || typeof value !== 'object') return null;
    const record = value as Record<string, unknown>;
    return {
      dataMode: record['dataMode'] === 'mock' ? 'mock' : 'api',
      tenantProfile: record['tenantProfile'] === 'icisa' ? 'icisa' : 'generic',
    };
  } catch {
    return null;
  }
}

function writeLocalRuntimeConfig(value: Pick<PortalRuntimeConfig, 'dataMode' | 'tenantProfile'>): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(LOCAL_RUNTIME_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Browser storage can be unavailable in privacy-restricted contexts.
  }
}

export function resolvePortalRuntimeConfig(): PortalRuntimeConfig {
  const runtime = {
    ...localQueryRuntimeConfig(),
    ...((globalThis as RuntimeGlobal).__NEXA_RUNTIME_CONFIG__ ?? {}),
  };
  const apiBaseUrl = stringValue(
    runtime?.apiBaseUrl ?? runtime?.apiBase,
    DEFAULT_RUNTIME_CONFIG.apiBaseUrl,
  );
  return {
    apiBaseUrl: trimTrailingSlash(apiBaseUrl),
    signInPath: stringValue(runtime?.signInPath, DEFAULT_RUNTIME_CONFIG.signInPath),
    refreshPath: stringValue(runtime?.refreshPath, DEFAULT_RUNTIME_CONFIG.refreshPath),
    signOutPath: stringValue(runtime?.signOutPath, DEFAULT_RUNTIME_CONFIG.signOutPath),
    catalogPath: stringValue(runtime?.catalogPath, DEFAULT_RUNTIME_CONFIG.catalogPath),
    pricingPreviewPath: stringValue(
      runtime?.pricingPreviewPath,
      DEFAULT_RUNTIME_CONFIG.pricingPreviewPath ?? '',
    ),
    dataMode: dataModeValue(runtime?.dataMode),
    tenantProfile: tenantProfileValue(runtime?.tenantProfile),
    surface: PORTAL_SURFACE,
  };
}

export function providePortalRuntimeConfig(): Provider {
  return { provide: PORTAL_RUNTIME_CONFIG, useFactory: resolvePortalRuntimeConfig };
}

export function portalApiUrl(config: PortalRuntimeConfig, path: string): string {
  return `${config.apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}
