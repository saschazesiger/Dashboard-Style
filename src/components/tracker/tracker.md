## Tracker

A row of status cells, one per day, run or check: the uptime of a device over 90 days, the last 30 runs of a job.
Each state has a shape of its own, the date and state of every cell are in its tooltip, and a summary says in words
what the row adds up to.

```html
<figure class="ds-tracker">
  <figcaption class="ds-tracker__head">
    <span class="ds-tracker__label">Printer 7</span>
    <span class="ds-tracker__summary">99.2% uptime, 2 failures in 90 days</span>
  </figcaption>
  <div class="ds-tracker__cells" role="group" aria-label="Printer 7, last 90 days" data-ds-tracker>
    <span class="ds-tracker__cell ds-tracker__cell--success" role="img" aria-label="Nov 3: up" data-tip="Nov 3: up"></span>
    <span class="ds-tracker__cell ds-tracker__cell--error" role="img" aria-label="Nov 4: down 42 min" data-tip="Nov 4: down 42 min"></span>
    <!-- one cell per day -->
  </div>
  <div class="ds-tracker__axis"><span>90 days ago</span><span>Today</span></div>
  <ul class="ds-tracker__legend" aria-hidden="true">
    <li><span class="ds-tracker__cell ds-tracker__cell--success"></span>Up</li>
    <li><span class="ds-tracker__cell ds-tracker__cell--error"></span>Down</li>
  </ul>
</figure>
```

| Part or state | Class | What |
|---|---|---|
| Tracker | `.ds-tracker` | a `<figure>`: the head, the row, the axis and the legend |
| Head | `.ds-tracker__head` | a `<figcaption>`: `.ds-tracker__label` and `.ds-tracker__summary` (the row in words) |
| Row | `.ds-tracker__cells` | `role="group"` with a name; `data-ds-tracker` makes it one tab stop |
| Cell | `.ds-tracker__cell` | `role="img"`, named with its date and state, the same words in `data-tip` |
| Success | `.ds-tracker__cell--success` | low (60% of the row), solid: up, passed |
| Info | `.ds-tracker__cell--info` | low, dashed: maintenance, skipped |
| Warning | `.ds-tracker__cell--warning` | full height, dashed: degraded, flaky |
| Error | `.ds-tracker__cell--error` | full height, solid: down, failed |
| Empty | `.ds-tracker__cell--empty` | a stub at the foot: no data |
| Axis | `.ds-tracker__axis` | the span under the row: its first and last date |
| Legend | `.ds-tracker__legend` | the states named, each with a small cell of its shape |

**Status never by colour alone.** Problems stand to the full height and the calm states stay low; the doubtful ones
are dashed. Every cell's name and tooltip say its state in words, and the summary says what the row adds up to
("2 failures in 90 days"). The whole cell answers the pointer, also where its shape is low. Below 480px of row the
gap closes to 1px, so 90 cells fit a phone.

### Options

On the tracker or any ancestor; each is computed in this component's own rules ([options.md](options.md)).

| Option | Classes | Applies to | Effect |
|---|---|---|---|
| Size | `.ds-xs` ... `.ds-xl` | the row | 4px per step (24px to 40px; 32px at md) |
| Density | `.ds-density-*` | the tracker | the gap between head, row and axis 1px per step |
| Shape | `.ds-shape-*` | the cells | their corners times `--ds-shape` |
| Tone | | | not read: the state classes carry the meaning, each with its shape |
| Touch | | | not read: the row is one tab stop, and a tap on a cell shows its tooltip |

### Behaviour: `data-ds-tracker`

On the row: the arrow keys, Home and End move focus between the cells, which are one tab stop (it starts on the last
cell, the most recent); a focused cell shows its tooltip at once. A cell with a `data-tip` and no `aria-label` gets the
tip as its name, and `role="img"` when it has no role. A re-render with `DS.dom.morphHtml` keeps both.

### JS API

- `DS.tracker.create(el)`: the controller the attribute path makes, on the row. `get()` gives
  `{ cells: [{ state, label }], counts }`; `set(list)` renders the cells from `[{ state, label }]` (state `success`,
  `info`, `warning`, `error` or `empty`), reusing the cells in order so focus stays (when the focused cell is one that
  goes, focus and the tab stop move to the nearest cell that stays), and emits `ds:change` with
  `{ cells, counts }`; `on('change', fn)`; `update()` names the cells again; `destroy()` lets go of the keys.
- `DS.tracker.counts(cells)`: how many of each state, and `total`, from states or `{ state }` objects: the figures of
  the summary, which stays the page's words.

### Accessibility

The row is a named group of `role="img"` cells, each named with its date and state ("Nov 4: down 42 min"). A screen
reader meets the summary first, then may walk the cells with the arrow keys. The legend repeats the states for the eye
and is `aria-hidden="true"`. A state that changes while the page is open is announced by the page
(`DS.a11y.announce`), not by the tracker.

### Forced colours

The cells are `CanvasText` with their shapes (the dashed ones cut with `Canvas`), the empty stub `GrayText`, the focus
ring `Highlight`. Printed, the cells keep their colours.

### Hooks

`--ds-tracker-height`, `--ds-tracker-gap`: see [theming.md](theming.md).

**Motion:** none: a cell that changes state takes its new shape at once. The focus ring snaps as everywhere.

<!-- changelog -->
- Tracker (new, `tracker`): `.ds-tracker` with `__head`, `__label`, `__summary`, `__cells`, `__cell` (`--success`,
  `--info`, `--warning`, `--error`, `--empty`, each with its own shape), `__axis` and `__legend`; `data-ds-tracker`
  makes the row one tab stop with the arrow keys; `DS.tracker.create`, `counts`; hooks `--ds-tracker-height`,
  `--ds-tracker-gap`.
