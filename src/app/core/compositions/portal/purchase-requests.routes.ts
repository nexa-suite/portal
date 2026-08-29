import { Routes } from '@angular/router';
import { CatalogApiPort } from '../../../catalogcommercialpolicy/application/ports/catalog-api.port';
import { CatalogApiClient } from '../../../catalogcommercialpolicy/infrastructure/catalog-api.client';
import { BuyerAccountApiPort } from '../../../customerbuyerrelationships/application/ports/buyer-account-api.port';
import { BuyerAccountApiClient } from '../../../customerbuyerrelationships/infrastructure/buyer-account-api.client';
import { PurchaseRequestSelfServiceFacade } from '../../../salescommitment/application/purchase-requests/purchase-request-self-service.facade';
import { PurchaseRequestApiPort } from '../../../salescommitment/application/ports/purchase-request-api.port';
import { PurchaseRequestApiClient } from '../../../salescommitment/infrastructure/purchase-requests/purchase-request-api.client';
import { MyRequestsPageComponent } from '../../../salescommitment/presentation/purchase-requests/my-requests-page/my-requests-page.component';
import { RequestDetailPageComponent } from '../../../salescommitment/presentation/purchase-requests/request-detail-page/request-detail-page.component';
import { PurchaseRequestDetailContextFacade } from './purchase-request-detail-context.facade';
import { provideApiOnlyPortalAdapter } from './data-mode.providers';

const purchaseRequestProviders = [
  PurchaseRequestSelfServiceFacade,
  PurchaseRequestApiClient,
  provideApiOnlyPortalAdapter(PurchaseRequestApiPort, PurchaseRequestApiClient),
  BuyerAccountApiClient,
  provideApiOnlyPortalAdapter(BuyerAccountApiPort, BuyerAccountApiClient),
  CatalogApiClient,
  provideApiOnlyPortalAdapter(CatalogApiPort, CatalogApiClient),
];

const purchaseRequestDetailProviders = [
  ...purchaseRequestProviders,
  PurchaseRequestDetailContextFacade,
];

export const PURCHASE_REQUEST_ROUTES: Routes = [
  { path: '', component: MyRequestsPageComponent, providers: purchaseRequestProviders },
  { path: ':purchaseRequestId', component: RequestDetailPageComponent, providers: purchaseRequestDetailProviders },
];
