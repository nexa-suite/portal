import { inject, Injectable } from '@angular/core';
import { defer, Observable, of, throwError } from 'rxjs';

import { PORTAL_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import { BuyerAccountApiPort } from '../../application/ports/buyer-account-api.port';
import type {
  BuyerClientAccount,
  ClientAccountAddress,
  CreateClientAccountAddressInput,
  PeruReferenceOption,
  UpdateClientAccountAddressInput,
} from '../../domain/buyer-account.models';
import type { BuyerAccountReferenceResource } from '../../application/buyer-account.port';
import { mockBuyerAccountFixture, MockBuyerAccountFixture } from './mock-buyer-account.fixtures';

@Injectable({ providedIn: 'root' })
export class MockBuyerAccountApiAdapter implements BuyerAccountApiPort {
  private readonly config = inject(PORTAL_RUNTIME_CONFIG);
  private readonly fixture: MockBuyerAccountFixture = mockBuyerAccountFixture(this.config.tenantProfile);
  private readonly addressState = new Map<string, ClientAccountAddress[]>();
  private nextAddressSequence = 2;

  constructor() {
    this.addressState.set(
      this.fixture.account.id,
      this.fixture.addresses.map((item) => ({ ...item })),
    );
  }

  clientAccount(): Observable<BuyerClientAccount> {
    return of(this.fixture.account);
  }

  reference(
    resource: BuyerAccountReferenceResource,
    parentCode?: string,
  ): Observable<readonly PeruReferenceOption[]> {
    const values = this.fixture.references[resource] ?? [];
    const result = resource === 'departments' || resource === 'road-types'
      ? values
      : values.filter((item) => item.parentCode === parentCode);
    return of(result.map((item) => ({ ...item })));
  }

  addresses(clientAccountId: string): Observable<readonly ClientAccountAddress[]> {
    return defer(() => of(this.addressesFor(clientAccountId).map((item) => ({ ...item }))));
  }

  createAddress(
    clientAccountId: string,
    input: CreateClientAccountAddressInput,
  ): Observable<ClientAccountAddress> {
    return defer(() => {
      const current = this.addressesFor(clientAccountId);
      const id = `address-${this.config.tenantProfile}-${String(this.nextAddressSequence++).padStart(3, '0')}`;
      const created: ClientAccountAddress = {
        ...input.address,
        id,
        clientAccountId,
        label: input.label.trim() || 'Nueva dirección',
        defaultAddress: input.defaultAddress,
        active: true,
        version: 1,
        etag: '"1"',
      };
      const next = input.defaultAddress
        ? current.map((item) => ({ ...item, defaultAddress: false }))
        : [...current];
      this.addressState.set(clientAccountId, [...next, created]);
      return of({ ...created });
    });
  }

  updateAddress(
    clientAccountId: string,
    addressId: string,
    input: UpdateClientAccountAddressInput,
    etag: string,
  ): Observable<ClientAccountAddress> {
    return defer(() => {
      const current = this.findAddress(clientAccountId, addressId);
      this.assertEtag(current, etag);
      const updated: ClientAccountAddress = {
        ...current,
        ...input.address,
        id: current.id,
        clientAccountId: current.clientAccountId,
        label: input.label.trim() || current.label,
        defaultAddress: current.defaultAddress,
        active: current.active,
        version: current.version + 1,
        etag: `"${current.version + 1}"`,
      };
      this.replaceAddress(clientAccountId, updated);
      return of({ ...updated });
    });
  }

  setDefaultAddress(
    clientAccountId: string,
    addressId: string,
    etag: string,
  ): Observable<ClientAccountAddress> {
    return defer(() => {
      const current = this.findAddress(clientAccountId, addressId);
      this.assertEtag(current, etag);
      const updated: ClientAccountAddress = {
        ...current,
        defaultAddress: true,
        version: current.version + 1,
        etag: `"${current.version + 1}"`,
      };
      this.addressState.set(
        clientAccountId,
        this.addressesFor(clientAccountId).map((item) => item.id === addressId
          ? updated
          : { ...item, defaultAddress: false }),
      );
      return of({ ...updated });
    });
  }

  deactivateAddress(
    clientAccountId: string,
    addressId: string,
    etag: string,
  ): Observable<ClientAccountAddress> {
    return defer(() => {
      const current = this.findAddress(clientAccountId, addressId);
      this.assertEtag(current, etag);
      const updated: ClientAccountAddress = {
        ...current,
        active: false,
        defaultAddress: false,
        version: current.version + 1,
        etag: `"${current.version + 1}"`,
      };
      this.replaceAddress(clientAccountId, updated);
      return of({ ...updated });
    });
  }

  private addressesFor(clientAccountId: string): ClientAccountAddress[] {
    const values = this.addressState.get(clientAccountId);
    if (!values) throw new Error(`Mock client account not found: ${clientAccountId}`);
    return values;
  }

  private findAddress(clientAccountId: string, addressId: string): ClientAccountAddress {
    const value = this.addressesFor(clientAccountId).find((item) => item.id === addressId);
    if (!value) throw new Error(`Mock address not found: ${addressId}`);
    return value;
  }

  private assertEtag(address: ClientAccountAddress, expected: string): void {
    if (address.etag !== expected) throw new MockBuyerAccountConcurrencyError();
  }

  private replaceAddress(clientAccountId: string, updated: ClientAccountAddress): void {
    this.addressState.set(
      clientAccountId,
      this.addressesFor(clientAccountId).map((item) => item.id === updated.id ? updated : item),
    );
  }
}

export class MockBuyerAccountConcurrencyError extends Error {
  readonly status = 409;
  readonly code = 'BUYER_ACCOUNT_STALE';

  constructor() {
    super('Mock Buyer Account address version is stale.');
    this.name = 'MockBuyerAccountConcurrencyError';
  }
}
