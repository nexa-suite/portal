import { Injectable, inject, signal } from '@angular/core';
import type { ActiveSession, Profile } from '../../domain/security.models';
import { PORTAL_RUNTIME_CONFIG } from '../../../../core/security/runtime-config';
import { mockPortalAuthFixture, MockPortalAuthFixture } from './mock-portal-auth.fixtures';

/** Shared in-memory state for the Portal IAM mock adapters. */
@Injectable({ providedIn: 'root' })
export class MockPortalIamStore {
  private readonly fixture: MockPortalAuthFixture;
  private readonly passwordState: ReturnType<typeof signal<string>>;
  private readonly profileState: ReturnType<typeof signal<Profile>>;
  private readonly sessionsState: ReturnType<typeof signal<readonly ActiveSession[]>>;

  constructor() {
    const config = inject(PORTAL_RUNTIME_CONFIG);
    this.fixture = mockPortalAuthFixture(config.tenantProfile);
    this.passwordState = signal(this.fixture.password);
    this.profileState = signal<Profile>({
      userId: this.fixture.userId,
      email: this.fixture.email,
      displayName: this.fixture.displayName,
      phone: null,
      preferredLanguage: 'es',
      timezone: 'America/Lima',
      version: 1,
    });
    this.sessionsState = signal<readonly ActiveSession[]>([{
      sessionId: `mock-${this.fixture.tenantProfile}-session`,
      surface: 'PORTAL',
      createdAt: '2026-08-26T00:00:00Z',
      lastSeenAt: '2026-08-26T00:00:00Z',
      expiresAt: '2026-08-27T00:00:00Z',
      current: true,
      deviceLabel: 'Portal mock browser',
      coarseIp: null,
    }]);
  }

  get authFixture(): MockPortalAuthFixture {
    return this.fixture;
  }

  get profile(): Profile {
    return this.profileState();
  }

  get sessions(): readonly ActiveSession[] {
    return this.sessionsState();
  }

  matchesPassword(value: string): boolean {
    return value === this.passwordState();
  }

  updateProfile(value: {
    readonly displayName: string;
    readonly phone: string;
    readonly preferredLanguage: string;
    readonly timezone: string;
  }, version: number): Profile | null {
    if (version !== this.profileState().version) return null;
    const updated: Profile = {
      ...this.profileState(),
      displayName: value.displayName.trim(),
      phone: value.phone.trim() || null,
      preferredLanguage: value.preferredLanguage.trim(),
      timezone: value.timezone.trim(),
      version: version + 1,
    };
    this.profileState.set(updated);
    return updated;
  }

  changePassword(currentPassword: string, newPassword: string): boolean {
    if (!this.matchesPassword(currentPassword)) return false;
    this.passwordState.set(newPassword);
    return true;
  }

  setPassword(newPassword: string): void {
    this.passwordState.set(newPassword);
  }

  removeSession(sessionId: string): void {
    this.sessionsState.update((items) => items.filter((item) => item.sessionId !== sessionId));
  }

  removeOtherSessions(): void {
    this.sessionsState.update((items) => items.filter((item) => item.current));
  }
}
