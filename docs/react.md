# React adapter

`react/` in the copy is an optional adapter for React projects (3.0). Its components are typed functions that render
the documented markup of [components.md](components.md) with its classes and `data-ds-*` attributes, and run the
system's own behaviours on it: the controller of a tab row, a menu button or a date picker is the one `DS.init()`
would make, so the adapter adds no second implementation of anything.

- React 18 or later is the project's own (a peer); the copy ships no React. Written without JSX and without a build
  step: plain ES modules with their `.d.ts` types.
- One module per component. A page that imports `react/tabs.js` loads the tab behaviour and what it imports, nothing
  else. `react/index.js` re-exports every component for convenience, and loads all of them.
- StrictMode-safe: each controller starts in a layout effect and goes in its cleanup; a second cleanup does nothing,
  and a behaviour's `destroy()` gives back what its init took, so the second start shows what the first did (tested
  for every component).
- Styles stay CSS: link `ds.min.css` (or a [project bundle](bundle.md)), your theme and `fonts/fonts.css` as on any
  page. Theming is the [theme file](theming.md), never props.

## Install

Vendor the copy as usual ([install.md](install.md#vendoring-recommended)) and keep `react/` next to `js/`: the adapter
imports `../js/<module>.js`. Your bundler resolves `react` from the project.

```js
import { createRoot } from 'react-dom/client';
import { StrictMode, createElement as h } from 'react';
import { DSProvider } from './vendor/dashboard-style/react/provider.js';
import { Button } from './vendor/dashboard-style/react/button.js';
import { Tabs } from './vendor/dashboard-style/react/tabs.js';
import './vendor/dashboard-style/ds.min.css';      // or <link> it, with fonts/fonts.css and your theme after it

createRoot(document.getElementById('root')).render(
  h(StrictMode, null, h(DSProvider, null, h(App))),
);
```

In JSX the same reads `<DSProvider><App /></DSProvider>`, `<Button variant="filled">Save</Button>`.

With a [project bundle](bundle.md), `tools/bundle.mjs` follows the imports of `react/<file>.js` through
`manifest.json` `react` (per file: its exports, the component stylesheets it needs and the modules it loads), so the
bundle holds the CSS of the components the app imports. Classes the app writes itself (`className="ds-grid-2"`) are
found as in any project.

## `<DSProvider>`

The root of a tree on the system. It renders the `.ds-theme` element and calls `DS.init()` on it with the observer
on, so the delegated behaviours serve everything inside: the ripple, the action guard (busy, done and
`aria-disabled` actions get no input), tooltips for every `[data-tip]`, and `[data-ds-open]` / `[data-ds-close]`.
Plain `data-ds-*` markup that React renders outside the adapter's components is initialised as on any page, once its
module is loaded (below, "What the adapter does not do").

| Prop | Default | What |
|---|---|---|
| `as` | `'div'` | the element |
| `theme` | `true` | carry `.ds-theme`; `false` when `<html>` or a host element is the theme |
| `base` | `false` | the opt-in page base `.ds-base` ([theming.md](theming.md)) |
| `scheme` | none | `'light'` or `'dark'` pins the scheme (`data-ds-scheme`) of a theme for both schemes (a [preset](theme-generator.md) or a generated theme); none follows the system |
| `size`, `density`, `shape`, `touch` | none | option classes on the whole tree ([options.md](options.md)) |
| `root` | the element | `'document'`: `DS.init(document)`, for an app that owns the page |
| `observe` | `true` | keep initialising plain markup React adds later |
| `locale`, `strings` | none | `DS.config()`: the page's locale and the system's texts ([core.md](core.md#strings-and-locale)); page-wide |

Overlays (dialogs, sheets, menus, snackbars) must sit inside the `.ds-theme` element: render them inside the provider.

## Props every component shares

| Prop | What |
|---|---|
| `variant` | the modifiers of the component's block: one name or a list (`variant={['quiet', 'icon']}` gives `ds-btn--quiet ds-btn--icon`) |
| `size`, `density`, `shape`, `tone`, `touch` | the option classes ([options.md](options.md)): `.ds-sm`, `.ds-density-dense`, `.ds-shape-square`, `.ds-tone-error`, `.ds-touch`. A tone applies only where the component shows a meaning, always with an icon or a word |
| `className` | more classes; the component's own come first |
| `ref` | the root element |
| `onDs<Type>` | a listener of `ds:<type>` on the root, for this component's own events: `onDsChange`, `onDsSelect`, `onDsBeforeClose` (`ds:before-close`). The handler gets the `CustomEvent`; `event.detail` is what the component's docs describe |
| `controllerRef` | receives the controller once it runs (`get()`, `set(value)`, `on(type, fn)` and the component's own methods, as its docs list them), and `null` when it goes |

Every other prop goes to the root element as React passes it: `id`, `aria-*`, `data-*`, `role`, handlers.

## Tier 1 components

### `Button` (`react/button.js`)

```js
h(Button, { variant: 'filled', type: 'submit' }, 'Save')
h(Button, { variant: 'quiet', icon: pencil, 'aria-label': 'Edit' })          // icon button; data-tip = its label
h(Button, { icon: plus }, 'Add device')
h(Button, { variant: 'filled', faces: { busy: 'Saving', done: 'Saved', failed: 'Not saved' }, action: () => save() }, 'Save')
h(Button, { variant: 'filled', tone: 'error' }, 'Delete 3 devices')           // only in a destructive confirmation
```

| Prop | What |
|---|---|
| `variant` | `'outlined'` (default look), `'filled'`, `'tonal'`, `'elevated'`, `'text'`, `'quiet'`, `'ghost'`, or a list with `'disc'`, `'disclosure'`, `'adaptive'` |
| `block` | `.ds-btn--block`: fills its line |
| `icon` | a glyph of `js/icons.js` (`import { pencil } from '<dest>/js/icons.js'`) or a node: 16px before the label; without children the button is an icon button (`.ds-btn--icon`, 20px), named by `aria-label`, which also becomes its `data-tip` |
| `faces` | `{ busy, done, failed }`: the faces of `DS.motion.busy()` |
| `action` | work to run on click through `DS.motion.busy()`: busy at once (the guard blocks every input), the done face after it, the failed face when it rejects; `onActionError(error)` receives the rejection |
| `as` | `'button'` (default, `type="button"` unless given) or `'a'` |

One filled button per area; red only as the filled error button of a destructive confirmation (D10).

### `Field` (`react/field.js`)

```js
h(Field, { label: 'Name', hint: 'As printed on the label.', name: 'name', required: true })
h(Field, { label: 'Serial', error: 'Already in use.', value, onChange })
h(Field, { label: 'Type', as: 'select' }, h('option', null, 'Laptop'), h('option', null, 'Desktop'))
h(Field, { label: 'Notes', as: 'textarea', full: true })
```

The label sits above the control, linked by `for`; the hint and the state message are linked by
`aria-describedby`, an error sets `aria-invalid` and shows an icon with the words.

| Prop | What |
|---|---|
| `label` | the visible label (required) |
| `hint` | `.ds-field__hint` |
| `error`, `warning`, `success` | the state message (`.ds-field__hint--error` with `aria-invalid`; `.ds-field--warning`, `.ds-field--success`) |
| `variant` | `'outlined'` (default), `'filled'`, `'inset'` |
| `full` | `.ds-field--full`: a whole row of a form grid |
| `as` | `'input'` (default), `'textarea'`, `'select'` |
| `fieldClassName` | classes of the `.ds-field` (`className` goes to the control) |
| `size`, `density`, `shape`, `touch` | on the field |
| `children` | one element: a control of your own (it gets `id`, `aria-describedby`, `aria-invalid`); for a select, its options |

Every other prop is the control's (`value`, `onChange`, `name`, `type`, `required` ...), and so is the `ref`.

### `Card` (`react/card.js`)

```js
h(Card, { title: 'Sync', actions: h(Button, { size: 'sm' }, 'Run now') }, h('p', { className: 'ds-muted' }, 'Runs every night at 02:00.'))
h(Card, { as: 'a', href: '/devices/42', interactive: true, title: 'Printer on floor 2' }, h('p', { className: 'ds-muted' }, 'Last seen today'))
```

| Prop | What |
|---|---|
| `variant` | `'outlined'` (default), `'filled'`, `'elevated'`, `'horizontal'`, `'selectable'` |
| `interactive` | `.ds-card--interactive` on an `<a>` or `<button>`: state layer, press morph, ripple |
| `title`, `titleAs` | the `.ds-card__title` (`'h2'` by default) |
| `actions` | beside the title, in a `.ds-card__row` |
| `as` | `'section'` (default) |

### `Badge` (`react/badge.js`)

```js
h(Badge, { count: unread })                                   // DS.badge: 99+ past max, nothing at zero
h(Badge, { count: 3, max: 9, tone: 'error', corner: true, 'aria-hidden': 'true' })
h(Badge, { dot: true, tone: 'primary', label: 'New tasks' })
h(Badge, { tone: 'neutral' }, '12')
```

`count` runs the badge behaviour (`data-ds-badge`): the figure pops in and out and shows `max+` past `max` (default 99);
the badge then renders no children of its own. `dot` (`.ds-badge--dot`) needs its word in `label` (`.ds-sr`), `corner`
hangs it on an icon button. Name the host with the count where it matters (`aria-label="Inbox, 3 new"`).

### `Status` (`react/status.js`)

```js
h(Status, { tone: 'success' }, 'Synced')
h(Status, { tone: 'warning', icon: clock }, 'Expires soon')
h(Status, { running: true }, 'Running')
```

Always an icon and a word: the icon defaults by tone (`check`, `alert`, `info`, `clock` for neutral), `running` shows
the spinner instead. A status that changes while someone waits goes through a live region (`role="status"` around it).

### `Alert` (`react/alert.js`)

```js
h(Alert, null, 'Sync runs at night.')
h(Alert, { tone: 'warning', title: 'Certificate expires soon', actions: h(Button, { variant: 'text', size: 'sm' }, 'Renew') }, 'Renew it before 1 May.')
h(Alert, { tone: 'error', variant: 'section', title: 'The import stopped' }, 'Nothing was saved.')
h(Alert, { tone: 'warning', variant: 'inline' }, 'Used by 3 other devices.')
```

| Prop | What |
|---|---|
| `tone` | none: the neutral information alert; `'success'`, `'warning'`, `'error'` ... |
| `variant` | `'plain'` (findings in a card), `'inline'` (under a field or in a row, a `<p>`), `'section'` |
| `icon` | default by tone (`info`, `checkCircle`, `alert`, `alertCircle`); `false` for none |
| `title`, `actions` | `.ds-alert__title`, `.ds-alert__actions` |
| `role` | `'alert'` for an error by default, else none; give `'status'` to a message that appears while someone waits |

### `Table` (`react/table.js`)

```js
h(Table, {
  caption: 'Devices',
  rows, rowKey: (row) => row.id,
  sort, onSort: (key, direction) => setSort({ key, direction }),
  columns: [
    { key: 'name', header: 'Device', sortable: true, text: true },
    { key: 'age', header: 'Age', numeric: true, sortable: true },
    { key: 'owner', header: 'Owner', secondary: true },
    { key: 'state', header: 'Status', render: (row) => h(Status, { tone: row.tone }, row.state) },
  ],
})
```

A `.ds-table` in its `.ds-table-wrap`. Columns: `key`, `header`, `numeric` (`.ds-num`), `secondary`
(`.ds-col--secondary`, dropped on phones), `text`, `nowrap`, `sortable` (a `.ds-table__sort` button and the arrow;
`aria-sort` on the sorted column) and `render(row, index)`. Rows are keyed (`data-ds-key`) by `rowKey`, else `row.id`.
`caption` names the table (visually hidden unless `captionVisible`); `wrapLabel` makes the wrapper a focusable region
for a table whose cells hold nothing focusable. `variant`: `'zebra'`, `'bordered'`, `'plain'`, `'wide'`. Sorting,
filtering and selection are the page's: render the rows in their new order. Without `columns`, the children (your own
`<thead>` and `<tbody>`) go into the `<table>`. For sorting, filtering, paging, editing and virtual rows in the
component itself use `DataGrid` (below).

### `Tabs` (`react/tabs.js`)

```js
h(Tabs, {
  label: 'Device',
  items: [
    { key: 'details', label: 'Details', panel: h(Details) },
    { key: 'history', label: 'History', count: 3, panel: h(History) },
    { key: 'report', label: 'Report', closable: true, panel: h(Report) },
  ],
  value, onChange: (key) => setValue(key),
  onClose: (key) => setItems((items) => items.filter((item) => item.key !== key)),
})
```

ARIA tabs driven by `DS.tabs`: a click or the arrow keys select (one tab stop, Home and End), the indicator follows,
panels stay alive.

| Prop | What |
|---|---|
| `items` | `{ key, label, panel, count, icon, disabled, closable }` |
| `label` | the row's accessible name (or `aria-labelledby`) |
| `value` / `defaultValue` | the selected key; a new `value` selects that tab |
| `onChange(key, detail)` | the user selected a tab (`detail` is the `ds:change` detail) |
| `variant` | `'line'` (default), `'contained'`, `'fill'`, `'flush'`, `'vertical'` (the row beside its panels) |
| `overflow` | tabs that do not fit go into a More menu |
| `activate` | `'manual'`: the arrow keys move the focus, Enter or Space selects |
| `onClose(key)` | a closable tab's close button, Delete or its panel's close action: remove the item; when it was selected, its neighbour is selected already and a screen reader hears it closed |
| `onAdd()`, `addLabel` | an add button at the end of the bar (named by `addLabel`): add an item and select it through `value` |
| `lazy` | default `true`: a panel renders its content the first time it shows, so hidden panels cost nothing up front |
| `panelClassName` | classes of each panel |

React renders `aria-selected`, `tabindex` and the panels' `hidden` once, from the first selection; `DS.tabs` keeps
them from then on, so a re-render never undoes what the user chose.

### `Dialog` (`react/dialog.js`)

```js
h(Dialog, {
  open, onClose: () => setOpen(false),
  role: 'alertdialog',
  title: 'Delete 3 devices?',
  description: 'They disappear from every list. This cannot be undone.',
  actions: [
    h(Button, { key: 'cancel', variant: 'text', 'data-ds-close': '', autoFocus: true }, 'Cancel'),
    h(Button, { key: 'delete', variant: 'filled', tone: 'error', onClick: remove }, 'Delete 3 devices'),
  ],
})
```

A native `<dialog class="ds-dialog">`, opened and closed by `DS.overlay` when `open` changes: focus moves in (the
`autoFocus` element, else the first), the page is inert, the scroll lock counts, and focus goes back to the opener (the
element that had the focus, or `opener`). Escape, the backdrop and `[data-ds-close]` close it and call
`onClose(reason)` (`'escape'`, `'backdrop'`, `'close'`, `'submit'`): set `open` to `false` there.

| Prop | What |
|---|---|
| `title`, `description` | `.ds-dialog__title` and `.ds-dialog__text`, its name and description |
| `children` | `.ds-dialog__body`, which scrolls |
| `actions` | `.ds-dialog__actions` |
| `size` | `'sm'`, `'lg'`, `'xl'` (the default is 400px) |
| `full` | `.ds-dialog--full`; `'narrow'`: only at 600px and below |
| `bottom` | an action sheet |
| `busy` | `data-ds-busy`: the user's closes do nothing while work runs |
| `onSubmit(data, form)` | a form dialog: the box is a `<form data-ds-dialog-form>`, Enter submits and the browser validates; it runs through `DS.dialog.form()` (busy on the submit button, a rejection keeps it open with `errorText` in a snackbar), then the dialog closes with reason `'submit'` |
| `opener` | where focus goes back (an element or a ref) |

### `useToast()` (`react/toast.js`)

```js
const toast = useToast();
toast('Saved', { kind: 'success' });
toast.promise(() => save(), { pending: 'Saving', success: 'Saved', error: 'Not saved' });
const upload = toast.progress('Uploading 3 files');
toast.close({ kind: 'error' });
```

Snackbars in the page's region ([Snackbar](components.md#snackbar)). The region is the system's, not React's: it is
found or made inside the `.ds-theme` and moves into an open dialog or sheet, so render none yourself.

### `Icon` (`react/shared.js`)

`h(Icon, { glyph: check, size: 16 })`: a glyph of `js/icons.js` as an `<svg>`, `aria-hidden`, built without
`innerHTML`. Import only the glyphs you use: a bundler keeps those.

### Tooltips

No component: give any element `data-tip="Export"` and the provider's tooltips show it ([Tooltip](components.md#tooltip)).

## Every other behaviour

Every behaviour of the system that initialises an element (each `data-ds-*` of a component module, and
`data-ds-time`) has a component of its own, generated from the component's folder: it renders the root element of the
documented markup (the tag, the classes and the role of the first element of the docs that carries the attribute),
adds the attribute and `data-ds-managed`, and runs the behaviour through `DS.core.manage()`.

**By decision, a generated component is a typed wrapper of the root element**, not a second implementation of the
component: it renders no inner markup of its own. Write the rest of the documented markup as its children (copied from
[components.md](components.md)), and give data the docs drive from script through `controllerRef` (`DataGrid`'s
`set({ columns, rows })`, a `Combobox`'s items, a `Tree`'s nodes). The components with props for their whole markup
are the hand-written ones above: `Button`, `Field`, `Card`, `Badge`, `Status`, `Alert`, `Table`, `Tabs`, `Dialog`,
`useToast()` and `Icon`.

```js
h(MenuButton, { 'aria-haspopup': 'menu', 'aria-expanded': 'false', 'aria-controls': 'export-menu', 'data-ds-menubutton': '#export-menu' },
  'Export', h(Icon, { glyph: chevronDown, size: 16, className: 'ds-chevron ds-menu-btn__chevron' }))
h(Menu, { id: 'export-menu', 'aria-label': 'Export', hidden: true },
  h('button', { className: 'ds-menu__item', role: 'menuitem', type: 'button', onClick: exportCsv }, h('span', { className: 'ds-menu__label' }, 'CSV')))
h(ToggleGroup, { 'aria-label': 'View', 'data-ds-toggle-group': 'single', dsToggleGroupRequired: true, onDsChange: (event) => setView(event.detail.value) }, buttons)
h(DatePicker, { 'data-ds-value': '2026-05-01', onDsChange: (event) => setDate(event.detail.value) }, pickerMarkup)
h(Markdown, { source: answer, anchors: true })
h(Formatted, { 'data-ds-format': 'currency', currency: 'EUR', value: total })
```

- **Option props.** Each documented option attribute of the behaviour (its `define()`'s `attributes`) is a typed prop:
  the attribute's name after the behaviour's own (`data-ds-markdown-anchors` is `anchors`,
  `data-ds-tabs-overflow` is `overflow`), or its whole name after `data-ds-` where that would be a prop of the element
  (`data-ds-value` is `dsValue`, `data-ds-toggle-group-required` is `dsToggleGroupRequired`). `true` writes the attribute
  empty, `false` or `null` leaves it out, an object becomes JSON. The table below lists them. The attributes
  themselves still work (`'data-ds-value': ...`), and the behaviour's own attribute takes its documented value
  (`'data-ds-toggle-group': 'single'`).
- An option that React changes reaches the controller as on any page: its `update()`, else a fresh controller.
- **Content a behaviour writes.** `Markdown`, `Highlight`, `Formatted`, `Truncate`, `SearchHits`, `Time` and `Kbd`
  render the text of their element themselves, so React renders no children there (it would keep a text node next to
  what the behaviour rendered, or change one the behaviour replaced). They take their text as a prop or as string
  children: `Markdown` `source` (a new one goes in through the controller's `set()`, patched in place, and sends
  `ds:change`), `Highlight` `code` (the same), `Formatted` `value` (its `data-ds-value`), `Truncate` `text` and
  `SearchHits` `text` (a new text starts the behaviour again on it), while `Time` and `Kbd` take no children: their
  attribute (`data-ds-time`, `data-ds-kbd`) is everything they show. To mark hits in rows React renders, mark them in
  React: `DS.hits.ranges(text, query)` gives the `[start, end)` pairs to wrap in `<mark class="ds-hit">`.
- **Children are read once** where a behaviour builds its markup from what it reads on init (`DataGrid`'s columns and
  rows, a `CommandPalette`'s commands, a `CodeBlock`'s lines, a `Chart`'s table): later changes to those children do
  not reach it. Give new data through `controllerRef` (`set()`), or a new `key` for a new element.
- The overlays among them (`Sheet`, `BottomSheet`, `Tearsheet`, `CommandPalette`, `ShortcutSheet`, `Notifications`)
  take `open`, `onClose(reason)` and `opener` as `Dialog` does.
- **Types.** Each component's `.d.ts` types its option props, its `variant` (the modifiers of its block, without the
  state classes the system writes: `done`, `failed`, `closing`, `nested`, `hidden`) and its events as
  `onDs<Type>(event: CustomEvent)`. The `event.detail` of each is in the component's docs; the controller's type is
  `ReturnType<typeof create>` of its module where it has one.

<!-- generated: components (scripts/build.mjs; do not edit) -->
| Component | File | Root element | Props | `variant` | Events | Docs |
|---|---|---|---|---|---|---|
| `AiLabel` | `react/ailabel.js` | `<button class="ds-ailabel" data-ds-ailabel>` | - | `icon`, `outlined`, `plain` | `onDsToggle` | [AI label](components.md#ai-label) |
| `AuditLog` | `react/auditlog.js` | `<section class="ds-auditlog" data-ds-auditlog>` | - | - | `onDsFilter`, `onDsRender` | [Audit log](components.md#audit-log) |
| `Avatar` | `react/avatar.js` | `<span class="ds-avatar" data-ds-avatar>` | `status`, `initials` | `hue-1`, `hue-2`, `hue-3`, `hue-4`, `hue-5`, `hue-6`, `ring`, `square` | `onDsChange`, `onDsSelect` | [Avatar](components.md#avatar) |
| `AvatarGroup` | `react/avatar-group.js` | `<div class="ds-avatar-group" role="group" data-ds-avatar-group>` | `dsAvatarGroupMax` | `spread` | `onDsChange`, `onDsSelect` | [Avatar](components.md#avatar) |
| `BackToTop` | `react/backtop.js` | `<button class="ds-btn ds-backtop" data-ds-backtop>` | `after`, `dsBacktopTarget`, `focus` | `fixed` | `onDsChange` | [Back to top](components.md#back-to-top) |
| `Banner` | `react/banner.js` | `<div class="ds-banner" data-ds-banner>` | `dsBannerMax`, `remember` | - | `onDsChange`, `onDsDismiss` | [Banner](components.md#banner) |
| `BottomSheet` | `react/bottomsheet.js` | `<dialog class="ds-sheet ds-bottomsheet" data-ds-bottomsheet>`, `open`, `onClose` | `detents` | - | `onDsDetent` | [Bottom sheet](components.md#bottom-sheet) |
| `Breadcrumbs` | `react/breadcrumbs.js` | `<nav class="ds-breadcrumbs" data-ds-breadcrumbs>` | - | - | `onDsChange`, `onDsFilter` | [App frame](components.md#app-frame) |
| `Calendar` | `react/calendar.js` | `<div class="ds-calendar" data-ds-calendar>` | `dsValue`, `dsCalendarMin`, `dsCalendarMax`, `dsCalendarDisabled`, `months`, `mode`, `weeks`, `firstDay` | - | `onDsChange`, `onDsInput` | [Calendar](components.md#calendar) |
| `Chart` | `react/chart.js` | `<figure class="ds-chart" data-ds-chart>` | `dsConfig` | `bar`, `bargauge`, `donut`, `empty`, `gauge`, `patterns`, `pie`, `ring`, `sparkline`, `stacked` | `onDsChange`, `onDsPoint`, `onDsSelect`, `onDsToggle`, `onDsView` | [Charts](components.md#charts) |
| `ChoiceList` | `react/choices.js` | `<div class="ds-choices" data-ds-choices>` | - | `columns`, `scroll` | `onDsChange` | [Choice list](components.md#choice-list) |
| `Cite` | `react/cite.js` | `<button class="ds-cite" data-ds-cite>` | - | - | `onDsChange` | [Sources and citations](components.md#sources-and-citations) |
| `CodeBlock` | `react/code.js` | `<figure class="ds-code" data-ds-code>` | `dsCodeMax`, `dsCodeStart`, `mark` | `lines` | - | [Code block](components.md#code-block) |
| `Combobox` | `react/combobox.js` | `<div class="ds-combo" data-ds-combobox>` | - | `multi`, `select` | `onDsChange`, `onDsCreate`, `onDsSearch` | [Combobox](components.md#combobox) |
| `CommandPalette` | `react/command.js` | `<dialog class="ds-dialog ds-command" data-ds-command>`, `open`, `onClose` | - | `bottom`, `contained`, `full`, `full-narrow`, `lg`, `scroll-outside`, `sm`, `xl` | `onDsClose`, `onDsOpen`, `onDsQuery`, `onDsSelect` | [Command palette](components.md#command-palette) |
| `Composer` | `react/composer.js` | `<form class="ds-composer" data-ds-composer>` | `busy`, `draft`, `enter` | - | `onDsAttach`, `onDsCommand`, `onDsMention`, `onDsQuery`, `onDsRemove`, `onDsSend`, `onDsStop` | [Composer](components.md#composer) |
| `CopyButton` | `react/copy.js` | `<button class="ds-btn" data-ds-copy>` | - | `adaptive`, `block`, `disc`, `disclosure`, `elevated`, `filled`, `ghost`, `icon`, `outlined`, `quiet`, `text`, `tonal` | `onDsCopy` | [Copy button](components.md#copy-button) |
| `Counter` | `react/counter.js` | `<textarea class="ds-input" data-ds-counter>` | `dsCounterMax`, `warn` | `filled`, `grow`, `outlined` | `onDsChange` | [Form](components.md#form) |
| `DataGrid` | `react/datagrid.js` | `<table class="ds-table ds-datagrid" data-ds-datagrid>` | - | `bordered`, `interactive`, `pin-first`, `pin-last`, `plain`, `stack`, `stack-wide`, `sticky-foot`, `sticky-head`, `wide`, `zebra` | `onDsAction`, `onDsColumns`, `onDsEdit`, `onDsError`, `onDsExpand`, `onDsFilter`, `onDsLoad`, `onDsMenu`, `onDsPage`, `onDsSelect`, `onDsSort` | [Data grid](components.md#data-grid) |
| `DateField` | `react/datefield.js` | `<div class="ds-datefield" role="group" data-ds-datefield>` | `dsValue`, `dsDatefieldType`, `dsDatefieldMin`, `dsDatefieldMax`, `seconds`, `hourCycle`, `zone`, `dsDatefieldName` | `block`, `filled`, `outlined` | `onDsChange` | [Date field](components.md#date-field) |
| `DatePicker` | `react/datepicker.js` | `<div class="ds-picker" data-ds-datepicker>` | - | `block` | `onDsChange` | [Date picker](components.md#date-picker) |
| `DateRangePicker` | `react/daterange.js` | `<div class="ds-picker" data-ds-daterange>` | - | `block` | `onDsChange` | [Date range picker](components.md#date-range-picker) |
| `Diff` | `react/diff.js` | `<div class="ds-diff" data-ds-diff>` | `view`, `context`, `dsDiffLang`, `heading` | `wrap` | `onDsChange`, `onDsExpand` | [Diff view](components.md#diff-view) |
| `Drawer` | `react/drawer.js` | `<nav class="ds-drawer" data-ds-drawer>` | - | `instant` | `onDsChange`, `onDsFilter` | [App frame](components.md#app-frame) |
| `DurationInput` | `react/duration.js` | `<input class="ds-input ds-duration" data-ds-duration>` | `dsValue`, `dsDurationStep`, `dsDurationMin`, `dsDurationMax`, `unit`, `smallest`, `dsDurationName` | `filled`, `grow`, `outlined` | `onDsChange` | [Duration input](components.md#duration-input) |
| `ErrorSummary` | `react/errorsummary.js` | `<div class="ds-alert ds-tone-error ds-errorsummary" data-ds-errorsummary>` | - | `inline`, `plain`, `section` | `onDsChange`, `onDsInvalid` | [Error summary](components.md#error-summary) |
| `Expandable` | `react/expandable.js` | `<div class="ds-expandable" data-ds-expandable>` | - | - | `onDsChange` | [Expandable text](components.md#expandable-text) |
| `Facets` | `react/facets.js` | `<section class="ds-facets" role="complementary" data-ds-facets>` | `sheet`, `zero` | - | `onDsFilter` | [Facet filter panel](components.md#facet-filter-panel) |
| `Facts` | `react/facts.js` | `<dl class="ds-facts" data-ds-facts-copy>` | - | `bordered`, `grid`, `rows`, `stacked` | `onDsChange`, `onDsCopy`, `onDsDrop` | [Lists](components.md#lists) |
| `Feedback` | `react/feedback.js` | `<div class="ds-feedback" role="group" data-ds-feedback>` | - | - | `onDsChange`, `onDsFeedback` | [Feedback](components.md#feedback) |
| `FilterBar` | `react/filterbar.js` | `<div class="ds-filterbar" role="search" data-ds-filterbar>` | `sheet` | - | `onDsChange`, `onDsFilter` | [Filter bar](components.md#filter-bar) |
| `Formatted` | `react/formatted.js` | `<span data-ds-format>` | `value`, `currency`, `digits`, `base`, `dsFormatStyle`, `signed`, `tip` | - | `onDsChange` | [Formatted values and relative time](components.md#formatted-values-and-relative-time) |
| `Highlight` | `react/highlight.js` | `<code data-ds-highlight>` | `code` | - | `onDsChange` | [Syntax highlighting](components.md#syntax-highlighting) |
| `SearchHits` | `react/hits.js` | `<span data-ds-hits>` | `text`, `mode` | - | `onDsChange` | [Search hits](components.md#search-hits) |
| `Image` | `react/image.js` | `<span class="ds-image__frame" data-ds-image>` | - | - | `onDsChange` | [Image](components.md#image) |
| `InlineEdit` | `react/inlineedit.js` | `<div class="ds-inlineedit" data-ds-inlineedit>` | - | - | `onDsCancel`, `onDsEdit`, `onDsSave` | [Inline edit](components.md#inline-edit) |
| `JsonView` | `react/jsonview.js` | `<div class="ds-jsonview" role="region" data-ds-jsonview>` | `dsJsonviewOpen`, `search` | - | `onDsCopy`, `onDsError`, `onDsSearch`, `onDsSelect`, `onDsToggle` | [JSON viewer](components.md#json-viewer) |
| `Kbd` | `react/kbd.js` | `<kbd class="ds-kbd-combo" data-ds-kbd>` | no children, `platform` | - | `onDsChange` | [Key combos](components.md#key-combos) |
| `KeyValueEditor` | `react/kveditor.js` | `<fieldset class="ds-kveditor" data-ds-kveditor>` | - | `code` | `onDsChange` | [Key-value editor](components.md#key-value-editor) |
| `LabelGroup` | `react/labelgroup.js` | `<div class="ds-label-group" data-ds-label-group>` | `dsLabelGroupMax` | - | `onDsChange` | [Label group](components.md#label-group) |
| `Launcher` | `react/launcher.js` | `<div class="ds-menu ds-launcher" role="menu" data-ds-launcher>` | - | - | `onDsChange`, `onDsFilter` | [App frame](components.md#app-frame) |
| `LevelMeter` | `react/levelmeter.js` | `<div class="ds-levelmeter" data-ds-levelmeter>` | - | `segmented`, `vertical` | `onDsChange` | [Level meter](components.md#level-meter) |
| `Lightbox` | `react/lightbox.js` | `<ul class="ds-lightbox__gallery" data-ds-lightbox>` | - | - | `onDsChange`, `onDsClose`, `onDsOpen`, `onDsZoom` | [Lightbox](components.md#lightbox) |
| `List` | `react/list.js` | `<ul class="ds-list" data-ds-list>` | `select`, `reorder` | `interactive`, `scroll`, `stacked` | `onDsChange`, `onDsCopy`, `onDsDrop` | [Lists](components.md#lists) |
| `Listbox` | `react/listbox.js` | `<div class="ds-listbox" role="listbox" data-ds-listbox>` | - | `plain` | `onDsChange` | [Listbox](components.md#listbox) |
| `ListDetail` | `react/listdetail.js` | `<div class="ds-listdetail" role="group" data-ds-listdetail>` | - | `outlined` | `onDsChange` | [List-detail layout](components.md#list-detail-layout) |
| `LoadingOverlay` | `react/loadingoverlay.js` | `<div class="ds-loadingoverlay" data-ds-loadingoverlay>` | - | `opaque` | `onDsCancel`, `onDsHide`, `onDsShow` | [Loading overlay](components.md#loading-overlay) |
| `LoadMore` | `react/loadmore.js` | `<div class="ds-loadmore" data-ds-loadmore>` | `loaded`, `total`, `auto`, `dsLoadmoreFor`, `focus`, `root`, `margin` | `inline` | `onDsChange`, `onDsLoaded`, `onDsLoadmore` | [Load more and infinite scroll](components.md#load-more-and-infinite-scroll) |
| `LogView` | `react/logview.js` | `<div class="ds-logview" data-ds-logview>` | `dsLogviewWrap`, `time`, `limit`, `follow`, `tools` | - | `onDsChange`, `onDsCopy`, `onDsSelect` | [Log viewer](components.md#log-viewer) |
| `Markdown` | `react/markdown.js` | `<div class="ds-prose" data-ds-markdown>` | `source`, `anchors`, `breaks`, `code`, `images` | `compact`, `dense` | `onDsChange` | [Markdown](components.md#markdown) |
| `Media` | `react/media.js` | `<ul class="ds-media-grid" data-ds-media>` | - | - | `onDsChange` | [Media](components.md#media) |
| `Menu` | `react/menu.js` | `<div class="ds-menu" role="menu" data-ds-menu>` | - | - | `onDsChange`, `onDsContextmenu` | [Menu](components.md#menu) |
| `MenuButton` | `react/menubutton.js` | `<button class="ds-btn ds-menu-btn" data-ds-menubutton>` | `dsValue` | `adaptive`, `block`, `disc`, `disclosure`, `elevated`, `filled`, `ghost`, `icon`, `outlined`, `quiet`, `text`, `tonal` | `onDsChange` | [Menu button](components.md#menu-button) |
| `Message` | `react/message.js` | `<article class="ds-message" data-ds-message>` | - | `assistant`, `system`, `tool`, `user` | `onDsAction`, `onDsChange`, `onDsCopy`, `onDsEdit`, `onDsRetry` | [Message](components.md#message) |
| `Notifications` | `react/notifications.js` | `<dialog class="ds-sheet ds-notifications" data-ds-notifications>`, `open`, `onClose` | - | - | `onDsAction`, `onDsChange`, `onDsClose`, `onDsOpen`, `onDsRead`, `onDsSelect` | [Notification centre](components.md#notification-centre) |
| `NumberInput` | `react/number.js` | `<div class="ds-input-group ds-number" data-ds-number>` | `dsNumberMin`, `dsNumberMax`, `dsNumberStep`, `page`, `decimals`, `currency`, `unit`, `grouping` | `split` | `onDsChange` | [Number input](components.md#number-input) |
| `ObjectPage` | `react/object.js` | `<div class="ds-object" data-ds-object>` | - | - | `onDsCancel`, `onDsChange`, `onDsEdit`, `onDsSave` | [Object page](components.md#object-page) |
| `OrderedChoice` | `react/orderedchoice.js` | `<ol class="ds-orderedchoice" data-ds-orderedchoice>` | - | - | `onDsChange` | [Ordered choice](components.md#ordered-choice) |
| `CodeField` | `react/otp.js` | `<div class="ds-otp" role="group" data-ds-otp>` | `dsOtpType`, `mask` | - | `onDsChange`, `onDsComplete` | [Code field (one-time code, PIN)](components.md#code-field-one-time-code-pin) |
| `PageHead` | `react/page.js` | `<header class="ds-page-head" data-ds-page-head>` | `condense` | `sticky` | `onDsChange` | [Page](components.md#page) |
| `Password` | `react/password.js` | `<div class="ds-field" data-ds-password>` | `dsPasswordMin` | `changed`, `filled`, `full`, `grow`, `inset`, `outlined`, `success`, `warning` | `onDsChange`, `onDsReveal` | [Password](components.md#password) |
| `Picker` | `react/picker.js` | `<div class="ds-picker" data-ds-picker>` | - | `block` | `onDsClose`, `onDsOpen` | [Picker popover](components.md#picker-popover) |
| `PlanCard` | `react/plan.js` | `<section class="ds-plan" data-ds-plan>` | `state` | - | `onDsChange`, `onDsDecide` | [Plan card](components.md#plan-card) |
| `Popover` | `react/popover.js` | `<button class="ds-btn" data-ds-popover>` | `placement`, `align`, `trigger` | `adaptive`, `block`, `disc`, `disclosure`, `elevated`, `filled`, `ghost`, `icon`, `outlined`, `quiet`, `text`, `tonal` | `onDsClose`, `onDsOpen` | [Popover](components.md#popover) |
| `PriorityBar` | `react/prioritybar.js` | `<div class="ds-priority-bar" role="toolbar" data-ds-prioritybar>` | - | `end` | `onDsChange` | [Priority action bar](components.md#priority-action-bar) |
| `QueryInput` | `react/query.js` | `<div class="ds-query" data-ds-query>` | - | - | `onDsChange`, `onDsSaved`, `onDsSubmit` | [Query input](components.md#query-input) |
| `QuestionCard` | `react/question.js` | `<form class="ds-question" data-ds-question>` | - | - | `onDsAnswer`, `onDsChange` | [Question card](components.md#question-card) |
| `Reasoning` | `react/reasoning.js` | `<details class="ds-collapsible ds-disclosure ds-reasoning" data-ds-reasoning>` | `since`, `done`, `auto` | `row` | `onDsChange` | [Reasoning disclosure](components.md#reasoning-disclosure) |
| `SchemeSwitch` | `react/scheme-switch.js` | `<div role="group" data-ds-scheme-switch>` | - | - | `onDsChange`, `onDsFilter` | [App frame](components.md#app-frame) |
| `Search` | `react/search.js` | `<div class="ds-search" data-ds-search>` | - | - | `onDsSearch` | [Search field](components.md#search-field) |
| `SearchSheet` | `react/search-sheet.js` | `<div class="ds-topbar__search" data-ds-search-sheet>` | - | - | `onDsChange`, `onDsFilter` | [App frame](components.md#app-frame) |
| `Secret` | `react/secret.js` | `<div class="ds-field ds-secret" data-ds-secret>` | - | `changed`, `filled`, `full`, `grow`, `inset`, `outlined`, `success`, `warning` | `onDsChange` | [Secret field](components.md#secret-field) |
| `SelectPanel` | `react/selectpanel.js` | `<div class="ds-selectpanel" data-ds-selectpanel>` | - | - | `onDsChange` | [Select panel](components.md#select-panel) |
| `Sheet` | `react/sheet.js` | `<dialog class="ds-sheet" data-ds-sheet>`, `open`, `onClose` | - | - | `onDsClose`, `onDsResize` | [Side sheet](components.md#side-sheet) |
| `Shell` | `react/shell.js` | `<div class="ds-app" data-ds-shell>` | - | `drawer`, `keyboard-hides-bar` | `onDsChange`, `onDsFilter` | [App frame](components.md#app-frame) |
| `ShortcutSheet` | `react/shortcuts.js` | `<dialog class="ds-dialog ds-shortcuts" data-ds-shortcuts>`, `open`, `onClose` | - | `bottom`, `contained`, `full`, `full-narrow`, `lg`, `scroll-outside`, `sm`, `xl` | `onDsClose`, `onDsFilter`, `onDsOpen` | [Shortcut sheet](components.md#shortcut-sheet) |
| `Sort` | `react/sort.js` | `<div class="ds-sort" role="group" data-ds-sort>` | - | `menu` | `onDsSort` | [Sort control](components.md#sort-control) |
| `SplitButton` | `react/splitbutton.js` | `<div class="ds-btn-group ds-split-btn" role="group" data-ds-splitbutton>` | `dsValue` | `block` | `onDsChange` | [Split button](components.md#split-button) |
| `SplitPane` | `react/splitpane.js` | `<div class="ds-splitpane" data-ds-splitpane>` | `store`, `dsSplitpaneStep`, `stack` | `outlined`, `stacked` | `onDsChange` | [Split pane](components.md#split-pane) |
| `Steps` | `react/steps.js` | `<ol class="ds-steps" data-ds-steps>` | - | `bar`, `path`, `vertical` | `onDsChange` | [Steps](components.md#steps) |
| `Suggestions` | `react/suggestions.js` | `<div class="ds-suggestions ds-scroll-x" role="group" data-ds-suggestions>` | - | `wrap` | `onDsSelect` | [Suggestions](components.md#suggestions) |
| `TagInput` | `react/taginput.js` | `<div class="ds-taginput" data-ds-taginput>` | - | `full` | `onDsAdd`, `onDsChange` | [Tag input](components.md#tag-input) |
| `Tearsheet` | `react/tearsheet.js` | `<dialog class="ds-dialog ds-tearsheet" data-ds-tearsheet>`, `open`, `onClose` | - | `narrow` | `onDsChange`, `onDsDirty`, `onDsStep`, `onDsSubmit` | [Tearsheet](components.md#tearsheet) |
| `Terminal` | `react/terminal.js` | `<div class="ds-terminal" data-ds-terminal>` | `keys`, `bar`, `status` | `fill` | `onDsChange`, `onDsKey` | [Terminal frame](components.md#terminal-frame) |
| `Thinking` | `react/thinking.js` | `<div class="ds-thinking" data-ds-thinking>` | `since`, `tokens`, `done` | - | `onDsChange` | [Thinking indicator](components.md#thinking-indicator) |
| `Time` | `react/time.js` | `<time data-ds-time>` | no children, `dsTimeStyle`, `numeric`, `smallest`, `largest`, `tip` | - | - | [core.md](core.md) |
| `TimePicker` | `react/timepicker.js` | `<div class="ds-picker" data-ds-timepicker>` | - | `block` | `onDsChange` | [Time picker](components.md#time-picker) |
| `TimeRange` | `react/timerange.js` | `<div class="ds-timerange" data-ds-timerange>` | - | - | `onDsChange`, `onDsRefresh` | [Time range](components.md#time-range) |
| `Toc` | `react/toc.js` | `<nav class="ds-toc" data-ds-toc>` | `offset`, `hash` | `bar`, `sticky` | `onDsChange` | [Jump links](components.md#jump-links) |
| `Toggle` | `react/toggle.js` | `<button class="ds-btn" data-ds-toggle>` | - | `adaptive`, `block`, `disc`, `disclosure`, `elevated`, `filled`, `ghost`, `icon`, `outlined`, `quiet`, `text`, `tonal` | `onDsChange` | [Toggle button and toggle group](components.md#toggle-button-and-toggle-group) |
| `ToggleGroup` | `react/toggle-group.js` | `<div class="ds-toggle-group" role="toolbar" data-ds-toggle-group>` | `dsToggleGroupRequired`, `dsValue`, `roving` | - | `onDsChange` | [Toggle button and toggle group](components.md#toggle-button-and-toggle-group) |
| `Toggletip` | `react/toggletip.js` | `<button class="ds-toggletip" data-ds-toggletip>` | `placement` | - | `onDsChange` | [Toggletip](components.md#toggletip) |
| `ToolCall` | `react/toolcall.js` | `<details class="ds-collapsible ds-disclosure ds-toolcall" data-ds-toolcall>` | `since`, `duration` | `row` | `onDsChange` | [Tool call](components.md#tool-call) |
| `Tracker` | `react/tracker.js` | `<div class="ds-tracker__cells" role="group" data-ds-tracker>` | - | - | `onDsChange` | [Tracker](components.md#tracker) |
| `Transcript` | `react/transcript.js` | `<div class="ds-transcript" role="region" data-ds-transcript>` | - | - | `onDsChange`, `onDsEarlier` | [Transcript](components.md#transcript) |
| `TransferList` | `react/transfer.js` | `<div class="ds-transfer" data-ds-transfer>` | - | - | `onDsChange` | [Transfer list](components.md#transfer-list) |
| `Tree` | `react/tree.js` | `<ul class="ds-tree" role="tree" data-ds-tree>` | `select`, `drag` | - | `onDsActivate`, `onDsChange`, `onDsDragCancel`, `onDsDragMove`, `onDsDragStart`, `onDsDrop`, `onDsError`, `onDsLoad`, `onDsSelect`, `onDsToggle` | [Tree view](components.md#tree-view) |
| `Truncate` | `react/truncate.js` | `<span class="ds-truncate" data-ds-truncate>` | `text` | `lines` | `onDsChange` | [Truncate](components.md#truncate) |
| `TypeConfirm` | `react/typeconfirm.js` | `<form class="ds-dialog__box ds-typeconfirm" data-ds-typeconfirm>` | `case` | `modeless` | `onDsChange`, `onDsConfirm` | [Type-to-confirm](components.md#type-to-confirm) |
| `UnsavedGuard` | `react/unsaved.js` | `<form class="ds-form" data-ds-unsaved>` | - | `rows` | `onDsChange`, `onDsDiscard`, `onDsError`, `onDsSave`, `onDsSaved` | [Unsaved-changes guard](components.md#unsaved-changes-guard) |
| `Upload` | `react/upload.js` | `<div class="ds-upload" data-ds-upload>` | `dsUploadAccept`, `maxSize`, `maxFiles`, `resize`, `quality`, `resizeType`, `paste` | - | `onDsChange`, `onDsFiles`, `onDsReject`, `onDsRemove`, `onDsRetry` | [File upload](components.md#file-upload) |
| `UsageMeter` | `react/usage.js` | `<section class="ds-usage" data-ds-usage>` | `used`, `budget`, `cost`, `costBudget`, `currency`, `warn` | `inline` | `onDsChange` | [Usage meter](components.md#usage-meter) |
| `SavedViews` | `react/views.js` | `<div class="ds-views" data-ds-views>` | `dsViewsKey`, `url`, `prefix` | - | `onDsView`, `onDsViews` | [Saved views](components.md#saved-views) |
| `Wheel` | `react/wheel.js` | `<span class="ds-wheel" data-ds-wheel>` | `shimmer` | - | `onDsChange` | [Wheel](components.md#wheel) |
| `Wizard` | `react/wizard.js` | `<form class="ds-wizard" data-ds-wizard>` | - | - | `onDsStep`, `onDsValidate` | [Form wizard](components.md#form-wizard) |
<!-- /generated: components -->

## Who writes what

The system writes some attributes and nodes itself. Each is written where React never writes, so a re-render keeps it
(`test/browser/react.spec.js` re-renders through each):

| Written by the system | Where | Why React keeps it |
|---|---|---|
| ripple spans (`.ds-press-ripple`) | inside an action | nodes React does not know; a text child is rendered as a text node of its own, so React never resets `textContent` |
| `.ds-pressed`, `.ds-btn--done`, `.ds-btn--failed`, `.ds-dialog--closing`, `--nested`, `--hidden`, `.ds-sheet--closing`, `--hidden`, and any class a behaviour claims (`own()` of `js/dom.js`) | a component's root | a className React writes during a press, a face or an exit keeps them (`SYSTEM_CLASSES` of `react/shared.js`), on every component |
| `data-state`, `inert`, `popover`, `hidden`, `aria-expanded` | overlays, menus, their openers | the adapter renders them once, or never; React writes a prop only when it changes |
| `aria-selected`, `aria-pressed`, `tabindex`, `hidden` of a controller's items | tabs, toggle groups, lists | rendered once from the first state; the controller keeps them, a new `value` goes through its `set()` |
| text a controller writes (a badge's figure, a relative time, rendered Markdown, highlighted code, a formatted value, a cut text, marked hits, key caps) | the component's root | the component renders no children there; its text is a prop the adapter hands to the behaviour |

An element the system moves would break React's tree, so the adapter never hands one over: the snackbar region is the
system's own, and a dialog or sheet that opens over another one is rendered inside that one's content.

## What the adapter does not do

- **No markup of its own.** It renders the documented markup; a component without a behaviour (layout, prose, empty
  states, the page frame's parts) is plain markup with `className`: `h('div', { className: 'ds-grid-2' }, ...)`.
  Copy the markup of [components.md](components.md).
- **No state of its own.** The page keeps the data (rows, the selected tab, whether a dialog is open) in React and
  renders it; the controllers keep only what their docs say they own.
- **Plain behaviour markup needs its module.** The provider loads `motion`, `ripple`, `overlay` and `tooltip`; plain
  `data-ds-*` markup of another behaviour React renders (`data-ds-collapsible`, `data-ds-time`) starts only once its
  module is loaded: `import '<dest>/js/<module>.js'`, or use that behaviour's adapter component, which imports it.
  With a [project bundle](bundle.md) and `"js": false`, nothing else loads it.
- **Plain markup inside a managed component is not initialised**: the component owns its subtree. Use the adapter
  component of that behaviour inside it, or hand a part back with `data-ds-managed="off"` on its wrapper
  ([core.md](core.md#init-and-the-observer)). Delegated behaviours (ripple, guard, tooltips) serve everything.
- **No server rendering of behaviours.** The markup renders on the server; the behaviours start when the client mounts
  (layout effects; the provider initialises on mount).
- **No theming in JavaScript.** Themes are CSS ([theming.md](theming.md)); the option props only add the option
  classes.
- **No portals.** Overlays stay where React renders them, inside the provider's `.ds-theme`.
- **Motion for data.** A sorted or filtered table renders its new order at once; for rows that glide use the system's
  `DS.motion.flip()` with plain markup, or `DataGrid`.

## Tests

`test/browser/react.spec.js` mounts the components under `StrictMode` with a pinned development copy of React 18
(`test/react/`, not an npm dependency): the markup, one controller per element after StrictMode's double effects, what
the system writes surviving re-renders (a sheet's `inert` panel during its exit, a copy button's done face), the
content components after a new text, the keyboard flows of tabs, dialog, menu button and toggle group, and no
listener left on `window` or `document` after mounting and unmounting. Every generated component is mounted on its
docs' markup with and without `StrictMode` and must show the same (its behaviour's `destroy()` gives back what its
init took), so a new component is covered by being generated. `test/react.test.js` keeps `dist/react/`, its
types and `manifest.json` `react` in step with `src/react/` and the components.
