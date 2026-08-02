import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { PortalAuthStateService } from '../../application/portal-auth-state.service';
import { SecurityFacade } from '../../application/security.facade';
import { ActiveSession } from '../../domain/security.models';

@Component({ selector: 'nexa-buyer-sessions-page', imports: [DatePipe, TranslatePipe], templateUrl: './buyer-sessions-page.component.html', styleUrl: '../security-page/security-page.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class BuyerSessionsPageComponent {
  readonly facade = inject(SecurityFacade);
  private readonly authentication = inject(PortalAuthStateService);
  private readonly router = inject(Router);
  constructor() { this.facade.loadSessions().subscribe(); }

  revoke(session: ActiveSession): void {
    this.facade.revokeSession(session.sessionId).subscribe({
      next: () => {
        if (session.current) {
          this.authentication.clearSession();
          void this.router.navigateByUrl('/sign-in');
        }
      },
    });
  }
}
