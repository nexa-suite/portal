import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';

@Component({
  selector: 'nexa-support-legal-page',
  imports: [PageHeaderComponent, RouterLink],
  template: `
    <section class="page">
      @if (section() === 'support') {
        <nexa-page-header eyebrow="Ayuda" title="Soporte" subtitle="Canal funcional para resolver incidencias del workspace Buyer." />
        <p>Para soporte operativo, conserva el número de solicitud, orden o despacho y solicita atención al administrador de tu workspace.</p>
        <p>Esta pantalla no simula tickets ni promete acciones que la API todavía no expone.</p>
      } @else {
        <nexa-page-header eyebrow="Información" title="Legal y privacidad" subtitle="Alcance de la información y operaciones visibles en Nexa Buyer Portal." />
        <p>Los importes, estados, documentos y evidencias provienen de recursos autorizados por la API y están limitados al tenant y workspace actuales.</p>
        <p>Las solicitudes y Payment Intents no sustituyen un documento fiscal ni una confirmación bancaria hasta que el servicio correspondiente lo establezca.</p>
      }
      <a routerLink="/portal/home">Volver al inicio</a>
    </section>
  `,
  styles: [`:host{display:block}.page{display:grid;gap:1rem;max-width:70rem}.page p{max-width:65ch}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportLegalPageComponent {
  readonly section = input<'support' | 'legal'>('support');
}
