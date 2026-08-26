import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  BuyerClientAccount,
  ClientAccountAddress,
  CreateClientAccountAddressInput,
  PeruReferenceOption,
  UpdateClientAccountAddressInput,
} from '../domain/buyer-account.models';

export type BuyerAccountReferenceResource = 'departments' | 'provinces' | 'districts' | 'road-types';

export interface BuyerAccountPort {
  clientAccount(): Observable<BuyerClientAccount>;
  reference(resource: BuyerAccountReferenceResource, parentCode?: string): Observable<readonly PeruReferenceOption[]>;
  addresses(clientAccountId: string): Observable<readonly ClientAccountAddress[]>;
  createAddress(clientAccountId: string, input: CreateClientAccountAddressInput): Observable<ClientAccountAddress>;
  updateAddress(clientAccountId: string, addressId: string, input: UpdateClientAccountAddressInput, etag: string): Observable<ClientAccountAddress>;
  setDefaultAddress(clientAccountId: string, addressId: string, etag: string): Observable<ClientAccountAddress>;
  deactivateAddress(clientAccountId: string, addressId: string, etag: string): Observable<ClientAccountAddress>;
}

export const BUYER_ACCOUNT_PORT = new InjectionToken<BuyerAccountPort>('BUYER_ACCOUNT_PORT');
