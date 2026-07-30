import { inject } from '@angular/core';
import { RedirectFunction, Router, Routes } from '@angular/router';
import { PortalShellComponent } from './core/layout/portal-shell/portal-shell.component';
import { HomePageComponent } from './core/presentation/home-page/home-page.component';
import { portalAuthGuard, buyerRoleGuard, publicOnlyGuard } from './core/routing/portal.guards';
import { ForbiddenPageComponent } from './iam/presentation/forbidden/forbidden-page.component';
import { SignInPageComponent } from './iam/presentation/sign-in/sign-in-page.component';

const dynamicRedirect = (target: string, parameter: string): RedirectFunction => (route) =>
  inject(Router).createUrlTree([target, route.params[parameter]]);

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
      { path: 'product-catalog', loadComponent: () => import('./catalog-management/presentation/catalog-list-page/catalog-list-page.component').then((module) => module.CatalogListPageComponent) },
      { path: 'product-catalog/:catalogItemId', loadComponent: () => import('./catalog-management/presentation/catalog-detail-page/catalog-detail-page.component').then((module) => module.CatalogDetailPageComponent) },
      { path: 'request-builder', loadComponent: () => import('./sales/purchase-requests/presentation/request-builder-page/request-builder-page.component').then((module) => module.RequestBuilderPageComponent) },
      { path: 'request-builder/:purchaseRequestId', loadComponent: () => import('./sales/purchase-requests/presentation/request-builder-page/request-builder-page.component').then((module) => module.RequestBuilderPageComponent) },
      { path: 'purchase-requests', loadComponent: () => import('./sales/purchase-requests/presentation/my-requests-page/my-requests-page.component').then((module) => module.MyRequestsPageComponent) },
      { path: 'purchase-requests/:purchaseRequestId/edit', redirectTo: dynamicRedirect('/portal/request-builder', 'purchaseRequestId') },
      { path: 'purchase-requests/:purchaseRequestId', loadComponent: () => import('./sales/purchase-requests/presentation/request-detail-page/request-detail-page.component').then((module) => module.RequestDetailPageComponent) },
      { path: 'sales-orders', loadComponent: () => import('./sales/orders/presentation/my-sales-orders-page/my-sales-orders-page.component').then((module) => module.MySalesOrdersPageComponent) },
      { path: 'sales-orders/:salesOrderId', loadComponent: () => import('./sales/orders/presentation/sales-order-detail-page/sales-order-detail-page.component').then((module) => module.SalesOrderDetailPageComponent) },
      { path: 'requests', pathMatch: 'full', redirectTo: 'purchase-requests' },
      { path: 'my-orders', pathMatch: 'full', redirectTo: 'sales-orders' },
      { path: 'orders', pathMatch: 'full', redirectTo: 'sales-orders' },
      { path: 'orders/:salesOrderId', redirectTo: dynamicRedirect('/portal/sales-orders', 'salesOrderId') },
      { path: 'requests/:purchaseRequestId/edit', redirectTo: dynamicRedirect('/portal/request-builder', 'purchaseRequestId') },
      { path: 'requests/:purchaseRequestId', redirectTo: dynamicRedirect('/portal/purchase-requests', 'purchaseRequestId') },
      { path: 'catalog', pathMatch: 'full', redirectTo: 'product-catalog' },
      { path: 'catalog/:catalogItemId', redirectTo: dynamicRedirect('/portal/product-catalog', 'catalogItemId') },
      { path: '**', redirectTo: 'home' },
    ],
  },
  { path: '**', redirectTo: 'sign-in' },
];
