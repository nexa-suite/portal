export interface ApiPage<T> {
  readonly items: readonly T[];
  readonly page: number;
  readonly size: number;
  readonly total: number;
}

export interface Receivable {
  readonly id: string;
  readonly clientAccountId: string;
  readonly subjectType: string;
  readonly subjectId: string;
  readonly number: string;
  readonly currency: string;
  readonly amount: number;
  readonly amountPaid: number;
  readonly remaining: number;
  readonly status: string;
  readonly dueAt: string | null;
  readonly version: number;
}

export interface PaymentIntent {
  readonly paymentId: string;
  readonly receivableId: string;
  readonly status: string;
  readonly amount: number;
  readonly currency: string;
  readonly clientSecret: string | null;
  readonly publishableKey: string;
  readonly providerPaymentIntentId: string | null;
  readonly createdAt: string;
}

export interface BankTransferPayment {
  readonly id: string;
  readonly receivableId: string;
  readonly method: string;
  readonly status: string;
  readonly amount: number;
  readonly currency: string;
  readonly createdAt: string;
  readonly completedAt: string | null;
}

export interface PaymentHistoryItem extends BankTransferPayment {
  readonly reference: string | null;
  readonly reviewReason: string | null;
  readonly receivableNumber: string;
}
