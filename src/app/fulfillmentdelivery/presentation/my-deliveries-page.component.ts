import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonComponent } from '../../shared/presentation/components/button/button.component';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../shared/presentation/components/error-state/error-state.component';
import { EmptyStateComponent } from '../../shared/presentation/components/empty-state/empty-state.component';
import { MetricCardComponent } from '../../shared/presentation/components/metric-card/metric-card.component';
import { NexaIconComponent } from '../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { SectionPanelComponent } from '../../shared/presentation/components/section-panel/section-panel.component';
import { StatusBadgeComponent, StatusTone } from '../../shared/presentation/components/status-badge/status-badge.component';
import { DeliveryTrackingFacade } from '../application/delivery-tracking.facade';
import { BuyerDeliveryStatus, Delivery } from '../domain/delivery.models';
import { formatBuyerDeliveryDestination } from './delivery-destination.util';

@Component({
  selector: 'nexa-my-deliveries-page',
  standalone: true,
  imports: [DatePipe, RouterLink, TranslatePipe, ButtonComponent, PageHeaderComponent, LoadingStateComponent, ErrorStateComponent, EmptyStateComponent, MetricCardComponent, NexaIconComponent, SectionPanelComponent, StatusBadgeComponent],
  templateUrl: './my-deliveries-page.component.html',
  styleUrl: './my-deliveries-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyDeliveriesPageComponent {
  readonly facade = inject(DeliveryTrackingFacade);
  readonly deliveries = computed(() => this.facade.page()?.items ?? []);
  readonly activeDeliveries = computed(() => this.deliveries().filter((item) => !['DELIVERED', 'DELIVERY_CANCELLED'].includes(item.status)));
  readonly scheduledDeliveries = computed(() => this.deliveries().filter((item) => item.status === 'DELIVERY_SCHEDULED'));
  readonly pendingProof = computed(() => this.deliveries().filter((item) => item.podStatus !== 'COMPLETED'));

  constructor() { this.facade.loadList(); }

  deliveryTone(status: BuyerDeliveryStatus): StatusTone {
    if (status === 'DELIVERED') return 'success';
    if (status === 'DELIVERY_REVIEW' || status === 'DELIVERY_RESCHEDULED') return 'warning';
    if (status === 'DELIVERY_CANCELLED' || status === 'UNKNOWN') return 'danger';
    return 'info';
  }

  podTone(item: Delivery): StatusTone { return item.podStatus === 'COMPLETED' ? 'success' : 'warning'; }

  destinationLabel(item: Delivery): string { return formatBuyerDeliveryDestination(item); }
}
