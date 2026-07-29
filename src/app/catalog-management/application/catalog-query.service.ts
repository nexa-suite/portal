import { computed, inject, Injectable, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { CatalogApiClient } from '../infrastructure/catalog-api.client';
import {
  CatalogItemDetail,
  CatalogItemSummary,
  CatalogPage,
  CatalogQuery,
  DEFAULT_CATALOG_QUERY,
} from '../domain/catalog.models';

export type CatalogListStatus = 'idle' | 'loading' | 'retrying' | 'success' | 'empty' | 'error';
export type CatalogDetailStatus = 'idle' | 'loading' | 'retrying' | 'success' | 'error';

interface CatalogListState {
  readonly status: CatalogListStatus;
  readonly items: readonly CatalogItemSummary[];
  readonly page: CatalogPage | null;
  readonly error: unknown;
  readonly query: CatalogQuery;
}

interface CatalogDetailState {
  readonly status: CatalogDetailStatus;
  readonly item: CatalogItemDetail | null;
  readonly error: unknown;
  readonly catalogItemId: string | null;
}

@Injectable({ providedIn: 'root' })
export class CatalogQueryService {
  private readonly api = inject(CatalogApiClient);
  private readonly listState = signal<CatalogListState>({
    status: 'idle',
    items: [],
    page: null,
    error: null,
    query: DEFAULT_CATALOG_QUERY,
  });
  private readonly detailState = signal<CatalogDetailState>({
    status: 'idle',
    item: null,
    error: null,
    catalogItemId: null,
  });
  private listSubscription: Subscription | null = null;
  private detailSubscription: Subscription | null = null;

  readonly listStatus = computed(() => this.listState().status);
  readonly items = computed(() => this.listState().items);
  readonly page = computed(() => this.listState().page);
  readonly listError = computed(() => this.listState().error);
  readonly detailStatus = computed(() => this.detailState().status);
  readonly detail = computed(() => this.detailState().item);
  readonly detailError = computed(() => this.detailState().error);

  loadList(query: CatalogQuery, retry = false): void {
    this.listSubscription?.unsubscribe();
    this.listState.set({
      ...this.listState(),
      status: retry ? 'retrying' : 'loading',
      error: null,
      query,
    });
    this.listSubscription = this.api.list(query).subscribe({
      next: (page) =>
        this.listState.set({
          status: page.items.length > 0 ? 'success' : 'empty',
          items: page.items,
          page,
          error: null,
          query,
        }),
      error: (error: unknown) =>
        this.listState.set({ ...this.listState(), status: 'error', error, query }),
    });
  }

  retryList(): void {
    this.loadList(this.listState().query, true);
  }

  loadDetail(catalogItemId: string, retry = false): void {
    if (!catalogItemId) return;
    this.detailSubscription?.unsubscribe();
    this.detailState.set({
      ...this.detailState(),
      status: retry ? 'retrying' : 'loading',
      error: null,
      catalogItemId,
    });
    this.detailSubscription = this.api.getById(catalogItemId).subscribe({
      next: (item) => this.detailState.set({ status: 'success', item, error: null, catalogItemId }),
      error: (error: unknown) =>
        this.detailState.set({ ...this.detailState(), status: 'error', error, catalogItemId }),
    });
  }

  retryDetail(): void {
    const id = this.detailState().catalogItemId;
    if (id) this.loadDetail(id, true);
  }
}
