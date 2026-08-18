import '@angular/compiler';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PORTAL_RUNTIME_CONFIG } from '../../core/security/runtime-config';
import { BusinessDocumentsApiClient } from './business-documents-api.client';

describe('BusinessDocumentsApiClient', () => {
  let api: BusinessDocumentsApiClient;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [BusinessDocumentsApiClient, provideHttpClient(), provideHttpClientTesting(), { provide: PORTAL_RUNTIME_CONFIG, useValue: { apiBaseUrl: 'http://api.local', surface: 'PORTAL', signInPath: '', refreshPath: '', signOutPath: '', catalogPath: '' } }] });
    api = TestBed.inject(BusinessDocumentsApiClient); http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('keeps document listing credentialed and tenant-scoped', () => {
    api.list().subscribe((page) => expect(page.items).toEqual([]));
    const request = http.expectOne('http://api.local/api/v1/business-documents?page=0&size=25');
    expect(request.request.withCredentials).toBe(true); request.flush({ items: [], page: 0, size: 25, total: 0 });
  });
});
