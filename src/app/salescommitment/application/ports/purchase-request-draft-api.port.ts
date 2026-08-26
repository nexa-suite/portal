import { Observable } from 'rxjs';
import { CanonicalDraftLine, PurchaseRequestDraftView } from '../../domain/buyer-requests/purchase-request-draft.models';

/** Application port for the canonical Purchase Request Draft workflow. */
export abstract class PurchaseRequestDraftApiPort {
  abstract create(clientAccountId: string, requestedDeliveryDate: string): Observable<PurchaseRequestDraftView>;
  abstract get(draftId: string): Observable<PurchaseRequestDraftView>;
  abstract replaceLines(draftId: string, etag: string, lines: readonly CanonicalDraftLine[]): Observable<PurchaseRequestDraftView>;
  abstract setDestination(draftId: string, etag: string, addressId: string): Observable<PurchaseRequestDraftView>;
  abstract previewRoute(draftId: string, etag: string): Observable<PurchaseRequestDraftView>;
  abstract setPreferences(draftId: string, etag: string, paymentPreference: string, requestedDeliveryDate: string): Observable<PurchaseRequestDraftView>;
  abstract submit(draftId: string, etag: string, idempotencyKey: string): Observable<PurchaseRequestDraftView>;
}
