import { HttpClient } from '@angular/common/http';
import {
  inject,
  Injectable,
} from '@angular/core';
import {
  APP_CONFIG,
  AppConfig,
} from '@dspace/config/app-config.interface';
import { Observable } from 'rxjs';

import { RESTURLCombiner } from '../../../core/url-combiner/rest-url-combiner';

export interface UserAction {
  actionType: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN' | 'REVIEWED';
  userName: string;
  email: string;
  actionDate: string;
  itemUUID: string;
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


@Injectable({
  providedIn: 'root',
})
export class UserActivityReportService {
  private readonly appConfig: AppConfig = inject(APP_CONFIG);
  private readonly ENPOINT_URL = '/reports/users-activities';

  constructor(private http: HttpClient) {}

  /**
   * Get all user statistics
   */
  getUsers(): Observable<UserActivityStats[]> {
    const url = new RESTURLCombiner(this.appConfig.rest.baseUrl, this.ENPOINT_URL).toString();
    return this.http.get<UserActivityStats[]>(url);
  }

  /**
   * Get summary statistics only
   */
  getSummary(): Observable<ReportSummary> {
    const url = new RESTURLCombiner(this.appConfig.rest.baseUrl, `${this.ENPOINT_URL}/summary`).toString();
    return this.http.get<ReportSummary>(url);
  }

  /**
   * Get all actions without aggregation
   */
  getAllActions(): Observable<UserAction[]> {
    const url = new RESTURLCombiner(this.appConfig.rest.baseUrl, `${this.ENPOINT_URL}/actions`).toString();
    return this.http.get<UserAction[]>(url);
  }

  /**
   * Get summary statistics with trend data aggregated by month
   */
  getSummaryWithTrends(): Observable<SummaryWithTrendData> {
    const url = new RESTURLCombiner(this.appConfig.rest.baseUrl, `${this.ENPOINT_URL}/summary-with-trends`).toString();
    return this.http.get<SummaryWithTrendData>(url);
  }
}
