import { inject, Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { PORTAL_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import { ApiPage, BusinessDocument, EvidenceObject } from '../../domain/business-document.models';
import { BusinessDocumentsApiPort } from '../../application/ports/business-documents-api.port';

const DEMO_NOW = '2026-08-26T10:00:00Z';

/** BC-09 buyer-safe document projection; internal lifecycle commands stay out of Portal. */
@Injectable({ providedIn: 'root' })
export class MockBusinessDocumentsApiAdapter implements BusinessDocumentsApiPort {
  private readonly config = inject(PORTAL_RUNTIME_CONFIG);
  private readonly documents: readonly BusinessDocument[] = [
    { id: `${this.config.tenantProfile}-document-001`, subjectType: 'SALES_ORDER', subjectId: `${this.config.tenantProfile}-order-001`, documentType: 'ORDER_SUMMARY', documentNumber: `DOC-${this.config.tenantProfile.toUpperCase()}-001`, version: 1, status: 'GENERATED', format: 'PDF', contentType: 'application/pdf', byteSize: 128, generatedAt: '2026-08-26T08:00:00Z' },
    { id: `${this.config.tenantProfile}-document-002`, subjectType: 'SALES_ORDER', subjectId: `${this.config.tenantProfile}-order-002`, documentType: 'DELIVERY_GUIDE_DRAFT', documentNumber: null, version: 1, status: 'GENERATED', format: 'PDF', contentType: 'application/pdf', byteSize: 128, generatedAt: '2026-08-25T11:00:00Z' },
  ];
  private readonly evidence: readonly EvidenceObject[] = [{ id: `${this.config.tenantProfile}-evidence-001`, subjectType: 'SALES_ORDER', subjectId: `${this.config.tenantProfile}-order-002`, lifecycleStatus: 'AVAILABLE', declaredContentType: 'image/jpeg', detectedContentType: 'image/jpeg', originalFilename: 'delivery-proof.jpg', byteSize: 2048, createdAt: '2026-08-25T11:00:00Z', scannedAt: '2026-08-25T11:01:00Z', failureCode: null }];

  list(page = 0, size = 25): Observable<ApiPage<BusinessDocument>> { return of(this.page(this.documents.slice(page * size, page * size + size), page, size, this.documents.length)); }
  download(id: string): Observable<Blob | null> { const item = this.documents.find((document) => document.id === id); return item ? of(new Blob([`Nexa buyer document ${item.documentNumber ?? id}`], { type: item.contentType ?? 'application/pdf' })) : throwError(() => new Error('MOCK_DOCUMENT_NOT_FOUND')); }
  listEvidence(page = 0, size = 25, subjectType?: string, subjectId?: string): Observable<ApiPage<EvidenceObject>> { const values = this.evidence.filter((item) => (!subjectType || item.subjectType === subjectType) && (!subjectId || item.subjectId === subjectId)); return of(this.page(values.slice(page * size, page * size + size), page, size, values.length)); }
  downloadEvidence(id: string): Observable<Blob | null> { const item = this.evidence.find((candidate) => candidate.id === id); return item ? of(new Blob([`Nexa buyer evidence ${item.originalFilename} · ${DEMO_NOW}`], { type: item.detectedContentType ?? item.declaredContentType })) : throwError(() => new Error('MOCK_EVIDENCE_NOT_FOUND')); }

  private page<T>(items: readonly T[], page: number, size: number, total: number): ApiPage<T> { return { items, page, size, total }; }
}
