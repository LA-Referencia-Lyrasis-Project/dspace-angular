import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import {
  PaginatedUserActionsResponse,
  ReportSummary,
  SummaryWithTrendData,
  UserAction,
  UserActivityReportService,
  UserActivityStats,
} from './users-activities-report.service';
import { APP_CONFIG } from 'src/config/app-config.interface';

describe('UserActivityReportService', () => {
  let service: UserActivityReportService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.rest.baseUrl;
  const endpoint = environment.rest.nameSpace + '/reports/users-activities';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UserActivityReportService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: environment },
      ],
    });

    service = TestBed.inject(UserActivityReportService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getUsers', () => {
    it('should return an Observable<UserActivityStats[]>', () => {
      const mockUsers: UserActivityStats[] = [
        {
          userName: 'User 1',
          email: 'user1@example.com',
          totalSubmissions: 10,
          totalReviews: 5,
          totalApprovals: 3,
          totalRejections: 1,
          totalWithdrawals: 1,
          actions: [],
        },
      ];

      service.getUsers().subscribe((users) => {
        expect(users.length).toBe(1);
        expect(users).toEqual(mockUsers);
      });

      const req = httpMock.expectOne(`${baseUrl}${endpoint}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUsers);
    });
  });

  describe('getSummary', () => {
    it('should return an Observable<ReportSummary>', () => {
      const mockSummary: ReportSummary = {
        submissions: 100,
        reviews: 50,
        approvals: 40,
        rejections: 5,
        withdrawals: 5,
        totalUsers: 10,
      };

      service.getSummary().subscribe((summary) => {
        expect(summary).toEqual(mockSummary);
      });

      const req = httpMock.expectOne(`${baseUrl}${endpoint}/summary`);
      expect(req.request.method).toBe('GET');
      req.flush(mockSummary);
    });
  });

  describe('getAllActions', () => {
    it('should return an Observable<PaginatedUserActionsResponse>', () => {
      const mockActions: UserAction[] = [
        {
          actionType: 'SUBMITTED',
          userName: 'User 1',
          email: 'user1@example.com',
          actionDate: '2023-01-01',
          itemUUID: 'uuid-1',
          itemId: 'uuid-1',
          itemTitle: 'Item 1',
        },
      ];

      const mockResponse: PaginatedUserActionsResponse = {
        content: mockActions,
        totalElements: 1,
        totalPages: 1,
        currentPage: 0,
        pageSize: 10,
      };

      service.getAllActions({ page: 0, size: 10, actionType: 'SUB' }).subscribe((actions) => {
        expect(actions.content.length).toBe(1);
        expect(actions).toEqual(mockResponse);
      });

      const req = httpMock.expectOne((request) =>
        request.url === `${baseUrl}${endpoint}/actions`
        && request.params.get('page') === '0'
        && request.params.get('size') === '10'
        && request.params.get('actionType') === 'SUB',
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getSummaryWithTrends', () => {
    it('should return an Observable<SummaryWithTrendData>', () => {
      const mockSummaryWithTrends: SummaryWithTrendData = {
        submissions: 100,
        reviews: 50,
        approvals: 40,
        rejections: 5,
        withdrawals: 5,
        totalUsers: 10,
        trendData: {
          '2023-01': { SUBMITTED: 10, APPROVED: 5 },
        },
      };

      service.getSummaryWithTrends().subscribe((data) => {
        expect(data).toEqual(mockSummaryWithTrends);
      });

      const req = httpMock.expectOne(`${baseUrl}${endpoint}/summary-with-trends`);
      expect(req.request.method).toBe('GET');
      req.flush(mockSummaryWithTrends);
    });
  });
});
