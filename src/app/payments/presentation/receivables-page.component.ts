import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { PaymentsApiClient } from '../infrastructure/payments-api.client';
import { PaymentIntent, Receivable } from '../domain/payment.models';

@Component({
  selector: 'nexa-receivables-page',
  imports: [DecimalPipe, PageHeaderComponent, RouterLink],
  template: `
    <section class="page">
      <nexa-page-header eyebrow="Pagos" title="Cuentas por cobrar" subtitle="Deuda y Payment Intent se calculan sobre órdenes confirmadas por la API." />
      <p class="context">Área: Buyer · Los importes son de solo lectura y no se reciben desde el navegador.</p>
      <nav class="links" aria-label="Pagos">
        <a routerLink="/portal/payment-methods">Métodos de pago</a>
        <a routerLink="/portal/support">Soporte</a>
      </nav>
      @if (loading()) { <p role="status">Cargando cuentas por cobrar…</p> }
      @if (error(); as message) { <p role="alert">{{ message }}</p> }
      @if (!loading() && !error()) {
        <table>
          <thead><tr><th>Número</th><th>Orden</th><th>Importe</th><th>Saldo</th><th>Vencimiento</th><th>Estado</th><th>Acción</th></tr></thead>
          <tbody>
            @for (item of receivables(); track item.id) {
              <tr [class.focused]="item.id === receivableId()">
                <td>{{ item.number }}</td><td>{{ item.subjectId }}</td><td>{{ item.amount | number:'1.2-2' }} {{ item.currency }}</td><td>{{ item.remaining | number:'1.2-2' }} {{ item.currency }}</td><td>{{ item.dueAt || '—' }}</td><td>{{ item.status }}</td>
                <td><button type="button" [disabled]="!payable(item) || creatingFor() === item.id" (click)="createIntent(item)">{{ creatingFor() === item.id ? 'Creando…' : 'Crear Payment Intent de prueba' }}</button></td>
              </tr>
            } @empty { <tr><td colspan="7">No hay cuentas por cobrar autorizadas.</td></tr> }
          </tbody>
        </table>
      }
      @if (intent(); as created) {
        <section class="result" aria-live="polite">
          <h2>Payment Intent creado</h2>
          <p>Estado: {{ created.status }} · Proveedor: {{ created.providerPaymentIntentId || '—' }}</p>
          <p>El backend entregó el client secret solo para esta respuesta autorizada; no se persiste en el Portal.</p>
          @if (created.clientSecret) { <code>{{ created.clientSecret }}</code> }
        </section>
      }
    </section>
  `,
  styles: [`:host{display:block}.page{display:grid;gap:1rem}.context{margin:0;color:#52647b}.links{display:flex;gap:1rem;flex-wrap:wrap}table{width:100%;border-collapse:collapse}th,td{padding:.65rem;text-align:left;border-bottom:1px solid #dbe3ee;vertical-align:top}.focused{background:#eef6ff}button{padding:.45rem .7rem}.result{padding:1rem;border:1px solid #b9d7f7;border-radius:.5rem;background:#f7fbff}code{display:block;overflow-wrap:anywhere}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReceivablesPageComponent {
  readonly receivableId = input<string>();
  private readonly api = inject(PaymentsApiClient);
  readonly receivables = signal<readonly Receivable[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly creatingFor = signal<string | null>(null);
  readonly intent = signal<PaymentIntent | null>(null);
  readonly focused = computed(() => this.receivables().find((item) => item.id === this.receivableId()) ?? null);

  constructor() { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.list().subscribe({
      next: (page) => { this.receivables.set(page.items); this.loading.set(false); },
      error: () => { this.error.set('El servicio de pagos no respondió.'); this.loading.set(false); },
    });
  }

  payable(item: Receivable): boolean { return item.remaining > 0 && ['OPEN', 'PARTIALLY_PAID', 'OVERDUE'].includes(item.status); }

  createIntent(item: Receivable): void {
    if (!this.payable(item) || this.creatingFor()) return;
    this.creatingFor.set(item.id);
    this.error.set(null);
    this.api.createPaymentIntent(item.id).subscribe({
      next: (value) => { this.intent.set(value); this.creatingFor.set(null); },
      error: () => { this.error.set('No se pudo crear el Payment Intent.'); this.creatingFor.set(null); },
    });
  }
}
