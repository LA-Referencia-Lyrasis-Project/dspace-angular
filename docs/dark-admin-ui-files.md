# dARK Administrative UI File Inventory

| File | Purpose |
| --- | --- |
| `src/app/admin/admin-darks/admin-darks.component.ts` | Loads local dARK data, applies filters and pagination, exports CSV, and starts mint/retry/refresh processes. |
| `src/app/admin/admin-darks/admin-darks.component.html` | Administrative table, filters, state badges, row actions, and bulk mint action. |
| `src/app/admin/admin-darks/admin-darks.component.scss` | Table sizing and long-error presentation. |
| `src/app/admin/admin-routes.ts` | Registers `/admin/darks`. |
| `src/app/shared/menu/providers/darks.menu.ts` | Adds the dARK registry to the site administrator sidebar. |
| `src/app/app.menus.ts` | Registers `DarksMenuProvider` in the administrator menu structure. |
| `src/assets/i18n/en.json5` | English dARK UI labels and messages. |
| `src/assets/i18n/pt-BR.json5` | Brazilian Portuguese dARK UI labels and messages. |
| `src/assets/i18n/es.json5` | Spanish dARK UI labels and messages. |
| `docs/dark-admin-ui.md` | Functional and operational documentation for the screen. |
| `docs/dark-admin-ui-files.md` | This inventory. |

The Angular screen depends on the backend endpoint implemented by
`dspace-server-webapp/src/main/java/org/dspace/app/rest/DarkAdminRestController.java`
and on the DSpace `dark` script. It does not perform Minter requests directly.
