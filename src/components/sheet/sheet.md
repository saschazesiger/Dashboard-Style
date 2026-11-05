## Side sheet

Details or a form beside the page, in a panel that slides in from the side (from the bottom on phones).

Native markup (preferred), or the same tree in `<div class="ds-sheet" role="dialog" aria-modal="true"
aria-labelledby="sheet-title" hidden>`:

```html
<dialog class="ds-sheet" aria-labelledby="sheet-title">
  <div class="ds-sheet__backdrop" data-ds-close></div>
  <section class="ds-sheet__panel">                      <!-- ds-sheet__panel--wide: 720px -->
    <div class="ds-sheet__head">
      <h2 class="ds-sheet__title" id="sheet-title">LAPTOP-0042</h2>
      <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Close" data-ds-close>[icon close 20]</button>
    </div>
    <div class="ds-sheet__body" tabindex="0"> ... </div>
  </section>
</dialog>
```

The head can hold a subtitle under the title, and the sheet a foot with its actions (2.0):

```html
<div class="ds-sheet__head">
  <div class="ds-sheet__heading">
    <h2 class="ds-sheet__title" id="filter-title">Filters</h2>
    <p class="ds-sheet__subtitle" aria-live="polite">12 of 240 devices</p>
  </div>
  <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Close" data-ds-close>[icon close 20]</button>
</div>
<div class="ds-sheet__body" tabindex="0"> ... </div>
<div class="ds-sheet__foot">
  <p class="ds-meta">3 filters</p>
  <button class="ds-btn ds-btn--text" type="button">Reset</button>
  <button class="ds-btn ds-btn--filled" type="button" data-ds-close>Show 12 devices</button>
</div>
```

The title wraps (a long record name stays readable); `.ds-sheet__subtitle` is one line of meta type that ends in an
ellipsis (empty, it takes no room). `.ds-sheet__foot` sits after the body, its actions at the end and wrapping, above a
hairline (`--ds-sheet-foot-border`); a leading `.ds-meta` takes the start; it holds the safe area, so the body above it
ends with its normal gap; empty, it takes no room. The body is positioned (`offsetParent` of what is inside) and has a
thin scrollbar; a lone `.ds-btn` directly in it keeps its own width.

