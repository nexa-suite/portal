import type { TenantProfile } from '../../../core/security/runtime-config';
import type { Delivery, DeliveryEvent } from '../../domain/delivery.models';

export interface MockDeliveryTrackingFixture {
  readonly deliveries: readonly Delivery[];
  readonly events: readonly DeliveryEvent[];
}

function fixture(profile: TenantProfile): MockDeliveryTrackingFixture {
  const icisa = profile === 'icisa';
  const key = icisa ? 'ICISA' : 'GENERIC';
  const destination = icisa ? 'Av. Néstor Gambetta 850, Callao' : 'Av. Demo 123, Lima';
  const deliveries: Delivery[] = [
    { id: `${profile}-delivery-001`, dispatchNumber: `DO-${key}-001`, salesOrderId: `${profile}-order-001`, salesOrderNumber: `SO-${key}-001`, clientAccountId: `client-${profile}-001`, status: 'DELIVERY_SCHEDULED', destination, deliveryWindowStart: '2026-08-27T09:00:00Z', deliveryWindowEnd: '2026-08-27T12:00:00Z', eta: '2026-08-27T10:30:00Z', routeName: icisa ? 'Callao Norte' : 'Lima Centro', temperatureMin: 2, temperatureMax: 8, temperatureUnit: 'CELSIUS', temperatureStatus: 'WITHIN_RANGE', podStatus: 'PENDING', version: 2, updatedAt: '2026-08-26T09:30:00Z', alerts: [] },
    { id: `${profile}-delivery-002`, dispatchNumber: `DO-${key}-002`, salesOrderId: `${profile}-order-002`, salesOrderNumber: `SO-${key}-002`, clientAccountId: `client-${profile}-001`, status: 'DELIVERED', destination: icisa ? 'Jr. de la Unión 500, Lima' : 'Av. Brasil 500, Lima', deliveryWindowStart: '2026-08-25T09:00:00Z', deliveryWindowEnd: '2026-08-25T12:00:00Z', eta: '2026-08-25T10:10:00Z', routeName: icisa ? 'Lima Centro' : 'Lima Sur', temperatureMin: -25, temperatureMax: -15, temperatureUnit: 'CELSIUS', temperatureStatus: 'WITHIN_RANGE', podStatus: 'COMPLETED', version: 3, updatedAt: '2026-08-25T11:10:00Z', alerts: [] },
  ];
  return {
    deliveries,
    events: deliveries.flatMap((delivery) => [
      { id: `${delivery.id}-event-001`, type: 'DELIVERY_CREATED', occurredAt: '2026-08-25T08:00:00Z', summary: 'Delivery tracking created.' },
      { id: `${delivery.id}-event-002`, type: delivery.status, occurredAt: delivery.updatedAt, summary: delivery.status === 'DELIVERED' ? 'Entrega confirmada.' : 'Ventana de entrega confirmada.' },
    ]),
  };
}

export const MOCK_DELIVERY_TRACKING_FIXTURES: Readonly<Record<TenantProfile, MockDeliveryTrackingFixture>> = { generic: fixture('generic'), icisa: fixture('icisa') };
