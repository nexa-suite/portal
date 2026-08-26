import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { CanonicalDraftLine, PurchaseRequestDraftView } from '../../domain/buyer-requests/purchase-request-draft.models';

export interface PurchaseRequestDraftPort {
  create(clientAccountId: string, requestedDeliveryDate: string): Observable<PurchaseRequestDraftView>;
  get(draftId: string): Observable<PurchaseRequestDraftView>;
  replaceLines(draftId: string, etag: string, lines: readonly CanonicalDraftLine[]): Observable<PurchaseRequestDraftView>;
  setDestination(draftId: string, etag: string, addressId: string): Observable<PurchaseRequestDraftView>;
  previewRoute(draftId: string, etag: string): Observable<PurchaseRequestDraftView>;
  setPreferences(draftId: string, etag: string, paymentPreference: string, requestedDeliveryDate: string): Observable<PurchaseRequestDraftView>;
  submit(draftId: string, etag: string, idempotencyKey: string): Observable<PurchaseRequestDraftView>;
}

export const PURCHASE_REQUEST_DRAFT_PORT = new InjectionToken<PurchaseRequestDraftPort>('PURCHASE_REQUEST_DRAFT_PORT');
