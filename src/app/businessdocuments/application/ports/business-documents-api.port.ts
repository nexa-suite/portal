import { Observable } from 'rxjs';
import { ApiPage, BusinessDocument, EvidenceObject } from '../../domain/business-document.models';

/** Application port for buyer-visible documents and evidence. */
export abstract class BusinessDocumentsApiPort {
  abstract list(page?: number, size?: number): Observable<ApiPage<BusinessDocument>>;
  abstract download(id: string): Observable<Blob | null>;
  abstract listEvidence(page?: number, size?: number, subjectType?: string, subjectId?: string): Observable<ApiPage<EvidenceObject>>;
  abstract downloadEvidence(id: string): Observable<Blob | null>;
}
