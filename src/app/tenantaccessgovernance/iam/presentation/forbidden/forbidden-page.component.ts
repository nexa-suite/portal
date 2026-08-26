import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { BrandLogoComponent } from '../../../../shared/presentation/components/brand-logo/brand-logo.component';

@Component({
  selector: 'nexa-forbidden-page',
  imports: [BrandLogoComponent, RouterLink, TranslatePipe],
  templateUrl: './forbidden-page.component.html',
  styleUrl: './forbidden-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForbiddenPageComponent {}
