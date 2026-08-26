import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BuyerAccountApiPort } from '../../../customerbuyerrelationships/application/ports/buyer-account-api.port';
import { BuyerRelationshipPort } from '../../application/ports/buyer-relationship.port';
import {
  SalesCommitmentAddressInput,
  SalesCommitmentAddressUpdateInput,
  SalesCommitmentAddressReference,
  SalesCommitmentBuyerAccountReference,
  SalesCommitmentReferenceOption,
} from '../../domain/buyer-requests/sales-commitment-buyer-reference.models';

/** ACL from Customer & Buyer Relationships into Sales Commitment. */
@Injectable({ providedIn: 'root' })
export class BuyerRelationshipGateway implements BuyerRelationshipPort {
  private readonly account = inject(BuyerAccountApiPort);

  clientAccount(): Observable<SalesCommitmentBuyerAccountReference> {
    return this.account.clientAccount().pipe(map((value) => ({
      id: value.id,
      businessName: value.businessName,
      commercialName: value.commercialName,
      taxType: value.taxType,
      taxValue: value.taxValue,
      segment: value.segment,
      paymentCondition: value.paymentCondition,
    })));
  }

  reference(resource: 'departments' | 'provinces' | 'districts' | 'road-types', parentCode?: string): Observable<readonly SalesCommitmentReferenceOption[]> {
    return this.account.reference(resource, parentCode).pipe(map((items) => items.map((item) => ({ ...item }))));
  }

  addresses(clientAccountId: string): Observable<readonly SalesCommitmentAddressReference[]> {
    return this.account.addresses(clientAccountId).pipe(map((items) => items.map((item) => this.address(item))));
  }

  createAddress(clientAccountId: string, input: SalesCommitmentAddressInput): Observable<SalesCommitmentAddressReference> {
    return this.account.createAddress(clientAccountId, input).pipe(map((item) => this.address(item)));
  }

  updateAddress(clientAccountId: string, addressId: string, input: SalesCommitmentAddressUpdateInput, etag: string): Observable<SalesCommitmentAddressReference> {
    return this.account.updateAddress(clientAccountId, addressId, input, etag).pipe(map((item) => this.address(item)));
  }

  setDefaultAddress(clientAccountId: string, addressId: string, etag: string): Observable<SalesCommitmentAddressReference> {
    return this.account.setDefaultAddress(clientAccountId, addressId, etag).pipe(map((item) => this.address(item)));
  }

  deactivateAddress(clientAccountId: string, addressId: string, etag: string): Observable<SalesCommitmentAddressReference> {
    return this.account.deactivateAddress(clientAccountId, addressId, etag).pipe(map((item) => this.address(item)));
  }

  private address(value: {
    readonly id: string; readonly clientAccountId: string; readonly label: string; readonly addressType: string;
    readonly line: string; readonly reference: string; readonly countryCode: string; readonly departmentCode: string;
    readonly provinceCode: string; readonly districtCode: string; readonly defaultAddress: boolean; readonly active: boolean;
    readonly version: number; readonly etag: string; readonly recipientName?: string | null; readonly recipientPhone?: string | null;
    readonly roadType?: string | null; readonly streetName?: string | null; readonly streetNumber?: string | null;
    readonly interior?: string | null; readonly postalCode?: string | null; readonly receivingInstructions?: string | null;
    readonly receivingHours?: string | null; readonly latitude?: number | null; readonly longitude?: number | null;
    readonly placeId?: string | null; readonly source?: string | null;
  }): SalesCommitmentAddressReference {
    return { ...value };
  }
}
