import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { PORTAL_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import type { Receivable, ReceivablesPage } from '../../domain/receivables.models';
import type { ReceivablesPort } from '../../application/receivables.port';

/** BC-07 buyer-scoped receivables fixture. */
@Injectable({ providedIn: 'root' })
export class MockReceivablesApiAdapter implements ReceivablesPort {
  private readonly config = inject(PORTAL_RUNTIME_CONFIG);

  list(page = 0, size = 25): Observable<ReceivablesPage<Receivable>> {
    const key = this.config.tenantProfile === 'icisa' ? 'ICISA' : 'GENERIC';
    const items: readonly Receivable[] = [
      { id: `${this.config.tenantProfile}-receivable-001`, clientAccountId: `client-${this.config.tenantProfile}-001`, subjectType: 'SALES_ORDER', subjectId: `${this.config.tenantProfile}-order-001`, number: `AR-${key}-001`, currency: 'PEN', amount: 2490.75, amountPaid: 0, remaining: 2490.75, status: 'OPEN', dueAt: '2026-09-10T00:00:00Z', version: 1 },
      { id: `${this.config.tenantProfile}-receivable-002`, clientAccountId: `client-${this.config.tenantProfile}-001`, subjectType: 'SALES_ORDER', subjectId: `${this.config.tenantProfile}-order-002`, number: `AR-${key}-002`, currency: 'PEN', amount: 980, amountPaid: 250, remaining: 730, status: 'PARTIALLY_PAID', dueAt: '2026-08-30T00:00:00Z', version: 2 },
    ];
    return of({ items: items.slice(page * size, page * size + size), page, size, total: items.length });
  }
}
