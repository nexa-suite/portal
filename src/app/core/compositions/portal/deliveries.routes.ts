import { Routes } from '@angular/router';
import { DeliveryTrackingFacade } from '../../../fulfillmentdelivery/application/delivery-tracking.facade';
import { provideDeliveryTrackingApiAdapter } from './data-mode.providers';
import { DeliveryDetailPageComponent } from '../../../fulfillmentdelivery/presentation/delivery-detail-page.component';
import { MyDeliveriesPageComponent } from '../../../fulfillmentdelivery/presentation/my-deliveries-page.component';

const deliveryProviders = [
  DeliveryTrackingFacade,
  provideDeliveryTrackingApiAdapter(),
];

export const DELIVERY_ROUTES: Routes = [
  { path: '', component: MyDeliveriesPageComponent, providers: deliveryProviders },
  { path: ':dispatchOrderId', component: DeliveryDetailPageComponent, providers: deliveryProviders },
];
