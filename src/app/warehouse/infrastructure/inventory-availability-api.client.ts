import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { PORTAL_RUNTIME_CONFIG, portalApiUrl } from '../../core/security/runtime-config';
import { InventoryAvailability } from '../domain/inventory-availability.model';

@Injectable({ providedIn: 'root' })
export class InventoryAvailabilityApiClient {
  private readonly http = inject(HttpClient); private readonly config = inject(PORTAL_RUNTIME_CONFIG);
  list(ids: readonly string[]): Observable<readonly InventoryAvailability[]> {
    let params = new HttpParams();
    ids.slice(0, 100).forEach((id) => params = params.append('catalogItemIds', id));
    return this.http.get<readonly InventoryAvailability[]>(portalApiUrl(this.config, '/api/v1/inventory-availability'), { params, withCredentials: true }).pipe(
      map((items): readonly InventoryAvailability[] => items.map((item) => ({
        catalogItemId: String(item.catalogItemId ?? ''),
        status: item.status === 'AVAILABLE' || item.status === 'UNAVAILABLE' ? item.status : 'UNKNOWN',
        asOf: String(item.asOf ?? ''),
      }))),
    );
  }
}
