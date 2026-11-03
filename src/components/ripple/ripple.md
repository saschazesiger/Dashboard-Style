## Ripple

A press on an action grows a circle of the content colour from the pointer (Enter or Space: from the centre) and
fades it when the press ends. One call wires every action on the page, also the ones rendered later:

```js
const ripples = DS.ripple.attach(document);   // <html> gets .ds-ripples; ripples.destroy() takes it back
ripples.release(host);                        // end a running press by hand (no argument: every press)
```

```html
<button class="ds-btn" type="button">Export</button>           <!-- a host: nothing to add -->
<div class="x-row" data-ds-ripple tabindex="0">...</div>        <!-- any element becomes a host -->
<nav data-ds-ripple="off">...</nav>                              <!-- no ripples inside -->
```

- Hosts (`DS.ripple.RIPPLE_HOSTS`): `.ds-btn`, `.ds-chip` (the ripple goes into `.ds-chip__body`),
  `.ds-segmented__option`, `.ds-drawer__item`, `:is(button, a).ds-tile`, `.ds-card--interactive` (also the `<div>`
  form), `.ds-table__sort`, the body rows of `.ds-table--interactive` (the ripple goes into the row's first cell, a
  `<td>` or a `<th scope="row">` row header, as a box over the whole row that clips the circle; the row is isolated meanwhile, so the ripple paints under the
  cells' content), `.ds-radio` (a radio card, also when its own input is pressed), `.ds-combo__toggle`,
  `.ds-menu__item`, `.ds-errors summary`, `.ds-pressable` ([Utilities](#a-pressable-element-of-your-own)) and
  `[data-ds-ripple]`; Enter on a `.ds-table__row-link` or
  `.ds-card__action` ripples its row or card from the centre, while a press on another link or control inside the
  row or `<div>` card (a plain link, a field, a label) is that control's own and ripples neither;
  `data-ds-ripple="off"` on a host or an ancestor opts out. Not hosts, by design: inline links (`.ds-link-btn`,
  links in text), the switch, `.ds-check` rows and checkbox or radio inputs (their halo is the press), combobox
  options (pointer-down selects and closes the list; the state layer is the feedback), native field parts, the brand
  link (`.ds-brand`: the home link in the top bar is identity, not a control, so like a link in text it has no state
  layer, ripple or morph) and the skip link (`.ds-skip`: keyboard-only, shown while focused; its focus ring is the
  feedback). Under `.ds-ripples` each host is positioned, and clipped and isolated while a ripple is inside
  (zero specificity, so a host's own `position` wins; at rest a host looks as without `.ds-ripples`). Disabled, `aria-disabled`, `aria-busy` and `.ds-btn--done` hosts (a chip or radio card
  whose input is disabled, also by its `<fieldset>`, or `.ds-radio--disabled`) get no ripple, and neither does a press with a pointer button other than the primary one (a right or middle click) or from a non-primary pointer (a second finger).
- The ripple is `<span class="ds-press-ripple" aria-hidden="true" data-ds-keep>` with the runtime properties
  `--ds-ripple-x`, `--ds-ripple-y` (its centre) and `--ds-ripple-r` (the distance to the farthest corner). It
  grows on `ds-press-ripple` over `--ds-dur-medium` (an effect: no overshoot), gets `.ds-press-ripple--out` on
  release (not before `--ds-dur-instant` after the press) and is removed once that fade settled. The host carries
  `.ds-pressed` from press to release, at least `--ds-dur-instant`, so a quick click shows the whole press.
- The flat state layer and the ripple never stack: under `.ds-ripples` a pressed host keeps its hover layer (0 on
  touch screens), or its focus layer when a key pressed it, and the ripple adds the press. A button's layer also keeps what `--ds-btn-state-pressed-opacity`
  asks for beyond the ripple's `--ds-state-pressed`, so `.ds-btn--disc` shows its disc on press on touch screens
  too. Without `attach()` the flat layer stays the press feedback.
- A press ends early when another element captures the pointer (an ancestor that drags to scroll): the ripple
  fades as on release. `release(host?)` ends one by hand; `detach()` is the **deprecated** alias of `destroy()`
  (removed in 3.0 at the earliest). `:active` (the flat layer and the morph) lasts until the pointer button goes up.
- Colour: `--ds-ripple-color` (default `currentColor`), on `.ds-theme` or a host. Forced colours show no ripple.
- iOS Safari applies `:active` only on pages that listen to `touchstart`. `attach()` adds a passive listener; a
  page without `ds.js` adds one itself (`document.addEventListener('touchstart', () => {}, { passive: true })`, or
  `ontouchstart=""` on `<body>` where the Content-Security-Policy allows inline handlers), otherwise iOS shows no
  press feedback.

**Motion:** the press rows of [Controls](motion.md#controls) in motion.md.

