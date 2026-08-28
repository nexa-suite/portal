import { inject, Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { PORTAL_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import { Delivery, DeliveryEvent, DeliveryPage } from '../../domain/delivery.models';
import { DeliveryTrackingApiPort } from '../../application/ports/delivery-tracking-api.port';
import { MOCK_DELIVERY_TRACKING_FIXTURES } from './mock-delivery-tracking.fixtures';

/** BC-06 buyer-safe projection; only delivery data exposed by the Portal API is reproduced. */
@Injectable({ providedIn: 'root' })
export class MockDeliveryTrackingApiAdapter implements DeliveryTrackingApiPort {
  private readonly config = inject(PORTAL_RUNTIME_CONFIG);
  private readonly seed = MOCK_DELIVERY_TRACKING_FIXTURES[this.config.tenantProfile];
  private readonly deliveries = new Map(this.seed.deliveries.map((item) => [item.id, item]));
  private readonly eventStore = new Map(this.seed.deliveries.map((item) => [item.id, this.seed.events.filter((event) => event.id.startsWith(item.id))]));

  list(): Observable<DeliveryPage> { const items = [...this.deliveries.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)); return of({ items, page: 0, size: items.length, total: items.length }); }
  detail(id: string): Observable<Delivery> { const value = this.deliveries.get(id); return value ? of(value) : throwError(() => new Error('MOCK_DELIVERY_NOT_FOUND')); }
  events(id: string): Observable<readonly DeliveryEvent[]> { return this.eventStore.has(id) ? of(this.eventStore.get(id) ?? []) : throwError(() => new Error('MOCK_DELIVERY_NOT_FOUND')); }
}
