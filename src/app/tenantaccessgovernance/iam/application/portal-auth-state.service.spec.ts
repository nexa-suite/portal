import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { of, forkJoin } from 'rxjs';
import { PORTAL_AUTH_PORT } from './portal-auth.port';
import { PortalAuthStateService } from './portal-auth-state.service';

describe('PortalAuthStateService', () => {
  const api = {
    signIn: vi.fn(),
    refresh: vi.fn(),
    signOut: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({
      providers: [PortalAuthStateService, { provide: PORTAL_AUTH_PORT, useValue: api }],
    });
  });

  it('keeps the access token and identity in signal state only', () => {
    api.signIn.mockReturnValue(
      of({
        id: 1,
        email: 'buyer@icisa.example',
        fullName: 'Buyer',
        roles: ['BUYER'],
        accessToken: 'token',
      }),
    );
    const service = TestBed.inject(PortalAuthStateService);

    service
      .signIn({ email: 'buyer@icisa.example', password: 'secret', workspaceSlug: 'icisa' })
      .subscribe();

    expect(service.isAuthenticated()).toBe(true);
    expect(service.accessToken()).toBe('token');
    expect(service.identity()?.roles).toContain('BUYER');
  });

  it('shares one refresh request between concurrent 401 recoveries', () => {
    api.signIn.mockReturnValue(
      of({
        id: 1,
        email: 'buyer@icisa.example',
        fullName: 'Buyer',
        roles: ['BUYER'],
        accessToken: 'old-token',
      }),
    );
    api.refresh.mockReturnValue(
      of({
        id: 1,
        email: 'buyer@icisa.example',
        fullName: 'Buyer',
        roles: ['BUYER'],
        accessToken: 'new-token',
      }),
    );
    const service = TestBed.inject(PortalAuthStateService);
    service
      .signIn({ email: 'buyer@icisa.example', password: 'secret', workspaceSlug: 'icisa' })
      .subscribe();

    forkJoin([service.refreshAccessToken(), service.refreshAccessToken()]).subscribe();

    expect(api.refresh).toHaveBeenCalledTimes(1);
    expect(service.accessToken()).toBe('new-token');
  });

  it('revokes the server session and clears the local state on logout', () => {
    api.signIn.mockReturnValue(
      of({
        id: 1,
        email: 'buyer@icisa.example',
        fullName: 'Buyer',
        roles: ['BUYER'],
        accessToken: 'token',
      }),
    );
    api.signOut.mockReturnValue(of(undefined));
    const service = TestBed.inject(PortalAuthStateService);
    service.signIn({ email: 'buyer@icisa.example', password: 'secret', workspaceSlug: 'icisa' }).subscribe();

    service.signOut().subscribe();

    expect(api.signOut).toHaveBeenCalledTimes(1);
    expect(service.status()).toBe('signed-out');
    expect(service.accessToken()).toBeNull();
  });
});
