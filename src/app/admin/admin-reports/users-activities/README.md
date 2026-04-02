# Submission and Review Report Page - DSpace Angular

## Overview

A comprehensive Angular component for displaying submission and review statistics extracted from DSpace provenance metadata. This page is integrated into the DSpace admin interface under the Reports section.

## Features

- **Summary Statistics**: Display total users, submissions, and reviews at a glance
- **User Statistics Tab**: View detailed statistics for each user with sorting and filtering
- **Actions Tab**: See all individual submission and review actions with dates
- **Search Functionality**: Search users by email or name
- **Sorting**: Click column headers to sort by name, submissions, or reviews
- **CSV Export**: Download report data as CSV file
- **Responsive Design**: Works on desktop and mobile devices

## Files Created

### Component Files

- `submission-review-report.component.ts` - Component logic
- `submission-review-report.component.html` - Template
- `submission-review-report.component.scss` - Styles

### Service

- `submission-review-report.service.ts` - Calls REST API endpoints

### Routing

- Updated `admin-reports-routes.ts` with new route

### Translations

- `submission-review-report.en.json` - English i18n strings

## Usage

### Access the Page

Once deployed, access the report at:

```
/admin/reports/submission-review
```

### Navigation

1. Go to DSpace Admin section
2. Click on "Reports"
3. Select "Submission and Review Report"

## Features Breakdown

### Summary Tab

- Displays key metrics: Total users, submissions, and reviews
- Shows overall activity overview
- CSV export button

### User Statistics Tab

- Table of all users and their submission/review counts
- Search box to filter by email or name
- Sortable columns (click header to sort)
- Shows submission count in blue badge
- Shows review count in green badge

### Actions Tab

- List of all individual actions (submissions and reviews)
- Shows who did what and when
- Details field contains additional information
- Color-coded action type badges

## API Integration

The component communicates with these REST API endpoints:

```typescript
GET / api / reporting / submission - review / report; // Full report
GET / api / reporting / submission - review / user / { email }; // User specific
GET / api / reporting / submission - review / summary; // Summary only
GET / api / reporting / submission - review / actions; // All actions
```

All endpoints require ADMIN authority.

## Service Methods

```typescript
// Get full report
reportService.getFullReport(): Observable<SubmissionReviewReport>

// Get user report
reportService.getUserReport(email: string): Observable<UserSubmissionReviewStats>

// Get summary
reportService.getSummary(): Observable<ReportSummary>

// Get all actions
reportService.getAllActions(): Observable<UserAction[]>
```

## Data Structures

### UserAction

```typescript
{
  actionType: 'SUBMITTED' | 'REVIEWED',
  userName: string,
  email: string,
  actionDate: string,
  itemUUID: string,
  details?: string
}
```

### UserSubmissionReviewStats

```typescript
{
  userName: string,
  email: string,
  totalSubmissions: number,
  totalReviews: number,
  actions: UserAction[]
}
```

### SubmissionReviewReport

```typescript
{
  totalUsers: number,
  totalSubmissions: number,
  totalReviews: number,
  userStats: UserSubmissionReviewStats[]
}
```

## Styling

The component uses Bootstrap 5 classes and custom SCSS for styling:

- Responsive grid layout
- Stat cards with shadows
- Colored badges for actions
- Hover effects on table rows
- Mobile-friendly design

### Color Scheme

- Primary (Blue): #007bff - Total users, submissions
- Success (Green): #28a745 - Reviews
- Info (Light Blue): #17a2b8 - Submitted action badge
- Danger (Red): #dc3545 - Error alerts

## Installation Steps

1. **Copy files to dspace-angular**:

   ```bash
   cp -r submission-review/ src/app/admin/admin-reports/
   ```

2. **Update routing** (already done):
   - Routes added to `admin-reports-routes.ts`

3. **Add translations** (already done):
   - English translations in i18n folder

4. **Build dspace-angular**:

   ```bash
   npm install
   npm run build
   ```

5. **Deploy**:
   - Copy built files to DSpace UI directory

## Customization

### Change Sort Order

Modify `sortDirection` in component:

```typescript
sortDirection: 'asc' | 'desc' = 'asc';
```

### Change Default Tab

Modify `activeTab` in component:

```typescript
activeTab: 'summary' | 'users' | 'actions' = 'summary';
```

### Add Filtering Options

Extend the `getFilteredUsers()` method to add date range, item filtering, etc.

### Modify CSV Export

Update the `downloadCSV()` method to include different fields or formatting.

## Translations

Add translations for other languages by creating similar files:

- `submission-review-report.es.json` - Spanish
- `submission-review-report.fr.json` - French
- `submission-review-report.de.json` - German

## Future Enhancements

1. **Pagination**: Add pagination for large datasets
2. **Date Range Filter**: Filter actions by date range
3. **Excel Export**: Export to Excel format
4. **Charts**: Add charts showing trends
5. **Real-time Updates**: WebSocket for live data
6. **Advanced Filtering**: Filter by collection, item type, etc.
7. **Bulk Actions**: Perform actions on selected users

## Troubleshooting

### Data Not Loading

- Verify admin user permissions
- Check browser console for errors
- Ensure backend API is running
- Verify REST endpoints are accessible

### Styling Issues

- Ensure Bootstrap 5 is included
- Check SCSS is properly compiled
- Verify CSS class names match Bootstrap version

### Translation Not Showing

- Confirm i18n file is in correct location
- Check file naming convention
- Verify language code matches i18n config

## Performance

- Component loads full report on init
- Client-side sorting and filtering (fast)
- CSV export done in-browser (no server load)
- Consider caching for large datasets

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Dependencies

- Angular 15+
- Bootstrap 5
- RxJS
- TypeScript
- ngx-translate

## License

Same as DSpace: https://duraspace.org/dspace/

---

**Component Status**: Production Ready
**Last Updated**: February 17, 2026
