import { inject, Injectable } from '@angular/core';

import { PORTAL_RUNTIME_CONFIG, TenantProfile } from '../../../core/security/runtime-config';
import {
  CanonicalDraftLine,
  PurchaseRequestDraftView,
} from '../../domain/buyer-requests/purchase-request-draft.models';
import {
  canCancelPurchaseRequest,
  canEditPurchaseRequest,
  etagFor,
  PaymentOption,
  PurchaseRequest,
  PurchaseRequestDetailsCommand,
  PurchaseRequestDraftCommand,
  PurchaseRequestLine,
  PurchaseRequestPage,
  validPurchaseRequestSort,
} from '../../domain/purchase-requests/purchase-request.models';

interface MockSalesCommitmentFixture {
  readonly profile: TenantProfile;
  readonly key: string;
  readonly clientAccountId: string;
  readonly buyerMembershipId: string;
  readonly currency: string;
  readonly defaultPresentation: string;
  readonly defaultUnitPrice: number;
}

const FIXTURES: Record<TenantProfile, MockSalesCommitmentFixture> = {
  generic: {
    profile: 'generic',
    key: 'GENERIC',
    clientAccountId: 'client-generic-001',
    buyerMembershipId: 'membership-generic-001',
    currency: 'PEN',
    defaultPresentation: 'Demo presentation',
    defaultUnitPrice: 16.2,
  },
  icisa: {
    profile: 'icisa',
    key: 'ICISA',
    clientAccountId: 'client-icisa-001',
    buyerMembershipId: 'membership-icisa-001',
    currency: 'PEN',
    defaultPresentation: '150 g',
    defaultUnitPrice: 17.3,
  },
};

@Injectable({ providedIn: 'root' })
export class MockSalesCommitmentStore {
  private readonly config = inject(PORTAL_RUNTIME_CONFIG);
  private readonly fixture = FIXTURES[this.config.tenantProfile];
  private readonly drafts = new Map<string, PurchaseRequestDraftView>();
  private readonly requests = new Map<string, PurchaseRequest>();
  private readonly idempotentSubmissions = new Map<string, PurchaseRequestDraftView>();
  private draftSequence = 2;
  private requestSequence = 2;

  constructor() {
    const seed = this.seedRequest();
    this.requests.set(seed.id, seed);
  }

  createDraft(clientAccountId: string, requestedDeliveryDate: string): PurchaseRequestDraftView {
    const id = `DRAFT-${this.fixture.key}-${String(this.draftSequence++).padStart(4, '0')}`;
    const timestamp = this.updatedAtFor(1);
    const draft: PurchaseRequestDraftView = {
      id,
      clientAccountId,
      buyerMembershipId: this.fixture.buyerMembershipId,
      status: 'DRAFT',
      version: 1,
      requestedDeliveryDate: requestedDeliveryDate || null,
      paymentPreference: null,
      creditResult: null,
      routeProvider: null,
      lines: [],
      destination: null,
      route: null,
      warehouseSelection: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      submittedAt: null,
      etag: '"1"',
    };
    this.drafts.set(id, draft);
    return this.cloneDraft(draft);
  }

  getDraft(draftId: string): PurchaseRequestDraftView {
    return this.cloneDraft(this.requireDraft(draftId));
  }

  replaceDraftLines(
    draftId: string,
    etag: string,
    lines: readonly CanonicalDraftLine[],
  ): PurchaseRequestDraftView {
    return this.updateDraft(draftId, etag, { lines: this.draftLines(lines) });
  }

