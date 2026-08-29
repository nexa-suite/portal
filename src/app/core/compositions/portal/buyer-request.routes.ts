import { Routes } from '@angular/router';
import { BuyerAccountApiPort } from '../../../customerbuyerrelationships/application/ports/buyer-account-api.port';
import { BuyerAccountApiClient } from '../../../customerbuyerrelationships/infrastructure/buyer-account-api.client';
import { PurchaseRequestBuilderFacade } from '../../../salescommitment/application/buyer-requests/buyer-request-builder.facade';
import { BuyerRelationshipPort } from '../../../salescommitment/application/ports/buyer-relationship.port';
import { PurchaseRequestDraftApiPort } from '../../../salescommitment/application/ports/purchase-request-draft-api.port';
import { BuyerRelationshipGateway } from '../../../salescommitment/infrastructure/buyer-requests/buyer-relationship.gateway';
import { PurchaseRequestDraftApiClient } from '../../../salescommitment/infrastructure/buyer-requests/canonical-purchase-request-draft-api.client';
import { BuyerRequestBuilderPageComponent } from '../../../salescommitment/presentation/buyer-requests/buyer-request-builder-page.component';
import { provideApiOnlyPortalAdapter } from './data-mode.providers';

const builderProviders = [
  PurchaseRequestBuilderFacade,
  { provide: BuyerRelationshipPort, useClass: BuyerRelationshipGateway },
  PurchaseRequestDraftApiClient,
  provideApiOnlyPortalAdapter(PurchaseRequestDraftApiPort, PurchaseRequestDraftApiClient),
  BuyerAccountApiClient,
  provideApiOnlyPortalAdapter(BuyerAccountApiPort, BuyerAccountApiClient),
];

export const BUYER_REQUEST_ROUTES: Routes = [
  { path: '', component: BuyerRequestBuilderPageComponent, providers: builderProviders },
  { path: ':purchaseRequestId', component: BuyerRequestBuilderPageComponent, providers: builderProviders },
];
