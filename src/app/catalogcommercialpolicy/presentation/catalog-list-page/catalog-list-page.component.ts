import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { EmptyStateComponent } from '../../../shared/presentation/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../shared/presentation/components/loading-state/loading-state.component';
import { NexaIconComponent } from '../../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { ColdChainBadgeComponent, ColdChainVariant } from '../../../shared/presentation/components/cold-chain-badge/cold-chain-badge.component';
import { StatusBadgeComponent, StatusTone } from '../../../shared/presentation/components/status-badge/status-badge.component';
import { CatalogQueryService } from '../../application/catalog-query.service';
import { PortalCatalogCartFacade } from '../../../core/compositions/portal/catalog-cart.facade';
import {
  catalogItemsWithOutOfStockLast,
  catalogQueryFromParams,
  catalogQueryToParams,
  CatalogAvailabilityStatus,
  CatalogItemSummary,
  CatalogQuery,
  coldChainValue,
  formatCatalogPrice,
  isCatalogOutOfStock,
} from '../../domain/catalog.models';

type StockFilter = 'all' | 'ok' | 'low' | 'out';

@Component({
  selector: 'nexa-catalog-list-page',
  imports: [
    ColdChainBadgeComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    LoadingStateComponent,
    NexaIconComponent,
    RouterLink,
    StatusBadgeComponent,
    TranslatePipe,
  ],
  templateUrl: './catalog-list-page.component.html',
  styleUrl: './catalog-list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogListPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly catalog = inject(CatalogQueryService);
  readonly cart = inject(PortalCatalogCartFacade);
  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  readonly query = computed(() => catalogQueryFromParams(this.queryParams()));
  readonly draftId = computed(() => this.queryParams().get('draftId')?.trim() || null);
  readonly routeQueryParams = computed(() => ({
    ...catalogQueryToParams(this.query()),
    ...(this.draftId() ? { draftId: this.draftId() as string } : {}),
  }));
  readonly searchText = signal(this.query().q);
  readonly stockFilter = signal<StockFilter>('all');
  readonly onlyOffers = signal(false);
  readonly brandExpanded = signal(false);
  private readonly brokenImages = signal<ReadonlySet<string>>(new Set());
  readonly stockOptions: readonly StockFilter[] = ['all', 'ok', 'low', 'out'];
  readonly items = computed(() => catalogItemsWithOutOfStockLast(this.catalog.items()));
  readonly visibleItems = computed(() => {
    const stock = this.stockFilter();
    const offersOnly = this.onlyOffers();
    return this.items().filter((item) => {
      const matchesStock = stock === 'all' || this.stockMatches(item.availabilityStatus, stock);
      const matchesOffer = !offersOnly || item.appliedPromotions.length > 0 || Boolean(item.promotionLabel);
      return matchesStock && matchesOffer;
    });
  });
  readonly brands = computed(() => this.uniqueValues((item) => item.brandName));
  readonly categories = computed(() => this.uniqueValues((item) => item.categoryName));
  readonly coldChains = computed(() => this.uniqueValues((item) => item.coldChainRequirement));
  readonly totalItems = computed(() => this.catalog.page()?.totalItems ?? this.items().length);
  readonly pageNumbers = computed(() => {
    const page = this.catalog.page();
    if (!page || page.totalPages < 2) return [];
    const start = Math.max(0, page.page - 2);
    const end = Math.min(page.totalPages, start + 5);
    return Array.from({ length: end - start }, (_, index) => start + index);
  });

  constructor() {
    this.cart.activate();
    effect(() => {
      const query = this.query();
      untracked(() => {
        this.searchText.set(query.q);
        this.catalog.loadList(query);
      });
    });
  }

  submitSearch(): void {
    this.navigateWithQuery({ ...this.query(), q: this.searchText().trim(), page: 0 });
  }

  selectCategory(category: string): void {
    this.navigateWithQuery({ ...this.query(), category, page: 0 });
  }

  selectColdChain(value: string): void {
    this.navigateWithQuery({ ...this.query(), coldChain: coldChainValue(value), page: 0 });
  }

  selectBrand(brand: string): void {
    this.navigateWithQuery({ ...this.query(), brand, page: 0 });
  }

  toggleBrandExpanded(): void {
    this.brandExpanded.update((expanded) => !expanded);
  }

  toggleOffers(): void {
    this.onlyOffers.update((enabled) => !enabled);
  }

  toggleCart(item: CatalogItemSummary): void {
    this.cart.toggle(item);
  }

  cartQuantity(item: CatalogItemSummary): number {
    return this.cart.items().find((line) => line.catalogItemId === item.catalogItemId)?.quantity ?? 0;
  }

  increaseCartQuantity(item: CatalogItemSummary): void {
    const quantity = this.cartQuantity(item);
    if (quantity > 0) this.cart.setQuantity(item.catalogItemId, quantity + 1);
  }

  decreaseCartQuantity(item: CatalogItemSummary): void {
    const quantity = this.cartQuantity(item);
    if (quantity <= 1) {
      this.cart.remove(item.catalogItemId);
      return;
    }
    this.cart.setQuantity(item.catalogItemId, quantity - 1);
  }

  imageUnavailable(item: CatalogItemSummary): boolean {
    return this.brokenImages().has(item.catalogItemId);
  }

  markImageUnavailable(catalogItemId: string): void {
    this.brokenImages.update((current) => {
      const next = new Set(current);
      next.add(catalogItemId);
      return next;
    });
  }

  isInCart(item: CatalogItemSummary): boolean {
    return this.cart.has(item.catalogItemId);
  }

  isUnavailable(item: CatalogItemSummary): boolean {
    return isCatalogOutOfStock(item.availabilityStatus);
  }

  goToPage(page: number): void {
    const totalPages = this.catalog.page()?.totalPages ?? 0;
    if (page < 0 || page >= totalPages || page === this.query().page) return;
    this.navigateWithQuery({ ...this.query(), page });
  }

  categoryLabel(value: string): string {
    return value;
  }

  coldChainLabel(value: string): string {
    switch (value.trim().toUpperCase()) {
      case 'FROZEN':
        return 'catalog.frozen';
      case 'NONE':
        return 'catalog.ambient';
      case 'REFRIGERATED':
        return 'catalog.chilled';
      default:
        return 'catalog.ambient';
    }
  }

  coldChainVariant(value: string): ColdChainVariant {
    switch (value.trim().toUpperCase()) {
      case 'FROZEN':
        return 'frozen';
      case 'REFRIGERATED':
        return 'refrigerated';
      default:
        return 'ambient';
    }
  }

  stockLabelKey(value: StockFilter): string {
    switch (value) {
      case 'ok':
        return 'catalog.available';
      case 'low':
        return 'catalog.lowStock';
      case 'out':
        return 'catalog.outOfStock';
      default:
        return 'catalog.allStock';
    }
  }

  availabilityTone(status: CatalogAvailabilityStatus): StatusTone {
    switch (status) {
      case 'AVAILABLE':
        return 'success';
      case 'LOW':
        return 'warning';
      case 'OUT_OF_STOCK':
      case 'UNAVAILABLE':
        return 'danger';
      default:
        return 'neutral';
    }
  }

  availabilityLabelKey(status: CatalogAvailabilityStatus): string {
    return `availability.status.${status}`;
  }

  productTitle(item: CatalogItemSummary): string {
    return item.productFamilyName || item.itemName;
  }

  productSku(item: CatalogItemSummary): string {
    return item.skuCode || item.productId;
  }

  priceLabel(item: CatalogItemSummary): string {
    return formatCatalogPrice(item.effectivePrice ?? item.unitPrice ?? item.basePrice) || '—';
  }

  promotionLabel(item: CatalogItemSummary): string {
    return item.promotionLabel || item.appliedPromotions[0]?.name || 'catalog.offer';
  }

  formatPrice(price: CatalogItemSummary['basePrice']): string {
    return formatCatalogPrice(price) || '—';
  }

  openDetails(item: CatalogItemSummary): void {
    void this.router.navigate(['/portal/product-catalog', item.catalogItemId], {
      queryParams: this.routeQueryParams(),
    });
  }

  isOutOfStock(status: CatalogAvailabilityStatus): boolean {
    return isCatalogOutOfStock(status);
  }

  private stockMatches(status: CatalogAvailabilityStatus, filter: Exclude<StockFilter, 'all'>): boolean {
    if (filter === 'ok') return status === 'AVAILABLE';
    if (filter === 'low') return status === 'LOW';
    return isCatalogOutOfStock(status);
  }

  private navigateWithQuery(query: CatalogQuery): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        ...catalogQueryToParams(query),
        ...(this.draftId() ? { draftId: this.draftId() as string } : {}),
      },
    });
  }

  private uniqueValues(selector: (item: CatalogItemSummary) => string): string[] {
    return [...new Set(this.catalog.items().map(selector).filter(Boolean))].sort((left, right) =>
      left.localeCompare(right),
    );
  }
}
