## Data grid

Everything a console table needs, on top of the [Table](#table): sort by several columns, choose, resize and move
columns, select across pages, expand rows, tree rows and row groups with subtotals, edit in place, the keys of a
spreadsheet, a context menu, ten thousand rows, export. `js/datagrid.js` (`DS.datagrid`) is the behaviour, and the table keeps
its look: heights, hairlines, options, sticky rows, pinned columns, selection colours, expandable and stacked rows are
the table's. Every option is opt-in: a table with `data-ds-datagrid` and no options renders as it was, and each option adds
one thing. A table without `data-ds-datagrid` is never touched (the table stays plain).

Why its own folder: the table is markup a page writes; the grid renders its rows from data. Keeping them apart keeps the
plain table plain, and a page that needs only the look loads no grid code.

```html
<div class="ds-table-wrap">
  <table class="ds-table ds-datagrid" id="devices" aria-label="Devices" data-ds-datagrid
         data-ds-config='{"select":"multiple","focus":"cell","resize":true,"reorder":true,"multiSort":true,"persist":"devices"}'>
    <thead><tr>
      <th scope="col" data-ds-datagrid-col="name" data-ds-datagrid-sort>Device</th>
      <th scope="col" data-ds-datagrid-col="model" data-ds-datagrid-sort>Model</th>
      <th scope="col" class="ds-num" data-ds-datagrid-col="load" data-ds-datagrid-sort data-ds-datagrid-summary="avg" data-ds-datagrid-edit="number">Load</th>
    </tr></thead>
    <tbody>
      <tr data-ds-key="d1"><td>LAPTOP-0100</td><td>Laptop 14</td><td class="ds-num" data-value="37">37</td></tr>
      <tr data-ds-key="d2"><td>LAPTOP-0107</td><td>Laptop 13</td><td class="ds-num" data-value="74">74</td></tr>
    </tbody>
  </table>
</div>
```

The declarative path reads the table once: a column per header cell (`data-ds-datagrid-col` its key, else `c0`, `c1` ...;
`data-ds-datagrid-type` `number` or `date`, else `number` for a `.ds-num` cell; `data-ds-datagrid-sort` or a `.ds-table__sort`
button makes it sortable; `aria-sort` the first sort; `data-ds-datagrid-summary` and `data-ds-datagrid-edit` below; a header
cell without a visible label, such as an actions column, is locked in place and in view). A row per body row, keyed by
its `data-ds-key`, its values from each cell's `data-value`, else its text, and its cells' markup as they are. A
`.ds-table__detail` row after a row is its detail; `data-ds-datagrid-parent="<key>"` puts a row under another (tree rows).
The markup holds the data columns only: the grid adds its selection, details and actions columns. Options go into
`data-ds-config` (JSON).

From script, with data:

```js
const grid = DS.datagrid.create(table, {
  columns: [
    { key: 'name', label: 'Device', sortable: true, render: (row) => `<a class="ds-link-btn" href="/devices/${row.id}">${esc(row.name)}</a>` },
    { key: 'model', label: 'Model', sortable: true },
    { key: 'load', label: 'Load', type: 'number', sortable: true, summary: 'avg', edit: { type: 'number', validate: (value) => (value > 100 ? 'At most 100.' : '') } },
  ],
  rows: devices,                         // or source: (query, { signal }) => fetch(...)
  select: 'multiple', bar: '#bulk-bar',
  focus: 'cell',
  resize: true, reorder: true, chooser: '#columns-menu', persist: 'devices',
  page: { size: 50 }, pager: '#devices-pages',
});
grid.on('select', ({ count }) => ...);
grid.set({ filter: 'floor 2' });
```

### Options

Each option adds one thing; none is on by default.

| Option | Value | What it adds |
|---|---|---|
| `columns` | list of columns (below) | the columns, in their default order (the "Default" preset) |
| `rows` | array | client data: the grid filters, sorts, groups and pages it |
| `source` | `(query, { signal, export }) => result` | server data: `query` is `{ sort, filter, page }`; return (a promise of) `{ rows, total, summary }`. A newer query aborts the older one (`signal`). An export asks for every row: `page` is `null` and `export` is `true`. See [One data contract](#one-data-contract) |
| `key` | property name or `(row, index) => key` | a row's key (default `id`) |
| `label` | `(row) => text` | a row's name in checkbox labels and announcements (default its first column's text) |
| `sortable`, `multiSort` | `true` | every column sorts (else only those with `sortable: true`); Shift adds a column to the sort |
| `sort`, `filter`, `page` | `[{ key, dir }]`, text or function or `{ key: value }`, `{ size, index }` | the first state; `page` turns paging on |
| `select` | `'multiple'`, `'single'` | a selection column; `bar` names the `.ds-selection-bar` it drives |
| `focus` | `'cell'`, `'row'` | the APG grid: one tab stop and the keys below (`role="grid"`, or `treegrid` with tree rows or groups, which take `'row'` by default) |
| `resize`, `reorder` | `true` | a separator and a grip in each header cell |
| `chooser`, `presets` | a `.ds-menu`, `[{ id, label, columns }]` | the menu of presets and column boxes |
| `persist` | a `DS.store` namespace | order, visibility, the widths a person set, sort and page size are remembered |
| `detail` | `(row) => html` | a details column: an expandable row per row |
| `tree` | `true` or `{ children }` | tree rows: `children` a property (default `children`) or a function |
| `group` | a column key | row groups with a head row each, subtotals from the columns' `summary` |
| `actions` | `(row) => html` | a `.ds-table__actions` column |
| `menu` | a `.ds-menu` | the row's context menu: right click, Shift+F10 or the menu key, or a `[data-ds-datagrid-menu]` button in the row |
| `edit` | `false` | turns every column's `edit` off |
| `virtual` | `true` or `{ estimate, overscan }` | windowed rows (`DS.virtual`): only the rows near the viewport exist |
| `pager` | a `.ds-pagination` | buttons with `data-ds-datagrid-page` (`first`, `previous`, `next`, `last`), the range text, a `select[data-ds-datagrid-size]` |
| `foot`, `footLabel` | `false`, text | no summary row; its label (default "Total") |
| `emptyText`, `loadingText`, `errorText`, `file` | text | the states' words, the CSV file's name |

A column: `key`, `label`, `head` (header markup), `type` (`text`, `number`, `date`), `value(row)`, `sortValue(row)`,
`format(value, row)`, `render(row)` (markup, escaped by the page), `set(row, value)`, `className`, `headClass`,
`sortable`, `resizable`, `reorderable`, `hideable`, `hidden`, `filterable`, `export`, `exportValue(row)`, `width`,
`minWidth` (56), `maxWidth` (960), `summary` (`sum`, `avg`, `min`, `max`, `count` or a function of the rows),
`summaryFormat(value)` and `edit` (`true`, `'text'`, `'number'`, `'select'` or `{ type, options, required, validate }`).

The table's own options apply as they do to any table ([Table](#table)): size, density, shape and touch on the table
or a container, zebra, borders, sticky head and summary, pinned columns (a pinned column keeps its place: no grip),
stacked rows (`data-label` is written on every cell). The grid adds:

| Option | Classes | Where | What it does |
|---|---|---|---|
| Touch | `.ds-touch` | any container | the grip widens to a third of `--ds-target-min` (the header label moves aside for it), the separator to a quarter |
| Shape | `.ds-shape-*` | any container | multiplies the radius of the grip and of the editor's message |

### One data contract

Client and server data take the same three things: `sort` (a list of `{ key, dir }`, `dir` `ascending` or
`descending`), `filter` (text: a row whose formatted value in any `filterable` column contains it; a function of the row;
or `{ key: value }`, a value, a list of values or a function per column) and `page` (`{ index, size }`, or `null`).
With `rows` the grid applies them itself (`DS.datagrid.query()` is that pipeline, without a DOM); with `source` it sends them
and shows what comes back. The summary row sums every row that passes the filter (client), or shows `result.summary`
(server). Row groups and tree rows are arranged on the client in both cases, from the rows of the page.

### States inside the grid

The body holds one `.ds-datagrid__state` row while there is nothing to show: a loading line (`.ds-loading`, while the first
data loads), the error state (`.ds-empty--error` with "Try again", `data-ds-datagrid-command="retry"`; the rows of an
earlier page go), no results (`.ds-empty--no-results`, while a filter is set) or nothing yet (`.ds-empty--no-data`). A
reload with rows on screen dims them (`.ds-stale` on the body after `--ds-delay-loader`) with `aria-busy="true"` on the
table. Put a `<template data-ds-datagrid-state="empty|no-results|loading|error">` next to the table (in its wrapper) to use
your own markup.

### Selection

`select: 'multiple'` adds a checkbox per row and a select-all box in the header (mixed for some, `indeterminate`). A
click with Shift selects the range from the last row clicked. In the header box selects the page; once the page is
selected and more rows exist, the selection bar offers "Select all N" (`.ds-datagrid__every`), which selects every row
that passes the filter on every page (`all: true`; rows unchecked after it are listed in `except`). `'single'`: a radio
per row (`.ds-radio-input`, one group per grid), and a click on a row (outside its controls) selects it alone. A selected row has `.ds-table__row--selected` (and its checked box), so
the table colours it; in focus mode it also carries `aria-selected`.

```html
<div class="ds-toolbar"><div class="ds-swap">
  <div class="ds-action-bar">...</div>                                   <!-- the toolbar while nothing is selected -->
  <div class="ds-selection-bar" id="bulk-bar" role="toolbar" aria-label="Selected devices" hidden>
    <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Clear selection" data-ds-datagrid-command="clear">[icon close 20]</button>
    <p class="ds-selection-bar__count" aria-live="polite"></p>
    <div class="ds-selection-bar__actions">...</div>
  </div>
</div></div>
```

With `bar`, the grid writes the count, adds and removes "Select all N", runs the bar's `data-ds-datagrid-command` buttons,
and swaps the bar with the toolbar in their `.ds-swap` slot (`DS.motion.crossfade()`) when the count goes from 0 to 1
and back, so the table never moves; a bar outside a slot shows and hides. "Clear selection" moves focus to the header
box.

### Columns

- **Sort**: a sortable column's header holds a `.ds-table__sort` button. A click sorts by it (again: descending), with
  `multiSort` a Shift+click adds it to the sort, turns it, then takes it off. The first sorted column carries `aria-sort`;
  every sorted column shows its arrow (`data-ds-datagrid-dir` turns it), and with more than one a `.ds-datagrid__rank` figure
  and hidden words ("sort 2, descending"). A sort is announced. Rows glide to their places (`DS.motion.flip`).
- **Resize**: `.ds-datagrid__resize` is a `role="separator"` with `aria-valuenow` (px: the width set, else the width the
  column is laid out at, measured after each render and on focus), `aria-valuemin` and `aria-valuemax`. Drag it, or
  press ArrowLeft and ArrowRight (8px, the arrow toward the separator widens, so right to left ArrowLeft does; with
  Shift, PageUp or PageDown 64px), Home and End
  (the least and most width); Enter or a double click gives the column its natural width back. The first resize fixes
  every column at its width (`data-ds-datagrid-layout="fixed"`, `table-layout: fixed`, the table as wide as its columns), so
  only that column changes; long cells then end in an ellipsis. Only the widths a person (or the page, `width` and
  `resize()`) set are remembered; once none is left, the automatic layout comes back.
- **Reorder**: `.ds-datagrid__grip` (a `.ds-grip` button in the cell's start padding, shown on hover and focus) moves the
  column through `DS.dnd`: drag it, or press Space, then ArrowLeft and ArrowRight, then Space (Escape cancels); every step
  is announced. The rows follow on the drop. A pinned first or last column (`.ds-table--pin-first`, `.ds-table--pin-last`)
  has no grip and keeps its place: no column drops before or after it.
- **Chooser**: `chooser` names an empty `.ds-menu` (with a trigger, `aria-haspopup="menu"` and `data-ds-open`); the grid
  fills it with the presets ("Default", "All columns", your `presets`) as `menuitemradio` items and a `menuitemcheckbox`
  per column that can hide. A column box toggles and the menu stays open, as a list of boxes would; a preset applies and
  closes it. The last column shown cannot hide.

```html
<button class="ds-btn ds-btn--quiet" type="button" aria-haspopup="menu" aria-expanded="false" data-ds-open="#devices-columns">[icon columns 18] Columns</button>
<div class="ds-menu" role="menu" id="devices-columns" aria-label="Columns" data-ds-menu hidden></div>
```

### Rows

- **Details** (`detail`): a `.ds-table__toggle` per row and a `.ds-table__detail` row, as in the table; the grid toggles
  `aria-expanded` and `inert`.
- **Tree rows** (`tree`): the first column holds a twist (`.ds-datagrid__twist`, its `.ds-datagrid__chevron` turns 90deg on the
  spring) and the label, indented by `--ds-datagrid-indent` per level. The table is a `treegrid`; each row has `aria-level`,
  `aria-setsize`, `aria-posinset` and, with children, `aria-expanded`. A filter keeps the ancestors of a match and opens
  them; a sort orders siblings; paging counts the top rows.
- **Row groups** (`group`): a `.ds-datagrid__group` head row per value (its label, the count and the subtotals of the
  columns with a `summary`), collapsible like a tree row.
- **Summary row**: with a column's `summary`, the grid writes the `<tfoot>` row (the label "Total" spans the columns
  before the first figure). A page's own `<tfoot>` comes back on `destroy()`.
- **Actions and the context menu**: `actions(row)` renders a `.ds-table__actions` cell. `menu` names one `.ds-menu` for
  every row: a right click opens it at the pointer (`.ds-datagrid__point`), Shift+F10 or the menu key at the focused cell,
  and a `data-ds-datagrid-menu` button in the row under itself. Before it opens, `ds:menu` (cancelable) tells the page which
  row; an item's click sends `ds:action` with `{ action, key, row, keys, all, item }` (`action`: the item's
  `data-ds-action`); focus goes back where it was.
