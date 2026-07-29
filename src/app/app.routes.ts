import { Routes } from '@angular/router';
import { CatalogDetailPageComponent } from './catalog-management/presentation/catalog-detail-page/catalog-detail-page.component';
import { CatalogListPageComponent } from './catalog-management/presentation/catalog-list-page/catalog-list-page.component';
import { PortalShellComponent } from './core/layout/portal-shell/portal-shell.component';
import { HomePageComponent } from './core/presentation/home-page/home-page.component';
import { portalAuthGuard, buyerRoleGuard, publicOnlyGuard } from './core/routing/portal.guards';
import { ForbiddenPageComponent } from './iam/presentation/forbidden/forbidden-page.component';
import { SignInPageComponent } from './iam/presentation/sign-in/sign-in-page.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'sign-in' },
  { path: 'sign-in', component: SignInPageComponent, canActivate: [publicOnlyGuard] },
  { path: 'forbidden', component: ForbiddenPageComponent },
  { path: 'home', pathMatch: 'full', redirectTo: 'portal/home' },
  {
    path: 'portal',
    component: PortalShellComponent,
    canActivate: [portalAuthGuard, buyerRoleGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      { path: 'home', component: HomePageComponent },
      { path: 'product-catalog', component: CatalogListPageComponent },
      { path: 'product-catalog/:catalogItemId', component: CatalogDetailPageComponent },
      { path: 'request-builder', loadComponent: () => import('./sales/purchase-requests/presentation/request-builder-page/request-builder-page.component').then((module) => module.RequestBuilderPageComponent) },
      { path: 'purchase-requests', loadComponent: () => import('./sales/purchase-requests/presentation/my-requests-page/my-requests-page.component').then((module) => module.MyRequestsPageComponent) },
      { path: 'purchase-requests/:purchaseRequestId', loadComponent: () => import('./sales/purchase-requests/presentation/request-detail-page/request-detail-page.component').then((module) => module.RequestDetailPageComponent) },
      { path: 'requests', pathMatch: 'full', redirectTo: 'purchase-requests' },
      { path: 'requests/:purchaseRequestId', redirectTo: 'purchase-requests/:purchaseRequestId' },
      { path: 'catalog', pathMatch: 'full', redirectTo: 'product-catalog' },
      { path: 'catalog/:catalogItemId', redirectTo: 'product-catalog/:catalogItemId' },
      { path: '**', redirectTo: 'home' },
    ],
  },
  { path: '**', redirectTo: 'sign-in' },
];