  setDraftDestination(
    draftId: string,
    etag: string,
    addressId: string,
  ): PurchaseRequestDraftView {
    return this.updateDraft(draftId, etag, {
      destination: {
        addressId,
        snapshot: {
          addressId,
          roadType: 'AV',
          street: this.fixture.profile === 'icisa' ? 'Javier Prado' : 'Demo',
          number: this.fixture.profile === 'icisa' ? '1234' : '100',
          interior: '',
          reference: this.fixture.profile === 'icisa' ? 'Ingreso por la puerta lateral' : 'Frente al parque',
          countryCode: 'PE',
          department: 'LIM',
          province: 'LIM-01',
          district: 'LIM-0101',
          recipient: this.fixture.profile === 'icisa' ? 'ICISA Recepción' : 'Generic Recepción',
          phone: '+51 900 000 001',
          postalCode: '15074',
          receivingHours: '09:00-17:00',
          receivingInstructions: 'Entregar en horario laboral.',
          latitude: -12.118,
          longitude: -77.036,
          source: 'MOCK_FIXTURE',
        },
      },
    });
  }

  previewDraftRoute(draftId: string, etag: string): PurchaseRequestDraftView {
    const draft = this.requireDraft(draftId);
    this.assertDraftVersion(draft, etag);
    return this.updateDraft(draftId, etag, {
      routeProvider: 'LOCAL_ESTIMATE',
      route: {
        calculatedAt: this.updatedAtFor(draft.version + 1),
        snapshot: {
          provider: 'LOCAL_ESTIMATE',
          reference: `mock-route-${draft.id}`,
          destinationLabel: this.fixture.profile === 'icisa' ? 'ICISA · Lima' : 'Generic · Lima',
          distanceMeters: 12500,
          durationSeconds: 2400,
          previewUrl: null,
          destinationLatitude: -12.118,
          destinationLongitude: -77.036,
          mode: 'driving',
          path: null,
        },
      },
    });
  }

  setDraftPreferences(
    draftId: string,
    etag: string,
    paymentPreference: string,
    requestedDeliveryDate: string,
  ): PurchaseRequestDraftView {
    return this.updateDraft(draftId, etag, {
      paymentPreference,
      requestedDeliveryDate: requestedDeliveryDate || null,
      creditResult: paymentPreference === 'CREDIT_LINE' ? 'APPROVED' : 'NOT_REQUIRED',
    });
  }

  submitDraft(
    draftId: string,
    etag: string,
    idempotencyKey: string,
  ): PurchaseRequestDraftView {
    if (!idempotencyKey.trim()) throw new MockSalesCommitmentValidationError('Idempotency key is required.');
    const idempotencyId = `${draftId}:${idempotencyKey}`;
    const previous = this.idempotentSubmissions.get(idempotencyId);
    if (previous) return this.cloneDraft(previous);

    const draft = this.requireDraft(draftId);
    this.assertDraftVersion(draft, etag);
    this.assertDraftStatus(draft);
    const submitted = this.updateDraft(draftId, etag, {
      status: 'SUBMITTED',
      submittedAt: this.updatedAtFor(draft.version + 1),
    });
    this.idempotentSubmissions.set(idempotencyId, submitted);
    this.requests.set(submitted.id, this.requestFromDraft(submitted));
    return this.cloneDraft(submitted);
  }

  listRequests(status = '', sort = 'createdAt,desc'): PurchaseRequestPage {
    const validSort = validPurchaseRequestSort(sort);
    const values = [...this.requests.values()]
      .filter((item) => !status || item.status === status.trim().toUpperCase())
      .sort((left, right) => left.id.localeCompare(right.id));
    if (validSort.endsWith(',desc')) values.reverse();
    return {
      items: values.map((item) => this.cloneRequest(item)),
      page: 0,
      size: 50,
      total: values.length,
    };
  }

  getRequest(id: string): PurchaseRequest {
    return this.cloneRequest(this.requireRequest(id));
  }

  createRequest(command: PurchaseRequestDraftCommand): PurchaseRequest {
    const id = `PR-${this.fixture.key}-${String(this.requestSequence++).padStart(4, '0')}`;
    const request: PurchaseRequest = {
      id,
      code: id,
      status: 'DRAFT',
      priority: command.priority,
      requestedDeliveryDate: command.requestedDeliveryDate,
      deliveryProfileSnapshot: command.deliveryProfileSnapshot,
      paymentOption: command.paymentOption,
      comment: command.comment,
      reviewNote: null,
      lines: command.lines.map((line, index) => this.requestLine(id, line, index + 1)),
      version: 1,
      etag: '"1"',
    };
    this.requests.set(id, request);
    return this.cloneRequest(request);
  }

