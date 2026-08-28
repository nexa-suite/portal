import { Routes } from '@angular/router';
import { BuyerAccountFacade } from '../../../customerbuyerrelationships/application/buyer-account.facade';
import { provideBuyerAccountApiAdapter } from './data-mode.providers';
import { BuyerAccountPageComponent } from '../../../customerbuyerrelationships/presentation/buyer-account-page.component';

export const BUYER_ACCOUNT_ROUTES: Routes = [
  {
    path: '',
    component: BuyerAccountPageComponent,
    providers: [BuyerAccountFacade, provideBuyerAccountApiAdapter()],
  },
];
