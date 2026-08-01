import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { SecurityFacade } from '../../application/security.facade';
import { SecurityMode } from '../../domain/security.models';

@Component({ selector: 'nexa-security-page', imports: [ReactiveFormsModule, RouterLink, TranslatePipe, DatePipe], templateUrl: './security-page.component.html', styleUrl: './security-page.component.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class SecurityPageComponent {
  readonly facade = inject(SecurityFacade); private readonly route = inject(ActivatedRoute); readonly mode = (this.route.snapshot.url[0]?.path === 'forgot-password' ? 'forgot' : this.route.snapshot.url[0]?.path === 'reset-password' ? 'reset' : this.route.snapshot.url[0]?.path === 'profile' ? 'profile' : this.route.snapshot.url[0]?.path === 'password' ? 'password' : 'sessions') as SecurityMode;
  readonly profileForm = new FormGroup({ displayName: new FormControl('', { nonNullable: true, validators: [Validators.required] }), phone: new FormControl('', { nonNullable: true }), preferredLanguage: new FormControl('es', { nonNullable: true, validators: [Validators.required] }), timezone: new FormControl('America/Lima', { nonNullable: true, validators: [Validators.required] }) });
  readonly passwordForm = new FormGroup({ currentPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }), newPassword: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(12)] }) });
  readonly forgotForm = new FormGroup({ email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }) });
  readonly resetForm = new FormGroup({ token: new FormControl(this.route.snapshot.queryParamMap.get('token') ?? '', { nonNullable: true, validators: [Validators.required] }), newPassword: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(12)] }) });
  private loaded = false;
  constructor() { if (this.mode === 'profile') this.facade.loadProfile().subscribe((value) => { if (!this.loaded) { this.loaded = true; this.profileForm.patchValue({ displayName: value.displayName, phone: value.phone ?? '', preferredLanguage: value.preferredLanguage, timezone: value.timezone }); } }); if (this.mode === 'sessions') this.facade.loadSessions().subscribe(); }
  submit(): void { if (this.mode === 'forgot' && this.forgotForm.valid) this.facade.requestReset(this.forgotForm.controls.email.value).subscribe(); if (this.mode === 'reset' && this.resetForm.valid) this.facade.resetPassword(this.resetForm.controls.token.value, this.resetForm.controls.newPassword.value).subscribe(); if (this.mode === 'password' && this.passwordForm.valid) this.facade.changePassword(this.passwordForm.controls.currentPassword.value, this.passwordForm.controls.newPassword.value).subscribe(); if (this.mode === 'profile' && this.profileForm.valid && this.facade.profile()) this.facade.saveProfile(this.profileForm.getRawValue(), this.facade.profile()!.version).subscribe(); }
}
