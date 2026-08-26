import { inject } from '@angular/core';
import { RedirectFunction, Router, Routes } from '@angular/router';
import { PortalShellComponent } from './core/layout/portal-shell/portal-shell.component';
import { portalAuthGuard, buyerRoleGuard, publicOnlyGuard, buyerPermissionGuard } from './core/routing/portal.guards';
import { ForbiddenPageComponent } from './tenantaccessgovernance/iam/presentation/forbidden/forbidden-page.component';
import { SignInPageComponent } from './tenantaccessgovernance/iam/presentation/sign-in/sign-in-page.component';

const dynamicRedirect = (target: string, parameter: string): RedirectFunction => (route) =>
  inject(Router).createUrlTree([target, route.params[parameter]]);

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'sign-in' },
  { path: 'auth/login', pathMatch: 'full', redirectTo: 'sign-in' },
  { path: 'auth/recover', pathMatch: 'full', redirectTo: 'forgot-password' },
  { path: 'auth/blocked', pathMatch: 'full', redirectTo: 'forbidden' },
  { path: 'auth/forbidden', pathMatch: 'full', redirectTo: 'forbidden' },
  { path: 'sign-in', component: SignInPageComponent, canActivate: [publicOnlyGuard] },
  { path: 'forgot-password', loadComponent: () => import('./tenantaccessgovernance/iam/presentation/forgot-password-page/forgot-password-page.component').then((module) => module.BuyerForgotPasswordPageComponent) },
  { path: 'reset-password', loadComponent: () => import('./tenantaccessgovernance/iam/presentation/reset-password-page/reset-password-page.component').then((module) => module.BuyerResetPasswordPageComponent) },
  { path: 'forbidden', component: ForbiddenPageComponent },
  { path: 'home', pathMatch: 'full', redirectTo: 'portal/home' },
  {
    path: 'portal',
    component: PortalShellComponent,
    canActivate: [portalAuthGuard, buyerRoleGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      { path: 'home', loadComponent: () => import('./core/presentation/home-page/home-page.component').then((module) => module.HomePageComponent) },
      { path: 'profile', loadComponent: () => import('./tenantaccessgovernance/iam/presentation/buyer-profile-page/buyer-profile-page.component').then((module) => module.BuyerProfilePageComponent) },
      { path: 'account', loadChildren: () => import('./core/compositions/portal/buyer-account.routes').then((module) => module.BUYER_ACCOUNT_ROUTES), canActivate: [buyerPermissionGuard('sales:buyer:read')] },
      { path: 'client-account', pathMatch: 'full', redirectTo: 'account' },
      { path: 'notifications', loadComponent: () => import('./notifications/presentation/notifications-page.component').then((module) => module.NotificationsPageComponent), canActivate: [buyerPermissionGuard('notification.read')] },
      { path: 'security/password', loadComponent: () => import('./tenantaccessgovernance/iam/presentation/buyer-change-password-page/buyer-change-password-page.component').then((module) => module.BuyerChangePasswordPageComponent) },
      { path: 'security/sessions', loadComponent: () => import('./tenantaccessgovernance/iam/presentation/buyer-sessions-page/buyer-sessions-page.component').then((module) => module.BuyerSessionsPageComponent) },
      { path: 'product-catalog', loadChildren: () => import('./core/compositions/portal/catalog.routes').then((module) => module.CATALOG_ROUTES), canActivate: [buyerPermissionGuard('catalog:read')] },
      { path: 'request-builder', loadChildren: () => import('./core/compositions/portal/buyer-request.routes').then((module) => module.BUYER_REQUEST_ROUTES), canActivate: [buyerPermissionGuard('sales:buyer:write')] },
      { path: 'purchase-requests/:purchaseRequestId/edit', redirectTo: dynamicRedirect('/portal/request-builder', 'purchaseRequestId') },
      { path: 'purchase-requests', loadChildren: () => import('./core/compositions/portal/purchase-requests.routes').then((module) => module.PURCHASE_REQUEST_ROUTES), canActivate: [buyerPermissionGuard('sales:buyer:read')] },
      { path: 'purchase-orders/success', loadComponent: () => import('./salescommitment/presentation/orders/purchase-order-success-page.component').then((module) => module.PurchaseOrderSuccessPageComponent) },
      { path: 'purchase-orders', pathMatch: 'full', redirectTo: 'sales-orders' },
      { path: 'purchase-orders/:salesOrderId', redirectTo: dynamicRedirect('/portal/sales-orders', 'salesOrderId') },
      { path: 'sales-orders', loadChildren: () => import('./core/compositions/portal/sales-orders.routes').then((module) => module.SALES_ORDER_ROUTES), canActivate: [buyerPermissionGuard('orders:buyer:read')] },
      { path: 'documents', loadChildren: () => import('./core/compositions/portal/business-documents.routes').then((module) => module.BUSINESS_DOCUMENT_ROUTES), canActivate: [buyerPermissionGuard('document.read')] },
      { path: 'receivables', loadComponent: () => import('./core/compositions/receivables-payment/receivables-page.component').then((module) => module.ReceivablesPageComponent), canActivate: [buyerPermissionGuard('payment.read')] },
      { path: 'receivables/:receivableId', loadComponent: () => import('./core/compositions/receivables-payment/receivables-page.component').then((module) => module.ReceivablesPageComponent), canActivate: [buyerPermissionGuard('payment.read')] },
      { path: 'payment-methods', loadComponent: () => import('./payments/presentation/payment-methods-page.component').then((module) => module.PaymentMethodsPageComponent), canActivate: [buyerPermissionGuard('payment.read')] },
      { path: 'legal', loadComponent: () => import('./core/presentation/legal/support-legal-page.component').then((module) => module.SupportLegalPageComponent), data: { section: 'legal' } },
      { path: 'legal/terms', loadComponent: () => import('./core/presentation/legal/support-legal-page.component').then((module) => module.SupportLegalPageComponent), data: { section: 'legal' } },
      { path: 'legal/privacy', loadComponent: () => import('./core/presentation/legal/support-legal-page.component').then((module) => module.SupportLegalPageComponent), data: { section: 'legal' } },
      { path: 'deliveries', loadChildren: () => import('./core/compositions/portal/deliveries.routes').then((module) => module.DELIVERY_ROUTES), canActivate: [buyerPermissionGuard('tracking:buyer:read')] },
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
