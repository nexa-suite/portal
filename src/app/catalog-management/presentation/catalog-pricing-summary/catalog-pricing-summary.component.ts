import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import {
  CatalogAppliedPromotion,
  CatalogPrice,
  CatalogPricingItem,
  formatCatalogPrice,
} from '../../domain/catalog.models';

@Component({
  selector: 'nexa-catalog-pricing-summary',
  templateUrl: './catalog-pricing-summary.component.html',
  styleUrl: './catalog-pricing-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
})
export class CatalogPricingSummaryComponent {
  readonly pricing = input.required<CatalogPricingItem>();
  readonly hasPromotions = computed(() => this.pricing().appliedPromotions.length > 0);

  priceLabel(price: CatalogPrice | null): string {
    return formatCatalogPrice(price);
  }

  promotionName(promotion: CatalogAppliedPromotion): string {
    return promotion.name || 'Promotion';
  }

  promotionDiscountLabel(promotion: CatalogAppliedPromotion): string {
    const amount = promotion.discountAmount.trim();
    const currency = this.pricing().currency.trim();
    return amount && currency ? formatCatalogPrice({ amount, currency }) : '';
  }
}
