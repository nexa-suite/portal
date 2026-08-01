import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { SecurityApiClient } from '../infrastructure/security-api.client';
import { SecurityFacade } from './security.facade';

const profile = { userId: 'buyer-1', email: 'buyer@icisa.example', displayName: 'Buyer', phone: null, preferredLanguage: 'es', timezone: 'America/Lima', version: 1 };
const sessions = { sessions: [
  { sessionId: 'current', surface: 'PORTAL', createdAt: '2026-08-01T00:00:00Z', lastSeenAt: '2026-08-01T01:00:00Z', expiresAt: '2026-08-02T00:00:00Z', current: true, deviceLabel: 'Browser', coarseIp: null },
  { sessionId: 'other', surface: 'PORTAL', createdAt: '2026-07-31T00:00:00Z', lastSeenAt: '2026-07-31T01:00:00Z', expiresAt: '2026-08-02T00:00:00Z', current: false, deviceLabel: 'Phone', coarseIp: null },
] };

describe('SecurityFacade', () => {
  const api = {
    profile: vi.fn(), updateProfile: vi.fn(), changePassword: vi.fn(), sessions: vi.fn(), revokeSession: vi.fn(), revokeOthers: vi.fn(),
    requestReset: vi.fn(), resetPassword: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    api.profile.mockReturnValue(of(profile));
    api.updateProfile.mockReturnValue(of({ ...profile, displayName: 'Updated', version: 2 }));
    api.changePassword.mockReturnValue(of(undefined));
    api.sessions.mockReturnValue(of(sessions));
    api.revokeSession.mockReturnValue(of(undefined));
    api.revokeOthers.mockReturnValue(of(undefined));
    api.requestReset.mockReturnValue(of({ message: 'generic' }));
    api.resetPassword.mockReturnValue(of(undefined));
    TestBed.configureTestingModule({ providers: [SecurityFacade, { provide: SecurityApiClient, useValue: api }] });
  });

  it('loads and updates the Buyer profile with If-Match version', () => {
    const facade = TestBed.inject(SecurityFacade);
    facade.loadProfile().subscribe();
    facade.saveProfile({ displayName: 'Updated', phone: '', preferredLanguage: 'es', timezone: 'America/Lima' }, 1).subscribe();
    expect(api.updateProfile).toHaveBeenCalledWith({ displayName: 'Updated', phone: '', preferredLanguage: 'es', timezone: 'America/Lima' }, 1);
    expect(facade.profile()?.displayName).toBe('Updated');
  });

  it('loads and revokes only Buyer-owned sessions', () => {
    const facade = TestBed.inject(SecurityFacade);
    facade.loadSessions().subscribe();
    facade.revokeSession('other').subscribe();
    expect(facade.sessions().map((item) => item.sessionId)).toEqual(['current']);
    facade.loadSessions().subscribe();
    facade.revokeOthers().subscribe();
    expect(facade.sessions().map((item) => item.sessionId)).toEqual(['current']);
  });

  it('keeps generic recovery, reset and password-change states translated', () => {
    const facade = TestBed.inject(SecurityFacade);
    facade.changePassword('current', 'new-password-long-enough').subscribe();
    expect(facade.message()).toBe('iamSecurity.passwordChanged');
    facade.requestReset('unknown@example.invalid').subscribe();
    expect(facade.message()).toBe('iamSecurity.resetRequested');
    facade.resetPassword('opaque-token', 'new-password-long-enough').subscribe();
    expect(facade.message()).toBe('iamSecurity.resetCompleted');
  });

  it('exposes a recoverable error without leaking backend details', () => {
    api.sessions.mockReturnValue(throwError(() => new Error('secret backend detail')));
    const facade = TestBed.inject(SecurityFacade);
    facade.loadSessions().subscribe({ error: () => undefined });
    expect(facade.error()).toBe('iamSecurity.error');
    expect(facade.error()).not.toContain('secret');
  });
});