  updateRequest(
    id: string,
    expected: PurchaseRequest,
    command: PurchaseRequestDetailsCommand,
  ): PurchaseRequest {
    const current = this.assertRequestVersion(id, expected);
    this.assertEditableRequest(current);
    return this.updateRequestValue(current, {
      priority: command.priority,
      requestedDeliveryDate: command.requestedDeliveryDate,
      deliveryProfileSnapshot: command.deliveryProfileSnapshot,
      paymentOption: command.paymentOption,
      comment: command.comment,
    });
  }

  addRequestLine(
    id: string,
    expected: PurchaseRequest,
    line: PurchaseRequestDraftCommand['lines'][number],
  ): PurchaseRequest {
    const current = this.assertRequestVersion(id, expected);
    this.assertEditableRequest(current);
    return this.updateRequestValue(current, {
      lines: [...current.lines, this.requestLine(id, line, current.lines.length + 1)],
    });
  }

  updateRequestLine(
    id: string,
    expected: PurchaseRequest,
    lineId: string,
    command: { readonly quantity: number; readonly notes: string },
  ): PurchaseRequest {
    const current = this.assertRequestVersion(id, expected);
    this.assertEditableRequest(current);
    if (!Number.isFinite(command.quantity) || command.quantity <= 0) {
      throw new MockSalesCommitmentValidationError('Quantity must be positive.');
    }
    if (!current.lines.some((line) => line.id === lineId)) throw new MockSalesCommitmentNotFoundError(lineId);
    return this.updateRequestValue(current, {
      lines: current.lines.map((line) => line.id === lineId
        ? { ...line, quantity: command.quantity, notes: command.notes.trim() || null }
        : line),
    });
  }

  deleteRequestLine(id: string, expected: PurchaseRequest, lineId: string): PurchaseRequest {
    const current = this.assertRequestVersion(id, expected);
    this.assertEditableRequest(current);
    if (!current.lines.some((line) => line.id === lineId)) throw new MockSalesCommitmentNotFoundError(lineId);
    return this.updateRequestValue(current, { lines: current.lines.filter((line) => line.id !== lineId) });
  }

  submitRequest(expected: PurchaseRequest, idempotencyKey: string): PurchaseRequest {
    if (!idempotencyKey.trim()) throw new MockSalesCommitmentValidationError('Idempotency key is required.');
    const current = this.assertRequestVersion(expected.id, expected);
    if (current.status !== 'DRAFT' && current.status !== 'NEEDS_ADJUSTMENT') {
      throw new MockSalesCommitmentConflictError('Purchase request cannot be submitted from its current status.');
    }
    return this.updateRequestValue(current, { status: 'SUBMITTED' });
  }

  cancelRequest(expected: PurchaseRequest): PurchaseRequest {
    const current = this.assertRequestVersion(expected.id, expected);
    if (!canCancelPurchaseRequest(current.status)) {
      throw new MockSalesCommitmentConflictError('Purchase request cannot be cancelled from its current status.');
    }
    return this.updateRequestValue(current, { status: 'CANCELLED' });
  }

  private updateDraft(
    draftId: string,
    etag: string,
    patch: Partial<PurchaseRequestDraftView>,
  ): PurchaseRequestDraftView {
    const current = this.requireDraft(draftId);
    this.assertDraftVersion(current, etag);
    this.assertDraftStatus(current);
    const version = current.version + 1;
    const updated: PurchaseRequestDraftView = {
      ...current,
      ...patch,
      version,
      updatedAt: this.updatedAtFor(version),
      etag: `"${version}"`,
    };
    this.drafts.set(draftId, updated);
    return this.cloneDraft(updated);
  }

  private updateRequestValue(
    current: PurchaseRequest,
    patch: Partial<PurchaseRequest>,
  ): PurchaseRequest {
    const version = current.version + 1;
    const updated: PurchaseRequest = {
      ...current,
      ...patch,
      version,
      etag: `"${version}"`,
    };
    this.requests.set(updated.id, updated);
    return this.cloneRequest(updated);
  }

