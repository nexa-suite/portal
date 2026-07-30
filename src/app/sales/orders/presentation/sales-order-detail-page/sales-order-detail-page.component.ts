import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ErrorStateComponent } from '../../../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../../shared/presentation/components/loading-state/loading-state.component';
import { PageHeaderComponent } from '../../../../shared/presentation/components/page-header/page-header.component';
import { SalesOrderSelfServiceFacade } from '../../application/sales-order-self-service.facade';

@Component({
  selector: 'nexa-sales-order-detail-page',
  imports: [ReactiveFormsModule, MatButtonModule, MatCardModule, MatChipsModule, MatFormFieldModule, MatInputModule, RouterLink, TranslatePipe, ErrorStateComponent, LoadingStateComponent, PageHeaderComponent],
  templateUrl: './sales-order-detail-page.component.html',
  styleUrl: './sales-order-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesOrderDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(NonNullableFormBuilder);
  readonly facade = inject(SalesOrderSelfServiceFacade);
  readonly rejectionForm = this.fb.group({ reason: this.fb.control('', Validators.required) });

  constructor() {
    const id = this.route.snapshot.paramMap.get('salesOrderId');
    if (id) this.facade.loadDetail(id);
  }

  reject(): void {
    if (this.rejectionForm.invalid) { this.rejectionForm.markAllAsTouched(); return; }
    this.facade.reject(this.rejectionForm.controls.reason.value);
  }

  reload(): void { this.facade.reloadCurrent(); }
}
