import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { of, switchMap } from 'rxjs';
import { PORTAL_SECURITY_BOUNDARY } from '../../../core/security/portal-security.boundary';
import { PageHeaderComponent } from '../../../shared/presentation/components/page-header/page-header.component';
import { PurchaseRequestBuilderFacade } from '../../application/buyer-requests/buyer-request-builder.facade';
import { PurchaseRequestCatalogPort } from '../../application/ports/purchase-request-catalog.port';
import {
  addressDisplay,
  BuyerRequestCommand,
  BuyerRequestLineInput,
  BuyerPaymentOption,
  BuyerRequestDeliveryAddress,
  todayInputValue,
} from '../../domain/buyer-requests/buyer-request.models';
import { PurchaseRequestDraftView } from '../../domain/buyer-requests/purchase-request-draft.models';
import { PurchaseRequestCatalogItem } from '../../domain/buyer-requests/purchase-request-catalog.models';

interface BuilderLine extends BuyerRequestLineInput {
  readonly id: string;
  readonly itemName: string;
  readonly presentation: string;
}

export type BuyerRequestBuilderStep = 1 | 2 | 3 | 4;

export const BUYER_REQUEST_BUILDER_STEPS = [
  'requestReview',
  'commercialDelivery',
  'paymentTerms',
  'confirmation',
] as const;

