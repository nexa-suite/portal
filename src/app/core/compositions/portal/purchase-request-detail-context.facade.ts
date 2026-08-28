import { Injectable, inject, signal } from '@angular/core';

import { CatalogApiPort } from '../../../catalogcommercialpolicy/application/ports/catalog-api.port';
import { CatalogItemSummary, DEFAULT_CATALOG_QUERY } from '../../../catalogcommercialpolicy/domain/catalog.models';
import { BuyerAccountApiPort } from '../../../customerbuyerrelationships/application/ports/buyer-account-api.port';
import { BuyerClientAccount, ClientAccountAddress } from '../../../customerbuyerrelationships/domain/buyer-account.models';

export type PurchaseRequestDetailCatalogItem = CatalogItemSummary;
export type PurchaseRequestDetailClientAccount = BuyerClientAccount;
export type PurchaseRequestDetailAddress = ClientAccountAddress;

/** Composition-only read model joining catalog and buyer context for request detail. */
@Injectable()
export class PurchaseRequestDetailContextFacade {
  private readonly catalog = inject(CatalogApiPort);
  private readonly accountApi = inject(BuyerAccountApiPort);

  readonly catalogItems = signal<readonly CatalogItemSummary[]>([]);
  readonly clientAccount = signal<BuyerClientAccount | null>(null);
  readonly addresses = signal<readonly ClientAccountAddress[]>([]);

  constructor() {
    this.load();
  }

  private load(): void {
    this.catalog.list({ ...DEFAULT_CATALOG_QUERY, size: 100 }).subscribe({
      next: (page) => this.catalogItems.set(page.items),
      error: () => this.catalogItems.set([]),
    });
    this.accountApi.clientAccount().subscribe({
      next: (account) => {
        this.clientAccount.set(account);
        this.accountApi.addresses(account.id).subscribe({
          next: (addresses) => this.addresses.set(addresses),
          error: () => this.addresses.set([]),
        });
      },
      error: () => {
        this.clientAccount.set(null);
        this.addresses.set([]);
      },
    });
  }
}
