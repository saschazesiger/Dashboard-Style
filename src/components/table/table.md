## Table

```html
<section class="ds-card">
  <div class="ds-table-wrap">
    <table class="ds-table">                      <!-- ds-table--dense: 40px rows -->
      <caption class="ds-sr">Devices</caption>
      <thead><tr>
        <th scope="col" aria-sort="ascending"><button class="ds-table__sort" type="button">Device [icon arrowUp 16 ds-table__sort-arrow]</button></th>
        <th scope="col" class="ds-num"><button class="ds-table__sort" type="button">Age</button></th>
        <th scope="col" class="ds-col--secondary">Owner</th><th scope="col">Status</th>
      </tr></thead>
      <tbody>
        <tr>
          <td class="ds-col--text"><button class="ds-link-btn" type="button">Printer on floor 2</button></td>
          <td class="ds-num">3.2</td>
          <td class="ds-col--secondary">Ada Lovelace <small>(default)</small></td>
          <td><span class="ds-status ds-status--ok">[icon check 16]<span>OK</span></span></td>
        </tr>
      </tbody>
    </table>
  </div>
</section>
```

- 48px head, 52px rows, hairlines, no zebra. In a card the table runs to the card edges.
- Row hover is a state layer on the cells (`currentColor` at `--ds-state-hover-lg`, `--ds-dur-fast`), so it adds to
  a selected row's colour; `--ds-table-row-hover` sets a fixed colour instead.
- `.ds-num` right-aligns tabular figures; `.ds-col--text` keeps a readable width; `.ds-col--secondary` is dropped on
  phones. `.ds-table--wide` also drops secondary columns when the page is narrow (next to the drawer). In a card the
  last column still shown keeps the card's gutter at its end, so trailing secondary columns can drop.
- Sortable columns: a `.ds-table__sort` button in the header cell and `aria-sort` on the cell; the arrow shows at the
  sorted column only; every sort button keeps room for it (1.6.1), so moving the sort never shifts the columns. In a
  `.ds-num` column the arrow leads. Render the same up arrow for both directions and mark
  it `.ds-table__sort-arrow`: `aria-sort="descending"` turns it 180deg on the spring (when the header is patched in
  place by `morphHtml`). An arrow without the marker is never turned, so a page that renders `arrowDown` for a
  descending column keeps showing it as drawn.
- Short values that must not break (an ID with a hyphen) take `.ds-nowrap`.
- A table that scrolls sideways in a card (on phones, or `.ds-table--wide` in a narrow content area) fades at the
  card's edge while columns follow (2.0: the one fade model of the [Horizontal scroller](#horizontal-scroller)).
  Where scroll timelines exist (progressive: `animation-timeline`) the fades follow the scroll position: the end fade
  goes over the last `--ds-space-8` of the travel, a start fade grows over the first `--ds-space-8` once the table has
  left its start, and a table that fits shows neither. `ds-scroll-edge-start` and `ds-scroll-edge-end` drive the
  registered numbers `--ds-scroll-edge-start` and `--ds-scroll-edge-end` (0 or 1, times the fade length) on the
  wrapper's own scroll timeline. Elsewhere `DS.dom.scrollEdges(wrapper)` sets them through `data-ds-overflow-start`
  and `data-ds-overflow-end`; without it the static fade at the right edge stays. The fade is `--ds-scroll-fade`
  long (default `--ds-card-pad`); `--ds-scroll-fade: 0px` on the theme turns every fade off. The scrollbar strip stays
  unmasked (`--ds-scrollbar-height`, written by `scrollEdges()`). A wrapper with stacked rows never fades. A table
  scrolled sideways that then fits (columns hidden, a filter, a wider window) keeps its last fade in Chromium and
  WebKit: call `DS.motion.resyncScroll(wrapper)` after such a change. `ds-edge-fade`, `--ds-table-fade-start` and
  `--ds-table-fade-end` (the 1.x model, internal) are deprecated in 2.0 and unused (removed in 3.0 at the earliest).
- A wrapper whose cells hold nothing focusable cannot be reached by the keyboard (WebKit gives a scroller no tab stop
  of its own): make it one, `<div class="ds-table-wrap" tabindex="0" role="region" aria-label="Devices">`. Its ring is
  inset (it rests at the edge and snaps inward) and the fades drop while it is focused.
- `.ds-table__sort` presses in `--ds-dur-micro` and ripples (it is not a pill, so it does not morph); keyboard focus
  shows the ring, which snaps to its offset, and the focus layer.
- `.ds-link-btn` is an inline link: no ripple and no morph, which would reach outside its line of text. Keyboard
  focus shows the ring (also without `.ds-base`), snapping to its offset; a press darkens its underline, the press
  feedback on touch screens.
