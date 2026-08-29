export type PurchaseRequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'IN_REVIEW'
  | 'NEEDS_ADJUSTMENT'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'CONVERTED_TO_ORDER';

export type PurchaseRequestPriority = 'NORMAL' | 'HIGH' | 'URGENT';
export type PaymentOption = 'CREDIT_LINE' | 'BANK_TRANSFER' | 'CARD_STRIPE' | 'CASH' | 'CASH_ON_DELIVERY';

export interface PurchaseRequestLine {
  readonly id: string;
  readonly catalogItemId: string;
  readonly itemName: string;
  readonly presentation: string;
  readonly quantity: number;
  readonly unit: string;
  readonly unitPriceAmount: number;
  readonly unitPriceCurrency: string;
  readonly notes: string | null;
}

export interface PurchaseRequest {
  readonly id: string;
  readonly code: string;
  readonly status: PurchaseRequestStatus;
  readonly priority: PurchaseRequestPriority;
  readonly requestedDeliveryDate: string | null;
  readonly deliveryProfileSnapshot: string | null;
  readonly paymentOption: PaymentOption | null;
  readonly comment: string | null;
  readonly reviewNote: string | null;
  readonly lines: readonly PurchaseRequestLine[];
  /** Summary responses expose this count; detail responses derive it from lines. */
  readonly lineCount: number;
  readonly version: number;
  readonly etag?: string;
}

export interface PurchaseRequestPage {
  readonly items: readonly PurchaseRequest[];
  readonly page: number;
  readonly size: number;
  readonly total: number;
}

export interface PurchaseRequestDetailsCommand {
  readonly priority: PurchaseRequestPriority;
  readonly requestedDeliveryDate: string | null;
  readonly deliveryProfileSnapshot: string;
  readonly paymentOption: PaymentOption;
  readonly comment: string;
}

export interface PurchaseRequestDraftCommand extends PurchaseRequestDetailsCommand {
  readonly lines: readonly {
    readonly catalogItemId: string;
    readonly quantity: number;
    readonly unit: string;
    readonly notes: string;
  }[];
}

export const DEFAULT_PURCHASE_REQUEST_DETAILS: PurchaseRequestDetailsCommand = {
  priority: 'NORMAL',
  requestedDeliveryDate: null,
  deliveryProfileSnapshot: '',
  paymentOption: 'CASH_ON_DELIVERY',
  comment: '',
};

export const PURCHASE_REQUEST_SORTS = ['createdAt,desc', 'createdAt,asc', 'updatedAt,desc', 'updatedAt,asc'] as const;
export type PurchaseRequestSort = (typeof PURCHASE_REQUEST_SORTS)[number];

export function validPurchaseRequestSort(value: string): PurchaseRequestSort {
  return (PURCHASE_REQUEST_SORTS as readonly string[]).includes(value)
    ? (value as PurchaseRequestSort)
    : 'createdAt,desc';
}

export function etagFor(request: PurchaseRequest): string {
  return request.etag ?? `"${request.version}"`;
}

export function canEditPurchaseRequest(status: PurchaseRequestStatus): boolean {
  return status === 'DRAFT' || status === 'NEEDS_ADJUSTMENT';
}

export function canCancelPurchaseRequest(status: PurchaseRequestStatus): boolean {
  return status === 'DRAFT' || status === 'SUBMITTED' || status === 'IN_REVIEW' || status === 'NEEDS_ADJUSTMENT';
}
