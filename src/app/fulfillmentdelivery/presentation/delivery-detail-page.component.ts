import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ErrorStateComponent } from '../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { NexaIconComponent } from '../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../shared/presentation/components/section-panel/section-panel.component';
import { StatusBadgeComponent, StatusTone } from '../../shared/presentation/components/status-badge/status-badge.component';
import { DeliveryTrackingFacade } from '../application/delivery-tracking.facade';
import { BuyerDeliveryStatus, Delivery } from '../domain/delivery.models';
import { formatBuyerDeliveryDestination } from './delivery-destination.util';

@Component({
  selector: 'nexa-delivery-detail-page',
  standalone: true,
  imports: [DatePipe, RouterLink, TranslatePipe, PageHeaderComponent, LoadingStateComponent, ErrorStateComponent, NexaIconComponent, SectionPanelComponent, StatusBadgeComponent],
  templateUrl: './delivery-detail-page.component.html',
  styleUrl: './delivery-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeliveryDetailPageComponent {
  readonly facade = inject(DeliveryTrackingFacade);
  readonly id = inject(ActivatedRoute).snapshot.paramMap.get('dispatchOrderId')!;

  constructor() { this.facade.loadDetail(this.id); }

  deliveryTone(status: BuyerDeliveryStatus): StatusTone {
    if (status === 'DELIVERED') return 'success';
    if (status === 'DELIVERY_REVIEW' || status === 'DELIVERY_RESCHEDULED') return 'warning';
    if (status === 'DELIVERY_CANCELLED' || status === 'UNKNOWN') return 'danger';
    return 'info';
  }

  podTone(item: Delivery): StatusTone { return item.podStatus === 'COMPLETED' ? 'success' : 'warning'; }

  destinationLabel(item: Delivery): string { return formatBuyerDeliveryDestination(item); }
}
