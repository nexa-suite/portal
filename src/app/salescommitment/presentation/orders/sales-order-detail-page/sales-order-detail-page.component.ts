import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonComponent } from '../../../../shared/presentation/components/button/button.component';
import { ErrorStateComponent } from '../../../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../../shared/presentation/components/loading-state/loading-state.component';
import { NexaIconComponent } from '../../../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { PageHeaderComponent } from '../../../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../../../shared/presentation/components/section-panel/section-panel.component';
import { StatusBadgeComponent, StatusTone } from '../../../../shared/presentation/components/status-badge/status-badge.component';
import { SalesOrderSelfServiceFacade } from '../../../application/orders/sales-order-self-service.facade';
import { SalesOrderDeliveryPort } from '../../../application/ports/sales-order-delivery.port';
import { SalesOrder, SalesOrderEvent, SalesOrderStatus } from '../../../domain/orders/sales-order.models';
import { SalesOrderDeliveryProjection } from '../../../domain/orders/sales-order-delivery.models';

@Component({
  selector: 'nexa-sales-order-detail-page',
  imports: [DatePipe, DecimalPipe, RouterLink, TranslatePipe, ButtonComponent, ErrorStateComponent, LoadingStateComponent, NexaIconComponent, PageHeaderComponent, SectionPanelComponent, StatusBadgeComponent],
  templateUrl: './sales-order-detail-page.component.html',
  styleUrl: './sales-order-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesOrderDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly facade = inject(SalesOrderSelfServiceFacade);
  private readonly delivery = inject(SalesOrderDeliveryPort);
  readonly matchingDeliveryId = computed(() => {
    const number = this.facade.detailState().item?.number;
    return this.deliveryPage().find(item => item.salesOrderNumber === number)?.id ?? null;
  });
  private readonly deliveryPage = signal<readonly SalesOrderDeliveryProjection[]>([]);
  readonly flowSteps = computed(() => {
    const order = this.facade.detailState().item;
    if (!order) return [];
    return [
      { key: 'request', icon: 'request_quote', label: 'orders.flow.request', state: order.purchaseRequestId ? 'complete' : 'upcoming' },
      { key: 'order', icon: 'receipt_long', label: 'orders.flow.order', state: order.status === 'CONFIRMED' ? 'complete' : 'current' },
      { key: 'delivery', icon: 'local_shipping', label: 'orders.flow.delivery', state: this.matchingDeliveryId() ? 'current' : 'upcoming' },
    ] as const;
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('salesOrderId');
    if (id) {
      this.facade.loadDetail(id);
      this.delivery.list().subscribe({
        next: page => this.deliveryPage.set(page),
        error: () => this.deliveryPage.set([]),
      });
    }
  }

  reload(): void { this.facade.reloadCurrent(); }

  orderTone(status: SalesOrderStatus): StatusTone {
    if (status === 'CONFIRMED') return 'success';
    if (status === 'PENDING') return 'warning';
    if (status === 'REJECTED') return 'danger';
    return 'neutral';
  }

  eventTone(event: SalesOrderEvent): StatusTone {
    if (event.type.includes('REJECT')) return 'danger';
    if (event.type.includes('CONFIRM')) return 'success';
    if (event.type.includes('CANCEL')) return 'neutral';
    return 'info';
  }

  itemCount(order: SalesOrder): number {
    return order.lines.reduce((total, line) => total + line.quantity, 0);
  }
}
