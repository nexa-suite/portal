import { Routes } from '@angular/router';
import { DeliveryTrackingApiPort } from '../../../fulfillmentdelivery/application/ports/delivery-tracking-api.port';
import { DeliveryTrackingApiClient } from '../../../fulfillmentdelivery/infrastructure/delivery-tracking-api.client';
import { SalesOrderApiPort } from '../../../salescommitment/application/ports/sales-order-api.port';
import { SalesOrderDeliveryPort } from '../../../salescommitment/application/ports/sales-order-delivery.port';
import { SalesOrderSelfServiceFacade } from '../../../salescommitment/application/orders/sales-order-self-service.facade';
import { SalesOrderApiClient } from '../../../salescommitment/infrastructure/orders/sales-order-api.client';
import { SalesOrderDeliveryGateway } from '../../../salescommitment/infrastructure/orders/sales-order-delivery.gateway';
import { SalesOrderDetailPageComponent } from '../../../salescommitment/presentation/orders/sales-order-detail-page/sales-order-detail-page.component';
import { MySalesOrdersPageComponent } from '../../../salescommitment/presentation/orders/my-sales-orders-page/my-sales-orders-page.component';

const salesOrderProviders = [
  SalesOrderSelfServiceFacade,
  { provide: SalesOrderApiPort, useClass: SalesOrderApiClient },
];

const salesOrderDetailProviders = [
  ...salesOrderProviders,
  { provide: SalesOrderDeliveryPort, useClass: SalesOrderDeliveryGateway },
  { provide: DeliveryTrackingApiPort, useClass: DeliveryTrackingApiClient },
];

export const SALES_ORDER_ROUTES: Routes = [
  { path: '', component: MySalesOrdersPageComponent, providers: salesOrderProviders },
  { path: ':salesOrderId', component: SalesOrderDetailPageComponent, providers: salesOrderDetailProviders },
];
