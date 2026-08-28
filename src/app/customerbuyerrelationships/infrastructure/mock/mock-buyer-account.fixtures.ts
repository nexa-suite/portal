import type { TenantProfile } from '../../../core/security/runtime-config';
import type { BuyerClientAccount, ClientAccountAddress, PeruReferenceOption } from '../../domain/buyer-account.models';
import type { BuyerAccountReferenceResource } from '../../application/buyer-account.port';

export interface MockBuyerAccountFixture {
  readonly account: BuyerClientAccount;
  readonly addresses: readonly ClientAccountAddress[];
  readonly references: Readonly<Record<BuyerAccountReferenceResource, readonly PeruReferenceOption[]>>;
}

function references(): Readonly<Record<BuyerAccountReferenceResource, readonly PeruReferenceOption[]>> {
  return {
    departments: [{ id: 1, code: 'LIM', label: 'Lima', parentCode: null, active: true }],
    provinces: [{ id: 2, code: 'LIM-01', label: 'Lima', parentCode: 'LIM', active: true }],
    districts: [{ id: 3, code: 'LIM-0101', label: 'Miraflores', parentCode: 'LIM-01', active: true }],
    'road-types': [
      { id: 4, code: 'AV', label: 'Avenida', parentCode: null, active: true },
      { id: 5, code: 'JR', label: 'Jirón', parentCode: null, active: true },
    ],
  };
}

function address(
  profile: TenantProfile,
  accountId: string,
  values: Pick<ClientAccountAddress, 'id' | 'label' | 'line' | 'reference' | 'defaultAddress'>,
): ClientAccountAddress {
  return {
    id: values.id,
    clientAccountId: accountId,
    label: values.label,
    addressType: 'DELIVERY',
    line: values.line,
    reference: values.reference,
    countryCode: 'PE',
    departmentCode: 'LIM',
    provinceCode: 'LIM-01',
    districtCode: 'LIM-0101',
    defaultAddress: values.defaultAddress,
    active: true,
    version: 1,
    etag: '"1"',
    recipientName: profile === 'icisa' ? 'ICISA Recepción' : 'Generic Recepción',
    recipientPhone: '+51 900 000 001',
    roadType: 'AV',
    streetName: profile === 'icisa' ? 'Javier Prado' : 'Demo',
    streetNumber: profile === 'icisa' ? '1234' : '100',
    interior: null,
    postalCode: '15074',
    receivingInstructions: 'Entregar en horario laboral.',
    receivingHours: '09:00-17:00',
    latitude: -12.118,
    longitude: -77.036,
    placeId: null,
    source: 'MOCK_FIXTURE',
  };
}

const FIXTURES: Record<TenantProfile, MockBuyerAccountFixture> = {
  generic: {
    account: {
      id: 'client-generic-001',
      code: 'CLI-GENERIC-001',
      businessName: 'Generic Foods Demo S.A.C.',
      commercialName: 'Generic Foods',
      countryCode: 'PE',
      taxType: 'RUC',
      taxValue: '20999999991',
      segment: 'WHOLESALE',
      contactPerson: 'Generic Buyer',
      contactEmail: 'buyer@generic.example',
      phone: '+51 900 000 001',
      deliveryProfile: 'REFRIGERATED_STANDARD',
      paymentCondition: 'CASH_ON_DELIVERY',
      status: 'ACTIVE',
      buyerMembershipId: 'membership-generic-001',
      version: 1,
    },
    addresses: [address('generic', 'client-generic-001', {
      id: 'address-generic-001',
      label: 'Principal',
      line: 'Av. Demo 100',
      reference: 'Frente al parque',
      defaultAddress: true,
    })],
    references: references(),
  },
  icisa: {
    account: {
      id: 'client-icisa-001',
      code: 'CLI-ICISA-001',
      businessName: 'Importaciones Comerciales S.A.',
      commercialName: 'ICISA',
      countryCode: 'PE',
      taxType: 'RUC',
      taxValue: '20123456789',
      segment: 'WHOLESALE',
      contactPerson: 'ICISA Buyer',
      contactEmail: 'buyer@icisa.example',
      phone: '+51 900 000 002',
      deliveryProfile: 'REFRIGERATED_STANDARD',
      paymentCondition: 'CREDIT_LINE',
      status: 'ACTIVE',
      buyerMembershipId: 'membership-icisa-001',
      version: 1,
    },
    addresses: [address('icisa', 'client-icisa-001', {
      id: 'address-icisa-001',
      label: 'Almacén principal',
      line: 'Av. Javier Prado 1234',
      reference: 'Ingreso por la puerta lateral',
      defaultAddress: true,
    })],
    references: references(),
  },
};

export function mockBuyerAccountFixture(profile: TenantProfile): MockBuyerAccountFixture {
  return FIXTURES[profile];
}
