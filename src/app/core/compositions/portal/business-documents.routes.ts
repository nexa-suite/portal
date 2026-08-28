import { Routes } from '@angular/router';
import { BusinessDocumentsApiPort } from '../../../businessdocuments/application/ports/business-documents-api.port';
import { provideBusinessDocumentsApiAdapter } from './data-mode.providers';
import { BusinessDocumentsPageComponent } from '../../../businessdocuments/presentation/business-documents-page.component';

export const BUSINESS_DOCUMENT_ROUTES: Routes = [
  {
    path: '',
    component: BusinessDocumentsPageComponent,
    providers: [provideBusinessDocumentsApiAdapter()],
  },
];
