import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { SecurityFacade } from '../../application/security.facade';

@Component({ selector: 'nexa-buyer-sessions-page', imports: [DatePipe, TranslatePipe], templateUrl: './buyer-sessions-page.component.html', styleUrl: '../security-page/security-page.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class BuyerSessionsPageComponent { readonly facade = inject(SecurityFacade); constructor() { this.facade.loadSessions().subscribe(); } }
