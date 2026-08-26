import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { ErrorStateComponent } from '../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { PortalNotificationsFacade } from '../application/portal-notifications.facade';
import { PortalNotification } from '../domain/notification.models';

@Component({
  selector: 'nexa-notifications-page',
  imports: [DatePipe, MatButtonModule, MatCardModule, TranslatePipe, PageHeaderComponent, ErrorStateComponent, LoadingStateComponent],
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
}
