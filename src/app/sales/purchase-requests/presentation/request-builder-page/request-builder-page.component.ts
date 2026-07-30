import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { CatalogApiClient } from '../../../../catalog-management/infrastructure/catalog-api.client';
import { CatalogItemDetail, CatalogItemSummary, DEFAULT_CATALOG_QUERY } from '../../../../catalog-management/domain/catalog.models';
import { ErrorStateComponent } from '../../../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../../shared/presentation/components/loading-state/loading-state.component';
import { PageHeaderComponent } from '../../../../shared/presentation/components/page-header/page-header.component';
import { PurchaseRequestSelfServiceFacade } from '../../application/purchase-request-self-service.facade';
import {
  canEditPurchaseRequest,
  PaymentOption,
  PurchaseRequestDetailsCommand,
  PurchaseRequestLine,
  PurchaseRequestPriority,
} from '../../domain/purchase-request.models';

interface BuilderLine {
  readonly id: string;
  readonly catalogItemId: string;
  readonly itemName: string;
  readonly presentation: string;
  readonly quantity: number;
  readonly unit: string;
  readonly notes: string;
}

@Component({
  selector: 'nexa-request-builder-page',
  imports: [ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule, RouterLink, TranslatePipe, PageHeaderComponent, ErrorStateComponent, LoadingStateComponent],
  templateUrl: './request-builder-page.component.html',
  styleUrl: './request-builder-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestBuilderPageComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly catalog = inject(CatalogApiClient);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly facade = inject(PurchaseRequestSelfServiceFacade);
  readonly form = this.fb.group({
    priority: this.fb.control<PurchaseRequestPriority>('NORMAL', Validators.required),
    requestedDeliveryDate: this.fb.control(''),
    deliveryProfileSnapshot: this.fb.control(''),
    paymentOption: this.fb.control<PaymentOption>('CASH_ON_DELIVERY', Validators.required),
    comment: this.fb.control(''),
  });
  readonly catalogSearch = this.fb.control('');
  readonly catalogSelection = this.fb.control('');
  readonly quantity = this.fb.control(1, [Validators.required, Validators.min(0.01)]);
  readonly catalogItems = signal<readonly CatalogItemSummary[]>([]);
  readonly lines = signal<readonly BuilderLine[]>([]);
  readonly message = signal<string | null>(null);
  readonly canEdit = computed(() => canEditPurchaseRequest(this.facade.detailState().item?.status ?? 'DRAFT'));
  private hydratedId: string | null = null;

  constructor() {
    effect(() => {
      const item = this.facade.detailState().item;
      if (!item || item.id === this.hydratedId) return;
      this.hydratedId = item.id;
      this.form.patchValue({
        priority: item.priority,
        requestedDeliveryDate: item.requestedDeliveryDate ?? '',
        deliveryProfileSnapshot: item.deliveryProfileSnapshot ?? '',
        paymentOption: item.paymentOption ?? 'CASH_ON_DELIVERY',
        comment: item.comment ?? '',
      }, { emitEvent: false });
      this.lines.set(item.lines.map((line) => this.builderLine(line)));
      if (canEditPurchaseRequest(item.status)) this.form.enable({ emitEvent: false });
      else this.form.disable({ emitEvent: false });
    });
    this.facade.loadOrCreateDraft(this.route.snapshot.paramMap.get('purchaseRequestId'));
  }

  searchCatalog(): void {
    const q = this.catalogSearch.value.trim();
    this.catalog.list({ ...DEFAULT_CATALOG_QUERY, q, size: 20 }).subscribe({
      next: (page) => { this.catalogItems.set(page.items); this.message.set(null); },
      error: () => this.message.set('CATALOG_SELECTION_FAILED'),
    });
  }

  addCatalogItem(): void {
    const request = this.facade.detailState().item;
    const catalogItemId = this.catalogSelection.value;
    if (!request || !this.canEdit() || !catalogItemId || this.quantity.invalid) return;
    if (this.lines().some((line) => line.catalogItemId === catalogItemId)) {
      this.message.set('REQUEST_LINE_DUPLICATE');
      return;
    }
    this.catalog.getById(catalogItemId).subscribe({
      next: (item) => {
        this.facade.addLine(request, { catalogItemId: item.catalogItemId, quantity: this.quantity.value, unit: 'unit', notes: '' });
        this.catalogSelection.reset();
        this.quantity.setValue(1);
      },
      error: () => this.message.set('CATALOG_SELECTION_FAILED'),
    });
  }

  updateLine(line: BuilderLine, event: Event): void {
    const request = this.facade.detailState().item;
    const input = event.target as HTMLInputElement;
    const quantity = Number(input.value);
    if (!request || !this.canEdit() || !line.id || !Number.isFinite(quantity) || quantity <= 0) return;
    this.facade.updateLine(request, line.id, quantity, line.notes);
  }

  removeLine(line: BuilderLine): void {
    const request = this.facade.detailState().item;
    if (request && this.canEdit() && line.id) this.facade.deleteLine(request, line.id);
  }

  saveDraft(): void {
    const request = this.facade.detailState().item;
    if (!request || !this.canEdit()) return;
    this.facade.save(request, this.details(), (item) => {
      this.message.set('PURCHASE_REQUEST_SAVED');
      void this.router.navigate(['/portal/purchase-requests', item.id]);
    });
  }

  submit(): void {
    const request = this.facade.detailState().item;
    if (!request || !this.canEdit()) return;
    this.facade.save(request, this.details(), (saved) => this.facade.submit(saved, () => this.message.set('PURCHASE_REQUEST_SUBMITTED')));
  }

  reload(): void { this.facade.loadOrCreateDraft(this.route.snapshot.paramMap.get('purchaseRequestId')); }

  private details(): PurchaseRequestDetailsCommand {
    const value = this.form.getRawValue();
    return { ...value, requestedDeliveryDate: value.requestedDeliveryDate || null };
  }

  private builderLine(line: PurchaseRequestLine): BuilderLine {
    return { id: line.id, catalogItemId: line.catalogItemId, itemName: line.itemName, presentation: line.presentation, quantity: line.quantity, unit: line.unit, notes: line.notes ?? '' };
  }
}
