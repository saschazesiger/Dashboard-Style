# Reference app

A small device console built on Dashboard-Style 3.0 the way a project uses it: one page, five views, live data from
a fake backend, and a project bundle that holds only what the app uses. Copy from it. Live on GitHub Pages
(`.github/workflows/pages.yml`), or open `index.html` from disk.

| File | What |
|---|---|
| `index.html` | the app frame, the overlays (command palette, notification centre, the filter sheets, the ticket dialog, the row menu; the markup only, `app.js` makes their controllers) and the load order: fonts, the bundle, the colour preset, the project theme, the project's own CSS, then the bundle's script, `data.js` and `app.js` (all `defer`) |
| `ds.config.json` | the bundle's config for `tools/bundle.mjs`: the files it scans, where the bundle goes (`ds/`), the copy (`../dist`) and the glyphs `app.js` draws from a variable |
| `ds/` | the project bundle, written by `node ../dist/tools/bundle.mjs --config ds.config.json` and committed: `ds.bundle.css`, `ds.bundle.js` (a classic script that sets `window.DS` with only the modules the app uses), `ds.bundle.json` (the report: why each component, module and glyph is in) and `properties.css` |
| `ds-check.json` | the config of `tools/check-project.mjs`: the project rules of AGENTS.md on this app |
| `theme.css` | the project theme: component hooks and the project's own `--ex-*` tokens; the colours come from a generated preset (`dist/themes/presets/`, one file for light and dark) |
| `app.css` | the project's own components, prefix `ex-`, from tokens only |
| `data.js` | the fake backend (`window.ExampleApi`), promises with latency; a project calls its API here |
| `app.js` | the app: rendering, navigation, live data, every interaction |

In a project the links point at the vendored copy (`vendor/dashboard-style/...`), not at `../dist/`. After a change
that names another class, attribute, module or glyph, write the bundle again and commit it with the change; CI runs
`tools/bundle.mjs --check` (here `test/bundle.test.js`) and `tools/check-project.mjs --config ds-check.json` (here
`test/check-project.test.js`):

```sh
node ../dist/tools/bundle.mjs --config ds.config.json          # writes ds/
node ../dist/tools/bundle.mjs --config ds.config.json --check  # fails a stale bundle
node ../dist/tools/check-project.mjs --config ds-check.json
```

## Where each pattern lives