- Any checkbox in a `.ds-table` is drawn like `.ds-checkbox` ([Form](#form)), with a halo that the table's
  wrapper does not clip; a switch or a chip in a cell keeps its own look.
- Figures in tables never count up; a changed value shows at once.

Sort, filter (also while typing) and live data glide (1.4): key the rows with `data-ds-key` and render through
`DS.motion.flip` and `DS.dom.morphHtml`:

```js
// A user's sort or filter (also per keystroke): glides at once, a call mid-glide continues from where each row is.
DS.motion.flip(tbody, (options) => DS.dom.morphHtml(tbody, renderRows(rows), options), { items: 'tr' });
// Polled data: values update at once; a reorder waits while a mouse or pen is over the rows or a row has focus (at most 2s).
DS.motion.flip(tbody, (options) => DS.dom.morphHtml(tbody, renderRows(rows), options), { items: 'tr', live: true });
```

Moved rows glide on `translate` on the spring, entering rows fade in, removed rows go at once while the rows below
glide up (a table row cannot leave out of flow), and above 50 moving rows the update lands without motion. While
rows glide, `flip()` marks the `tbody` with `data-ds-glide` and `--ds-flip-backdrop` (the colour behind the table), and
every row gets an opaque backing in that colour (a selected row its colour over it), so rows that cross never show
their text through each other (1.6.1). `live`
is only for polled updates; sorting and filtering are user actions. More in
[motion.md](motion.md#data-motion).

With live data, a column whose content changes width (a status chip, a figure that gains a digit) gets a stable
width (a `min-width` on its `th`, or a `<col>`), so the columns do not shift sideways when a value changes: `flip()`
moves rows only vertically, and automatic table layout re-divides the widths on every change.

### Interactive, selected and expandable rows

```html
<table class="ds-table ds-table--interactive">
  <thead><tr>
    <th scope="col"><input type="checkbox" aria-label="Select all"></th>          <!-- indeterminate for some -->
    <th scope="col"><span class="ds-sr">Details</span></th><th scope="col">Device</th><th scope="col">Status</th>
  </tr></thead>
  <tbody>
    <tr data-ds-key="p2" class="ds-table__row--selected">                         <!-- or just the checked box -->
      <td><input type="checkbox" aria-label="Select Printer on floor 2" checked></td>
      <td><button class="ds-btn ds-btn--quiet ds-btn--icon ds-table__toggle" type="button" aria-expanded="false" aria-controls="p2-detail"
            aria-label="Details">[icon chevronDown 20 ds-chevron]</button></td>
      <td class="ds-col--text"><a class="ds-link-btn ds-table__row-link" href="/devices/p2">Printer on floor 2</a></td>
      <td><span class="ds-status ds-status--ok">[icon check 16]<span>OK</span></span></td>
    </tr>
    <tr class="ds-table__detail" id="p2-detail" data-ds-key="p2-detail" inert>
      <td colspan="4"><div class="ds-table__expand"><div>
        <dl class="ds-facts">...</dl>
      </div></div></td>
    </tr>
  </tbody>
</table>
```

- **Interactive** (`.ds-table--interactive`): every body row opens its record. The row's primary link or button
  carries `.ds-table__row-link`; its `::after` stretches over the row, so a click anywhere on the row follows it,
  while the row's other controls (checkbox, toggle, buttons) stay above it. Keyboard focus shows the focus layer on
  the row and the ring around the row, inset so the scroller never clips it. The press is the cell layer at
  `--ds-state-pressed` in `--ds-dur-micro`; with `DS.ripple.attach()` the row ripples from the pointer instead
  (Enter on the row link ripples from the centre). A row's first cell may be a `<th scope="row">` row header: it
  takes the row's layers and holds the ripple like a `<td>`. A row without a `.ds-table__row-link` stays plain (2.0):
  no pointer, no press layer, no ripple, since it opens nothing.
- **The row is the link's box** (2.1.1): such a row is positioned, and every body row of an interactive table has
  an identity transform (`transform: translateX(0)`), because WebKit (macOS Safari 26, iOS before 27) lays a table
  row out static whatever its `position`; without the transform every row's link stretched over the whole table and
  the last row took every click, the hover, the status bar URL and WebDriver's element clicks. A row is therefore a
  stacking context and the box of `position: fixed` descendants, except while it holds a `.ds-menu` or
  `.ds-combo__popup` that the script places (no popover or anchor positioning), which then stays fixed against the
  viewport. WebKit gives the stretched area the table's height below the row's top: the rows below, painted above
  it, still take their own clicks, the last row's area ends at the wrapper, and a focused row clips what it holds to
  itself (`clip-path: inset(0)`), so in WebKit its ring shows on the top and the sides only. `DS.ripple` sizes a
  row's ripple to the row itself. (Anchor positioning would size the area exactly, but WebKit then restyles the link
  from its initial values on every load and its underline and ring offset transition.)
- **Selected** (`.ds-table__row--selected`, or any row with a checked checkbox directly in a cell): the row takes
  `--ds-table-row-selected` (default `--ds-accent`) over `--ds-dur-fast`; select all changes every row in the same
  frame, with no stagger. The checkbox is the cue that does not rely on colour, in every row and in the header cell
  (bulk selection; set `indeterminate` when only some rows are selected).
- **Expandable**: the trigger row holds a `.ds-table__toggle` with a `.ds-chevron` and `aria-expanded`, followed by
  a `.ds-table__detail` row whose single cell holds `.ds-table__expand` and one child. The detail opens by
  `grid-template-rows` over `--ds-dur-medium` on `--ds-ease-out` and closes over `--ds-dur-base` on `--ds-ease-in`
  (it pushes the rows below, so it never overshoots); its content fades over `--ds-dur-fast`, and the chevron turns
  on the spring. There is one hairline, below the detail, which travels down as it opens. The page toggles
  `aria-expanded`, sets `inert` on the collapsed detail row (which also hides it from assistive technology) and
  keys both rows with `data-ds-key`, so `flip()` and `morphHtml` keep them together. The child takes the cells'
  horizontal padding and its own vertical room; put the content straight into it. Name the toggle column's header
  for screen readers, `<th scope="col"><span class="ds-sr">Details</span></th>` (an empty header cell is an
  accessibility error).
- The row decides its layers and its cells paint them (2.0): each body row sets `--ds-table-row-layer` (the state
  layer), `--ds-table-row-pace` (how fast it changes), `--ds-table-row-tint` (the selection a pinned cell lays over
  its base) and `--ds-table-row-line` (the style of its hairline). They are internal: a page never sets them; to
  change the look, set `--ds-table-row-hover` and `--ds-table-row-selected`. A cell rule behind a row's `:has()`
  would make Chromium restyle every table cell of the page on each change anywhere in it.

### Stacked rows

```html
<div class="ds-table-wrap">
  <table class="ds-table ds-table--stack">                <!-- ds-table--stack-wide: five or more field columns -->
    <thead><tr><th scope="col">Name</th><th scope="col">URL</th><th scope="col"><span class="ds-sr">Remove</span></th></tr></thead>
    <tbody>
      <tr data-ds-key="s1">
        <td data-label="Name"><input class="ds-input" aria-label="Name" value="Status page"></td>
        <td data-label="URL"><input class="ds-input" aria-label="URL" value="https://status.example.org"></td>
        <td class="ds-table__actions"><button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Remove source 1">[icon close 20]</button></td>
      </tr>
    </tbody>
  </table>
</div>
```

- A table of fields (one row per entry) stacks where a row of fields has no room: always inside `.ds-sheet__body` and
  `.ds-dialog`, and in a view when the content area is at most 600px wide (`--stack`) or 840px (`--stack-wide`).
  Stacked, each row is a block with a hairline border and the card radius, `--ds-space-3` apart; each cell shows its
  `data-label` above its content in the field label's type (labels above fields), and a `.ds-table__actions` cell
  sits at the block's top end. The header stays for screen readers only, and the labels are not read a second time
  where alt text for generated content exists (progressive; Safari 16.4 reads them once more). The table keeps its
  table roles in every engine.
- In a card the blocks keep the card's padding. No row hover and no edge fade; rows keep `data-ds-key`, so `flip()`
  and `morphHtml` work as in any table.
- Not combinable: `.ds-table--interactive`, expandable rows and sort buttons (the header is hidden: offer sorting
  elsewhere). A `.ds-table-wrap--fill` or `.ds-table--pin-first` steps aside while the rows stack.

### Full-page tables and pinned columns

```html
<div class="ds-view ds-view--fill">                      <!-- the view stops scrolling, its last child fills -->
  ...
  <div class="ds-table-wrap ds-table-wrap--fill">
    <table class="ds-table ds-table--interactive ds-table--pin-first">
      <thead><tr><th scope="col">Device</th><th scope="col">Model</th> ... </tr></thead>
      <tbody><tr data-ds-key="p2"><td><a class="ds-link-btn ds-table__row-link" href="/devices/p2">Printer on floor 2</a></td> ... </tr></tbody>
    </table>
  </div>
</div>
```

- **`.ds-table-wrap--fill`**: the wrapper is its own card (hairline border `--ds-line`, `--ds-radius-card`, the
  opaque `--ds-table-sticky-bg`, default `--ds-surface`), takes what is left of a bounded parent (`flex: 1 1 auto`;
  `.ds-view--fill`, or any flex column with a height) and scrolls both ways, so its header row sticks to its top
  (`--ds-z-sticky`). It is at least `--ds-table-fill-min-height` (240px) tall, at most `--ds-table-fill-max-height`
  (none). Use it outside a card. Cells stay on one line and end in an ellipsis at `--ds-table-cell-max-width`
  (280px); a tooltip (`data-tip` with the full text) shows a cut cell. Keyboard focus never lands under the header
  (`scroll-padding`). The ends fade as in a card ([Horizontal scroller](#horizontal-scroller)), while the border and
  the scrollbars stay opaque.
- **`.ds-table--pin-first`** (in a fill wrapper or a card): the first column stays while the others scroll under it,
  above their controls (`--ds-z-pinned`; the corner over a sticky header `--ds-z-sticky-pinned`). Its cells are
  opaque (`--ds-table-sticky-bg`, or the selection colour of a selected row) and the row's hover, focus and press lie
  over them as two registered colours (`--ds-table-sticky-layer`, `--ds-table-sticky-tint`, internal), so they fade
  like the other cells. A hairline at the column's end shows once the table has scrolled (scroll-driven, else
  `data-ds-overflow-start` from `DS.dom.scrollEdges()`); the wrapper then drops its start fade, which would wash out
  the pinned text (`--ds-table-start-fade`, internal: `0` on a wrapper that holds a pinned table), and keeps the end
  fade.
- In an interactive table the pinned cell holds the row link's stretched area, so `DS.ripple.attach()` forwards a
  click anywhere on the row (outside its controls, with no text selected) to the `.ds-table__row-link`: a plain click
  clicks it, Ctrl, Meta, Shift or the middle button open an `a[href]` in a new tab, and a page that called
  `preventDefault()` on the click keeps it. Without `attach()` only the link's own cell opens the row. The row ripples
  in two parts from one centre. The keyboard ring of the row link wraps the pinned cell only, while the focus layer
  covers the whole row. `DS.dom.scrollEdges()` writes `--ds-table-pin-width` (the pinned column's width) and every
  table wrapper (a fill wrapper or a card's) keeps that much `scroll-padding` at its start, so focus moved by the
  keyboard never lands under the pinned column.
- Forced colours: sticky and pinned cells are `Canvas`, the wrapper border `CanvasText`. Print: unbounded, not
  sticky, every cell wraps; closed detail rows are left out (an open one prints in full).

### Row actions, summary rows and density

```html
<tr data-ds-key="d4">
  ...
  <td class="ds-table__actions">
    <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Edit LAPTOP-0051" data-tip="Edit">[icon pencil 20]</button>
    <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Actions for LAPTOP-0051" aria-haspopup="menu" aria-expanded="false">[icon moreVertical 20]</button>
  </td>
</tr>
...
<tfoot><tr><th scope="row">Total</th><td class="ds-num">128</td><td></td></tr></tfoot>
```

- `td.ds-table__actions` holds a row's own buttons at its end: end-aligned, no wider than its buttons, which hang
  into the cell's padding, so the row keeps its height and the last icon lines up with the column's edge. Inside an
  element with `.ds-hover-actions` the buttons show on demand (row hover, focus, selection, an open menu; always on
  touch screens): `<td class="ds-table__actions"><span class="ds-hover-actions">...buttons...</span></td>` (the span,
  not the cell, so the row's hairline and layers stay).
- `<tfoot>` rows sum up the table: the label type in `--ds-text`, tabular figures, a hairline (`--ds-line-2`) above,
  no hover, press or row link.
- Density hooks: the header cells are `--ds-table-head-height` (48px), the rows `--ds-table-row-height` (52px) and
  `.ds-table--dense` rows `--ds-table-dense-row-height` (40px); the cells' block padding follows the heights.

### Bulk selection bar

```html
<div class="ds-toolbar">
  <div class="ds-swap" id="bulk-slot">                   <!-- one slot: the action bar or the selection bar -->
    <div class="ds-selection-bar" role="toolbar" aria-label="Selected devices">
      <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Clear selection" data-tip="Clear selection">[icon close 20]</button>
      <p class="ds-selection-bar__count" aria-live="polite">3 selected</p>
      <div class="ds-selection-bar__actions">
        <button class="ds-btn ds-btn--text" type="button">[icon trash 18] Delete</button>
      </div>
    </div>
  </div>
</div>
```

- While rows are selected, the selection bar stands where the toolbar (or action bar) stood: both share one slot,
  and `DS.motion.crossfade(slot, bar)` swaps them when the count goes from 0 to 1 and back
  (`crossfade(slot, toolbar)`), so the table never moves. The count changes at once, never with a crossfade, and
  says the state (the `--ds-accent` tint with `--ds-on-accent` ink does not). The slot sits in a grid (a
  `.ds-toolbar`), where it takes the full width.
- "Clear selection" unchecks every row and moves focus to the header checkbox (the bar goes). In forced colours the
  bar keeps an outline; in print it is hidden.

**Motion:** the "Table" row of [Feedback](motion.md#feedback) and [Data motion](motion.md#data-motion) in motion.md.

