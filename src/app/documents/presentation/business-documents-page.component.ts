import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../shared/presentation/components/error-state/error-state.component';
import { BusinessDocumentsApiClient } from '../infrastructure/business-documents-api.client';
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
        <table>
          <thead><tr><th>Referencia</th><th>Tipo</th><th>Formato</th><th>Estado</th><th>Generado</th><th>Acción</th></tr></thead>
          <tbody>
            @for (document of documents(); track document.id) {
              <tr><td>{{ document.documentNumber || document.subjectId }}</td><td>{{ document.documentType }}</td><td>{{ document.format }}</td><td>{{ document.status }}</td><td>{{ document.generatedAt || '—' }}</td><td><button type="button" [disabled]="document.status !== 'GENERATED'" (click)="download(document)">Descargar</button></td></tr>
            } @empty { <tr><td colspan="6">No hay documentos empresariales.</td></tr> }
          </tbody>
        </table>
        <h2>Evidencia</h2>
        <table>
          <thead><tr><th>Archivo</th><th>Asunto</th><th>Estado</th><th>Tipo detectado</th><th>Acción</th></tr></thead>
          <tbody>
            @for (evidence of evidence(); track evidence.id) {
              <tr><td>{{ evidence.originalFilename }}</td><td>{{ evidence.subjectType }} / {{ evidence.subjectId }}</td><td>{{ evidence.lifecycleStatus }}</td><td>{{ evidence.detectedContentType || '—' }}</td><td><button type="button" [disabled]="evidence.lifecycleStatus !== 'AVAILABLE'" (click)="downloadEvidence(evidence)">Descargar</button></td></tr>
            } @empty { <tr><td colspan="5">No hay evidencia.</td></tr> }
          </tbody>
        </table>
      }
    </section>
  `,
  styles: [`:host{display:block}.page{display:grid;gap:1rem}table{width:100%;border-collapse:collapse}th,td{padding:.65rem;text-align:left;border-bottom:1px solid #dbe3ee;vertical-align:top}button{padding:.4rem .7rem}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessDocumentsPageComponent {
  private readonly api = inject(BusinessDocumentsApiClient);
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
    this.api.download(document.id).subscribe({ next: (response) => this.save(response.body, document.documentNumber || document.id, document.format.toLowerCase()), error: () => this.error.set('La descarga del documento falló.') });
  }

  downloadEvidence(evidence: EvidenceObject): void {
    if (evidence.lifecycleStatus !== 'AVAILABLE') return;
    this.api.downloadEvidence(evidence.id).subscribe({ next: (response) => this.save(response.body, evidence.originalFilename, ''), error: () => this.error.set('La descarga de evidencia falló.') });
  }

  private save(blob: Blob | null, name: string, extension: string): void {
    if (!blob) return;
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = extension ? `${name}.${extension}` : name; anchor.click(); URL.revokeObjectURL(url);
  }
}
