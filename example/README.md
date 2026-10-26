# Reference app

A small device console built on Dashboard-Style the way a project uses it: one page, four views, live data from a
fake backend. Copy from it. Live on GitHub Pages (`.github/workflows/pages.yml`), or open `index.html` from disk.

| File | What |
|---|---|
| `index.html` | the app frame, the overlays (side sheet, dialogs, menu) and the load order: fonts, `ds.css`, the theme, the project's own CSS, then `ds.js` and the scripts |
| `theme.css` | the project theme: a component hook, the project's own `--ex-*` tokens, two accents as role overrides |
| `app.css` | the project's own components, prefix `ex-`, from tokens only |
| `data.js` | the fake backend (`window.ExampleApi`), promises with latency; a project calls its API here |
| `app.js` | the app: rendering, navigation, live data, every interaction |

In a project the links point at the vendored copy (`vendor/dashboard-style/ds.css` ...), not at `../dist/`.

## Where each pattern lives

| Pattern | View | In `app.js` |
|---|---|---|
| Skeleton on the first load, held with `settleLoader()`, then `staggerOnce()` | start | `start()` |
| Hash routes with `DS.motion.transition()` (fade-through), focus on the new title when the navigation took it (`focus: true`: from the modal drawer) | all | `go()`, `renderView()` |
| Drawer pill (`DS.indicator`), modal drawer and scrim (`DS.overlay`), `data-scrolled` | frame | Wiring, `DS.dom.watchScrolled()` |
| Ripple, tooltips (`data-tip`) | all | `DS.ripple.attach()`, `DS.overlay.tooltips()` |
| Tiles that count on (`countUp()`) | Overview | `updateTiles()` |
| Alerts that come and go with the data (`flip()` on their stack, `live`; a dismiss moves the focus to the next alert, `refocus`) | Overview | `alertsHtml()`, `updateAlerts()` |
| Busy and done faces, progress bar and figure landing together (`DS.dom.progress()`, `countUp()`) | Overview | `runSync()`, `showSync()` |
| A chart of the project's own whose bars grow once (`.ds-enter--fill-y`) | Overview | `chartHtml()`, `growChart()` |
| A live feed (`flip({ live: true })` with `morphHtml`) | Overview | `poll()` |
| Search per keystroke, filter chips, sort with the turning arrow | Devices | `renderRows()` |
| Bulk selection: header box with `indeterminate`, bulk actions | Devices | `syncSelection()`, `bulkHtml()` |
| Empty state after a filter, and back | Devices | `renderRows()` |
| Refresh: `.ds-stale` and the loading bar (`DS.motion.refresh()`) | Devices | `refreshDevices()` |
| Row menu (`DS.overlay`, keyboard included) | Devices | `toggleMenu()`, the `rowMenu` listener |
| Confirm dialog, then undo in a snackbar | Devices | `confirmDelete()`, `deleteDevices()`, `undoToast()` |
| Side sheet, previous and next (`transition()` forward and back), live refresh without a transition | Devices | `openSheet()`, `stepSheet()`, `poll()` |
| Expandable rows (`aria-expanded`, `inert`) | Tickets | `ticketRowsHtml()`, the `data-toggle-ticket` click |
| Dialog with a form, validation on submit, combobox | Tickets | `openTicketDialog()`, `createTicket()`, `setError()`, the combobox section |
| Switches that apply at once | Settings | the `data-setting` change |
| Radio cards that switch the theme (tokens on `.ds-theme`) | Settings | the `accent` change, `theme.css` |
| Form saved with `DS.motion.busy()`, collapsible section, icon swap | Settings | the `org-form` submit, `copy-key` |
