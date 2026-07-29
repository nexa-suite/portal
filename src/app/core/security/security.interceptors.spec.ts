import { signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { PortalAuthStateService } from '../../iam/application/portal-auth-state.service';
import { accessTokenInterceptor } from './access-token.interceptor';
import { portalSurfaceInterceptor } from './portal-surface.interceptor';
import { refreshInterceptor } from './refresh.interceptor';

describe('Portal HTTP security', () => {
  const auth = {
    accessToken: signal<string | null>('old-token'),
    refreshAccessToken: vi.fn(() => of('new-token')),
    clearSession: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        { provide: PortalAuthStateService, useValue: auth },
        provideHttpClient(
          withInterceptors([portalSurfaceInterceptor, accessTokenInterceptor, refreshInterceptor]),
        ),
        provideHttpClientTesting(),
      ],
    });
  });

  it('adds the fixed PORTAL surface and memory token', () => {
    const http = TestBed.inject(HttpClient);
    const httpMock = TestBed.inject(HttpTestingController);
    http.get('/api/v1/catalog-items').subscribe();

    const request = httpMock.expectOne('/api/v1/catalog-items');
    expect(request.request.headers.get('X-Nexa-Surface')).toBe('PORTAL');
    expect(request.request.headers.get('Authorization')).toBe('Bearer old-token');
    request.flush({});
    httpMock.verify();
  });

  it('refreshes once and retries a protected request after 401', () => {
    const http = TestBed.inject(HttpClient);
    const httpMock = TestBed.inject(HttpTestingController);
    http.get('/api/v1/catalog-items').subscribe();

    const failed = httpMock.expectOne('/api/v1/catalog-items');
    failed.flush({}, { status: 401, statusText: 'Unauthorized' });
    const retried = httpMock.expectOne('/api/v1/catalog-items');
    expect(retried.request.headers.get('Authorization')).toBe('Bearer new-token');
    retried.flush({ items: [] });

    expect(auth.refreshAccessToken).toHaveBeenCalledTimes(1);
    httpMock.verify();
  });
});
