import { Injectable, inject, signal } from '@angular/core';

import { BusinessDocument } from '../../../businessdocuments/domain/business-document.models';
import { BusinessDocumentsApiPort } from '../../../businessdocuments/application/ports/business-documents-api.port';
import { Delivery } from '../../../fulfillmentdelivery/domain/delivery.models';
import { DeliveryTrackingApiPort } from '../../../fulfillmentdelivery/application/ports/delivery-tracking-api.port';

export type SalesOrderListDelivery = Pick<Delivery, 'id' | 'dispatchNumber' | 'salesOrderId' | 'salesOrderNumber' | 'status' | 'destination' | 'updatedAt'>;
export type SalesOrderListDocument = Pick<BusinessDocument, 'id' | 'subjectId' | 'documentNumber' | 'documentType' | 'status' | 'generatedAt'>;

/** Composition-only read model joining delivery and document projections for order list. */
@Injectable()
export class SalesOrderListContextFacade {
  private readonly deliveryApi = inject(DeliveryTrackingApiPort);
  private readonly documentsApi = inject(BusinessDocumentsApiPort);

  readonly deliveries = signal<readonly SalesOrderListDelivery[]>([]);
  readonly documents = signal<readonly SalesOrderListDocument[]>([]);

  constructor() {
    this.deliveryApi.list().subscribe({
      next: (page) => this.deliveries.set(page.items.map(({ id, dispatchNumber, salesOrderId, salesOrderNumber, status, destination, updatedAt }) => ({ id, dispatchNumber, salesOrderId, salesOrderNumber, status, destination, updatedAt }))),
      error: () => this.deliveries.set([]),
    });
    this.documentsApi.list(0, 100).subscribe({
      next: (page) => this.documents.set(page.items.map(({ id, subjectId, documentNumber, documentType, status, generatedAt }) => ({ id, subjectId, documentNumber, documentType, status, generatedAt }))),
      error: () => this.documents.set([]),
    });
  }
}