  private assertRequestVersion(id: string, expected: PurchaseRequest): PurchaseRequest {
    const current = this.requireRequest(id);
    if (etagFor(expected) !== etagFor(current)) throw new MockSalesCommitmentConflictError('Purchase request version is stale.');
    return current;
  }

  private assertDraftVersion(draft: PurchaseRequestDraftView, expectedEtag: string): void {
    if (draft.etag !== expectedEtag) throw new MockSalesCommitmentConflictError('Purchase request draft version is stale.');
  }

  private assertDraftStatus(draft: PurchaseRequestDraftView): void {
    if (draft.status !== 'DRAFT') throw new MockSalesCommitmentConflictError('Purchase request draft is no longer editable.');
  }

  private assertEditableRequest(request: PurchaseRequest): void {
    if (!canEditPurchaseRequest(request.status)) {
      throw new MockSalesCommitmentConflictError('Purchase request is no longer editable.');
    }
  }

  private requireDraft(id: string): PurchaseRequestDraftView {
    const value = this.drafts.get(id);
    if (!value) throw new MockSalesCommitmentNotFoundError(id);
    return value;
  }

  private requireRequest(id: string): PurchaseRequest {
    const value = this.requests.get(id);
    if (!value) throw new MockSalesCommitmentNotFoundError(id);
    return value;
  }

  private draftLines(lines: readonly CanonicalDraftLine[]): readonly Record<string, unknown>[] {
    return lines.map((line, index) => ({
      id: `line-${index + 1}`,
      skuId: line.skuId,
      skuCode: line.skuId,
      quantity: line.quantity,
      unit: line.unit,
      notes: line.notes,
      presentation: this.presentationFor(line.skuId),
      effectiveUnitPrice: this.unitPriceFor(line.skuId),
      currency: this.fixture.currency,
    }));
  }

  private requestFromDraft(draft: PurchaseRequestDraftView): PurchaseRequest {
    const id = draft.id;
    const paymentOption = this.paymentOptionFrom(draft.paymentPreference);
    return {
      id,
      code: `PR-${this.fixture.key}-${id.split('-').pop() ?? '0000'}`,
      status: 'SUBMITTED',
      priority: 'NORMAL',
      requestedDeliveryDate: draft.requestedDeliveryDate,
      deliveryProfileSnapshot: 'REFRIGERATED_STANDARD',
      paymentOption,
      comment: null,
      reviewNote: null,
      lines: draft.lines.map((line, index) => this.requestLineFromDraft(id, line, index + 1)),
      version: draft.version,
      etag: draft.etag,
    };
  }

  private requestLineFromDraft(
    requestId: string,
    value: Record<string, unknown>,
    index: number,
  ): PurchaseRequestLine {
    const skuId = text(value['skuId']) || text(value['skuCode']);
    return {
      id: text(value['id']) || `${requestId}-line-${index}`,
      catalogItemId: skuId,
      itemName: this.presentationFor(skuId),
      presentation: text(value['presentation']) || this.presentationFor(skuId),
      quantity: number(value['quantity']),
      unit: text(value['unit']) || 'unit',
      unitPriceAmount: number(value['effectiveUnitPrice'], this.unitPriceFor(skuId)),
      unitPriceCurrency: text(value['currency']) || this.fixture.currency,
      notes: text(value['notes']) || null,
    };
  }

  private requestLine(
    requestId: string,
    value: PurchaseRequestDraftCommand['lines'][number],
    index: number,
  ): PurchaseRequestLine {
    return {
      id: `${requestId}-line-${index}`,
      catalogItemId: value.catalogItemId,
      itemName: this.presentationFor(value.catalogItemId),
      presentation: this.presentationFor(value.catalogItemId),
      quantity: value.quantity,
      unit: value.unit,
      unitPriceAmount: this.unitPriceFor(value.catalogItemId),
      unitPriceCurrency: this.fixture.currency,
      notes: value.notes.trim() || null,
    };
  }

