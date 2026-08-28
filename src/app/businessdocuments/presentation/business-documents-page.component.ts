import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { ButtonComponent } from '../../shared/presentation/components/button/button.component';
import { EmptyStateComponent } from '../../shared/presentation/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { MetricCardComponent } from '../../shared/presentation/components/metric-card/metric-card.component';
import { NexaIconComponent } from '../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../shared/presentation/components/section-panel/section-panel.component';
import { StatusBadgeComponent, StatusTone } from '../../shared/presentation/components/status-badge/status-badge.component';
import { BusinessDocumentsApiPort } from '../application/ports/business-documents-api.port';
import { BusinessDocument, EvidenceObject } from '../domain/business-document.models';

@Component({
  selector: 'nexa-business-documents-page',
  standalone: true,
  imports: [DatePipe, TranslatePipe, ButtonComponent, EmptyStateComponent, ErrorStateComponent, LoadingStateComponent, MetricCardComponent, NexaIconComponent, PageHeaderComponent, SectionPanelComponent, StatusBadgeComponent],
  templateUrl: './business-documents-page.component.html',
  styleUrl: './business-documents-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessDocumentsPageComponent {
  private readonly api = inject(BusinessDocumentsApiPort);
  readonly documents = signal<readonly BusinessDocument[]>([]);
  readonly evidence = signal<readonly EvidenceObject[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly generatedDocuments = computed(() => this.documents().filter((document) => document.status === 'GENERATED').length);
  readonly availableEvidence = computed(() => this.evidence().filter((item) => item.lifecycleStatus === 'AVAILABLE').length);
  readonly pendingEvidence = computed(() => this.evidence().filter((item) => !['AVAILABLE', 'DELETED'].includes(item.lifecycleStatus)).length);

  constructor() { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({ documents: this.api.list(), evidence: this.api.listEvidence() }).subscribe({
      next: (value) => { this.documents.set(value.documents.items); this.evidence.set(value.evidence.items); this.loading.set(false); },
      error: () => { this.error.set('El servicio de documentos no respondió.'); this.loading.set(false); },
    });
  }

  documentTone(status: string): StatusTone {
    if (status === 'GENERATED') return 'success';
    if (['FAILED', 'REJECTED'].includes(status)) return 'danger';
    if (['REQUESTED', 'PROCESSING'].includes(status)) return 'warning';
    return 'neutral';
  }

  evidenceTone(status: string): StatusTone {
    if (status === 'AVAILABLE') return 'success';
    if (['REJECTED', 'DELETED', 'QUARANTINED'].includes(status)) return 'danger';
    if (['UPLOADING', 'SCANNING', 'REQUESTED'].includes(status)) return 'warning';
    return 'neutral';
  }

  statusKey(status: string): string { return status.toLowerCase(); }

  download(document: BusinessDocument): void {
    if (document.status !== 'GENERATED') return;
    this.api.download(document.id).subscribe({
      next: (blob) => this.save(blob, document.documentNumber || document.id, document.format.toLowerCase()),
      error: () => this.error.set('La descarga del documento falló.'),
    });
  }

  downloadEvidence(item: EvidenceObject): void {
    if (item.lifecycleStatus !== 'AVAILABLE') return;
    this.api.downloadEvidence(item.id).subscribe({
      next: (blob) => this.save(blob, item.originalFilename, ''),
      error: () => this.error.set('La descarga de evidencia falló.'),
    });
  }

  private save(blob: Blob | null, name: string, extension: string): void {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = extension ? `${name}.${extension}` : name;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
