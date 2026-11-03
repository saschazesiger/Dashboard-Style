## Tiles

```html
<div class="ds-tiles">
  <div class="ds-tile">
    <p class="ds-tile__label">[icon alert 16]<span>Overdue</span></p>
    <p class="ds-tile__value">12</p>
    <p class="ds-tile__note">3 more than last week</p>
  </div>
  ... (as many per row as fit at 176px, at most four)
</div>
```

The row fills its container, whatever it is (a page, a dialog, a side sheet, beside the drawer): as many tiles per row
as fit at `--ds-tile-min-width` (176px), never more than `--ds-tiles-columns` (4), each row filled. `.ds-tiles--3`
caps the row at three. On a phone the default gives one tile per row, so a long value fits whole;
`--ds-tile-min-width: 128px` on the `.ds-tiles` or in the theme keeps two per row down to a 360px phone. A single figure that opens a list is one `a.ds-tile`, also outside `.ds-tiles`.

`DS.motion.countUp()` never takes the target from the markup. It counts from the figure it last wrote (or one a
re-render wrote since, read back through `format`), and on its first call from 0. So keep the raw value in your own
state (the styleguide demo keeps it in a data attribute of its own), and pass `{ from: <the value in the markup> }`
on the first update of a tile rendered with its figure if it should count on rather than from 0.

The value never takes a colour and never wraps (it shrinks on narrow tiles; a value still too wide ends in an
ellipsis, the last resort: shorten figures, put the full value in `data-tip`). A missing value takes
`.ds-tile__value--empty` (`<p class="ds-tile__value ds-tile__value--empty">No data</p>`): `--ds-text-2` in the display
font. Every new value goes through
`DS.motion.countUp(el, next)`: it counts from the figure it shows (the last value it wrote, or one a re-render wrote since that reads back
through `format`; from 0 the first time) on `--ds-ease-value` over
`--ds-dur-glide`, so a refresh counts on from the old value, a new value mid-count retargets from where the figure
is, the same value changes nothing, and assistive technology gets the final value. A meter or progress bar set in
the same task lands on the same frame. The note changes at once
([motion.md](motion.md#data-motion)).

```js
DS.motion.countUp(value, synced);
bar.style.setProperty('--ds-progress', String(synced / total));   // same task: they land together
note.textContent = `${failed} failed`;                             // at once
```

A tile that opens something is a `<button class="ds-tile">` or `<a class="ds-tile">` with `<span>`s instead of the
`<p>`s: a 6% state layer, the focus ring, the ripple, and the press morph (16 to 12px, `--ds-tile-radius-pressed`,
springing back on release); no lift, no scale. A disabled or `aria-disabled="true"` tile shows no hover or press
layer and does not morph; an `aria-disabled` tile keeps its focus layer (forced colours: `GrayText`).

Filter by a figure: a clickable tile that is a toggle (`aria-pressed`, or `aria-checked` / `aria-selected` in a group
of that role):

```html
<div class="ds-tiles" role="group" aria-label="Filter devices">
  <button class="ds-tile" type="button" aria-pressed="true">
    <span class="ds-tile__label">[icon check 16]<span>Overdue</span></span>
    <span class="ds-tile__value">12</span>
  </button>
  <button class="ds-tile" type="button" aria-pressed="false">
    <span class="ds-tile__label"><span>In repair</span></span>
    <span class="ds-tile__value">3</span>
  </button>
</div>
```

Selected, the tile takes `--ds-tile-selected-bg` (`--ds-accent`) with `--ds-on-accent` ink and a static inset ring
(`--ds-selected-ring`, `--ds-primary`, at `--ds-focus-width`), so the focus ring stays free and both read at once.
Colours on `--ds-dur-fast`, the ring at once; add a check or the label weight, never the tint alone. Forced colours:
`Highlight` / `HighlightText`. A short tile is never split across printed pages.

**Motion:** the "Alert, tile, card" row of [Feedback](motion.md#feedback) (`countUp()`, the press morph) in motion.md.

