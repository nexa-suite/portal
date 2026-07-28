import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { BrandLogoComponent } from '../../../shared/presentation/components/brand-logo/brand-logo.component';
import { LanguageSwitcherComponent } from '../../i18n/language-switcher/language-switcher.component';

@Component({
  selector: 'nexa-portal-shell',
  imports: [BrandLogoComponent, LanguageSwitcherComponent, RouterLink, RouterLinkActive, RouterOutlet, TranslatePipe],
  templateUrl: './portal-shell.component.html',
  styleUrl: './portal-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PortalShellComponent {}
