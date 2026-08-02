import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { PORTAL_RUNTIME_CONFIG, portalApiUrl } from '../../core/security/runtime-config';
import {
  catalogAvailabilityFromValue,
  CatalogPrice,
  CatalogItemDetail,
  CatalogItemSummary,
  CatalogMedia,
  CatalogPage,
  CatalogQuery,
} from '../domain/catalog.models';

interface RawCatalogMedia {
  readonly url?: unknown;
  readonly fileName?: unknown;
}
interface RawCatalogPrice {
  readonly amount?: unknown;
  readonly currency?: unknown;
}
interface RawCatalogItem {
  readonly catalogItemId?: unknown;
  readonly productId?: unknown;
  readonly itemName?: unknown;
  readonly brandName?: unknown;
  readonly categoryName?: unknown;
  readonly description?: unknown;
  readonly presentation?: unknown;
  readonly coldChainRequirement?: unknown;
  readonly image?: RawCatalogMedia;
  readonly unitPrice?: RawCatalogPrice | null;
  readonly unitPriceAmount?: unknown;
  readonly unitPriceCurrency?: unknown;
  readonly availabilityStatus?: unknown;
  readonly promotionLabel?: unknown;
}
interface RawCatalogPage {
  readonly items?: readonly RawCatalogItem[];
  readonly page?: unknown;
  readonly size?: unknown;
  readonly totalItems?: unknown;
  readonly totalPages?: unknown;
  readonly sort?: { readonly field?: unknown; readonly direction?: unknown };
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function integer(value: unknown, fallback: number): number {
  const candidate = typeof value === 'number' ? value : Number(value);
  return Number.isInteger(candidate) && candidate >= 0 ? candidate : fallback;
}

function media(raw: RawCatalogMedia | undefined): CatalogMedia | null {
  const url = text(raw?.url);
  const fileName = text(raw?.fileName);
  return url || fileName ? { url, fileName } : null;
}

function price(raw: RawCatalogItem): CatalogPrice | null {
  const amount = text(raw.unitPrice?.amount ?? raw.unitPriceAmount);
  const currency = text(raw.unitPrice?.currency ?? raw.unitPriceCurrency);
  return amount || currency ? { amount, currency } : null;
}

function summary(raw: RawCatalogItem): CatalogItemSummary {
  return {
    catalogItemId: text(raw.catalogItemId),
    productId: text(raw.productId),
    itemName: text(raw.itemName),
    brandName: text(raw.brandName),
    categoryName: text(raw.categoryName),
    presentation: text(raw.presentation),
    coldChainRequirement: text(raw.coldChainRequirement),
    image: media(raw.image),
    unitPrice: price(raw),
    availabilityStatus: catalogAvailabilityFromValue(raw.availabilityStatus),
    promotionLabel: text(raw.promotionLabel) || null,
  };
}

function detail(raw: RawCatalogItem): CatalogItemDetail {
  return { ...summary(raw), description: text(raw.description) };
}

@Injectable({ providedIn: 'root' })
export class CatalogApiClient {
  private readonly http = inject(HttpClient);
  private readonly config = inject(PORTAL_RUNTIME_CONFIG);

  list(query: CatalogQuery): Observable<CatalogPage> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('size', query.size)
      .set('sort', query.sort)
      .set('direction', query.direction);
    if (query.q) params = params.set('q', query.q);
    if (query.brand) params = params.set('brand', query.brand);
    if (query.category) params = params.set('category', query.category);
    if (query.coldChain) params = params.set('coldChain', query.coldChain);

    return this.http
      .get<RawCatalogPage>(portalApiUrl(this.config, this.config.catalogPath), {
        params,
        withCredentials: true,
      })
      .pipe(
        map((raw) => ({
          items: (raw.items ?? []).map(summary),
          page: integer(raw.page, query.page),
          size: integer(raw.size, query.size),
          totalItems: integer(raw.totalItems, 0),
          totalPages: integer(raw.totalPages, 0),
          sort: { field: text(raw.sort?.field), direction: text(raw.sort?.direction) },
        })),
      );
  }

  getById(catalogItemId: string): Observable<CatalogItemDetail> {
    const path = `${this.config.catalogPath}/${encodeURIComponent(catalogItemId)}`;
    return this.http
      .get<RawCatalogItem>(portalApiUrl(this.config, path), { withCredentials: true })
      .pipe(map(detail));
  }
}
