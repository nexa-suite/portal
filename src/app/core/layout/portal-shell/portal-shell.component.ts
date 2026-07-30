import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { BrandLogoComponent } from '../../../shared/presentation/components/brand-logo/brand-logo.component';
import { LanguageSwitcherComponent } from '../../i18n/language-switcher/language-switcher.component';
import { PortalAuthStateService } from '../../../iam/application/portal-auth-state.service';

@Component({
  selector: 'nexa-portal-shell',
  imports: [
    BrandLogoComponent,
    LanguageSwitcherComponent,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    TranslatePipe,
  ],
  templateUrl: './portal-shell.component.html',
  styleUrl: './portal-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortalShellComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(PortalAuthStateService);

  signOut(): void {
    this.auth.signOut().subscribe({ next: () => this.router.navigateByUrl('/sign-in') });
  }
}
