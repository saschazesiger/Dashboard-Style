## Popover

A small panel next to the control that opened it: a filter form, a share box, the details of a value. It is
non-modal: the page stays usable, and a press outside it, Escape or focus leaving it close it.

```html
<button class="ds-btn" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="share"
        data-ds-popover="#share">[icon share 16]Share</button>
<div class="ds-popover ds-popover--arrow" id="share" role="dialog" aria-labelledby="share-title" hidden>
  <div class="ds-popover__head">
    <h2 class="ds-popover__title" id="share-title">Share LAPTOP-0042</h2>
    <button class="ds-btn ds-btn--quiet ds-btn--icon ds-popover__close" type="button" aria-label="Close" data-ds-close>[icon close 20]</button>
  </div>
  <div class="ds-popover__body">
    <div class="ds-field"><label class="ds-field__label" for="share-to">Send to</label><input class="ds-input" id="share-to" type="email"></div>
  </div>
  <div class="ds-popover__foot">
    <button class="ds-btn ds-btn--text" type="button" data-ds-close>Cancel</button>
    <button class="ds-btn ds-btn--filled" type="button">Send</button>
  </div>
</div>
```

Put the popover right after its trigger in the markup: it shows in the top layer, but the Tab order follows the
markup, so its controls come next after the trigger. Inside a dialog or side sheet it goes inside that dialog.

### Options

| Option | Classes or attributes | Where it applies | Effect |
|---|---|---|---|
| Arrow | `.ds-popover--arrow` | the popover | a point on the edge that faces the anchor, at the anchor's centre (kept clear of the corners); the popover centres on its anchor by default |
| Help card | `.ds-popover--tip` | the popover | the card of a [toggletip](#toggletip), a rich tooltip and a hover card: at most `--ds-popover-tip-width` (320px) wide, tighter, its title in the label role and its text in the meta role |
| Placement | `data-ds-popover-placement="bottom \| top \| start \| end"` | the trigger | the side of the anchor (default `bottom`); it takes the other side when it does not fit there and that side has more room |
| Alignment | `data-ds-popover-align="start \| center \| end"` | the trigger | along that side (default `start`, `center` with an arrow); flips to the other edge when it would leave the viewport |
| Hover card | `data-ds-popover-trigger="hover"` | the trigger | opens on hover and keyboard focus instead of a click (below) |
| Density | `.ds-density-*` | the popover or any ancestor | the padding of its parts, 2px per step |
| Shape | `.ds-shape-*` | the popover or any ancestor | multiplies its radius (`--ds-popover-radius`) |
| Size, tone | none | | a popover holds the page's own content, which carries its own size; it shows no status |

### Behaviour

`data-ds-popover="<selector or id>"` on a trigger toggles the popover it names on a click (the second click of a
double click toggles nothing). `DS.init()` wires it; `DS.get(trigger, 'popover')` is its controller. By hand:

```js
DS.popover.open(popover, { opener: button, placement: 'top', align: 'center' });   // a Promise: the entrance settled
DS.popover.close(popover);
DS.popover.open(popover, { anchor: { x: event.clientX, y: event.clientY }, opener: chart });   // at a point
```

- **Placement** (`DS.position`): on the side asked for, aligned as asked, `--ds-space-2` inside the viewport, never
  taller than the room on its side (`.ds-popover__body` scrolls). It goes into the top layer as `popover="manual"`,
  so no scrolling or clipping box cuts it and it shows over a modal dialog; the script writes `--ds-popover-x`,
  `--ds-popover-y` and `--ds-popover-arrow`, sets `data-placement` (`top`, `start`, `end`; none below) and follows
  scrolling and resizing. One popover can serve several triggers: opened from another one, it moves there.
- **Focus.** Opening moves focus in: `[autofocus]`, else the first control that is no close button, else the close
  button, else the panel itself (`tabindex="-1"`, written while it shows). Tab past the last control closes it and
  moves on from the trigger; Shift+Tab before the first closes it onto the trigger. `open(el, { focus: false })`
  leaves focus where it is (a toggletip, a hover card).
- **Closing** goes through `DS.overlay`: Escape closes the topmost layer (a menu opened inside the popover first)
  and focus goes back to the trigger when it was inside; a pointerdown outside the popover, its trigger and the
  layers above it, and focus moving out of them close it and leave focus where it went; `[data-ds-close]` inside
  closes it; the trigger's `aria-expanded` follows (a trigger without one, such as a hover card's link, is left
  without it). `ds:open` and `ds:close` (`detail.reason`) bubble from it.
- **Hover card** (`data-ds-popover-trigger="hover"`, with `.ds-popover--tip`): a preview of a person or an object.
  A mouse or pen resting on the trigger opens it after `--ds-delay-tooltip`, keyboard focus at once; it never takes
  focus (Tab from the trigger reaches its links, since it follows the trigger in the markup), and it closes
  `--ds-delay-tooltip-skip` after the pointer and keyboard focus left the trigger and the card, so the pointer may
  cross onto it (WCAG 1.4.13). Touch has no hover: the trigger keeps its own action (a link opens its page), so the
  card adds, never hides, information.

```html
<a href="#user-ada" data-ds-popover="#card-ada" data-ds-popover-trigger="hover" aria-describedby="card-ada">Ada Lovelace</a>
<div class="ds-popover ds-popover--tip ds-popover--arrow" id="card-ada" role="group" aria-label="Ada Lovelace" hidden>…</div>
```

**JS API.** `js/popover.js` (`DS.popover`): `open(el, options)` (`opener`, `anchor`: an element or a point `{ x, y }`,
`placement`, `align`, `focus`, `returnTo`) places it and calls `DS.overlay.open()`; `close(el, options)` is
`DS.overlay.close()`; `create(el)` returns its controller (`get()`, `set(value, options)`, `on(type, fn)`,
`destroy()`), the one a `data-ds-popover` trigger makes for the popover it names.

### Accessibility

- A popover with controls is `role="dialog"` (non-modal: no `aria-modal`) with a name (`aria-labelledby` its title);
  its trigger has `aria-haspopup="dialog"`, `aria-expanded` (kept in step) and `aria-controls`.
- A hover card is `role="group"` with a name, and the trigger points `aria-describedby` at it, or the card only
  repeats what its target page says. Its trigger gets no `aria-expanded`: a link to a person is no disclosure.
- Keyboard: Enter or Space on the trigger opens it and moves focus in; Tab and Shift+Tab move through it and out of
  it (closing it); Escape closes it and focus goes back to the trigger.
- Forced colours: its transparent outline becomes its edge; the arrow goes.

### Hooks

`--ds-popover-width`, `--ds-popover-tip-width`, `--ds-popover-padding`, `--ds-popover-tip-padding`,
`--ds-popover-radius` ([theming.md](theming.md#component-hooks)).

**Motion:** as a menu, it grows out of its anchor (the arrow's tip): a fade over `--ds-dur-fast` while it grows from
`--ds-scale-popup` and its clip opens from the anchor's edge over `--ds-dur-medium` on `--ds-ease-spatial`; it leaves
with a fade over `--ds-dur-instant`, and a popover closed mid-way turns back from where it is. The "Popover" and
"Help card" rows of [Overlays](motion.md#overlays) in motion.md.
