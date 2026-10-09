import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ThemedLangSwitchComponent } from 'src/app/shared/lang-switch/themed-lang-switch.component';

import { ContextHelpToggleComponent } from '../../../../app/header/context-help-toggle/context-help-toggle.component';
import { HeaderComponent as BaseComponent } from '../../../../app/header/header.component';
import { ThemedSearchNavbarComponent } from '../../../../app/search-navbar/themed-search-navbar.component';
import { ThemedAuthNavMenuComponent } from '../../../../app/shared/auth-nav-menu/themed-auth-nav-menu.component';
import { ImpersonateNavbarComponent } from '../../../../app/shared/impersonate-navbar/impersonate-navbar.component';
import { ThemedNavbarComponent } from 'src/app/navbar/themed-navbar.component';

@Component({
  selector: 'ds-themed-header',
  styleUrls: ['header.component.scss'],
  // styleUrls: ['../../../../app/header/header.component.scss'],
  templateUrl: 'header.component.html',
  // templateUrl: '../../../../app/header/header.component.html',
  imports: [
    AsyncPipe,
    ContextHelpToggleComponent,
    ImpersonateNavbarComponent,
    NgbDropdownModule,
    ThemedAuthNavMenuComponent,
    ThemedLangSwitchComponent,
    ThemedSearchNavbarComponent,
    TranslateModule,
    ThemedNavbarComponent

  ],
})
export class HeaderComponent extends BaseComponent {
  private readonly translateService = inject(TranslateService);

  /** Landing site URL, localized (es | en | pt) based on the active DSpace language. */
  get logoUrl(): string {
    const lang = (this.translateService.currentLang || this.translateService.defaultLang || 'es').toLowerCase();
    const segment = lang.startsWith('pt') ? 'pt' : lang.startsWith('en') ? 'en' : 'es';
    return `https://new.lareferencia.info/${segment}/home`;
  }
}
