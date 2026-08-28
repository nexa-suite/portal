import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { SalesOrderListContextFacade, SalesOrderListDelivery, SalesOrderListDocument } from '../../../../core/compositions/portal/sales-order-list-context.facade';
import { EmptyStateComponent } from '../../../../shared/presentation/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../../shared/presentation/components/loading-state/loading-state.component';
import { NexaIconComponent } from '../../../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { StatusBadgeComponent, StatusTone } from '../../../../shared/presentation/components/status-badge/status-badge.component';
import { SalesOrderSelfServiceFacade } from '../../../application/orders/sales-order-self-service.facade';
import { SalesOrder, SalesOrderStatus } from '../../../domain/orders/sales-order.models';

type TrackingStepState = 'done' | 'active' | 'pending';

interface BuyerOrderTrackingStep {
  readonly key: string;
  readonly index: number;
  readonly labelKey: string;
  readonly state: TrackingStepState;
  readonly date: string | null;
}

@Component({
  selector: 'nexa-my-sales-orders-page',
  imports: [DatePipe, DecimalPipe, RouterLink, TranslatePipe, EmptyStateComponent, ErrorStateComponent, LoadingStateComponent, NexaIconComponent, StatusBadgeComponent],
  templateUrl: './my-sales-orders-page.component.html',
  styleUrl: './my-sales-orders-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MySalesOrdersPageComponent {
  readonly facade = inject(SalesOrderSelfServiceFacade);
  private readonly context = inject(SalesOrderListContextFacade);

  readonly orders = computed(() => this.facade.listState().page?.items ?? []);
  readonly totalOrders = computed(() => this.orders().length);
  readonly deliveries = this.context.deliveries;
  readonly documents = this.context.documents;
  readonly activeOrders = computed(() => this.orders().filter((order) => this.isActiveOrder(order)).length);
  readonly pendingDocuments = computed(() => this.orders().reduce((total, order) => total + this.documentsFor(order).filter((document) => !this.isDocumentReady(document)).length, 0));
  readonly latestOrder = computed(() => this.orders()[0] ?? null);

  private readonly deliveriesByOrder = computed(() => new Map(this.deliveries().filter((item) => item.salesOrderId).map((item) => [item.salesOrderId as string, item])));
  private readonly documentsByOrder = computed(() => {
    const map = new Map<string, SalesOrderListDocument[]>();
    for (const document of this.documents()) {
      const current = map.get(document.subjectId) ?? [];
      current.push(document);
      map.set(document.subjectId, current);
    }
    return map;
  });

  constructor() {
    this.facade.loadList();
  }

  orderTone(status: SalesOrderStatus): StatusTone {
    if (status === 'CONFIRMED') return 'success';
    if (status === 'PENDING') return 'warning';
    if (status === 'REJECTED') return 'danger';
    return 'neutral';
  }

  deliveryFor(order: SalesOrder): SalesOrderListDelivery | null {
    return this.deliveriesByOrder().get(order.id) ?? null;
  }

  documentsFor(order: SalesOrder): readonly SalesOrderListDocument[] {
    return this.documentsByOrder().get(order.id) ?? [];
  }

  displayStatusKey(order: SalesOrder): string {
    const delivery = this.deliveryFor(order);
    return delivery ? `delivery.status.${delivery.status}` : `orders.status.${order.status}`;
  }

  displayTone(order: SalesOrder): StatusTone {
    const delivery = this.deliveryFor(order);
    return delivery ? this.deliveryTone(delivery.status) : this.orderTone(order.status);
  }

  isNewOrder(order: SalesOrder): boolean {
    if (!order.createdAt) return false;
    const createdAt = Date.parse(order.createdAt);
    return Number.isFinite(createdAt) && Date.now() - createdAt < 14 * 24 * 60 * 60 * 1000;
  }

  isDocumentReady(document: { readonly status: string }): boolean {
    return ['GENERATED', 'READY', 'AVAILABLE'].includes(document.status.trim().toUpperCase());
  }

  readyDocumentCount(order: SalesOrder): number {
    return this.documentsFor(order).filter((document) => this.isDocumentReady(document)).length;
  }

  documentLabel(document: SalesOrderListDocument): string {
    return document.documentNumber || document.documentType;
  }

  currencyLabel(currency: string): string {
    return currency === 'PEN' ? 'S/' : currency;
  }

  trackingSteps(order: SalesOrder): readonly BuyerOrderTrackingStep[] {
    const delivery = this.deliveryFor(order);
    const documents = this.documentsFor(order);
    const stage = this.trackingStage(order, delivery);
    const deliveryDate = delivery?.updatedAt ?? null;
    const documentDate = documents.find((document) => this.isDocumentReady(document))?.generatedAt ?? null;
    const dates: readonly (string | null)[] = [
      order.createdAt,
      null,
      order.status === 'CONFIRMED' ? order.createdAt : null,
      documentDate,
      null,
      delivery?.status === 'PREPARING_DELIVERY' ? deliveryDate : null,
      delivery && ['DELIVERY_SCHEDULED', 'IN_TRANSIT', 'DELIVERED'].includes(delivery.status) ? deliveryDate : null,
      delivery && ['IN_TRANSIT', 'DELIVERED'].includes(delivery.status) ? deliveryDate : null,
      delivery?.status === 'DELIVERED' ? deliveryDate : null,
    ];
    const labels = [
      'home.homePanel.tracking.submitted',
      'home.homePanel.tracking.validating',
      'home.homePanel.tracking.confirmed',
      'home.homePanel.tracking.document_pending',
      'home.homePanel.tracking.ready_for_dispatch',
      'home.homePanel.tracking.preparing',
      'home.homePanel.tracking.ready_for_route',
      'home.homePanel.tracking.in_route',
      'home.homePanel.tracking.delivered',
    ];
    return labels.map((labelKey, index) => ({
      key: labelKey,
      index: index + 1,
      labelKey,
      state: index + 1 < stage ? 'done' : index + 1 === stage ? 'active' : 'pending',
      date: index + 1 <= stage ? dates[index] : null,
    }));
  }

  private isActiveOrder(order: SalesOrder): boolean {
    if (order.status === 'REJECTED' || order.status === 'CANCELLED') return false;
    const delivery = this.deliveryFor(order);
    return !delivery || !['DELIVERED', 'DELIVERY_CANCELLED'].includes(delivery.status);
  }

  private deliveryTone(status: SalesOrderListDelivery['status']): StatusTone {
    if (status === 'DELIVERED') return 'success';
    if (status === 'DELIVERY_REVIEW' || status === 'DELIVERY_RESCHEDULED') return 'warning';
    if (status === 'DELIVERY_CANCELLED' || status === 'UNKNOWN') return 'danger';
    return 'info';
  }

  private trackingStage(order: SalesOrder, delivery: SalesOrderListDelivery | null): number {
    if (delivery?.status === 'DELIVERED') return 9;
    if (delivery?.status === 'IN_TRANSIT') return 8;
    if (delivery?.status === 'DELIVERY_SCHEDULED') return 7;
    if (delivery?.status === 'PREPARING_DELIVERY' || delivery?.status === 'DELIVERY_REVIEW' || delivery?.status === 'DELIVERY_RESCHEDULED') return 6;
    if (delivery?.status === 'DELIVERY_CANCELLED') return 2;
    if (order.status === 'CONFIRMED') return 3;
    return 2;
  }
}