| Pattern | View | In `app.js` (or the file named) |
|---|---|---|
| A project bundle instead of `ds.css` and `ds.js`; class names written out in full (a map or a ternary of whole names), so the scan sees them; glyph names from data listed in `icons` | all | `index.html`, `ds.config.json`, `STATUS`, `TICKET_STATUS` |
| The frame's behaviour by attributes and one `DS.init(document)`: the menu button, the rail above 900px, the modal drawer below, the drawer's pill, remembered groups (`data-ds-shell`, `data-ds-drawer`) | frame | `index.html`, Wiring |
| Skeleton on the first load, held with `settleLoader()`, then `staggerOnce()` | start | `start()` |
| The start in short tasks: the frame and the skeleton paint first; the notification centre, the palette, the view, its charts (below the fold on a phone), the backlog and the ticket dialog's controls each follow in a task of their own (`nextTask()`), so no task of the start is long on a slow phone | start | `start()`, `mountOverview(defer)`, `renderView({ defer })`, `ticketControls()` |
| Hash routes with `DS.motion.transition()`: fade-through between destinations, forward into a device and back out of it, the focus on the new title when the navigation took it (`focus: true`; `title` after a choice in the modal drawer or a sheet) | all | `go()`, `renderView()`, the route click handler |
| What a view creates (grids, charts, panels) goes when the view does | all | `keep()`, `renderView()` |
| Icons of the static markup: `data-icon` with `data-icon-place`, drawn by `DS.icons.fill(document)`; the glyphs that carry a class of their component (`ds-menu__check`, `ds-chevron`) put in by hand | frame | `index.html`, Wiring |
| Command palette: Ctrl+K or the search button, commands with groups and pages (the theme, the accent), a `#` page of tickets, devices found by a provider (data, never Recent) | all | `palette`, `index.html` |
| Notification centre: the bell's unread count, the backlog added quietly, arrivals from the poll announced, read state saved on `read`, an action that opens the ticket dialog | all | `centre`, `notification()`, `poll()` |
| Account menu with the theme switch (`data-ds-scheme-switch`), in step with the one under Settings; applied before the first paint from `DS.store` | all | `index.html`, `mountSettings()` |
| Snackbars: undo after a delete (`action`), one error per cause (`key`, `closeToasts()`), a restart that waits (`DS.toast.promise()`), the sync's progress (`DS.toast.progress()`) | all | `undoToast()`, `restart()`, `runSync()` |
| A message for the whole app (`.ds-banner`) while the backend does not answer, in and out through `flip()` on the panel | all (Settings cuts the connection) | `showOffline()`, `poll()` |
| Time range with refresh and an auto interval (`data-ds-timerange`), kept in the address; every `ds:refresh` loads the chart again | Overview | `rangeAttributes()`, `mountOverview()`, `loadMetrics()`, the `ds:change` and `ds:refresh` listeners |
| Charts (`DS.chart`): an area over the range with a threshold, columns per day; new data morphs | Overview, Device | `mountOverview()`, `loadMetrics()`, `mountDevice()` |
| Tiles that count on (`countUp()`), each opening the devices in a saved view | Overview | `tilesHtml()`, `updateTiles()` |
| Alerts that come and go with the data (`flip()` on their stack, `live`; a dismiss moves the focus to the next alert, `refocus`) | Overview | `alertsHtml()`, `updateAlerts()` |
| Open tickets in a row list, the feed as a timeline with icon markers (`flip({ live: true })` with `morphHtml`), relative times that stay current (`data-ds-time`) | Overview | `openTicketsHtml()`, `activityHtml()`, `timeHtml()` |
| Saved views (`DS.views`): built-in views as query strings, the user's own saved in the browser, "Edited", the address carrying the view and its state (the hash: `data-ds-views-url="off"` and the page writes it) | Devices | `VIEWS`, `viewsHtml()`, `mountDevices()` (`apply`, `remember`) |
| Filter bar (`DS.filterbar`): search and selects, applied chips, Clear all, the count; folded into a side sheet when narrow | Devices | `filterbarHtml()`, `passes()`, `mountDevices()` (`show`), `#filters-sheet` |
| Data grid (`DS.datagrid`): sort by several columns, the selection with its bar (`.ds-swap` with the action bar), the column chooser with a preset, the row menu (`ds:action`), paging with its pager, CSV export, the no-results state; secondary columns dropped on phones; started in its first state (one render) | Devices | `deviceColumns()`, `mountDevices()`, `rowAction()`, `selectedIds()`, `pagerHtml()` |
| Refresh: the rows dim and the loading bar runs (`DS.motion.refresh()`) | Devices | `refreshDevices()` |
| Confirm dialog built by `DS.overlay.confirm()` (busy with `onConfirm`), then undo in a snackbar | Devices, Device | `confirmDelete()`, `deleteDevices()`, `undoToast()` |
| Object page (`DS.object`): a sticky head that condenses and folds its actions (`data-ds-page-head`), jump links as a bar (`data-ds-toc`, `data-ds-toc-hash="off"` beside hash routes), a section that edits in place (`ds:save` cancelled, the busy faces, `done()`), a date picker in the form (made on `ds:edit`, so a page that is only read does not pay for it), live values patched in place | Device | `deviceHtml()`, `mountDevice()`, `updateDevicePage()`, the `ds:edit` and `ds:save` listeners |
| Facet filter panel (`DS.facets`) beside a data grid: counts per option, applied chips, folded into a sheet on phones; expandable rows (`detail`) with their actions | Tickets | `ticketsHtml()`, `ticketCounts()`, `mountTickets()`, `ticketDetailHtml()`, `#facets-sheet` |
| Dialog with a form, validation on submit (the count said with `DS.overlay.announce()`), a combobox of the devices (`DS.combobox` with items), a date picker (`DS.datepicker`) | Tickets, everywhere through New ticket | `openTicketDialog()`, `createTicket()`, `setError()` |
| Switches that apply at once | Settings | the `data-setting` change |
| The accent as a theme preset (another `light-dark()` file, loaded next to the old one, which goes once the new one applies) | Settings, palette | `applyAccent()`, the script in `index.html` |
| Edited fields marked (`.ds-field--changed`), Save and Discard in the save bar (`DS.overlay.savebar()`), saved with `DS.motion.busy()`; a disclosure, an icon swap, a field and its button | Settings | `syncOrgChanges()`, the `org-form` submit, `savebar-discard`, `copy-key`; the bar in `index.html` |
| Fast on a slow phone: 10 rows per page below 600px, plain times in grid cells (the rows render again on every poll), the grid created in its first state, controllers of what is hidden made after the first paint or on first use | all | `pageSize()`, `cellTimeHtml()`, `mountDevices()`, `mountTickets()`, `start()`, the `ds:edit` listener |
