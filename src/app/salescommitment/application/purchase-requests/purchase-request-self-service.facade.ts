import { Injectable, inject, signal } from '@angular/core';
import { PurchaseRequestLiveRefreshService } from '../../../core/change-feed/application/purchase-request-live-refresh.service';
import { PurchaseRequestApiPort } from '../ports/purchase-request-api.port';
import {
  DEFAULT_PURCHASE_REQUEST_DETAILS,
  PurchaseRequest,
  PurchaseRequestDetailsCommand,
  PurchaseRequestDraftCommand,
  PurchaseRequestPage,
  canCancelPurchaseRequest,
} from '../../domain/purchase-requests/purchase-request.models';

type RequestState = 'idle' | 'loading' | 'success' | 'empty' | 'error';

function messageFor(error: unknown, fallback: string): string {
  return (error as { status?: unknown })?.status === 409 ? 'PURCHASE_REQUEST_STALE_RELOAD' : fallback;
}

@Injectable({ providedIn: 'root' })
export class PurchaseRequestSelfServiceFacade {
  private readonly api = inject(PurchaseRequestApiPort);
  private readonly liveRefresh = inject(PurchaseRequestLiveRefreshService);

  readonly listState = signal<{ readonly status: RequestState; readonly page: PurchaseRequestPage | null; readonly message: string | null }>({
    status: 'idle', page: null, message: null,
  });
  readonly detailState = signal<{ readonly status: Exclude<RequestState, 'empty'>; readonly item: PurchaseRequest | null; readonly message: string | null }>({
    status: 'idle', item: null, message: null,
  });

  constructor() {
    this.liveRefresh.watch((purchaseRequestId) => {
      const current = this.detailState().item;
      if (current?.id === purchaseRequestId) this.loadDetail(purchaseRequestId);
      else this.loadList();
    });
  }

  loadList(status = ''): void {
    this.listState.update((state) => ({ ...state, status: 'loading', message: null }));
    this.api.list(status).subscribe({
      next: (page) => this.listState.set({ status: page.items.length ? 'success' : 'empty', page, message: null }),
      error: () => this.listState.update((state) => ({ ...state, status: 'error', message: 'PURCHASE_REQUESTS_LOAD_FAILED' })),
    });
  }

  loadDetail(id: string): void {
    this.detailState.set({ status: 'loading', item: null, message: null });
    this.api.get(id).subscribe({
      next: (item) => this.detailState.set({ status: 'success', item, message: null }),
      error: (error: unknown) => this.detailState.set({ status: 'error', item: null, message: messageFor(error, 'PURCHASE_REQUEST_LOAD_FAILED') }),
    });
  }

  loadOrCreateDraft(id?: string | null): void {
    if (id) {
      this.loadDetail(id);
      return;
    }
    this.api.list('DRAFT').subscribe({
      next: (page) => {
        const draft = page.items.find((item) => item.status === 'DRAFT');
        if (draft) this.loadDetail(draft.id);
        else this.create(this.emptyDraft(), (item) => this.detailState.set({ status: 'success', item, message: null }));
      },
      error: () => this.detailState.set({ status: 'error', item: null, message: 'PURCHASE_REQUEST_DRAFT_LOAD_FAILED' }),
    });
  }

  emptyDraft(): PurchaseRequestDraftCommand {
    return { ...DEFAULT_PURCHASE_REQUEST_DETAILS, lines: [] };
  }

  create(command: PurchaseRequestDraftCommand, done: (item: PurchaseRequest) => void): void {
    this.api.create(command).subscribe({
      next: done,
      error: (error: unknown) => this.detailState.set({ status: 'error', item: null, message: messageFor(error, 'PURCHASE_REQUEST_CREATE_FAILED') }),
    });
  }

  save(request: PurchaseRequest, command: PurchaseRequestDetailsCommand, done?: (item: PurchaseRequest) => void): void {
    this.api.update(request.id, request, command).subscribe({
      next: (item) => { this.detailState.set({ status: 'success', item, message: null }); done?.(item); },
      error: (error: unknown) => this.detailState.update((state) => ({ ...state, message: messageFor(error, 'PURCHASE_REQUEST_SAVE_FAILED') })),
    });
  }

  addLine(request: PurchaseRequest, line: PurchaseRequestDraftCommand['lines'][number]): void {
    this.api.addLine(request.id, request, line).subscribe({
      next: (item) => this.detailState.set({ status: 'success', item, message: null }),
      error: (error: unknown) => this.detailState.update((state) => ({ ...state, message: messageFor(error, 'PURCHASE_REQUEST_LINE_ADD_FAILED') })),
    });
  }

  updateLine(request: PurchaseRequest, lineId: string, quantity: number, notes: string): void {
    this.api.updateLine(request.id, request, lineId, { quantity, notes }).subscribe({
      next: (item) => this.detailState.set({ status: 'success', item, message: null }),
      error: (error: unknown) => this.detailState.update((state) => ({ ...state, message: messageFor(error, 'PURCHASE_REQUEST_LINE_UPDATE_FAILED') })),
    });
  }

  deleteLine(request: PurchaseRequest, lineId: string): void {
    this.api.deleteLine(request.id, request, lineId).subscribe({
      next: (item) => this.detailState.set({ status: 'success', item, message: null }),
      error: (error: unknown) => this.detailState.update((state) => ({ ...state, message: messageFor(error, 'PURCHASE_REQUEST_LINE_DELETE_FAILED') })),
    });
  }

  submit(request: PurchaseRequest, done?: (item: PurchaseRequest) => void): void {
    this.api.submit(request, `portal-${request.id}-${request.version}`).subscribe({
      next: (item) => { this.detailState.set({ status: 'success', item, message: null }); done?.(item); },
      error: (error: unknown) => this.detailState.update((state) => ({ ...state, message: messageFor(error, 'PURCHASE_REQUEST_SUBMIT_FAILED') })),
    });
  }

  cancel(request: PurchaseRequest, done?: (item: PurchaseRequest) => void): void {
    if (!canCancelPurchaseRequest(request.status)) return;
    this.api.cancel(request).subscribe({
      next: (item) => { this.detailState.set({ status: 'success', item, message: null }); done?.(item); },
      error: (error: unknown) => this.detailState.update((state) => ({ ...state, message: messageFor(error, 'PURCHASE_REQUEST_CANCEL_FAILED') })),
    });
  }

  retryList(): void { this.loadList(); }
  reloadCurrent(): void { const id = this.detailState().item?.id; if (id) this.loadDetail(id); }
}
