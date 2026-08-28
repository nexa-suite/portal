import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { afterEach, describe, expect, it } from 'vitest';

import { PORTAL_RUNTIME_CONFIG } from '../../security/runtime-config';
import { MockBusinessDocumentsApiAdapter } from '../../../businessdocuments/infrastructure/mock/mock-business-documents-api.adapter';
import { MockReceivablesApiAdapter } from '../../../creditreceivables/infrastructure/mock/mock-receivables-api.adapter';
import { MockDeliveryTrackingApiAdapter } from '../../../fulfillmentdelivery/infrastructure/mock/mock-delivery-tracking-api.adapter';
import { MockNotificationsApiAdapter } from '../../../notifications/infrastructure/mock/mock-notifications-api.adapter';
import { MockPaymentElementAdapter } from '../../../payments/infrastructure/mock/mock-payment-element.adapter';
import { MockPaymentsApiAdapter } from '../../../payments/infrastructure/mock/mock-payments-api.adapter';
import { MockSalesOrderApiAdapter } from '../../../salescommitment/infrastructure/mock/mock-sales-order-api.adapter';

describe('Portal buyer-safe mock adapters', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('keeps delivery tracking and sales-order lifecycle behind separate application ports', async () => {
    configure('icisa', MockDeliveryTrackingApiAdapter, MockSalesOrderApiAdapter);
    const deliveries = TestBed.inject(MockDeliveryTrackingApiAdapter);
    const orders = TestBed.inject(MockSalesOrderApiAdapter);
    const deliveryPage = await firstValueFrom(deliveries.list());
    const deliveryEvents = await firstValueFrom(deliveries.events('icisa-delivery-001'));
    const order = (await firstValueFrom(orders.get('icisa-order-001')));
    const confirmed = await firstValueFrom(orders.confirm(order));

    expect(deliveryPage.items).toHaveLength(2);
    expect(deliveryEvents).toHaveLength(2);
    expect(confirmed).toMatchObject({ status: 'CONFIRMED', version: 2, etag: '"2"' });
    await expect(firstValueFrom(orders.confirm(order))).rejects.toMatchObject({ status: 409 });
  });

  it('serves receivables, payments, documents and notifications without external calls', async () => {
    configure('generic', MockReceivablesApiAdapter, MockPaymentsApiAdapter, MockBusinessDocumentsApiAdapter, MockNotificationsApiAdapter);
    const receivables = TestBed.inject(MockReceivablesApiAdapter);
    const payments = TestBed.inject(MockPaymentsApiAdapter);
    const documents = TestBed.inject(MockBusinessDocumentsApiAdapter);
    const notifications = TestBed.inject(MockNotificationsApiAdapter);
    const receivable = (await firstValueFrom(receivables.list())).items[0]!;
    const payment = await firstValueFrom(payments.createBankTransferPayment(receivable.id, 'GEN-TRANSFER-DEMO'));
    const history = await firstValueFrom(payments.listPaymentsForReceivable(receivable.id));
    const documentPage = await firstValueFrom(documents.list());
    const document = documentPage.items[0]!;
    const documentBlob = await firstValueFrom(documents.download(document.id));
    const before = await firstValueFrom(notifications.list());
    await firstValueFrom(notifications.markRead(before.items[0]!.id));
    const after = await firstValueFrom(notifications.list());

    expect(receivable).toMatchObject({ status: 'OPEN', currency: 'PEN' });
    expect(payment).toMatchObject({ receivableId: receivable.id, status: 'PROCESSING', reference: 'GEN-TRANSFER-DEMO' });
    expect(history.items).toHaveLength(1);
    expect(documentBlob).toBeInstanceOf(Blob);
    expect(after.items[0]?.readAt).not.toBeNull();
  });

  it('replaces the external Payment Element with a browser-safe local double', async () => {
    configure('icisa', MockPaymentElementAdapter);
    const element = TestBed.inject(MockPaymentElementAdapter);
    const host = document.createElement('div');
    const session = await element.mountPaymentElement('pk_test_local_nexa_demo', 'mock-secret', host);
    const result = await element.confirmPayment(session, '/portal/receivables/icisa-receivable-001');

    expect(host.querySelector('[data-nexa-payment-element="mock"]')).toBeTruthy();
    expect(result.paymentIntent?.status).toBe('succeeded');
    session.paymentElement.unmount();
    expect(host.childElementCount).toBe(0);
  });

  function configure(tenantProfile: 'generic' | 'icisa', ...services: (new (...args: never[]) => unknown)[]): void {
    TestBed.configureTestingModule({
      providers: [
        ...services,
        { provide: PORTAL_RUNTIME_CONFIG, useValue: { apiBaseUrl: '', surface: 'PORTAL', dataMode: 'mock', tenantProfile } },
      ],
    });
  }
});
