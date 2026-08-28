import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { filter, map } from 'rxjs';
import { BrandLogoComponent } from '../../../shared/presentation/components/brand-logo/brand-logo.component';
import { NexaIconComponent } from '../../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { LanguageSwitcherComponent } from '../../i18n/language-switcher/language-switcher.component';
import { PORTAL_SECURITY_BOUNDARY } from '../../security/portal-security.boundary';
import { PortalNotificationsFacade } from '../../../notifications/application/portal-notifications.facade';
import { PortalNotification } from '../../../notifications/domain/notification.models';
import { PurchaseRequestCartPort } from '../../../salescommitment/application/ports/purchase-request-cart.port';

interface PortalNavItem {
  readonly path: string;
  readonly labelKey: string;
  readonly icon?: string;
  readonly permission?: string;
}

const PORTAL_NAVIGATION: readonly PortalNavItem[] = [
  { path: '/portal/product-catalog', labelKey: 'shell.navigation.catalog', icon: 'category', permission: 'catalog:read' },
  { path: '/portal/request-builder', labelKey: 'shell.navigation.requestBuilder', icon: 'add_shopping_cart', permission: 'sales:buyer:write' },
  { path: '/portal/purchase-requests', labelKey: 'shell.navigation.requests', icon: 'receipt_long', permission: 'sales:buyer:read' },
  { path: '/portal/purchase-orders', labelKey: 'shell.navigation.orders', icon: 'local_shipping', permission: 'orders:buyer:read' },
  { path: '/portal/payment-methods', labelKey: 'shell.navigation.payments', icon: 'account_balance', permission: 'payment.read' },
  { path: '/portal/premium', labelKey: 'shell.navigation.premium', icon: 'sparkles' },
  { path: '/portal/profile', labelKey: 'shell.navigation.profile', icon: 'person_edit', permission: 'sales:buyer:read' },
  { path: '/portal/home', labelKey: 'shell.navigation.home', icon: 'home' },
  { path: '/portal/deliveries', labelKey: 'shell.navigation.deliveries', icon: 'local_shipping', permission: 'tracking:buyer:read' },
  { path: '/portal/documents', labelKey: 'shell.navigation.documents', icon: 'receipt_long', permission: 'document.read' },
  { path: '/portal/receivables', labelKey: 'shell.navigation.receivables', icon: 'account_balance', permission: 'payment.read' },
  { path: '/portal/account', labelKey: 'shell.navigation.account', icon: 'person_edit', permission: 'sales:buyer:read' },
  { path: '/portal/legal', labelKey: 'shell.navigation.legal', icon: 'description' },
  { path: '/portal/notifications', labelKey: 'shell.navigation.notifications', icon: 'notifications', permission: 'notification.read' },
];

const PRIMARY_PATHS = [
  '/portal/product-catalog',
  '/portal/request-builder',
  '/portal/purchase-requests',
  '/portal/purchase-orders',
  '/portal/payment-methods',
  '/portal/premium',
  '/portal/profile',
] as const;

const BOTTOM_NAV_PATHS = [
  '/portal/product-catalog',
  '/portal/request-builder',
  '/portal/purchase-orders',
  '/portal/payment-methods',
  '/portal/profile',
] as const;

