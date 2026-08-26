import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../shared/presentation/components/error-state/error-state.component';
import { BusinessDocumentsApiPort } from '../application/ports/business-documents-api.port';
import { BusinessDocument, EvidenceObject } from '../domain/business-document.models';

@Component({
  selector: 'nexa-business-documents-page',
  standalone: true,
  imports: [PageHeaderComponent, LoadingStateComponent, ErrorStateComponent],
  template: `
    <section class="page">
      <nexa-page-header title="Documentos empresariales" subtitle="Documentos generados y evidencia disponible para tu cuenta" />
      @if (loading()) { <nexa-loading-state /> }
      @else if (error(); as message) { <nexa-error-state title="Documentos no disponibles" [description]="message" (retry)="load()" /> }
      @else {
        <div class="table-shell"><table>
          <caption>Documentos generados</caption><thead><tr><th scope="col">Referencia</th><th scope="col">Tipo</th><th scope="col">Formato</th><th scope="col">Estado</th><th scope="col">Generado</th><th scope="col">Acción</th></tr></thead>
          <tbody>
            @for (document of documents(); track document.id) {
              <tr><td>{{ document.documentNumber || document.subjectId }}</td><td>{{ document.documentType }}</td><td>{{ document.format }}</td><td>{{ document.status }}</td><td>{{ document.generatedAt || '—' }}</td><td><button type="button" [disabled]="document.status !== 'GENERATED'" (click)="download(document)">Descargar</button></td></tr>
            } @empty { <tr><td colspan="6">No hay documentos empresariales.</td></tr> }
          </tbody>
        </table></div>
        <h2>Evidencia</h2>
        <div class="table-shell"><table>
          <caption>Evidencia disponible</caption><thead><tr><th scope="col">Archivo</th><th scope="col">Asunto</th><th scope="col">Estado</th><th scope="col">Tipo detectado</th><th scope="col">Acción</th></tr></thead>
          <tbody>
            @for (evidence of evidence(); track evidence.id) {
              <tr><td>{{ evidence.originalFilename }}</td><td>{{ evidence.subjectType }} / {{ evidence.subjectId }}</td><td>{{ evidence.lifecycleStatus }}</td><td>{{ evidence.detectedContentType || '—' }}</td><td><button type="button" [disabled]="evidence.lifecycleStatus !== 'AVAILABLE'" (click)="downloadEvidence(evidence)">Descargar</button></td></tr>
            } @empty { <tr><td colspan="5">No hay evidencia.</td></tr> }
          </tbody>
        </table></div>
      }
    </section>
  `,
  styles: [`:host{display:block}.page{display:grid;gap:var(--nexa-space-6)}.table-shell{overflow-x:auto;border:1px solid var(--nexa-color-border-default);border-radius:var(--nexa-radius-card);background:var(--nexa-surface-card)}table{width:100%;min-width:42rem;border-collapse:collapse}caption{padding:var(--nexa-space-3) var(--nexa-space-4);color:var(--nexa-color-text-primary);font-weight:var(--nexa-font-weight-semibold);text-align:left}th,td{padding:var(--nexa-space-3) var(--nexa-space-4);text-align:left;border-bottom:1px solid var(--nexa-color-border-decorative);vertical-align:top}th{color:var(--nexa-color-text-secondary);font-size:var(--nexa-font-size-xs);letter-spacing:var(--nexa-letter-spacing-wide);text-transform:uppercase}tbody tr:hover{background:var(--nexa-color-neutral-50)}button{min-height:var(--nexa-control-height-sm);padding:0 var(--nexa-space-3);border:1px solid var(--nexa-color-border-default);border-radius:var(--nexa-radius-control);background:var(--nexa-surface-card);color:var(--nexa-color-text-primary);font:inherit;font-weight:var(--nexa-font-weight-semibold)}button:disabled{cursor:not-allowed;opacity:.55}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessDocumentsPageComponent {
  private readonly api = inject(BusinessDocumentsApiPort);
  readonly documents = signal<readonly BusinessDocument[]>([]);
  readonly evidence = signal<readonly EvidenceObject[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  constructor() { this.load(); }

  load(): void {
    this.loading.set(true); this.error.set(null);
    forkJoin({ documents: this.api.list(), evidence: this.api.listEvidence() }).subscribe({ next: (value) => { this.documents.set(value.documents.items); this.evidence.set(value.evidence.items); this.loading.set(false); }, error: () => { this.error.set('El servicio de documentos no respondió.'); this.loading.set(false); } });
  }

  download(document: BusinessDocument): void {
    if (document.status !== 'GENERATED') return;
    this.api.download(document.id).subscribe({ next: (blob) => this.save(blob, document.documentNumber || document.id, document.format.toLowerCase()), error: () => this.error.set('La descarga del documento falló.') });
  }

  downloadEvidence(evidence: EvidenceObject): void {
    if (evidence.lifecycleStatus !== 'AVAILABLE') return;
    this.api.downloadEvidence(evidence.id).subscribe({ next: (blob) => this.save(blob, evidence.originalFilename, ''), error: () => this.error.set('La descarga de evidencia falló.') });
  }

  private save(blob: Blob | null, name: string, extension: string): void {
    if (!blob) return;
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = extension ? `${name}.${extension}` : name; anchor.click(); URL.revokeObjectURL(url);
  }
}
