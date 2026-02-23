import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { APP_CONFIG } from '@dspace/config/app-config.interface';

import { environment } from '../../../../environments/environment';
import {
  ReportSummary,
  SummaryWithTrendData,
  UserAction,
  UserActivityReportService,
  UserActivityStats,
} from './users-activities-report.service';

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
    it('should return an Observable<UserAction[]>', () => {
      const mockActions: UserAction[] = [
        {
          actionType: 'SUBMITTED',
          userName: 'User 1',
          email: 'user1@example.com',
          actionDate: '2023-01-01',
          itemUUID: 'uuid-1',
        },
      ];

      service.getAllActions().subscribe((actions) => {
        expect(actions.length).toBe(1);
        expect(actions).toEqual(mockActions);
      });

      const req = httpMock.expectOne(`${baseUrl}${endpoint}/actions`);
      expect(req.request.method).toBe('GET');
      req.flush(mockActions);
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
