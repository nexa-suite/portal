/**
 * Stores only the current UI link to a canonical buyer draft.
 *
 * The server draft remains the authority; this link is a recoverable pointer
 * used to restore the builder route after navigation or a page refresh.
 */
export abstract class PurchaseRequestDraftSessionPort {
  abstract read(scope: string): string | null;
  abstract write(scope: string, draftId: string): void;
  abstract clear(scope: string): void;
}
