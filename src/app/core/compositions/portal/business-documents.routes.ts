import { Routes } from '@angular/router';
import { BusinessDocumentsApiPort } from '../../../businessdocuments/application/ports/business-documents-api.port';
import { BusinessDocumentsApiClient } from '../../../businessdocuments/infrastructure/business-documents-api.client';
import { BusinessDocumentsPageComponent } from '../../../businessdocuments/presentation/business-documents-page.component';

export const BUSINESS_DOCUMENT_ROUTES: Routes = [
  {
    path: '',
    component: BusinessDocumentsPageComponent,
    providers: [{ provide: BusinessDocumentsApiPort, useClass: BusinessDocumentsApiClient }],
  },
];