@Component({
  selector: 'nexa-portal-shell',
  imports: [
    BrandLogoComponent,
    LanguageSwitcherComponent,
    NexaIconComponent,
    RouterLink,
    RouterOutlet,
    TranslatePipe,
  ],
  templateUrl: './portal-shell.component.html',
  host: {
    '(document:keydown.escape)': 'closeTransientPanels()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortalShellComponent {
  private readonly router = inject(Router);
  readonly auth = inject(PORTAL_SECURITY_BOUNDARY);
  readonly notifications = inject(PortalNotificationsFacade);
  readonly cart = inject(PurchaseRequestCartPort, { optional: true });
  readonly menuOpen = signal(false);
  readonly notificationsOpen = signal(false);
  readonly cartOpen = signal(false);
  readonly menuTrigger = viewChild<ElementRef<HTMLButtonElement>>('menuTrigger');
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );
  readonly navigation = computed(() => PORTAL_NAVIGATION.filter((item) => !item.permission || this.auth.hasPermission(item.permission)));
  readonly primaryNavigation = computed(() => this.navigation().filter((item) => PRIMARY_PATHS.includes(item.path as (typeof PRIMARY_PATHS)[number])));
  readonly bottomNavigation = computed(() => this.primaryNavigation().filter((item) => BOTTOM_NAV_PATHS.includes(item.path as (typeof BOTTOM_NAV_PATHS)[number])));
  readonly mobileNavigation = computed(() => this.primaryNavigation().filter((item) => !BOTTOM_NAV_PATHS.includes(item.path as (typeof BOTTOM_NAV_PATHS)[number])));
  readonly unreadCount = computed(() => this.notifications.page().unreadCount);
  readonly cartItems = computed(() => this.cart?.items() ?? []);
  readonly cartCount = computed(() => this.cart?.count() ?? 0);
  readonly cartSubtotal = computed(() => this.cart?.subtotal() ?? 0);
  readonly activeWorkArea = computed(() => {
    const url = this.currentUrl();
    if (url.includes('/product-catalog')) return 'catalog';
    if (url.includes('/request-builder') || url.includes('/purchase-requests')) return 'sales';
    if (url.includes('/sales-orders') || url.includes('/purchase-orders')) return 'orders';
    if (url.includes('/deliveries')) return 'logistics';
    if (url.includes('/receivables') || url.includes('/payment-methods')) return 'payments';
    if (url.includes('/documents')) return 'documents';
    if (url.includes('/legal')) return 'account';
    if (url.includes('/account') || url.includes('/profile')) return 'account';
    return 'home';
  });

  constructor() {
    this.activateCart();
  }

  toggleMenu(): void {
    this.notificationsOpen.set(false);
    this.cartOpen.set(false);
    this.menuOpen.update((open) => !open);
  }

  toggleNotifications(): void {
    this.menuOpen.set(false);
    this.cartOpen.set(false);
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
    this.cartOpen.set(false);
    this.closeMenu(true);
  }

  isNavigationItemActive(path: string): boolean {
    const currentPath = this.currentUrl().split(/[?#]/, 1)[0].replace(/\/$/, '') || '/';
    const normalizedPath = path.replace(/\/$/, '') || '/';
    if (normalizedPath === '/portal/purchase-orders') {
      return currentPath === normalizedPath
        || currentPath === '/portal/sales-orders'
        || currentPath.startsWith('/portal/sales-orders/');
    }
    return currentPath === normalizedPath || currentPath.startsWith(`${normalizedPath}/`);
  }

  toggleCart(): void {
    this.menuOpen.set(false);
    this.notificationsOpen.set(false);
    this.activateCart();
    this.cartOpen.update((open) => !open);
  }

  closeCart(): void {
    this.cartOpen.set(false);
  }

  setCartQuantity(catalogItemId: string, quantity: number): void {
    if (!this.cart) return;
    if (quantity <= 0) {
      this.cart.remove(catalogItemId);
      return;
    }
    this.cart.setQuantity(catalogItemId, quantity);
  }

  cartLineTotal(item: { readonly quantity: number; readonly unitPriceAmount: number | null }): number | null {
    return item.unitPriceAmount === null ? null : item.quantity * item.unitPriceAmount;
  }

  formatMoney(amount: number | null, currency: string): string {
    if (amount === null || !Number.isFinite(amount)) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  }

  goToRequestBuilder(): void {
    this.closeCart();
    // Buyer account association is resolved by the canonical
    // GET /client-accounts/me flow in the request-builder facade. The
    // authentication membership does not carry clientAccountId in the
    // current API response, so navigation must not infer an unlinked buyer
    // from that omission.
    void this.router.navigateByUrl('/portal/request-builder');
  }

  openNotification(item: PortalNotification): void {
    this.notifications.markRead(item);
    this.notificationsOpen.set(false);
    if (item.deepLink?.startsWith('/portal/')) void this.router.navigateByUrl(item.deepLink);
  }

  signOut(): void {
    this.closeTransientPanels();
    this.auth.signOut().subscribe({ complete: () => void this.router.navigateByUrl('/sign-in', { replaceUrl: true }) });
  }

  private activateCart(): void {
    const identity = this.auth.identity();
    this.cart?.setScope(identity ? `${identity.workspaceSlug ?? 'workspace'}:${identity.id || identity.email}` : null);
  }
}
