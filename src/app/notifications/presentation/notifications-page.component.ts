import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonComponent } from '../../shared/presentation/components/button/button.component';
import { EmptyStateComponent } from '../../shared/presentation/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { MetricCardComponent } from '../../shared/presentation/components/metric-card/metric-card.component';
import { NexaIconComponent } from '../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../shared/presentation/components/section-panel/section-panel.component';
import { StatusBadgeComponent, StatusTone } from '../../shared/presentation/components/status-badge/status-badge.component';
import { PortalNotificationsFacade } from '../application/portal-notifications.facade';
import { PortalNotification } from '../domain/notification.models';

@Component({
  selector: 'nexa-notifications-page',
  imports: [DatePipe, TranslatePipe, ButtonComponent, EmptyStateComponent, ErrorStateComponent, LoadingStateComponent, MetricCardComponent, NexaIconComponent, PageHeaderComponent, SectionPanelComponent, StatusBadgeComponent],
  templateUrl: './notifications-page.component.html',
  styleUrl: './notifications-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsPageComponent {
  readonly facade = inject(PortalNotificationsFacade);
  private readonly router = inject(Router);

  constructor() { this.facade.load(); }

  open(item: PortalNotification): void {
    this.facade.markRead(item);
    if (item.deepLink?.startsWith('/portal/')) void this.router.navigateByUrl(item.deepLink);
  }

  iconFor(category: string): string {
    if (category === 'order') return 'verified';
    if (category === 'delivery') return 'local_shipping';
    if (category === 'document') return 'receipt_long';
    return 'warning';
  }

  categoryKey(category: string): string { return category.toLowerCase(); }

  statusTone(item: PortalNotification): StatusTone { return item.readAt ? 'neutral' : 'info'; }
}
