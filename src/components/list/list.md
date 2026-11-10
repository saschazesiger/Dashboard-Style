## Lists

Records in rows that open, label and value rows, bars, facts and lines of parts.

```html
<ul class="ds-kv-list">
  <li><span>Model</span><strong>Notebook 14</strong></li>
  <li><span>Warranty</span><strong>2027-03-31</strong></li>
</ul>

<ul class="ds-plain-list"><li>First</li><li>Second</li></ul>

<dl class="ds-facts">
  <div><dt>Owner</dt><dd>Ada Lovelace</dd></div>
  <div><dt>Location</dt><dd>Building A, 1st floor</dd></div>
  <div><dt>Last seen</dt><dd>Today, 09:12</dd></div>
  <div><dt>Ticket</dt><dd><a href="https://tracker.example/42">#42 [icon external 16]</a></dd></div>
</dl>

<p><span class="ds-parts"><span class="ds-parts__list"><span>3 new</span><span>1 updated</span><span>250 unchanged</span></span></span></p>
```

`.ds-facts` with exactly four entries shows 4, 2 or 1 per row by the page's width. `.ds-parts` wraps between parts
and never leaves a "·" at a line end; only a part wider than the whole line breaks inside. Links in parts
(`<span><a href="#new">3 new</a></span>`) keep their focus ring: the line clips only sideways, and the links take an
inset ring that snaps inward from the edge (also without `.ds-base`).

`.ds-list` is a list of records, `.ds-plain-list` text in list form, `.ds-kv-list` label and value. The three lists
have no top margin of their own (zero weight, so the rhythm of a card spaces them); the last key-value row has no
bottom padding, and long labels and values wrap inside their own part.

### Row list

