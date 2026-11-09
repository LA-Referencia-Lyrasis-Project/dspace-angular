import { Clipboard } from '@angular/cdk/clipboard';
import { HttpErrorResponse } from '@angular/common/http';
import { PLATFORM_ID } from '@angular/core';
import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import {
  of,
  Subject,
  throwError,
} from 'rxjs';

import { AdminDarkAuthComponent } from './admin-dark-auth.component';
import {
  AdminDarkAuthService,
  DarkAuthenticationStatus,
} from './admin-dark-auth.service';

describe('AdminDarkAuthComponent', () => {
  let fixture: ComponentFixture<AdminDarkAuthComponent>;
  let service: jasmine.SpyObj<AdminDarkAuthService>;
  let clipboard: jasmine.SpyObj<Clipboard>;
  const status: DarkAuthenticationStatus = {
    enabled: true, configured: true, publicKey: 'public-key-only', keyId: 'fingerprint',
    state: 'configured', operationalStatus: 'unverified', authorityId: 'authority', minterApiUrl: 'https://example.org/api/v1',
  };

  beforeEach(async () => {
    service = jasmine.createSpyObj('AdminDarkAuthService', ['load', 'confirm', 'generateKeys']);
    clipboard = jasmine.createSpyObj('Clipboard', ['copy']);
    service.load.and.returnValue(of(status));
    clipboard.copy.and.returnValue(true);
    await TestBed.configureTestingModule({
      errorOnUnknownElements: true,
      errorOnUnknownProperties: true,
      imports: [AdminDarkAuthComponent, TranslateModule.forRoot()],
      providers: [
        { provide: AdminDarkAuthService, useValue: service },
        { provide: Clipboard, useValue: clipboard },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).compileComponents();
  });

  function create(): void {
    fixture = TestBed.createComponent(AdminDarkAuthComponent);
    fixture.detectChanges();
  }

  it('renders only the public key and copies exactly its value', () => {
    create();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('#dark-public-key');
    expect(input.value).toBe(status.publicKey);
    expect(input.readOnly).toBeTrue();
    fixture.nativeElement.querySelector('button.btn-primary').click();
    fixture.detectChanges();
    expect(clipboard.copy).toHaveBeenCalledOnceWith(status.publicKey);
    expect(fixture.nativeElement.textContent).toContain('admin.dark-auth.copied');
    expect(fixture.nativeElement.textContent).toContain('admin.dark-auth.unverified');
    expect(fixture.nativeElement.querySelectorAll('input').length).toBe(1);
  });

  it('shows unavailable configuration without a copy button', () => {
    service.load.and.returnValue(of({ ...status, publicKey: null, configured: false, state: 'invalid_configuration' }));
    create();
    expect(fixture.nativeElement.querySelector('#dark-public-key')).toBeNull();
    expect(fixture.nativeElement.querySelector('button.btn-primary')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('admin.dark-auth.state.invalid_configuration');
  });

  it('reports a failed clipboard operation with manual-copy guidance', () => {
    clipboard.copy.and.returnValue(false);
    create();
    fixture.componentInstance.copyPublicKey();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('admin.dark-auth.copy-failed');
  });

  it('shows a safe error and supports retry', () => {
    service.load.and.returnValue(throwError(() => new Error('raw-backend-diagnostic')));
    create();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
    expect(fixture.nativeElement.textContent).not.toContain('raw-backend-diagnostic');
    service.load.and.returnValue(of(status));
    fixture.componentInstance.refresh();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#dark-public-key')).toBeTruthy();
  });

  it('binds the checkbox and enables confirmation only after explicit consent', async () => {
    service.load.and.returnValue(of({ ...status, state: 'pending_registration' }));
    service.confirm.and.returnValue(of(status));
    create();
    await fixture.whenStable();
    fixture.detectChanges();
    const checkbox: HTMLInputElement = fixture.nativeElement.querySelector('#dark-registration-confirmed');
    const confirm: HTMLButtonElement = fixture.nativeElement.querySelector('button.btn-outline-primary.mb-3:last-of-type');
    expect(confirm.getAttribute('aria-disabled')).toBe('true');
    confirm.click();
    expect(service.confirm).not.toHaveBeenCalled();
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.componentInstance.registrationConfirmed).toBeTrue();
    expect(confirm.getAttribute('aria-disabled')).toBe('false');
    confirm.click();
    fixture.detectChanges();
    expect(service.confirm).toHaveBeenCalledOnceWith({ ...status, state: 'pending_registration' });
    expect(fixture.nativeElement.querySelector('#dark-registration-confirmed')).toBeNull();
  });

  it('shows a confirmation error without falsely reporting that loading configuration failed', () => {
    service.load.and.returnValue(of({ ...status, state: 'pending_registration' }));
    service.confirm.and.returnValue(throwError(() => new Error('PRIVATE-DIAGNOSTIC')));
    create();
    fixture.componentInstance.registrationConfirmed = true;
    fixture.componentInstance.confirmRegistration();
    fixture.detectChanges();
    expect(fixture.componentInstance.status.publicKey).toBe(status.publicKey);
    expect(fixture.componentInstance.failed).toBeFalse();
    expect(fixture.nativeElement.textContent).toContain('admin.dark-auth.confirmation-failed');
    expect(fixture.nativeElement.textContent).not.toContain('admin.dark-auth.failed');
    expect(fixture.nativeElement.textContent).not.toContain('PRIVATE-DIAGNOSTIC');
  });

  for (const [code, key] of [[401, 'session-expired'], [403, 'confirmation-forbidden'], [0, 'connection-failed']] as const) {
    it(`shows safe confirmation guidance for HTTP ${code}`, () => {
      service.load.and.returnValue(of({ ...status, state: 'pending_registration' }));
      service.confirm.and.returnValue(throwError(() => new HttpErrorResponse({ status: code })));
      create();
      fixture.componentInstance.registrationConfirmed = true;
      fixture.componentInstance.confirmRegistration();
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain(`admin.dark-auth.${key}`);
      expect(fixture.componentInstance.loading).toBeFalse();
      expect(fixture.componentInstance.status.state).toBe('pending_registration');
    });
  }

  it('does not tell the administrator to enable authentication when it is already enabled', () => {
    create();
    expect(fixture.nativeElement.textContent).not.toContain('admin.dark-auth.configure');
  });

  it('generates a key on request when authentication is enabled and displays its public value', () => {
    service.load.and.returnValue(of({ ...status, publicKey: null, keyId: null,
      configured: false, state: 'invalid_configuration' }));
    service.generateKeys.and.returnValue(of({ ...status, state: 'pending_registration' }));
    create();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('#dark-generate-key');
    expect(button.getAttribute('aria-disabled')).toBe('false');
    button.click();
    fixture.detectChanges();
    expect(service.generateKeys).toHaveBeenCalledOnceWith();
    expect(fixture.nativeElement.querySelector('#dark-public-key').value).toBe(status.publicKey);
    expect(fixture.nativeElement.textContent).toContain('admin.dark-auth.generated');
    expect(fixture.nativeElement.querySelector('#dark-registration-confirmed')).toBeTruthy();
    expect(fixture.componentInstance.registrationConfirmed).toBeFalse();
  });

  it('does not offer or execute generation when authentication is disabled', () => {
    service.load.and.returnValue(of({ ...status, enabled: false, publicKey: null, state: 'disabled' }));
    create();
    expect(fixture.nativeElement.querySelector('#dark-generate-key')).toBeNull();
    fixture.componentInstance.generateKeys();
    expect(service.generateKeys).not.toHaveBeenCalled();
  });

  it('refuses to replace an existing key', () => {
    create();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('#dark-generate-key');
    expect(button.getAttribute('aria-disabled')).toBe('true');
    button.click();
    fixture.componentInstance.generateKeys();
    expect(service.generateKeys).not.toHaveBeenCalled();
  });

  it('prevents duplicate requests while generation is running', () => {
    const pending = new Subject<DarkAuthenticationStatus>();
    service.load.and.returnValue(of({ ...status, publicKey: null }));
    service.generateKeys.and.returnValue(pending);
    create();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('#dark-generate-key');
    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(fixture.nativeElement.textContent).toContain('admin.dark-auth.generating');
    button.click();
    fixture.componentInstance.generateKeys();
    expect(service.generateKeys).toHaveBeenCalledTimes(1);
    pending.next({ ...status, state: 'pending_registration' });
    pending.complete();
    fixture.detectChanges();
    expect(fixture.componentInstance.loading).toBeFalse();
  });

  it('shows a safe generation error without exposing backend diagnostics', () => {
    service.load.and.returnValue(of({ ...status, publicKey: null }));
    service.generateKeys.and.returnValue(throwError(() => new Error('PRIVATE-MATERIAL-MUST-NOT-APPEAR')));
    create();
    fixture.nativeElement.querySelector('#dark-generate-key').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('admin.dark-auth.generation-failed');
    expect(fixture.nativeElement.textContent).not.toContain('PRIVATE-MATERIAL');
    expect(fixture.componentInstance.loading).toBeFalse();
    expect(fixture.componentInstance.generated).toBeFalse();
  });

  it('does not load administrator data during server rendering', () => {
    TestBed.overrideProvider(PLATFORM_ID, { useValue: 'server' });
    create();
    expect(service.load).not.toHaveBeenCalled();
  });
});
