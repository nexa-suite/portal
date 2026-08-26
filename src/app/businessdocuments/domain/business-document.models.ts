export interface ApiPage<T> {
  readonly items: readonly T[];
  readonly page: number;
  readonly size: number;
  readonly total: number;
}

export interface BusinessDocument {
  readonly id: string;
  readonly subjectType: string;
  readonly subjectId: string;
  readonly documentType: string;
  readonly documentNumber: string | null;
  readonly version: number;
  readonly status: string;
  readonly format: 'PDF' | 'CSV' | 'XML';
  readonly contentType: string | null;
  readonly byteSize: number;
  readonly generatedAt: string | null;
}

export interface EvidenceObject {
  readonly id: string;
  readonly subjectType: string;
  readonly subjectId: string;
  readonly lifecycleStatus: 'REQUESTED' | 'UPLOADING' | 'QUARANTINED' | 'SCANNING' | 'AVAILABLE' | 'REJECTED' | 'DELETED';
  readonly declaredContentType: string;
  readonly detectedContentType: string | null;
  readonly originalFilename: string;
  readonly byteSize: number;
  readonly createdAt: string;
  readonly scannedAt: string | null;
  readonly failureCode: string | null;
}
