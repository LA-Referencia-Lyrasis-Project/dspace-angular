# dARK Administrative UI

## Purpose

The dARK administrative screen gives site administrators visibility of the
local dARK registry and starts the existing DSpace `dark` scripts as background
processes. It is available at `/admin/darks` and is listed in the administrator
sidebar as "dARK registry".

The screen is not a replacement for the dARK Minter. It reads local DSpace
state and delegates minting, retry, and status refresh work to the backend
script infrastructure.

## Access and API

The route is visible only to users authorized as site administrators. Its data
comes from the backend endpoint `GET /api/admin/darks`, which is also protected
by the DSpace `ADMIN` authority.

Supported query parameters are:

| Parameter | Purpose |
| --- | --- |
| `view` | `assigned` for local dARK rows, or `missing` for Items with no local dARK association. |
| `ark` | Case-insensitive ARK filter. |
| `status` | dARK Minter state code filter: `R`, `D`, `U`, `P`, or `T`. |
| `itemId` | Item UUID filter. |
| `errorsOnly` | Limits the assigned view to records with `lastError`. |
| `page`, `size` | Pagination controls. |
| `sort`, `direction` | Sorting by `createdAt` or `updatedAt`. |

CSV export uses the same filters through `GET /api/admin/darks/export`.

The API and table expose ARK, Item UUID, status, target, last error, and local
timestamps. They intentionally do not expose `dark_id`, `client_item_id`, or
CIDs. The `dark` table does not use `resource_type_id` or
`tombstone_requested`.

## Views and actions

Selecting either view immediately reloads its data; no extra filter submission
is required.

### Items with dARK

This view lists local dARK associations. A saved Minter rejection is shown in
red and provides a retry action. The action starts:

```text
bin/dspace dark --mint-uuid <item-uuid>
```

Rows in draft (`D`) or update (`U`) state provide an individual status-refresh
action, which starts:

```text
bin/dspace dark --refresh-uuid <item-uuid>
```

Published (`P`) rows have no action. State badges follow the Minter state:

| State | Badge color |
| --- | --- |
| `R` | Orange |
| `D`, `U` | Blue |
| `P` | Green |
| `T` | Gray |

### Items without dARK

This view lists Items not associated with any local dARK row. A row action
starts `dark --mint-uuid <item-uuid>`. The bulk action starts:

```text
bin/dspace dark --mint-all
```

All script actions use Angular's `ScriptDataService`. On successful process
creation, the UI opens the standard DSpace process-detail page so the
administrator can inspect progress, logs, and failures.

## Translation keys

The screen uses `menu.section.darks` and `admin.darks.*` translation keys.
English, Brazilian Portuguese, and Spanish are maintained in:

- `src/assets/i18n/en.json5`
- `src/assets/i18n/pt-BR.json5`
- `src/assets/i18n/es.json5`