- **Inline edit**: a column with `edit` makes its cells `.ds-datagrid__editable`. Enter, F2 or a double click opens the
  editor (`.ds-input.ds-datagrid__editor`, filling the cell, so the column keeps its width; a `select` for `type: 'select'`); Enter saves, Tab saves and goes to the next
  editable cell (Shift+Tab: the previous one), Escape cancels, and leaving the cell saves a valid value. A value that
  `validate` (or `required`, or a number column) refuses keeps the editor open with `aria-invalid` and a
  `.ds-datagrid__message` (icon and words), announced. A changed value sends `ds:edit` (cancelable:
  `{ key, row, column, value, previous }`); when the page lets it, the grid writes it (`column.set`, else
  `row[key]`). Without focus mode an editable cell is a tab stop of its own.
- **Virtual rows** (`virtual`): the rows go through `DS.virtual` in the table's wrapper, which must scroll: a
  `.ds-table-wrap--fill`, or a `.ds-table--sticky-head` with `--ds-table-max-height`. The columns are fixed after the
  first render. `aria-rowcount` and `aria-rowindex` tell the whole set; the keys move through every row.
- **Stacked rows**: every cell carries `data-label`, so `.ds-table--stack` works as on any table.

### Export

`grid.csv(options)` returns CSV (RFC 4180) of the visible columns and every row that passes the filter, in order (with
`selected: true` the selected ones); `grid.download(name)` saves it (UTF-8 with a byte-order mark); `grid.copy()` puts the
selected rows (else all) on the clipboard as tab-separated text, ready for a spreadsheet, and announces it. Fields that a
spreadsheet would run as a formula (`=`, `+`, `-`, `@`) start with an apostrophe; a figure (`-1,234.5`, `-12%`,
`-€5`, grouped by spaces or apostrophes) stays a figure. With `source` the grid holds only the page on screen, so an
export asks the source once more for every row that passes the filter (`page: null`, `{ export: true }` in its context;
the selected ones are picked from those, unless every selected row is on the page): `grid.csv()` and
`grid.download()` then return a promise of the text. Buttons outside the table run them by
`data-ds-datagrid-command` (`csv`, `copy`, `clear`, `every`, `reset`, `retry`) and `aria-controls` naming the table:

