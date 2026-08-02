export type ColdChainFilter = 'NONE' | 'REFRIGERATED' | 'FROZEN';
export type CatalogAvailabilityStatus =
  | 'AVAILABLE'
  | 'LOW'
  | 'OUT_OF_STOCK'
  | 'UNAVAILABLE'
  | 'UNKNOWN';

export interface CatalogPrice {
  readonly amount: string;
  readonly currency: string;
}

export interface CatalogQuery {
  readonly q: string;
  readonly brand: string;
  readonly category: string;
  readonly coldChain: ColdChainFilter | '';
  readonly page: number;
  readonly size: number;
  readonly sort: 'itemName' | 'brandName' | 'categoryName';
  readonly direction: 'asc' | 'desc';
}

export interface CatalogMedia {
  readonly url: string;
  readonly fileName: string;
}

export interface CatalogItemSummary {
  readonly catalogItemId: string;
  readonly productId: string;
  readonly itemName: string;
  readonly brandName: string;
  readonly categoryName: string;
  readonly presentation: string;
  readonly coldChainRequirement: string;
  readonly image: CatalogMedia | null;
  readonly unitPrice: CatalogPrice | null;
  readonly availabilityStatus: CatalogAvailabilityStatus;
  readonly promotionLabel: string | null;
}

export interface CatalogItemDetail extends CatalogItemSummary {
  readonly description: string;
}

export interface CatalogPage {
  readonly items: readonly CatalogItemSummary[];
  readonly page: number;
  readonly size: number;
  readonly totalItems: number;
  readonly totalPages: number;
  readonly sort: { readonly field: string; readonly direction: string };
}

export const DEFAULT_CATALOG_QUERY: CatalogQuery = {
  q: '',
  brand: '',
  category: '',
  coldChain: '',
  page: 0,
  size: 20,
  sort: 'itemName',
  direction: 'asc',
};

export function coldChainValue(value: string): ColdChainFilter | '' {
  const normalized = value.trim().toUpperCase();
  return normalized === 'REFRIGERATED' || normalized === 'FROZEN' || normalized === 'NONE'
    ? normalized
    : '';
}

export function catalogAvailabilityFromValue(value: unknown): CatalogAvailabilityStatus {
  const normalized = typeof value === 'string' ? value.trim().toUpperCase().replaceAll('-', '_') : '';
  switch (normalized) {
    case 'AVAILABLE':
      return 'AVAILABLE';
    case 'LOW':
      return 'LOW';
    case 'OUT_OF_STOCK':
      return 'OUT_OF_STOCK';
    case 'UNAVAILABLE':
      return 'UNAVAILABLE';
    default:
      return 'UNKNOWN';
  }
}

export function isCatalogOutOfStock(status: CatalogAvailabilityStatus): boolean {
  return status === 'OUT_OF_STOCK' || status === 'UNAVAILABLE';
}

export function catalogItemsWithOutOfStockLast(
  items: readonly CatalogItemSummary[],
): readonly CatalogItemSummary[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((left, right) => {
      const availabilityOrder = (status: CatalogAvailabilityStatus): number => {
        if (status === 'AVAILABLE') return 0;
        if (status === 'LOW') return 1;
        if (isCatalogOutOfStock(status)) return 3;
        return 2;
      };
      return availabilityOrder(left.item.availabilityStatus) - availabilityOrder(right.item.availabilityStatus) ||
        left.index - right.index;
    })
    .map(({ item }) => item);
}

export function formatCatalogPrice(price: CatalogPrice | null): string {
  if (!price?.currency || !price.amount.trim()) return '';
  const amount = Number(price.amount);
  if (!Number.isFinite(amount)) return '';
  return `${price.currency} ${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}

export function catalogQueryFromParams(params: { get(name: string): string | null }): CatalogQuery {
  const page = Number(params.get('page'));
  const size = Number(params.get('size'));
  const sort = params.get('sort');
  const direction = params.get('direction');
  return {
    q: params.get('q')?.trim() ?? '',
    brand: params.get('brand')?.trim() ?? '',
    category: params.get('category')?.trim() ?? '',
    coldChain: coldChainValue(params.get('coldChain') ?? ''),
    page: Number.isInteger(page) && page >= 0 ? page : DEFAULT_CATALOG_QUERY.page,
    size: Number.isInteger(size) && size >= 1 && size <= 100 ? size : DEFAULT_CATALOG_QUERY.size,
    sort: sort === 'brandName' || sort === 'categoryName' ? sort : DEFAULT_CATALOG_QUERY.sort,
    direction: direction === 'desc' ? 'desc' : DEFAULT_CATALOG_QUERY.direction,
  };
}

export function catalogQueryToParams(query: CatalogQuery): Record<string, string> {
  const params: Record<string, string> = {
    page: String(query.page),
    size: String(query.size),
    sort: query.sort,
    direction: query.direction,
  };
  if (query.q) params['q'] = query.q;
  if (query.brand) params['brand'] = query.brand;
  if (query.category) params['category'] = query.category;
  if (query.coldChain) params['coldChain'] = query.coldChain;
  return params;
}
