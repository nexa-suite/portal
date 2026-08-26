import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, defer, forkJoin, finalize, map, of, switchMap, tap, throwError } from 'rxjs';
import {
  BuyerClientAccount,
  ClientAccountAddress,
  CreateClientAccountAddressInput,
  PeruReferenceOption,
  UpdateClientAccountAddressInput,
} from '../domain/buyer-account.models';
import { BuyerAccountApiPort } from './ports/buyer-account-api.port';

@Injectable({ providedIn: 'root' })
export class BuyerAccountFacade {
  private readonly api = inject(BuyerAccountApiPort);
  readonly addresses = signal<readonly ClientAccountAddress[]>([]);
  readonly clientAccount = signal<BuyerClientAccount | null>(null);
  readonly departments = signal<readonly PeruReferenceOption[]>([]);
  readonly provinces = signal<readonly PeruReferenceOption[]>([]);
  readonly districts = signal<readonly PeruReferenceOption[]>([]);
  readonly roadTypes = signal<readonly PeruReferenceOption[]>([]);
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
    ), 'BUYER_ACCOUNT_LOAD_FAILED');
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

  private run<T>(factory: () => Observable<T>, fallback: string): Observable<T> {
    this.busy.set(true);
    this.message.set(null);
    return defer(factory).pipe(
      catchError((error: unknown) => { this.message.set(fallback); return throwError(() => error); }),
      finalize(() => this.busy.set(false)),
    );
  }
}
