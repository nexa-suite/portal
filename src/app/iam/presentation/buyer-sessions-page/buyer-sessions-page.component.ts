import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { PortalAuthStateService } from '../../application/portal-auth-state.service';
import { SecurityFacade } from '../../application/security.facade';
import { ActiveSession } from '../../domain/security.models';

@Component({ selector: 'nexa-buyer-sessions-page', imports: [DatePipe, TranslatePipe], templateUrl: './buyer-sessions-page.component.html', styleUrl: '../security-page/security-page.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class BuyerSessionsPageComponent {
  readonly facade = inject(SecurityFacade);
  private readonly authentication = inject(PortalAuthStateService);
  constructor() { this.facade.loadSessions().subscribe(); }

  revoke(session: ActiveSession): void {
    this.facade.revokeSession(session.sessionId).subscribe({
      next: () => {
        if (session.current) {
          this.authentication.expireSession();
        }
      },
    });
  }
}
