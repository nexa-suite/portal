import type { TenantProfile } from '../../../core/security/runtime-config';
import type {
  CatalogAppliedPromotion,
  CatalogItemSummary,
  CatalogMedia,
  CatalogPrice,
} from '../../domain/catalog.models';

export interface MockCatalogFixture {
  readonly item: CatalogItemSummary;
  readonly description: string;
}

function price(amount: string): CatalogPrice {
  return { amount, currency: 'PEN' };
}

function item(values: {
  readonly catalogItemId: string;
  readonly productId: string;
  readonly itemName: string;
  readonly brandName: string;
  readonly categoryName: string;
  readonly presentation: string;
  readonly coldChainRequirement: string;
  readonly image: CatalogMedia | null;
  readonly baseAmount: string;
  readonly effectiveAmount: string;
  readonly promotion?: CatalogAppliedPromotion;
  readonly promotionLabel?: string | null;
  readonly availabilityStatus?: CatalogItemSummary['availabilityStatus'];
}, description: string): MockCatalogFixture {
  const basePrice = price(values.baseAmount);
  const effectivePrice = price(values.effectiveAmount);
  const discount = (Number(values.baseAmount) - Number(values.effectiveAmount)).toFixed(2);
  return {
    item: {
      catalogItemId: values.catalogItemId,
      productId: values.productId,
      productFamilyId: `FAMILY-${values.catalogItemId}`,
      productFamilyCode: `FAM-${values.catalogItemId}`,
      productFamilyName: values.itemName,
      productVariantName: values.presentation,
      productVariantCode: values.catalogItemId,
      sellableSkuId: values.productId,
      skuCode: values.productId,
      itemName: values.itemName,
      brandName: values.brandName,
      categoryName: values.categoryName,
      presentation: values.presentation,
      unitOfMeasure: 'UNIT',
      packagingType: 'BOX',
      coldChainRequirement: values.coldChainRequirement,
      image: values.image,
      unitPrice: effectivePrice,
      basePrice,
      effectivePrice,
      discountAmount: price(discount),
      currency: 'PEN',
      appliedPromotions: values.promotion ? [values.promotion] : [],
      pricingAsOf: '2026-08-26T09:00:00Z',
      availabilityStatus: values.availabilityStatus ?? 'AVAILABLE',
      nearExpiry: false,
      promotionLabel: values.promotionLabel ?? null,
    },
    description,
  };
}

const ICISA_FIXTURES: readonly MockCatalogFixture[] = [
  item({
    catalogItemId: 'CAT-0001',
    productId: 'PROD-0001',
    itemName: 'Queso Grana Padano DOP',
    brandName: 'Agriform',
    categoryName: 'Cheese',
    presentation: '150 g',
    coldChainRequirement: 'REFRIGERATED',
    image: { url: '/catalog-items/agriform-queso-grana-padano-dop-150g.png', fileName: 'agriform-queso-grana-padano-dop-150g.png' },
    baseAmount: '20.00',
    effectiveAmount: '17.30',
    promotion: { id: 'PROMO-ICISA-01', name: 'Buyer launch price', discountType: 'FIXED_AMOUNT', discountAmount: '2.70' },
    promotionLabel: 'Buyer launch price',
  }, 'Hard cheese for refrigerated delivery.'),
  item({
    catalogItemId: 'CAT-0002',
    productId: 'PROD-0002',
    itemName: 'Queso Parmigiano Reggiano DOP',
    brandName: 'Agriform',
    categoryName: 'Cheese',
    presentation: '150 g',
    coldChainRequirement: 'REFRIGERATED',
    image: { url: '/catalog-items/agriform-queso-parmigiano-reggiano-dop-150g.png', fileName: 'agriform-queso-parmigiano-reggiano-dop-150g.png' },
    baseAmount: '22.00',
    effectiveAmount: '19.80',
    promotion: { id: 'PROMO-ICISA-02', name: 'Volume promotion', discountType: 'PERCENTAGE', discountAmount: '10' },
    promotionLabel: 'Volume promotion',
  }, 'Aged cheese selected for the ICISA buyer fixture.'),
  item({
    catalogItemId: 'CAT-0003',
    productId: 'PROD-0003',
    itemName: 'Coppa Italiana',
    brandName: 'Cavour',
    categoryName: 'Charcuterie',
    presentation: '3 kg',
    coldChainRequirement: 'REFRIGERATED',
    image: { url: '/catalog-items/cavour-coppa-molde-3kg.png', fileName: 'cavour-coppa-molde-3kg.png' },
    baseAmount: '86.00',
    effectiveAmount: '86.00',
    availabilityStatus: 'LOW',
  }, 'Cold-chain charcuterie for wholesale orders.'),
];

const GENERIC_FIXTURES: readonly MockCatalogFixture[] = [
  item({
    catalogItemId: 'CAT-GENERIC-001',
    productId: 'PROD-GENERIC-001',
    itemName: 'Demo Refrigerated Cheese',
    brandName: 'Nexa Demo',
    categoryName: 'Dairy',
    presentation: '500 g',
    coldChainRequirement: 'REFRIGERATED',
    image: null,
    baseAmount: '18.00',
    effectiveAmount: '16.20',
    promotion: { id: 'PROMO-GENERIC-01', name: 'Demo buyer price', discountType: 'PERCENTAGE', discountAmount: '10' },
    promotionLabel: 'Demo buyer price',
  }, 'Deterministic generic buyer catalog item.'),
  item({
    catalogItemId: 'CAT-GENERIC-002',
    productId: 'PROD-GENERIC-002',
    itemName: 'Demo Frozen Fruit',
    brandName: 'Nexa Demo',
    categoryName: 'Frozen',
    presentation: '1 kg',
    coldChainRequirement: 'FROZEN',
    image: null,
    baseAmount: '24.50',
    effectiveAmount: '24.50',
  }, 'Deterministic generic frozen item.'),
  item({
    catalogItemId: 'CAT-GENERIC-003',
    productId: 'PROD-GENERIC-003',
    itemName: 'Demo Ambient Pantry Box',
    brandName: 'Nexa Demo',
    categoryName: 'Pantry',
    presentation: '12 units',
    coldChainRequirement: 'NONE',
    image: null,
    baseAmount: '31.00',
    effectiveAmount: '31.00',
    availabilityStatus: 'LOW',
  }, 'Deterministic generic ambient item.'),
];

export function mockCatalogFixtures(profile: TenantProfile): readonly MockCatalogFixture[] {
  return profile === 'icisa' ? ICISA_FIXTURES : GENERIC_FIXTURES;
}
