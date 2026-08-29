import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import {
  ColdChainBadgeComponent,
  ColdChainVariant,
} from '../../../shared/presentation/components/cold-chain-badge/cold-chain-badge.component';
import { ErrorStateComponent } from '../../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../shared/presentation/components/loading-state/loading-state.component';
import { NexaIconComponent } from '../../../shared/presentation/components/nexa-icon/nexa-icon.component';
import {
  StatusBadgeComponent,
  StatusTone,
} from '../../../shared/presentation/components/status-badge/status-badge.component';
import { CatalogQueryService } from '../../application/catalog-query.service';
import { PortalCatalogCartFacade } from '../../../core/compositions/portal/catalog-cart.facade';
import { CatalogPricingSummaryComponent } from '../catalog-pricing-summary/catalog-pricing-summary.component';
import {
  CatalogAvailabilityStatus,
  catalogQueryFromParams,
  catalogQueryToParams,
  CatalogItemDetail,
} from '../../domain/catalog.models';

@Component({
  selector: 'nexa-catalog-detail-page',
  imports: [
    ColdChainBadgeComponent,
    ErrorStateComponent,
    LoadingStateComponent,
    CatalogPricingSummaryComponent,
    NexaIconComponent,
    RouterLink,
    StatusBadgeComponent,
    TranslatePipe,
  ],
  templateUrl: './catalog-detail-page.component.html',
  styleUrl: './catalog-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly catalog = inject(CatalogQueryService);
  readonly cart = inject(PortalCatalogCartFacade);
  private readonly routeParams = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  readonly catalogItemId = computed(() => this.routeParams().get('catalogItemId') ?? '');
  readonly draftId = computed(() => this.queryParams().get('draftId')?.trim() || null);
  readonly backQueryParams = computed(() => ({
    ...catalogQueryToParams(catalogQueryFromParams(this.queryParams())),
    ...(this.draftId() ? { draftId: this.draftId() as string } : {}),
  }));
  readonly previewQuantity = signal('1');
  readonly previewQuantityInvalid = signal(false);
  private readonly brokenImage = signal(false);

  constructor() {
    this.cart.activate();
    effect(() => {
      const id = this.catalogItemId();
      if (id) untracked(() => this.catalog.loadDetail(id));
    });
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

  backToCatalog(): void {
    void this.router.navigate(['/portal/product-catalog'], { queryParams: this.backQueryParams() });
  }

  toggleCart(item: CatalogItemDetail): void {
    this.cart.toggle(item);
  }

  isInCart(item: CatalogItemDetail): boolean {
    return this.cart.has(item.catalogItemId);
  }

  isUnavailable(item: CatalogItemDetail): boolean {
    return item.availabilityStatus === 'OUT_OF_STOCK' || item.availabilityStatus === 'UNAVAILABLE';
  }

  imageUnavailable(): boolean {
    return this.brokenImage();
  }

  markImageUnavailable(): void {
    this.brokenImage.set(true);
  }

  previewPrice(): void {
    const quantity = Number(this.previewQuantity().trim());
    const productId = this.catalog.detail()?.productId ?? '';
    const valid = Number.isFinite(quantity) && quantity > 0;
    this.previewQuantityInvalid.set(!valid);
    if (valid) this.catalog.previewPricing(productId, quantity);
  }
}
