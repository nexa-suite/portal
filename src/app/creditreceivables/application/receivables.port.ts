import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { Receivable, ReceivablesPage } from '../domain/receivables.models';

export interface ReceivablesPort {
  list(page?: number, size?: number): Observable<ReceivablesPage<Receivable>>;
}

export const RECEIVABLES_PORT = new InjectionToken<ReceivablesPort>('RECEIVABLES_PORT');
