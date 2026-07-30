import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { PORTAL_RUNTIME_CONFIG } from '../../core/security/runtime-config';
import { PortalAuthApiClient } from './portal-auth-api.client';

describe('PortalAuthApiClient', () => {
  let client: PortalAuthApiClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PortalAuthApiClient,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PORTAL_RUNTIME_CONFIG, useValue: {
          apiBaseUrl: 'http://api.local',
          signInPath: '/api/v1/authentication/sign-in',
          refreshPath: '/api/v1/authentication/refresh',
          signOutPath: '/api/v1/authentication/sign-out',
          surface: 'PORTAL',
        } },
      ],
    });
    client = TestBed.inject(PortalAuthApiClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('sends the API identifier contract without legacy username fields', () => {
    client.signIn({ email: 'buyer@icisa.pe', password: 'secret', workspaceSlug: 'icisa' }).subscribe();

    const request = httpMock.expectOne('http://api.local/api/v1/authentication/sign-in');
    expect(request.request.body).toEqual({
      identifier: 'buyer@icisa.pe',
      password: 'secret',
      workspaceSlug: 'icisa',
      surface: 'PORTAL',
    });
    request.flush({});
  });
});
