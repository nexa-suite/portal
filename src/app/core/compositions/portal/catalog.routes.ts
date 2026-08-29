import { Routes } from '@angular/router';
import { CatalogQueryService } from '../../../catalogcommercialpolicy/application/catalog-query.service';
import { PORTAL_CATALOG_PROVIDERS } from './production.providers';
import { CatalogDetailPageComponent } from '../../../catalogcommercialpolicy/presentation/catalog-detail-page/catalog-detail-page.component';
import { CatalogListPageComponent } from '../../../catalogcommercialpolicy/presentation/catalog-list-page/catalog-list-page.component';

const catalogProviders = [
  CatalogQueryService,
  ...PORTAL_CATALOG_PROVIDERS,
];

export const CATALOG_ROUTES: Routes = [
  { path: '', component: CatalogListPageComponent, providers: catalogProviders },
  { path: ':catalogItemId', component: CatalogDetailPageComponent, providers: catalogProviders },
];
