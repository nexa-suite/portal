export interface PeruReferenceOption {
  readonly id: number;
  readonly code: string;
  readonly label: string;
  readonly parentCode: string | null;
  readonly active: boolean;
}

export interface DeliveryAddressInput {
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
}

export interface ClientAccountAddress extends DeliveryAddressInput {
  readonly id: string;
  readonly clientAccountId: string;
  readonly label: string;
  readonly defaultAddress: boolean;
  readonly active: boolean;
  readonly version: number;
  readonly etag: string;
}

export interface BuyerClientAccount {
  readonly id: string;
  readonly code: string;
  readonly businessName: string;
  readonly commercialName: string;
  readonly countryCode: string;
  readonly taxType: string;
  readonly taxValue: string;
  readonly segment: string;
  readonly contactPerson: string;
  readonly contactEmail: string;
  readonly phone: string;
  readonly deliveryProfile: string;
  readonly paymentCondition: string;
  readonly status: string;
  readonly buyerMembershipId: string | null;
  readonly version: number;
}

export interface CreateClientAccountAddressInput {
  readonly label: string;
  readonly address: DeliveryAddressInput;
  readonly defaultAddress: boolean;
}

export interface UpdateClientAccountAddressInput {
  readonly label: string;
  readonly address: DeliveryAddressInput;
}

export function addressDisplay(
  address: Pick<DeliveryAddressInput, 'line' | 'reference' | 'departmentCode' | 'provinceCode' | 'districtCode'>,
  labelFor: (code: string) => string = (code) => code,
): string {
  return [
    address.line,
    address.reference,
    labelFor(address.districtCode),
    labelFor(address.provinceCode),
    labelFor(address.departmentCode),
  ].filter((value) => value.trim().length > 0).join(', ');
}

export function directionsUrl(origin: string, destination: string): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
}
