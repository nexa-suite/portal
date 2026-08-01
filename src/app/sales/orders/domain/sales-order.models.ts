export type SalesOrderStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';

export interface SalesOrderLine {
  readonly id: string;
  readonly catalogItemId: string;
  readonly itemName: string;
  readonly presentation: string;
  readonly quantity: number;
  readonly unit: string;
  readonly unitPriceAmount: number;
  readonly currency: string;
  readonly totalAmount: number;
}

export interface SalesOrder {
  readonly id: string;
  readonly number: string;
  readonly status: SalesOrderStatus;
  readonly purchaseRequestId: string;
  readonly purchaseRequestCode: string | null;
  readonly clientAccountId: string;
  readonly currency: string;
  readonly totalAmount: number;
  readonly createdAt: string | null;
  readonly rejectionReason: string | null;
  readonly lines: readonly SalesOrderLine[];
  readonly version: number;
  readonly etag?: string;
}

export interface SalesOrderPage {
  readonly items: readonly SalesOrder[];
  readonly page: number;
  readonly size: number;
  readonly total: number;
}

export interface SalesOrderEvent {
  readonly id: string;
  readonly type: string;
  readonly occurredAt: string | null;
  readonly detail: string | null;
}

export const SALES_ORDER_SORTS = ['createdAt,desc', 'createdAt,asc', 'orderNumber,asc', 'orderNumber,desc'] as const;
export type SalesOrderSort = (typeof SALES_ORDER_SORTS)[number];

export function validSalesOrderSort(value: string): SalesOrderSort {
  return (SALES_ORDER_SORTS as readonly string[]).includes(value)
    ? (value as SalesOrderSort)
    : 'createdAt,desc';
}

export function salesOrderEtag(order: SalesOrder): string {
  return order.etag ?? `"${order.version}"`;
}
