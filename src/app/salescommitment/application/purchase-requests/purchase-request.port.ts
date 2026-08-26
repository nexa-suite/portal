import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  PurchaseRequest,
  PurchaseRequestDetailsCommand,
  PurchaseRequestDraftCommand,
  PurchaseRequestPage,
} from '../../domain/purchase-requests/purchase-request.models';

export type PurchaseRequestLineCommand = Readonly<{
  catalogItemId: string;
  quantity: number;
  unit: string;
  notes: string;
}>;

export type PurchaseRequestLineUpdateCommand = Readonly<{ quantity: number; notes: string }>;

export interface PurchaseRequestPort {
  list(status?: string, sort?: string): Observable<PurchaseRequestPage>;
  get(id: string): Observable<PurchaseRequest>;
  create(command: PurchaseRequestDraftCommand): Observable<PurchaseRequest>;
  update(id: string, request: PurchaseRequest, command: PurchaseRequestDetailsCommand): Observable<PurchaseRequest>;
  addLine(id: string, request: PurchaseRequest, lineCommand: PurchaseRequestLineCommand): Observable<PurchaseRequest>;
  updateLine(id: string, request: PurchaseRequest, lineId: string, lineCommand: PurchaseRequestLineUpdateCommand): Observable<PurchaseRequest>;
  deleteLine(id: string, request: PurchaseRequest, lineId: string): Observable<PurchaseRequest>;
  submit(request: PurchaseRequest, idempotencyKey: string): Observable<PurchaseRequest>;
  cancel(request: PurchaseRequest): Observable<PurchaseRequest>;
}

export const PURCHASE_REQUEST_PORT = new InjectionToken<PurchaseRequestPort>('PURCHASE_REQUEST_PORT');
