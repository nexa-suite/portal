import { Injectable, inject, signal } from '@angular/core';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';

import { BusinessDocumentsApiPort } from '../../../businessdocuments/application/ports/business-documents-api.port';
import { BuyerAccountApiPort } from '../../../customerbuyerrelationships/application/ports/buyer-account-api.port';
import { BuyerClientAccount, ClientAccountAddress } from '../../../customerbuyerrelationships/domain/buyer-account.models';
import { SalesOrderApiPort } from '../../../salescommitment/application/ports/sales-order-api.port';
import { SalesOrderPage } from '../../../salescommitment/domain/orders/sales-order.models';

export type BuyerProfileContextLoadState = 'loading' | 'ready' | 'error';

export interface BuyerProfileActivitySnapshot {
  readonly orders: number | null;
  readonly invoices: number | null;
}

/** Composition-only read model for the buyer profile surface. */
@Injectable()
export class BuyerProfileContextFacade {
  private readonly accountApi = inject(BuyerAccountApiPort);
  private readonly ordersApi = inject(SalesOrderApiPort);
  private readonly documentsApi = inject(BusinessDocumentsApiPort);

  readonly account = signal<BuyerClientAccount | null>(null);
  readonly address = signal<ClientAccountAddress | null>(null);
  readonly accountState = signal<BuyerProfileContextLoadState>('loading');
  readonly activityState = signal<BuyerProfileContextLoadState>('loading');
  readonly activity = signal<BuyerProfileActivitySnapshot>({ orders: null, invoices: null });

  constructor() {
    this.loadAccount();
    this.loadActivity();
  }

  private loadAccount(): void {
    this.accountApi.clientAccount().pipe(
      switchMap((account) => this.accountApi.addresses(account.id).pipe(
        map((addresses) => ({
          account,
          address: addresses.find((item) => item.defaultAddress && item.active)
            ?? addresses.find((item) => item.active)
            ?? null,
        })),
        catchError(() => of({ account, address: null })),
      )),
      catchError(() => of(null)),
    ).subscribe((value) => {
      if (!value) {
        this.accountState.set('error');
        return;
      }
      this.account.set(value.account);
      this.address.set(value.address);
      this.accountState.set('ready');
    });
  }

  private loadActivity(): void {
    forkJoin({
      orders: this.ordersApi.list().pipe(catchError(() => of(null as SalesOrderPage | null))),
      documents: this.documentsApi.list(0, 100).pipe(catchError(() => of(null))),
    }).subscribe((value) => {
      this.activity.set({
        orders: value.orders?.total ?? value.orders?.items.length ?? null,
        invoices: value.documents?.total ?? value.documents?.items.length ?? null,
      });
      this.activityState.set(value.orders || value.documents ? 'ready' : 'error');
    });
  }
}
