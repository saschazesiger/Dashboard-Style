## Tabs

Sections of one page or record. ARIA tabs show one panel at a time; link tabs move between pages of a record.

```html
<div class="ds-tabs" role="tablist" aria-label="Device" data-ds-tabs>
  <button class="ds-tabs__tab" role="tab" type="button" id="t-details" aria-selected="true" aria-controls="p-details" data-label="Details">Details</button>
  <button class="ds-tabs__tab" role="tab" type="button" id="t-history" aria-selected="false" aria-controls="p-history" tabindex="-1" data-label="History">History<span class="ds-tabs__count"><span class="ds-sr">, </span>3</span></button>
</div>
<div class="ds-tabs__panel" role="tabpanel" id="p-details" aria-labelledby="t-details" tabindex="0"> ... </div>
<div class="ds-tabs__panel" role="tabpanel" id="p-history" aria-labelledby="t-history" tabindex="0" hidden> ... </div>

<!-- link tabs -->
<nav class="ds-tabs" aria-label="Device">
  <a class="ds-tabs__tab" href="/devices/42" aria-current="page" data-label="Details">Details</a>
  <a class="ds-tabs__tab" href="/devices/42/history" data-label="History">History</a>
</nav>

<!-- a tray; the selected tab a surface pill -->
<div class="ds-tabs ds-tabs--contained" role="tablist" aria-label="Range"> ... </div>

<!-- a column beside its panels -->
<div class="ds-tabs__columns">
  <div class="ds-tabs ds-tabs--vertical" role="tablist" aria-orientation="vertical" aria-label="Settings"> ... </div>
  <div> panels </div>
</div>

<!-- a tab that closes: a wrapper, so the close button is no child of the tab; the button is for the pointer -->
<span class="ds-tabs__item" role="none">
  <button class="ds-tabs__tab" role="tab" type="button" id="t-report" aria-selected="false" aria-controls="p-report" tabindex="-1" aria-keyshortcuts="Delete" data-label="Report">Report</button>
  <button class="ds-btn ds-btn--quiet ds-btn--icon ds-xs ds-tabs__close" type="button" tabindex="-1" aria-hidden="true" data-tip="Close">[icon close 16]</button>
</span>
<!-- ... and in its panel, the named action everyone else reaches -->
<div class="ds-tabs__panel" role="tabpanel" id="p-report" aria-labelledby="t-report" tabindex="0" hidden>
  ...
  <button class="ds-btn ds-btn--text" type="button" data-ds-tabs-close>Close Report</button>
</div>
```

**Options** ([options.md](options.md)): classes on the row or any ancestor; the nearest wins.

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Variant | `--line` (default), `--contained`; `--vertical`, `--fill`, `--flush` | the row | the look; `--vertical` combines with either look, `--fill` and `--flush` with a row |
| Size | `.ds-xs`, `.ds-sm`, `.ds-md`, `.ds-lg`, `.ds-xl` | the row or a group | 32, 40, 48, 56, 64px high (8px per step), side padding 8 to 24px (4px per step), the size's type role at the regular weight (the selected tab alone takes the label weight) |
| Density | `.ds-density-comfortable`, `-compact`, `-dense`, `-tight` | any container (the compact theme sets dense) | 4px less height per step (48, 44, 40, 36px at md); side padding and type stay |
| Shape | `.ds-shape-square`, `-soft`, `-default`, `-round` | any container or the theme | multiplies the ring's radius, the state layer's (rest and pressed) and the contained tray's and pill's |
| Touch | `.ds-touch` | the theme or a container | a tab is at least `--ds-touch-target` (48px) high whatever the size and density; so is the close button, and the tab keeps room for it |
| Tone | none | | a tab states no status; a word or a `.ds-badge` in it may |

### Behaviour: `data-ds-tabs`

`data-ds-tabs` on the row (`DS.init()` finds it; `DS.tabs.create(row, options)` is the imperative path, with the same
controller) does what 2.x pages wired by hand:

