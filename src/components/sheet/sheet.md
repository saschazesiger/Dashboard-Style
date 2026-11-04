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

### Keyboard, names and forced colours

- Keyboard: focus moves in at once (`autofocus`, else the first focusable element, else the panel); Tab stays inside;
  Escape closes it; a scrolling body with nothing focusable is a tab stop (`tabindex="0"`, an inset ring).
- Names and roles: `aria-labelledby` the title, on the native `<dialog>` or on the `role="dialog" aria-modal="true"`
  div. A subtitle that changes (a count) is `aria-live="polite"`.
- Forced colours: the panel's transparent outline becomes its edge.

### Hooks

`--ds-sheet-width`, `--ds-sheet-width-wide`, `--ds-sheet-padding`, `--ds-sheet-head-height`, `--ds-sheet-radius`,
`--ds-sheet-foot-border` ([theming.md](theming.md#component-hooks)). `data-ds-sheet` marks a sheet that
`DS.get(el, 'sheet')` serves.

**JS API.** `js/sheet.js` (`DS.sheet`): `open(el, options)` and `close(el, options)` are `DS.overlay.open()` and `close()`; `create(el)` returns the controller that `data-ds-sheet` makes (`get()`, `set(value, options)`, `on(type, fn)`, `destroy()`).

**Motion:** the "Scrim", "Side sheet" and "Side sheet on a phone" rows of [Overlays](motion.md#overlays) in motion.md.
