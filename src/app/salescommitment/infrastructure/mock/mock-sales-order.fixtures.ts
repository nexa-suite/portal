import type { TenantProfile } from '../../../core/security/runtime-config';
import type { SalesOrder, SalesOrderEvent } from '../../domain/orders/sales-order.models';

export interface MockSalesOrderFixture {
  readonly orders: readonly SalesOrder[];
  readonly events: readonly SalesOrderEvent[];
}

function fixture(profile: TenantProfile): MockSalesOrderFixture {
  const icisa = profile === 'icisa';
  const key = icisa ? 'ICISA' : 'GENERIC';
  const orders: SalesOrder[] = [
    { id: `${profile}-order-001`, number: `SO-${key}-001`, status: 'PENDING', purchaseRequestId: `PR-${key}-0001`, purchaseRequestCode: `PR-${key}-0001`, clientAccountId: `client-${profile}-001`, currency: 'PEN', totalAmount: icisa ? 2490.75 : 1280.5, createdAt: '2026-08-25T08:00:00Z', rejectionReason: null, lines: [{ id: `${profile}-order-001-line-001`, catalogItemId: icisa ? 'CAT-0001' : 'CAT-GENERIC-001', itemName: icisa ? 'Queso Grana Padano DOP' : 'Demo Refrigerated Cheese', presentation: icisa ? '150 g' : '500 g', quantity: 5, unit: 'UNIT', unitPriceAmount: icisa ? 17.3 : 16.2, currency: 'PEN', totalAmount: icisa ? 86.5 : 81 }], version: 1, etag: '"1"' },
    { id: `${profile}-order-002`, number: `SO-${key}-002`, status: 'CONFIRMED', purchaseRequestId: `PR-${key}-0002`, purchaseRequestCode: `PR-${key}-0002`, clientAccountId: `client-${profile}-001`, currency: 'PEN', totalAmount: icisa ? 980 : 845, createdAt: '2026-08-24T10:00:00Z', rejectionReason: null, lines: [{ id: `${profile}-order-002-line-001`, catalogItemId: icisa ? 'CAT-0002' : 'CAT-GENERIC-002', itemName: icisa ? 'Queso Parmigiano Reggiano DOP' : 'Demo Frozen Fruit', presentation: icisa ? '150 g' : '1 kg', quantity: 2, unit: 'UNIT', unitPriceAmount: icisa ? 19.8 : 24.5, currency: 'PEN', totalAmount: icisa ? 39.6 : 49 }], version: 2, etag: '"2"' },
  ];
  return { orders, events: orders.map((order) => ({ id: `${order.id}-event-001`, type: order.status === 'CONFIRMED' ? 'ORDER_CONFIRMED' : 'ORDER_CREATED', occurredAt: order.createdAt, detail: order.status === 'CONFIRMED' ? 'Order confirmed by buyer workflow.' : 'Order awaits buyer confirmation.' })) };
}

export const MOCK_SALES_ORDER_FIXTURES: Readonly<Record<TenantProfile, MockSalesOrderFixture>> = { generic: fixture('generic'), icisa: fixture('icisa') };
