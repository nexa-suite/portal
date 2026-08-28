export interface CanonicalDraftLine {
  readonly skuId: string;
  readonly quantity: number;
  readonly unit: string;
  readonly notes: string;
}

export interface PurchaseRequestDraftView {
  readonly id: string;
  readonly clientAccountId: string;
  readonly buyerMembershipId: string;
  readonly status: string;
  readonly version: number;
  readonly requestedDeliveryDate: string | null;
  readonly paymentPreference: string | null;
  readonly creditResult: string | null;
  readonly routeProvider: string | null;
  readonly lines: readonly Record<string, unknown>[];
  readonly destination: Record<string, unknown> | null;
  readonly route: Record<string, unknown> | null;
  readonly warehouseSelection: Record<string, unknown> | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly submittedAt: string | null;
  readonly etag: string;
}

export interface PurchaseRequestDraftReview {
  readonly draft: PurchaseRequestDraftView;
  readonly productsComplete: boolean;
  readonly destinationComplete: boolean;
  readonly routeValidated: boolean;
  readonly commercialReviewComplete: boolean;
  readonly readyToSubmit: boolean;
  readonly missing: readonly string[];
}
