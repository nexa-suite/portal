import { inject, Injectable } from '@angular/core';
import { defer, Observable, of } from 'rxjs';

import { PurchaseRequestApiPort } from '../../application/ports/purchase-request-api.port';
import type {
  PurchaseRequest,
  PurchaseRequestDetailsCommand,
  PurchaseRequestDraftCommand,
  PurchaseRequestPage,
} from '../../domain/purchase-requests/purchase-request.models';
import { MockSalesCommitmentStore } from './mock-sales-commitment.store';

@Injectable({ providedIn: 'root' })
export class MockPurchaseRequestApiAdapter implements PurchaseRequestApiPort {
  private readonly store = inject(MockSalesCommitmentStore);

  list(status = '', sort = 'createdAt,desc'): Observable<PurchaseRequestPage> {
    return defer(() => of(this.store.listRequests(status, sort)));
  }

  get(id: string): Observable<PurchaseRequest> {
    return defer(() => of(this.store.getRequest(id)));
  }

  create(command: PurchaseRequestDraftCommand): Observable<PurchaseRequest> {
    return defer(() => of(this.store.createRequest(command)));
  }

  update(
    id: string,
    request: PurchaseRequest,
    command: PurchaseRequestDetailsCommand,
  ): Observable<PurchaseRequest> {
    return defer(() => of(this.store.updateRequest(id, request, command)));
  }

  addLine(
    id: string,
    request: PurchaseRequest,
    lineCommand: { readonly catalogItemId: string; readonly quantity: number; readonly unit: string; readonly notes: string },
  ): Observable<PurchaseRequest> {
    return defer(() => of(this.store.addRequestLine(id, request, lineCommand)));
  }

  updateLine(
    id: string,
    request: PurchaseRequest,
    lineId: string,
    lineCommand: { readonly quantity: number; readonly notes: string },
  ): Observable<PurchaseRequest> {
    return defer(() => of(this.store.updateRequestLine(id, request, lineId, lineCommand)));
  }

  deleteLine(id: string, request: PurchaseRequest, lineId: string): Observable<PurchaseRequest> {
    return defer(() => of(this.store.deleteRequestLine(id, request, lineId)));
  }

  submit(request: PurchaseRequest, idempotencyKey: string): Observable<PurchaseRequest> {
    return defer(() => of(this.store.submitRequest(request, idempotencyKey)));
  }

  cancel(request: PurchaseRequest): Observable<PurchaseRequest> {
    return defer(() => of(this.store.cancelRequest(request)));
  }
}
