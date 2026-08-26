import { Observable } from 'rxjs';
import { SalesOrderDeliveryProjection } from '../../domain/orders/sales-order-delivery.models';

/** Anti-corruption port for the delivery projection used by Sales Order detail. */
export abstract class SalesOrderDeliveryPort {
  abstract list(): Observable<readonly SalesOrderDeliveryProjection[]>;
}