```html
<button class="ds-btn ds-btn--quiet" type="button" data-ds-datagrid-command="csv" aria-controls="devices" data-ds-datagrid-file="devices.csv">[icon download 18] Export CSV</button>
```

### Keyboard

Without `focus`, the table keeps its roles and Tab goes through its controls (sort buttons, separators, grips,
checkboxes, toggles, links, editable cells). With `focus: 'cell'` or `'row'` the table is one tab stop (the APG grid
pattern) and every control inside it waits at `tabindex="-1"`:

| Key | Cell mode | Row mode |
|---|---|---|
| ArrowRight, ArrowLeft | the next, previous cell; on a tree row's first cell or a group's head: opens, closes, or goes to the parent | opens, closes (tree rows, groups, details), or goes to the parent |
| ArrowDown, ArrowUp | the cell below, above (from the first row up to the header) | the next, previous row; with Shift extends the selection |
| PageDown, PageUp | ten rows on | ten rows on |
| Home, End | the row's first, last cell; with Ctrl the grid's first, last cell | the first, last row |
| Enter | sorts a header cell (Shift: adds), edits an editable cell, enters a cell with several controls | follows the row link (`.ds-table__row-link`), else enters the row |
| F2 | edits, or enters a cell; again (or Escape) goes back to the cell | enters the row |
| Tab inside a cell | goes round its controls | goes round its controls |
| Space | Shift+Space (or Space on a cell without a control) selects the row | selects the row |
| Ctrl+A, Ctrl+C | selects the page; copies the selected rows, else the cell | selects the page; copies the selected rows, else the focused row |
| Shift+F10, menu key | the row's context menu | the row's context menu |

