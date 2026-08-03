import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
  BuyerWarehouse,
  DeliveryAddressInput,
  directionsUrl,
  todayInputValue,
} from '../domain/buyer-request.models';

interface BuilderLine extends BuyerRequestLineInput {
  readonly id: string;
  readonly itemName: string;
  readonly presentation: string;
}

@Component({
  selector: 'nexa-buyer-request-builder-page',
  imports: [ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule, RouterLink, TranslatePipe, PageHeaderComponent],
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
  readonly message = signal<string | null>(null);
  readonly catalogSearch = this.fb.control('');
  readonly catalogSelection = this.fb.control('');
  readonly quantity = this.fb.control(1, [Validators.required, Validators.min(0.01)]);
  readonly catalogItems = signal<readonly CatalogItemSummary[]>([]);
  readonly lines = signal<readonly BuilderLine[]>([]);
  readonly accountId = computed(() => this.auth.identity()?.clientAccountId ?? null);
  readonly form = this.fb.group({
    addressMode: this.fb.control<'saved' | 'manual'>('saved'),
    addressId: this.fb.control(''),
    addressType: this.fb.control('Av.'),
    addressLine: this.fb.control(''),
    reference: this.fb.control(''),
    departmentCode: this.fb.control(''),
    provinceCode: this.fb.control(''),
    districtCode: this.fb.control(''),
    requestedDeliveryDate: this.fb.control(this.minimumDate, Validators.required),
    deliveryNotes: this.fb.control(''),
    warehouseId: this.fb.control('', Validators.required),
    paymentOption: this.fb.control<BuyerPaymentOption>('CASH_ON_DELIVERY', Validators.required),
    comments: this.fb.control(''),
  });
  readonly selectedWarehouse = computed(() => {
    const id = this.form.controls.warehouseId.value;
    return this.facade.warehouses().find((item) => item.id === id) ?? null;
  });

  constructor() {
    this.facade.loadInitial(this.accountId()).subscribe({
      next: () => {
        const defaultAddress = this.facade.addresses().find((item) => item.defaultAddress) ?? this.facade.addresses()[0];
        if (defaultAddress) this.form.patchValue({ addressMode: 'saved', addressId: defaultAddress.id });
        const warehouse = this.facade.warehouses().find((item) => item.serviceable) ?? this.facade.warehouses()[0];
        if (warehouse) this.form.controls.warehouseId.setValue(warehouse.id);
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

  next(): void {
    const current = this.step();
    if (current === 1 && !this.addressValid()) { this.message.set('BUYER_ADDRESS_REQUIRED'); this.form.markAllAsTouched(); return; }
    if (current === 2 && this.lines().length === 0) { this.message.set('BUYER_REQUEST_LINES_REQUIRED'); return; }
    if (current === 3) { this.preview(); return; }
    this.message.set(null);
    this.step.set(Math.min(4, current + 1));
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
    return Boolean(value.addressLine.trim() && value.departmentCode && value.provinceCode && value.districtCode);
  }

  deliveryValid(): boolean {
    const value = this.form.getRawValue();
    return Boolean(value.requestedDeliveryDate && value.warehouseId && this.lines().length);
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
    const warehouse = this.selectedWarehouse();
    const destination = this.selectedAddressLabel();
    return warehouse && destination ? directionsUrl(warehouse.address || warehouse.name, `${destination}, Peru`) : '';
  }

  warehouseLabel(warehouse: BuyerWarehouse): string {
    const hours = [warehouse.operatingHoursStart, warehouse.operatingHoursEnd].filter((value): value is string => Boolean(value)).join('–');
    return [warehouse.name, warehouse.address, hours].filter(Boolean).join(' · ');
  }

  private command(): BuyerRequestCommand {
    const value = this.form.getRawValue();
    const manualAddress: DeliveryAddressInput | null = value.addressMode === 'manual'
      ? { addressType: value.addressType, line: value.addressLine, reference: value.reference, countryCode: 'PE', departmentCode: value.departmentCode, provinceCode: value.provinceCode, districtCode: value.districtCode }
      : null;
    return {
      clientAccountId: this.accountId(),
      addressId: value.addressMode === 'saved' ? value.addressId || null : null,
      manualAddress,
      requestedDeliveryDate: value.requestedDeliveryDate,
      deliveryNotes: value.deliveryNotes,
      warehouseId: value.warehouseId || null,
      paymentOption: value.paymentOption,
      comments: value.comments,
      lines: this.lines().map(({ catalogItemId, quantity, unit, notes }) => ({ catalogItemId, quantity, unit, notes })),
    };
  }
}
