import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type IconPath = readonly string[];

/** Local SVG registry for the product surfaces that need a stable icon language. */
const ICON_PATHS: Record<string, IconPath> = {
  account_balance: ['M4 10h16', 'M5 20h14', 'M7 10v7', 'M12 10v7', 'M17 10v7', 'M3 7l9-4 9 4v3H3z'],
  account_balance_wallet: ['M4 6h16v13H4z', 'M4 9h16', 'M16 14h4', 'M17 14h.01'],
  add: ['M12 5v14', 'M5 12h14'],
  add_shopping_cart: ['M4 5h2l2 10h9l2-7H7', 'M10 19a1 1 0 1 0 0-2 1 1 0 0 0 0 2z', 'M17 19a1 1 0 1 0 0-2 1 1 0 0 0 0 2z', 'M18 3v5', 'M15.5 5.5h5'],
  arrow_back: ['M19 12H5', 'M11 6l-6 6 6 6'],
  arrow_forward: ['M5 12h14', 'M13 6l6 6-6 6'],
  bookmark: ['M6 4h12v17l-6-4-6 4z'],
  business: ['M4 21V5l8-2 8 2v16', 'M8 8h2', 'M14 8h2', 'M8 12h2', 'M14 12h2', 'M8 16h2', 'M14 16h2', 'M10 21v-3h4v3'],
  cancel: ['M7 7l10 10', 'M17 7L7 17'],
  calendar: ['M5 5h14v15H5z', 'M8 3v4', 'M16 3v4', 'M5 9h14'],
  chat: ['M4 5h16v11H9l-5 4z', 'M8 9h8', 'M8 12h5'],
  category: ['M4 4h6v6H4z', 'M14 4h6v6h-6z', 'M4 14h6v6H4z', 'M14 14h6v6h-6z'],
  check: ['M5 12l4 4L19 6'],
  delete: ['M5 7h14', 'M10 11v6', 'M14 11v6', 'M9 7V4h6v3', 'M7 7l1 13h8l1-13'],
  description: ['M6 3h8l4 4v14H6z', 'M14 3v5h5', 'M9 13h6', 'M9 17h6'],
  credit_card: ['M3 6h18v12H3z', 'M3 10h18', 'M7 15h3'],
  expand_less: ['M6 15l6-6 6 6'],
  expand_more: ['M6 9l6 6 6-6'],
  edit: ['M4 20h4l11-11-4-4L4 16z', 'M14 6l4 4'],
  home: ['M3 11l9-8 9 8', 'M5 10v10h14V10', 'M9 20v-6h6v6'],
  inbox: ['M4 5h16v10H4z', 'M4 15h4l2 3h4l2-3h4', 'M8 9h8'],
  info: ['M12 11v5', 'M12 7h.01', 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z'],
  inventory_2: ['M4 7l8-4 8 4-8 4-8-4z', 'M4 7v10l8 4 8-4V7', 'M12 11v10'],
  lock: ['M6 10V7a6 6 0 0 1 12 0v3', 'M5 10h14v10H5z', 'M12 14v3'],
  local_shipping: ['M3 6h11v10H3z', 'M14 10h4l3 3v3h-7z', 'M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z', 'M17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z'],
  location_on: ['M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z', 'M12 11a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4z'],
  logout: ['M10 6V4h9v16h-9v-2', 'M14 12H3', 'M7 8l-4 4 4 4'],
  menu: ['M4 6h16', 'M4 12h16', 'M4 18h16'],
  notifications: ['M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9', 'M10 21h4'],
  open_in_new: ['M14 5h5v5', 'M19 5l-8 8', 'M18 13v6H5V6h6'],
  mail: ['M3 5h18v14H3z', 'M3 6l9 7 9-7'],
  person: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M4 21a8 8 0 0 1 16 0'],
  person_edit: ['M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M3 21a6 6 0 0 1 12 0', 'M16 15l5-5 2 2-5 5-3 1z'],
  receipt_long: ['M5 3h14v18l-3-2-4 2-4-2-3 2z', 'M8 8h8', 'M8 12h8', 'M8 16h5'],
  request_quote: ['M4 5h16v14H4z', 'M8 9h8', 'M8 13h5', 'M17 3v4'],
  remove: ['M5 12h14'],
  search: ['M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z', 'M16 16l5 5'],
  schedule: ['M12 7v5l3 2', 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z'],
  send: ['M3 4l18 8-18 8 4-8-4-8z', 'M7 12h10'],
  shopping_cart: ['M3 5h2l2 10h10l3-7H6', 'M9 19a1 1 0 1 0 0-2 1 1 0 0 0 0 2z', 'M17 19a1 1 0 1 0 0-2 1 1 0 0 0 0 2z'],
  sparkles: ['M12 3l1.3 4.7L18 9l-4.7 1.3L12 15l-1.3-4.7L6 9l4.7-1.3z', 'M19 15l.6 2.4L22 18l-2.4.6L19 21l-.6-2.4L16 18l2.4-.6z'],
  tag: ['M4 5v6l9 9 7-7-9-9H4z', 'M8 8h.01'],
  visibility: ['M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'],
  visibility_off: ['M3 3l18 18', 'M10.6 10.6a2 2 0 0 0 2.8 2.8', 'M9.9 5.2A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-3.1 3.8', 'M6.2 6.2C3.5 8 2 12 2 12s3.5 7 10 7a10 10 0 0 0 3-.4'],
  verified: ['M12 3l2 2 3-.2 1.2 2.8 2.5 1.8-.9 2.9.9 2.9-2.5 1.8-1.2 2.8-3-.2-2 2-2-2-3 .2-1.2-2.8-2.5-1.8.9-2.9-.9-2.9 2.5-1.8L9 4.8z', 'M8 12l2.5 2.5L16 9'],
  wallet: ['M4 6h15a2 2 0 0 1 2 2v10H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z', 'M4 6V4h13a2 2 0 0 1 2 2', 'M15 12h6', 'M16 12h.01'],
  warning: ['M12 4l9 16H3L12 4z', 'M12 9v5', 'M12 17h.01'],
};

@Component({
  selector: 'nexa-icon',
  standalone: true,
  template: `
    <svg class="nexa-icon" viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      @for (path of paths(); track path) { <path [attr.d]="path" /> }
    </svg>
  `,
  styles: [`
    :host { display: inline-flex; width: 1.5rem; height: 1.5rem; flex: 0 0 auto; vertical-align: middle; }
    .nexa-icon { width: 100%; height: 100%; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.8; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NexaIconComponent {
  readonly name = input('check');
  readonly paths = computed(() => ICON_PATHS[this.name()] ?? ICON_PATHS['check']);
}
