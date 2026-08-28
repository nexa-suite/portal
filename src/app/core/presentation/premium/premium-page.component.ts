import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonComponent } from '../../../shared/presentation/components/button/button.component';
import { NexaIconComponent } from '../../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { PageHeaderComponent } from '../../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../../shared/presentation/components/section-panel/section-panel.component';

@Component({
  selector: 'nexa-premium-page',
  imports: [TranslatePipe, ButtonComponent, NexaIconComponent, PageHeaderComponent, SectionPanelComponent],
  templateUrl: './premium-page.component.html',
  styleUrl: './premium-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PremiumPageComponent {}
