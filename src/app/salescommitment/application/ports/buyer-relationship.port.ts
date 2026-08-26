import { Observable } from 'rxjs';
import {
  SalesCommitmentAddressInput,
  SalesCommitmentAddressReference,
  SalesCommitmentAddressUpdateInput,
  SalesCommitmentBuyerAccountReference,
  SalesCommitmentReferenceOption,
} from '../../domain/buyer-requests/sales-commitment-buyer-reference.models';

/** Anti-corruption port from Customer & Buyer Relationships into Sales Commitment. */
export abstract class BuyerRelationshipPort {
  abstract clientAccount(): Observable<SalesCommitmentBuyerAccountReference>;
  abstract reference(resource: 'departments' | 'provinces' | 'districts' | 'road-types', parentCode?: string): Observable<readonly SalesCommitmentReferenceOption[]>;
  abstract addresses(clientAccountId: string): Observable<readonly SalesCommitmentAddressReference[]>;
  abstract createAddress(clientAccountId: string, input: SalesCommitmentAddressInput): Observable<SalesCommitmentAddressReference>;
  abstract updateAddress(clientAccountId: string, addressId: string, input: SalesCommitmentAddressUpdateInput, etag: string): Observable<SalesCommitmentAddressReference>;
  abstract setDefaultAddress(clientAccountId: string, addressId: string, etag: string): Observable<SalesCommitmentAddressReference>;
  abstract deactivateAddress(clientAccountId: string, addressId: string, etag: string): Observable<SalesCommitmentAddressReference>;
}
