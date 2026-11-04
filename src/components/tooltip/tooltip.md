## Tooltip

A short text that names an icon button or explains a control, on hover and on focus.

```html
<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Copy link" data-tip="Copy link">[icon link 20]</button>
<td><a href="#device-42" data-tip="LAPTOP-0042-FINANCE-BACKUP">LAPTOP-0042-FINANCE-BACKUP</a></td>   <!-- shows only while cut off -->
<button class="ds-btn" type="button" data-tip="Search the list" data-tip-shortcut="Ctrl K">Search</button>   <!-- the shortcut slot -->
```

```js
const tips = DS.overlay.tooltips(document);   // one call per page (or per root element or shadow root); tips.destroy() undoes it
```

| Option | Where it applies | Effect |
|---|---|---|
| `data-tip-shortcut` | the trigger | the shortcut slot: `.ds-tooltip__shortcut` after the text, in the code face |
| `.ds-shape-*` | the theme | multiplies the radius (`--ds-tooltip-radius`) |
| Size, density, tone | none | one tooltip serves the whole theme, whatever its trigger's size, and it shows no status |

`tooltips(root)` serves every `[data-tip]` inside `root` with one `<div class="ds-tooltip" role="tooltip">` that it
creates inside the `.ds-theme` (it warns once when `root` has none). A second call on the same root returns the first
handle; a trigger inside nested roots (a host page's `document` and a widget's root) is served by the innermost one:

- **Delay.** A mouse or pen that rests on a trigger shows the tooltip after `--ds-delay-tooltip` (500ms); keyboard
  focus (`:focus-visible`) shows it at once.
- **On touch screens.** A tap on an image (`role="img"`, a status icon, an avatar) or a blocked control
  (`aria-disabled="true"`, so the reason reaches a finger) shows its tooltip at once; a second tap hides it. Any other
  trigger shows it after a long press of `--ds-delay-tooltip`, and the click and context menu that the press would
  end in never happen; a link keeps its own long press (the browser's menu). It stays until the next touch, a scroll
  or Escape: no timeout (WCAG 1.4.13). A press that moves more than 10px is a scroll, not a tap.
- **Repeats the visible text.** A tip that says what the trigger already shows (a name in a narrow column, with the
  full name as its tip) shows only while that text is cut off: the trigger, one of its first 24 descendants or one
  of up to three ancestors that hold just its text (the `td` around a link) clips it (`overflow` other than
  `visible` and more content than room). Such a tip never describes the trigger. A tip that adds something always
  shows: an icon button, a label hidden on phones (`.ds-sr`, `aria-hidden`, or a 1×1px box), a collapsed rail. No
  attribute is needed for either: plain `data-tip` decides by itself.
- **Warm-up.** While a tooltip is visible, or within `--ds-delay-tooltip-skip` (300ms) of the last hide, the next
  trigger shows at once: a visible tooltip swaps its text and place without leaving, a hidden one only fades in.
- **Hoverable and persistent** (WCAG 1.4.13). It hides `--ds-delay-tooltip-hide` (100ms) after the pointer or focus
  left the trigger; the pointer may cross onto the tooltip meanwhile, and it stays while the pointer is on it or the
  trigger keeps keyboard focus.
- **Dismissable.** Escape hides it, and only then is the key the tooltip's (an open dialog under it stays open),
  unless an open layer lies over its trigger (a menu over the toolbar whose button shows a tip): then the same Escape
  hides the tip and closes that layer (2.1.1). Any pointerdown, `DS.overlay.open()` and a trigger scrolled out of view
  hide it too; a trigger that leaves the document (a re-render, a closed message) takes its tooltip with it at once.
  The opener of an open layer (a menu button while its menu shows) shows no tip at all (2.1.1).
- **Description.** While it shows, the trigger gets `aria-describedby` pointing at it, unless the trigger's accessible
  name already says the same (an icon button whose `aria-label` equals the tip is not described twice).
- **Placement.** Below the trigger and centred on it, above it when there is no room, 8px from the viewport edges.
  Where popover and CSS anchor positioning exist, the tooltip is a `popover="manual"` in the top layer, anchored to
  the trigger (`data-anchored`); elsewhere the script writes `--ds-tooltip-x` and `--ds-tooltip-y` and sets
  `data-placement="top"` above. It fades in and grows from `--ds-scale-tooltip` at the side of the trigger, and
  leaves with a quick fade.
- On a [switch](#switch) the `data-tip` goes on its input, which covers the track.

Placing a `.ds-tooltip` yourself: set `--ds-tooltip-x` and `--ds-tooltip-y` (or `top` and `left`) on it, remove
`hidden` (the entrance plays) and hide it with `DS.motion.leave(tip, '', { then: 'hide' })`. A `transform` placement
composes with the entrance, but its scale shrinks the offset too, so the tooltip drifts in by (1 - scale) × offset;
a script that keeps a `transform: translate(Xpx, Ypx)` also sets `transform-origin: calc(50% + Xpx) calc(50% + Ypx)`.

- **Keyboard and names.** Keyboard focus shows it at once, Escape hides it; it never takes focus. The element is
  `role="tooltip"`, and the trigger's `aria-describedby` points at it while it shows, as above.
- **Forced colours.** Its transparent outline becomes its edge.

**JS API.** `js/tooltip.js` (`DS.tooltip`): `tooltips(root)`, the same function as `DS.overlay.tooltips()`; `DS.init()` serves every root it initialises.

**Motion:** the "Tooltip" and "Tooltip warm-up" rows of [Overlays](motion.md#overlays) in motion.md.

<!-- changelog -->
- Tooltip (3.0): behaviour in `js/tooltip.js` (`DS.tooltip`), `DS.overlay.tooltips()` keeps its name. `data-tip-shortcut`
  and `.ds-tooltip__shortcut`; shape on the radius, hook `--ds-tooltip-radius`. Placement in `js/position.js`.

