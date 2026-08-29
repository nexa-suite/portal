import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';
import { CatalogApiPort } from '../../../catalogcommercialpolicy/application/ports/catalog-api.port';
import { CatalogAvailabilityStatus, CatalogItemSummary, DEFAULT_CATALOG_QUERY } from '../../../catalogcommercialpolicy/domain/catalog.models';
import { PortalCatalogCartFacade } from '../../compositions/portal/catalog-cart.facade';
import { BuyerAccountApiPort } from '../../../customerbuyerrelationships/application/ports/buyer-account-api.port';
import { BuyerClientAccount } from '../../../customerbuyerrelationships/domain/buyer-account.models';
import { DeliveryTrackingApiPort } from '../../../fulfillmentdelivery/application/ports/delivery-tracking-api.port';
import { BuyerDeliveryStatus, Delivery } from '../../../fulfillmentdelivery/domain/delivery.models';
import { RECEIVABLES_PORT } from '../../../creditreceivables/application/receivables.port';
import { Receivable } from '../../../creditreceivables/domain/receivables.models';
import { PurchaseRequest, PurchaseRequestPage } from '../../../salescommitment/domain/purchase-requests/purchase-request.models';
import { PurchaseRequestApiPort } from '../../../salescommitment/application/ports/purchase-request-api.port';
import { SalesOrder, SalesOrderPage } from '../../../salescommitment/domain/orders/sales-order.models';
import { SalesOrderApiPort } from '../../../salescommitment/application/ports/sales-order-api.port';
import { ErrorStateComponent } from '../../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../shared/presentation/components/loading-state/loading-state.component';
import { ButtonComponent } from '../../../shared/presentation/components/button/button.component';
import { NexaIconComponent } from '../../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { StatusBadgeComponent, StatusTone } from '../../../shared/presentation/components/status-badge/status-badge.component';
import { PORTAL_SECURITY_BOUNDARY } from '../../security/portal-security.boundary';
import { LanguageService } from '../../i18n/language.service';
import { formatBuyerDeliveryDestination } from '../../../fulfillmentdelivery/presentation/delivery-destination.util';

interface HomeFeed<T> { readonly value: T; readonly failed: boolean; }
type FlowStep = 'request' | 'order' | 'delivery';
type FlowState = 'complete' | 'current' | 'upcoming';
type TrackingStepState = 'done' | 'active' | 'pending';

interface TrackingStep {
  readonly key: string;
  readonly labelKey: string;
  readonly index: number;
  readonly state: TrackingStepState;
  readonly dateLabel: string;
}

