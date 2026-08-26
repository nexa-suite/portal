import { Routes } from '@angular/router';
import { DeliveryTrackingFacade } from '../../../fulfillmentdelivery/application/delivery-tracking.facade';
import { DeliveryTrackingApiPort } from '../../../fulfillmentdelivery/application/ports/delivery-tracking-api.port';
import { DeliveryTrackingApiClient } from '../../../fulfillmentdelivery/infrastructure/delivery-tracking-api.client';
import { DeliveryDetailPageComponent } from '../../../fulfillmentdelivery/presentation/delivery-detail-page.component';
import { MyDeliveriesPageComponent } from '../../../fulfillmentdelivery/presentation/my-deliveries-page.component';

const deliveryProviders = [
  DeliveryTrackingFacade,
  { provide: DeliveryTrackingApiPort, useClass: DeliveryTrackingApiClient },
];

export const DELIVERY_ROUTES: Routes = [
  { path: '', component: MyDeliveriesPageComponent, providers: deliveryProviders },
  { path: ':dispatchOrderId', component: DeliveryDetailPageComponent, providers: deliveryProviders },
];