- **Selection.** A click, or the arrow keys, selects a tab: `aria-selected`, the one tab stop (`DS.dom.roving()`), the
  panels' `hidden` (the new one enters with `DS.motion.enter(panel, 'swap')`), the indicator (`DS.indicator`, with
  `reveal`) and a `ds:change` on the row with `{ tab, panel, previous, value, first }` (`value` is the tab's id). With
  `data-ds-tabs-activate="manual"` the arrow keys only move the focus and Enter or Space selects. An `aria-disabled`
  tab takes the focus, never the selection. Link tabs (a `<nav>` of links) get the indicator; the page navigates and
  sets `aria-current`.
- **Panels kept alive.** A panel that hides keeps its DOM, its fields and its own scroll position. `first` in
  `ds:change` is `true` the first time a panel shows, so a page may fill it then.
- **Closing.** A tab closes when its `.ds-tabs__item` holds a `.ds-tabs__close` or it says
  `aria-keyshortcuts="Delete"`: from that button, from Delete, and from a `data-ds-tabs-close` button in its panel.
  `ds:close` (`{ tab, panel }`, on the row) may be cancelled, for unsaved work or the last tab; otherwise the tab and
  its panel go, a neighbour takes the selection when the selected one closed, the focus stays in the row (the add
  button when no tab is left), and a screen reader hears "{label} closed" (the string `tabClosed`). The overlays' own
  `ds:close` bubbles too: check `event.target` when you listen above the row.
- **Adding.** A `.ds-tabs__add` button in the `.ds-tabs__bar` sends `ds:add` on the row; the page calls `add()`,
  which writes a tab (closable unless `closable: false`) and a panel after the last one, and selects and focuses it.
  The panel of a tab that closes holds its named close action, a `.ds-btn--text` with `data-ds-tabs-close` ("Close
  June", the string `closeTab`): the page puts its content before it (`panel.prepend()`). A page that passes its own
  `panel` writes that action itself.
- **Overflow into "More".** With `data-ds-tabs-overflow` (`overflow: true`) on a row in a `.ds-tabs__bar`, the tabs
  that do not fit the bar hide (`hidden` on the tab or its `.ds-tabs__item`) and a "More" button after the last one
  (`.ds-tabs__more`, the string `more`, named "More tabs", `moreTabs`) opens a `.ds-menu` of them, with their icons
  and counts (`DS.menu`, so `DS.overlay` opens it, focuses it, closes it on Escape and returns the focus). An item
  selects its tab, which comes back into the row and takes the focus: the selected tab always stays in the row. The
  bar's width (a `ResizeObserver`), added and removed tabs and changed labels lay it out again. A vertical row never
  overflows: it scrolls.

```html
<div class="ds-tabs__bar">
  <div class="ds-tabs" role="tablist" aria-label="Drafts" data-ds-tabs data-ds-tabs-overflow> ... tabs that close ... </div>
  <button class="ds-btn ds-btn--quiet ds-btn--icon ds-tabs__add" type="button" aria-label="New report">[icon plus 20]</button>
</div>
```

```js
row.addEventListener('ds:add', () => {
  const { panel } = DS.get(row, 'tabs').add({ label: 'June' });
  panel.prepend(renderReport('June')); // before the "Close June" action add() wrote
});
row.addEventListener('ds:close', (event) => {
  if (unsaved(event.detail.panel)) event.preventDefault();
});
```

| Attribute | Option | What |
|---|---|---|
| `data-ds-tabs` | | the behaviour, on the `.ds-tabs` row |
| `data-ds-tabs-overflow` | `overflow: true` | the tabs that do not fit the `.ds-tabs__bar` go into a "More" menu |
| `data-ds-tabs-activate` | `activate` | `focus` (default): the arrow keys select; `manual`: Enter or Space selects |
| `data-ds-tabs-close` | | on a button in a panel: closes that panel's tab |

The controller (`DS.get(row, 'tabs')`, or what `create()` returns): `get()` (the id of the selected tab, or for link
tabs the current one), `set(idOrTab)` (selects it, also one in the More menu; returns whether the selection changed),
`select(tab, { focus, animate })`, `close(tab)` (as Delete, `ds:close` first), `add({ label, id, closable, select,
panel })` (returns `{ tab, panel }`), `refresh()` (lays the row out again), `on('change' | 'close' | 'add', fn)`
(returns the unsubscribe) and `destroy()`. `DS.tabs.fit(widths, { room, gap, pad, selected })` is the arithmetic of the
overflow alone: the indices of the tabs that stay in a row of `room` px.

What the module writes is owned state, so a re-render with `DS.dom.morphHtml` keeps it: `aria-selected` on the tabs,
`hidden` on the panels and on the tabs that overflow. Drive the selection with `set()`, not by re-rendering
`aria-selected`. The More button and its menu are the system's own (`data-ds-keep`).

Without the module (2.x, still fine for a row the page owns completely):

```js
DS.indicator.create(tabs, { active: '[aria-selected="true"], [aria-current="page"]', className: 'ds-tabs__indicator', reveal: true });
DS.dom.roving(tabs);                                   // arrow keys, Home and End move focus and select
tabs.addEventListener('click', (event) => {
  const tab = event.target.closest('[role="tab"]');
  if (!tab || tab.getAttribute('aria-disabled') === 'true') return;
  for (const other of tabs.querySelectorAll('[role="tab"]')) {
    const selected = other === tab;
    other.setAttribute('aria-selected', String(selected));
    other.tabIndex = selected ? 0 : -1;
    document.getElementById(other.getAttribute('aria-controls')).hidden = !selected;
  }
  DS.motion.enter(document.getElementById(tab.getAttribute('aria-controls')), 'swap');
});
```

### Look

- A row of `--ds-tabs-height` (48px at size md and comfortable) over a `--ds-line` hairline (`.ds-tabs--line` names this
  look explicitly); labels in the size's role (`--ds-tabs-font`) at the regular weight in `--ds-text-2`, side padding
  `--ds-tabs-padding-x`. The selected tab takes `--ds-primary` ink, the label weight and the bar: a
  `--ds-tabs-indicator-height` (3px) bar in `--ds-tabs-indicator-color` (`--ds-primary`) at its bottom that glides
  between the tabs (`DS.indicator`, `.ds-tabs__indicator`). Selected is bar, weight and ARIA. `data-label` (the
  tab's text again) keeps the width of the heavier weight, so nothing moves; an icon before the text, a
  `.ds-tabs__count` or a `.ds-badge` after it keeps its place.
- `.ds-tabs--contained`: a tray (`--ds-tabs-contained-bg`, `--ds-surface-high`) as wide as its tabs, the selected tab a
  pill of `--ds-surface` that glides inside it (the same indicator). The tab gives up the tray's padding, so the row is
  as high as a line row. Selected is pill, ink, weight and ARIA.
- `.ds-tabs--vertical`: a column with the hairline and the bar at its end, labels at its start (with `--contained` a
  tall tray). Set `aria-orientation="vertical"`: the module then moves with Up and Down (by hand:
  `DS.dom.roving(tabs, { orientation: 'vertical' })`).
  `.ds-tabs__columns` lays it out beside the panels, and over them at 600px of the content.
- `.ds-tabs__count`: a count after the label (tabular figures, the meta role, the tab's colour). A `.ds-sr` separator
  reads it with the label ("History, 3"). A `.ds-badge` is for news that needs the eye.
- A tab that closes: `.ds-tabs__item` (`role="none"`) holds the tab and a `.ds-tabs__close`, a quiet extra-small icon
  button lying over the tab's end; the tab keeps room for it, also under `.ds-touch`. The module (or, without it, the
  page) removes the tab and its panel and moves the focus before the closing control goes: when the selected tab
  closes a neighbour takes the selection and the focus; when another tab closes, the focus goes to the selected tab
  and the selection stays. The button is for the
  pointer alone: a tablist owns only tabs, so it is `tabindex="-1"` and `aria-hidden="true"`, with no name of its own.
  Delete on the tab closes it (`aria-keyshortcuts="Delete"` says so), and the tab's panel holds a named close action,
  the one way for a screen reader on a touch screen.
- Press: the state layer is a pill inside the tab that turns squarer while pressed and springs back, with the ripple
  (`DS.ripple.attach()`); the keyboard ring is inset and snaps inward. `:disabled` and `aria-disabled="true"` take the
  disabled model (no hover, press or morph; `aria-disabled` keeps its focus layer).
- Switching: the page toggles `hidden` on the panels and enters the new one (`DS.motion.enter(panel, 'swap')`). Link
  tabs are navigation: `DS.motion.transition(update, { type: 'fade-through' })` ([Views](motion.md#views)).
- Overflow: the row scrolls sideways without a scrollbar (add `.ds-scroll-x` for its edge fades); `DS.dom.roving()`
  scrolls a focused tab into view, and `reveal: true` keeps the selected one in view. Or it folds into "More"
  (`data-ds-tabs-overflow`, above).
- `.ds-tabs__bar`: the row with the buttons after it (the More button, a `.ds-tabs__add`), as wide as its container;
  the hairline is the bar's (none around a contained or flush row). The row takes the width of its tabs, so More
  follows the last one; a `--fill` row takes the rest. `.ds-tabs__more` is a quiet button, "More" and a chevron;
  `.ds-tabs__add` a quiet icon button the page writes, named by its `aria-label` ("New report").
- `.ds-tabs--fill`: equal widths across the row. `.ds-tabs--flush`: no hairline (the tabs sit on a card's edge).
- A panel that holds nothing focusable keeps `tabindex="0"`, so a keyboard reaches its content.
- Keyboard (the APG tabs pattern, automatic activation by default): ARIA tabs are one tab stop (`DS.dom.roving()`):
  Left and Right (Up and Down in a vertical row), Home and End move and select (with `manual`, Enter or Space
  selects), a disabled tab and one folded into More are skipped, an `aria-disabled` one takes the focus and keeps its
  panel; Delete closes a tab that closes; Tab goes on to the More and add buttons, then the panel. More opens its menu
  on Enter, Space, Down (the first item) or Up (the last); Escape closes it and returns to More. Link tabs keep a stop per link. Names: the row's `aria-label`, `aria-controls` and `aria-labelledby` between
  tab and panel, `aria-current="page"` on the current link.
- Forced colours: the selected tab is `SelectedItem` / `SelectedItemText` (a choice in a set) and the indicator is
  hidden; a focused selected tab keeps a `CanvasText` ring inside; blocked tabs are `GrayText`; the contained tray keeps
  a `CanvasText` edge; the close button of a selected tab takes `SelectedItemText`, since it lies over that fill. Print
  wraps the row.
- Hooks: [theming.md](theming.md#component-hooks).

**Motion:** the "Tabs" row of [Navigation](motion.md#navigation) in motion.md. The contained pill and the vertical bar
glide like the bar. The More menu opens and closes as every menu; a tab that comes back from it into the row takes
its place at once (layout never animates) and the indicator glides to it.

<!-- changelog
- Tabs: `data-ds-tabs` (`DS.tabs`, `tabs.js`): selection, the keyboard, panels kept alive (`first` in `ds:change`),
  the indicator, closing (`ds:close`, cancelable; Delete, the close button, `data-ds-tabs-close` in a panel), adding
  (`.ds-tabs__add`, `ds:add`, `add()`) and the overflow into a "More" menu (`data-ds-tabs-overflow`,
  `.ds-tabs__bar`, `.ds-tabs__more`). New strings `moreTabs`, `tabClosed`, `closeTab`.
-->
