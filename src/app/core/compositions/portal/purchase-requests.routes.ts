import { Routes } from '@angular/router';
import { PurchaseRequestSelfServiceFacade } from '../../../salescommitment/application/purchase-requests/purchase-request-self-service.facade';
import { MyRequestsPageComponent } from '../../../salescommitment/presentation/purchase-requests/my-requests-page/my-requests-page.component';
import { RequestDetailPageComponent } from '../../../salescommitment/presentation/purchase-requests/request-detail-page/request-detail-page.component';
import { PurchaseRequestDetailContextFacade } from './purchase-request-detail-context.facade';
import { PORTAL_BUYER_ACCOUNT_PROVIDERS, PORTAL_CATALOG_PROVIDERS, PORTAL_PURCHASE_REQUEST_PROVIDERS } from './production.providers';

const purchaseRequestProviders = [
  PurchaseRequestSelfServiceFacade,
  ...PORTAL_PURCHASE_REQUEST_PROVIDERS,
  ...PORTAL_BUYER_ACCOUNT_PROVIDERS,
  ...PORTAL_CATALOG_PROVIDERS,
];

const purchaseRequestDetailProviders = [
  ...purchaseRequestProviders,
  PurchaseRequestDetailContextFacade,
];

export const PURCHASE_REQUEST_ROUTES: Routes = [
  { path: '', component: MyRequestsPageComponent, providers: purchaseRequestProviders },
  { path: ':purchaseRequestId', component: RequestDetailPageComponent, providers: purchaseRequestDetailProviders },
];
