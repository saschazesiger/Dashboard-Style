## Toggletip

An info button "i" next to a field label, a heading or a figure that opens a help card on a click or a tap: a title,
a text and a link. Unlike a [tooltip](#tooltip) it never opens on hover, it works on touch, its card may hold a link,
and a screen reader hears its text when it opens.

```html
<div class="ds-field">
  <label class="ds-field__label" for="serial">Serial number</label>
  <button class="ds-toggletip" type="button" aria-label="About the serial number" aria-expanded="false"
          aria-controls="serial-help" data-ds-toggletip="#serial-help">[icon info 16]</button>
  <div class="ds-popover ds-popover--tip ds-popover--arrow" id="serial-help" role="group" aria-label="Serial number" hidden>
    <div class="ds-popover__head"><h3 class="ds-popover__title">Serial number</h3></div>
    <div class="ds-popover__body"><p>On the sticker under the device: 8 to 12 letters and digits.</p></div>
    <div class="ds-popover__foot"><a class="ds-link-btn" href="#help-serial">Where to find it</a></div>
  </div>
  <input class="ds-input" id="serial" type="text">
</div>
```

In a `.ds-field` the label and the button share the first row when the button comes right after the label; the card
(hidden, then in the top layer) takes no room. Anywhere else the button sits inline, centred on the line:

```html
<h2>Uptime <button class="ds-toggletip" type="button" aria-label="About uptime" aria-expanded="false"
                   aria-controls="uptime-help" data-ds-toggletip="#uptime-help">[icon info 16]</button></h2>
<div class="ds-popover ds-popover--tip ds-popover--arrow" id="uptime-help" role="group" aria-label="Uptime" hidden>…</div>
```

### Options

| Option | Classes or attributes | Where it applies | Effect |
|---|---|---|---|
| Size | `.ds-xs` ... `.ds-xl` | the button or any ancestor | the button, 4px per step from `--ds-toggletip-size` (24px), and its glyph with it; density leaves it (an icon-only control) |
| Touch | `.ds-touch` | the button or any ancestor | its hit area grows to `--ds-touch-target` around the glyph, without moving the label |
| Shape | `.ds-shape-*` | the button or any ancestor | multiplies its radius: a circle at the default, a rounded square at `soft`, a square at `square` |
| Placement | `data-ds-toggletip-placement="bottom \| top \| start \| end"` | the button | the card's side (default `bottom`), flipped when there is no room |
| Card | `.ds-popover--tip`, `.ds-popover--arrow` | the card | the [popover](#popover)'s help card and its arrow |
| Tone | none | | it explains, it shows no status |

### Behaviour

`data-ds-toggletip="<selector or id>"` names the card; empty (`data-ds-toggletip`), the card is the button's next
sibling `.ds-popover`. `DS.init()` wires it; `DS.get(button, 'toggletip')` is its controller.

- **Opens** on a click, a tap, Enter or Space; again, it closes. Focus stays on the button, and the card follows it in
  the markup, so the next Tab reaches its link.
- **Announced.** Opening says the card's text politely (`DS.a11y.announce()`), and the button's `aria-expanded` turns
  `true` (`DS.overlay`), so a screen reader hears both the state and the help.
- **Closes** on Escape (focus stays on the button), a press outside button and card, focus that moves out of both, or
  a second click. Through `DS.popover` and `DS.overlay`: placement, the top layer and the stack are theirs.
- A button without a name gets the system's string `moreInfo` ("More information") as its `aria-label`; name it after
  what it explains instead ("About the serial number").

**JS API.** `js/toggletip.js` (`DS.toggletip`): `create(el)` returns the controller of a toggletip button (`get()`,
`set(value)`, `on(type, fn)`, `destroy()`), the one `data-ds-toggletip` makes. Its `ds:change` (`detail: { open, card }`)
tells that the card opened; `on('open' | 'close', fn)` hears the card's own events.

### Accessibility

- The button is a `<button type="button">` with a name and `aria-expanded`; `aria-controls` points at its card.
- The card is `role="group"` with a name (or `role="note"`); its text is announced when it opens, so it needs no live
  region of its own.
- Forced colours: an open button is `Highlight` on `HighlightText` (an open disclosure button), a disabled one
  `GrayText`; the card keeps the popover's edge.

### Hooks

`--ds-toggletip-size` ([theming.md](theming.md#component-hooks)); the card's are the popover's.

**Motion:** the card is a popover: it grows out of the button (the arrow's tip) and leaves with a fade. The button
morphs on press like every pill.

<!-- changelog
- Toggletip (`.ds-toggletip`, `js/toggletip.js`, `DS.toggletip`): the info button that opens a help card
  (`.ds-popover--tip`) on a click or a tap and announces its text; sits on the label row of a `.ds-field`. Hook
  `--ds-toggletip-size`. New string `moreInfo` ("More information").
-->
