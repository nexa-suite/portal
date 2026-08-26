import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { Delivery, DeliveryEvent, DeliveryPage } from '../domain/delivery.models';

export interface DeliveryTrackingPort {
  list(): Observable<DeliveryPage>;
  detail(id: string): Observable<Delivery>;
  events(id: string): Observable<readonly DeliveryEvent[]>;
}

export const DELIVERY_TRACKING_PORT = new InjectionToken<DeliveryTrackingPort>('DELIVERY_TRACKING_PORT');
