import { inject } from '@angular/core';
import { RedirectFunction, Router, Routes } from '@angular/router';
import { PortalShellComponent } from './core/layout/portal-shell/portal-shell.component';
import { HomePageComponent } from './core/presentation/home-page/home-page.component';
import { portalAuthGuard, buyerRoleGuard, publicOnlyGuard, buyerPermissionGuard } from './core/routing/portal.guards';
import { ForbiddenPageComponent } from './iam/presentation/forbidden/forbidden-page.component';
import { SignInPageComponent } from './iam/presentation/sign-in/sign-in-page.component';

const dynamicRedirect = (target: string, parameter: string): RedirectFunction => (route) =>
  inject(Router).createUrlTree([target, route.params[parameter]]);

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'sign-in' },
  { path: 'auth/login', pathMatch: 'full', redirectTo: 'sign-in' },
  { path: 'auth/recover', pathMatch: 'full', redirectTo: 'forgot-password' },
  { path: 'auth/blocked', pathMatch: 'full', redirectTo: 'forbidden' },
  { path: 'auth/forbidden', pathMatch: 'full', redirectTo: 'forbidden' },
  { path: 'sign-in', component: SignInPageComponent, canActivate: [publicOnlyGuard] },
  { path: 'forgot-password', loadComponent: () => import('./iam/presentation/forgot-password-page/forgot-password-page.component').then((module) => module.BuyerForgotPasswordPageComponent) },
  { path: 'reset-password', loadComponent: () => import('./iam/presentation/reset-password-page/reset-password-page.component').then((module) => module.BuyerResetPasswordPageComponent) },
  { path: 'forbidden', component: ForbiddenPageComponent },
  { path: 'home', pathMatch: 'full', redirectTo: 'portal/home' },
  {
    path: 'portal',
    component: PortalShellComponent,
    canActivate: [portalAuthGuard, buyerRoleGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      { path: 'home', component: HomePageComponent },
      { path: 'profile', loadComponent: () => import('./iam/presentation/buyer-profile-page/buyer-profile-page.component').then((module) => module.BuyerProfilePageComponent) },
      { path: 'account', loadComponent: () => import('./sales/buyer-requests/presentation/buyer-account-page.component').then((module) => module.BuyerAccountPageComponent), canActivate: [buyerPermissionGuard('sales:buyer:read')] },
      { path: 'client-account', pathMatch: 'full', redirectTo: 'account' },
      { path: 'notifications', loadComponent: () => import('./core/notifications/presentation/notifications-page.component').then((module) => module.NotificationsPageComponent), canActivate: [buyerPermissionGuard('notification.read')] },
      { path: 'security/password', loadComponent: () => import('./iam/presentation/buyer-change-password-page/buyer-change-password-page.component').then((module) => module.BuyerChangePasswordPageComponent) },
      { path: 'security/sessions', loadComponent: () => import('./iam/presentation/buyer-sessions-page/buyer-sessions-page.component').then((module) => module.BuyerSessionsPageComponent) },
      { path: 'product-catalog', loadComponent: () => import('./catalog-management/presentation/catalog-list-page/catalog-list-page.component').then((module) => module.CatalogListPageComponent), canActivate: [buyerPermissionGuard('catalog:read')] },
      { path: 'product-catalog/:catalogItemId', loadComponent: () => import('./catalog-management/presentation/catalog-detail-page/catalog-detail-page.component').then((module) => module.CatalogDetailPageComponent), canActivate: [buyerPermissionGuard('catalog:read')] },
      { path: 'request-builder', loadComponent: () => import('./sales/buyer-requests/presentation/buyer-request-builder-page.component').then((module) => module.BuyerRequestBuilderPageComponent), canActivate: [buyerPermissionGuard('sales:buyer:write')] },
      { path: 'request-builder/:purchaseRequestId', loadComponent: () => import('./sales/buyer-requests/presentation/buyer-request-builder-page.component').then((module) => module.BuyerRequestBuilderPageComponent), canActivate: [buyerPermissionGuard('sales:buyer:write')] },
      { path: 'purchase-requests', loadComponent: () => import('./sales/purchase-requests/presentation/my-requests-page/my-requests-page.component').then((module) => module.MyRequestsPageComponent), canActivate: [buyerPermissionGuard('sales:buyer:read')] },
      { path: 'purchase-requests/:purchaseRequestId/edit', redirectTo: dynamicRedirect('/portal/request-builder', 'purchaseRequestId') },
      { path: 'purchase-requests/:purchaseRequestId', loadComponent: () => import('./sales/purchase-requests/presentation/request-detail-page/request-detail-page.component').then((module) => module.RequestDetailPageComponent), canActivate: [buyerPermissionGuard('sales:buyer:read')] },
      { path: 'purchase-orders/success', loadComponent: () => import('./sales/orders/presentation/purchase-order-success-page.component').then((module) => module.PurchaseOrderSuccessPageComponent) },
      { path: 'purchase-orders', pathMatch: 'full', redirectTo: 'sales-orders' },
      { path: 'purchase-orders/:salesOrderId', redirectTo: dynamicRedirect('/portal/sales-orders', 'salesOrderId') },
      { path: 'sales-orders', loadComponent: () => import('./sales/orders/presentation/my-sales-orders-page/my-sales-orders-page.component').then((module) => module.MySalesOrdersPageComponent), canActivate: [buyerPermissionGuard('orders:buyer:read')] },
      { path: 'sales-orders/:salesOrderId', loadComponent: () => import('./sales/orders/presentation/sales-order-detail-page/sales-order-detail-page.component').then((module) => module.SalesOrderDetailPageComponent), canActivate: [buyerPermissionGuard('orders:buyer:read')] },
      { path: 'documents', loadComponent: () => import('./documents/presentation/business-documents-page.component').then((module) => module.BusinessDocumentsPageComponent), canActivate: [buyerPermissionGuard('document.read')] },
      { path: 'receivables', loadComponent: () => import('./payments/presentation/receivables-page.component').then((module) => module.ReceivablesPageComponent), canActivate: [buyerPermissionGuard('payment.read')] },
      { path: 'receivables/:receivableId', loadComponent: () => import('./payments/presentation/receivables-page.component').then((module) => module.ReceivablesPageComponent), canActivate: [buyerPermissionGuard('payment.read')] },
      { path: 'payment-methods', loadComponent: () => import('./payments/presentation/payment-methods-page.component').then((module) => module.PaymentMethodsPageComponent), canActivate: [buyerPermissionGuard('payment.read')] },
      { path: 'premium', loadComponent: () => import('./premium/presentation/premium-page.component').then((module) => module.PremiumPageComponent) },
      { path: 'support', loadComponent: () => import('./support/presentation/support-legal-page.component').then((module) => module.SupportLegalPageComponent) },
      { path: 'legal', loadComponent: () => import('./support/presentation/support-legal-page.component').then((module) => module.SupportLegalPageComponent), data: { section: 'legal' } },
      { path: 'legal/terms', loadComponent: () => import('./support/presentation/support-legal-page.component').then((module) => module.SupportLegalPageComponent), data: { section: 'legal' } },
      { path: 'legal/privacy', loadComponent: () => import('./support/presentation/support-legal-page.component').then((module) => module.SupportLegalPageComponent), data: { section: 'legal' } },
      { path: 'deliveries', loadComponent: () => import('./logistics/presentation/my-deliveries-page.component').then((module) => module.MyDeliveriesPageComponent), canActivate: [buyerPermissionGuard('tracking:buyer:read')] },
      { path: 'deliveries/:dispatchOrderId', loadComponent: () => import('./logistics/presentation/delivery-detail-page.component').then((module) => module.DeliveryDetailPageComponent), canActivate: [buyerPermissionGuard('tracking:buyer:read')] },
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
