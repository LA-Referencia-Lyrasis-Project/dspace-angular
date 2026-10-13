import {
  HttpClient,
  HttpParams,
} from '@angular/common/http';
import {
  DatePipe,
  NgClass,
} from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ScriptDataService } from '@dspace/core/data/processes/script-data.service';
import { RemoteData } from '@dspace/core/data/remote-data';
import { NotificationsService } from '@dspace/core/notification-system/notifications.service';
import { Process } from '@dspace/core/processes/process.model';
import { HALEndpointService } from '@dspace/core/shared/hal-endpoint.service';
import { getFirstCompletedRemoteData } from '@dspace/core/shared/operators';
import { getProcessDetailRoute } from '../../process-page/process-page-routing.paths';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators';

interface DarkPage {
  content: DarkRow[] | MissingRow[];
  totalElements: number;
  page: number;
  size: number;
}

interface DarkRow {
  ark: string;
  itemId: string;
  status: string;
  target: string;
  lastError: string;
  createdAt: string;
  updatedAt: string;
}

interface MissingRow {
  itemId: string;
  title: string;
}

@Component({
  selector: 'ds-admin-darks',
  templateUrl: './admin-darks.component.html',
  styleUrls: ['./admin-darks.component.scss'],
  imports: [DatePipe, FormsModule, NgbPaginationModule, NgClass, RouterLink, TranslateModule],
})
export class AdminDarksComponent implements OnInit {
  view: 'assigned' | 'missing' = 'assigned';
  ark = '';
  status = '';
  itemId = '';
  errorsOnly = false;
  sort = 'updatedAt';
  direction: 'ASC' | 'DESC' = 'DESC';
  rows: Array<DarkRow | MissingRow> = [];
  total = 0;
  page = 1;
  size = 20;
  loading = false;
  running = false;

  constructor(
    private http: HttpClient,
    private halService: HALEndpointService,
    private scriptDataService: ScriptDataService,
    private notifications: NotificationsService,
    private translate: TranslateService,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.load();
  }

  load(page: number = this.page): void {
    this.page = page;
    this.loading = true;
    this.changeDetectorRef.markForCheck();
    this.http.get<DarkPage>(this.endpoint(), { params: this.params() }).pipe(
      finalize(() => {
        this.loading = false;
        this.changeDetectorRef.markForCheck();
      }),
    ).subscribe({
      next: (result) => {
        this.rows = result.content;
        this.total = result.totalElements;
        this.changeDetectorRef.markForCheck();
      },
      error: () => this.notifications.error(this.translate.get('admin.darks.load.error')),
    });
  }

  changeView(view: 'assigned' | 'missing'): void {
    this.view = view;
    this.errorsOnly = false;
    this.page = 1;
    this.load();
  }

  applyFilters(): void {
    this.page = 1;
    this.load();
  }

  setDateSort(sort: string): void {
    if (this.sort === sort) {
      this.direction = this.direction === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sort = sort;
      this.direction = 'DESC';
    }
    this.load();
  }

  mintAll(): void {
    this.runScript([{ name: '--mint-all', value: null }], 'admin.darks.mint.started', 'admin.darks.mint.error');
  }

  mintItem(itemId: string): void {
    this.runScript([{ name: '--mint-uuid', value: itemId }], 'admin.darks.mint.started', 'admin.darks.mint.error');
  }

  refreshItem(itemId: string): void {
    this.runScript([{ name: '--refresh-uuid', value: itemId }],
      'admin.darks.refresh.started', 'admin.darks.refresh.error');
  }

  refreshPendingStatuses(): void {
    this.runScript([{ name: '--refresh-status', value: null }],
      'admin.darks.refresh-all.started', 'admin.darks.refresh-all.error');
  }

  statusClass(status: string): string {
    switch (status) {
      case 'R': return 'text-bg-warning';
      case 'D':
      case 'U': return 'text-bg-primary';
      case 'P': return 'text-bg-success';
      default: return 'text-bg-secondary';
    }
  }

  exportCsv(): void {
    this.http.get(this.endpoint('export'), { params: this.params(false), responseType: 'blob' }).subscribe({
      next: (blob) => {
        const anchor = document.createElement('a');
        anchor.href = URL.createObjectURL(blob);
        anchor.download = 'dark-registry.csv';
        anchor.click();
        URL.revokeObjectURL(anchor.href);
      },
      error: () => this.notifications.error(this.translate.get('admin.darks.export.error')),
    });
  }

  isDark(row: DarkRow | MissingRow): row is DarkRow {
    return 'ark' in row;
  }

  private runScript(parameters: { name: string; value: string | null }[], startedMessage: string, errorMessage: string): void {
    this.running = true;
    this.scriptDataService.invoke('dark', parameters, []).pipe(
      getFirstCompletedRemoteData(),
      finalize(() => this.running = false),
    ).subscribe((result: RemoteData<Process>) => {
      if (result.hasSucceeded) {
        this.notifications.success(this.translate.get(startedMessage));
        void this.router.navigateByUrl(getProcessDetailRoute(result.payload.processId));
      } else {
        this.notifications.error(this.translate.get(errorMessage));
      }
    });
  }

  private endpoint(suffix: string = ''): string {
    return `${this.halService.getRootHref()}/admin/darks${suffix ? `/${suffix}` : ''}`;
  }

  private params(paginated: boolean = true): HttpParams {
    let params = new HttpParams().set('view', this.view).set('ark', this.ark).set('status', this.status)
      .set('itemId', this.itemId).set('errorsOnly', this.errorsOnly);
    if (paginated) {
      params = params.set('page', this.page - 1).set('size', this.size).set('sort', this.sort)
        .set('direction', this.direction);
    }
    return params;
  }
}
