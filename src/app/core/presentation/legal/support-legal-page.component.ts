import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { NexaIconComponent } from '../../../shared/presentation/components/nexa-icon/nexa-icon.component';

type LegalPage = 'terms' | 'privacy';

@Component({
  selector: 'nexa-support-legal-page',
  imports: [RouterLink, TranslatePipe, NexaIconComponent],
  templateUrl: './support-legal-page.component.html',
  styleUrl: './support-legal-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportLegalPageComponent {
  private readonly route = inject(ActivatedRoute);
  protected readonly section = this.route.snapshot.data['section'] === 'support' ? 'support' : 'legal';
  protected readonly legalPage: LegalPage = this.route.snapshot.url.slice(-1)[0]?.path === 'privacy' ? 'privacy' : 'terms';

  readonly supportCards = [
    { icon: 'inbox', title: 'support.cards.requests.title', description: 'support.cards.requests.description', action: 'support.cards.requests.action', path: '/portal/purchase-requests' },
    { icon: 'wallet', title: 'support.cards.payments.title', description: 'support.cards.payments.description', action: 'support.cards.payments.action', path: '/portal/payment-methods' },
    { icon: 'local_shipping', title: 'support.cards.orders.title', description: 'support.cards.orders.description', action: 'support.cards.orders.action', path: '/portal/sales-orders' },
    { icon: 'person_edit', title: 'support.cards.account.title', description: 'support.cards.account.description', action: 'support.cards.account.action', path: '/portal/profile' },
  ] as const;
  readonly supportNotes = ['sales', 'logistics', 'account'] as const;
  readonly termSectionKeys = ['access', 'requests', 'catalog', 'payments', 'orders', 'documents', 'use', 'changes'] as const;
  readonly privacySectionKeys = ['collection', 'use', 'payment', 'credit', 'access', 'retention', 'rights', 'contact'] as const;
  readonly legalSectionKeys = computed(() => this.legalPage === 'privacy' ? this.privacySectionKeys : this.termSectionKeys);
}
