import { Routes } from '@angular/router';
import { SalesOrderDeliveryPort } from '../../../salescommitment/application/ports/sales-order-delivery.port';
import { SalesOrderSelfServiceFacade } from '../../../salescommitment/application/orders/sales-order-self-service.facade';
import { PORTAL_BUSINESS_DOCUMENTS_PROVIDERS, PORTAL_DELIVERY_PROVIDERS, PORTAL_SALES_ORDER_PROVIDERS } from './production.providers';
import { SalesOrderDeliveryGateway } from '../../../salescommitment/infrastructure/orders/sales-order-delivery.gateway';
import { SalesOrderDetailPageComponent } from '../../../salescommitment/presentation/orders/sales-order-detail-page/sales-order-detail-page.component';
import { MySalesOrdersPageComponent } from '../../../salescommitment/presentation/orders/my-sales-orders-page/my-sales-orders-page.component';
import { SalesOrderListContextFacade } from './sales-order-list-context.facade';

const salesOrderProviders = [
  SalesOrderSelfServiceFacade,
  ...PORTAL_SALES_ORDER_PROVIDERS,
  ...PORTAL_DELIVERY_PROVIDERS,
  ...PORTAL_BUSINESS_DOCUMENTS_PROVIDERS,
];

const salesOrderListProviders = [
  ...salesOrderProviders,
  SalesOrderListContextFacade,
];

const salesOrderDetailProviders = [
  ...salesOrderProviders,
  { provide: SalesOrderDeliveryPort, useClass: SalesOrderDeliveryGateway },
];

export const SALES_ORDER_ROUTES: Routes = [
  { path: '', component: MySalesOrdersPageComponent, providers: salesOrderListProviders },
  { path: ':salesOrderId', component: SalesOrderDetailPageComponent, providers: salesOrderDetailProviders },
];
