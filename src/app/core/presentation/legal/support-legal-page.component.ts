import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../../shared/presentation/components/page-header/page-header.component';

@Component({
  selector: 'nexa-support-legal-page',
  imports: [PageHeaderComponent, RouterLink],
  template: `
    <section class="page">
      @if (section === 'support') {
        <nexa-page-header eyebrow="Ayuda" title="Soporte" subtitle="Encuentra el siguiente paso sin salir de tu flujo de compra." />
        <div class="support-grid">
          <a routerLink="/portal/purchase-requests"><strong>Solicitudes</strong><span>Revisa el estado y los ajustes solicitados por Ventas.</span></a>
          <a routerLink="/portal/sales-orders"><strong>Órdenes</strong><span>Consulta confirmaciones y el detalle comercial.</span></a>
          <a routerLink="/portal/deliveries"><strong>Entregas</strong><span>Consulta ventanas, eventos y comprobantes disponibles.</span></a>
          <a routerLink="/portal/account"><strong>Cuenta</strong><span>Actualiza tus datos y destinos autorizados.</span></a>
        </div>
        <p>Si una operación no está disponible, conserva el código visible del recurso y comunícate con el administrador de tu workspace.</p>
      } @else {
        <nexa-page-header eyebrow="Información" title="Legal y privacidad" subtitle="Alcance de la información y operaciones visibles en Nexa Buyer Portal." />
        <p>Los importes, estados, documentos y evidencias provienen de recursos autorizados por la API y están limitados al tenant y workspace actuales.</p>
        <p>Las solicitudes y Payment Intents no sustituyen un documento fiscal ni una confirmación bancaria hasta que el servicio correspondiente lo establezca.</p>
      }
    </section>
  `,
  styles: [`:host{display:block}.page{display:grid;gap:1.5rem;max-width:70rem}.page p{max-width:65ch;color:var(--nexa-color-text-secondary);line-height:var(--nexa-line-height-relaxed)}.support-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--nexa-space-4)}.support-grid a{display:grid;gap:var(--nexa-space-2);min-height:8rem;padding:var(--nexa-space-5);border:1px solid var(--nexa-color-border-default);border-radius:var(--nexa-radius-card);background:var(--nexa-surface-card);color:var(--nexa-color-text-primary);text-decoration:none}.support-grid a:hover{border-color:var(--nexa-color-primary-300);box-shadow:var(--nexa-shadow-sm)}.support-grid span{color:var(--nexa-color-text-secondary);line-height:var(--nexa-line-height-relaxed)}@media(max-width:600px){.support-grid{grid-template-columns:1fr}}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportLegalPageComponent {
  protected readonly section = inject(ActivatedRoute).snapshot.data['section'] === 'support' ? 'support' : 'legal';
}
