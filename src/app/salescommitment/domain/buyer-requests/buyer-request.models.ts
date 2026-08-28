export type BuyerPaymentOption =
  | 'CREDIT_LINE'
  | 'BANK_TRANSFER'
  | 'CARD_STRIPE'
  | 'CASH'
  | 'CASH_ON_DELIVERY';

export interface BuyerRequestDeliveryAddress {
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

export interface BuyerRequestLineInput {
  readonly catalogItemId: string;
  readonly skuId?: string;
  readonly quantity: number;
  readonly unit: string;
  readonly notes: string;
}

export interface BuyerRequestCommand {
  readonly clientAccountId: string | null;
  readonly addressId: string | null;
  readonly manualAddress: BuyerRequestDeliveryAddress | null;
  readonly requestedDeliveryDate: string;
  readonly deliveryNotes: string;
  readonly paymentOption: BuyerPaymentOption;
  readonly comments: string;
  readonly lines: readonly BuyerRequestLineInput[];
}

export interface BuyerRequestAddressSnapshot {
  readonly id: string | null;
  readonly label: string | null;
  readonly addressType: string | null;
  readonly line: string;
  readonly reference: string | null;
  readonly countryCode: string;
  readonly departmentCode: string;
  readonly provinceCode: string;
  readonly districtCode: string;
  readonly defaultAddress: boolean;
}

export interface BuyerRequestRouteSnapshot {
  readonly provider: string | null;
  readonly reference: string | null;
  readonly destinationLabel: string | null;
  readonly distanceMeters: number | null;
  readonly durationSeconds: number | null;
  readonly previewUrl: string | null;
  readonly destinationLatitude?: number | null;
  readonly destinationLongitude?: number | null;
  readonly calculatedAt?: string | null;
  readonly mode?: string | null;
  readonly path?: string | null;
}

export interface BuyerRequestDeliverySnapshot {
  readonly requestedDate: string | null;
  readonly notes: string | null;
  readonly address: BuyerRequestAddressSnapshot | null;
  readonly route: BuyerRequestRouteSnapshot | null;
}

export interface BuyerRequestCommercialSnapshot {
  readonly clientAccountId: string | null;
  readonly businessName: string | null;
  readonly commercialName: string | null;
  readonly taxType: string | null;
  readonly taxValue: string | null;
  readonly segment: string | null;
  readonly paymentCondition: string | null;
}

export interface BuyerRequestSnapshot {
  readonly delivery: BuyerRequestDeliverySnapshot | null;
  readonly commercial: BuyerRequestCommercialSnapshot | null;
  readonly paymentOption: string | null;
  readonly comments: string | null;
  readonly capturedAt: string | null;
}

export interface BuyerRequestLineView extends BuyerRequestLineInput {
  readonly id: string;
  readonly itemName: string;
  readonly presentation: string;
  readonly unitPriceAmount: number | null;
  readonly unitPriceCurrency: string | null;
}

export interface BuyerRequestView {
  readonly id: string;
  readonly code: string;
  readonly tenantId: string | null;
  readonly workspaceId: string | null;
  readonly clientAccountId: string | null;
  readonly buyerMembershipId: string | null;
  readonly status: string;
  readonly snapshot: BuyerRequestSnapshot | null;
  readonly lines: readonly BuyerRequestLineView[];
  readonly version: number;
}

export function todayInputValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export type DeliveryDateIssue = 'required' | 'minimum' | 'weekday' | null;

export function nextBusinessDateInputValue(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  while ([0, 6].includes(date.getDay())) date.setDate(date.getDate() + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function deliveryDateIssue(value: string, minimum: string): DeliveryDateIssue {
  if (!value) return 'required';
  const selected = new Date(`${value}T00:00:00`);
  const minimumDate = new Date(`${minimum}T00:00:00`);
  if (Number.isNaN(selected.getTime()) || selected < minimumDate) return 'minimum';
  return [0, 6].includes(selected.getDay()) ? 'weekday' : null;
}

export function addressDisplay(
  address: Pick<BuyerRequestDeliveryAddress, 'line' | 'reference' | 'departmentCode' | 'provinceCode' | 'districtCode'>,
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
