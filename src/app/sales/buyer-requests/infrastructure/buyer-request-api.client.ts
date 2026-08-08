import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { PORTAL_RUNTIME_CONFIG, portalApiUrl } from '../../../core/security/runtime-config';
import {
  BuyerWarehouse,
  BuyerClientAccount,
  ClientAccountAddress,
  CreateClientAccountAddressInput,
  PeruReferenceOption,
  UpdateClientAccountAddressInput,
} from '../domain/buyer-request.models';

type Raw = Record<string, unknown>;

function raw(value: unknown): Raw { return value !== null && typeof value === 'object' ? value as Raw : {}; }
function text(value: unknown): string { return typeof value === 'string' ? value.trim() : ''; }
function nullableText(value: unknown): string | null { const valueText = text(value); return valueText || null; }
function number(value: unknown): number { const result = typeof value === 'number' ? value : Number(value); return Number.isFinite(result) ? result : 0; }
function boolean(value: unknown): boolean { return value === true || value === 'true'; }

function reference(value: unknown): PeruReferenceOption {
  const item = raw(value);
  return {
    id: number(item['id']),
    code: text(item['code']),
    label: text(item['label']),
    parentCode: nullableText(item['parentCode']),
    active: item['active'] !== false,
  };
}

function warehouse(value: unknown): BuyerWarehouse {
  const item = raw(value);
  return {
    id: text(item['id']),
    code: text(item['code']),
    name: text(item['name']),
    address: text(item['address']),
    operatingHoursStart: nullableText(item['operatingHoursStart']),
    operatingHoursEnd: nullableText(item['operatingHoursEnd']),
    serviceable: item['serviceable'] !== false,
    version: number(item['version']),
  };
}

function address(value: unknown, etag?: string): ClientAccountAddress {
  const item = raw(value);
  const version = number(item['version']);
  return {
    id: text(item['id']),
    clientAccountId: text(item['clientAccountId']),
    label: text(item['label']),
    addressType: text(item['addressType']),
    line: text(item['line']),
    reference: text(item['reference']),
    countryCode: (text(item['countryCode']) || 'PE') as 'PE',
    departmentCode: text(item['departmentCode']),
    provinceCode: text(item['provinceCode']),
    districtCode: text(item['districtCode']),
    defaultAddress: boolean(item['defaultAddress']),
    active: item['active'] !== false,
    version,
    etag: etag ?? `"${version}"`,
    recipientName: nullableText(item['recipientName']),
    recipientPhone: nullableText(item['recipientPhone']),
    roadType: nullableText(item['roadType']),
    streetName: nullableText(item['streetName']),
    streetNumber: nullableText(item['streetNumber']),
    interior: nullableText(item['interior']),
    postalCode: nullableText(item['postalCode']),
    receivingInstructions: nullableText(item['receivingInstructions']),
    receivingHours: nullableText(item['receivingHours']),
    latitude: item['latitude'] == null ? null : Number(item['latitude']),
    longitude: item['longitude'] == null ? null : Number(item['longitude']),
    placeId: nullableText(item['placeId']),
    source: nullableText(item['source']),
  };
}

function clientAccount(value: unknown): BuyerClientAccount {
  const item = raw(value);
  return {
    id: text(item['id']),
    code: text(item['code']),
    businessName: text(item['businessName']),
    commercialName: text(item['commercialName']),
    countryCode: text(item['countryCode']) || 'PE',
    taxType: text(item['taxType']),
    taxValue: text(item['taxValue']),
    segment: text(item['segment']),
    contactPerson: text(item['contactPerson']),
    contactEmail: text(item['contactEmail']),
    phone: text(item['phone']),
    deliveryProfile: text(item['deliveryProfile']),
    paymentCondition: text(item['paymentCondition']),
    status: text(item['status']).toUpperCase(),
    buyerMembershipId: nullableText(item['buyerMembershipId']),
    version: number(item['version']),
  };
}

@Injectable({ providedIn: 'root' })
export class BuyerRequestApiClient {
  private readonly http = inject(HttpClient);
  private readonly config = inject(PORTAL_RUNTIME_CONFIG);

  private api(path: string): string { return portalApiUrl(this.config, `/api/v1${path}`); }

  warehouses(): Observable<readonly BuyerWarehouse[]> {
    return this.http.get<unknown>(this.api('/buyer/warehouses'), { withCredentials: true })
      .pipe(map((value) => Array.isArray(value) ? value.map(warehouse) : []));
  }

  clientAccount(): Observable<BuyerClientAccount> {
    return this.http.get<unknown>(this.api('/client-accounts/me'), { withCredentials: true })
      .pipe(map(clientAccount));
  }

  reference(resource: 'departments' | 'provinces' | 'districts' | 'road-types', parentCode?: string): Observable<readonly PeruReferenceOption[]> {
    const path = resource === 'departments'
      ? '/reference/departments'
      : resource === 'road-types'
        ? '/reference/road-types'
        : resource === 'provinces'
          ? `/reference/departments/${encodeURIComponent(parentCode ?? '')}/provinces`
          : `/reference/provinces/${encodeURIComponent(parentCode ?? '')}/districts`;
    return this.http.get<unknown>(this.api(path), { withCredentials: true })
      .pipe(map((value) => Array.isArray(value) ? value.map(reference) : []));
  }

  addresses(clientAccountId: string): Observable<readonly ClientAccountAddress[]> {
    return this.http.get<unknown>(this.api(`/client-accounts/${encodeURIComponent(clientAccountId)}/addresses`), { withCredentials: true })
      .pipe(map((value) => Array.isArray(value) ? value.map((item) => address(item)) : []));
  }

  createAddress(clientAccountId: string, input: CreateClientAccountAddressInput): Observable<ClientAccountAddress> {
    return this.http.post<unknown>(this.api(`/client-accounts/${encodeURIComponent(clientAccountId)}/addresses`), input, {
      observe: 'response',
      withCredentials: true,
    }).pipe(map((response) => address(response.body, response.headers.get('ETag') ?? undefined)));
  }

  updateAddress(clientAccountId: string, addressId: string, input: UpdateClientAccountAddressInput, etag: string): Observable<ClientAccountAddress> {
    return this.http.patch<unknown>(this.api(`/client-accounts/${encodeURIComponent(clientAccountId)}/addresses/${encodeURIComponent(addressId)}`), input, {
      observe: 'response',
      withCredentials: true,
      headers: new HttpHeaders({ 'If-Match': etag }),
    }).pipe(map((response) => address(response.body, response.headers.get('ETag') ?? undefined)));
  }

  setDefaultAddress(clientAccountId: string, addressId: string, etag: string): Observable<ClientAccountAddress> {
    return this.http.put<unknown>(this.api(`/client-accounts/${encodeURIComponent(clientAccountId)}/addresses/${encodeURIComponent(addressId)}/default`), null, {
      observe: 'response',
      withCredentials: true,
      headers: new HttpHeaders({ 'If-Match': etag }),
    }).pipe(map((response) => address(response.body, response.headers.get('ETag') ?? undefined)));
  }

  deactivateAddress(clientAccountId: string, addressId: string, etag: string): Observable<ClientAccountAddress> {
    return this.http.delete<unknown>(this.api(`/client-accounts/${encodeURIComponent(clientAccountId)}/addresses/${encodeURIComponent(addressId)}`), {
      observe: 'response', withCredentials: true, headers: new HttpHeaders({ 'If-Match': etag }),
    }).pipe(map((response) => address(response.body, response.headers.get('ETag') ?? undefined)));
  }

}