Records that open, in an outlined list (2.0). Use it for a short list on an overview or in a side sheet; a list that
needs columns, sorting or bulk selection is a [Table](#table).

```html
<ul class="ds-list ds-list--interactive" aria-label="Devices">
  <li class="ds-list__item" data-ds-key="d42">[icon laptop 20 .ds-list__icon]
    <span class="ds-list__text">
      <span class="ds-list__title"><a class="ds-list__action" href="/devices/42">LAPTOP-0042</a></span>
      <span class="ds-list__meta">Notebook 14 · Building A</span>
    </span>
    <span class="ds-status ds-tone-warning">[icon alert 16]<span>Warranty ends</span></span>
    <span class="ds-list__actions"><button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm" type="button" aria-label="More for LAPTOP-0042">[icon moreVertical 18]</button></span>
    [icon chevronRight 20 .ds-list__chevron]
  </li>
</ul>
```

- `.ds-list`: an outlined surface (`--ds-line`, `--ds-radius-card`) with hairlines between rows, each at least
  `--ds-list-item-height` (56px) high. It never clips, so a row's menu is not cut; an empty list takes no room.
  `.ds-list__text` takes the room: below `--ds-list-text-min` (12rem) the trailing parts (a status chip,
  `.ds-list__actions`, the chevron) drop to a second line by themselves. `.ds-list__title` is in the label font,
  `.ds-list__meta` in the meta font and `--ds-text-2`, like `.ds-list__icon` and `.ds-list__chevron`.
- `.ds-list--interactive`: one `.ds-list__action` (a link or a button) per row; its `::after` stretches over the
  row, so the whole row opens the record, and the row's other links and controls stay above it and keep working. A
  state layer (hover `--ds-state-hover-lg`, press `--ds-state-pressed` in `--ds-dur-micro`, not while another
  control in the row is pressed), the focus layer and an inset ring on the row while the action has keyboard focus,
  the ripple (`DS.ripple.attach()`), no morph. A row whose action is `disabled` or `aria-disabled="true"` shows no
  hover or press layer (it keeps its focus layer) and takes the `not-allowed` cursor.
- The current row: `aria-current` on the row or on its action (`aria-current="page"`, anything but `"false"`) tints
  it with `--ds-list-current-bg` (`--ds-accent`) over `--ds-dur-fast`; say it in the row too (a word, the label
  weight). In forced colours the current row is `SelectedItem`; its other controls, chips and media take the system
  colours again, on `Canvas`, so they stay legible on the fill.
- Re-render with `DS.dom.morphHtml` and keyed rows (`data-ds-key`) inside `DS.motion.flip(list, ...)`: rows glide to
  their places on an opaque backing, new rows fade in over `--ds-dur-fast`, a removed row fades out while the rows
  below close the gap, and focus moves to its neighbour.

### A row with media, a description and an aside

```html
<ul class="ds-list" aria-label="People">
  <li class="ds-list__item">
    <span class="ds-list__media ds-list__media--round" aria-hidden="true">AL</span>     <!-- or <img src="..." alt=""> -->
    <span class="ds-list__text">
      <span class="ds-list__title">Ada Lovelace</span>
      <span class="ds-list__description">Asked for a second dock for the lab.</span>
      <span class="ds-list__meta">Research</span>
    </span>
    <span class="ds-list__aside">09:12</span>
    <span class="ds-list__actions"><button class="ds-btn ds-btn--quiet ds-sm" type="button" aria-label="Reply to Ada Lovelace">Reply</button></span>
  </li>
</ul>
```

- `.ds-list__media`: a thumbnail, an icon or an avatar's initials in a box of `--ds-list-media-size` (40px) on
  `--ds-surface-high`, with corners of `--ds-list-media-radius` (`--ds-radius-sm`); `.ds-list__media--round` for a
  person. An `<img>` fills it. Hide it from assistive technology when the row names the same thing.
- `.ds-list__description`: a sentence in the body font and `--ds-text-2`, between the title and the meta.
  `.ds-list__aside`: a short fact at the row's end (a time, a count), in the meta font with tabular figures. It drops
  to the second line with the other trailing parts.

### Stacked rows and sticky headings

```html
<ul class="ds-list ds-list--stacked" aria-label="Open requests"> ... </ul>

<ul class="ds-list" role="list" aria-label="People">
  <li class="ds-list__group" role="presentation"><h3 class="ds-list__heading">A</h3></li>
  <li class="ds-list__item"> ... </li>
</ul>
```

- `.ds-list--stacked`: the trailing parts always go under the text, whatever the width, each on a line of its own;
  the media or the icon holds its column beside them. For a narrow column or a side sheet.
- `.ds-list__group` with `.ds-list__heading`: a letter or a day that stays at the top of the nearest scroller on an
  opaque fill (`--ds-list-group-bg`), while its rows pass under it; `--ds-list-group-top` when a sticky page head
  stands above it. When focus moves up, the controls of its rows stop below the heading, never under it. `role="list"`
  keeps the list semantics in Safari; the heading's item is `role="presentation"`.
  Below 12 rows a letter heading rarely helps; for thousands of rows use a virtual list (below).

### Selectable, reorderable and virtual rows

`DS.list` (`js/list.js`) adds what a page would otherwise write for each list:

```html
<input class="ds-checkbox" type="checkbox" aria-label="Select all devices" aria-controls="devices" data-ds-list-all>
<ul class="ds-list" id="devices" aria-label="Devices" data-ds-list data-ds-list-select="multiple" data-ds-list-reorder>
  <li class="ds-list__item" data-ds-key="d42">
    <input class="ds-checkbox ds-list__check" type="checkbox" aria-label="Select LAPTOP-0042">
    <span class="ds-list__text"><span class="ds-list__title">LAPTOP-0042</span><span class="ds-list__meta">Notebook 14</span></span>
  </li>
</ul>

<ul class="ds-list ds-list--scroll" aria-label="All devices" id="all"></ul>
```

```js
const all = DS.list.create(document.querySelector('#all'), {
  select: 'multiple',
  virtual: { count: devices.length, estimate: 56, key: (i) => devices[i].id, render: (i) => rowHtml(devices[i]) },
});
all.on('change', ({ keys }) => bar.show(keys.length));
```

- **Select** (`data-ds-list-select="multiple"` or `"single"`): a `.ds-list__check` (a `.ds-checkbox`, or a radio with one
  `name` for single) at the start of each row, named for its row. A checked row takes `--ds-list-selected-bg`
  (`--ds-accent`) and keeps its box, so the state is never the colour alone. `Shift` and a click on a box checks or clears
  every row from the last box clicked. In a list without `.ds-list__action`, a press anywhere on a row (not on one of its
  controls) toggles its box, with the hover layer. A checkbox with `data-ds-list-all` and `aria-controls` naming the
  list's `id` checks or clears all rows and shows mixed for some. After a range or all, the announcer says "12 selected".
  The controller holds the keys (`data-ds-key`, else the box's `value`), so a morph or a window that renders the rows again
  brings them back checked. `ds:change` `{ keys, key, checked }` tells the page.
- **Reorder** (`data-ds-list-reorder`): each row gets a grip (`.ds-list__grip`, a quiet icon button named "Move
  LAPTOP-0042") at its start, and `DS.dnd` moves the row by pointer and by keys (`Space` lifts, the arrows move, `Space`
  drops, `Escape` cancels), with announcements. The page saves on `ds:drop` (`{ item, from, to }`, `to.index` ready for
  `splice()`).
- **Virtual** (`create(el, { virtual })`): `DS.virtual` keeps only the rows near the viewport: `count`, `render(index)`
  (one `li.ds-list__item` with its `data-ds-key`, escaped), `key(index)` (for the selection), `estimate` and the other
  options of [`DS.virtual.create`](core.md#dsvirtual-windowed-lists-and-rows). `.ds-list--scroll` makes the list its own
  scroller, at most `--ds-list-max-height` (24rem) high; `virtual.scroller` names another. One tab stop, the active row
  (an inset ring while it has the focus); `↑` `↓` `Home` `End` `PageUp` `PageDown` move it, `Tab` reaches its controls,
  `Space` toggles its box. Rows get `aria-setsize` and `aria-posinset`. Reorder is not offered on a virtual list.
  A virtual list that selects is a listbox, since the focus sits on the row and the row must say its state: the
  module writes `role="listbox"` (and `aria-multiselectable="true"` for `multiple`) on the list, `role="option"` and
  `aria-selected` on each row, and makes the row's box `inert` (a reader hears "DEVICE-0002, selected"; a press on the
  box toggles the row). Keep other controls out of such rows: an option's content is read as text.

| Export | What |
|---|---|
| `create(el, options)` | a list from the page (`select`, `reorder`, `virtual`), or new options for one `DS.init()` made |
| `facts(el)` | the copy buttons of a `.ds-facts` (what `data-ds-facts-copy` does) |
| `rangeKeys(keys, anchor, target)` | the keys from `anchor` to `target`, both included |
| `allState(checked, total)` | `'true'`, `'false'` or `'mixed'` for a "select all" box |

The list controller: `get()` (multiple: the checked keys; single: the key or `null`), `set(keys)`, `on(type, fn)`,
`window()` (the `DS.virtual` controller), `configure(options)`, `update()`, `destroy()`.

### Key-value rows that open, bars, facts in rows and the lock

```html
<ul class="ds-kv-list ds-kv-list--interactive">
  <li><a class="ds-kv-list__row" href="/owners/7"><span>Owner</span><strong>Ada Lovelace</strong></a></li>
  <li><button class="ds-kv-list__row" type="button"><span>Tickets</span><strong>3 open</strong></button></li>
  <li><div class="ds-kv-list__row"><span>Serial</span><strong>5CD1234XYZ</strong></div></li>
  <li><div class="ds-kv-list__row"><span>Backup</span><strong>[icon checkCircle 16 .ds-kv-list__icon .ds-tone-success]<span class="ds-sr">Passed:</span> Today, 02:00</strong></div></li>
  <li><div class="ds-kv-list__row"><span>Asset tag</span><strong class="ds-muted">Not set</strong></div></li>
</ul>

<ul class="ds-kv-list ds-kv-list--bars">
  <li><span>Disk</span><strong>78%, high</strong><span class="ds-meter ds-tone-warning" aria-hidden="true"></span></li>
</ul>

<dl class="ds-facts ds-facts--grid ds-facts--bordered" data-ds-facts-copy>
  <div><dt>Serial</dt><dd>5CD1234XYZ</dd></div>
  <div><dt>Model</dt><dd>Notebook 14</dd></div>
  <div class="ds-facts__wide"><dt>Location</dt><dd>Building A, 1st floor, room 101</dd></div>
  <div class="ds-facts__full"><dt>Notes</dt><dd data-ds-facts-nocopy>Issued with a second charger.</dd></div>
</dl>

<dl class="ds-facts ds-facts--stacked"> ... </dl>

<dl class="ds-facts ds-facts--rows">
  <div><dt>Owner</dt><dd>Ada Lovelace <span class="ds-lock" role="img" aria-label="Set by the directory sync" data-tip="Set by the directory sync">[icon lock 16]</span></dd></div>
  <div><dt>Location</dt><dd>Building A, 1st floor</dd></div>
</dl>
<p class="ds-meta">Values with a lock are set by the directory sync: change them there.</p>
```

- `.ds-kv-list--interactive`: each row is a `.ds-kv-list__row`, a link or a button that takes the whole row and
  hangs `--ds-space-2` into the space at its sides (the first and last rows also their outer padding), so its text
  stays in line with static rows: a state layer (`--ds-state-hover-lg`, press in `--ds-dur-micro`), the focus layer
  and a ring that snaps in, the ripple, no morph; `disabled` and `aria-disabled="true"` rows take the disabled
  model (`GrayText` in forced colours). A `div.ds-kv-list__row` is a static row among them.
- `.ds-kv-list__icon` before a value, with a tone on the icon itself (`.ds-tone-success`, `.ds-tone-warning`,
  `.ds-tone-error` ...), always with a `.ds-sr` word. `strong.ds-muted` is a quiet value ("Not set") in the regular weight.
- `.ds-kv-list--bars` puts a [meter](#charts) under each row, `aria-hidden` (the figure is in the text); the label
  stays on one line and ends in an ellipsis (give it a `data-tip` with the full text). A tone on the meter also goes
  into the row as a word ("78%, high"): the meter is hidden and a figure is no status.
- `.ds-facts--rows`: each fact on a row of its own, the label in a column of `--ds-facts-label-width` (36%) in the
  body font, hairlines between; under 520px of content (or in a window of 600px and less) the label goes above its
  value.
- `.ds-facts--stacked`: one fact under the other, each label above its value (a narrow column, a side sheet).
- `.ds-facts--grid`: the columns of `.ds-facts`, and facts that span: `.ds-facts__wide` two columns, `.ds-facts__full`
  the whole row (a description, an address). The grid measures itself, so where only one column fits a wide fact takes
  that one.
- `.ds-facts--bordered`: each fact in a cell with hairlines between and a frame around (corners
  `--ds-facts-radius`, times `--ds-shape`); with `--rows` a framed table of label and value.
- `data-ds-facts-copy` on the `dl`: `DS.list` writes a `.ds-facts__copy` button (a quiet icon button named "Copy
  Owner") after each value; `data-ds-facts-nocopy` on a `dd` leaves it out. It copies the value's text (without the
  lock), or the `dd`'s `data-ds-facts-value`, shows a check for `--ds-hold-status`, the announcer says "Copied" and
  `ds:copy` `{ text, label }` tells the page. The button shows on the fact under the pointer or in use, and always
  where there is no hover.
- `.ds-lock` marks a value another system sets: the `lock` glyph, the reason in `aria-label` and `data-tip`. It is
  not an action and takes no `tabindex` (a tap shows the tip); name the reason once per card in a `.ds-meta` line.
  A locked value is text, never a disabled field ([rules.md](rules.md#state-and-feedback)).

### Options

On the list or any ancestor; each is computed in the component's own rule ([options.md](options.md)).

| Option | Classes | Applies to | Effect |
|---|---|---|---|
| Size | `.ds-xs` ... `.ds-xl` | `.ds-list__item` | 8px of height per step (40, 48, 56, 64, 72px), 4px of it the block padding; the title takes the size's type role; the media 4px per step |
| | | `.ds-kv-list` rows, `.ds-facts--rows` | 8px of height per step, in the body font |
| Density | `.ds-density-*` | `.ds-list__item` | 4px of height per step (56, 52, 48, 44px), the padding 2px per side and per step; not the type, not the media |
| | | `.ds-kv-list` rows, `.ds-facts--rows` | 4px of height per step |
| | | `.ds-facts`, `.ds-plain-list` | the row gap 2px per step; facts above tiles also their column gap, as the tiles' |
| Shape | `.ds-shape-*` | `.ds-list`, `.ds-list__media`, `.ds-kv-list__row` | multiplies the radius (a square list has square rows; a round media has rounded corners at `.ds-shape-soft`, square ones at `.ds-shape-square`) |
| Touch | `.ds-touch` | `.ds-list__item`, `:is(a, button).ds-kv-list__row` | at least `--ds-touch-target` high; touch wins over size and density |
| | | `.ds-facts--bordered` | its cells' padding 4px per size step and 2px per density step, as key-value rows |
| Tone | `.ds-tone-*` | `.ds-kv-list__icon` | the icon's colour, from the class on the icon itself; always with a `.ds-sr` word |

A two-line row grows with its text and its padding, so the height of a row is a minimum. Its small menu button keeps
its own `.ds-sm`.

### Behaviour, keyboard and names

- The page wires what a row opens. Selection, reorder and the window come from `DS.list` (above); a list that needs
  columns or sorting is a [Table](#table).
- A row's box is named for its row ("Select LAPTOP-0042"), the grip by its action ("Move LAPTOP-0042"), a copy button by
  its label ("Copy Owner").
- `Tab` reaches a row's `.ds-list__action`, then its other controls; `Enter` opens the record, and `Space` presses it
  when it is a button. The row shows an inset ring and the focus layer while its action has keyboard focus. A key-value
  row that opens is a link or a button of its own.
- Name each list (`aria-label`), name the record in each row control's `aria-label` ("More for LAPTOP-0042"), and give
  a current row `aria-current` plus a word or the label weight. An `aria-disabled` action stays focusable, so its tip
  can say why; `.ds-lock` is `role="img"` with the reason in `aria-label`.

### Forced colours

The current row is `SelectedItem` / `SelectedItemText`, with a `CanvasText` ring when focused, and its other controls,
chips and media take the system colours again on `Canvas`. A blocked key-value row is `GrayText`. A checked row shows
its box in the system colours (the tint gives way); the grip and the copy buttons are buttons. A row that holds the
focus in a virtual list rings in the system's focus colour. The media's
transparent border becomes its edge, in the current row too. The sticky heading's fill stays opaque.

### Hooks

`--ds-list-item-height`, `--ds-list-padding`, `--ds-list-padding-y`, `--ds-list-radius`, `--ds-list-title-font`,
`--ds-list-media-size`, `--ds-list-media-radius`, `--ds-list-text-min`, `--ds-list-current-bg`, `--ds-list-group-bg`,
`--ds-list-group-top`, `--ds-list-selected-bg`, `--ds-list-max-height`, `--ds-kv-list-padding`, `--ds-facts-label-width`,
`--ds-facts-radius`: see [theming.md](theming.md).

**Motion:** the "Row list, timeline" row of [Feedback](motion.md#feedback) and the press of
[Controls](motion.md#controls) in motion.md.
