import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { APP_CONFIG } from '@dspace/config/app-config.interface';
import { of } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { AdminDarkAuthService } from './admin-dark-auth.service';

describe('AdminDarkAuthService', () => {
  let service: AdminDarkAuthService;
  let http: HttpTestingController;
  let auth: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    auth = jasmine.createSpyObj('AuthService', ['hasValidAuthenticationToken']);
    auth.hasValidAuthenticationToken.and.returnValue(of({ accessToken: 'test-session' } as any));
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(), provideHttpClientTesting(),
      { provide: AuthService, useValue: auth },
      { provide: APP_CONFIG, useValue: { rest: { baseUrl: 'https://example.org/server' } } },
    ] });
    service = TestBed.inject(AdminDarkAuthService);
    http = TestBed.inject(HttpTestingController);
  });

  function initializeCsrf(modificationUrl: string): void {
    http.expectNone(modificationUrl);
    const csrf = http.expectOne('https://example.org/server/api/security/csrf');
    expect(csrf.request.method).toBe('GET');
    expect(csrf.request.withCredentials).toBeTrue();
    expect(csrf.request.transferCache).toBeFalse();
    csrf.flush(null);
  }

  afterEach(() => http.verify());

  it('requests the protected public-only configuration with the administrator session', () => {
    service.load().subscribe((status) => expect(status.publicKey).toBe('public-only'));
    const request = http.expectOne('https://example.org/server/api/admin/darks/authentication');
    expect(request.request.headers.get('Authorization')).toBe('Bearer test-session');
    expect(request.request.transferCache).toBeFalse();
    request.flush({ publicKey: 'public-only' });
  });

  it('confirms only the displayed public key, authority and destination', () => {
    service.confirm({ enabled: true, configured: true, publicKey: 'public-only', keyId: 'fingerprint',
      state: 'pending_registration', operationalStatus: 'unverified', authorityId: 'authority',
      minterApiUrl: 'https://minter.example.org/api/v1' }).subscribe();
    initializeCsrf('https://example.org/server/api/admin/darks/authentication/registration');
    const request = http.expectOne('https://example.org/server/api/admin/darks/authentication/registration');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ keyId: 'fingerprint', authorityId: 'authority',
      minterApiUrl: 'https://minter.example.org/api/v1', confirmed: true });
    request.flush({ state: 'configured' });
  });

  it('generates keys through the protected server endpoint without accepting key material', () => {
    service.generateKeys().subscribe((status) => expect(status.publicKey).toBe('public-only'));
    initializeCsrf('https://example.org/server/api/admin/darks/authentication/keys');
    const request = http.expectOne('https://example.org/server/api/admin/darks/authentication/keys');
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('Authorization')).toBe('Bearer test-session');
    expect(request.request.body).toEqual({});
    request.flush({ publicKey: 'public-only', state: 'pending_registration' }, { status: 201, statusText: 'Created' });
  });

  it('does not submit a mutation or retry when CSRF initialization fails', () => {
    service.generateKeys().subscribe({ next: () => fail('Expected CSRF error'),
      error: (error: unknown) => expect(error).toBeTruthy() });
    const csrf = http.expectOne('https://example.org/server/api/security/csrf');
    csrf.flush({}, { status: 403, statusText: 'Forbidden' });
    http.expectNone('https://example.org/server/api/admin/darks/authentication/keys');
  });

  it('does not retry a rejected registration mutation', () => {
    service.confirm({ enabled: true, configured: true, publicKey: 'public-only', keyId: 'fingerprint',
      state: 'pending_registration', operationalStatus: 'unverified', authorityId: 'authority',
      minterApiUrl: 'https://minter.example.org/api/v1' }).subscribe({ next: () => fail('Expected rejection'),
      error: (error: unknown) => expect(error).toBeTruthy() });
    initializeCsrf('https://example.org/server/api/admin/darks/authentication/registration');
    const request = http.expectOne('https://example.org/server/api/admin/darks/authentication/registration');
    expect(request.request.withCredentials).toBeTrue();
    request.flush({}, { status: 403, statusText: 'Forbidden' });
    http.expectNone('https://example.org/server/api/admin/darks/authentication/registration');
  });

  it('refuses key generation without a valid administrator session', () => {
    auth.hasValidAuthenticationToken.and.returnValue(of(null));
    service.generateKeys().subscribe({ next: () => fail('Expected authentication error'),
      error: (error: unknown) => expect(error).toBeTruthy() });
    http.expectNone('https://example.org/server/api/admin/darks/authentication/keys');
  });

  it('refuses requests without a valid administrator session', () => {
    auth.hasValidAuthenticationToken.and.returnValue(of(null));
    service.load().subscribe({ next: () => fail('Expected authentication error'), error: (error: unknown) => expect(error).toBeTruthy() });
    http.expectNone('https://example.org/server/api/admin/darks/authentication');
  });
});
