import { ChangeDetectionStrategy, Component, computed, effect, inject, untracked } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import {
  ColdChainBadgeComponent,
  ColdChainVariant,
} from '../../../shared/presentation/components/cold-chain-badge/cold-chain-badge.component';
import { ErrorStateComponent } from '../../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../shared/presentation/components/loading-state/loading-state.component';
import { CatalogQueryService } from '../../application/catalog-query.service';
import { InventoryAvailabilityFacade } from '../../../warehouse/application/inventory-availability.facade';
import { catalogQueryFromParams, catalogQueryToParams } from '../../domain/catalog.models';

@Component({
  selector: 'nexa-catalog-detail-page',
  imports: [
    ColdChainBadgeComponent,
    ErrorStateComponent,
    LoadingStateComponent,
    RouterLink,
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
  readonly availability = inject(InventoryAvailabilityFacade);
  private readonly routeParams = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  readonly catalogItemId = computed(() => this.routeParams().get('catalogItemId') ?? '');
  readonly backQueryParams = computed(() =>
    catalogQueryToParams(catalogQueryFromParams(this.queryParams())),
  );

  constructor() {
    effect(() => {
      const id = this.catalogItemId();
      if (id) untracked(() => this.catalog.loadDetail(id));
      if (id) untracked(() => this.availability.load([id]));
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

  backToCatalog(): void {
    void this.router.navigate(['/portal/product-catalog'], { queryParams: this.backQueryParams() });
  }
}
