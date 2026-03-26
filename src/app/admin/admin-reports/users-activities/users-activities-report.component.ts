import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import {
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import ApexCharts, { ApexOptions } from 'apexcharts';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import {
  PaginatedUserActionsResponse,
  ReportSummary,
  SummaryWithTrendData,
  UserAction,
  UserActivityReport,
  UserActivityReportService,
  UserActivityStats,
} from './users-activities-report.service';

@Component({
  selector: 'ds-users-activities-report',
  imports: [
    CommonModule,
    FormsModule,
    NgbModule,
    TranslateModule,
  ],
  templateUrl: './users-activities-report.component.html',
  styleUrls: ['./users-activities-report.component.scss'],
})
export class UserActivitiesReportComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('trendChartContainer') chartContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('submissionsChartContainer') submissionsChartContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('reviewsChartContainer') reviewsChartContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('approvalsChartContainer') approvalsChartContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('rejectionsChartContainer') rejectionsChartContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('withdrawalsChartContainer') withdrawalsChartContainer?: ElementRef<HTMLDivElement>;

  // LocalStorage key for tab persistence
  private readonly ACTIVE_TAB_KEY = 'dspace-users-activities-active-tab';

  report: UserActivityReport | null = null;
  summary: ReportSummary | null = null;
  summaryWithTrends: SummaryWithTrendData | null = null;
  users: UserActivityStats[] | null = null;
  actions: UserAction[] | null = null;
  loading = false;
  error: string | null = null;

  activeTab: 'summary' | 'users' | 'actions' = 'summary';
  searchEmail = '';
  sortField: 'name' | 'submissions' | 'reviews' | 'approvals' | 'rejections' | 'withdrawals' = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Pagination for users table
  currentPage = 1;
  itemsPerPage = 10;

  // Server-side pagination/filtering for actions table
  actionsCurrentPage = 1;
  actionsPageSize = 10;
  actionsTotalElements = 0;
  actionsTotalPages = 0;
  actionsFilterItemId = '';
  actionsFilterActionType = '';
  actionsFilterUserEmail = '';
  actionsFilterUserName = '';
  private actionsLoaded = false;

  // Date filter for trend data
  startDate = '';
  endDate = '';
  filteredTrendData: { [month: string]: { [actionType: string]: number } } = {};

  // View type: 'monthly' or 'yearly'
  viewType: 'monthly' | 'yearly' = 'monthly';

  // Aggregated yearly data
  yearlyTrendData: { [year: string]: { [actionType: string]: number } } = {};

  // Flag to track if data has been loaded from API
  chartDataLoaded = false;

  // ApexCharts instance
  private chartInstance: ApexCharts | null = null;
  private submissionsChartInstance: ApexCharts | null = null;
  private reviewsChartInstance: ApexCharts | null = null;
  private approvalsChartInstance: ApexCharts | null = null;
  private rejectionsChartInstance: ApexCharts | null = null;
  private withdrawalsChartInstance: ApexCharts | null = null;

  // Pending chart data to render once view is initialized
  private pendingChartData: { periods: string[]; series: any[] } | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private reportService: UserActivityReportService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
  ) { }

  ngOnInit(): void {
    this.restoreActiveTab();
    this.loadDataForTab();
  }

  ngAfterViewInit(): void {
    // If there's pending chart data, render it now that the view is initialized
    if (this.pendingChartData && this.chartContainer) {
      this.renderChart(this.pendingChartData.periods, this.pendingChartData.series);
      this.pendingChartData = null;
    }

    if (this.users && this.activeTab === 'users') {
      this.renderUserStatsCharts();
    }
  }

  ngOnDestroy(): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
    if (this.submissionsChartInstance) {
      this.submissionsChartInstance.destroy();
    }
    if (this.reviewsChartInstance) {
      this.reviewsChartInstance.destroy();
    }
    if (this.approvalsChartInstance) {
      this.approvalsChartInstance.destroy();
    }
    if (this.rejectionsChartInstance) {
      this.rejectionsChartInstance.destroy();
    }
    if (this.withdrawalsChartInstance) {
      this.withdrawalsChartInstance.destroy();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDataForTab(): void {
    switch (this.activeTab) {
      case 'summary':
        this.loadSummary();
        break;
      case 'users':
        this.loadUsers();
        break;
      case 'actions':
        this.loadActions();
        break;
    }
  }

  loadSummary(): void {
    if (this.summaryWithTrends) {
      this.initializeDefaultDateRange();
      this.filteredTrendData = this.getFilteredTrendData();
      this.chartDataLoaded = true;
      this.updateChartData();
      return; // Already loaded
    }

    this.loading = true;
    this.error = null;

    this.reportService.getSummaryWithTrends()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.summaryWithTrends = data;
          this.summary = data;
          this.initializeDefaultDateRange();
          this.filteredTrendData = this.getFilteredTrendData();
          this.chartDataLoaded = true;
          this.updateChartData();
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err: unknown) => {
          console.error('Error loading summary:', err);
          this.error = 'Error loading summary data. Please try again later.';
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  loadUsers(): void {
    if (this.users) {
      return; // Already loaded
    }

    this.loading = true;
    this.error = null;

    this.reportService.getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.users = data;
          this.loading = false;
          this.cdr.detectChanges();
          setTimeout(() => {
            this.renderUserStatsCharts();
          }, 0);
        },
        error: (err: unknown) => {
          console.error('Error loading users:', err);
          this.error = 'Error loading user statistics. Please try again later.';
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  loadActions(): void {
    if (this.actionsLoaded) {
      return; // Already loaded
    }

    this.fetchActions();
  }

  private fetchActions(): void {
    const params = this.getActionsQueryParams();

    this.loading = true;
    this.error = null;

    this.reportService.getAllActions(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.assignActionsResponse(data);
          this.actionsLoaded = true;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err: unknown) => {
          console.error('Error loading actions:', err);
          this.error = 'Error loading actions data. Please try again later.';
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  private getActionsQueryParams() {
    return {
      page: this.actionsCurrentPage - 1,
      size: this.actionsPageSize,
      itemId: this.actionsFilterItemId.trim() || undefined,
      actionType: this.actionsFilterActionType.trim() || undefined,
      userEmail: this.actionsFilterUserEmail.trim() || undefined,
      userName: this.actionsFilterUserName.trim() || undefined,
    };
  }

  private assignActionsResponse(response: PaginatedUserActionsResponse): void {
    this.actions = response.content || [];
    this.actionsTotalElements = response.totalElements ?? 0;
    this.actionsTotalPages = response.totalPages ?? 0;
    this.actionsCurrentPage = (response.currentPage ?? 0) + 1;
    this.actionsPageSize = response.pageSize ?? this.actionsPageSize;
  }

  onActionsFilterChange(): void {
    this.actionsCurrentPage = 1;
    this.actionsLoaded = false;
    this.fetchActions();
  }

  resetActionsFilters(): void {
    this.actionsFilterItemId = '';
    this.actionsFilterActionType = '';
    this.actionsFilterUserEmail = '';
    this.actionsFilterUserName = '';
    this.actionsCurrentPage = 1;
    this.actionsLoaded = false;
    this.fetchActions();
  }

  onActionsPageChange(page: number): void {
    this.actionsCurrentPage = page;
    this.actionsLoaded = false;
    this.fetchActions();
  }

  getFilteredUsers() {
    if (!this.users) {
      return [];
    }

    let filtered = this.users;

    // Filter by email if search text provided
    if (this.searchEmail.trim()) {
      const search = this.searchEmail.toLowerCase();
      filtered = filtered.filter(u =>
        u.email.toLowerCase().includes(search) ||
        u.userName.toLowerCase().includes(search),
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (this.sortField) {
        case 'name':
          aVal = a.userName.toLowerCase();
          bVal = b.userName.toLowerCase();
          break;
        case 'submissions':
          aVal = a.totalSubmissions;
          bVal = b.totalSubmissions;
          break;
        case 'reviews':
          aVal = a.totalReviews;
          bVal = b.totalReviews;
          break;
        case 'approvals':
          aVal = a.totalApprovals;
          bVal = b.totalApprovals;
          break;
        case 'rejections':
          aVal = a.totalRejections;
          bVal = b.totalRejections;
          break;
        case 'withdrawals':
          aVal = a.totalWithdrawals;
          bVal = b.totalWithdrawals;
          break;
      }

      if (aVal < bVal) { return this.sortDirection === 'asc' ? -1 : 1; }
      if (aVal > bVal) { return this.sortDirection === 'asc' ? 1 : -1; }
      return 0;
    });

    return filtered;
  }

  /**
   * Get paginated users for the current page
   */
  getPaginatedUsers() {
    const filtered = this.getFilteredUsers();
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  }

  /**
   * Get total number of pages
   */
  getTotalPages(): number {
    const filtered = this.getFilteredUsers();
    return Math.ceil(filtered.length / this.itemsPerPage);
  }

  /**
   * Go to a specific page
   */
  goToPage(page: number): void {
    const totalPages = this.getTotalPages();
    if (page >= 1 && page <= totalPages) {
      this.currentPage = page;
    }
  }

  /**
   * Get array of page numbers for pagination display
   */
  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const pages: number[] = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  toggleSort(field: 'name' | 'submissions' | 'reviews' | 'approvals' | 'rejections' | 'withdrawals'): void {
    this.currentPage = 1;
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
  }

  private renderUserStatsCharts(): void {
    if (!this.users || this.users.length === 0) {
      return;
    }

    this.renderUserChart(
      'submissions',
      this.submissionsChartContainer,
      this.getUserChartTitle('submissions'),
      this.getTopUsersBy('submissions'),
    );

    this.renderUserChart(
      'reviews',
      this.reviewsChartContainer,
      this.getUserChartTitle('reviews'),
      this.getTopUsersBy('reviews'),
    );

    this.renderUserChart(
      'approvals',
      this.approvalsChartContainer,
      this.getUserChartTitle('approvals'),
      this.getTopUsersBy('approvals'),
    );

    this.renderUserChart(
      'rejections',
      this.rejectionsChartContainer,
      this.getUserChartTitle('rejections'),
      this.getTopUsersBy('rejections'),
    );

    this.renderUserChart(
      'withdrawals',
      this.withdrawalsChartContainer,
      this.getUserChartTitle('withdrawals'),
      this.getTopUsersBy('withdrawals'),
    );
  }

  private getUserChartTitle(metric: 'submissions' | 'reviews' | 'approvals' | 'rejections' | 'withdrawals'): string {
    return this.translate.instant(`admin.reports.users-activities.top-10-${metric}`);
  }

  private getTopUsersBy(metric: 'submissions' | 'reviews' | 'approvals' | 'rejections' | 'withdrawals') {
    const users = this.users ? [...this.users] : [];

    const getValue = (user: UserActivityStats): number => {
      switch (metric) {
        case 'submissions':
          return user.totalSubmissions || 0;
        case 'reviews':
          return typeof (user as any).totalReviews === 'number'
            ? (user as any).totalReviews
            : (user.totalApprovals + user.totalRejections + user.totalWithdrawals);
        case 'approvals':
          return user.totalApprovals || 0;
        case 'rejections':
          return user.totalRejections || 0;
        case 'withdrawals':
          return user.totalWithdrawals || 0;
        default:
          return 0;
      }
    };

    return users
      .map(user => ({
        name: user.userName || user.email,
        value: getValue(user),
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }

  /**
   * Check if there is data for a specific metric to show the chart
   */
  hasDataFor(metric: 'submissions' | 'reviews' | 'approvals' | 'rejections' | 'withdrawals'): boolean {
    return this.getTopUsersBy(metric).length > 0;
  }

  private renderUserChart(
    key: 'submissions' | 'reviews' | 'approvals' | 'rejections' | 'withdrawals',
    container: ElementRef<HTMLDivElement> | undefined,
    title: string,
    data: { name: string; value: number }[],
  ): void {
    if (!container || !container.nativeElement) {
      return;
    }

    if (data.length === 0) {
      return;
    }

    const categories = data.map(item => item.name);
    const series = [{ name: title, data: data.map(item => item.value) }];

    const titleText = this.viewType === 'yearly'
      ? this.translate.instant('admin.reports.users-activities.yearly')
      : this.translate.instant('admin.reports.users-activities.monthly');
    const xAxisTitle = this.viewType === 'yearly'
      ? this.translate.instant('admin.reports.users-activities.year')
      : this.translate.instant('admin.reports.users-activities.month');
    const yAxisTitle = this.translate.instant('admin.reports.users-activities.count');

    const options: ApexOptions = {
      chart: {
        type: 'bar',
        height: 320,
        toolbar: { show: false },
      },
      title: { text: title },
      series,
      xaxis: {
        categories,
        labels: { trim: true },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: '70%',
        },
      },
      dataLabels: { enabled: false },
      tooltip: {
        theme: 'light',
        y: { formatter: (value: number) => Math.round(value).toString() },
      },
    };

    const destroyInstance = (instance: ApexCharts | null) => {
      if (instance) {
        instance.destroy();
      }
    };

    switch (key) {
      case 'submissions':
        destroyInstance(this.submissionsChartInstance);
        this.submissionsChartInstance = new ApexCharts(container.nativeElement, options);
        this.submissionsChartInstance.render();
        break;
      case 'reviews':
        destroyInstance(this.reviewsChartInstance);
        this.reviewsChartInstance = new ApexCharts(container.nativeElement, options);
        this.reviewsChartInstance.render();
        break;
      case 'approvals':
        destroyInstance(this.approvalsChartInstance);
        this.approvalsChartInstance = new ApexCharts(container.nativeElement, options);
        this.approvalsChartInstance.render();
        break;
      case 'rejections':
        destroyInstance(this.rejectionsChartInstance);
        this.rejectionsChartInstance = new ApexCharts(container.nativeElement, options);
        this.rejectionsChartInstance.render();
        break;
      case 'withdrawals':
        destroyInstance(this.withdrawalsChartInstance);
        this.withdrawalsChartInstance = new ApexCharts(container.nativeElement, options);
        this.withdrawalsChartInstance.render();
        break;
    }
  }

  setTab(tab: 'summary' | 'users' | 'actions'): void {
    this.activeTab = tab;
    this.saveActiveTab();
    this.loadDataForTab();

    if (tab === 'users') {
      setTimeout(() => {
        this.renderUserStatsCharts();
      }, 0);
    }
  }

  /**
   * Restore the active tab from localStorage, defaulting to 'summary' if not found
   */
  private restoreActiveTab(): void {
    const savedTab = localStorage.getItem(this.ACTIVE_TAB_KEY);
    if (savedTab === 'summary' || savedTab === 'users' || savedTab === 'actions') {
      this.activeTab = savedTab;
    }
  }

  /**
   * Save the active tab to localStorage
   */
  private saveActiveTab(): void {
    localStorage.setItem(this.ACTIVE_TAB_KEY, this.activeTab);
  }

  /**
   * Initialize default date range to last 12 months
   */
  private initializeDefaultDateRange(): void {
    if (!this.summaryWithTrends?.trendData || Object.keys(this.summaryWithTrends.trendData).length === 0) {
      return;
    }

    const months = Object.keys(this.summaryWithTrends.trendData).sort();
    if (months.length === 0) {
      return;
    }

    // Get the last month available
    const lastMonth = months[months.length - 1];

    // Calculate 12 months back from the last month
    const date = new Date(lastMonth + '-01');
    date.setMonth(date.getMonth() - 11); // 12 months total (current + 11 previous)

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const startOfRange = `${year}-${month}`;

    this.startDate = startOfRange;
    this.endDate = lastMonth;
  }

  /**
   * Validate date range - only check order, no maximum range restriction
   */
  private validateDateRange(): void {
    if (!this.startDate || !this.endDate) {
      return;
    }

    // Calculate months between start and end
    const [startYear, startMonth] = this.startDate.split('-').map(Number);
    const [endYear, endMonth] = this.endDate.split('-').map(Number);

    const startDate = new Date(startYear, startMonth - 1);
    const endDate = new Date(endYear, endMonth - 1);

    if (startDate > endDate) {
      // Swap if start is after end
      const temp = this.startDate;
      this.startDate = this.endDate;
      this.endDate = temp;
      return;
    }
  }

  /**
   * Aggregate monthly data into yearly data
   */
  private aggregateYearlyData(): void {
    this.yearlyTrendData = {};

    if (!this.summaryWithTrends?.trendData) {
      return;
    }

    for (const [month, monthData] of Object.entries(this.summaryWithTrends.trendData)) {
      const year = month.split('-')[0];

      if (!this.yearlyTrendData[year]) {
        this.yearlyTrendData[year] = {
          SUBMITTED: 0,
          APPROVED: 0,
          REJECTED: 0,
          WITHDRAWN: 0,
        };
      }

      for (const [actionType, count] of Object.entries(monthData)) {
        if (this.yearlyTrendData[year][actionType] !== undefined) {
          this.yearlyTrendData[year][actionType] += count;
        }
      }
    }
  }

  /**
   * Toggle between monthly and yearly view
   */
  switchViewType(viewType: 'monthly' | 'yearly'): void {
    this.viewType = viewType;

    if (viewType === 'yearly') {
      // For yearly view, we don't need date validation as strict
      this.aggregateYearlyData();
    }

    this.updateChartData();
  }

  /**
   * Filter trend data by date range (YYYY-MM format)
   */
  getFilteredTrendData(): { [month: string]: { [actionType: string]: number } } {
    if (!this.summaryWithTrends?.trendData) {
      return {};
    }

    const filtered: { [month: string]: { [actionType: string]: number } } = {};

    for (const [month, data] of Object.entries(this.summaryWithTrends.trendData)) {
      // If no date filter, include all data
      if (!this.startDate && !this.endDate) {
        filtered[month] = data;
        continue;
      }

      // Check if month is within the range
      const includeMonth = (
        (!this.startDate || month >= this.startDate) &&
        (!this.endDate || month <= this.endDate)
      );

      if (includeMonth) {
        filtered[month] = data;
      }
    }

    return filtered;
  }

  /**
   * Update filtered trend data when date filter changes
   */
  onDateFilterChange(): void {
    if (this.viewType === 'monthly') {
      this.validateDateRange();
    }
    this.filteredTrendData = this.getFilteredTrendData();
    this.updateChartData();
  }

  /**
   * Reset date filters
   */
  resetDateFilter(): void {
    this.initializeDefaultDateRange();
    this.filteredTrendData = this.getFilteredTrendData();
    this.updateChartData();
  }

  /**
   * Prepare and update chart data from filtered trend data
   */
  updateChartData(): void {
    const dataToUse = this.viewType === 'yearly' ? this.yearlyTrendData : this.filteredTrendData;

    if (!dataToUse || Object.keys(dataToUse).length === 0) {
      if (this.chartInstance) {
        this.chartInstance.destroy();
        this.chartInstance = null;
      }
      return;
    }

    // Get sorted periods (months or years)
    const periods = Object.keys(dataToUse).sort();

    // Define colors for each action type
    const colors: { [key: string]: string } = {
      SUBMITTED: '#0066cc',
      APPROVED: '#28a745',
      REJECTED: '#dc3545',
      WITHDRAWN: '#ffc107',
    };

    // Prepare series data for each action type
    const series: any[] = [];
    const actionTypes = ['SUBMITTED', 'APPROVED', 'REJECTED', 'WITHDRAWN'];

    const legendLabels: { [key: string]: string } = {
      SUBMITTED: this.translate.instant('admin.reports.users-activities.submitted'),
      APPROVED: this.translate.instant('admin.reports.users-activities.approved'),
      REJECTED: this.translate.instant('admin.reports.users-activities.rejected'),
      WITHDRAWN: this.translate.instant('admin.reports.users-activities.withdrawn'),
    };

    for (const actionType of actionTypes) {
      const data = periods.map(period => {
        const periodData = dataToUse[period] || {};
        return periodData[actionType] || 0;
      });

      series.push({
        name: legendLabels[actionType] || actionType,
        data: data,
        color: colors[actionType],
      });
    }

    // Trigger change detection and render chart
    // Use Promise.resolve() to defer to the next microtask to ensure DOM is ready
    Promise.resolve().then(() => {
      this.cdr.detectChanges();
      if (this.chartContainer) {
        this.renderChart(periods, series);
      } else {
        // If container not available yet, store pending data
        this.pendingChartData = { periods, series };
      }
    });
  }

  /**
   * Render ApexCharts chart
   */
  private renderChart(periods: string[], series: any[]): void {
    if (!this.chartContainer || !this.chartContainer.nativeElement) {
      console.warn('Chart container not available');
      return;
    }

    // Destroy previous chart if it exists
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }

    // Clear the container
    const container = this.chartContainer.nativeElement;
    container.innerHTML = '';

    const titleText = this.viewType === 'yearly'
      ? this.translate.instant('admin.reports.users-activities.yearly')
      : this.translate.instant('admin.reports.users-activities.monthly');
    const xAxisTitle = this.viewType === 'yearly'
      ? this.translate.instant('admin.reports.users-activities.year')
      : this.translate.instant('admin.reports.users-activities.month');
    const yAxisTitle = this.translate.instant('admin.reports.users-activities.count');

    const options: ApexOptions = {
      chart: {
        type: 'bar',
        height: 400,
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true,
          },
        },
      },
      title: {
        text: titleText,
      },
      series: series,
      xaxis: {
        categories: periods,
        type: 'category',
        title: {
          text: xAxisTitle,
        },
      },
      yaxis: {
        title: {
          text: yAxisTitle,
        },
        min: 0,
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          dataLabels: {
            position: 'top',
          },
        },
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right',
      },
      grid: {
        show: true,
        borderColor: '#f1f1f1',
      },
      tooltip: {
        theme: 'light',
        y: {
          formatter: (value: number) => Math.round(value).toString(),
        },
      },
    };

    try {
      this.chartInstance = new ApexCharts(container, options);
      this.chartInstance.render();
    } catch (error) {
      console.error('Error rendering chart:', error);
    }
  }

  downloadCSV(): void {
    if (!this.users) {
      return;
    }

    const headers = ['Email', 'Name', 'Submissions', 'Reviews', 'Approvals', 'Rejections', 'Withdrawals'];
    const rows = this.users.map(user => [
      user.email,
      user.userName,
      user.totalSubmissions,
      user.totalApprovals + user.totalRejections + user.totalWithdrawals,
      user.totalApprovals,
      user.totalRejections,
      user.totalWithdrawals,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `users-activities-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

}
