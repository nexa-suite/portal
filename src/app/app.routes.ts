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
      { path: 'catalog', pathMatch: 'full', redirectTo: 'product-catalog' },
      { path: 'catalog/:catalogItemId', redirectTo: 'product-catalog/:catalogItemId' },
      { path: '**', redirectTo: 'home' },
    ],
  },
  { path: '**', redirectTo: 'sign-in' },
];
