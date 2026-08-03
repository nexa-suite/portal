import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { CatalogApiClient } from '../../../catalog-management/infrastructure/catalog-api.client';
import { CatalogItemSummary, DEFAULT_CATALOG_QUERY } from '../../../catalog-management/domain/catalog.models';
import { InventoryAvailabilityFacade } from '../../../warehouse/application/inventory-availability.facade';
import { PortalAuthStateService } from '../../../iam/application/portal-auth-state.service';
import { PageHeaderComponent } from '../../../shared/presentation/components/page-header/page-header.component';
import { BuyerRequestBuilderFacade } from '../application/buyer-request-builder.facade';
import {
  addressDisplay,
  BuyerRequestCommand,
  BuyerRequestLineInput,
  BuyerPaymentOption,
  DeliveryAddressInput,
  todayInputValue,
} from '../domain/buyer-request.models';

interface BuilderLine extends BuyerRequestLineInput {
  readonly id: string;
  readonly itemName: string;
  readonly presentation: string;
}

@Component({
  selector: 'nexa-buyer-request-builder-page',
  imports: [DecimalPipe, ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule, RouterLink, TranslatePipe, PageHeaderComponent],
  templateUrl: './buyer-request-builder-page.component.html',
  styleUrl: './buyer-request-builder-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuyerRequestBuilderPageComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly catalog = inject(CatalogApiClient);
  private readonly router = inject(Router);
  readonly auth = inject(PortalAuthStateService);
  readonly facade = inject(BuyerRequestBuilderFacade);
  readonly availability = inject(InventoryAvailabilityFacade);
  readonly minimumDate = todayInputValue();
  readonly step = signal(1);
  readonly stepLabels = ['buyer', 'products', 'delivery', 'route', 'review', 'submit'] as const;
  readonly message = signal<string | null>(null);
  readonly catalogSearch = this.fb.control('');
  readonly catalogSelection = this.fb.control('');
  readonly quantity = this.fb.control(1, [Validators.required, Validators.min(0.01)]);
  readonly catalogItems = signal<readonly CatalogItemSummary[]>([]);
  readonly lines = signal<readonly BuilderLine[]>([]);
  readonly locationStatus = signal<'idle' | 'requesting' | 'ready' | 'denied' | 'timeout' | 'unavailable' | 'unsupported'>('idle');
  readonly locationMode = signal<'none' | 'current'>('none');
  readonly mapConfirmed = signal(false);
  readonly mapPin = signal<{ readonly latitude: number; readonly longitude: number; readonly accuracy: number | null }>({ latitude: -12.0464, longitude: -77.0428, accuracy: null });
  readonly accountId = computed(() => this.auth.identity()?.clientAccountId ?? this.facade.clientAccount()?.id ?? null);
  readonly form = this.fb.group({
    addressMode: this.fb.control<'saved' | 'manual' | 'current'>('saved'),
    addressId: this.fb.control(''),
    addressType: this.fb.control('Av.'),
    recipientName: this.fb.control(''),
    recipientPhone: this.fb.control(''),
    roadType: this.fb.control(''),
    streetName: this.fb.control(''),
    streetNumber: this.fb.control(''),
    interior: this.fb.control(''),
    postalCode: this.fb.control(''),
    addressLine: this.fb.control(''),
    reference: this.fb.control(''),
    receivingHours: this.fb.control(''),
    receivingInstructions: this.fb.control(''),
    latitude: this.fb.control<number | null>(null),
    longitude: this.fb.control<number | null>(null),
    placeId: this.fb.control(''),
    source: this.fb.control('MANUAL'),
    departmentCode: this.fb.control(''),
    provinceCode: this.fb.control(''),
    districtCode: this.fb.control(''),
    requestedDeliveryDate: this.fb.control(this.minimumDate, Validators.required),
    deliveryNotes: this.fb.control(''),
    paymentOption: this.fb.control<BuyerPaymentOption>('CASH_ON_DELIVERY', Validators.required),
    comments: this.fb.control(''),
  });
  readonly selectedWarehouse = computed(() => this.facade.previewState().snapshot?.delivery?.warehouse ?? null);

  constructor() {
    this.facade.loadInitial(this.accountId()).subscribe({
      next: () => {
        const defaultAddress = this.facade.addresses().find((item) => item.defaultAddress) ?? this.facade.addresses()[0];
        if (defaultAddress) this.form.patchValue({ addressMode: 'saved', addressId: defaultAddress.id });
      },
    });
  }

  searchCatalog(): void {
    const q = this.catalogSearch.value.trim();
    this.catalog.list({ ...DEFAULT_CATALOG_QUERY, q, size: 20 }).subscribe({
      next: (page) => {
        this.catalogItems.set(page.items);
        this.availability.load(page.items.map((item) => item.catalogItemId));
        this.message.set(null);
      },
      error: () => this.message.set('CATALOG_SELECTION_FAILED'),
    });
  }

  addCatalogItem(): void {
    const catalogItemId = this.catalogSelection.value;
    const item = this.catalogItems().find((current) => current.catalogItemId === catalogItemId);
    if (!item || this.quantity.invalid) return;
    if (this.lines().some((line) => line.catalogItemId === item.catalogItemId)) {
      this.message.set('REQUEST_LINE_DUPLICATE');
      return;
    }
    this.lines.update((lines) => [...lines, { id: item.catalogItemId, catalogItemId: item.catalogItemId, itemName: item.itemName, presentation: item.presentation, quantity: this.quantity.value, unit: 'unit', notes: '' }]);
    this.catalogSelection.setValue('');
    this.quantity.setValue(1);
    this.message.set(null);
  }

  updateLine(line: BuilderLine, event: Event): void {
    const quantity = Number((event.target as HTMLInputElement).value);
    if (!Number.isFinite(quantity) || quantity <= 0) return;
    this.lines.update((lines) => lines.map((item) => item.id === line.id ? { ...item, quantity } : item));
  }

  removeLine(line: BuilderLine): void { this.lines.update((items) => items.filter((item) => item.id !== line.id)); }

  departmentChanged(): void {
    this.form.patchValue({ provinceCode: '', districtCode: '' });
    const code = this.form.controls.departmentCode.value;
    if (code) this.facade.loadProvinces(code).subscribe();
  }

  provinceChanged(): void {
    this.form.patchValue({ districtCode: '' });
    const code = this.form.controls.provinceCode.value;
    if (code) this.facade.loadDistricts(code).subscribe();
  }

  useCurrentLocation(): void {
    if (typeof navigator === 'undefined' || !navigator.geolocation) { this.locationStatus.set('unsupported'); return; }
    this.locationMode.set('current');
    this.mapConfirmed.set(false);
    this.locationStatus.set('requesting');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.mapPin.set({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy });
        this.form.patchValue({ latitude: position.coords.latitude, longitude: position.coords.longitude, source: 'CURRENT_LOCATION' });
        this.locationStatus.set('ready');
      },
      (error) => this.locationStatus.set(error.code === 1 ? 'denied' : error.code === 3 ? 'timeout' : 'unavailable'),
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 },
    );
  }

  updateMapPin(axis: 'latitude' | 'longitude', event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    if (!Number.isFinite(value)) return;
    const current = this.mapPin();
    const bounded = axis === 'latitude' ? Math.max(-90, Math.min(90, value)) : Math.max(-180, Math.min(180, value));
    this.mapPin.set({ ...current, [axis]: bounded, accuracy: null });
    this.form.patchValue({ [axis]: bounded, source: 'MAP_PIN' });
    this.mapConfirmed.set(false);
  }

  confirmMapPin(): void {
    const pin = this.mapPin();
    this.form.patchValue({ latitude: pin.latitude, longitude: pin.longitude, source: this.locationMode() === 'current' ? 'CURRENT_LOCATION' : 'MAP_PIN' });
    this.mapConfirmed.set(true);
  }

  next(): void {
    const current = this.step();
    if (current === 1 && !this.addressValid()) { this.message.set('BUYER_ADDRESS_REQUIRED'); this.form.markAllAsTouched(); return; }
    if (current === 2 && this.lines().length === 0) { this.message.set('BUYER_REQUEST_LINES_REQUIRED'); return; }
    if (current === 3) { this.preview(); return; }
    this.message.set(null);
    this.step.set(Math.min(6, current + 1));
  }

  previous(): void { this.step.update((value) => Math.max(1, value - 1)); }

  preview(): void {
    if (!this.deliveryValid()) { this.message.set('BUYER_DELIVERY_REQUIRED'); this.form.markAllAsTouched(); return; }
    this.facade.preview(this.command()).subscribe({ next: () => { this.message.set(null); this.step.set(4); } });
  }

  submit(): void {
    if (!this.addressValid() || !this.lines().length || !this.deliveryValid()) { this.message.set('BUYER_REQUEST_INCOMPLETE'); return; }
    this.facade.create(this.command()).subscribe({
      next: (request) => void this.router.navigate(['/portal/purchase-requests', request.id]),
    });
  }

  addressValid(): boolean {
    const value = this.form.getRawValue();
    if (value.addressMode === 'saved') return value.addressId.trim().length > 0;
    return Boolean(value.addressLine.trim() && value.departmentCode && value.provinceCode && value.districtCode
      && (value.addressMode !== 'current' || this.mapConfirmed()));
  }

  deliveryValid(): boolean {
    const value = this.form.getRawValue();
    return Boolean(value.requestedDeliveryDate && this.lines().length);
  }

  selectedAddressLabel(): string {
    const value = this.form.getRawValue();
    if (value.addressMode === 'saved') {
      const address = this.facade.addresses().find((item) => item.id === value.addressId);
      return address ? this.addressLabel(address) : '';
    }
    return this.addressLabel({ line: value.addressLine, reference: value.reference, departmentCode: value.departmentCode, provinceCode: value.provinceCode, districtCode: value.districtCode });
  }

  addressLabel(address: Pick<DeliveryAddressInput, 'line' | 'reference' | 'departmentCode' | 'provinceCode' | 'districtCode'>): string {
    return addressDisplay(address, (code) => this.labelFor(code));
  }

  labelFor(code: string): string {
    return [...this.facade.departments(), ...this.facade.provinces(), ...this.facade.districts()].find((item) => item.code === code)?.label ?? code;
  }

  routePreviewUrl(): string {
    const route = this.facade.previewState().snapshot?.delivery?.route;
    return route?.previewUrl?.startsWith('http') ? route.previewUrl : '';
  }

  private command(): BuyerRequestCommand {
    const value = this.form.getRawValue();
    const manualAddress: DeliveryAddressInput | null = value.addressMode !== 'saved'
      ? {
        addressType: value.addressType,
        line: value.addressLine,
        reference: value.reference,
        countryCode: 'PE',
        departmentCode: value.departmentCode,
        provinceCode: value.provinceCode,
        districtCode: value.districtCode,
        recipientName: value.recipientName || null,
        recipientPhone: value.recipientPhone || null,
        roadType: value.roadType || value.addressType,
        streetName: value.streetName || null,
        streetNumber: value.streetNumber || null,
        interior: value.interior || null,
        postalCode: value.postalCode || null,
        receivingInstructions: value.receivingInstructions || null,
        receivingHours: value.receivingHours || null,
        latitude: this.mapConfirmed() ? value.latitude : null,
        longitude: this.mapConfirmed() ? value.longitude : null,
        placeId: value.placeId || null,
        source: this.mapConfirmed() ? value.source : 'MANUAL',
      }
      : null;
    return {
      clientAccountId: this.accountId(),
      addressId: value.addressMode === 'saved' ? value.addressId || null : null,
      manualAddress,
      requestedDeliveryDate: value.requestedDeliveryDate,
      deliveryNotes: value.deliveryNotes,
      warehouseId: null,
      paymentOption: value.paymentOption,
      comments: value.comments,
      lines: this.lines().map(({ catalogItemId, quantity, unit, notes }) => ({ catalogItemId, quantity, unit, notes })),
    };
  }
}
