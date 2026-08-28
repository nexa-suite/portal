import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, defer, forkJoin, finalize, map, of, switchMap, tap, throwError } from 'rxjs';
import { isStaleApiProblem, readApiProblemDetails } from '../../../core/error/api-problem-details';
import {
  BuyerRequestCommand,
  BuyerRequestSnapshot,
  BuyerRequestView,
} from '../../domain/buyer-requests/buyer-request.models';
import { BuyerRelationshipPort } from '../ports/buyer-relationship.port';
import { SalesCommitmentAddressInput, SalesCommitmentAddressReference, SalesCommitmentAddressUpdateInput, SalesCommitmentBuyerAccountReference, SalesCommitmentReferenceOption } from '../../domain/buyer-requests/sales-commitment-buyer-reference.models';
import { PurchaseRequestDraftApiPort } from '../ports/purchase-request-draft-api.port';
import { PurchaseRequestDraftView } from '../../domain/buyer-requests/purchase-request-draft.models';

function errorCode(error: unknown, fallback: string): string {
  return isStaleApiProblem(error) ? 'BUYER_REQUEST_STALE' : readApiProblemDetails(error)?.code ?? fallback;
}

function object(value: unknown): Record<string, unknown> {
  if (typeof value === 'string') {
    try { return object(JSON.parse(value)); } catch { return {}; }
  }
  return value !== null && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function text(value: unknown): string { return typeof value === 'string' ? value : ''; }
function number(value: unknown): number { const result = typeof value === 'number' ? value : Number(value); return Number.isFinite(result) ? result : 0; }

@Injectable({ providedIn: 'root' })
export class PurchaseRequestBuilderFacade {
  private readonly buyer = inject(BuyerRelationshipPort);
  private readonly canonical = inject(PurchaseRequestDraftApiPort);
  private readonly canonicalDraft = signal<PurchaseRequestDraftView | null>(null);
  private canonicalCommandSignature: string | null = null;
  private canonicalIdempotencyKey: string | null = null;
  readonly addresses = signal<readonly SalesCommitmentAddressReference[]>([]);
  readonly clientAccount = signal<SalesCommitmentBuyerAccountReference | null>(null);
  readonly departments = signal<readonly SalesCommitmentReferenceOption[]>([]);
  readonly provinces = signal<readonly SalesCommitmentReferenceOption[]>([]);
  readonly districts = signal<readonly SalesCommitmentReferenceOption[]>([]);
  readonly roadTypes = signal<readonly SalesCommitmentReferenceOption[]>([]);
  readonly previewState = signal<{ readonly status: 'idle' | 'loading' | 'success' | 'error'; readonly snapshot: BuyerRequestSnapshot | null; readonly message: string | null }>({ status: 'idle', snapshot: null, message: null });
  readonly busy = signal(false);
  readonly message = signal<string | null>(null);
  private editingDraftId: string | null = null;

  loadInitial(clientAccountId: string | null): Observable<void> {
    const resolvedAccountId$ = this.buyer.clientAccount().pipe(
      tap((account) => this.clientAccount.set(account)),
      map((account) => account.id || clientAccountId || ''),
    );
    return this.run(() => forkJoin({
      departments: this.buyer.reference('departments'),
      roadTypes: this.buyer.reference('road-types'),
      clientAccountId: resolvedAccountId$,
    }).pipe(
      switchMap(({ departments, roadTypes, clientAccountId: resolvedId }) => this.buyer.addresses(resolvedId).pipe(
        map((addresses) => ({ departments, roadTypes, addresses })),
      )),
      tap(({ departments, roadTypes, addresses }) => {
        this.departments.set(departments);
        this.roadTypes.set(roadTypes);
        this.addresses.set(addresses);
      }),
      map(() => undefined),
    ), 'BUYER_REQUEST_BUILDER_LOAD_FAILED');
  }

  loadDraft(draftId: string): Observable<PurchaseRequestDraftView> {
    return this.run(() => this.canonical.get(draftId), 'BUYER_REQUEST_DRAFT_LOAD_FAILED').pipe(
      tap((draft) => {
        this.canonicalDraft.set(draft);
        this.editingDraftId = draft.id;
        this.canonicalCommandSignature = null;
        this.canonicalIdempotencyKey = null;
      }),
    );
  }

  loadAddresses(clientAccountId: string): Observable<readonly SalesCommitmentAddressReference[]> {
    return this.run(() => this.buyer.addresses(clientAccountId), 'BUYER_ACCOUNT_ADDRESSES_LOAD_FAILED')
      .pipe(tap((items) => this.addresses.set(items)));
  }

  loadProvinces(parentCode: string): Observable<readonly SalesCommitmentReferenceOption[]> {
    return this.run(() => this.buyer.reference('provinces', parentCode), 'BUYER_GEOGRAPHY_LOAD_FAILED')
      .pipe(tap((items) => this.provinces.set(items)));
  }

  loadDistricts(parentCode: string): Observable<readonly SalesCommitmentReferenceOption[]> {
    return this.run(() => this.buyer.reference('districts', parentCode), 'BUYER_GEOGRAPHY_LOAD_FAILED')
      .pipe(tap((items) => this.districts.set(items)));
  }

  createAddress(clientAccountId: string, input: SalesCommitmentAddressInput): Observable<SalesCommitmentAddressReference> {
    return this.run(() => this.buyer.createAddress(clientAccountId, input), 'BUYER_ACCOUNT_ADDRESS_CREATE_FAILED')
      .pipe(tap((item) => this.addresses.update((items) => [...items, item])));
  }

  updateAddress(clientAccountId: string, addressId: string, input: SalesCommitmentAddressUpdateInput, etag: string): Observable<SalesCommitmentAddressReference> {
    return this.run(() => this.buyer.updateAddress(clientAccountId, addressId, input, etag), 'BUYER_ACCOUNT_ADDRESS_UPDATE_FAILED')
      .pipe(tap((item) => this.addresses.update((items) => items.map((current) => current.id === item.id ? item : current))));
  }

  setDefaultAddress(clientAccountId: string, addressId: string, etag: string): Observable<SalesCommitmentAddressReference> {
    return this.run(() => this.buyer.setDefaultAddress(clientAccountId, addressId, etag), 'BUYER_ACCOUNT_ADDRESS_DEFAULT_FAILED')
      .pipe(tap((item) => this.addresses.update((items) => items.map((current) => ({ ...current, defaultAddress: current.id === item.id })) )));
  }

  deactivateAddress(clientAccountId: string, addressId: string, etag: string): Observable<SalesCommitmentAddressReference> {
    return this.run(() => this.buyer.deactivateAddress(clientAccountId, addressId, etag), 'BUYER_ACCOUNT_ADDRESS_DEACTIVATE_FAILED')
      .pipe(tap((item) => this.addresses.update((items) => items.map((current) => current.id === item.id ? item : current))));
  }

  preview(command: BuyerRequestCommand): Observable<BuyerRequestSnapshot | null> {
    this.previewState.set({ status: 'loading', snapshot: null, message: null });
    return this.run(() => this.prepareCanonical(command).pipe(map((draft) => this.snapshotFromDraft(draft, command))), 'BUYER_REQUEST_PREVIEW_FAILED').pipe(
      tap((snapshot) => this.previewState.set({ status: 'success', snapshot, message: null })),
      catchError((error: unknown) => {
        this.previewState.set({ status: 'error', snapshot: null, message: errorCode(error, 'BUYER_REQUEST_PREVIEW_FAILED') });
        return throwError(() => error);
      }),
    );
  }

  create(command: BuyerRequestCommand): Observable<BuyerRequestView> {
    return this.run(() => {
      const signature = this.commandSignature(command);
      const prepared = this.canonicalDraft() && this.canonicalCommandSignature === signature
        ? of(this.canonicalDraft() as PurchaseRequestDraftView)
        : this.prepareCanonical(command);
      return prepared.pipe(
        switchMap((draft) => this.canonical.submit(draft.id, draft.etag, this.canonicalIdempotencyKey ?? this.newIdempotencyKey())),
        tap((draft) => { this.canonicalDraft.set(draft); this.canonicalCommandSignature = signature; }),
        map((draft) => this.requestFromDraft(draft, command)),
      );
    }, 'BUYER_REQUEST_CREATE_FAILED');
  }

  private prepareCanonical(command: BuyerRequestCommand): Observable<PurchaseRequestDraftView> {
    return defer(() => {
      if (!command.clientAccountId || !command.requestedDeliveryDate || command.lines.length === 0) throw new Error('Canonical purchase request draft input is incomplete');
      const lines = command.lines.map((line) => ({ skuId: line.skuId?.trim() || line.catalogItemId.trim(), quantity: line.quantity, unit: line.unit, notes: line.notes }));
      if (lines.some((line) => !line.skuId)) throw new Error('Canonical purchase request draft requires SKU ids');
      const existing = this.canonicalDraft();
      if (existing && this.editingDraftId === existing.id) {
        return this.resolveDestination(command).pipe(
          switchMap((addressId) => this.canonical.replaceLines(existing.id, existing.etag, lines).pipe(map((draft) => ({ draft, addressId })))),
          switchMap(({ draft, addressId }) => this.canonical.setDestination(draft.id, draft.etag, addressId)),
          switchMap((draft) => this.canonical.previewRoute(draft.id, draft.etag)),
          switchMap((draft) => this.canonical.setPreferences(draft.id, draft.etag, command.paymentOption, command.requestedDeliveryDate)),
        );
      }
      return this.resolveDestination(command).pipe(
        switchMap((addressId) => this.canonical.create(command.clientAccountId as string, command.requestedDeliveryDate).pipe(
          switchMap((draft) => this.canonical.replaceLines(draft.id, draft.etag, lines)),
          switchMap((draft) => this.canonical.setDestination(draft.id, draft.etag, addressId)),
          switchMap((draft) => this.canonical.previewRoute(draft.id, draft.etag)),
          switchMap((draft) => this.canonical.setPreferences(draft.id, draft.etag, command.paymentOption, command.requestedDeliveryDate)),
        )),
      );
    }).pipe(
      tap((draft) => {
        this.canonicalDraft.set(draft);
        this.canonicalCommandSignature = this.commandSignature(command);
        this.canonicalIdempotencyKey = this.canonicalIdempotencyKey ?? this.newIdempotencyKey();
      }),
    );
  }

  private resolveDestination(command: BuyerRequestCommand): Observable<string> {
    if (command.addressId) return of(command.addressId);
    if (!command.clientAccountId || !command.manualAddress) return throwError(() => new Error('Canonical purchase request draft requires a saved destination'));
    const input: SalesCommitmentAddressInput = { label: 'Purchase request destination', address: command.manualAddress, defaultAddress: false };
    return this.buyer.createAddress(command.clientAccountId, input).pipe(
      tap((address) => this.addresses.update((items) => [...items, address])),
      map((address) => address.id),
    );
  }

  private snapshotFromDraft(draft: PurchaseRequestDraftView, command: BuyerRequestCommand): BuyerRequestSnapshot {
    const destination = object(draft.destination?.['snapshot']);
    const route = object(draft.route?.['snapshot']);
    const street = [text(destination['roadType']), text(destination['street']), text(destination['number']), text(destination['interior'])].filter(Boolean).join(' ');
    return {
      delivery: {
        requestedDate: draft.requestedDeliveryDate,
        notes: command.deliveryNotes,
        address: street ? {
          id: text(destination['addressId']) || null,
          label: null,
          addressType: text(destination['roadType']) || null,
          line: street,
          reference: text(destination['reference']) || null,
          countryCode: text(destination['countryCode']) || 'PE',
          departmentCode: text(destination['department']) || '',
          provinceCode: text(destination['province']) || '',
          districtCode: text(destination['district']) || '',
          defaultAddress: false,
        } : null,
        route: Object.keys(route).length > 0 ? {
          provider: text(route['provider']) || draft.routeProvider,
          reference: text(route['reference']) || null,
          destinationLabel: text(route['destinationLabel']) || null,
          distanceMeters: number(route['distanceMeters']) || number(route['distanceKm']) * 1000,
          durationSeconds: number(route['durationSeconds']),
          previewUrl: text(route['previewUrl']) || null,
          destinationLatitude: route['destinationLatitude'] == null ? null : number(route['destinationLatitude']),
          destinationLongitude: route['destinationLongitude'] == null ? null : number(route['destinationLongitude']),
          calculatedAt: text(route['calculatedAt']) || text(draft.route?.['calculatedAt']) || null,
          mode: text(route['mode']) || null,
          path: text(route['path']) || null,
        } : null,
      },
      commercial: this.clientAccount() ? {
        clientAccountId: this.clientAccount()?.id ?? null,
        businessName: this.clientAccount()?.businessName ?? null,
        commercialName: this.clientAccount()?.commercialName ?? null,
        taxType: this.clientAccount()?.taxType ?? null,
        taxValue: this.clientAccount()?.taxValue ?? null,
        segment: this.clientAccount()?.segment ?? null,
        paymentCondition: this.clientAccount()?.paymentCondition ?? null,
      } : null,
      paymentOption: command.paymentOption,
      comments: command.comments,
      capturedAt: draft.updatedAt,
    };
  }

  private requestFromDraft(draft: PurchaseRequestDraftView, command: BuyerRequestCommand): BuyerRequestView {
    return {
      id: draft.id,
      code: `PR-${draft.id.slice(0, 8).toUpperCase()}`,
      tenantId: null,
      workspaceId: null,
      clientAccountId: draft.clientAccountId,
      buyerMembershipId: draft.buyerMembershipId,
      status: draft.status,
      snapshot: this.snapshotFromDraft(draft, command),
      lines: draft.lines.map((item) => ({
        id: text(item['id']),
        catalogItemId: text(item['skuCode']) || text(item['skuId']),
        skuId: text(item['skuId']),
        itemName: text(item['presentation']),
        presentation: text(item['presentation']),
        quantity: number(item['quantity']),
        unit: text(item['unit']) || 'unit',
        notes: text(item['notes']),
        unitPriceAmount: number(item['effectiveUnitPrice']),
        unitPriceCurrency: text(item['currency']) || null,
      })),
      version: draft.version,
    };
  }

  private commandSignature(command: BuyerRequestCommand): string { return JSON.stringify(command); }
  private newIdempotencyKey(): string { return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `buyer-request-${Date.now()}-${Math.random().toString(16).slice(2)}`; }

  private run<T>(factory: () => Observable<T>, fallback: string): Observable<T> {
    this.busy.set(true);
    this.message.set(null);
    return factory().pipe(
      catchError((error: unknown) => {
        this.message.set(errorCode(error, fallback));
        return throwError(() => error);
      }),
      finalize(() => this.busy.set(false)),
    );
  }

}

/** @deprecated Use PurchaseRequestBuilderFacade. Kept as a compatibility alias for existing consumers. */
@Injectable({ providedIn: 'root' })
export class BuyerRequestBuilderFacade extends PurchaseRequestBuilderFacade {}
