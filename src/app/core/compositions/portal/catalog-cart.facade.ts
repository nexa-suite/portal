import { Injectable, inject } from '@angular/core';
import { PORTAL_SECURITY_BOUNDARY } from '../../security/portal-security.boundary';
import { PurchaseRequestCartPort } from '../../../salescommitment/application/ports/purchase-request-cart.port';
import type { PurchaseRequestCartItem } from '../../../salescommitment/domain/buyer-requests/purchase-request-cart.models';
import { isCatalogOutOfStock, CatalogItemSummary } from '../../../catalogcommercialpolicy/domain/catalog.models';

/** Composition ACL from the Catalog UI to the BC-04 Buyer request cart. */
@Injectable({ providedIn: 'root' })
export class PortalCatalogCartFacade {
  private readonly auth = inject(PORTAL_SECURITY_BOUNDARY);
  private readonly cart = inject(PurchaseRequestCartPort);

  readonly items = this.cart.items;
  readonly count = this.cart.count;
  readonly subtotal = this.cart.subtotal;

  activate(): void {
    const identity = this.auth.identity();
    this.cart.setScope(identity ? `${identity.workspaceSlug ?? 'workspace'}:${identity.id || identity.email}` : null);
  }

  has(catalogItemId: string): boolean {
    return this.items().some((item) => item.catalogItemId === catalogItemId);
  }

  toggle(item: CatalogItemSummary): boolean {
    if (this.has(item.catalogItemId)) {
      this.cart.remove(item.catalogItemId);
      return true;
    }
    return this.add(item);
  }

  add(item: CatalogItemSummary, quantity = 1): boolean {
    if (isCatalogOutOfStock(item.availabilityStatus)) return false;
    const price = item.effectivePrice ?? item.unitPrice ?? item.basePrice;
    const amount = price ? Number(price.amount) : Number.NaN;
    const cartItem: PurchaseRequestCartItem = {
      catalogItemId: item.catalogItemId,
      productId: item.productId,
      sellableSkuId: item.sellableSkuId ?? null,
      itemName: item.productFamilyName || item.itemName,
      presentation: item.presentation,
      brandName: item.brandName,
      coldChainRequirement: item.coldChainRequirement,
      unit: item.unitOfMeasure || 'UNIT',
      quantity,
      unitPriceAmount: Number.isFinite(amount) ? amount : null,
      currency: price?.currency || item.currency || 'PEN',
      imageUrl: item.image?.url ?? null,
      notes: '',
    };
    this.cart.add(cartItem);
    return true;
  }

  remove(catalogItemId: string): void { this.cart.remove(catalogItemId); }
  setQuantity(catalogItemId: string, quantity: number): void { this.cart.setQuantity(catalogItemId, quantity); }
  clear(): void { this.cart.clear(); }
}
