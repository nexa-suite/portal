/** Client-side draft item owned by the Sales Commitment context. */
export interface PurchaseRequestCartItem {
  readonly catalogItemId: string;
  readonly productId: string;
  readonly sellableSkuId: string | null;
  readonly itemName: string;
  readonly presentation: string;
  readonly brandName?: string;
  readonly coldChainRequirement?: string;
  readonly unit: string;
  readonly quantity: number;
  readonly unitPriceAmount: number | null;
  readonly currency: string;
  readonly imageUrl: string | null;
  readonly notes: string;
}
