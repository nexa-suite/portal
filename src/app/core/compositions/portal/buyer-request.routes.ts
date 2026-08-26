import { Routes } from '@angular/router';
import { CatalogApiPort } from '../../../catalogcommercialpolicy/application/ports/catalog-api.port';
import { CatalogApiClient } from '../../../catalogcommercialpolicy/infrastructure/catalog-api.client';
import { BuyerAccountApiPort } from '../../../customerbuyerrelationships/application/ports/buyer-account-api.port';
import { BuyerAccountApiClient } from '../../../customerbuyerrelationships/infrastructure/buyer-account-api.client';
import { PurchaseRequestBuilderFacade } from '../../../salescommitment/application/buyer-requests/buyer-request-builder.facade';
import { BuyerRelationshipPort } from '../../../salescommitment/application/ports/buyer-relationship.port';
import { PurchaseRequestCatalogPort } from '../../../salescommitment/application/ports/purchase-request-catalog.port';
import { PurchaseRequestDraftApiPort } from '../../../salescommitment/application/ports/purchase-request-draft-api.port';
import { BuyerRelationshipGateway } from '../../../salescommitment/infrastructure/buyer-requests/buyer-relationship.gateway';
import { PurchaseRequestCatalogGateway } from '../../../salescommitment/infrastructure/buyer-requests/purchase-request-catalog.gateway';
import { PurchaseRequestDraftApiClient } from '../../../salescommitment/infrastructure/buyer-requests/canonical-purchase-request-draft-api.client';
import { BuyerRequestBuilderPageComponent } from '../../../salescommitment/presentation/buyer-requests/buyer-request-builder-page.component';

const builderProviders = [
  PurchaseRequestBuilderFacade,
  { provide: PurchaseRequestCatalogPort, useClass: PurchaseRequestCatalogGateway },
  { provide: BuyerRelationshipPort, useClass: BuyerRelationshipGateway },
  { provide: PurchaseRequestDraftApiPort, useClass: PurchaseRequestDraftApiClient },
  { provide: CatalogApiPort, useClass: CatalogApiClient },
  { provide: BuyerAccountApiPort, useClass: BuyerAccountApiClient },
];

export const BUYER_REQUEST_ROUTES: Routes = [
  { path: '', component: BuyerRequestBuilderPageComponent, providers: builderProviders },
  { path: ':purchaseRequestId', component: BuyerRequestBuilderPageComponent, providers: builderProviders },
];