A cell with one control (a checkbox, a toggle, a link) takes the focus on that control. The focused cell or row shows
the ring, inset, and the focus layer at once.

### Accessibility

- **Roles and names**: `role="grid"` (or `treegrid`) only in focus mode, with `aria-multiselectable`; give the table
  a name (`aria-label` or a `<caption>`). Header cells keep `scope="col"`; a header with a grip or a separator is named
  by its label alone (`aria-labelledby` on the sort button or a span), so neither joins its name; the selection, details and actions columns
  have hidden names; every checkbox and toggle names its row. A paged or server table carries `aria-rowcount` and each
  row its `aria-rowindex`.
- **Announcements** (`DS.a11y.announce`): a sort, the number of rows a filter leaves, a page, a column shown or hidden,
  a preset, a saved or refused edit, a refused value, a copy, "All N selected", a load that failed. The selection bar's
  count is a live region of the page's markup.
- **Status** never by colour alone: a selected row keeps its checked box, a sorted column its arrow and `aria-sort`, a
  refused value its icon and words.

### Parts

The grid writes these itself; a page never adds them, but a theme or a test may name them.

| Class | What |
|---|---|
| `.ds-datagrid` | on the table: the grid's own rules (the page adds it with `data-ds-datagrid` or before `create()`) |
| `.ds-datagrid__select` | the selection column: a checkbox per row, the select-all box in the header |
| `.ds-datagrid__toggle` | the details column, a `.ds-table__toggle` per row |
| `.ds-datagrid__actions` | the header cell of the actions column (its body cells are `.ds-table__actions`) |
| `.ds-datagrid__grip` | the `.ds-grip` that moves a column, in the header cell's start padding |
| `.ds-datagrid__resize` | the separator at a header cell's end |
| `.ds-datagrid__rank` | a sorted column's place in a multi-column sort |
| `.ds-datagrid__tree` | a tree row's or group's first cell content: the twist and the label, indented by level |
| `.ds-datagrid__twist`, `.ds-datagrid__chevron` | the toggle of a tree row or group and its chevron |
| `.ds-datagrid__twist-room` | the twist's room on a tree row without children |
| `.ds-datagrid__label`, `.ds-datagrid__count` | the label of a tree row or group, and a group's row count |
| `.ds-datagrid__group` | a row group's head row |
| `.ds-datagrid__state` | the one row of the empty, no-results, loading and error states |
| `.ds-datagrid__editable` | a cell that edits |
| `.ds-datagrid__editing`, `.ds-datagrid__field`, `.ds-datagrid__editor`, `.ds-datagrid__message` | the cell while it edits, around the field, the field, and a refused value's message |
| `.ds-datagrid__every` | "Select all N" in the selection bar |
| `.ds-datagrid__point` | the point a context menu opens at |

