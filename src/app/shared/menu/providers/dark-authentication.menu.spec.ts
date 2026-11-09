/**
 * The contents of this file are subject to the license and copyright
 * detailed in the LICENSE and NOTICE files at the root of the source
 * tree and available online at
 *
 * http://www.dspace.org/license/
 */

import { TestBed } from '@angular/core/testing';
import { AuthorizationDataService } from '@dspace/core/data/feature-authorization/authorization-data.service';
import { AuthorizationDataServiceStub } from '@dspace/core/testing/authorization-service.stub';
import { of } from 'rxjs';

import { MenuItemType } from '../menu-item-type.model';
import { PartialMenuSection } from '../menu-provider.model';
import { DarkAuthenticationMenuProvider } from './dark-authentication.menu';

describe('DarkAuthenticationMenuProvider', () => {

  const expectedSections: PartialMenuSection[] = [
    {
      visible: true,
      model: {
        type: MenuItemType.LINK,
        text: 'admin.dark-auth.title',
        link: '/admin/dark-authentication',
      },
      icon: 'key',
    },
  ];

  let provider: DarkAuthenticationMenuProvider;
  let authorizationServiceStub = new AuthorizationDataServiceStub();

  beforeEach(() => {
    spyOn(authorizationServiceStub, 'isAuthorized').and.returnValue(
      of(true),
    );

    TestBed.configureTestingModule({
      providers: [
        DarkAuthenticationMenuProvider,
        { provide: AuthorizationDataService, useValue: authorizationServiceStub },
      ],
    });
    provider = TestBed.inject(DarkAuthenticationMenuProvider);
  });

  it('should be created', () => {
    expect(provider).toBeTruthy();
  });

  it('getSections should return expected menu sections', (done) => {
    provider.getSections().subscribe((sections) => {
      expect(sections).toEqual(expectedSections);
      done();
    });
  });
});
