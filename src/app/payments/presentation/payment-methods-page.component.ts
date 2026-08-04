import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';

@Component({
  selector: 'nexa-payment-methods-page',
  imports: [PageHeaderComponent, RouterLink],
  template: `
    <section class="page">
      <nexa-page-header eyebrow="Pagos" title="Métodos de pago" subtitle="Opciones habilitadas por el contexto comercial de tu workspace." />
      <div class="methods">
        <article><h2>Tarjeta · Stripe test</h2><p>El Payment Intent se crea en el servidor con importe y moneda de la cuenta por cobrar.</p><a routerLink="/portal/receivables">Ver deuda y continuar</a></article>
        <article><h2>Transferencia bancaria</h2><p>Registra una referencia y evidencia desde una cuenta por cobrar; la revisión mantiene el pago pendiente hasta aprobación.</p><a routerLink="/portal/receivables">Ver cuentas por cobrar</a></article>
        <article><h2>Línea de crédito</h2><p>La API valida exposición y reserva de crédito antes de aplicar el pago.</p><a routerLink="/portal/receivables">Ver cuentas por cobrar</a></article>
      </div>
    </section>
  `,
  styles: [`:host{display:block}.page{display:grid;gap:1rem}.methods{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem}.methods article{padding:1rem;border:1px solid #dbe3ee;border-radius:.5rem}.methods a{display:inline-block;margin-top:.5rem}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentMethodsPageComponent {}
