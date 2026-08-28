import { Routes } from '@angular/router';
import { PurchaseRequestSelfServiceFacade } from '../../../salescommitment/application/purchase-requests/purchase-request-self-service.facade';
import { MyRequestsPageComponent } from '../../../salescommitment/presentation/purchase-requests/my-requests-page/my-requests-page.component';
import { RequestDetailPageComponent } from '../../../salescommitment/presentation/purchase-requests/request-detail-page/request-detail-page.component';
import { PurchaseRequestDetailContextFacade } from './purchase-request-detail-context.facade';
import { provideBuyerAccountApiAdapter, provideCatalogApiAdapter, providePurchaseRequestApiAdapter } from './data-mode.providers';

const purchaseRequestProviders = [
  PurchaseRequestSelfServiceFacade,
  providePurchaseRequestApiAdapter(),
  provideBuyerAccountApiAdapter(),
  provideCatalogApiAdapter(),
];

const purchaseRequestDetailProviders = [
  ...purchaseRequestProviders,
  PurchaseRequestDetailContextFacade,
];

export const PURCHASE_REQUEST_ROUTES: Routes = [
  { path: '', component: MyRequestsPageComponent, providers: purchaseRequestProviders },
  { path: ':purchaseRequestId', component: RequestDetailPageComponent, providers: purchaseRequestDetailProviders },
];
