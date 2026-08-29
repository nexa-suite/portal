import { Routes } from '@angular/router';
import { PORTAL_BUSINESS_DOCUMENTS_PROVIDERS } from './production.providers';
import { BusinessDocumentsPageComponent } from '../../../businessdocuments/presentation/business-documents-page.component';

export const BUSINESS_DOCUMENT_ROUTES: Routes = [
  {
    path: '',
    component: BusinessDocumentsPageComponent,
    providers: PORTAL_BUSINESS_DOCUMENTS_PROVIDERS,
  },
];
