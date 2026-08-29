import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { RECEIVABLES_PORT } from '../../../creditreceivables/application/receivables.port';
import { Receivable } from '../../../creditreceivables/domain/receivables.models';
import { PAYMENT_ELEMENT_PORT } from '../../../payments/application/ports/payment-element.port';
import { ReceivablesPaymentFacade } from './receivables-payment.facade';
import { ReceivablesPageComponent } from './receivables-page.component';

const receivable: Receivable = {
  id: 'receivable-1',
  clientAccountId: 'client-1',
  subjectType: 'INVOICE',
  subjectId: 'invoice-1',
  number: 'INV-0001',
  currency: 'PEN',
  amount: 100,
  amountPaid: 0,
  remaining: 100,
  status: 'OPEN',
  dueAt: '2030-01-10T00:00:00Z',
  version: 1,
};

const paymentPage = (items: readonly unknown[]) => ({ items, page: 0, size: 25, total: items.length });

describe('ReceivablesPageComponent', () => {
  let fixture: ComponentFixture<ReceivablesPageComponent>;
  let paymentApi: { listPaymentsForReceivable: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    paymentApi = {
      listPaymentsForReceivable: vi.fn(() => throwError(() => new Error('API unavailable'))),
    };

    await TestBed.configureTestingModule({
      imports: [ReceivablesPageComponent],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: RECEIVABLES_PORT, useValue: { list: () => of({ items: [receivable], page: 0, size: 25, total: 1 }) } },
        { provide: ReceivablesPaymentFacade, useValue: paymentApi },
        { provide: PAYMENT_ELEMENT_PORT, useValue: {
          mountPaymentElement: vi.fn(),
          confirmPayment: vi.fn(),
        } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReceivablesPageComponent);
    fixture.detectChanges();
  });

  it('renders an explicit history error and retries the same receivable', () => {
    fixture.componentInstance.togglePaymentHistory(receivable);
    fixture.detectChanges();

    expect(paymentApi.listPaymentsForReceivable).toHaveBeenCalledWith('receivable-1');
    expect(fixture.componentInstance.paymentHistoryError()).toBe('receivables.errorTitle');
    expect(fixture.nativeElement.querySelector('.history-error')).toBeTruthy();

    const retry = fixture.nativeElement.querySelector('.history-error button') as HTMLButtonElement;
    retry.click();

    expect(paymentApi.listPaymentsForReceivable).toHaveBeenCalledTimes(2);
  });

  it('clears the history error only after a successful retry', () => {
    paymentApi.listPaymentsForReceivable
      .mockImplementationOnce(() => throwError(() => new Error('API unavailable')))
      .mockImplementationOnce(() => of(paymentPage([{
        id: 'payment-1',
        receivableId: receivable.id,
        method: 'BANK_TRANSFER',
        status: 'PENDING',
        amount: 100,
        currency: 'PEN',
        createdAt: '2030-01-02T00:00:00Z',
        completedAt: null,
        reference: 'TRX-1',
        reviewReason: null,
        receivableNumber: receivable.number,
      }])));

    fixture.componentInstance.togglePaymentHistory(receivable);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.history-error button') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.componentInstance.paymentHistoryError()).toBeNull();
    expect(fixture.nativeElement.querySelector('.history-row')).toBeTruthy();
  });
});
