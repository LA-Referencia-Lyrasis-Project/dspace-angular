# Semantic Search Feature Overview (dspace-angular)

## Scope

This document summarizes semantic-search changes in branch `semantic-search` compared to `main`.

## Frontend Feature Summary

1. Search UI now supports mode selection: `lexical`, `semantic`, or `hybrid`.
2. Search requests include `searchType` to avoid backend/cache ambiguity.
3. Semantic enablement is driven by backend config property `semantic.search.enabled`.
4. Hybrid enablement is driven by backend config property `hybrid.search.enabled`.
5. Result header shows current mode (`Lexical`, `Semantic`, or `Hybrid`).
6. Item list element renders backend relevance `score`.

## Runtime Behavior

1. `SearchFormComponent` shows a search-type select.
2. `SearchComponent` reads backend properties `semantic.search.enabled` and `hybrid.search.enabled` via `/api/config/properties`.
3. `SearchService` always includes `searchType` in request URL.
4. `SearchResponseParsingService` uses request URL as self/cache identity to avoid collisions between lexical, semantic, and hybrid responses for same query.
5. `SearchOptions` and `PaginatedSearchOptions` now serialize `searchType` to REST.

## Semantic And Hybrid Search Configuration Inputs

### Backend-driven flag (consumed by Angular)

1. `semantic.search.enabled` (read from REST config properties endpoint)
2. `hybrid.search.enabled` (read from REST config properties endpoint)

### Query parameter used by Angular search requests

1. `searchType=lexical|semantic|hybrid`

### Search result payload fields used by Angular

1. `score` (mapped into `SearchResult.score`)
2. `hitHighlights`

## Environment Variables

No semantic- or hybrid-specific environment variable was added in Angular for this branch.

Use existing config loading variables when deploying semantic or hybrid search behavior:

1. `DSPACE_APP_CONFIG_PATH` (external app config file)
2. `DSPACE_REST_SSL`
3. `DSPACE_REST_HOST`
4. `DSPACE_REST_PORT`
5. `DSPACE_REST_NAMESPACE`
6. `DSPACE_UI_SSL` or `DSPACE_SSL`
7. `DSPACE_UI_HOST` or `DSPACE_HOST`
8. `DSPACE_UI_PORT` or `DSPACE_PORT`
9. `DSPACE_UI_NAMESPACE` or `DSPACE_NAMESPACE`

Notes:

1. These are generic Angular deployment variables.
2. Semantic and hybrid modes are toggled by backend property exposure and search query parameter.

## Files Changed in Branch

1. `src/app/core/data/search-response-parsing.service.ts`
2. `src/app/core/shared/search/models/paginated-search-options.model.ts`
3. `src/app/core/shared/search/models/search-options.model.ts`
4. `src/app/core/shared/search/models/search-result.model.ts`
5. `src/app/home-page/home-page.component.html`
6. `src/app/home-page/home-page.component.ts`
7. `src/app/search-page/configuration-search-page.component.ts`
8. `src/app/shared/object-list/search-result-list-element/item-search-result/item-types/item/item-search-result-list-element.component.html`
9. `src/app/shared/search-form/search-form.component.html`
10. `src/app/shared/search-form/search-form.component.scss`
11. `src/app/shared/search-form/search-form.component.ts`
12. `src/app/shared/search-form/themed-search-form.component.ts`
13. `src/app/shared/search/search-configuration.service.ts`
14. `src/app/shared/search/search-results/search-results.component.html`
15. `src/app/shared/search/search-results/search-results.component.scss`
16. `src/app/shared/search/search.component.html`
17. `src/app/shared/search/search.component.ts`
18. `src/app/shared/search/search.service.spec.ts`
19. `src/app/shared/search/search.service.ts`
20. `src/assets/i18n/en.json5`
21. `src/assets/i18n/es.json5`
22. `src/assets/i18n/pt-BR.json5`
