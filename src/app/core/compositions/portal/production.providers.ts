import { Provider, ProviderToken, Type } from '@angular/core';

import { BusinessDocumentsApiPort } from '../../../businessdocuments/application/ports/business-documents-api.port';
import { BusinessDocumentsApiClient } from '../../../businessdocuments/infrastructure/business-documents-api.client';
import { CatalogApiPort } from '../../../catalogcommercialpolicy/application/ports/catalog-api.port';
import { CatalogApiClient } from '../../../catalogcommercialpolicy/infrastructure/catalog-api.client';
import { RECEIVABLES_PORT } from '../../../creditreceivables/application/receivables.port';
import { ReceivablesApiClient } from '../../../creditreceivables/infrastructure/receivables-api.client';
import { BuyerAccountApiPort } from '../../../customerbuyerrelationships/application/ports/buyer-account-api.port';
import { BuyerAccountApiClient } from '../../../customerbuyerrelationships/infrastructure/buyer-account-api.client';
import { DeliveryTrackingApiPort } from '../../../fulfillmentdelivery/application/ports/delivery-tracking-api.port';
import { DeliveryTrackingApiClient } from '../../../fulfillmentdelivery/infrastructure/delivery-tracking-api.client';
import { CHANGE_FEED_FETCH_PORT } from '../../change-feed/application/change-feed-fetch.port';
import { ChangeFeedFetchClient } from '../../change-feed/infrastructure/change-feed-fetch.client';
import { NotificationsApiPort } from '../../../notifications/application/ports/notifications-api.port';
import { NotificationsApiClient } from '../../../notifications/infrastructure/notifications-api.client';
import { PAYMENT_ELEMENT_PORT } from '../../../payments/application/ports/payment-element.port';
import { PAYMENTS_PORT } from '../../../payments/application/ports/payments-api.port';
import { PaymentElementPort } from '../../../payments/application/ports/payment-element.port';
import { PaymentsApiClient } from '../../../payments/infrastructure/payments-api.client';
import { StripePaymentElementAdapter } from '../../../payments/infrastructure/stripe-payment-element.adapter';
import { PurchaseRequestApiPort } from '../../../salescommitment/application/ports/purchase-request-api.port';
import { PurchaseRequestDraftApiPort } from '../../../salescommitment/application/ports/purchase-request-draft-api.port';
import { PurchaseRequestApiClient } from '../../../salescommitment/infrastructure/purchase-requests/purchase-request-api.client';
import { PurchaseRequestDraftApiClient } from '../../../salescommitment/infrastructure/buyer-requests/canonical-purchase-request-draft-api.client';
import { SalesOrderApiPort } from '../../../salescommitment/application/ports/sales-order-api.port';
import { SalesOrderApiClient } from '../../../salescommitment/infrastructure/orders/sales-order-api.client';
import { PORTAL_AUTH_PORT } from '../../../tenantaccessgovernance/iam/application/portal-auth.port';
import { SecurityApiClient } from '../../../tenantaccessgovernance/iam/infrastructure/security-api.client';
import { PortalAuthApiClient } from '../../../tenantaccessgovernance/iam/infrastructure/portal-auth-api.client';
import { SECURITY_PORT } from '../../../tenantaccessgovernance/iam/application/security.port';

function bind<T>(port: ProviderToken<T>, client: Type<T>): Provider[] {
  return [client, { provide: port, useExisting: client }];
}

export const PORTAL_AUTH_PROVIDERS = bind(PORTAL_AUTH_PORT, PortalAuthApiClient);
export const PORTAL_SECURITY_PROVIDERS = bind(SECURITY_PORT, SecurityApiClient);
export const PORTAL_CHANGE_FEED_PROVIDERS = bind(CHANGE_FEED_FETCH_PORT, ChangeFeedFetchClient);
export const PORTAL_NOTIFICATIONS_PROVIDERS = bind(NotificationsApiPort, NotificationsApiClient);
export const PORTAL_PAYMENT_ELEMENT_PROVIDERS = bind<PaymentElementPort>(PAYMENT_ELEMENT_PORT, StripePaymentElementAdapter);

export const PORTAL_CATALOG_PROVIDERS = bind(CatalogApiPort, CatalogApiClient);
export const PORTAL_BUYER_ACCOUNT_PROVIDERS = bind(BuyerAccountApiPort, BuyerAccountApiClient);
export const PORTAL_PURCHASE_REQUEST_PROVIDERS = bind(PurchaseRequestApiPort, PurchaseRequestApiClient);
export const PORTAL_PURCHASE_REQUEST_DRAFT_PROVIDERS = bind(PurchaseRequestDraftApiPort, PurchaseRequestDraftApiClient);
export const PORTAL_DELIVERY_PROVIDERS = bind(DeliveryTrackingApiPort, DeliveryTrackingApiClient);
export const PORTAL_RECEIVABLES_PROVIDERS = bind(RECEIVABLES_PORT, ReceivablesApiClient);
export const PORTAL_PAYMENTS_PROVIDERS = bind(PAYMENTS_PORT, PaymentsApiClient);
export const PORTAL_BUSINESS_DOCUMENTS_PROVIDERS = bind(BusinessDocumentsApiPort, BusinessDocumentsApiClient);
export const PORTAL_SALES_ORDER_PROVIDERS = bind(SalesOrderApiPort, SalesOrderApiClient);

export const PORTAL_PRODUCTION_PROVIDERS: Provider[] = [
  ...PORTAL_AUTH_PROVIDERS,
  ...PORTAL_SECURITY_PROVIDERS,
  ...PORTAL_CHANGE_FEED_PROVIDERS,
  ...PORTAL_NOTIFICATIONS_PROVIDERS,
  ...PORTAL_PAYMENT_ELEMENT_PROVIDERS,
];

export const PORTAL_HOME_PROVIDERS: Provider[] = [
  ...PORTAL_CATALOG_PROVIDERS,
  ...PORTAL_BUYER_ACCOUNT_PROVIDERS,
  ...PORTAL_PURCHASE_REQUEST_PROVIDERS,
  ...PORTAL_DELIVERY_PROVIDERS,
  ...PORTAL_RECEIVABLES_PROVIDERS,
  ...PORTAL_SALES_ORDER_PROVIDERS,
];
