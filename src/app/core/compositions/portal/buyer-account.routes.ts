import { Routes } from '@angular/router';
import { BuyerAccountFacade } from '../../../customerbuyerrelationships/application/buyer-account.facade';
import { BuyerAccountApiPort } from '../../../customerbuyerrelationships/application/ports/buyer-account-api.port';
import { BuyerAccountApiClient } from '../../../customerbuyerrelationships/infrastructure/buyer-account-api.client';
import { provideApiOnlyPortalAdapter } from './data-mode.providers';
import { BuyerAccountPageComponent } from '../../../customerbuyerrelationships/presentation/buyer-account-page.component';

export const BUYER_ACCOUNT_ROUTES: Routes = [
  {
    path: '',
    component: BuyerAccountPageComponent,
    providers: [BuyerAccountFacade, BuyerAccountApiClient, provideApiOnlyPortalAdapter(BuyerAccountApiPort, BuyerAccountApiClient)],
  },
];
