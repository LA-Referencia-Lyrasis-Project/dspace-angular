import { Clipboard } from '@angular/cdk/clipboard';
import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { BtnDisabledDirective } from '../../shared/btn-disabled.directive';
import {
  AdminDarkAuthService,
  DarkAuthenticationStatus,
} from './admin-dark-auth.service';

/** Administrative key registration panel. Loading is browser-only to keep status out of SSR caches. */
@Component({
  selector: 'ds-admin-dark-auth',
  templateUrl: './admin-dark-auth.component.html',
  imports: [
    BtnDisabledDirective,
    FormsModule,
    TranslateModule,
  ],
})
export class AdminDarkAuthComponent implements OnInit {
  private readonly service = inject(AdminDarkAuthService);
  private readonly clipboard = inject(Clipboard);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  status?: DarkAuthenticationStatus;
  loading = false;
  failed = false;
  confirmationError: string | null = null;
  generating = false;
  generationFailed = false;
  generated = false;
  registrationConfirmed = false;
  copied = false;
  copyFailed = false;

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.refresh();
    }
  }

  refresh(): void {
    this.loading = true;
    this.failed = false;
    this.confirmationError = null;
    this.generating = false;
    this.generationFailed = false;
    this.generated = false;
    this.registrationConfirmed = false;
    this.status = undefined;
    this.copied = false;
    this.copyFailed = false;
    this.service.load().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (status) => {
        this.status = status;
        this.loading = false;
      },
      error: () => {
        this.failed = true;
        this.loading = false;
      },
    });
  }

  generateKeys(): void {
    if (!this.status?.enabled || this.status.publicKey || this.loading) {
      return;
    }
    this.loading = true;
    this.generating = true;
    this.generationFailed = false;
    this.generated = false;
    this.failed = false;
    this.confirmationError = null;
    this.registrationConfirmed = false;
    this.copied = false;
    this.copyFailed = false;
    this.service.generateKeys().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (status) => {
        this.status = status;
        this.loading = false;
        this.generating = false;
        this.generated = true;
      },
      error: () => {
        this.loading = false;
        this.generating = false;
        this.generationFailed = true;
      },
    });
  }

  confirmRegistration(): void {
    if (!this.registrationConfirmed || !this.status || this.loading) {
      return;
    }
    this.loading = true;
    this.failed = false;
    this.confirmationError = null;
    this.service.confirm(this.status).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (status) => {
        this.status = status;
        this.loading = false;
        this.registrationConfirmed = false;
      },
      error: (error: unknown) => {
        const status = error instanceof HttpErrorResponse ? error.status : null;
        this.confirmationError = status === 401 ? 'session-expired'
          : status === 403 ? 'confirmation-forbidden'
            : status === 0 ? 'connection-failed'
              : 'confirmation-failed';
        this.loading = false;
      },
    });
  }

  copyPublicKey(): void {
    if (this.status?.publicKey) {
      this.copied = this.clipboard.copy(this.status.publicKey);
      this.copyFailed = !this.copied;
    }
  }
}
