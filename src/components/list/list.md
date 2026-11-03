## Lists

```html
<ul class="ds-kv-list">
  <li><span>Model</span><strong>Latitude 7440</strong></li>
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
    <span class="ds-status ds-status--warning">[icon alert 16]<span>Warranty ends</span></span>
    <span class="ds-list__actions"><button class="ds-btn ds-btn--quiet ds-btn--icon ds-btn--sm" type="button" aria-label="More for LAPTOP-0042">[icon moreVertical 18]</button></span>
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
  weight). In forced colours the current row is `SelectedItem`; its other controls and chips take the system
  colours again, on `Canvas`, so they stay legible on the fill.
- Re-render with `DS.dom.morphHtml` and keyed rows (`data-ds-key`) inside `DS.motion.flip(list, ...)`: rows glide to
  their places on an opaque backing, new rows fade in over `--ds-dur-fast`, a removed row fades out while the rows
  below close the gap, and focus moves to its neighbour.

### Key-value rows that open, bars, facts in rows and the lock

```html
<ul class="ds-kv-list ds-kv-list--interactive">
  <li><a class="ds-kv-list__row" href="/owners/7"><span>Owner</span><strong>Ada Lovelace</strong></a></li>
  <li><button class="ds-kv-list__row" type="button"><span>Tickets</span><strong>3 open</strong></button></li>
  <li><div class="ds-kv-list__row"><span>Serial</span><strong>5CD1234XYZ</strong></div></li>
  <li><div class="ds-kv-list__row"><span>Backup</span><strong>[icon checkCircle 16 .ds-kv-list__icon .ds-kv-list__icon--ok]<span class="ds-sr">Passed:</span> Today, 02:00</strong></div></li>
  <li><div class="ds-kv-list__row"><span>Asset tag</span><strong class="ds-muted">Not set</strong></div></li>
</ul>

<ul class="ds-kv-list ds-kv-list--bars">
  <li><span>Disk</span><strong>78%</strong><span class="ds-meter ds-meter--warning" aria-hidden="true"></span></li>
</ul>

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
- `.ds-kv-list__icon` before a value, with `.ds-kv-list__icon--ok`, `.ds-kv-list__icon--warning` or
  `.ds-kv-list__icon--error` (`--ds-success`, `--ds-warning`, `--ds-error`), always with a `.ds-sr` word. `strong.ds-muted` is a quiet value ("Not set") in the regular weight.
- `.ds-kv-list--bars` puts a [meter](#charts) under each row, `aria-hidden` (the figure is in the text); the label
  stays on one line and ends in an ellipsis (give it a `data-tip` with the full text).
- `.ds-facts--rows`: each fact on a row of its own, the label in a column of `--ds-facts-label-width` (36%) in the
  body font, hairlines between; under 520px of content (or in a window of 600px and less) the label goes above its
  value.
- `.ds-lock` marks a value another system sets: the `lock` glyph, the reason in `aria-label` and `data-tip`. It is
  not an action and takes no `tabindex` (a tap shows the tip); name the reason once per card in a `.ds-meta` line.
  A locked value is text, never a disabled field ([rules.md](rules.md#state-and-feedback)).

**Motion:** the "Row list, timeline" row of [Feedback](motion.md#feedback) and the press of
[Controls](motion.md#controls) in motion.md.

