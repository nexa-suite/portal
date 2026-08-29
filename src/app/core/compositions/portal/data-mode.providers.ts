import { inject, Provider, ProviderToken, Type } from '@angular/core';

import { CatalogApiPort } from '../../../catalogcommercialpolicy/application/ports/catalog-api.port';
import { CatalogApiClient } from '../../../catalogcommercialpolicy/infrastructure/catalog-api.client';
import { MockCatalogApiAdapter } from '../../../catalogcommercialpolicy/infrastructure/mock/mock-catalog-api.adapter';
import { BuyerAccountApiPort } from '../../../customerbuyerrelationships/application/ports/buyer-account-api.port';
import { BuyerAccountApiClient } from '../../../customerbuyerrelationships/infrastructure/buyer-account-api.client';
import { MockBuyerAccountApiAdapter } from '../../../customerbuyerrelationships/infrastructure/mock/mock-buyer-account-api.adapter';
import { DeliveryTrackingApiPort } from '../../../fulfillmentdelivery/application/ports/delivery-tracking-api.port';
import { DeliveryTrackingApiClient } from '../../../fulfillmentdelivery/infrastructure/delivery-tracking-api.client';
import { MockDeliveryTrackingApiAdapter } from '../../../fulfillmentdelivery/infrastructure/mock/mock-delivery-tracking-api.adapter';
import { RECEIVABLES_PORT } from '../../../creditreceivables/application/receivables.port';
import { ReceivablesApiClient } from '../../../creditreceivables/infrastructure/receivables-api.client';
import { MockReceivablesApiAdapter } from '../../../creditreceivables/infrastructure/mock/mock-receivables-api.adapter';
import { PAYMENTS_PORT } from '../../../payments/application/ports/payments-api.port';
import { PaymentsApiClient } from '../../../payments/infrastructure/payments-api.client';
import { MockPaymentsApiAdapter } from '../../../payments/infrastructure/mock/mock-payments-api.adapter';
import { BusinessDocumentsApiPort } from '../../../businessdocuments/application/ports/business-documents-api.port';
import { BusinessDocumentsApiClient } from '../../../businessdocuments/infrastructure/business-documents-api.client';
import { MockBusinessDocumentsApiAdapter } from '../../../businessdocuments/infrastructure/mock/mock-business-documents-api.adapter';
import { NotificationsApiPort } from '../../../notifications/application/ports/notifications-api.port';
import { NotificationsApiClient } from '../../../notifications/infrastructure/notifications-api.client';
import { MockNotificationsApiAdapter } from '../../../notifications/infrastructure/mock/mock-notifications-api.adapter';
import { PORTAL_AUTH_PORT } from '../../../tenantaccessgovernance/iam/application/portal-auth.port';
import { PortalAuthApiClient } from '../../../tenantaccessgovernance/iam/infrastructure/portal-auth-api.client';
import { MockPortalAuthAdapter } from '../../../tenantaccessgovernance/iam/infrastructure/mock/mock-portal-auth.adapter';
import { SECURITY_PORT } from '../../../tenantaccessgovernance/iam/application/security.port';
import { SecurityApiClient } from '../../../tenantaccessgovernance/iam/infrastructure/security-api.client';
import { MockSecurityAdapter } from '../../../tenantaccessgovernance/iam/infrastructure/mock/mock-security.adapter';
import { PurchaseRequestApiPort } from '../../../salescommitment/application/ports/purchase-request-api.port';
import { PurchaseRequestDraftApiPort } from '../../../salescommitment/application/ports/purchase-request-draft-api.port';
import { MockPurchaseRequestApiAdapter } from '../../../salescommitment/infrastructure/mock/mock-purchase-request-api.adapter';
import { MockPurchaseRequestDraftApiAdapter } from '../../../salescommitment/infrastructure/mock/mock-purchase-request-draft-api.adapter';
import { PurchaseRequestDraftApiClient } from '../../../salescommitment/infrastructure/buyer-requests/canonical-purchase-request-draft-api.client';
import { PurchaseRequestApiClient } from '../../../salescommitment/infrastructure/purchase-requests/purchase-request-api.client';
import { SalesOrderApiPort } from '../../../salescommitment/application/ports/sales-order-api.port';
import { SalesOrderApiClient } from '../../../salescommitment/infrastructure/orders/sales-order-api.client';
import { MockSalesOrderApiAdapter } from '../../../salescommitment/infrastructure/mock/mock-sales-order-api.adapter';
import { PAYMENT_ELEMENT_PORT } from '../../../payments/application/ports/payment-element.port';
import { StripePaymentElementAdapter } from '../../../payments/infrastructure/stripe-payment-element.adapter';
import { MockPaymentElementAdapter } from '../../../payments/infrastructure/mock/mock-payment-element.adapter';
import { PORTAL_RUNTIME_CONFIG, PortalDataMode } from '../../security/runtime-config';
import { CHANGE_FEED_FETCH_PORT } from '../../change-feed/application/change-feed-fetch.port';
import { ChangeFeedFetchClient } from '../../change-feed/infrastructure/change-feed-fetch.client';
import { MockChangeFeedFetchClient } from '../../change-feed/infrastructure/mock/mock-change-feed-fetch.client';

