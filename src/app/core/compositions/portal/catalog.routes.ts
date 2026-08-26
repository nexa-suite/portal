import { Routes } from '@angular/router';
import { CatalogApiPort } from '../../../catalogcommercialpolicy/application/ports/catalog-api.port';
import { CatalogQueryService } from '../../../catalogcommercialpolicy/application/catalog-query.service';
import { CatalogApiClient } from '../../../catalogcommercialpolicy/infrastructure/catalog-api.client';
import { CatalogDetailPageComponent } from '../../../catalogcommercialpolicy/presentation/catalog-detail-page/catalog-detail-page.component';
import { CatalogListPageComponent } from '../../../catalogcommercialpolicy/presentation/catalog-list-page/catalog-list-page.component';

const catalogProviders = [
  CatalogQueryService,
  { provide: CatalogApiPort, useClass: CatalogApiClient },
];

export const CATALOG_ROUTES: Routes = [
  { path: '', component: CatalogListPageComponent, providers: catalogProviders },
  { path: ':catalogItemId', component: CatalogDetailPageComponent, providers: catalogProviders },
];
