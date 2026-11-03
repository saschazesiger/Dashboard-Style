## Horizontal scroller

```html
<div class="ds-scroll-x" tabindex="0" role="region" aria-label="Months">   <!-- the tab stop: only when nothing inside takes focus -->
  <div class="my-months">...</div>                                         <!-- content wider than the panel -->
</div>
```

- A strip wider than its panel (months, a row of cards, a wide chart) scrolls sideways on its own, with a thin
  scrollbar and room for the focus rings of its content. A fade at each end says that more follows: where scroll
  timelines exist (progressive) `ds-scroll-edge-start` and `ds-scroll-edge-end` run on its own scroll and drive the
  registered numbers `--ds-scroll-edge-start` and `--ds-scroll-edge-end` (0 to 1, times the fade length): the start
  fade grows while the first `--ds-space-8` scroll away, the end fade goes over the last, and a strip that fits fades
  nowhere. Elsewhere call `DS.dom.scrollEdges(strip)`: its `data-ds-overflow-start` and `data-ds-overflow-end` set
  the numbers over `--ds-dur-fast`; without it the strip shows no fade. The scrollbar strip stays unmasked
  (`--ds-scrollbar-height`, written by `scrollEdges()`). Left-to-right pages only.
- One fade switch: `--ds-scroll-fade` is the fade length of `.ds-scroll-x` (default `--ds-space-8`), the card table
  wrappers (default `--ds-card-pad`) and the cut edges of menus, combobox lists and drawer lists;
  `--ds-scroll-fade: 0px` on the theme turns them all off.
  Keyboard focus inside lands outside the fades (`scroll-padding-inline`).
- When nothing inside can take focus, the strip is the tab stop (`tabindex="0" role="region" aria-label`), as WebKit
  gives a scroller none by itself: arrow keys scroll it, its ring is inset and the fades drop while it is focused.
- Print: the strip shows all of its content, unmasked.

```html
<div class="my-log">                                                       <!-- a scroller -->
  ... messages ...
  <div class="ds-jump"><div class="ds-presence" hidden>
    <button class="ds-btn ds-btn--tonal ds-btn--icon" type="button" aria-label="Latest" data-tip="Latest">[icon arrowDown 20]</button>
  </div></div>
</div>
```

- `.ds-jump`, the last child of a scrolling log, is the place of a "Latest" pill: sticky `--ds-space-4` above the
  log's bottom edge, centred, taking no room, so the log never moves when the pill comes. `DS.dom.followEnd(log,
  { pill })` keeps the log at its end while it grows and shows the pill (a `.ds-presence`) while the reader has
  scrolled up; a click on it scrolls to the end. Only the pill takes the pointer. Hidden in print.

**Motion:** the scroll-linked keyframes in [Keyframes](motion.md#keyframes) and
[Scroll-driven effects](motion.md#scroll-driven-effects) in motion.md.

