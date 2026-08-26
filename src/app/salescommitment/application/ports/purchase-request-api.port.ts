import { Observable } from 'rxjs';
import {
  PurchaseRequest,
  PurchaseRequestDetailsCommand,
  PurchaseRequestDraftCommand,
  PurchaseRequestPage,
} from '../../domain/purchase-requests/purchase-request.models';

/** Application port for buyer Purchase Request queries and lifecycle commands. */
export abstract class PurchaseRequestApiPort {
  abstract list(status?: string, sort?: string): Observable<PurchaseRequestPage>;
  abstract get(id: string): Observable<PurchaseRequest>;
  abstract create(command: PurchaseRequestDraftCommand): Observable<PurchaseRequest>;
  abstract update(id: string, request: PurchaseRequest, command: PurchaseRequestDetailsCommand): Observable<PurchaseRequest>;
  abstract addLine(id: string, request: PurchaseRequest, lineCommand: { readonly catalogItemId: string; readonly quantity: number; readonly unit: string; readonly notes: string }): Observable<PurchaseRequest>;
  abstract updateLine(id: string, request: PurchaseRequest, lineId: string, lineCommand: { readonly quantity: number; readonly notes: string }): Observable<PurchaseRequest>;
  abstract deleteLine(id: string, request: PurchaseRequest, lineId: string): Observable<PurchaseRequest>;
  abstract submit(request: PurchaseRequest, idempotencyKey: string): Observable<PurchaseRequest>;
  abstract cancel(request: PurchaseRequest): Observable<PurchaseRequest>;
}
