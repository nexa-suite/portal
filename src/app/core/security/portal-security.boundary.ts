/** Public boundary entrypoint for the upstream BC-01 security capability. */
export { PORTAL_SECURITY_BOUNDARY, PORTAL_SURFACE } from './portal-security.contract';
export type {
  PortalAuthStatus,
  PortalIdentity,
  PortalProfileUpdate,
  PortalSecurityBoundary,
  PortalSurface,
  SignInCredentials,
} from './portal-security.contract';
export { providePortalSecurityBoundary, PortalSecurityBoundaryAdapter } from './portal-security.adapter';
