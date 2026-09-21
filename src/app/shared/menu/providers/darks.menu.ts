import { Injectable } from '@angular/core';
import { AuthorizationDataService } from '@dspace/core/data/feature-authorization/authorization-data.service';
import { FeatureID } from '@dspace/core/data/feature-authorization/feature-id';
import {
  map,
  Observable,
} from 'rxjs';

import { MenuItemType } from '../menu-item-type.model';
import {
  AbstractMenuProvider,
  PartialMenuSection,
} from '../menu-provider.model';

/** Adds the local dARK registry to the administrator sidebar. */
@Injectable()
export class DarksMenuProvider extends AbstractMenuProvider {
  constructor(protected authorizationService: AuthorizationDataService) {
    super();
  }

  public getSections(): Observable<PartialMenuSection[]> {
    return this.authorizationService.isAuthorized(FeatureID.AdministratorOf).pipe(
      map((isSiteAdmin) => [{
        visible: isSiteAdmin,
        model: { type: MenuItemType.LINK, text: 'menu.section.darks', link: '/admin/darks' },
        icon: 'fingerprint',
      }]),
    );
  }
}
