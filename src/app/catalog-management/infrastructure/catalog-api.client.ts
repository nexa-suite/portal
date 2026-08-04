import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { PORTAL_RUNTIME_CONFIG, portalApiUrl } from '../../core/security/runtime-config';
import {
  catalogAvailabilityFromValue,
  CatalogAppliedPromotion,
  CatalogPrice,
  CatalogItemDetail,
  CatalogItemSummary,
  CatalogMedia,
  CatalogPage,
  CatalogPricingPreview,
  CatalogPricingPreviewItem,
  CatalogPricingPreviewRequest,
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
interface RawCatalogAppliedPromotion {
  readonly id?: unknown;
  readonly name?: unknown;
  readonly discountType?: unknown;
  readonly discountAmount?: unknown;
}
interface RawCatalogItem {
  readonly catalogItemId?: unknown;
  readonly productId?: unknown;
  readonly productFamilyId?: unknown;
  readonly productFamilyCode?: unknown;
  readonly productFamilyName?: unknown;
  readonly sellableSkuId?: unknown;
  readonly skuCode?: unknown;
  readonly itemName?: unknown;
  readonly brandName?: unknown;
  readonly categoryName?: unknown;
  readonly description?: unknown;
  readonly presentation?: unknown;
  readonly unitOfMeasure?: unknown;
  readonly packagingType?: unknown;
  readonly netWeight?: unknown;
  readonly grossWeight?: unknown;
  readonly coldChainRequirement?: unknown;
  readonly image?: RawCatalogMedia;
  readonly unitPrice?: RawCatalogPrice | null;
  readonly unitPriceAmount?: unknown;
  readonly unitPriceCurrency?: unknown;
  readonly basePrice?: RawCatalogPrice | null;
  readonly effectivePrice?: RawCatalogPrice | null;
  readonly discountAmount?: RawCatalogPrice | null;
  readonly currency?: unknown;
  readonly appliedPromotions?: readonly RawCatalogAppliedPromotion[] | null;
  readonly pricingAsOf?: unknown;
  readonly availabilityStatus?: unknown;
  readonly nearExpiry?: unknown;
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

interface RawCatalogPricingPreviewItem {
  readonly productId?: unknown;
  readonly quantity?: unknown;
  readonly baseUnitPrice?: RawCatalogPrice | null;
  readonly effectiveUnitPrice?: RawCatalogPrice | null;
  readonly lineBaseTotal?: RawCatalogPrice | null;
  readonly lineEffectiveTotal?: RawCatalogPrice | null;
  readonly basePrice?: RawCatalogPrice | null;
  readonly effectivePrice?: RawCatalogPrice | null;
  readonly discountAmount?: RawCatalogPrice | null;
  readonly currency?: unknown;
  readonly appliedPromotions?: readonly RawCatalogAppliedPromotion[] | null;
  readonly pricingAsOf?: unknown;
}

interface RawCatalogPricingPreview {
  readonly items?: readonly RawCatalogPricingPreviewItem[];
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

function money(raw: RawCatalogPrice | null | undefined): CatalogPrice | null {
  const amount = moneyAmount(raw?.amount);
  const currency = text(raw?.currency);
  return amount || currency ? { amount, currency } : null;
}

function moneyAmount(value: unknown): string {
  if (typeof value === 'number') return Number.isFinite(value) ? value.toFixed(2) : '';
  return text(value);
}

function unitPrice(raw: RawCatalogItem): CatalogPrice | null {
  return money(raw.unitPrice) ?? money({ amount: raw.unitPriceAmount, currency: raw.unitPriceCurrency });
}

function decimalText(value: unknown): string {
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  return text(value);
}

function appliedPromotions(raw: { readonly appliedPromotions?: readonly RawCatalogAppliedPromotion[] | null }): readonly CatalogAppliedPromotion[] {
  if (!Array.isArray(raw.appliedPromotions)) return [];
  return raw.appliedPromotions.map((promotion) => ({
    id: text(promotion.id),
    name: text(promotion.name),
    discountType: text(promotion.discountType),
    discountAmount: decimalText(promotion.discountAmount),
  }));
}

function pricing(raw: RawCatalogItem) {
  return {
    basePrice: money(raw.basePrice),
    effectivePrice: money(raw.effectivePrice),
    discountAmount: money(raw.discountAmount),
    currency: text(raw.currency),
    appliedPromotions: appliedPromotions(raw),
    pricingAsOf: text(raw.pricingAsOf) || null,
  };
}

function previewItem(raw: RawCatalogPricingPreviewItem): CatalogPricingPreviewItem {
  const baseUnitPrice = money(raw.baseUnitPrice) ?? money(raw.basePrice);
  const effectiveUnitPrice = money(raw.effectiveUnitPrice) ?? money(raw.effectivePrice);
  return {
    productId: text(raw.productId),
    quantity: typeof raw.quantity === 'number' ? raw.quantity : Number(raw.quantity ?? 0),
    baseUnitPrice,
    effectiveUnitPrice,
    lineBaseTotal: money(raw.lineBaseTotal),
    lineEffectiveTotal: money(raw.lineEffectiveTotal),
    basePrice: baseUnitPrice,
    effectivePrice: effectiveUnitPrice,
    discountAmount: money(raw.discountAmount),
    currency: text(raw.currency) || baseUnitPrice?.currency || effectiveUnitPrice?.currency || '',
    appliedPromotions: appliedPromotions(raw),
    pricingAsOf: text(raw.pricingAsOf) || null,
  };
}

function summary(raw: RawCatalogItem): CatalogItemSummary {
  return {
    catalogItemId: text(raw.catalogItemId),
    productId: text(raw.productId),
    productFamilyId: text(raw.productFamilyId) || undefined,
    productFamilyCode: text(raw.productFamilyCode) || undefined,
    productFamilyName: text(raw.productFamilyName) || text(raw.itemName),
    sellableSkuId: text(raw.sellableSkuId) || text(raw.productId) || undefined,
    skuCode: text(raw.skuCode) || undefined,
    itemName: text(raw.itemName),
    brandName: text(raw.brandName),
    categoryName: text(raw.categoryName),
    presentation: text(raw.presentation),
    unitOfMeasure: text(raw.unitOfMeasure) || undefined,
    packagingType: text(raw.packagingType) || undefined,
    netWeight: decimalText(raw.netWeight) || undefined,
    grossWeight: decimalText(raw.grossWeight) || undefined,
    coldChainRequirement: text(raw.coldChainRequirement),
    image: media(raw.image),
    unitPrice: unitPrice(raw),
    ...pricing(raw),
    availabilityStatus: catalogAvailabilityFromValue(raw.availabilityStatus),
    nearExpiry: raw.nearExpiry === true,
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

  previewPricing(request: CatalogPricingPreviewRequest): Observable<CatalogPricingPreview> {
    const path = this.config.pricingPreviewPath ?? '/api/v1/catalog/pricing-preview';
    return this.http
      .post<RawCatalogPricingPreview>(portalApiUrl(this.config, path), request, { withCredentials: true })
      .pipe(map((raw) => ({ items: (raw.items ?? []).map(previewItem) })));
  }
}
