import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { filter, map } from 'rxjs';
import { BrandLogoComponent } from '../../../shared/presentation/components/brand-logo/brand-logo.component';
import { LanguageSwitcherComponent } from '../../i18n/language-switcher/language-switcher.component';
import { PortalAuthStateService } from '../../../iam/application/portal-auth-state.service';
import { PortalNotificationsFacade } from '../../notifications/application/portal-notifications.facade';
import { PortalNotification } from '../../notifications/domain/notification.models';

interface PortalNavItem {
  readonly path: string;
  readonly labelKey: string;
  readonly permission?: string;
}

const PORTAL_NAVIGATION: readonly PortalNavItem[] = [
  { path: '/portal/home', labelKey: 'shell.navigation.home' },
  { path: '/portal/product-catalog', labelKey: 'shell.navigation.catalog', permission: 'catalog:read' },
  { path: '/portal/request-builder', labelKey: 'shell.navigation.requestBuilder', permission: 'sales:buyer:write' },
  { path: '/portal/purchase-requests', labelKey: 'shell.navigation.requests', permission: 'sales:buyer:read' },
  { path: '/portal/sales-orders', labelKey: 'shell.navigation.orders', permission: 'orders:buyer:read' },
  { path: '/portal/deliveries', labelKey: 'shell.navigation.deliveries', permission: 'tracking:buyer:read' },
  { path: '/portal/documents', labelKey: 'shell.navigation.documents', permission: 'document.read' },
  { path: '/portal/receivables', labelKey: 'shell.navigation.receivables', permission: 'payment.read' },
  { path: '/portal/payment-methods', labelKey: 'shell.navigation.paymentMethods', permission: 'payment.read' },
  { path: '/portal/account', labelKey: 'shell.navigation.account', permission: 'sales:buyer:read' },
  { path: '/portal/support', labelKey: 'shell.navigation.support' },
  { path: '/portal/legal', labelKey: 'shell.navigation.legal' },
  { path: '/portal/notifications', labelKey: 'shell.navigation.notifications', permission: 'notification.read' },
];

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
  host: {
    '(document:keydown.escape)': 'closeTransientPanels()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortalShellComponent {
  private readonly router = inject(Router);
  readonly auth = inject(PortalAuthStateService);
  readonly notifications = inject(PortalNotificationsFacade);
  readonly menuOpen = signal(false);
  readonly notificationsOpen = signal(false);
  readonly menuTrigger = viewChild<ElementRef<HTMLButtonElement>>('menuTrigger');
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );
  readonly navigation = computed(() => PORTAL_NAVIGATION.filter((item) => !item.permission || this.auth.hasPermission(item.permission)));
  readonly unreadCount = computed(() => this.notifications.page().unreadCount);
  readonly activeWorkArea = computed(() => {
    const url = this.currentUrl();
    if (url.includes('/product-catalog')) return 'catalog';
    if (url.includes('/request-builder') || url.includes('/purchase-requests')) return 'sales';
    if (url.includes('/sales-orders')) return 'orders';
    if (url.includes('/deliveries')) return 'logistics';
    if (url.includes('/receivables') || url.includes('/payment-methods')) return 'payments';
    if (url.includes('/documents')) return 'documents';
    if (url.includes('/support') || url.includes('/legal')) return 'account';
    if (url.includes('/account') || url.includes('/profile')) return 'account';
    return 'home';
  });

  toggleMenu(): void {
    this.notificationsOpen.set(false);
    this.menuOpen.update((open) => !open);
  }

  toggleNotifications(): void {
    this.menuOpen.set(false);
    this.notificationsOpen.update((open) => !open);
    if (this.notificationsOpen() && this.notifications.state() === 'idle') this.notifications.load();
  }

  closeMenu(restoreFocus = false): void {
    const wasOpen = this.menuOpen();
    this.menuOpen.set(false);
    if (restoreFocus && wasOpen) queueMicrotask(() => this.menuTrigger()?.nativeElement.focus());
  }

  closeTransientPanels(): void {
    this.notificationsOpen.set(false);
    this.closeMenu(true);
  }

  openNotification(item: PortalNotification): void {
    this.notifications.markRead(item);
    this.notificationsOpen.set(false);
    if (item.deepLink?.startsWith('/portal/')) void this.router.navigateByUrl(item.deepLink);
  }

  signOut(): void {
    this.auth.signOut().subscribe({ complete: () => void this.router.navigateByUrl('/sign-in', { replaceUrl: true }) });
  }
}
