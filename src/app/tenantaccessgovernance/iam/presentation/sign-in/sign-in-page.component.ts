import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { BrandLogoComponent } from '../../../../shared/presentation/components/brand-logo/brand-logo.component';
import { NexaIconComponent } from '../../../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { PortalAuthStateService } from '../../application/portal-auth-state.service';
import { PortalAccessDeniedError } from '../../domain/portal-access.models';
import { Subject, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map, switchMap, timeout } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { safeReturnUrl } from '../../../../core/routing/portal.guards';
import { PORTAL_RUNTIME_CONFIG } from '../../../../core/security/runtime-config';
import { LanguageService } from '../../../../core/i18n/language.service';
import { SupportedLanguage } from '../../../../core/i18n/supported-language';

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
  imports: [BrandLogoComponent, NexaIconComponent, RouterLink, TranslatePipe],
  templateUrl: './sign-in-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignInPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly runtimeConfig = inject(PORTAL_RUNTIME_CONFIG);
  readonly auth = inject(PortalAuthStateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly previewInput = new Subject<string>();
  readonly languageService = inject(LanguageService);
  readonly preview = signal<{ recognized: boolean; displayName: string | null; workspaceUrl: string | null; logoUrl: string | null; loginAvailable: boolean } | null>(null);
  readonly previewLoading = signal(false);
  readonly previewError = signal<WorkspacePreviewErrorCode | null>(null);

  readonly email = signal('');
  readonly password = signal('');
  readonly workspaceSlug = signal<string>(this.runtimeConfig.dataMode === 'mock' ? this.runtimeConfig.tenantProfile : '');
  readonly submitted = signal(false);
  readonly validationError = signal<string | null>(null);
  readonly twoFactorCode = signal('');
  readonly passwordVisible = signal(false);
  readonly twoFactorCanSubmit = computed(() => /^\d{6}$/.test(this.twoFactorCode().trim()) && this.auth.status() !== 'verifying-two-factor');
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
  readonly formErrorMessage = computed(() => this.validationError() ?? this.errorMessage());

  constructor() {
    this.previewInput.pipe(
      debounceTime(250), distinctUntilChanged(), switchMap((slug) => {
        this.previewError.set(null);
        this.previewLoading.set(slug.length > 0);
        if (slug.length < 3) return of({ kind: 'value' as const, value: null });
        return this.auth.workspacePreview(slug).pipe(
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
      this.validationError.set(null);

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
    this.validationError.set(null);
    this[field].set(value);
  }

  submit(): void {
    this.submitted.set(true);
    this.validationError.set(null);
    if (this.auth.status() === 'two-factor-challenge') {
      this.submitTwoFactor();
      return;
    }
    if (this.auth.status() === 'authenticating') return;

    const workspaceSlug = this.workspaceSlug().trim().toLowerCase();
    if (!workspaceSlug || !this.email().trim() || !this.password()) {
      this.validationError.set('auth.signIn.required');
      return;
    }
    if (this.previewLoading()) {
      this.validationError.set('auth.signIn.workspacePreview.loading');
      return;
    }
    if (this.preview()?.recognized !== true || this.preview()?.loginAvailable !== true) {
      this.validationError.set('auth.signIn.workspacePreview.notFound');
      return;
    }

    this.auth
      .signIn({
        email: this.email().trim(),
        password: this.password(),
        workspaceSlug,
      })
      .subscribe({
        next: () => this.router.navigateByUrl(this.returnUrl()),
      });
  }

  onTwoFactorInput(event: Event): void {
    const value = event.target instanceof HTMLInputElement ? event.target.value : '';
    this.twoFactorCode.set(value.replace(/\D/g, '').slice(0, 6));
  }

  submitTwoFactor(): void {
    if (!this.twoFactorCanSubmit()) return;
    this.auth.verifyTwoFactor(this.twoFactorCode()).subscribe({
      next: () => this.router.navigateByUrl(this.returnUrl()),
      error: () => undefined,
    });
  }

  cancelTwoFactor(): void {
    this.twoFactorCode.set('');
    this.auth.cancelTwoFactorChallenge();
  }

  togglePassword(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  setLanguage(language: SupportedLanguage): void {
    this.languageService.setLanguage(language);
  }

  private returnUrl(): string {
    return safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
  }
}
