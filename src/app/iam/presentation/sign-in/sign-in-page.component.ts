import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { BrandLogoComponent } from '../../../shared/presentation/components/brand-logo/brand-logo.component';
import { PortalAuthStateService } from '../../application/portal-auth-state.service';
import { PortalAccessDeniedError } from '../../domain/portal-access.models';

@Component({
  selector: 'nexa-sign-in-page',
  imports: [BrandLogoComponent, TranslatePipe],
  templateUrl: './sign-in-page.component.html',
  styleUrl: './sign-in-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignInPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly auth = inject(PortalAuthStateService);

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

  onValue(field: 'email' | 'password' | 'workspaceSlug', event: Event): void {
    const value = event.target instanceof HTMLInputElement ? event.target.value : '';
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
    const value = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/portal/home';
    return value.startsWith('/') && !value.startsWith('//') ? value : '/portal/home';
  }
}
