import { Observable } from 'rxjs';
import {
  BuyerClientAccount,
  ClientAccountAddress,
  CreateClientAccountAddressInput,
  PeruReferenceOption,
  UpdateClientAccountAddressInput,
} from '../../domain/buyer-account.models';

/** Application port for the buyer-safe Customer & Buyer Relationships contract. */
export abstract class BuyerAccountApiPort {
  abstract clientAccount(): Observable<BuyerClientAccount>;
  abstract reference(resource: 'departments' | 'provinces' | 'districts' | 'road-types', parentCode?: string): Observable<readonly PeruReferenceOption[]>;
  abstract addresses(clientAccountId: string): Observable<readonly ClientAccountAddress[]>;
  abstract createAddress(clientAccountId: string, input: CreateClientAccountAddressInput): Observable<ClientAccountAddress>;
  abstract updateAddress(clientAccountId: string, addressId: string, input: UpdateClientAccountAddressInput, etag: string): Observable<ClientAccountAddress>;
  abstract setDefaultAddress(clientAccountId: string, addressId: string, etag: string): Observable<ClientAccountAddress>;
  abstract deactivateAddress(clientAccountId: string, addressId: string, etag: string): Observable<ClientAccountAddress>;
}