function draftText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}
function draftNumber(value: unknown): number {
  const result = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(result) ? result : 0;
}
function draftObject(value: unknown): Record<string, unknown> {
  if (typeof value === 'string') {
    try {
      return draftObject(JSON.parse(value));
    } catch {
      return {};
    }
  }
  return value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

@Component({
  selector: 'nexa-buyer-request-builder-page',
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    RouterLink,
    TranslatePipe,
    PageHeaderComponent,
  ],
  templateUrl: './buyer-request-builder-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuyerRequestBuilderPageComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly catalog = inject(PurchaseRequestCatalogPort);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly auth = inject(PORTAL_SECURITY_BOUNDARY);
  readonly facade = inject(PurchaseRequestBuilderFacade);
  readonly minimumDate = todayInputValue();
  readonly step = signal<BuyerRequestBuilderStep>(1);
  readonly stepLabels = BUYER_REQUEST_BUILDER_STEPS;
  readonly message = signal<string | null>(null);
  readonly catalogSearch = this.fb.control('');
  readonly catalogSelection = this.fb.control('');
  readonly quantity = this.fb.control(1, [Validators.required, Validators.min(0.01)]);
  readonly catalogItems = signal<readonly PurchaseRequestCatalogItem[]>([]);
  readonly lines = signal<readonly BuilderLine[]>([]);
  readonly locationStatus = signal<
    'idle' | 'requesting' | 'ready' | 'denied' | 'timeout' | 'unavailable' | 'unsupported'
  >('idle');
  readonly locationMode = signal<'none' | 'current'>('none');
  readonly mapConfirmed = signal(false);
  readonly mapPin = signal<{
    readonly latitude: number;
    readonly longitude: number;
    readonly accuracy: number | null;
  }>({ latitude: -12.0464, longitude: -77.0428, accuracy: null });
  private lastPreviewSignature: string | null = null;
  readonly accountId = computed(
    () => this.auth.identity()?.clientAccountId ?? this.facade.clientAccount()?.id ?? null,
  );
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
    paymentOption: this.fb.control<BuyerPaymentOption>('CARD_STRIPE', Validators.required),
    comments: this.fb.control(''),
  });

  readonly addressModeOptions = [
    { value: 'saved', label: 'Saved Address' },
    { value: 'manual', label: 'Manual Address' },
    { value: 'current', label: 'Current Location' },
  ] as const;

  constructor() {
    const draftId = this.route.snapshot.paramMap.get('purchaseRequestId');
    this.facade
      .loadInitial(this.accountId())
      .pipe(switchMap(() => (draftId ? this.facade.loadDraft(draftId) : of(null))))
      .subscribe({
        next: (draft) => {
          this.searchCatalog();
          if (draft) {
            this.hydrateDraft(draft);
            return;
          }
          const defaultAddress =
            this.facade.addresses().find((item) => item.defaultAddress) ??
            this.facade.addresses()[0];
          if (defaultAddress)
            this.form.patchValue({ addressMode: 'saved', addressId: defaultAddress.id });
        },
        error: () => this.message.set('BUYER_REQUEST_DRAFT_LOAD_FAILED'),
      });
  }

  private hydrateDraft(draft: PurchaseRequestDraftView): void {
    const destinationSnapshot = draftObject(draft.destination?.['snapshot']);
    const addressId = draftText(draft.destination?.['addressId']);
    const payment = draft.paymentPreference;
    const paymentOptions: readonly BuyerPaymentOption[] = [
      'CREDIT_LINE',
      'BANK_TRANSFER',
      'CARD_STRIPE',
      'CASH',
      'CASH_ON_DELIVERY',
    ];
    const lines: BuilderLine[] = (draft.lines ?? []).map((line, index) => {
      const skuId = draftText(line['skuId']);
      const presentation = draftText(line['presentation']) || draftText(line['skuCode']) || skuId;
      return {
        id: draftText(line['id']) || `${skuId}-${index}`,
        catalogItemId: skuId,
        skuId,
        itemName: presentation,
        presentation,
        quantity: draftNumber(line['quantity']) || 1,
        unit: draftText(line['unit']) || 'unit',
        notes: draftText(line['notes']),
      };
    });
    this.lines.set(lines);
    this.form.patchValue({
      addressMode: addressId ? 'saved' : 'manual',
      addressId,
      addressType: draftText(destinationSnapshot['roadType']) || 'Av.',
      recipientName: draftText(destinationSnapshot['recipient']),
      recipientPhone: draftText(destinationSnapshot['phone']),
      roadType: draftText(destinationSnapshot['roadType']),
      streetName: draftText(destinationSnapshot['street']),
      streetNumber: draftText(destinationSnapshot['number']),
      interior: draftText(destinationSnapshot['interior']),
      postalCode: draftText(destinationSnapshot['postalCode']),
      addressLine: [
        draftText(destinationSnapshot['street']),
        draftText(destinationSnapshot['number']),
      ]
        .filter(Boolean)
        .join(' '),
      reference: draftText(destinationSnapshot['reference']),
      receivingHours: draftText(destinationSnapshot['receivingHours']),
      receivingInstructions: draftText(destinationSnapshot['receivingInstructions']),
      latitude:
        destinationSnapshot['latitude'] == null || destinationSnapshot['latitude'] === ''
          ? null
          : draftNumber(destinationSnapshot['latitude']),
      longitude:
        destinationSnapshot['longitude'] == null || destinationSnapshot['longitude'] === ''
          ? null
          : draftNumber(destinationSnapshot['longitude']),
      source: draftText(destinationSnapshot['source']) || 'MANUAL',
      departmentCode: draftText(destinationSnapshot['department']),
      provinceCode: draftText(destinationSnapshot['province']),
      districtCode: draftText(destinationSnapshot['district']),
      requestedDeliveryDate: draft.requestedDeliveryDate ?? this.minimumDate,
      paymentOption: paymentOptions.includes(payment as BuyerPaymentOption)
        ? (payment as BuyerPaymentOption)
        : 'CARD_STRIPE',
    });
    if (this.form.controls.departmentCode.value) this.departmentChanged();
    if (this.form.controls.provinceCode.value) this.provinceChanged();
    const lat = this.form.controls.latitude.value;
    const lng = this.form.controls.longitude.value;
    if (lat != null && lng != null) {
      this.mapPin.set({ latitude: lat, longitude: lng, accuracy: null });
      this.mapConfirmed.set(true);
    }
  }

  setAddressMode(value: string): void {
    this.form.controls.addressMode.setValue(value as 'saved' | 'manual' | 'current');
  }

  searchCatalog(): void {
    const q = this.catalogSearch.value.trim();
    this.catalog.search(q).subscribe({
      next: (page) => {
        this.catalogItems.set(page.items);
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
    this.lines.update((lines) => [
      ...lines,
      {
        id: item.catalogItemId,
        catalogItemId: item.catalogItemId,
        skuId: item.sellableSkuId || item.productId,
        itemName: item.itemName,
        presentation: item.presentation,
        quantity: this.quantity.value,
        unit: 'unit',
        notes: '',
      },
    ]);
    this.catalogSelection.setValue('');
    this.quantity.setValue(1);
    this.message.set(null);
  }

  selectedCatalogItem(): PurchaseRequestCatalogItem | null {
    return this.catalogItems().find((item) => item.catalogItemId === this.catalogSelection.value) ?? null;
  }

  selectCatalogItem(item: PurchaseRequestCatalogItem): void {
    this.catalogSelection.setValue(item.catalogItemId);
    this.message.set(null);
  }

  adjustDraftQuantity(delta: number): void {
    this.quantity.setValue(Math.max(1, this.quantity.value + delta));
  }

  adjustLineQuantity(line: BuilderLine, delta: number): void {
    this.lines.update((lines) => lines.map((item) => item.id === line.id
      ? { ...item, quantity: Math.max(1, item.quantity + delta) }
      : item));
  }

  updateLine(line: BuilderLine, event: Event): void {
    const quantity = Number((event.target as HTMLInputElement).value);
    if (!Number.isFinite(quantity) || quantity <= 0) return;
    this.lines.update((lines) =>
      lines.map((item) => (item.id === line.id ? { ...item, quantity } : item)),
    );
  }

  removeLine(line: BuilderLine): void {
    this.lines.update((items) => items.filter((item) => item.id !== line.id));
  }

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
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      this.locationStatus.set('unsupported');
      return;
    }
    this.locationMode.set('current');
    this.mapConfirmed.set(false);
    this.locationStatus.set('requesting');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.mapPin.set({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        this.form.patchValue({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          source: 'CURRENT_LOCATION',
        });
        this.locationStatus.set('ready');
      },
      (error) =>
        this.locationStatus.set(
          error.code === 1 ? 'denied' : error.code === 3 ? 'timeout' : 'unavailable',
        ),
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 },
    );
  }

  updateMapPin(axis: 'latitude' | 'longitude', event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    if (!Number.isFinite(value)) return;
    const current = this.mapPin();
    const bounded =
      axis === 'latitude'
        ? Math.max(-90, Math.min(90, value))
        : Math.max(-180, Math.min(180, value));
    this.mapPin.set({ ...current, [axis]: bounded, accuracy: null });
    this.form.patchValue({ [axis]: bounded, source: 'MAP_PIN' });
    this.mapConfirmed.set(false);
  }

  confirmMapPin(): void {
    const pin = this.mapPin();
    this.form.patchValue({
      latitude: pin.latitude,
      longitude: pin.longitude,
      source: this.locationMode() === 'current' ? 'CURRENT_LOCATION' : 'MAP_PIN',
    });
    this.mapConfirmed.set(true);
  }

  next(): void {
    const current = this.step();
    if (current === 1 && this.lines().length === 0) {
      this.message.set('BUYER_REQUEST_LINES_REQUIRED');
      return;
    }
    if (current === 2) {
      if (!this.addressValid()) {
        this.message.set('BUYER_ADDRESS_REQUIRED');
        this.form.markAllAsTouched();
        return;
      }
      if (!this.deliveryValid()) {
        this.message.set('BUYER_DELIVERY_REQUIRED');
        this.form.markAllAsTouched();
        return;
      }
      this.preview();
      return;
    }
    if (current === 3 && !this.paymentValid()) {
      this.message.set('BUYER_PAYMENT_REQUIRED');
      this.form.controls.paymentOption.markAsTouched();
      return;
    }
    this.message.set(null);
    this.step.set(Math.min(4, current + 1) as BuyerRequestBuilderStep);
  }

  goToStep(target: number): void {
    const current = this.step();
    if (target <= current) {
      this.step.set(Math.max(1, Math.min(4, target)) as BuyerRequestBuilderStep);
      return;
    }
    if (target === current + 1) this.next();
  }

  previous(): void {
    this.step.update((value) => Math.max(1, value - 1) as BuyerRequestBuilderStep);
  }

  preview(): void {
    if (!this.deliveryValid()) {
      this.message.set('BUYER_DELIVERY_REQUIRED');
      this.form.markAllAsTouched();
      return;
    }
    const command = this.command();
    this.facade.preview(command).subscribe({
      next: () => {
        this.lastPreviewSignature = JSON.stringify(command);
        this.message.set(null);
        this.step.set(3);
      },
      error: () =>
        this.message.set(this.facade.previewState().message ?? 'BUYER_REQUEST_PREVIEW_FAILED'),
    });
  }

  submit(): void {
    if (
      !this.addressValid() ||
      !this.lines().length ||
      !this.deliveryValid() ||
      !this.paymentValid()
    ) {
      this.message.set('BUYER_REQUEST_INCOMPLETE');
      return;
    }
    this.facade.create(this.command()).subscribe({
      next: (request) => void this.router.navigate(['/portal/purchase-requests', request.id]),
      error: () => this.message.set(this.facade.message() ?? 'BUYER_REQUEST_CREATE_FAILED'),
    });
  }

  addressValid(): boolean {
    const value = this.form.getRawValue();
    if (value.addressMode === 'saved') return value.addressId.trim().length > 0;
    return Boolean(
      value.addressLine.trim() &&
      value.departmentCode &&
      value.provinceCode &&
      value.districtCode &&
      (value.addressMode !== 'current' || this.mapConfirmed()),
    );
  }

  deliveryValid(): boolean {
    const value = this.form.getRawValue();
    return Boolean(value.requestedDeliveryDate && this.lines().length);
  }

  paymentValid(): boolean {
    return (
      this.form.controls.paymentOption.valid && Boolean(this.form.controls.paymentOption.value)
    );
  }

  previewIsStale(): boolean {
    if (this.facade.previewState().status !== 'success' || !this.lastPreviewSignature) return false;
    return this.lastPreviewSignature !== JSON.stringify(this.command());
  }

  selectedAddressLabel(): string {
    const value = this.form.getRawValue();
    if (value.addressMode === 'saved') {
      const address = this.facade.addresses().find((item) => item.id === value.addressId);
      return address ? this.addressLabel(address) : '';
    }
    return this.addressLabel({
      line: value.addressLine,
      reference: value.reference,
      departmentCode: value.departmentCode,
      provinceCode: value.provinceCode,
      districtCode: value.districtCode,
    });
  }

  addressLabel(
    address: Pick<
      BuyerRequestDeliveryAddress,
      'line' | 'reference' | 'departmentCode' | 'provinceCode' | 'districtCode'
    >,
  ): string {
    return addressDisplay(address, (code) => this.labelFor(code));
  }

  labelFor(code: string): string {
    return (
      [...this.facade.departments(), ...this.facade.provinces(), ...this.facade.districts()].find(
        (item) => item.code === code,
      )?.label ?? code
    );
  }

  routePreviewUrl(): string {
    const route = this.facade.previewState().snapshot?.delivery?.route;
    return route?.previewUrl?.startsWith('http') ? route.previewUrl : '';
  }

  private command(): BuyerRequestCommand {
    const value = this.form.getRawValue();
    const manualAddress: BuyerRequestDeliveryAddress | null =
      value.addressMode !== 'saved'
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
      paymentOption: value.paymentOption,
      comments: value.comments,
      lines: this.lines().map(({ catalogItemId, skuId, quantity, unit, notes }) => ({
        catalogItemId,
        skuId,
        quantity,
        unit,
        notes,
      })),
    };
  }
}
