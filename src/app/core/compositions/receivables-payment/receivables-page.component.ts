import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, signal, viewChild } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';
import { RECEIVABLES_PORT } from '../../../creditreceivables/application/receivables.port';
import { Receivable } from '../../../creditreceivables/domain/receivables.models';
import { ReceivablesPaymentFacade } from './receivables-payment.facade';
import { PAYMENT_ELEMENT_PORT, PaymentElementSession } from '../../../payments/application/ports/payment-element.port';
import { PaymentHistoryItem, PaymentIntent } from '../../../payments/domain/payment.models';
import { ButtonComponent } from '../../../shared/presentation/components/button/button.component';
import { EmptyStateComponent } from '../../../shared/presentation/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../shared/presentation/components/loading-state/loading-state.component';
import { MetricCardComponent } from '../../../shared/presentation/components/metric-card/metric-card.component';
import { NexaIconComponent } from '../../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { PageHeaderComponent } from '../../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../../shared/presentation/components/section-panel/section-panel.component';
import { StatusBadgeComponent, StatusTone } from '../../../shared/presentation/components/status-badge/status-badge.component';

@Component({
  selector: 'nexa-receivables-page',
  imports: [DatePipe, DecimalPipe, RouterLink, TranslatePipe, ButtonComponent, EmptyStateComponent, ErrorStateComponent, LoadingStateComponent, MetricCardComponent, NexaIconComponent, PageHeaderComponent, SectionPanelComponent, StatusBadgeComponent],
  templateUrl: './receivables-page.component.html',
  styleUrl: './receivables-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReceivablesPageComponent {
  readonly receivableId = input<string>();
  private readonly receivablesApi = inject(RECEIVABLES_PORT);
  private readonly paymentsApi = inject(ReceivablesPaymentFacade);
  private readonly paymentElement = inject(PAYMENT_ELEMENT_PORT);
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
  readonly reportedBankTransferIds = signal<ReadonlySet<string>>(new Set());
  readonly paymentHistoryFor = signal<string | null>(null);
  readonly paymentHistory = signal<readonly PaymentHistoryItem[]>([]);
  readonly paymentHistoryLoading = signal(false);
  readonly paymentHistoryError = signal<string | null>(null);
  private paymentSession: PaymentElementSession | null = null;

  readonly focused = computed(() => this.receivables().find((item) => item.id === this.receivableId()) ?? null);
  readonly bankTransferTarget = computed(() => this.receivables().find((item) => item.id === this.bankTransferFor()) ?? null);
  readonly openReceivables = computed(() => this.receivables().filter((item) => this.payable(item)));
  readonly overdueReceivables = computed(() => this.receivables().filter((item) => item.status === 'OVERDUE'));
  readonly totalOutstanding = computed(() => this.receivables().reduce((total, item) => total + item.remaining, 0));
  readonly totalPaid = computed(() => this.receivables().reduce((total, item) => total + item.amountPaid, 0));
  readonly nextDue = computed(() => [...this.openReceivables()]
    .sort((left, right) => (left.dueAt ?? '9999').localeCompare(right.dueAt ?? '9999'))[0] ?? null);

  constructor() { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.receivablesApi.list().subscribe({
      next: (page) => { this.receivables.set(page.items); this.loading.set(false); },
      error: () => { this.error.set('El servicio de pagos no respondió.'); this.loading.set(false); },
    });
  }

  payable(item: Receivable): boolean { return item.remaining > 0 && ['OPEN', 'PARTIALLY_PAID', 'OVERDUE'].includes(item.status); }

  bankTransferReported(item: Receivable): boolean { return this.reportedBankTransferIds().has(item.id); }

  receivableTone(status: string): StatusTone {
    if (status === 'OVERDUE') return 'danger';
    if (status === 'PARTIALLY_PAID') return 'warning';
    if (status === 'PAID' || status === 'SETTLED') return 'success';
    return 'info';
  }

  receivableState(status: string): string { return status.toLowerCase(); }

  paymentState(status: string): string {
    const normalized = status.toLowerCase();
    if (['paid', 'confirmed', 'succeeded'].includes(normalized)) return 'paid';
    if (['failed', 'rejected'].includes(normalized)) return 'failed';
    if (normalized === 'cancelled') return 'cancelled';
    if (normalized === 'processing') return 'processing';
    return 'pending';
  }

  paymentTone(status: string): StatusTone {
    const state = this.paymentState(status);
    if (state === 'paid') return 'success';
    if (state === 'failed' || state === 'cancelled') return 'danger';
    if (state === 'processing') return 'info';
    return 'warning';
  }

  togglePaymentHistory(item: Receivable): void {
    if (this.paymentHistoryFor() === item.id) {
      this.paymentHistoryFor.set(null);
      return;
    }
    this.paymentHistoryFor.set(item.id);
    this.paymentHistory.set([]);
    this.loadPaymentHistory(item.id);
  }

  retryPaymentHistory(): void {
    const receivableId = this.paymentHistoryFor();
    if (!receivableId || this.paymentHistoryLoading()) return;
    this.loadPaymentHistory(receivableId);
  }

  private loadPaymentHistory(receivableId: string): void {
    this.paymentHistoryError.set(null);
    this.paymentHistoryLoading.set(true);
    this.paymentsApi.listPaymentsForReceivable(receivableId).subscribe({
      next: (page) => { this.paymentHistory.set(page.items); this.paymentHistoryLoading.set(false); },
      error: () => {
        this.paymentHistoryLoading.set(false);
        this.paymentHistoryError.set('receivables.errorTitle');
      },
    });
  }

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
    this.paymentsApi.createBankTransferPayment(item.id, reference).subscribe({
      next: () => {
        this.bankTransferSubmitting.set(false);
        this.reportedBankTransferIds.update((current) => new Set(current).add(item.id));
        this.bankTransferSuccess.set('Transferencia registrada y pendiente de validación por el equipo financiero.');
        this.bankTransferReference.set('');
        this.bankTransferFor.set(null);
        this.load();
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
    this.paymentsApi.createPaymentIntent(item.id).subscribe({
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
    this.paymentElement.mountPaymentElement(value.publishableKey, value.clientSecret, host).then((session) => {
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
    this.paymentElement.confirmPayment(this.paymentSession, `${window.location.origin}/portal/receivables/${this.intent()?.receivableId ?? ''}`).then((result) => {
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
