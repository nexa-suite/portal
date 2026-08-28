import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PORTAL_RUNTIME_CONFIG } from '../../core/security/runtime-config';
import { DeliveryTrackingApiClient } from './delivery-tracking-api.client';

describe('DeliveryTrackingApiClient', () => {
  let client: DeliveryTrackingApiClient;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DeliveryTrackingApiClient,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PORTAL_RUNTIME_CONFIG, useValue: { apiBaseUrl: 'http://api.local', surface: 'PORTAL' } },
      ],
    });
    client = TestBed.inject(DeliveryTrackingApiClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('maps buyer delivery telemetry from the API projection', () => {
    client.list().subscribe((page) => {
      expect(page.items[0]).toMatchObject({
        clientAccountId: 'account-1',
        routeName: 'Callao Norte',
        temperatureMin: 2,
        temperatureMax: 8,
        temperatureUnit: 'CELSIUS',
        temperatureStatus: 'WITHIN_RANGE',
        podStatus: 'PENDING',
        alerts: ['WINDOW_CONFIRMED'],
      });
    });

    const request = http.expectOne((candidate) => candidate.url === 'http://api.local/api/v1/my-deliveries');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('page')).toBe('0');
    expect(request.request.params.get('size')).toBe('100');
    expect(request.request.params.get('sort')).toBe('updatedAt,desc');
    expect(request.request.withCredentials).toBe(true);
    request.flush({
      items: [{
        id: 'delivery-1',
        dispatchNumber: 'DO-1',
        salesOrderId: 'order-1',
        salesOrderNumber: 'SO-1',
        clientAccountId: 'account-1',
        status: 'DELIVERY_SCHEDULED',
        destination: 'Av. Néstor Gambetta 850, Callao',
        assignment: { routeName: 'Callao Norte' },
        temperatureMin: 2,
        temperatureMax: 8,
        temperatureUnit: 'CELSIUS',
        temperatureStatus: 'WITHIN_RANGE',
        podStatus: 'PENDING',
        version: 4,
        updatedAt: '2030-01-01T10:00:00Z',
        alerts: ['WINDOW_CONFIRMED'],
      }],
      page: 0,
      size: 100,
      total: 1,
    });
  });
});
