import { Routes } from '@angular/router';
import { PurchaseRequestBuilderFacade } from '../../../salescommitment/application/buyer-requests/buyer-request-builder.facade';
import { BuyerRelationshipPort } from '../../../salescommitment/application/ports/buyer-relationship.port';
import { BuyerRelationshipGateway } from '../../../salescommitment/infrastructure/buyer-requests/buyer-relationship.gateway';
import { BuyerRequestBuilderPageComponent } from '../../../salescommitment/presentation/buyer-requests/buyer-request-builder-page.component';
import { PORTAL_BUYER_ACCOUNT_PROVIDERS, PORTAL_PURCHASE_REQUEST_DRAFT_PROVIDERS } from './production.providers';

const builderProviders = [
  PurchaseRequestBuilderFacade,
  { provide: BuyerRelationshipPort, useClass: BuyerRelationshipGateway },
  ...PORTAL_PURCHASE_REQUEST_DRAFT_PROVIDERS,
  ...PORTAL_BUYER_ACCOUNT_PROVIDERS,
];

export const BUYER_REQUEST_ROUTES: Routes = [
  { path: '', component: BuyerRequestBuilderPageComponent, providers: builderProviders },
  { path: ':purchaseRequestId', component: BuyerRequestBuilderPageComponent, providers: builderProviders },
];
