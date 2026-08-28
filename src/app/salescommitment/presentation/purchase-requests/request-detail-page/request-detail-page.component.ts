import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { PurchaseRequestDetailCatalogItem, PurchaseRequestDetailContextFacade } from '../../../../core/compositions/portal/purchase-request-detail-context.facade';
import { ErrorStateComponent } from '../../../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../../shared/presentation/components/loading-state/loading-state.component';
import { NexaIconComponent } from '../../../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { StatusBadgeComponent, StatusTone } from '../../../../shared/presentation/components/status-badge/status-badge.component';
import { PurchaseRequestSelfServiceFacade } from '../../../application/purchase-requests/purchase-request-self-service.facade';
import { canCancelPurchaseRequest, canEditPurchaseRequest, PurchaseRequest, PurchaseRequestPriority, PurchaseRequestStatus } from '../../../domain/purchase-requests/purchase-request.models';

interface DecisionStep {
  readonly key: string;
  readonly label: string;
  readonly state: 'done' | 'active' | 'pending';
}

@Component({
  selector: 'nexa-request-detail-page',
  imports: [RouterLink, TranslatePipe, ErrorStateComponent, LoadingStateComponent, NexaIconComponent, StatusBadgeComponent],
  templateUrl: './request-detail-page.component.html',
  styleUrl: './request-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestDetailPageComponent {
  readonly facade = inject(PurchaseRequestSelfServiceFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly context = inject(PurchaseRequestDetailContextFacade);

  readonly catalogItems = this.context.catalogItems;
  readonly clientAccount = this.context.clientAccount;
  readonly addresses = this.context.addresses;

  readonly defaultAddress = computed(() =>
    this.addresses().find((address) => address.defaultAddress) ?? this.addresses()[0] ?? null,
  );
  readonly accountLabel = computed(() =>
    this.clientAccount()?.commercialName || this.clientAccount()?.businessName || '—',
  );
  readonly requestTotal = computed(() => {
    const request = this.facade.detailState().item;
    return request?.lines.reduce((total, line) => total + line.quantity * line.unitPriceAmount, 0) ?? 0;
  });
  readonly decisionSteps = computed<readonly DecisionStep[]>(() => {
    const status = this.facade.detailState().item?.status ?? 'DRAFT';
    const salesComplete = ['APPROVED', 'CONVERTED_TO_ORDER'].includes(status);
    const adjustmentComplete = ['APPROVED', 'CONVERTED_TO_ORDER'].includes(status);
    const orderComplete = status === 'CONVERTED_TO_ORDER';
    return [
      { key: 'sent', label: 'Request sent', state: 'done' },
      {
        key: 'sales-validation',
        label: 'Sales validation',
        state: salesComplete ? 'done' : ['SUBMITTED', 'IN_REVIEW'].includes(status) ? 'active' : 'pending',
      },
      {
        key: 'buyer-adjustment',
        label: 'Buyer adjustment',
        state: status === 'NEEDS_ADJUSTMENT' ? 'active' : adjustmentComplete ? 'done' : 'pending',
      },
      {
        key: 'purchase-order',
        label: 'Purchase order',
        state: orderComplete ? 'done' : status === 'APPROVED' ? 'active' : 'pending',
      },
    ];
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('purchaseRequestId');
    if (id) this.facade.loadDetail(id);
  }

  canEdit(status: string): boolean {
    return canEditPurchaseRequest(status as Parameters<typeof canEditPurchaseRequest>[0]);
  }

  canCancel(status: string): boolean {
    return canCancelPurchaseRequest(status as Parameters<typeof canCancelPurchaseRequest>[0]);
  }

  canEditRequest(request: PurchaseRequest): boolean {
    return this.canEdit(request.status);
  }

  submit(): void {
    const item = this.facade.detailState().item;
    if (item) this.facade.submit(item);
  }

  cancel(): void {
    const item = this.facade.detailState().item;
    if (item) this.facade.cancel(item);
  }

  reload(): void {
    this.facade.reloadCurrent();
  }

  requestTone(status: PurchaseRequestStatus): StatusTone {
    if (status === 'APPROVED' || status === 'CONVERTED_TO_ORDER') return 'success';
    if (status === 'REJECTED' || status === 'CANCELLED') return 'danger';
    if (status === 'IN_REVIEW' || status === 'NEEDS_ADJUSTMENT') return 'warning';
    return 'info';
  }

  priorityTone(priority: PurchaseRequestPriority): StatusTone {
    return priority === 'URGENT' ? 'danger' : priority === 'HIGH' ? 'warning' : 'neutral';
  }

  catalogFor(line: PurchaseRequest['lines'][number]): PurchaseRequestDetailCatalogItem | null {
    return this.catalogItems().find((item) =>
      [item.catalogItemId, item.productId, item.sellableSkuId, item.skuCode].includes(line.catalogItemId),
    ) ?? null;
  }

  productName(line: PurchaseRequest['lines'][number]): string {
    return this.catalogFor(line)?.itemName || line.itemName || line.catalogItemId;
  }

  productSku(line: PurchaseRequest['lines'][number]): string {
    const item = this.catalogFor(line);
    return item?.skuCode || item?.sellableSkuId || line.catalogItemId;
  }

  productColdChain(line: PurchaseRequest['lines'][number]): string {
    const value = this.catalogFor(line)?.coldChainRequirement?.trim().toUpperCase();
    if (value === 'FROZEN') return 'Frozen';
    if (value === 'REFRIGERATED' || value === 'CHILLED') return 'Chilled';
    return value ? 'Ambient' : '';
  }

  unitLabel(line: PurchaseRequest['lines'][number]): string {
    return line.unit.trim().toUpperCase() === 'UNIT' ? 'UN' : line.unit.toUpperCase();
  }

  lineTotal(line: PurchaseRequest['lines'][number]): number {
    return line.quantity * line.unitPriceAmount;
  }

  currencyFor(request: PurchaseRequest): string {
    return request.lines[0]?.unitPriceCurrency || 'PEN';
  }

  formatMoney(amount: number, currency = 'PEN'): string {
    if (!Number.isFinite(amount)) return '—';
    return currency === 'PEN' ? `S/ ${amount.toFixed(2)}` : `${currency} ${amount.toFixed(2)}`;
  }

  addressLabel(): string {
    const address = this.defaultAddress();
    if (!address) return '';
    return [address.line, address.districtCode, address.provinceCode, address.departmentCode]
      .filter(Boolean)
      .join(', ');
  }

  referenceLabel(): string {
    return this.defaultAddress()?.reference?.trim() || '—';
  }

  requestAddress(request: PurchaseRequest): string {
    return this.addressLabel() || request.deliveryProfileSnapshot || '—';
  }

  requestDetailsSubtitle(request: PurchaseRequest): string {
    const date = request.requestedDeliveryDate || '—';
    const profile = request.deliveryProfileSnapshot || '—';
    return `Estimated delivery: — · requested ${date} · ${profile}`;
  }

}
