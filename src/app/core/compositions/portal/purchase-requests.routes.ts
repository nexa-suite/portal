import { Routes } from '@angular/router';
import { PurchaseRequestApiPort } from '../../../salescommitment/application/ports/purchase-request-api.port';
import { PurchaseRequestSelfServiceFacade } from '../../../salescommitment/application/purchase-requests/purchase-request-self-service.facade';
import { PurchaseRequestApiClient } from '../../../salescommitment/infrastructure/purchase-requests/purchase-request-api.client';
import { MyRequestsPageComponent } from '../../../salescommitment/presentation/purchase-requests/my-requests-page/my-requests-page.component';
import { RequestDetailPageComponent } from '../../../salescommitment/presentation/purchase-requests/request-detail-page/request-detail-page.component';

const purchaseRequestProviders = [
  PurchaseRequestSelfServiceFacade,
  { provide: PurchaseRequestApiPort, useClass: PurchaseRequestApiClient },
];

export const PURCHASE_REQUEST_ROUTES: Routes = [
  { path: '', component: MyRequestsPageComponent, providers: purchaseRequestProviders },
  { path: ':purchaseRequestId', component: RequestDetailPageComponent, providers: purchaseRequestProviders },
];