### Forced colours

Rings are outlines (system colours); the separator's line is a border (`CanvasText`, `Highlight` while dragged); a group
row's tint goes, its label type and count stay; the editor's message keeps an edge; the table's own rules apply.

### Hooks

| Hook | Default | What |
|---|---|---|
| `--ds-datagrid-indent` | `--ds-space-6` | one level of tree rows |
| `--ds-datagrid-group-bg` | `--ds-surface-low` | a row group's head row |

Runtime properties (written by `js/datagrid.js`, never set them): `--ds-datagrid-width`, `--ds-datagrid-level`, `--ds-datagrid-point-x`,
`--ds-datagrid-point-y`. Attributes written by the system: `data-ds-datagrid-layout`, `data-ds-datagrid-dir`,
`data-ds-datagrid-resizing`, `data-ds-datagrid-row`, `data-ds-datagrid-group`, `data-ds-datagrid-stop`.

### JS API

`js/datagrid.js` (`DS.datagrid`):

- `create(table, options)` returns the controller that `data-ds-datagrid` makes (a second call returns it and passes the
  options to `set()`): `get()` (`{ sort, filter, page, selection, columns, expanded, total, status, rows }`),
  `set({ rows, sort, filter, page, group, selected, expanded, columns })`, `on(type, fn)` (returns the unsubscribe),
  `refresh()` (render again, or load again from `source`), `select(keys | 'all' | 'page' | 'none')`,
  `expand(key, open)`, `edit(key, column)`, `focus(key, column)`, `sort(key, dir)`, `page(index)`, `preset(id)`,
  `toggleColumn(key, show)`, `resize(key, width)`, `csv(options)`, `copy(options)`, `download(name, options)`,
  `menu(key, { x, y, opener })` and `destroy()` (what the grid wrote goes, the page's markup stays).
- `query(rows, options)`: the client pipeline without a DOM, `{ items, rows, total, filtered }`.
- `csv(rows, columns, options)`: CSV text (`separator`, `header`, `safe`, `raw`, `locale`).
- `summary(rows, column)`: one figure of a summary row.

Events (bubbling, on the table, and through `on()`): `ds:sort` `{ sort }`, `ds:filter` `{ filter }`, `ds:page`
`{ index, size, total, pages }`, `ds:select` `{ count, keys, all, except }`, `ds:expand` `{ key, open, kind }`,
`ds:edit` (cancelable) `{ key, row, column, value, previous }`, `ds:columns` `{ order, hidden, widths }` (`widths`: only the columns a person or the page sized; the others keep their measured width), `ds:menu`
(cancelable) `{ key, row, keys }`, `ds:action` `{ action, key, row, keys, all, item }`, `ds:load` `{ rows, total }`,
`ds:error` `{ error }`.

**Motion:** rows glide on a sort or filter through `DS.motion.flip` (the table's data motion), the details row opens as
the table's, the twist's chevron turns on the spring (`--ds-dur-medium`, `--ds-ease-spatial`), the selection bar
crosses with the toolbar (`DS.motion.crossfade()`), a moved column's header glides into place (`DS.dnd`). Nothing else
moves; a resize follows the pointer.

<!-- changelog -->
- Added: the data grid, `.ds-datagrid` and `js/datagrid.js` (`DS.datagrid`): multi-column sort, column resize, reorder and
  chooser with presets (remembered through `DS.store`), client or server data through one contract, selection with
  Shift ranges and "Select all N" across pages with the selection bar, details, tree rows and row groups with subtotals,
  a summary row, inline edit, the APG grid keys (cell or row), row actions and a context menu, windowed rows
  (`DS.virtual`), the empty, loading and error states, CSV and clipboard export. Strings `datagrid*` in
  `DS.core.config({ strings })`. Hooks `--ds-datagrid-indent`, `--ds-datagrid-group-bg`.
