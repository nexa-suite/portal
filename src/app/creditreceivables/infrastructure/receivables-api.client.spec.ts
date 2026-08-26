import '@angular/compiler';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PORTAL_RUNTIME_CONFIG } from '../../core/security/runtime-config';
import { ReceivablesApiClient } from './receivables-api.client';

describe('ReceivablesApiClient', () => {
  let api: ReceivablesApiClient;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ReceivablesApiClient, provideHttpClient(), provideHttpClientTesting(), { provide: PORTAL_RUNTIME_CONFIG, useValue: { apiBaseUrl: 'http://api.local', surface: 'PORTAL' } }],
    });
    api = TestBed.inject(ReceivablesApiClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('keeps receivables under the BC-07 client', () => {
    api.list().subscribe((page) => expect(page.items).toEqual([]));
    const request = http.expectOne('http://api.local/api/v1/receivables?page=0&size=25');
    expect(request.request.method).toBe('GET');
    expect(request.request.withCredentials).toBe(true);
    request.flush({ items: [], page: 0, size: 25, total: 0 });
  });
});
