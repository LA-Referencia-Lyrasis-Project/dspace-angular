import {
  HttpClient,
  HttpParams,
} from '@angular/common/http';
import {
  inject,
  Injectable,
} from '@angular/core';
import { Observable } from 'rxjs';

import { RESTURLCombiner } from '../../../core/url-combiner/rest-url-combiner';
import { APP_CONFIG, AppConfig } from 'src/config/app-config.interface';

export interface UserAction {
  actionType: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN' | 'REVIEWED';
  userName: string;
  email: string;
  actionDate: string;
  itemUUID: string;
  itemId?: string;
  itemTitle?: string;
  details?: string;
}

export interface UserActivityStats {
  userName: string;
  email: string;
  totalSubmissions: number;
  totalReviews: number;
  totalApprovals: number;
  totalRejections: number;
  totalWithdrawals: number;
  actions: UserAction[];
}

export interface UserActivityReport {
  totalUsers: number;
  totalSubmissions: number;
  totalReviews: number;
  totalApprovals: number;
  totalRejections: number;
  totalWithdrawals: number;
  userStats: UserActivityStats[];
}

export interface ReportSummary {
  submissions: number;
  reviews: number;
  approvals: number;
  rejections: number;
  withdrawals: number;
  totalUsers: number;
}

export interface SummaryWithTrendData extends ReportSummary {
  trendData: { [month: string]: { [actionType: string]: number } };
}

export interface PaginatedUserActionsResponse {
  content: UserAction[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface UserActionsQueryParams {
  page?: number;
  size?: number;
  itemId?: string;
  actionType?: string;
  userEmail?: string;
  userName?: string;
}


@Injectable({
  providedIn: 'root',
})
export class UserActivityReportService {
  private readonly appConfig: AppConfig = inject(APP_CONFIG);
  private readonly ENPOINT_URL = '/reports/users-activities';

  constructor(private http: HttpClient) { }

  /**
   * Get all user statistics
   */
  getUsers(): Observable<UserActivityStats[]> {
    const url = new RESTURLCombiner(this.ENPOINT_URL).toString();
    return this.http.get<UserActivityStats[]>(url);
  }

  /**
   * Get summary statistics only
   */
  getSummary(): Observable<ReportSummary> {
    const url = new RESTURLCombiner(`${this.ENPOINT_URL}/summary`).toString();
    return this.http.get<ReportSummary>(url);
  }

  /**
   * Get all actions with optional filters and pagination
   */
  getAllActions(params: UserActionsQueryParams = {}): Observable<PaginatedUserActionsResponse> {
    const url = new RESTURLCombiner(`${this.ENPOINT_URL}/actions`).toString();
    let httpParams = new HttpParams();

    if (params.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.size !== undefined) {
      httpParams = httpParams.set('size', params.size.toString());
    }
    if (params.itemId) {
      httpParams = httpParams.set('itemId', params.itemId);
    }
    if (params.actionType) {
      httpParams = httpParams.set('actionType', params.actionType);
    }
    if (params.userEmail) {
      httpParams = httpParams.set('userEmail', params.userEmail);
    }
    if (params.userName) {
      httpParams = httpParams.set('userName', params.userName);
    }

    return this.http.get<PaginatedUserActionsResponse>(url, { params: httpParams });
  }

  /**
   * Get summary statistics with trend data aggregated by month
   */
  getSummaryWithTrends(): Observable<SummaryWithTrendData> {
    const url = new RESTURLCombiner(`${this.ENPOINT_URL}/summary-with-trends`).toString();
    return this.http.get<SummaryWithTrendData>(url);
  }
}
