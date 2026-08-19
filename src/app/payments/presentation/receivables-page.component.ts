import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, signal, viewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { PaymentsApiClient } from '../infrastructure/payments-api.client';
import { PaymentElementSession, StripeJsPaymentService } from '../infrastructure/stripe-js-payment.service';
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
                <td>
                  <button type="button" [disabled]="!payable(item) || creatingFor() === item.id" (click)="createIntent(item)">{{ creatingFor() === item.id ? 'Creando…' : 'Crear Payment Intent de prueba' }}</button>
                  <button type="button" [disabled]="!payable(item)" (click)="beginBankTransfer(item)">Reportar transferencia</button>
                </td>
              </tr>
            } @empty { <tr><td colspan="7">No hay cuentas por cobrar autorizadas.</td></tr> }
          </tbody>
        </table>
      }
      @if (bankTransferTarget(); as item) {
        <section class="bank-transfer" aria-labelledby="bank-transfer-title">
          <h2 id="bank-transfer-title">Reportar transferencia bancaria</h2>
          <p>Orden {{ item.number }} · Importe esperado: {{ item.remaining | number:'1.2-2' }} {{ item.currency }}</p>
          <form (submit)="submitBankTransfer($event, item)">
            <label [for]="'bank-transfer-reference-' + item.id">Referencia bancaria</label>
            <input [id]="'bank-transfer-reference-' + item.id" type="text" maxlength="160" autocomplete="off" required [value]="bankTransferReference()" (input)="bankTransferReference.set($any($event.target).value)" />
            <p class="hint">El comprobante es opcional; puedes continuar sin adjuntarlo.</p>
            @if (bankTransferError(); as message) { <p role="alert">{{ message }}</p> }
            @if (bankTransferSuccess(); as message) { <p class="success" role="status">{{ message }}</p> }
            <button type="submit" [disabled]="bankTransferSubmitting()">{{ bankTransferSubmitting() ? 'Registrando…' : 'Registrar transferencia' }}</button>
          </form>
        </section>
      }
      @if (intent(); as created) {
        <section class="result" aria-live="polite">
          <h2>Pago con tarjeta</h2>
          <p>Estado: {{ created.status }} · Proveedor: {{ created.providerPaymentIntentId || '—' }}</p>
          @if (paymentLoading()) { <p role="status">Cargando formulario seguro de Stripe…</p> }
          @if (paymentError(); as message) { <p role="alert">{{ message }}</p><button type="button" (click)="retryPaymentElement()">Reintentar formulario</button> }
          <div #paymentHost class="payment-element" aria-label="Formulario seguro de tarjeta"></div>
          @if (paymentReady()) { <button type="button" [disabled]="paying()" (click)="confirmPayment()">{{ paying() ? 'Procesando…' : 'Pagar de forma segura' }}</button> }
          @if (paymentSuccess()) { <p class="success" role="status">Pago enviado a Stripe. El estado final llegará por webhook.</p> }
        </section>
      }
    </section>
  `,
  styles: [`:host{display:block}.page{display:grid;gap:1rem}.context{margin:0;color:#52647b}.links{display:flex;gap:1rem;flex-wrap:wrap}table{width:100%;border-collapse:collapse}th,td{padding:.65rem;text-align:left;border-bottom:1px solid #dbe3ee;vertical-align:top}.focused{background:#eef6ff}button{padding:.45rem .7rem;margin:.15rem}.bank-transfer{padding:1rem;border:1px solid #dbe3ee;border-radius:.5rem;background:#fff;display:grid;gap:.75rem}.bank-transfer form{display:grid;gap:.5rem;max-width:32rem}.bank-transfer input{padding:.55rem;border:1px solid #9aaec4;border-radius:.35rem}.hint{margin:0;color:#52647b}.result{padding:1rem;border:1px solid #b9d7f7;border-radius:.5rem;background:#f7fbff}.payment-element{min-height:6rem;padding:.8rem;border:1px solid #dbe3ee;border-radius:.5rem;background:#fff}.success{color:#0c6b41}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReceivablesPageComponent {
  readonly receivableId = input<string>();
  private readonly api = inject(PaymentsApiClient);
  private readonly stripe = inject(StripeJsPaymentService);
  readonly paymentHost = viewChild<ElementRef<HTMLElement>>('paymentHost');
  readonly receivables = signal<readonly Receivable[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly creatingFor = signal<string | null>(null);
  readonly intent = signal<PaymentIntent | null>(null);
  readonly paymentLoading = signal(false);
  readonly paymentReady = signal(false);
  readonly paymentError = signal<string | null>(null);
  readonly paying = signal(false);
  readonly paymentSuccess = signal(false);
  readonly bankTransferFor = signal<string | null>(null);
  readonly bankTransferReference = signal('');
  readonly bankTransferSubmitting = signal(false);
  readonly bankTransferError = signal<string | null>(null);
  readonly bankTransferSuccess = signal<string | null>(null);
  private paymentSession: PaymentElementSession | null = null;
  readonly focused = computed(() => this.receivables().find((item) => item.id === this.receivableId()) ?? null);
  readonly bankTransferTarget = computed(() => this.receivables().find((item) => item.id === this.bankTransferFor()) ?? null);

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

  beginBankTransfer(item: Receivable): void {
    if (!this.payable(item)) return;
    this.bankTransferFor.set(item.id);
    this.bankTransferReference.set('');
    this.bankTransferError.set(null);
    this.bankTransferSuccess.set(null);
  }

  submitBankTransfer(event: SubmitEvent, item: Receivable): void {
    event.preventDefault();
    const reference = this.bankTransferReference().trim();
    if (!reference) {
      this.bankTransferError.set('La referencia bancaria es obligatoria.');
      return;
    }
    if (this.bankTransferSubmitting()) return;
    this.bankTransferSubmitting.set(true);
    this.bankTransferError.set(null);
    this.bankTransferSuccess.set(null);
    this.api.createBankTransferPayment(item.id, reference).subscribe({
      next: () => {
        this.bankTransferSubmitting.set(false);
        this.bankTransferSuccess.set('Transferencia registrada y pendiente de validación por el equipo financiero.');
        this.bankTransferReference.set('');
      },
      error: () => {
        this.bankTransferSubmitting.set(false);
        this.bankTransferError.set('No se pudo registrar la transferencia.');
      },
    });
  }

  createIntent(item: Receivable): void {
    if (!this.payable(item) || this.creatingFor()) return;
    this.resetPaymentSession();
    this.creatingFor.set(item.id);
    this.error.set(null);
    this.api.createPaymentIntent(item.id).subscribe({
      next: (value) => {
        this.intent.set(value);
        this.creatingFor.set(null);
        this.paymentSuccess.set(false);
        setTimeout(() => this.mountPaymentElement(value), 0);
      },
      error: () => { this.error.set('No se pudo crear el Payment Intent.'); this.creatingFor.set(null); },
    });
  }

  retryPaymentElement(): void {
    const value = this.intent();
    if (value) this.mountPaymentElement(value);
  }

  private resetPaymentSession(): void {
    this.paymentSession?.paymentElement.unmount();
    this.paymentSession = null;
    this.paymentReady.set(false);
    this.paymentLoading.set(false);
    this.paymentError.set(null);
  }

  private mountPaymentElement(value: PaymentIntent): void {
    const host = this.paymentHost()?.nativeElement;
    if (!host || !value.clientSecret) return;
    this.resetPaymentSession();
    this.paymentLoading.set(true);
    this.paymentError.set(null);
    this.stripe.mountPaymentElement(value.publishableKey, value.clientSecret, host).then((session) => {
      this.paymentSession = session;
      this.paymentReady.set(true);
      this.paymentLoading.set(false);
    }).catch((error: unknown) => {
      this.paymentReady.set(false);
      this.paymentLoading.set(false);
      this.paymentError.set(error instanceof Error ? error.message : 'No se pudo cargar el formulario seguro de Stripe.');
    });
  }

  confirmPayment(): void {
    if (!this.paymentSession || this.paying()) return;
    this.paying.set(true);
    this.paymentError.set(null);
    this.stripe.confirmPayment(this.paymentSession, `${window.location.origin}/portal/receivables/${this.intent()?.receivableId ?? ''}`).then((result) => {
      this.paying.set(false);
      if (result.error) {
        this.paymentError.set(result.error.message ?? 'Stripe rechazó el pago.');
        return;
      }
      this.paymentSuccess.set(result.paymentIntent?.status === 'succeeded' || result.paymentIntent?.status === 'processing');
      this.load();
    }).catch(() => {
      this.paying.set(false);
      this.paymentError.set('No se pudo confirmar el pago con Stripe.');
    });
  }
}
