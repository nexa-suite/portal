import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { BrandLogoComponent } from '../../../shared/presentation/components/brand-logo/brand-logo.component';
import { PortalAuthStateService } from '../../application/portal-auth-state.service';
import { PortalAccessDeniedError } from '../../domain/portal-access.models';
import { PortalAuthApiClient } from '../../infrastructure/portal-auth-api.client';
import { Subject, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map, switchMap, timeout } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { safeReturnUrl } from '../../../core/routing/portal.guards';

export type WorkspacePreviewErrorCode =
  | 'notFound'
  | 'origin'
  | 'rateLimited'
  | 'server'
  | 'network'
  | 'timeout'
  | 'invalid';

export function classifyWorkspacePreviewError(error: unknown): WorkspacePreviewErrorCode {
  if (error && typeof error === 'object' && 'name' in error && error.name === 'TimeoutError') return 'timeout';
  if (error instanceof HttpErrorResponse) {
    if (error.status === 404) return 'notFound';
    if (error.status === 403) return 'origin';
    if (error.status === 429) return 'rateLimited';
    if (error.status >= 500) return 'server';
    if (error.status === 0) return 'network';
    return 'invalid';
  }
  return 'network';
}

@Component({
  selector: 'nexa-sign-in-page',
  imports: [BrandLogoComponent, RouterLink, TranslatePipe],
  templateUrl: './sign-in-page.component.html',
  styleUrl: './sign-in-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignInPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly auth = inject(PortalAuthStateService);
  private readonly api = inject(PortalAuthApiClient);
  private readonly destroyRef = inject(DestroyRef);
  private readonly previewInput = new Subject<string>();
  readonly preview = signal<{ recognized: boolean; displayName: string | null; workspaceUrl: string | null; logoUrl: string | null; loginAvailable: boolean } | null>(null);
  readonly previewLoading = signal(false);
  readonly previewError = signal<WorkspacePreviewErrorCode | null>(null);

  readonly email = signal('');
  readonly password = signal('');
  readonly workspaceSlug = signal('icisa');
  readonly submitted = signal(false);
  readonly canSubmit = computed(
    () =>
      this.email().trim().length > 0 &&
      this.password().length > 0 &&
      this.workspaceSlug().trim().length > 0 &&
      this.preview()?.recognized === true &&
      this.preview()?.loginAvailable === true &&
      !this.previewLoading(),
  );
  readonly errorMessage = computed(() => {
    const error = this.auth.error();
    if (error instanceof PortalAccessDeniedError) return 'auth.signIn.buyerOnly';
    if (error instanceof HttpErrorResponse && error.status === 401)
      return 'auth.signIn.invalidCredentials';
    return error ? 'auth.signIn.unavailable' : null;
  });

  constructor() {
    this.previewInput.pipe(
      debounceTime(250), distinctUntilChanged(), switchMap((slug) => {
        this.previewError.set(null);
        this.previewLoading.set(slug.length > 0);
        if (slug.length < 3) return of({ kind: 'value' as const, value: null });
        return this.api.workspacePreview(slug).pipe(
          timeout({ first: 5000 }),
          map((value) => ({ kind: 'value' as const, value })),
          catchError((error: unknown) => of({ kind: 'error' as const, error })),
        );
      }), takeUntilDestroyed(this.destroyRef),
    ).subscribe((result) => {
      this.previewLoading.set(false);
      if (result.kind === 'error') {
        this.preview.set(null);
        this.previewError.set(classifyWorkspacePreviewError(result.error));
        return;
      }
      this.preview.set(result.value);
    });
    this.previewInput.next(this.workspaceSlug());
  }

  onValue(field: 'email' | 'password' | 'workspaceSlug', event: Event): void {
    const value = event.target instanceof HTMLInputElement ? event.target.value : '';
    if (field === 'workspaceSlug') {
      const previousSlug = this.workspaceSlug().trim().toLowerCase();
      const normalizedSlug = value.trim().toLowerCase();
      this.workspaceSlug.set(value);

      // Rewriting the same normalized slug (for example, Playwright filling
      // the default value) must not discard a valid preview. A changed slug
      // still invalidates the preview and starts a fresh server lookup.
      if (normalizedSlug === previousSlug
        && (this.previewLoading() || this.preview()?.recognized === true)) return;

      this.preview.set(null);
      this.previewError.set(null);
      this.previewInput.next(normalizedSlug);
      return;
    }
    this[field].set(value);
  }

  submit(): void {
    this.submitted.set(true);
    if (!this.canSubmit() || this.auth.status() === 'authenticating') return;

    this.auth
      .signIn({
        email: this.email().trim(),
        password: this.password(),
        workspaceSlug: this.workspaceSlug().trim().toLowerCase(),
      })
      .subscribe({
        next: () => this.router.navigateByUrl(this.returnUrl()),
      });
  }

  private returnUrl(): string {
    return safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
  }
}
