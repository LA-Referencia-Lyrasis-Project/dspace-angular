/**
 * The contents of this file are subject to the license and copyright
 * detailed in the LICENSE and NOTICE files at the root of the source
 * tree and available online at
 *
 * http://www.dspace.org/license/
 */

import { Injectable } from '@angular/core';
import {
  combineLatest,
  map,
  Observable,
} from 'rxjs';

import { MenuItemType } from '../menu-item-type.model';
import {
  AbstractMenuProvider,
  PartialMenuSection,
} from '../menu-provider.model';
import { AuthorizationDataService } from 'src/app/core/data/feature-authorization/authorization-data.service';
import { FeatureID } from 'src/app/core/data/feature-authorization/feature-id';

/**
 * Menu provider to create the "Users Activities Report" menu in the admin sidebar
 */
@Injectable()
export class UsersActivitiesReportMenuProvider extends AbstractMenuProvider {
  constructor(
    protected authorizationService: AuthorizationDataService,
  ) {
    super();
  }

  public getSections(): Observable<PartialMenuSection[]> {
    return combineLatest([
      this.authorizationService.isAuthorized(FeatureID.AdministratorOf),
    ]).pipe(
      map(([isSiteAdmin]) => {
        return [
          {
            visible: isSiteAdmin,
            model: {
              type: MenuItemType.LINK,
              text: 'menu.section.reports.users-activities',
              link: '/admin/reports/users-activities',
            },
            icon: 'chart-line',
          },
        ] as PartialMenuSection[];
      }),
    );
  }
}
