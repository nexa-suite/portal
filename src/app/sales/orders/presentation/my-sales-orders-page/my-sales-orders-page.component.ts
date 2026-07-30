import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { EmptyStateComponent } from '../../../../shared/presentation/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../../shared/presentation/components/loading-state/loading-state.component';
import { PageHeaderComponent } from '../../../../shared/presentation/components/page-header/page-header.component';
import { SalesOrderSelfServiceFacade } from '../../application/sales-order-self-service.facade';

@Component({
  selector: 'nexa-my-sales-orders-page',
  imports: [MatButtonModule, MatCardModule, MatChipsModule, RouterLink, TranslatePipe, EmptyStateComponent, ErrorStateComponent, LoadingStateComponent, PageHeaderComponent],
  templateUrl: './my-sales-orders-page.component.html',
  styleUrl: './my-sales-orders-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MySalesOrdersPageComponent {
  readonly facade = inject(SalesOrderSelfServiceFacade);
  constructor() { this.facade.loadList(); }
}
