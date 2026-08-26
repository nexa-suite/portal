import { Observable } from 'rxjs';
import { Delivery, DeliveryEvent, DeliveryPage } from '../../domain/delivery.models';

/** Application port for buyer-scoped fulfillment and delivery tracking. */
export abstract class DeliveryTrackingApiPort {
  abstract list(): Observable<DeliveryPage>;
  abstract detail(id: string): Observable<Delivery>;
  abstract events(id: string): Observable<readonly DeliveryEvent[]>;
}
