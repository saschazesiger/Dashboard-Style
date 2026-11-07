## Bottom sheet

A panel that rises from the bottom edge, for a phone first (filters, the details of a row, a short choice), with a
drag handle, heights it rests at (detents) and a drag to dismiss. It is a modal [side sheet](#side-sheet) laid out at
the bottom at every width: the whole width on a phone, at most 640px and centred on a wider screen.

```html
<button class="ds-btn" type="button" data-ds-open="#filters" aria-haspopup="dialog" aria-expanded="false">Filters</button>

<dialog class="ds-sheet ds-bottomsheet" id="filters" aria-labelledby="filters-title" data-ds-bottomsheet data-ds-bottomsheet-detents="0.5 1">
  <div class="ds-sheet__backdrop" data-ds-close></div>
  <section class="ds-sheet__panel ds-bottomsheet__panel">
    <button class="ds-bottomsheet__handle" type="button" aria-label="Resize the sheet"></button>
    <div class="ds-sheet__head">
      <h2 class="ds-sheet__title" id="filters-title">Filters</h2>
      <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Close" data-ds-close>[icon close 20]</button>
    </div>
    <div class="ds-sheet__body" tabindex="0"> ... </div>
    <div class="ds-sheet__foot"> ... </div>
  </section>
</dialog>
```

The div markup works as for the side sheet (`<div class="ds-sheet ds-bottomsheet" role="dialog" aria-modal="true"
aria-labelledby="..." hidden>`). Head, body and foot are the side sheet's parts.

### Options

| Option | Attribute, classes | Where it applies | Effect |
|---|---|---|---|
| Detents | `data-ds-bottomsheet-detents="0.5 1"` | the sheet | the heights it rests at, as fractions of its full height (the window less `--ds-bottomsheet-gap`); it opens at the smallest. Without the attribute it is as tall as its content (at most the full height) and rests fully up |
| Width | `--ds-bottomsheet-width` | the sheet | at most 640px, centred; the whole width on a phone |
| Density | `.ds-density-*` | the sheet or any ancestor | as the side sheet: the padding of head, body and foot, the head's height |
| Shape | `.ds-shape-*` | the sheet or any ancestor | multiplies the radius of the top corners (`--ds-bottomsheet-radius`) |
| Size, touch | `.ds-sm` ..., `.ds-touch` | the sheet or any ancestor | reach the controls inside; the handle is at least the touch target |

There is no tone.

### Behaviour

`data-ds-bottomsheet` (`DS.init()`) or `DS.bottomsheet.create(el)`; open and close it with `data-ds-open` and
`data-ds-close`, `DS.overlay.open()` and `close()`, or `DS.bottomsheet.open(el, { opener, detent })` (at that detent).

- **Modal.** Through `DS.overlay`: the page is inert, the scroll locked, focus moves in (the handle, unless a control
  has `autofocus`), Escape closes it, focus goes back to the opener.
- **Detents.** The panel is as tall as its full height and rests lower by `--ds-bottomsheet-offset` (a runtime property
  of the panel, never set it), so each detent shows its share; the part below the window is padding
  (`--ds-bottomsheet-rest`, runtime too), so the foot sits at the window's edge and the body scrolls within what shows
  at every detent; `data-detents` on the sheet says it has them. A change
  springs there, says "Sheet at 50 percent of the screen" politely and sends `ds:detent` (`{ detent, index }`). A
  change of the attribute takes effect at once.
- **Drag.** A pointer on the handle or on the head (not on a control in it) drags the panel: it follows the finger
  (`data-dragging` holds its transition; the named motion exception of the bottom sheet), never above its full height.
  On release the throw (the speed of the last moves, projected over `--ds-dur-medium`) picks the nearest detent; thrown
  below half of the smallest detent the sheet closes, with reason `drag`. A press without a move is a click.
- **The handle** is a button: a click, Enter or Space go to the next detent (from the largest back to the smallest),
  ArrowUp and ArrowDown to the larger and the smaller one. With one detent it does nothing but take focus; the drag
  still dismisses.
- **Above the keyboard.** With `DS.dom.followViewport()` the full height ends above the on-screen keyboard.

**JS API.** `js/bottomsheet.js` (`DS.bottomsheet`): `open(el, { opener, detent, returnTo })` and `close(el, { reason })`
are `DS.overlay.open()` and `close()` (at a detent); `create(el)` returns the controller that `data-ds-bottomsheet` makes:
`get()` (`{ open, detent, index }`), `set(true | false)`, `set(detent)` or `set({ index })`, `on(type, fn)` (`detent`,
`open`, `close`), `want(index)` (the detent of the next open) and `destroy()`; `parseDetents(value)` and
`settleDetent(detents, shown, velocity, projection)` are its arithmetic.

### Keyboard, names and forced colours

- Keyboard: focus moves in and Tab stays inside; on the handle, Enter, Space, ArrowUp and ArrowDown change the height;
  Escape closes.
- Names and roles: the sheet is a dialog named by its title; the handle is a button with a name (the string
  `resizeSheet` when it has none of its own); a height change is said.
- Forced colours: the panel keeps the side sheet's edge; the handle's pill is `CanvasText`, `Highlight` while it has
  focus or drags.

### Hooks

`--ds-bottomsheet-width`, `--ds-bottomsheet-gap`, `--ds-bottomsheet-radius` ([theming.md](theming.md#component-hooks)),
and the side sheet's.

**Motion:** the scrim fades while the panel rises its full height on the spatial spring over `--ds-dur-long` (a strip
of its own background below it covers the overshoot); a detent change springs there over `--ds-dur-long`; a drag
follows the finger, the named exception of conventions section 8; it drops back down in `--ds-dur-base`, accelerating.
By hand (no `data-state`): `ds-lift-in`, and `ds-drop-out` its full height with `ds-fade-out`.
