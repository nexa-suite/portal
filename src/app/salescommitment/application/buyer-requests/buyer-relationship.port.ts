import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  SalesCommitmentAddressInput,
  SalesCommitmentAddressReference,
  SalesCommitmentAddressUpdateInput,
  SalesCommitmentBuyerAccountReference,
  SalesCommitmentReferenceOption,
} from '../../domain/buyer-requests/sales-commitment-buyer-reference.models';

export type BuyerRelationshipReferenceResource = 'departments' | 'provinces' | 'districts' | 'road-types';

export interface BuyerRelationshipPort {
  clientAccount(): Observable<SalesCommitmentBuyerAccountReference>;
  reference(resource: BuyerRelationshipReferenceResource, parentCode?: string): Observable<readonly SalesCommitmentReferenceOption[]>;
  addresses(clientAccountId: string): Observable<readonly SalesCommitmentAddressReference[]>;
  createAddress(clientAccountId: string, input: SalesCommitmentAddressInput): Observable<SalesCommitmentAddressReference>;
  updateAddress(clientAccountId: string, addressId: string, input: SalesCommitmentAddressUpdateInput, etag: string): Observable<SalesCommitmentAddressReference>;
  setDefaultAddress(clientAccountId: string, addressId: string, etag: string): Observable<SalesCommitmentAddressReference>;
  deactivateAddress(clientAccountId: string, addressId: string, etag: string): Observable<SalesCommitmentAddressReference>;
}

export const BUYER_RELATIONSHIP_PORT = new InjectionToken<BuyerRelationshipPort>('BUYER_RELATIONSHIP_PORT');