@Component({
  selector: 'nexa-home-page',
  imports: [
    ErrorStateComponent,
    LoadingStateComponent,
    ButtonComponent,
    NexaIconComponent,
    RouterLink,
    StatusBadgeComponent,
    TranslatePipe,
  ],
  templateUrl: './home-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomePageComponent {
  private readonly catalog = inject(CatalogApiPort);
  private readonly accountApi = inject(BuyerAccountApiPort);
  private readonly deliveries = inject(DeliveryTrackingApiPort);
  private readonly receivables = inject(RECEIVABLES_PORT);
  private readonly requests = inject(PurchaseRequestApiPort);
  private readonly orders = inject(SalesOrderApiPort);
  readonly auth = inject(PORTAL_SECURITY_BOUNDARY);
  readonly cart = inject(PortalCatalogCartFacade);
  private readonly language = inject(LanguageService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly partial = signal(false);
  readonly accountUnavailable = signal(false);
  readonly requestItems = signal<readonly PurchaseRequest[]>([]);
  readonly orderItems = signal<readonly SalesOrder[]>([]);
  readonly deliveryItems = signal<readonly Delivery[]>([]);
  readonly receivableItems = signal<readonly Receivable[]>([]);
  readonly featuredItems = signal<readonly CatalogItemSummary[]>([]);
  readonly clientAccount = signal<BuyerClientAccount | null>(null);
  readonly catalogTotal = signal(0);
  readonly flowSteps: readonly FlowStep[] = ['request', 'order', 'delivery'];
  private readonly terminalDeliveryStatuses = new Set<BuyerDeliveryStatus>(['DELIVERED', 'DELIVERY_CANCELLED']);

  readonly activeDelivery = computed(() => this.deliveryItems().find((item) => !this.terminalDeliveryStatuses.has(item.status)) ?? null);
  readonly latestRequest = computed(() => this.requestItems()[0] ?? null);
  readonly latestOrder = computed(() => {
    const deliveryOrderId = this.activeDelivery()?.salesOrderId;
    return this.orderItems().find((item) => item.id === deliveryOrderId)
      ?? this.orderItems().find((item) => !['REJECTED', 'CANCELLED'].includes(item.status))
      ?? this.orderItems()[0]
      ?? null;
  });
  // The API session exposes the buyer membership, while the canonical buyer
  // account relation is resolved by GET /client-accounts/me. Keep the home
  // gate based on the resolved account so a valid buyer is not treated as
  // unlinked merely because the JWT membership omits clientAccountId.
  readonly hasClient = computed(() => Boolean(this.clientAccount()?.id || this.auth.identity()?.clientAccountId));
  readonly firstName = computed(() => {
    const name = this.auth.identity()?.displayName?.trim();
    return name?.split(/\s+/)[0] || 'Buyer';
  });
  readonly companyName = computed(() => this.clientAccount()?.commercialName || this.clientAccount()?.businessName || this.auth.identity()?.displayName || 'your workspace');
  readonly activeOffers = computed(() => this.featuredItems().filter((item) => item.promotionLabel || item.appliedPromotions.length > 0).slice(0, 3));

  constructor() { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      requests: this.safe(this.requests.list(), { items: [], page: 0, size: 50, total: 0 } satisfies PurchaseRequestPage),
      orders: this.safe(this.orders.list(), { items: [], page: 0, size: 50, total: 0 } satisfies SalesOrderPage),
      deliveries: this.safe(this.deliveries.list(), { items: [], page: 0, size: 100, total: 0 }),
      receivables: this.safe(this.receivables.list(), { items: [], page: 0, size: 25, total: 0 }),
      catalog: this.safe(this.catalog.list({ ...DEFAULT_CATALOG_QUERY, size: 4 }), { ...DEFAULT_CATALOG_QUERY, items: [], totalItems: 0, totalPages: 0, sort: { field: '', direction: '' } }),
      account: this.safe(this.accountApi.clientAccount(), null),
    }).subscribe({
      next: (feed) => {
        this.requestItems.set(feed.requests.value.items);
        this.orderItems.set(feed.orders.value.items);
        this.deliveryItems.set(feed.deliveries.value.items);
        this.receivableItems.set(feed.receivables.value.items);
        this.featuredItems.set(feed.catalog.value.items);
        this.clientAccount.set(feed.account.value);
        this.catalogTotal.set(feed.catalog.value.totalItems);
        this.accountUnavailable.set(feed.account.failed);
        this.partial.set(Object.values(feed).some((item) => item.failed));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar el espacio comprador. Inténtalo nuevamente.');
        this.loading.set(false);
      },
    });
  }

  outstandingReceivables(): number {
    return this.receivableItems().reduce((total, item) => total + Math.max(0, item.remaining), 0);
  }

  activeDeliveries(): number {
    return this.deliveryItems().filter((item) => !['DELIVERED', 'DELIVERY_CANCELLED'].includes(item.status)).length;
  }

  openOrders(): number {
    return this.orderItems().filter((item) => !['REJECTED', 'CANCELLED'].includes(item.status)).length;
  }

  flowState(step: FlowStep): FlowState {
    if (step === 'request') return this.requestItems().length > 0 ? 'complete' : 'current';
    if (step === 'order') return this.orderItems().length > 0 ? 'complete' : this.requestItems().length > 0 ? 'current' : 'upcoming';
    if (this.activeDelivery()) return 'current';
    return this.deliveryItems().some((item) => item.status === 'DELIVERED') ? 'complete' : 'upcoming';
  }

  requestTone(status: PurchaseRequest['status']): StatusTone {
    if (status === 'APPROVED' || status === 'CONVERTED_TO_ORDER') return 'success';
    if (status === 'REJECTED' || status === 'CANCELLED') return 'danger';
    if (status === 'DRAFT' || status === 'NEEDS_ADJUSTMENT') return 'warning';
    return 'info';
  }

  orderTone(status: SalesOrder['status']): StatusTone {
    if (status === 'CONFIRMED') return 'success';
    if (status === 'REJECTED' || status === 'CANCELLED') return 'danger';
    if (status === 'PENDING') return 'warning';
    return 'neutral';
  }

  deliveryTone(status: Delivery['status']): StatusTone {
    if (status === 'DELIVERED') return 'success';
    if (status === 'DELIVERY_CANCELLED' || status === 'DELIVERY_REVIEW') return 'danger';
    if (status === 'DELIVERY_SCHEDULED' || status === 'DELIVERY_RESCHEDULED') return 'warning';
    return 'info';
  }

  availabilityTone(status: CatalogAvailabilityStatus): StatusTone {
    if (status === 'AVAILABLE') return 'success';
    if (status === 'LOW') return 'warning';
    if (status === 'OUT_OF_STOCK' || status === 'UNAVAILABLE') return 'danger';
    return 'neutral';
  }

  productTitle(item: CatalogItemSummary): string {
    return item.productFamilyName || item.itemName;
  }

  priceLabel(item: CatalogItemSummary): string {
    const price = item.effectivePrice ?? item.unitPrice ?? item.basePrice;
    return price ? `${item.currency} ${price.amount}` : item.currency;
  }

  recommendedItems(): readonly CatalogItemSummary[] {
    return this.featuredItems().slice(0, 4);
  }

  trackingSteps(): readonly TrackingStep[] {
    const order = this.latestOrder();
    const delivery = this.activeDelivery();
    const orderStatus = order?.status ?? null;
    const deliveryStatus = delivery?.status ?? null;
    const currentIndex = deliveryStatus === 'DELIVERED'
      ? 8
      : deliveryStatus === 'IN_TRANSIT'
        ? 7
        : deliveryStatus === 'DELIVERY_SCHEDULED'
          ? 6
          : deliveryStatus === 'PREPARING_DELIVERY'
            ? 5
            : orderStatus === 'CONFIRMED'
              ? 2
              : this.latestRequest()
                ? 1
                : 0;
    const timestamps: Record<string, string | null> = {
      submitted: this.latestRequest() ? null : null,
      validating: null,
      confirmed: order?.createdAt ?? null,
      document_pending: null,
      ready_for_dispatch: null,
      preparing: deliveryStatus === 'PREPARING_DELIVERY' ? delivery?.updatedAt ?? null : null,
      ready_for_route: deliveryStatus === 'DELIVERY_SCHEDULED' ? delivery?.updatedAt ?? null : null,
      in_route: deliveryStatus === 'IN_TRANSIT' ? delivery?.updatedAt ?? null : null,
      delivered: deliveryStatus === 'DELIVERED' ? delivery?.updatedAt ?? null : null,
    };
    const steps = [
      'submitted',
      'validating',
      'confirmed',
      'document_pending',
      'ready_for_dispatch',
      'preparing',
      'ready_for_route',
      'in_route',
      'delivered',
    ];
    const explicitlyCompleted = new Set<number>();
    if (this.latestRequest()) explicitlyCompleted.add(0);
    if (orderStatus === 'CONFIRMED') {
      explicitlyCompleted.add(1);
      explicitlyCompleted.add(2);
    }
    if (deliveryStatus === 'DELIVERED') {
      steps.forEach((_step, index) => explicitlyCompleted.add(index));
    }
    return steps.map((key, index) => ({
      key,
      labelKey: `home.homePanel.tracking.${key}`,
      index: index + 1,
      state: explicitlyCompleted.has(index) ? 'done' : index === currentIndex ? 'active' : 'pending',
      dateLabel: this.formatTrackingDate(timestamps[key]),
    }));
  }

  statusLabel(): string {
    const delivery = this.activeDelivery();
    if (delivery) return `delivery.status.${delivery.status}`;
    const order = this.latestOrder();
    if (order) return `orders.status.${order.status}`;
    const request = this.latestRequest();
    return request ? `purchaseRequests.status.${request.status}` : 'home.homePanel.noActiveRequest';
  }

  statusTone(): StatusTone {
    const delivery = this.activeDelivery();
    if (delivery) return this.deliveryTone(delivery.status);
    const order = this.latestOrder();
    if (order) return this.orderTone(order.status);
    const request = this.latestRequest();
    return request ? this.requestTone(request.status) : 'neutral';
  }

  requestedDeliveryLabel(): string {
    const delivery = this.activeDelivery();
    if (delivery?.deliveryWindowStart) return this.formatTrackingDate(delivery.deliveryWindowStart);
    return 'home.homePanel.deliveryPending';
  }

  destinationLabel(): string {
    const destination = this.activeDelivery()?.destination;
    return destination ? formatBuyerDeliveryDestination({ destination }) : '';
  }

  offerLabel(item: CatalogItemSummary): string {
    return item.promotionLabel || item.appliedPromotions[0]?.name || 'home.homePanel.catalogOffer';
  }

  addToRequest(item: CatalogItemSummary): void {
    this.cart.add(item);
  }

  canAddToRequest(item: CatalogItemSummary): boolean {
    return !['OUT_OF_STOCK', 'UNAVAILABLE'].includes(item.availabilityStatus);
  }

  formatTrackingDate(value: string | null): string {
    if (!value) return 'home.homePanel.trackingPending';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'home.homePanel.trackingPending';
    const locale = this.language.currentLanguage() === 'es' ? 'es-PE' : 'en-US';
    return new Intl.DateTimeFormat(locale, { month: 'short', day: '2-digit' }).format(date);
  }

  private safe<T>(stream: Observable<T>, fallback: T): Observable<HomeFeed<T>> {
    return stream.pipe(
      map((value) => ({ value, failed: false })),
      catchError(() => of({ value: fallback, failed: true })),
    );
  }
}
