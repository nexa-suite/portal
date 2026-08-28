import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonComponent } from '../../../../shared/presentation/components/button/button.component';
import { ErrorStateComponent } from '../../../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../../shared/presentation/components/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../../../shared/presentation/components/empty-state/empty-state.component';
import { MetricCardComponent } from '../../../../shared/presentation/components/metric-card/metric-card.component';
import { NexaIconComponent } from '../../../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { PageHeaderComponent } from '../../../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../../../shared/presentation/components/section-panel/section-panel.component';
import { StatusBadgeComponent, StatusTone } from '../../../../shared/presentation/components/status-badge/status-badge.component';
import { PurchaseRequestSelfServiceFacade } from '../../../application/purchase-requests/purchase-request-self-service.facade';
import { PurchaseRequest, PurchaseRequestPriority, PurchaseRequestStatus } from '../../../domain/purchase-requests/purchase-request.models';

@Component({
  selector: 'nexa-my-requests-page',
  imports: [RouterLink, TranslatePipe, ButtonComponent, ErrorStateComponent, LoadingStateComponent, EmptyStateComponent, MetricCardComponent, NexaIconComponent, PageHeaderComponent, SectionPanelComponent, StatusBadgeComponent],
  templateUrl: './my-requests-page.component.html',
  styleUrl: './my-requests-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyRequestsPageComponent {
  readonly facade = inject(PurchaseRequestSelfServiceFacade);
  readonly requests = computed(() => this.facade.listState().page?.items ?? []);
  readonly openRequests = computed(() => this.requests().filter((request) => !['APPROVED', 'REJECTED', 'CANCELLED', 'CONVERTED_TO_ORDER'].includes(request.status)).length);
  readonly approvedRequests = computed(() => this.requests().filter((request) => request.status === 'APPROVED' || request.status === 'CONVERTED_TO_ORDER').length);
  readonly latestRequest = computed(() => this.requests()[0] ?? null);

  constructor() { this.facade.loadList(); }

  filter(status: string): void { this.facade.loadList(status); }

  filterFromEvent(event: Event): void { this.filter((event.target as HTMLSelectElement).value); }

  requestTone(status: PurchaseRequestStatus): StatusTone {
    if (status === 'APPROVED' || status === 'CONVERTED_TO_ORDER') return 'success';
    if (status === 'REJECTED' || status === 'CANCELLED') return 'danger';
    if (status === 'IN_REVIEW' || status === 'NEEDS_ADJUSTMENT') return 'warning';
    return 'info';
  }

  priorityTone(priority: PurchaseRequestPriority): StatusTone { return priority === 'URGENT' ? 'danger' : priority === 'HIGH' ? 'warning' : 'neutral'; }

  summaryText(request: PurchaseRequest): string | null {
    return request.reviewNote || request.comment || null;
  }
}
