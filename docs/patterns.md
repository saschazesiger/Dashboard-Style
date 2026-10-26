# Patterns

How the components combine into the pages and flows of an admin dashboard. Each entry names the components, the
motion, where focus goes and what is announced; the [reference app](../example/README.md) builds most of them (its
README maps each pattern to its code). Markup: [components.md](components.md); motion: [motion.md](motion.md).

Two rules hold everywhere:

- **Focus after a change.** A new view or page puts focus on its `<h1>` (`tabindex="-1"`); a closed overlay returns
  it to its opener (`DS.overlay` does it); a removed item hands it to its neighbour (`DS.motion.flip()` does it). Never
  leave focus on `<body>`.
- **Results are announced.** A busy button and its done face change only what is seen. Say what happened in a
  snackbar (`DS.overlay.toast()`, announced politely) or with `DS.overlay.announce()`; errors that block the user
  are alerts in the page, next to what failed.

## Page types

| Page | Components | Motion | Focus and announcement | In the reference app |
|---|---|---|---|---|
| **List** (devices, tickets, users) | page head with the count and one filled action, `.ds-action-bar` with search and filter chips, a table in a card (`.ds-table-wrap`, sorting, selection, row link) or `.ds-list` rows, `.ds-empty` for no results, `.ds-pagination` or a "Load more" text button | first render staggers once; search and filters re-render with `DS.dom.morphHtml` (keyed rows) inside `DS.motion.flip()`; refresh: `.ds-stale` and the loading bar | the search keeps focus while rows change; the count is announced after a filter ("12 devices") | [Devices](../example/index.html#/devices) |
| **Record** (one device, one ticket) | page head with a back link and actions, `.ds-facts` or `.ds-kv-list`, tabs for long records, a timeline of its history, a side sheet when opened from a list | the record opens with `DS.motion.transition()` (forward), back goes backward; previous and next in a sheet step with the shared axis | the title takes focus; a saved change is a snackbar | the side sheet of [Devices](../example/index.html#/devices) |
| **Settings** | cards per topic, switches that apply at once, a form with labels above fields and one Save button, `.ds-collapsible` for advanced options, a save bar for long forms | switches on their spring; Save runs `DS.motion.busy()` | a switch is its own result (no snackbar); a saved form says "Saved" in a snackbar; invalid fields get an error list and focus moves to the first | [Settings](../example/index.html#/settings) |
| **Overview** (the start page) | tiles with key figures, alerts that come and go with the data, a chart card, a live feed | tiles count on with `countUp()`; alerts and feed rows glide with `flip({ live: true })`, held while pointed at or focused | live changes are not announced one by one; an alert that needs action is | [Overview](../example/index.html#/overview) |
| **Wizard** (create in steps) | `.ds-steps` above one form per step, Back and Next (the last one names the result: "Create device"), a summary step | steps move on the shared axis (`transition()` forward and backward) | each step's heading takes focus; the step change is announced ("Step 2 of 3, Network") | |
| **Sign-in** | `.ds-auth`: one card with the product name, fields, one filled button and a text link | none beyond the busy button | the first field has focus on load; a failed sign-in is an alert above the fields, focused | |

## Flows

| Flow | Components | Motion | Focus and announcement | In the reference app |
|---|---|---|---|---|
| **Create** | a dialog with a form (short), a side sheet (long) or a wizard (several steps); the opener is the page's filled button | the dialog grows from its opener; the new row enters with the list's `flip()` | the first field on open; after Create focus returns to the opener and a snackbar names the result ("Device added") | the ticket dialog of [Tickets](../example/index.html#/tickets) |
| **Edit** | inline in a side sheet or on the record; `.ds-field--changed` marks edited fields; the save bar holds Save and Discard | values glide (`countUp`, bars); the save bar rises | focus stays where the user was; "Saved" in a snackbar, an error next to the field | the organisation form of [Settings](../example/index.html#/settings) |
| **Delete with undo** | a confirm dialog only when undo is impossible; otherwise delete at once with an Undo snackbar | the row leaves inside `flip()`; Undo brings it back the same way | focus moves to the neighbour row; the snackbar announces "Deleted, Undo" | delete in [Devices](../example/index.html#/devices) |
| **Bulk actions** | checkboxes in the first column, the header box (`indeterminate`), `.ds-selection-bar` with the count and the actions | the bar enters when the first row is selected; removed rows leave together | the count is announced ("3 selected"); after the action focus goes to the header box | bulk selection in [Devices](../example/index.html#/devices) |
| **A filter sheet** | a side sheet with fields and checks, Apply and Reset in its foot, the active filters as input chips above the list | the sheet slides in; the list re-renders inside `flip()` after Apply | focus returns to the Filter button; the result count is announced | |
| **A page that failed** | the page head stays; an error alert with what failed and a Retry button; partial data keeps showing | the alert enters; the loader settles first (`settleLoader()`), so nothing flickers | the alert is announced (`role="alert"`); Retry takes focus | |
| **A page that is gone** (a deleted record, a wrong link) | `.ds-empty` with a sentence that says what is gone and a link back to the list | none | the empty state's heading takes focus | |

## Column chooser

A table with optional columns gets a quiet icon button with the `columns` glyph (`aria-label="Columns"`,
`aria-haspopup="menu"`) that opens a menu of `role="menuitemcheckbox"` items, one per column, each with
`aria-checked`. Toggling one keeps the menu open, shows or hides the column at once (the header and the cells; no
motion on the table's width) and saves the choice. The first column (the record's name) is not optional and is not
in the menu. Markup of the menu: [components.md](components.md#menu).
