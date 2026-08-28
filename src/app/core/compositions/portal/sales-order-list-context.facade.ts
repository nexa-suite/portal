import { Injectable, inject, signal } from '@angular/core';

import { BusinessDocument } from '../../../businessdocuments/domain/business-document.models';
import { BusinessDocumentsApiPort } from '../../../businessdocuments/application/ports/business-documents-api.port';
import { Delivery } from '../../../fulfillmentdelivery/domain/delivery.models';
import { DeliveryTrackingApiPort } from '../../../fulfillmentdelivery/application/ports/delivery-tracking-api.port';

export type SalesOrderListDelivery = Pick<Delivery, 'id' | 'dispatchNumber' | 'salesOrderId' | 'salesOrderNumber' | 'status' | 'destination' | 'routeName' | 'temperatureMin' | 'temperatureMax' | 'temperatureUnit' | 'temperatureStatus' | 'podStatus' | 'alerts' | 'updatedAt'>;
export type SalesOrderListDocument = Pick<BusinessDocument, 'id' | 'subjectId' | 'documentNumber' | 'documentType' | 'status' | 'generatedAt'>;

/** Composition-only read model joining delivery and document projections for order list. */
@Injectable()
export class SalesOrderListContextFacade {
  private readonly deliveryApi = inject(DeliveryTrackingApiPort);
  private readonly documentsApi = inject(BusinessDocumentsApiPort);

  readonly deliveries = signal<readonly SalesOrderListDelivery[]>([]);
  readonly documents = signal<readonly SalesOrderListDocument[]>([]);
  readonly deliveryError = signal(false);
  readonly documentsError = signal(false);

  constructor() {
    this.deliveryApi.list().subscribe({
      next: (page) => { this.deliveryError.set(false); this.deliveries.set(page.items.map(({ id, dispatchNumber, salesOrderId, salesOrderNumber, status, destination, routeName, temperatureMin, temperatureMax, temperatureUnit, temperatureStatus, podStatus, alerts, updatedAt }) => ({ id, dispatchNumber, salesOrderId, salesOrderNumber, status, destination, routeName, temperatureMin, temperatureMax, temperatureUnit, temperatureStatus, podStatus, alerts, updatedAt }))); },
      error: () => { this.deliveryError.set(true); this.deliveries.set([]); },
    });
    this.documentsApi.list(0, 100).subscribe({
      next: (page) => { this.documentsError.set(false); this.documents.set(page.items.map(({ id, subjectId, documentNumber, documentType, status, generatedAt }) => ({ id, subjectId, documentNumber, documentType, status, generatedAt }))); },
      error: () => { this.documentsError.set(true); this.documents.set([]); },
    });
  }
}
