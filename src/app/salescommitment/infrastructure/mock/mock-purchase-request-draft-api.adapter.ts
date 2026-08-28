import { inject, Injectable } from '@angular/core';
import { defer, Observable, of } from 'rxjs';

import { PurchaseRequestDraftApiPort } from '../../application/ports/purchase-request-draft-api.port';
import type { CanonicalDraftLine, PurchaseRequestDraftReview, PurchaseRequestDraftView } from '../../domain/buyer-requests/purchase-request-draft.models';
import { MockSalesCommitmentStore } from './mock-sales-commitment.store';

@Injectable({ providedIn: 'root' })
export class MockPurchaseRequestDraftApiAdapter implements PurchaseRequestDraftApiPort {
  private readonly store = inject(MockSalesCommitmentStore);

  create(clientAccountId: string, requestedDeliveryDate: string): Observable<PurchaseRequestDraftView> {
    return defer(() => of(this.store.createDraft(clientAccountId, requestedDeliveryDate)));
  }

  get(draftId: string): Observable<PurchaseRequestDraftView> {
    return defer(() => of(this.store.getDraft(draftId)));
  }

  replaceLines(
    draftId: string,
    etag: string,
    lines: readonly CanonicalDraftLine[],
  ): Observable<PurchaseRequestDraftView> {
    return defer(() => of(this.store.replaceDraftLines(draftId, etag, lines)));
  }

  setDestination(
    draftId: string,
    etag: string,
    addressId: string,
  ): Observable<PurchaseRequestDraftView> {
    return defer(() => of(this.store.setDraftDestination(draftId, etag, addressId)));
  }

  previewRoute(draftId: string, etag: string): Observable<PurchaseRequestDraftView> {
    return defer(() => of(this.store.previewDraftRoute(draftId, etag)));
  }

  setPreferences(
    draftId: string,
    etag: string,
    paymentPreference: string,
    requestedDeliveryDate: string,
  ): Observable<PurchaseRequestDraftView> {
    return defer(() => of(this.store.setDraftPreferences(draftId, etag, paymentPreference, requestedDeliveryDate)));
  }

  review(draftId: string): Observable<PurchaseRequestDraftReview> {
    return defer(() => of(this.store.reviewDraft(draftId)));
  }

  submit(
    draftId: string,
    etag: string,
    idempotencyKey: string,
  ): Observable<PurchaseRequestDraftView> {
    return defer(() => of(this.store.submitDraft(draftId, etag, idempotencyKey)));
  }
}