  private seedRequest(): PurchaseRequest {
    const id = `PR-${this.fixture.key}-0001`;
    return {
      id,
      code: id,
      status: 'SUBMITTED',
      priority: 'NORMAL',
      requestedDeliveryDate: '2026-09-05',
      deliveryProfileSnapshot: 'REFRIGERATED_STANDARD',
      paymentOption: this.fixture.profile === 'icisa' ? 'CREDIT_LINE' : 'CASH_ON_DELIVERY',
      comment: 'Deterministic mock purchase request.',
      reviewNote: null,
      lines: [this.requestLine(id, {
        catalogItemId: this.fixture.profile === 'icisa' ? 'PROD-0001' : 'PROD-GENERIC-001',
        quantity: 2,
        unit: 'unit',
        notes: '',
      }, 1)],
      version: 2,
      etag: '"2"',
    };
  }

  private paymentOptionFrom(value: string | null): PaymentOption | null {
    const values: readonly PaymentOption[] = ['CREDIT_LINE', 'BANK_TRANSFER', 'CARD_STRIPE', 'CASH', 'CASH_ON_DELIVERY'];
    return value && values.includes(value as PaymentOption) ? value as PaymentOption : null;
  }

  private presentationFor(skuId: string): string {
    if (this.fixture.profile === 'icisa') {
      if (skuId === 'PROD-0001') return 'Queso Grana Padano DOP';
      if (skuId === 'PROD-0002') return 'Queso Parmigiano Reggiano DOP';
      if (skuId === 'PROD-0003') return 'Coppa Italiana';
    }
    if (skuId === 'PROD-GENERIC-001') return 'Demo Refrigerated Cheese';
    if (skuId === 'PROD-GENERIC-002') return 'Demo Frozen Fruit';
    if (skuId === 'PROD-GENERIC-003') return 'Demo Ambient Pantry Box';
    return this.fixture.defaultPresentation;
  }

  private unitPriceFor(skuId: string): number {
    const prices: Record<TenantProfile, Record<string, number>> = {
      generic: {
        'PROD-GENERIC-001': 16.2,
        'PROD-GENERIC-002': 24.5,
        'PROD-GENERIC-003': 31,
      },
      icisa: {
        'PROD-0001': 17.3,
        'PROD-0002': 19.8,
        'PROD-0003': 86,
      },
    };
    return prices[this.fixture.profile][skuId] ?? this.fixture.defaultUnitPrice;
  }

  private updatedAtFor(version: number): string {
    return `2026-08-26T09:00:${String(version).padStart(2, '0')}Z`;
  }

  private cloneDraft(value: PurchaseRequestDraftView): PurchaseRequestDraftView {
    return {
      ...value,
      lines: value.lines.map((item) => ({ ...item })),
      destination: value.destination ? { ...value.destination } : null,
      route: value.route ? { ...value.route } : null,
      warehouseSelection: value.warehouseSelection ? { ...value.warehouseSelection } : null,
    };
  }

  private cloneRequest(value: PurchaseRequest): PurchaseRequest {
    return { ...value, lines: value.lines.map((line) => ({ ...line })) };
  }
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function number(value: unknown, fallback = 0): number {
  const result = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(result) ? result : fallback;
}

export class MockSalesCommitmentConflictError extends Error {
  readonly status = 409;
  readonly code = 'PURCHASE_REQUEST_STALE';

  constructor(message: string) {
    super(message);
    this.name = 'MockSalesCommitmentConflictError';
  }
}

export class MockSalesCommitmentNotFoundError extends Error {
  readonly status = 404;
  readonly code = 'MOCK_RESOURCE_NOT_FOUND';

  constructor(id: string) {
    super(`Mock Sales Commitment resource not found: ${id}`);
    this.name = 'MockSalesCommitmentNotFoundError';
  }
}

export class MockSalesCommitmentValidationError extends Error {
  readonly status = 400;
  readonly code = 'MOCK_VALIDATION_FAILED';

  constructor(message: string) {
    super(message);
    this.name = 'MockSalesCommitmentValidationError';
  }
}
