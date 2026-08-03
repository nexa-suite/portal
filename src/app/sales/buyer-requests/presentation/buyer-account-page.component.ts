import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { SecurityFacade } from '../../../iam/application/security.facade';
import { PortalAuthStateService } from '../../../iam/application/portal-auth-state.service';
import { ErrorStateComponent } from '../../../shared/presentation/components/error-state/error-state.component';
import { PageHeaderComponent } from '../../../shared/presentation/components/page-header/page-header.component';
import { BuyerRequestBuilderFacade } from '../application/buyer-request-builder.facade';
import { addressDisplay, CreateClientAccountAddressInput, DeliveryAddressInput, ClientAccountAddress, directionsUrl } from '../domain/buyer-request.models';

@Component({
  selector: 'nexa-buyer-account-page',
  imports: [ReactiveFormsModule, MatButtonModule, MatCardModule, RouterLink, TranslatePipe, PageHeaderComponent, ErrorStateComponent],
  templateUrl: './buyer-account-page.component.html',
  styleUrl: './buyer-account-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuyerAccountPageComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  readonly auth = inject(PortalAuthStateService);
  readonly security = inject(SecurityFacade);
  readonly facade = inject(BuyerRequestBuilderFacade);
  readonly showAddressForm = signal(false);
  readonly clientAccountId = computed(() => this.auth.identity()?.clientAccountId ?? null);
  readonly form = this.fb.group({
    label: this.fb.control('', [Validators.required, Validators.maxLength(120)]),
    addressType: this.fb.control('Av.'),
    line: this.fb.control('', [Validators.required, Validators.maxLength(240)]),
    reference: this.fb.control('', Validators.maxLength(500)),
    departmentCode: this.fb.control('', Validators.required),
    provinceCode: this.fb.control('', Validators.required),
    districtCode: this.fb.control('', Validators.required),
    defaultAddress: this.fb.control(false),
  });

  constructor() {
    this.security.loadProfile().subscribe();
    this.facade.loadInitial(this.clientAccountId()).subscribe();
  }

  departmentChanged(): void {
    this.form.patchValue({ provinceCode: '', districtCode: '' });
    const departmentCode = this.form.controls.departmentCode.value;
    if (departmentCode) this.facade.loadProvinces(departmentCode).subscribe();
  }

  provinceChanged(): void {
    this.form.patchValue({ districtCode: '' });
    const provinceCode = this.form.controls.provinceCode.value;
    if (provinceCode) this.facade.loadDistricts(provinceCode).subscribe();
  }

  saveAddress(): void {
    const clientAccountId = this.clientAccountId();
    if (!clientAccountId || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const address: DeliveryAddressInput = {
      addressType: value.addressType,
      line: value.line,
      reference: value.reference,
      countryCode: 'PE',
      departmentCode: value.departmentCode,
      provinceCode: value.provinceCode,
      districtCode: value.districtCode,
    };
    const input: CreateClientAccountAddressInput = { label: value.label, address, defaultAddress: value.defaultAddress };
    this.facade.createAddress(clientAccountId, input).subscribe({
      next: () => {
        this.form.reset({ label: '', addressType: 'Av.', line: '', reference: '', departmentCode: '', provinceCode: '', districtCode: '', defaultAddress: false });
        this.showAddressForm.set(false);
      },
    });
  }

  makeDefault(address: ClientAccountAddress): void {
    const clientAccountId = this.clientAccountId();
    if (clientAccountId && !address.defaultAddress) this.facade.setDefaultAddress(clientAccountId, address.id, address.etag).subscribe();
  }

  display(address: ClientAccountAddress): string {
    return addressDisplay(address, (code) => this.labelFor(code));
  }

  maps(address: ClientAccountAddress): string {
    return directionsUrl('Nexa cold-chain warehouse', `${this.display(address)}, Peru`);
  }

  labelFor(code: string): string {
    return [...this.facade.departments(), ...this.facade.provinces(), ...this.facade.districts()].find((item) => item.code === code)?.label ?? code;
  }
}
