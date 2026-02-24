import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // Added CommonModule
import { TranslateModule } from '@ngx-translate/core'; // Added TranslateModule
import { RouterModule } from '@angular/router';

import { HomeNewsComponent as BaseComponent } from '../../../../../app/home-page/home-news/home-news.component';
import { SearchFormComponent } from '../../shared/search-form/search-form.component';

@Component({
  selector: 'ds-themed-home-news',
  styleUrls: ['./home-news.component.scss'],
  // styleUrls: ['../../../../../app/home-page/home-news/home-news.component.scss'],
  templateUrl: './home-news.component.html',
  // templateUrl: '../../../../../app/home-page/home-news/home-news.component.html',
  standalone: true,
  imports: [CommonModule, TranslateModule, SearchFormComponent, RouterModule]
})
export class HomeNewsComponent extends BaseComponent {
}
