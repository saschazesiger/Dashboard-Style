## Indicator

One pill behind the items of a track that glides to the active item, instead of each item painting its own background.
The segmented switch, the tabs, the drawer list and radio tiles use it; any project track can.

```html
<nav class="ds-segmented" aria-label="Mode"
     data-ds-indicator='[aria-current="true"]' data-ds-indicator-class="ds-segmented__indicator">
  <a class="ds-segmented__option" href="/live" aria-current="true" data-label="Live">Live</a>
  <a class="ds-segmented__option" href="/admin" data-label="Admin">Admin</a>
</nav>
```

```js
const pill = DS.indicator.create(track, { active: '[aria-pressed="true"]', className: 'x-pill' });
pill.update();    // only needed with observe: false
pill.destroy();
```

- `DS.init()` makes one for every `[data-ds-indicator]`: its value is the selector of the active item (empty: any item
  that says it is the current one, by `aria-current`, `aria-pressed`, `aria-selected` or `aria-checked`).
  `data-ds-indicator-class`, `data-ds-indicator-name` and `data-ds-indicator-reveal` are the options `className`,
  `name` and `reveal` of `DS.indicator.create`. A change of one of them replaces the pill.
  `DS.core.get(track, 'indicator')` returns its controller.
- `DS.indicator.create(track, options)` inserts `<span class="ds-indicator" aria-hidden="true" data-ds-keep>` and
  `.ds-has-indicator` on the track; one pill per track. `createIndicator` is its 2.x name, **deprecated**: an alias
  until 3.0 ships. `OVERSHOOT`, what it does when, and every option: [DS.indicator](motion.md#dsindicator-jsindicatorjs) in motion.md.
- The page moves the active item by its attribute; the pill follows by itself. A track of `.ds-btn` toggles works as
  it is: under `.ds-has-indicator` a pressed button drops its own tint, so only the pill paints the selection.

### Options

The pill has no size of its own: it measures the active item. So the options act on the items, and it follows them.

| Option | Classes | Where it applies | Effect on the pill |
|---|---|---|---|
| size | `.ds-xs` ... `.ds-xl` | on the track, an item or an ancestor | follows the item's box at once (a resize places it without a glide) |
| density | `.ds-density-*` | on the track, an item or an ancestor | the same |
| touch | `.ds-touch` | on the track, an item or an ancestor | the same: the item's larger box |
| shape | `.ds-shape-*` | on the track or an ancestor | a component's class computes `--ds-indicator-radius` with `--ds-shape` in its own rule, and the pill takes that as it is. A project class's plain `border-radius` is copied into it (at most half the item's smaller side) with `--ds-shape` as a live factor: `.ds-shape-square` squares the pill at once |
| tone | none | | the pill shows a choice, no status: no tone |

Its look is up to the component: `background`, and `--ds-indicator-radius` or `border-radius` for its corners.

### Keyboard and names

The pill is `aria-hidden` and takes no focus and no pointer. The selection is on the item (`aria-current`,
`aria-pressed`, `aria-selected`, `aria-checked`), never on the pill alone; keyboard use is the track's
(`DS.dom.roving()` on a toggle group or tab list: the arrow keys, Home and End).

### Forced colours

The pill is gone (`display: none`, also for a project class): the items show the selection by the system colours of
their own component.

### State

`data-glide` (a glide runs), `data-dir` (`left`, `right`, `up`, `down`: the travel) and `data-empty` (no active item) are
written by the script on the span. `.ds-indicator--instant` places it without a glide; the script sets it around a
placement, and a page may set it on a pill of its own.

### Hooks

`--ds-indicator-radius` (its corners, set by a component's class; registered, so it springs) and the motion hook
`--ds-indicator-lag`, which themes never set: [DS.indicator](motion.md#dsindicator-jsindicatorjs) in motion.md.

**Motion:** the indicator row of [Navigation](motion.md#navigation) in motion.md, and "Indicator" in the Motion Lab.

<!-- changelog -->
- Indicator on the options model: the pill follows the item at any size, density and touch target; a project class's
  `border-radius` is copied with `--ds-shape` as a live factor and again at each rest, so it follows a size change too.
- New: `DS.indicator.create()` (`createIndicator()` is its deprecated alias until 3.0 ships) and the declarative
  `data-ds-indicator`, with `data-ds-indicator-class`, `-name` and `-reveal`.
- Forced colours hide every pill, also a project class's, not only the system's.
