import {
  ChangeDetectorRef,
  NO_ERRORS_SCHEMA,
} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { TranslateLoaderMock } from '@dspace/core/testing/translate-loader.mock';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import {
  TranslateLoader,
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import {
  of,
  throwError,
} from 'rxjs';

import { UserActivitiesReportComponent } from './users-activities-report.component';
import {
  PaginatedUserActionsResponse,
  SummaryWithTrendData,
  UserAction,
  UserActivityReportService,
  UserActivityStats,
} from './users-activities-report.service';

// Mock ApexCharts
class MockApexCharts {
  render() { return Promise.resolve(); }
  destroy() { }
  updateOptions() { return Promise.resolve(); }
  updateSeries() { return Promise.resolve(); }
}

(window as any).ApexCharts = MockApexCharts;

describe('UserActivitiesReportComponent', () => {
  let component: UserActivitiesReportComponent;
  let fixture: ComponentFixture<UserActivitiesReportComponent>;
  let reportService: jasmine.SpyObj<UserActivityReportService>;
  let translateService: TranslateService;

  const mockSummaryData: SummaryWithTrendData = {
    submissions: 10,
    reviews: 5,
    approvals: 3,
    rejections: 1,
    withdrawals: 1,
    totalUsers: 2,
    trendData: {
      '2023-01': { SUBMITTED: 5, APPROVED: 2 },
      '2023-02': { SUBMITTED: 5, APPROVED: 1 },
    },
  };

  const mockUsersData: UserActivityStats[] = [
    {
      userName: 'Alice',
      email: 'alice@example.com',
      totalSubmissions: 5,
      totalReviews: 2,
      totalApprovals: 2,
      totalRejections: 0,
      totalWithdrawals: 0,
      actions: [],
    },
    {
      userName: 'Bob',
      email: 'bob@example.com',
      totalSubmissions: 2,
      totalReviews: 1,
      totalApprovals: 1,
      totalRejections: 0,
      totalWithdrawals: 0,
      actions: [],
    },
  ];

  const mockActionsData: UserAction[] = [
    {
      actionType: 'SUBMITTED',
      userName: 'Alice',
      email: 'alice@example.com',
      actionDate: '2023-01-15',
      itemUUID: 'uuid-1',
      itemId: 'uuid-1',
      itemTitle: 'Item 1',
    },
  ];

  const mockActionsResponse: PaginatedUserActionsResponse = {
    content: mockActionsData,
    totalElements: 1,
    totalPages: 1,
    currentPage: 0,
    pageSize: 10,
  };

  beforeEach(waitForAsync(() => {
    reportService = jasmine.createSpyObj('UserActivityReportService', [
      'getSummaryWithTrends',
      'getUsers',
      'getAllActions',
    ]);

    reportService.getSummaryWithTrends.and.returnValue(of(mockSummaryData));
    reportService.getUsers.and.returnValue(of(mockUsersData));
    reportService.getAllActions.and.returnValue(of(mockActionsResponse));

    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        NgbModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateLoaderMock,
          },
        }),
        UserActivitiesReportComponent,
      ],
      providers: [
        { provide: UserActivityReportService, useValue: reportService },
        ChangeDetectorRef,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    translateService = TestBed.inject(TranslateService);
    spyOn(translateService, 'instant').and.callFake((key: any) => key);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserActivitiesReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load summary data on init', () => {
    expect(reportService.getSummaryWithTrends).toHaveBeenCalled();
    expect(component.summaryWithTrends).toEqual(mockSummaryData);
    expect(component.loading).toBeFalse();
  });

  describe('Tab switching', () => {
    it('should switch to users tab and load users', fakeAsync(() => {
      component.setTab('users');
      tick();
      expect(component.activeTab).toBe('users');
      expect(reportService.getUsers).toHaveBeenCalled();
      expect(component.users).toEqual(mockUsersData);
    }));

    it('should switch to actions tab and load actions', fakeAsync(() => {
      component.setTab('actions');
      tick();
      expect(component.activeTab).toBe('actions');
      expect(reportService.getAllActions).toHaveBeenCalledWith({
        page: 0,
        size: 10,
        itemId: undefined,
        actionType: undefined,
        userEmail: undefined,
        userName: undefined,
      });
      expect(component.actions).toEqual(mockActionsData);
    }));
  });

  describe('User filtering and sorting', () => {
    beforeEach(fakeAsync(() => {
      component.setTab('users');
      tick();
      fixture.detectChanges();
    }));

    it('should filter users by email', () => {
      component.searchEmail = 'alice';
      const filtered = component.getFilteredUsers();
      expect(filtered.length).toBe(1);
      expect(filtered[0].userName).toBe('Alice');
    });

    it('should sort users by submissions descending', () => {
      component.sortField = 'submissions';
      component.sortDirection = 'desc';
      const filtered = component.getFilteredUsers();
      expect(filtered[0].userName).toBe('Alice');
      expect(filtered[1].userName).toBe('Bob');
    });

    it('should toggle sort direction', () => {
      component.sortField = 'name';
      component.sortDirection = 'asc';
      component.toggleSort('name');
      expect(component.sortDirection).toBe('desc');
    });
  });

  describe('Date range filtering', () => {
    it('should aggregate yearly data when switching view type', () => {
      component.switchViewType('yearly');
      expect(component.viewType).toBe('yearly');
      expect(Object.keys(component.yearlyTrendData)).toContain('2023');
      expect(component.yearlyTrendData['2023'].SUBMITTED).toBe(10);
    });

    it('should filter trend data by date range', () => {
      component.startDate = '2023-01';
      component.endDate = '2023-01';
      const filtered = component.getFilteredTrendData();
      expect(Object.keys(filtered).length).toBe(1);
      expect(filtered['2023-01']).toBeDefined();
      expect(filtered['2023-02']).toBeUndefined();
    });

    it('should reset date filter', () => {
      component.startDate = '2023-01';
      component.endDate = '2023-01';
      component.resetDateFilter();
      expect(component.startDate).toBe('2022-03'); // 12 months back from 2023-02
      expect(component.endDate).toBe('2023-02');
    });
  });

  describe('Error handling', () => {
    it('should handle error when loading summary', () => {
      reportService.getSummaryWithTrends.and.returnValue(throwError(() => new Error('API Error')));
      component.summaryWithTrends = null;
      component.loadSummary();
      expect(component.error).toBeDefined();
      expect(component.loading).toBeFalse();
    });
  });
});
