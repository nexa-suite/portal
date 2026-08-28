import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { BuyerProfileContextFacade } from '../../../../core/compositions/portal/buyer-profile-context.facade';
import { NexaIconComponent } from '../../../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { PORTAL_SECURITY_BOUNDARY } from '../../../../core/security/portal-security.boundary';
import { SecurityFacade } from '../../application/security.facade';

@Component({
  selector: 'nexa-buyer-profile-page',
  standalone: true,
  imports: [NexaIconComponent, ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './buyer-profile-page.component.html',
  styleUrl: './buyer-profile-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuyerProfilePageComponent {
  readonly facade = inject(SecurityFacade);
  readonly auth = inject(PORTAL_SECURITY_BOUNDARY);
  private readonly context = inject(BuyerProfileContextFacade);

  readonly account = this.context.account;
  readonly address = this.context.address;
  readonly accountState = this.context.accountState;
  readonly activityState = this.context.activityState;
  readonly activity = this.context.activity;
  readonly editingAccount = signal(false);
  readonly accountSaved = signal(false);
  readonly accountError = signal<string | null>(null);
  readonly passwordSaved = signal(false);
  readonly passwordError = signal<string | null>(null);

  readonly accountForm = new FormGroup({
    displayName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    phone: new FormControl('', { nonNullable: true }),
    preferredLanguage: new FormControl('es', { nonNullable: true, validators: [Validators.required] }),
    timezone: new FormControl('America/Lima', { nonNullable: true, validators: [Validators.required] }),
  });

  readonly passwordForm = new FormGroup({
    currentPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    newPassword: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(12), Validators.maxLength(128)] }),
    confirmPassword: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(12), Validators.maxLength(128)] }),
  });

  readonly displayName = computed(() => this.facade.profile()?.displayName || this.auth.identity()?.displayName || this.account()?.contactPerson || '—');
  readonly email = computed(() => this.facade.profile()?.email || this.auth.identity()?.email || this.account()?.contactEmail || '—');
  readonly clientIdentifier = computed(() => this.account()?.code || this.auth.identity()?.clientAccountId || '—');
  readonly initials = computed(() => this.displayName().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'BP');
  readonly buyerType = computed(() => this.account()?.taxType.toUpperCase() === 'RUC' ? 'company' : 'individual');
  readonly taxLabel = computed(() => this.account()?.taxType || 'Tax ID');
  readonly deliveryAddress = computed(() => {
    const value = this.address();
    if (!value) return '—';
    return [value.line, value.reference].filter((item) => item.trim().length > 0).join(' · ') || '—';
  });

  constructor() {
    this.loadProfile();
  }

  beginAccountEdit(): void {
    this.accountError.set(null);
    this.accountSaved.set(false);
    this.editingAccount.set(true);
  }

  cancelAccountEdit(): void {
    this.patchAccountForm();
    this.accountError.set(null);
    this.editingAccount.set(false);
  }

  saveAccount(): void {
    const profile = this.facade.profile();
    if (!profile || this.accountForm.invalid) {
      this.accountForm.markAllAsTouched();
      return;
    }

    this.accountError.set(null);
    this.accountSaved.set(false);
    this.facade.saveProfile(this.accountForm.getRawValue(), profile.version).subscribe({
      next: () => {
        this.accountSaved.set(true);
        this.editingAccount.set(false);
      },
      error: () => this.accountError.set('iamSecurity.error'),
    });
  }

  changePassword(): void {
    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.getRawValue();
    this.passwordError.set(null);
    this.passwordSaved.set(false);

    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    if (newPassword !== confirmPassword) {
      this.passwordError.set('iamSecurity.buyer.passwordMismatch');
      return;
    }

    this.facade.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.passwordForm.reset();
        this.passwordSaved.set(true);
      },
      error: () => this.passwordError.set('iamSecurity.buyer.passwordError'),
    });
  }

  switchAccount(): void {
    this.auth.signOut().subscribe({ complete: () => undefined });
  }

  private loadProfile(): void {
    this.facade.loadProfile().subscribe({
      next: () => this.patchAccountForm(),
      error: () => undefined,
    });
  }

  private patchAccountForm(): void {
    const profile = this.facade.profile();
    if (!profile) return;
    this.accountForm.patchValue({
      displayName: profile.displayName,
      phone: profile.phone ?? '',
      preferredLanguage: profile.preferredLanguage,
      timezone: profile.timezone,
    });
  }

}
