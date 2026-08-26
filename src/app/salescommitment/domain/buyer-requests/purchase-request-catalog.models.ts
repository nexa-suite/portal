export interface PurchaseRequestCatalogItem {
  readonly catalogItemId: string;
  readonly productId: string;
  readonly sellableSkuId?: string;
  readonly itemName: string;
  readonly presentation: string;
}

export interface PurchaseRequestCatalogPage {
  readonly items: readonly PurchaseRequestCatalogItem[];
  readonly page: number;
  readonly size: number;
  readonly totalItems: number;
  readonly totalPages: number;
}
