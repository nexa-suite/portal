import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ErrorStateComponent } from '../../../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../../shared/presentation/components/loading-state/loading-state.component';
import { PageHeaderComponent } from '../../../../shared/presentation/components/page-header/page-header.component';
import { SalesOrderSelfServiceFacade } from '../../../application/orders/sales-order-self-service.facade';
import { SalesOrderDeliveryPort } from '../../../application/ports/sales-order-delivery.port';
import { SalesOrderDeliveryProjection } from '../../../domain/orders/sales-order-delivery.models';

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
  private readonly delivery = inject(SalesOrderDeliveryPort);
  readonly matchingDeliveryId = computed(() => {
    const number = this.facade.detailState().item?.number;
    return this.deliveryPage().find(item => item.salesOrderNumber === number)?.id ?? null;
  });
  private readonly deliveryPage = signal<readonly SalesOrderDeliveryProjection[]>([]);

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
}
