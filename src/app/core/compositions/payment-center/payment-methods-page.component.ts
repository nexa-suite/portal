import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { catchError, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { RECEIVABLES_PORT } from '../../../creditreceivables/application/receivables.port';
import { Receivable } from '../../../creditreceivables/domain/receivables.models';
import { ReceivablesPaymentFacade } from '../receivables-payment/receivables-payment.facade';
import { ErrorStateComponent } from '../../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../shared/presentation/components/loading-state/loading-state.component';
import { NexaIconComponent } from '../../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { StatusBadgeComponent, StatusTone } from '../../../shared/presentation/components/status-badge/status-badge.component';
import { PaymentHistoryItem } from '../../../payments/domain/payment.models';

type PaymentFilter = 'ALL' | 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'CANCELLED';
type PaymentState = Lowercase<Exclude<PaymentFilter, 'ALL'>>;

interface PaymentChartRow {
  readonly key: string;
  readonly labelKey: string;
  readonly amount: number;
  readonly currency: string;
  readonly percent: number;
  readonly tone: 'paid' | 'pending';
}

interface RecentPaymentChartRow {
  readonly id: string;
  readonly label: string;
  readonly amount: number;
  readonly currency: string;
  readonly percent: number;
}

@Component({
  selector: 'nexa-payment-methods-page',
  imports: [DatePipe, DecimalPipe, RouterLink, TranslatePipe, ErrorStateComponent, LoadingStateComponent, NexaIconComponent, StatusBadgeComponent],
  templateUrl: './payment-methods-page.component.html',
  styleUrl: './payment-methods-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentMethodsPageComponent {
  private readonly receivablesApi = inject(RECEIVABLES_PORT);
  private readonly paymentsApi = inject(ReceivablesPaymentFacade);

  readonly receivables = signal<readonly Receivable[]>([]);
  readonly payments = signal<readonly PaymentHistoryItem[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly paymentFilter = signal<PaymentFilter>('ALL');
  readonly paymentFilters: readonly PaymentFilter[] = ['ALL', 'PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED'];

  readonly totalOutstanding = computed(() => this.receivables().reduce((total, item) => total + item.remaining, 0));
  readonly totalAmount = computed(() => this.receivables().reduce((total, item) => total + item.amount, 0));
  readonly totalPaid = computed(() => this.receivables().reduce((total, item) => total + item.amountPaid, 0));
  readonly totalPending = computed(() => this.payments()
    .filter((payment) => ['pending', 'processing'].includes(this.paymentState(payment.status)))
    .reduce((total, payment) => total + payment.amount, 0));
  readonly paidPercentage = computed(() => this.totalAmount() > 0
    ? Math.min(100, Math.round((this.totalPaid() / this.totalAmount()) * 100))
    : 0);
  readonly nextDue = computed(() => [...this.receivables()]
    .filter((item) => item.remaining > 0)
    .sort((left, right) => (left.dueAt ?? '9999').localeCompare(right.dueAt ?? '9999'))[0] ?? null);
  readonly visiblePayments = computed(() => {
    const filter = this.paymentFilter();
    return filter === 'ALL'
      ? this.payments()
      : this.payments().filter((payment) => this.paymentState(payment.status).toUpperCase() === filter);
  });
  readonly paymentChart = computed<readonly PaymentChartRow[]>(() => {
    const rows = [
      { key: 'paid', labelKey: 'payments.status.paid', amount: this.totalPaid(), currency: this.receivables()[0]?.currency ?? 'PEN', tone: 'paid' as const },
      { key: 'pending', labelKey: 'payments.status.pending', amount: this.totalPending(), currency: this.payments()[0]?.currency ?? this.receivables()[0]?.currency ?? 'PEN', tone: 'pending' as const },
    ];
    const max = Math.max(...rows.map((row) => row.amount), 1);
    return rows.map((row) => ({ ...row, percent: row.amount > 0 ? Math.max(8, Math.round((row.amount / max) * 100)) : 0 }));
  });
  readonly recentPaymentChart = computed<readonly RecentPaymentChartRow[]>(() => {
    const rows = this.payments().slice(0, 6).map((payment) => ({
      id: payment.id,
      label: payment.reference || payment.id,
      amount: payment.amount,
      currency: payment.currency,
    }));
    const max = Math.max(...rows.map((row) => row.amount), 1);
    return rows.map((row) => ({ ...row, percent: row.amount > 0 ? Math.max(8, Math.round((row.amount / max) * 100)) : 0 }));
  });

  constructor() { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.receivablesApi.list().pipe(
      switchMap((page) => {
        this.receivables.set(page.items);
        return this.loadPaymentHistory(page.items);
      }),
    ).subscribe({
      next: (payments) => { this.payments.set(payments); this.loading.set(false); },
      error: () => { this.error.set('El servicio de pagos no respondió.'); this.loading.set(false); },
    });
  }

  setPaymentFilter(filter: PaymentFilter): void { this.paymentFilter.set(filter); }

  paymentState(status: string): PaymentState {
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

  formatMoney(amount: number, currency = 'PEN'): string {
    return `${currency} ${amount.toFixed(2)}`;
  }

  private loadPaymentHistory(items: readonly Receivable[]): Observable<readonly PaymentHistoryItem[]> {
    if (!items.length) return of([]);
    return forkJoin(items.map((item) => this.paymentsApi.listPaymentsForReceivable(item.id).pipe(
      map((page) => page.items),
      catchError(() => of([] as readonly PaymentHistoryItem[])),
    ))).pipe(map((pages) => pages.flatMap((page) => [...page])));
  }
}
