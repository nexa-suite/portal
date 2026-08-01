import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ErrorStateComponent } from '../../../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../../shared/presentation/components/loading-state/loading-state.component';
import { PageHeaderComponent } from '../../../../shared/presentation/components/page-header/page-header.component';
import { SalesOrderSelfServiceFacade } from '../../application/sales-order-self-service.facade';
import { DeliveryTrackingApiClient } from '../../../../logistics/infrastructure/delivery-tracking-api.client';

@Component({
  selector: 'nexa-sales-order-detail-page',
  imports: [MatButtonModule, MatCardModule, MatChipsModule, RouterLink, TranslatePipe, ErrorStateComponent, LoadingStateComponent, PageHeaderComponent],
  templateUrl: './sales-order-detail-page.component.html',
  styleUrl: './sales-order-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesOrderDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly facade = inject(SalesOrderSelfServiceFacade);
  private readonly deliveryApi = inject(DeliveryTrackingApiClient);
  readonly matchingDeliveryId = signal<string | null>(null);

  constructor() {
    const id = this.route.snapshot.paramMap.get('salesOrderId');
    if (id) {
      this.facade.loadDetail(id);
      this.deliveryApi.list().subscribe({
        next: page => this.matchingDeliveryId.set(page.items.find(item => item.salesOrderId === id)?.id ?? null),
        error: () => this.matchingDeliveryId.set(null),
      });
    }
  }

  reload(): void { this.facade.reloadCurrent(); }
}
