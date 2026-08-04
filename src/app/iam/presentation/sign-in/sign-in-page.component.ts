import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { BrandLogoComponent } from '../../../shared/presentation/components/brand-logo/brand-logo.component';
import { PortalAuthStateService } from '../../application/portal-auth-state.service';
import { PortalAccessDeniedError } from '../../domain/portal-access.models';
import { PortalAuthApiClient } from '../../infrastructure/portal-auth-api.client';
import { Subject, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { safeReturnUrl } from '../../../core/routing/portal.guards';

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

  readonly email = signal('');
  readonly password = signal('');
  readonly workspaceSlug = signal('icisa');
  readonly submitted = signal(false);
  readonly canSubmit = computed(
    () =>
      this.email().trim().length > 0 &&
      this.password().length > 0 &&
      this.workspaceSlug().trim().length > 0,
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
        this.previewLoading.set(slug.length > 0);
        return slug.length >= 3 ? this.api.workspacePreview(slug).pipe(catchError(() => of({ recognized: false, displayName: null, workspaceUrl: null, logoUrl: null, loginAvailable: false }))) : of(null);
      }), takeUntilDestroyed(this.destroyRef),
    ).subscribe((value) => { this.previewLoading.set(false); this.preview.set(value); });
    this.previewInput.next(this.workspaceSlug());
  }

  onValue(field: 'email' | 'password' | 'workspaceSlug', event: Event): void {
    const value = event.target instanceof HTMLInputElement ? event.target.value : '';
    this[field].set(value);
    if (field === 'workspaceSlug') this.previewInput.next(value.trim().toLowerCase());
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
