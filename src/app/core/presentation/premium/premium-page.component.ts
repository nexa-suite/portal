import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { PageHeaderComponent } from '../../../shared/presentation/components/page-header/page-header.component';

@Component({
  selector: 'nexa-premium-page',
  imports: [MatButtonModule, PageHeaderComponent, RouterLink],
  template: `
    <section class="page">
      <nexa-page-header eyebrow="Premium" title="Premium workspace features" subtitle="This V1 route remains available while commercial packaging is finalized." />
      <p>No subscription is created from this screen and no unavailable capability is presented as active. Ask your workspace administrator about the current plan and permissions.</p>
      <a mat-stroked-button routerLink="/portal/home">Back to workspace</a>
    </section>
  `,
  styles: [`:host{display:block}.page{display:grid;gap:1rem;max-width:60rem}.page p{max-width:65ch}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PremiumPageComponent {}
