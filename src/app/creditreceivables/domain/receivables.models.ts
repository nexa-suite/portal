export interface ReceivablesPage<T> {
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
