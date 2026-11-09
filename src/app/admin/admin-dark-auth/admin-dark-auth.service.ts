import {
  HttpClient,
  HttpHeaders,
} from '@angular/common/http';
import {
  inject,
  Injectable,
} from '@angular/core';
import { APP_CONFIG } from '@dspace/config/app-config.interface';
import {
  Observable,
  switchMap,
  take,
  throwError,
} from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { RESTURLCombiner } from '../../core/url-combiner/rest-url-combiner';

/** Public-only authentication configuration; private material has no frontend representation. */
export interface DarkAuthenticationStatus {
  enabled: boolean;
  configured: boolean;
  publicKey: string | null;
  keyId: string | null;
  state: 'disabled' | 'configured' | 'invalid_configuration' | 'pending_registration';
  authorityId: string | null;
  minterApiUrl: string | null;
  operationalStatus: 'unverified';
}

@Injectable({ providedIn: 'root' })
export class AdminDarkAuthService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly config = inject(APP_CONFIG);

  /** Fetch fresh status using the existing administrator session. */
  load(): Observable<DarkAuthenticationStatus> {
    return this.auth.hasValidAuthenticationToken().pipe(
      take(1),
      switchMap((token) => {
        if (!token?.accessToken) {
          return throwError(() => new Error('Administrator authentication required'));
        }
        return this.http.get<DarkAuthenticationStatus>(
          new RESTURLCombiner(this.config.rest.baseUrl, '/admin/darks/authentication').toString(),
          { headers: new HttpHeaders({ Authorization: `Bearer ${token.accessToken}` }), transferCache: false },
        );
      }),
    );
  }
  /** Generate a protected pair on the server and retrieve only its public configuration. */
  generateKeys(): Observable<DarkAuthenticationStatus> {
    return this.post('/admin/darks/authentication/keys', {});
  }

  /** Record the administrator's explicit out-of-band registration confirmation. */
  confirm(status: DarkAuthenticationStatus): Observable<DarkAuthenticationStatus> {
    return this.post('/admin/darks/authentication/registration', {
      keyId: status.keyId, authorityId: status.authorityId, minterApiUrl: status.minterApiUrl, confirmed: true,
    });
  }

  /** Wait for the server CSRF cookie/header before sending a modification exactly once. */
  private post(path: string, body: object): Observable<DarkAuthenticationStatus> {
    return this.auth.hasValidAuthenticationToken().pipe(
      take(1),
      switchMap((token) => {
        if (!token?.accessToken) {
          return throwError(() => new Error('Administrator authentication required'));
        }
        const headers = new HttpHeaders({ Authorization: `Bearer ${token.accessToken}` });
        return this.http.get(
          new RESTURLCombiner(this.config.rest.baseUrl, '/security/csrf').toString(),
          { headers, withCredentials: true, transferCache: false },
        ).pipe(
          switchMap(() => this.http.post<DarkAuthenticationStatus>(
            new RESTURLCombiner(this.config.rest.baseUrl, path).toString(), body,
            { headers, withCredentials: true },
          )),
        );
      }),
    );
  }
}