/** Selects the implementation at composition time; presentation only sees the port. */
export function selectPortalAdapter<T>(dataMode: PortalDataMode, api: T, mock: T): T {
  return dataMode === 'mock' ? mock : api;
}

export function provideSelectedPortalAdapter<T>(
  port: ProviderToken<T>,
  apiAdapter: Type<T>,
  mockAdapter: Type<T>,
): Provider {
  return {
    provide: port,
    useFactory: () => {
      const config = inject(PORTAL_RUNTIME_CONFIG);
      return config.dataMode === 'mock' ? inject(mockAdapter) : inject(apiAdapter);
    },
  };
}

/** Binds a route to its real HTTP adapter; mock mode cannot replace it. */
export function provideApiOnlyPortalAdapter<T>(port: ProviderToken<T>, apiAdapter: Type<T>): Provider {
  return { provide: port, useExisting: apiAdapter };
}

export function provideChangeFeedAdapter(): Provider {
  return provideSelectedPortalAdapter(CHANGE_FEED_FETCH_PORT, ChangeFeedFetchClient, MockChangeFeedFetchClient);
}

export function providePortalAuthAdapter(): Provider {
  return provideSelectedPortalAdapter(PORTAL_AUTH_PORT, PortalAuthApiClient, MockPortalAuthAdapter);
}

export function provideSecurityAdapter(): Provider {
  return provideSelectedPortalAdapter(SECURITY_PORT, SecurityApiClient, MockSecurityAdapter);
}

export function provideCatalogApiAdapter(): Provider {
  return provideSelectedPortalAdapter(CatalogApiPort, CatalogApiClient, MockCatalogApiAdapter);
}

export function provideBuyerAccountApiAdapter(): Provider {
  return provideSelectedPortalAdapter(BuyerAccountApiPort, BuyerAccountApiClient, MockBuyerAccountApiAdapter);
}

export function providePurchaseRequestDraftApiAdapter(): Provider {
  return provideSelectedPortalAdapter(
    PurchaseRequestDraftApiPort,
    PurchaseRequestDraftApiClient,
    MockPurchaseRequestDraftApiAdapter,
  );
}

export function providePurchaseRequestApiAdapter(): Provider {
  return provideSelectedPortalAdapter(PurchaseRequestApiPort, PurchaseRequestApiClient, MockPurchaseRequestApiAdapter);
}

export function provideDeliveryTrackingApiAdapter(): Provider {
  return provideSelectedPortalAdapter(DeliveryTrackingApiPort, DeliveryTrackingApiClient, MockDeliveryTrackingApiAdapter);
}

export function provideReceivablesApiAdapter(): Provider {
  return provideSelectedPortalAdapter(RECEIVABLES_PORT, ReceivablesApiClient, MockReceivablesApiAdapter);
}

export function providePaymentsApiAdapter(): Provider {
  return provideSelectedPortalAdapter(PAYMENTS_PORT, PaymentsApiClient, MockPaymentsApiAdapter);
}

export function provideBusinessDocumentsApiAdapter(): Provider {
  return provideSelectedPortalAdapter(BusinessDocumentsApiPort, BusinessDocumentsApiClient, MockBusinessDocumentsApiAdapter);
}

export function provideNotificationsApiAdapter(): Provider {
  return provideSelectedPortalAdapter(NotificationsApiPort, NotificationsApiClient, MockNotificationsApiAdapter);
}

export function provideSalesOrderApiAdapter(): Provider {
  return provideSelectedPortalAdapter(SalesOrderApiPort, SalesOrderApiClient, MockSalesOrderApiAdapter);
}

export function providePaymentElementAdapter(): Provider {
  return provideSelectedPortalAdapter(PAYMENT_ELEMENT_PORT, StripePaymentElementAdapter, MockPaymentElementAdapter);
}

export function provideExistingPortalApiPorts(): Provider[] {
  return [
    DeliveryTrackingApiClient,
    MockDeliveryTrackingApiAdapter,
    ReceivablesApiClient,
    MockReceivablesApiAdapter,
    SalesOrderApiClient,
    MockSalesOrderApiAdapter,
    provideDeliveryTrackingApiAdapter(),
    provideReceivablesApiAdapter(),
    provideSalesOrderApiAdapter(),
  ];
}

export const PORTAL_HOME_PROVIDERS: Provider[] = [
  provideCatalogApiAdapter(),
  provideBuyerAccountApiAdapter(),
  providePurchaseRequestApiAdapter(),
  ...provideExistingPortalApiPorts(),
];
