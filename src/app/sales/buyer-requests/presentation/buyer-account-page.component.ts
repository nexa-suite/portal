import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
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
import { addressDisplay, CreateClientAccountAddressInput, DeliveryAddressInput, ClientAccountAddress, directionsUrl, UpdateClientAccountAddressInput } from '../domain/buyer-request.models';

@Component({
  selector: 'nexa-buyer-account-page',
  imports: [DecimalPipe, ReactiveFormsModule, MatButtonModule, MatCardModule, RouterLink, TranslatePipe, PageHeaderComponent, ErrorStateComponent],
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
  readonly editingAddressId = signal<string | null>(null);
  readonly locationStatus = signal<'idle' | 'requesting' | 'ready' | 'denied' | 'timeout' | 'unavailable' | 'unsupported'>('idle');
  readonly currentLocation = signal<{ readonly latitude: number; readonly longitude: number; readonly accuracy: number } | null>(null);
  readonly clientAccountId = computed(() => this.auth.identity()?.clientAccountId ?? this.facade.clientAccount()?.id ?? null);
  readonly form = this.fb.group({
    label: this.fb.control('', [Validators.required, Validators.maxLength(120)]),
    addressType: this.fb.control('STREET'),
    line: this.fb.control('', [Validators.required, Validators.maxLength(240)]),
    reference: this.fb.control('', Validators.maxLength(500)),
    recipientName: this.fb.control('', Validators.maxLength(160)),
    recipientPhone: this.fb.control('', Validators.maxLength(48)),
    streetName: this.fb.control('', Validators.maxLength(180)),
    streetNumber: this.fb.control('', Validators.maxLength(32)),
    interior: this.fb.control('', Validators.maxLength(64)),
    postalCode: this.fb.control('', Validators.maxLength(32)),
    receivingInstructions: this.fb.control('', Validators.maxLength(1000)),
    receivingHours: this.fb.control('', Validators.maxLength(240)),
    latitude: this.fb.control<number | null>(null),
    longitude: this.fb.control<number | null>(null),
    placeId: this.fb.control('', Validators.maxLength(240)),
    source: this.fb.control('MANUAL'),
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

  useCurrentLocation(): void {
    if (typeof navigator === 'undefined' || !navigator.geolocation) { this.locationStatus.set('unsupported'); return; }
    this.locationStatus.set('requesting');
    navigator.geolocation.getCurrentPosition(
      (position) => { const location = { latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy }; this.currentLocation.set(location); this.form.patchValue({ latitude: location.latitude, longitude: location.longitude, source: 'CURRENT_LOCATION' }); this.locationStatus.set('ready'); },
      (error) => this.locationStatus.set(error.code === 1 ? 'denied' : error.code === 3 ? 'timeout' : 'unavailable'),
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 },
    );
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
      recipientName: value.recipientName || null,
      recipientPhone: value.recipientPhone || null,
      roadType: value.addressType,
      streetName: value.streetName || null,
      streetNumber: value.streetNumber || null,
      interior: value.interior || null,
      postalCode: value.postalCode || null,
      receivingInstructions: value.receivingInstructions || null,
      receivingHours: value.receivingHours || null,
      latitude: value.latitude,
      longitude: value.longitude,
      placeId: value.placeId || null,
      source: value.source,
    };
    const id = this.editingAddressId();
    const operation = id
      ? this.facade.updateAddress(clientAccountId, id, { label: value.label, address } as UpdateClientAccountAddressInput, this.facade.addresses().find((item) => item.id === id)?.etag ?? '"0"')
      : this.facade.createAddress(clientAccountId, { label: value.label, address, defaultAddress: value.defaultAddress } as CreateClientAccountAddressInput);
    operation.subscribe({
      next: () => {
        this.form.reset({ label: '', addressType: 'STREET', line: '', reference: '', recipientName: '', recipientPhone: '', streetName: '', streetNumber: '', interior: '', postalCode: '', receivingInstructions: '', receivingHours: '', latitude: null, longitude: null, placeId: '', source: 'MANUAL', departmentCode: '', provinceCode: '', districtCode: '', defaultAddress: false });
        this.editingAddressId.set(null);
        this.showAddressForm.set(false);
      },
    });
  }

  editAddress(address: ClientAccountAddress): void {
    this.editingAddressId.set(address.id);
    this.form.patchValue({ label: address.label, addressType: address.addressType, line: address.line, reference: address.reference, recipientName: address.recipientName ?? '', recipientPhone: address.recipientPhone ?? '', streetName: address.streetName ?? '', streetNumber: address.streetNumber ?? '', interior: address.interior ?? '', postalCode: address.postalCode ?? '', receivingInstructions: address.receivingInstructions ?? '', receivingHours: address.receivingHours ?? '', latitude: address.latitude ?? null, longitude: address.longitude ?? null, placeId: address.placeId ?? '', source: address.source ?? 'MANUAL', departmentCode: address.departmentCode, provinceCode: address.provinceCode, districtCode: address.districtCode, defaultAddress: address.defaultAddress });
    this.showAddressForm.set(true);
    this.facade.loadProvinces(address.departmentCode).subscribe();
    this.facade.loadDistricts(address.provinceCode).subscribe();
  }

  cancelAddress(): void { this.showAddressForm.set(false); this.editingAddressId.set(null); }

  deactivate(address: ClientAccountAddress): void {
    const clientAccountId = this.clientAccountId();
    if (clientAccountId && address.active) this.facade.deactivateAddress(clientAccountId, address.id, address.etag).subscribe();
  }

  makeDefault(address: ClientAccountAddress): void {
    const clientAccountId = this.clientAccountId();
    if (clientAccountId && !address.defaultAddress) this.facade.setDefaultAddress(clientAccountId, address.id, address.etag).subscribe();
  }

  display(address: ClientAccountAddress): string {
    return addressDisplay(address, (code) => this.labelFor(code));
  }

  maps(address: ClientAccountAddress): string {
    if (address.latitude != null && address.longitude != null) return `https://www.google.com/maps/search/?api=1&query=${address.latitude},${address.longitude}`;
    return directionsUrl('Nexa cold-chain warehouse', `${this.display(address)}, Peru`);
  }

  labelFor(code: string): string {
    return [...this.facade.departments(), ...this.facade.provinces(), ...this.facade.districts()].find((item) => item.code === code)?.label ?? code;
  }
}
