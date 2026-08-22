import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';
import { CatalogApiClient } from '../../../catalog-management/infrastructure/catalog-api.client';
import { DEFAULT_CATALOG_QUERY } from '../../../catalog-management/domain/catalog.models';
import { DeliveryTrackingApiClient } from '../../../logistics/infrastructure/delivery-tracking-api.client';
import { PaymentsApiClient } from '../../../payments/infrastructure/payments-api.client';
import { Receivable } from '../../../payments/domain/payment.models';
import { PurchaseRequest, PurchaseRequestPage } from '../../../sales/purchase-requests/domain/purchase-request.models';
import { PurchaseRequestApiClient } from '../../../sales/purchase-requests/infrastructure/purchase-request-api.client';
import { SalesOrder, SalesOrderPage } from '../../../sales/orders/domain/sales-order.models';
import { SalesOrderApiClient } from '../../../sales/orders/infrastructure/sales-order-api.client';
import { EmptyStateComponent } from '../../../shared/presentation/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../shared/presentation/components/loading-state/loading-state.component';
import { MetricCardComponent } from '../../../shared/presentation/components/metric-card/metric-card.component';
import { PageHeaderComponent } from '../../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../../shared/presentation/components/section-panel/section-panel.component';

interface HomeFeed<T> { readonly value: T; readonly failed: boolean; }

@Component({
  selector: 'nexa-home-page',
  imports: [
    EmptyStateComponent,
    ErrorStateComponent,
    LoadingStateComponent,
    MetricCardComponent,
    PageHeaderComponent,
    RouterLink,
    SectionPanelComponent,
    TranslatePipe,
  ],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomePageComponent {
  private readonly catalog = inject(CatalogApiClient);
  private readonly deliveries = inject(DeliveryTrackingApiClient);
  private readonly payments = inject(PaymentsApiClient);
  private readonly requests = inject(PurchaseRequestApiClient);
  private readonly orders = inject(SalesOrderApiClient);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly partial = signal(false);
  readonly requestItems = signal<readonly PurchaseRequest[]>([]);
  readonly orderItems = signal<readonly SalesOrder[]>([]);
  readonly deliveryItems = signal<readonly import('../../../logistics/domain/delivery.models').Delivery[]>([]);
  readonly receivableItems = signal<readonly Receivable[]>([]);
  readonly catalogTotal = signal(0);

  constructor() { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      requests: this.safe(this.requests.list(), { items: [], page: 0, size: 50, total: 0 } satisfies PurchaseRequestPage),
      orders: this.safe(this.orders.list(), { items: [], page: 0, size: 50, total: 0 } satisfies SalesOrderPage),
      deliveries: this.safe(this.deliveries.list(), { items: [], page: 0, size: 100, total: 0 }),
      receivables: this.safe(this.payments.list(), { items: [], page: 0, size: 25, total: 0 }),
      catalog: this.safe(this.catalog.list({ ...DEFAULT_CATALOG_QUERY, size: 1 }), { ...DEFAULT_CATALOG_QUERY, items: [], totalItems: 0, totalPages: 0, sort: { field: '', direction: '' } }),
    }).subscribe({
      next: (feed) => {
        this.requestItems.set(feed.requests.value.items);
        this.orderItems.set(feed.orders.value.items);
        this.deliveryItems.set(feed.deliveries.value.items);
        this.receivableItems.set(feed.receivables.value.items);
        this.catalogTotal.set(feed.catalog.value.totalItems);
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

  private safe<T>(stream: Observable<T>, fallback: T): Observable<HomeFeed<T>> {
    return stream.pipe(
      map((value) => ({ value, failed: false })),
      catchError(() => of({ value: fallback, failed: true })),
    );
  }
}
