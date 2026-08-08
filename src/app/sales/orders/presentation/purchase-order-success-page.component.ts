import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { PageHeaderComponent } from '../../../shared/presentation/components/page-header/page-header.component';

@Component({
  selector: 'nexa-purchase-order-success-page',
  imports: [MatButtonModule, PageHeaderComponent, RouterLink],
  template: `
    <section class="page">
      <nexa-page-header eyebrow="Purchase order" title="Purchase order submitted" subtitle="Your request was accepted. The order and its next operational status are available from Orders." />
      <p>This confirmation does not invent a payment or fulfillment result. Review the server-owned order status before taking the next action.</p>
      <div class="actions"><a mat-flat-button color="primary" routerLink="/portal/purchase-orders">View purchase orders</a><a mat-stroked-button routerLink="/portal/home">Back to workspace</a></div>
    </section>
  `,
  styles: [`:host{display:block}.page{display:grid;gap:1rem;max-width:60rem}.page p{max-width:65ch}.actions{display:flex;flex-wrap:wrap;gap:.75rem}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseOrderSuccessPageComponent {}
