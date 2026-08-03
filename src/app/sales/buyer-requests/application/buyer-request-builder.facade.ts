import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, forkJoin, finalize, map, of, switchMap, tap, throwError } from 'rxjs';
import {
  BuyerRequestCommand,
  BuyerRequestSnapshot,
  BuyerRequestView,
  BuyerClientAccount,
  ClientAccountAddress,
  CreateClientAccountAddressInput,
  PeruReferenceOption,
  UpdateClientAccountAddressInput,
} from '../domain/buyer-request.models';
import { BuyerRequestApiClient } from '../infrastructure/buyer-request-api.client';

function errorCode(error: unknown, fallback: string): string {
  const status = (error as { readonly status?: unknown })?.status;
  return status === 409 ? 'BUYER_REQUEST_STALE' : fallback;
}

@Injectable({ providedIn: 'root' })
export class BuyerRequestBuilderFacade {
  private readonly api = inject(BuyerRequestApiClient);
  readonly addresses = signal<readonly ClientAccountAddress[]>([]);
  readonly clientAccount = signal<BuyerClientAccount | null>(null);
  readonly departments = signal<readonly PeruReferenceOption[]>([]);
  readonly provinces = signal<readonly PeruReferenceOption[]>([]);
  readonly districts = signal<readonly PeruReferenceOption[]>([]);
  readonly roadTypes = signal<readonly PeruReferenceOption[]>([]);
  readonly previewState = signal<{ readonly status: 'idle' | 'loading' | 'success' | 'error'; readonly snapshot: BuyerRequestSnapshot | null; readonly message: string | null }>({ status: 'idle', snapshot: null, message: null });
  readonly busy = signal(false);
  readonly message = signal<string | null>(null);

  loadInitial(clientAccountId: string | null): Observable<void> {
    const resolvedAccountId$ = clientAccountId
      ? of(clientAccountId)
      : this.api.clientAccount().pipe(tap((account) => this.clientAccount.set(account)), map((account) => account.id));
    return this.run(() => forkJoin({
      departments: this.api.reference('departments'),
      roadTypes: this.api.reference('road-types'),
      clientAccountId: resolvedAccountId$,
    }).pipe(
      switchMap(({ departments, roadTypes, clientAccountId: resolvedId }) => this.api.addresses(resolvedId).pipe(
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

  loadAddresses(clientAccountId: string): Observable<readonly ClientAccountAddress[]> {
    return this.run(() => this.api.addresses(clientAccountId), 'BUYER_ACCOUNT_ADDRESSES_LOAD_FAILED')
      .pipe(tap((items) => this.addresses.set(items)));
  }

  loadProvinces(parentCode: string): Observable<readonly PeruReferenceOption[]> {
    return this.run(() => this.api.reference('provinces', parentCode), 'BUYER_GEOGRAPHY_LOAD_FAILED')
      .pipe(tap((items) => this.provinces.set(items)));
  }

  loadDistricts(parentCode: string): Observable<readonly PeruReferenceOption[]> {
    return this.run(() => this.api.reference('districts', parentCode), 'BUYER_GEOGRAPHY_LOAD_FAILED')
      .pipe(tap((items) => this.districts.set(items)));
  }

  createAddress(clientAccountId: string, input: CreateClientAccountAddressInput): Observable<ClientAccountAddress> {
    return this.run(() => this.api.createAddress(clientAccountId, input), 'BUYER_ACCOUNT_ADDRESS_CREATE_FAILED')
      .pipe(tap((item) => this.addresses.update((items) => [...items, item])));
  }

  updateAddress(clientAccountId: string, addressId: string, input: UpdateClientAccountAddressInput, etag: string): Observable<ClientAccountAddress> {
    return this.run(() => this.api.updateAddress(clientAccountId, addressId, input, etag), 'BUYER_ACCOUNT_ADDRESS_UPDATE_FAILED')
      .pipe(tap((item) => this.addresses.update((items) => items.map((current) => current.id === item.id ? item : current))));
  }

  setDefaultAddress(clientAccountId: string, addressId: string, etag: string): Observable<ClientAccountAddress> {
    return this.run(() => this.api.setDefaultAddress(clientAccountId, addressId, etag), 'BUYER_ACCOUNT_ADDRESS_DEFAULT_FAILED')
      .pipe(tap((item) => this.addresses.update((items) => items.map((current) => ({ ...current, defaultAddress: current.id === item.id })) )));
  }

  deactivateAddress(clientAccountId: string, addressId: string, etag: string): Observable<ClientAccountAddress> {
    return this.run(() => this.api.deactivateAddress(clientAccountId, addressId, etag), 'BUYER_ACCOUNT_ADDRESS_DEACTIVATE_FAILED')
      .pipe(tap((item) => this.addresses.update((items) => items.map((current) => current.id === item.id ? item : current))));
  }

  preview(command: BuyerRequestCommand): Observable<BuyerRequestSnapshot | null> {
    this.previewState.set({ status: 'loading', snapshot: null, message: null });
    return this.run(() => this.api.preview(command), 'BUYER_REQUEST_PREVIEW_FAILED').pipe(
      tap((snapshot) => this.previewState.set({ status: 'success', snapshot, message: null })),
      catchError((error: unknown) => {
        this.previewState.set({ status: 'error', snapshot: null, message: errorCode(error, 'BUYER_REQUEST_PREVIEW_FAILED') });
        return throwError(() => error);
      }),
    );
  }

  create(command: BuyerRequestCommand): Observable<BuyerRequestView> {
    return this.run(() => this.api.create(command), 'BUYER_REQUEST_CREATE_FAILED');
  }

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
