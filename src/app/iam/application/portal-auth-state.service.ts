import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, finalize, map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { PortalAuthApiClient } from '../infrastructure/portal-auth-api.client';
import {
  PortalAuthStatus,
  PortalIdentity,
  PortalSession,
  SignInCredentials,
  toPortalSession,
} from '../domain/portal-access.models';

@Injectable({ providedIn: 'root' })
export class PortalAuthStateService {
  private readonly api = inject(PortalAuthApiClient);
  private readonly tokenState = signal<string | null>(null);
  private readonly identityState = signal<PortalIdentity | null>(null);
  private readonly statusState = signal<PortalAuthStatus>('signed-out');
  private readonly errorState = signal<unknown>(null);
  private refreshInFlight$: Observable<string> | null = null;

  readonly accessToken = this.tokenState.asReadonly();
  readonly identity = this.identityState.asReadonly();
  readonly status = this.statusState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly isAuthenticated = computed(
    () => this.statusState() === 'authenticated' && this.tokenState() !== null,
  );
  readonly canAccessBuyerPortal = computed(
    () => this.isAuthenticated() && this.identityState()?.role === 'BUYER',
  );

  signIn(credentials: SignInCredentials): Observable<void> {
    this.statusState.set('authenticating');
    this.errorState.set(null);

    return this.api.signIn(credentials).pipe(
      map((response) => toPortalSession(response)),
      tap((session) => this.acceptSession(session)),
      map(() => undefined),
      catchError((error: unknown) => {
        this.tokenState.set(null);
        this.identityState.set(null);
        this.statusState.set(
          error instanceof Error && error.name === 'PortalAccessDeniedError'
            ? 'forbidden'
            : 'error',
        );
        this.errorState.set(error);
        return throwError(() => error);
      }),
    );
  }

  restore(): Observable<void> {
    this.statusState.set('refreshing');
    this.errorState.set(null);
    return this.api.refresh().pipe(
      map((response) => toPortalSession(response)),
      switchMap((session) => this.api.currentSession(session.accessToken).pipe(
        map((current) => toPortalSession(current, session.identity, session.accessToken)),
      )),
      tap((session) => this.acceptSession(session)),
      map(() => undefined),
      catchError(() => {
        this.clearSession();
        return of(undefined);
      }),
    );
  }

  refreshAccessToken(): Observable<string> {
    if (!this.tokenState())
      return throwError(() => new Error('No active Portal session can be refreshed.'));
    if (this.refreshInFlight$) return this.refreshInFlight$;

    this.statusState.set('refreshing');
    this.refreshInFlight$ = this.api.refresh().pipe(
      map((response) => toPortalSession(response, this.identityState())),
      tap((session) => this.acceptSession(session)),
      map((session) => session.accessToken),
      catchError((error: unknown) => {
        this.clearSession();
        this.errorState.set(error);
        return throwError(() => error);
      }),
      finalize(() => {
        this.refreshInFlight$ = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    return this.refreshInFlight$;
  }

  signOut(): Observable<void> {
    if (!this.tokenState()) {
      this.clearSession();
      return of(undefined);
    }

    return this.api.signOut().pipe(
      map(() => undefined),
      catchError(() => of(undefined)),
      finalize(() => this.clearSession()),
    );
  }

  clearSession(): void {
    this.tokenState.set(null);
    this.identityState.set(null);
    this.statusState.set('signed-out');
    this.errorState.set(null);
    this.refreshInFlight$ = null;
  }

  private acceptSession(session: PortalSession): void {
    this.tokenState.set(session.accessToken);
    this.identityState.set(session.identity);
    this.statusState.set('authenticated');
    this.errorState.set(null);
  }
}
