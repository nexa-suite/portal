export type ColdChainFilter = 'NONE' | 'REFRIGERATED' | 'FROZEN';

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
