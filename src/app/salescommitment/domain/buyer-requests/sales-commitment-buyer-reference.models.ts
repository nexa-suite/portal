export interface SalesCommitmentBuyerAccountReference {
  readonly id: string;
  readonly businessName: string;
  readonly commercialName: string;
  readonly taxType: string;
  readonly taxValue: string;
  readonly segment: string;
  readonly paymentCondition: string;
}

export interface SalesCommitmentAddressReference {
  readonly id: string;
  readonly clientAccountId: string;
  readonly label: string;
  readonly addressType: string;
  readonly line: string;
  readonly reference: string;
  readonly countryCode: string;
  readonly departmentCode: string;
  readonly provinceCode: string;
  readonly districtCode: string;
  readonly defaultAddress: boolean;
  readonly active: boolean;
  readonly version: number;
  readonly etag: string;
  readonly recipientName?: string | null;
  readonly recipientPhone?: string | null;
  readonly roadType?: string | null;
  readonly streetName?: string | null;
  readonly streetNumber?: string | null;
  readonly interior?: string | null;
  readonly postalCode?: string | null;
  readonly receivingInstructions?: string | null;
  readonly receivingHours?: string | null;
  readonly latitude?: number | null;
  readonly longitude?: number | null;
  readonly placeId?: string | null;
  readonly source?: string | null;
}

export interface SalesCommitmentAddressInput {
  readonly label: string;
  readonly address: {
    readonly addressType: string;
    readonly line: string;
    readonly reference: string;
    readonly countryCode: 'PE';
    readonly departmentCode: string;
    readonly provinceCode: string;
    readonly districtCode: string;
    readonly recipientName?: string | null;
    readonly recipientPhone?: string | null;
    readonly roadType?: string | null;
    readonly streetName?: string | null;
    readonly streetNumber?: string | null;
    readonly interior?: string | null;
    readonly postalCode?: string | null;
    readonly receivingInstructions?: string | null;
    readonly receivingHours?: string | null;
    readonly latitude?: number | null;
    readonly longitude?: number | null;
    readonly placeId?: string | null;
    readonly source?: string | null;
  };
  readonly defaultAddress: boolean;
}

export type SalesCommitmentAddressUpdateInput = Omit<SalesCommitmentAddressInput, 'defaultAddress'>;

export interface SalesCommitmentReferenceOption {
  readonly id: number;
  readonly code: string;
  readonly label: string;
  readonly parentCode: string | null;
  readonly active: boolean;
}
