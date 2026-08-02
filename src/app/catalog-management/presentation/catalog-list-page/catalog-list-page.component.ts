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
import {
  ColdChainBadgeComponent,
  ColdChainVariant,
} from '../../../shared/presentation/components/cold-chain-badge/cold-chain-badge.component';
import { EmptyStateComponent } from '../../../shared/presentation/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../shared/presentation/components/loading-state/loading-state.component';
import { PageHeaderComponent } from '../../../shared/presentation/components/page-header/page-header.component';
import {
  StatusBadgeComponent,
  StatusTone,
} from '../../../shared/presentation/components/status-badge/status-badge.component';
import { CatalogQueryService } from '../../application/catalog-query.service';
import {
  catalogItemsWithOutOfStockLast,
  catalogQueryFromParams,
  catalogQueryToParams,
  CatalogQuery,
  CatalogAvailabilityStatus,
  CatalogPrice,
  formatCatalogPrice,
  isCatalogOutOfStock,
} from '../../domain/catalog.models';

@Component({
  selector: 'nexa-catalog-list-page',
  imports: [
    ColdChainBadgeComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    LoadingStateComponent,
    PageHeaderComponent,
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
  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  readonly query = computed(() => catalogQueryFromParams(this.queryParams()));
  readonly routeQueryParams = computed(() => catalogQueryToParams(this.query()));
  readonly searchText = signal(this.query().q);
  readonly items = computed(() => catalogItemsWithOutOfStockLast(this.catalog.items()));
  readonly brands = computed(() => this.uniqueValues((item) => item.brandName));
  readonly categories = computed(() => this.uniqueValues((item) => item.categoryName));
  readonly pageNumbers = computed(() => {
    const page = this.catalog.page();
    if (!page || page.totalPages < 2) return [];
    const start = Math.max(0, page.page - 2);
    const end = Math.min(page.totalPages, start + 5);
    return Array.from({ length: end - start }, (_, index) => start + index);
  });

  constructor() {
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

  updateFilter(field: 'brand' | 'category' | 'coldChain', event: Event): void {
    const value = event.target instanceof HTMLSelectElement ? event.target.value : '';
    this.navigateWithQuery({ ...this.query(), [field]: value, page: 0 });
  }

  goToPage(page: number): void {
    const totalPages = this.catalog.page()?.totalPages ?? 0;
    if (page < 0 || page >= totalPages || page === this.query().page) return;
    this.navigateWithQuery({ ...this.query(), page });
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

  priceLabel(price: CatalogPrice | null): string {
    return formatCatalogPrice(price);
  }

  isOutOfStock(status: CatalogAvailabilityStatus): boolean {
    return isCatalogOutOfStock(status);
  }

  private navigateWithQuery(query: CatalogQuery): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: catalogQueryToParams(query),
    });
  }

  private uniqueValues(
    selector: (item: { readonly brandName: string; readonly categoryName: string }) => string,
  ): string[] {
    return [...new Set(this.catalog.items().map(selector).filter(Boolean))].sort((left, right) =>
      left.localeCompare(right),
    );
  }
}
