## Suggestions

Follow-up prompts as a row of action chips, under a reply or over the composer: one row that scrolls sideways and a
mouse can drag, or chips that wrap. A press fills (or sends) the composer.

```html
<div class="ds-suggestions ds-scroll-x" role="group" aria-label="Suggested questions"
  data-ds-suggestions data-ds-suggestions-for="composer-1">
  <button class="ds-chip" type="button" data-value="Show the battery report of laptop 4">
    <span class="ds-chip__body">[icon sparkles 18 ds-chip__icon]<span class="ds-chip__label">Battery report</span></span></button>
  <button class="ds-chip" type="button"><span class="ds-chip__body"><span class="ds-chip__label">Open a ticket</span></span></button>
</div>
<form class="ds-composer" id="composer-1" data-ds-composer>...</form>
```

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Variant | default (add `.ds-scroll-x`), `.ds-suggestions--wrap` | the row | one row that scrolls sideways, with the thin scrollbar and the end fades of the [horizontal scroller](#horizontal-scroller); or the chips wrap onto more lines (then leave `.ds-scroll-x` out) |
| Size, density, shape, touch, tone | the option classes | the row or any ancestor | reach the chips ([chip](#chips)); the row's gap takes 2px less per density step (`--ds-suggestions-gap`) |

**Behaviour.** `data-ds-suggestions` attaches `DS.suggestions` on `DS.init()`:

- A press on a chip (a button or link of the row that is not blocked) dispatches the cancelable `ds:select`
  (`{ value, label, chip }`): `value` is the chip's `data-value`, else its label. With
  `data-ds-suggestions-for="<id>"` the value goes into that [composer](#composer)'s field, with the focus; with
  `data-ds-suggestions-send` as well it is sent at once. `preventDefault()` on `ds:select` leaves the composer alone.
- **Drag to scroll**: a mouse or pen pressed on the row and moved more than 4px sideways scrolls it with the pointer
  (`data-state="dragging"`: the grabbing cursor, no press on the chips), and the click that ends the drag presses
  nothing. Touch scrolls natively; the keyboard brings each chip into view as Tab reaches it.
- `DS.dom.scrollEdges()` writes `data-ds-overflow-start` and `data-ds-overflow-end`: the fades of `.ds-scroll-x` and
  the grab cursor (fine pointers) follow them.

```js
const row = DS.suggestions.create(el);      // or DS.core.get(el, 'suggestions'): the same controller
row.set(['Battery report', { value: 'Open a ticket for laptop 4', label: 'Open a ticket', icon: DS.icons.ticket }]);
row.on('select', ({ value }) => ask(value));
row.get();                                  // [{ value, label }, ...]
DS.suggestions.items(['Battery report']);   // [{ value: 'Battery report', label: 'Battery report', icon: null }]
```

`DS.suggestions.create(el)` returns the controller: `get()`, `set(items)` (new chips from texts or
`{ value, label, icon }`, `icon` a glyph of `DS.icons`), `on('select', fn)` (the unsubscribe) and `destroy()`.
`DS.suggestions.items(list)` normalises a list the way `set()` reads it.

**Accessibility.** The row is a named `role="group"` of buttons; Tab goes from chip to chip and each scrolls into view
clear of the fades. A chip's label is what it asks; a longer value goes in `data-value`. Remove the row (or replace its
chips) once the conversation moved on.

**Forced colours.** The chips keep their edges ([chip](#chips)); the fades are a mask and stay.

**Hooks**: `--ds-suggestions-gap` (`--ds-space-2`) ([theming.md](theming.md#component-hooks)).

**Motion.** None of its own: a drag follows the pointer one to one.