### Options

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Width | `.ds-sheet__panel--wide`, `--ds-sheet-width` | the panel | 720px instead of 560px; the whole width at 600px and below |
| Mode | the modal sheet (`.ds-sheet`), `.ds-sheet__panel--push`, `.ds-sheet__panel--inspector` | the panel | over the page with a scrim (overlay); beside the content, which narrows (push); beside a list that stays usable (inspector) ([below](#push-and-inspector)) |
| Resizable | `.ds-sheet__resize` in the panel, `data-ds-sheet-remember` | the panel | a separator on the panel's inner edge; the width is remembered ([below](#resizing)) |
| Density | `.ds-density-*` | the sheet or any ancestor | the padding of head, body and foot (2px per step), the head's height (4px per step) |
| Shape | `.ds-shape-*` | the sheet or any ancestor | multiplies the radius of the panel's leading corners |
| Size, touch | `.ds-sm` ..., `.ds-touch` | the sheet or any ancestor | reach the controls inside; the panel itself keeps its size |

There is no tone: a sheet shows no meaning of its own.

### Behaviour

Open and close it like the dialog, with `DS.overlay.open(sheet, { opener })` and `DS.overlay.close(sheet)`, or with
`data-ds-open="#id"` on a button and `data-ds-close` inside it. The panel
is opaque throughout: it slides its full width in from the edge on the spatial spring (`--ds-dur-long`) while the
scrim fades, and goes back to the edge in `--ds-dur-base`, accelerating, without a fade. At 600px and below it rises
from the bottom and falls back down. A strip of the panel's background past its outer edge covers the spring's
overshoot, so the scrim never shows at the screen edge. By hand, close it like the dialog with `.ds-sheet--closing`
(`DS.motion.settled(panel)`, then hide and remove the class in one task): the panel lets clicks through while it
leaves, the backdrop swallows them until the sheet is hidden. The `hidden` attribute hides the div sheet without
`.ds-base` too. While the body is scrolled the panel carries `data-scrolled` (the head's hairline appears):
`DS.overlay.open()` watches the body with `DS.dom.watchScrolled(body)` on its first open (2.0; a sheet shown without
`DS.overlay` calls it once). It writes the attribute on the `.ds-sheet__panel`, and its sentinel takes no room
in the body (absolute at its padding edge) and stays through a record swap with `DS.dom.morphHtml(body, html)`. Where
scroll timelines exist the hairline follows the body's scroll by itself, over the first `--ds-space-2`: the body
names its timeline `--ds-sheet-scroll` and the panel scopes it to the head (progressive: `timeline-scope`). Use a
`<div>` for the head, not `<header>` (a second banner landmark). With `DS.dom.followViewport()` on the page the panel
ends above the on-screen keyboard (`--ds-keyboard-inset`, 2.1.1), so its foot and the field being typed in stay in
view; the scrim keeps covering the whole window.

**Another record in an open sheet** (previous and next, another row of the table): keep the sheet open and swap only
the body with `DS.dom.morphHtml` inside [`DS.motion.transition()`](motion.md#dsmotion-jsmotionjs):

```js
// type: 'forward' for the next record, 'back' for the previous, 'fade-through' for another row
DS.motion.transition(() => { DS.dom.morphHtml(body, html); return body; }, { type: 'forward' });

// The same record refreshed (polling, a save): never a transition, data does not replay an entrance.
DS.dom.morphHtml(body, html);
```

With View Transitions (and `.ds-theme` on `<html>`) the body of the open sheet is its own group, `ds-sheet-body`
(only an open modal sheet's body is named: one shown inline in a page stays in the page), and takes the view's
motion: fade-through, or shared axis X for `forward` and `back`; the head, the panel and the page under the scrim
stay still. Without them the body enters with `.ds-enter--swap`. Fetch the record first and call `transition()` with
the quick swap: the page is frozen while a View Transition runs.

**Container transform** (opt-in): `DS.overlay.open(sheet, { opener: row, container: true })` grows the row (or card)
into the panel instead of sliding it in from the edge ([DS.overlay](motion.md#dsoverlay-jsoverlayjs)); the same works
for a dialog. A row that its table's scroll wrapper clips (the row of a `.ds-table--wide` table wider than its wrapper, or one partly
under the top bar) gets the usual entrance instead: its group would paint the hidden part over the frame.

While its action runs (a save in the sheet's foot), `data-ds-busy` on the sheet keeps it open, as for the
[Dialog](#dialog); `ds:close` tells why it closed.

### Push and inspector

Next to the content instead of over it: a docked panel sits in a `.ds-sheet__layout`, after the `.ds-sheet__main` that
holds the page's content (a list, a table, a board). It has no scrim and no radius, a hairline (`--ds-sheet-docked-border`)
instead of the shadow, and `--ds-sheet-docked-width` (400px). Give the layout the height it should fill (the view of the
app frame, or a row of a grid); in a taller page the panel sticks in view.

```html
<div class="ds-sheet__layout">
  <div class="ds-sheet__main"> ... the list ... </div>
  <section class="ds-sheet__panel ds-sheet__panel--push" id="filters" aria-labelledby="filters-title" hidden>
    <div class="ds-sheet__head">
      <h2 class="ds-sheet__title" id="filters-title">Filters</h2>
      <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Close" data-ds-close>[icon close 20]</button>
    </div>
    <div class="ds-sheet__body"> ... </div>
  </section>
</div>
<button class="ds-btn" type="button" data-ds-open="#filters" aria-expanded="false" aria-controls="filters">Filters</button>
```

- **Push** (`.ds-sheet__panel--push`): opened from a button, the content beside it narrows while the panel's width
  opens from 0 over `--ds-dur-long` on `--ds-ease-out` (a size that pushes never overshoots); its parts keep their width
  and are uncovered from the inline end. It gives the width back in `--ds-dur-base` on `--ds-ease-exit`. Focus moves
  in once it opened (`autofocus`, else its first focusable control).
- **Inspector** (`.ds-sheet__panel--inspector`): the detail of the chosen row of a list or table, beside it. It opens
  like the push panel, but focus stays in the list, which stays usable: the arrow keys, the selection and the other
  rows' actions keep working. Choosing another row swaps the panel's content with `DS.dom.morphHtml` (no second
  entrance); a title that changes is said by an `aria-live="polite"` subtitle, or announce it with
  `DS.a11y.announce()`. Closing it gives focus back to the row only when focus was inside the panel.
- Both open and close through `DS.overlay.open(panel, { opener })` and `DS.overlay.close(panel)` (or `data-ds-open`,
  `data-ds-close`) as a non-modal layer: no trap, nothing inert, no scroll lock; Escape closes the top layer (a menu
  inside it first), and `aria-expanded` on an opener that carries it follows. `DS.init()` installs the focus move of the
  push panel and watches the body's scroll for the head's hairline (`data-scrolled`).
- Short of room (the layout under 720px, a container query) the panel lies over the main column with the overlay
  elevation; under 480px it takes the layout's whole width, without a separator.
- Use a `<section>` with `aria-labelledby` the title: a region with a name, which a screen reader lists among the
  landmarks. Never put the docked panel inside the `.ds-sheet` frame.

```js
table.addEventListener('click', (event) => {
  const row = event.target.closest('[data-ds-key]');
  if (!row) return;
  DS.dom.morphHtml(inspectorBody, detailHtml(row.dataset.dsKey));
  DS.overlay.open(inspector, { opener: row });     // already open: nothing moves
});
```

### Resizing

A `.ds-sheet__resize` as the first child of the panel makes it resizable, on the modal sheet (its left edge) and on a
docked panel (its inline start edge). `DS.init()` wires it on an element with `data-ds-sheet` (the sheet, or the
docked panel itself), or call `DS.sheet.resizable(panel, { remember })`.

```html
<section class="ds-sheet__panel ds-sheet__panel--inspector" id="device" aria-labelledby="device-title" hidden
         data-ds-sheet data-ds-sheet-remember="devices-inspector">
  <div class="ds-sheet__resize" aria-label="Resize the details"></div>
  ...
</section>
```

- It is a `role="separator"` with `aria-orientation="vertical"`, a tab stop, `aria-valuenow`, `aria-valuemin` and
  `aria-valuemax` (the width in pixels) and `aria-controls` the panel (written by the system; a name of the page's own
  in `aria-label`, else the string `resizePanel`).
- Pointer: the width follows the pointer (`data-resizing` on the panel holds its transitions); a double click goes back
  to the default width. Keyboard (the window splitter pattern): ArrowLeft and ArrowRight move the edge by
  `--ds-space-4` (with Shift four times that), Home and End go to the narrowest and the widest.
- The width is the runtime property `--ds-sheet-size` on the panel, between `data-ds-sheet-min` (280px) and
  `data-ds-sheet-max` (default: what leaves the page or the main column 280px), and is remembered through `DS.store`
  (namespace `sheet`) under `data-ds-sheet-remember`, so it comes back on the next visit. Without the attribute it
  holds until the page reloads. `ds:resize` (`{ width }`) follows a drag that ended and each key.
- The separator shows a pill on hover, focus and while it drags (`--ds-primary`); at 600px and below the modal sheet
  takes the whole width and has none. With `.ds-touch` its hit strip is the touch target wide.
- Forced colours: the pill is `CanvasText`, `Highlight` while focused or dragged.

### Keyboard, names and forced colours

- Keyboard: focus moves in at once (`autofocus`, else the first focusable element, else the panel); Tab stays inside;
  Escape closes it; a scrolling body with nothing focusable is a tab stop (`tabindex="0"`, an inset ring).
- Names and roles: `aria-labelledby` the title, on the native `<dialog>` or on the `role="dialog" aria-modal="true"`
  div. A subtitle that changes (a count) is `aria-live="polite"`.
- Forced colours: the panel's transparent outline becomes its edge.

### Hooks

`--ds-sheet-width`, `--ds-sheet-width-wide`, `--ds-sheet-padding`, `--ds-sheet-head-height`, `--ds-sheet-radius`,
`--ds-sheet-foot-border`, `--ds-sheet-docked-width`, `--ds-sheet-docked-border`
([theming.md](theming.md#component-hooks)). `data-ds-sheet` marks a sheet that
`DS.get(el, 'sheet')` serves.

**JS API.** `js/sheet.js` (`DS.sheet`): `open(el, options)` and `close(el, options)` are `DS.overlay.open()` and `close()`, for the modal sheet and the docked panels; `create(el)` returns the controller that `data-ds-sheet` makes (`get()`, `set(value, options)`, `on(type, fn)`, `destroy()`), resizable when the panel has a separator; `resizable(el, { remember, min, max })` returns the controller of the width (`get()` the width in px or `null` at the default, `set(px)`, `on('resize', fn)`, `destroy()`); `clampWidth(width, bounds)` and `dragWidth(start, delta, side, bounds)` are the arithmetic it uses, and `MIN_WIDTH` (280) its narrowest width.

**Motion:** the "Scrim", "Side sheet" and "Side sheet on a phone" rows of [Overlays](motion.md#overlays) in motion.md.
A docked panel opens its width over `--ds-dur-long` on `--ds-ease-out` and gives it back in `--ds-dur-base` on
`--ds-ease-exit`, through the registered `--ds-sheet-reveal` (0 to 1, internal: never set it); a drag follows the
pointer.

<!-- changelog
- Side sheet: docked panels in a `.ds-sheet__layout` beside its `.ds-sheet__main`, `.ds-sheet__panel--push` (the
  content narrows, focus moves in) and `.ds-sheet__panel--inspector` (beside a list that stays usable, focus stays in
  the list), non-modal layers of `DS.overlay`; resizing with `.ds-sheet__resize` (a separator: pointer and keys, the
  width remembered through `DS.store` under `data-ds-sheet-remember`, bounded by `data-ds-sheet-min` and `-max`,
  `ds:resize`), `DS.sheet.resizable()`, `clampWidth()`, `dragWidth()`, `MIN_WIDTH`; hooks `--ds-sheet-docked-width`
  and `--ds-sheet-docked-border`; string `resizePanel`.
-->
