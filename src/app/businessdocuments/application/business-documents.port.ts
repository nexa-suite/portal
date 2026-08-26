import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { ApiPage, BusinessDocument, EvidenceObject } from '../domain/business-document.models';

export interface BusinessDocumentDownload {
  readonly body: Blob | null;
  readonly contentDisposition: string | null;
}

export interface BusinessDocumentsPort {
  list(page?: number, size?: number): Observable<ApiPage<BusinessDocument>>;
  download(id: string): Observable<BusinessDocumentDownload>;
  listEvidence(page?: number, size?: number, subjectType?: string, subjectId?: string): Observable<ApiPage<EvidenceObject>>;
  downloadEvidence(id: string): Observable<BusinessDocumentDownload>;
}

export const BUSINESS_DOCUMENTS_PORT = new InjectionToken<BusinessDocumentsPort>('BUSINESS_DOCUMENTS_PORT');
