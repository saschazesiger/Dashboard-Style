# Motion

Character comes from shape and colour, not movement. Motion should only be noticed as calm and fluid: short
distances, Material curves, nothing that bounces. All timing lives in tokens ([tokens.md](tokens.md#motion)), all
keyframes in `src/motion.css`, and one switch in `tokens.css` handles reduced motion for everything.

## Rules

1. Animate only `transform`, `opacity`, colours, `box-shadow` and `clip-path`. Never `width`, `height`, `padding`,
   `max-height`, `font-weight` or `transition: all`. Exceptions: the sliding indicator (position and size), and
   `.ds-collapsible` (height, only where `interpolate-size` exists).
2. Opacity always on the standard curve (`--ds-ease-in-out`), entering movement decelerates (`--ds-ease-out`),
   everything leaving accelerates (`--ds-ease-in`). So an entrance is two animations: a fade plus a movement.
3. Exits are shorter than entrances, about 60-75%: 250 to 150ms, 350 to 200ms.
4. Small travel: 4-12px (24px for side sheets); scale at most .98 to 1 (badges and the disc hover from .6). No
   overshoot, no spring, no lift or growth on hover, no scaling on press, no rotation except loading spinners.
5. Hover is asymmetric: colour 150ms both ways; shapes 250ms in, 200ms out. Hover only inside
   `@media (hover: hover)`; touch shows the end state on press.
6. Stagger 30ms, at most six steps, only on the first render of a view.
7. **Updated data never animates**: polling, typing, filtering, sorting, saving all update in place. Table rows and
   figures in tables never animate.
8. Loaders appear only after `--ds-delay-loader` (200ms) and then stay at least 450ms.
9. Never re-render an element that is animating (a spinner, an entering card): update the nodes that changed
   (`morphHtml`), or the animation restarts and the page flickers.
10. Focus rings appear instantly, never animated.

## Reduced motion

With `prefers-reduced-motion: reduce` the token switch sets every duration to 1ms (not 0, so `transitionend` and
`animationend` still fire), every distance to 0, `--ds-scale-enter` to 1 and `--ds-stagger` to 0. Loading
indicators are not decoration: their loops slow down (1.4s, 2.4s) instead of stopping. Never fake reduced motion with
a tiny duration on an infinite animation: it would race. Smooth scrolling must check `prefersReducedMotion()` and use
`behavior: 'auto'` otherwise.

`.ds-motion-full` on the `.ds-theme` element ignores the setting for that page. Use it only when motion carries
meaning a still page would lose, and only on request.

## Utilities (CSS)

| Class | Effect |
|---|---|
| `.ds-enter` | one-shot entrance: fade + 8px rise, 250ms |
| `.ds-enter--fade` | fade only |
| `.ds-enter--scale` | fade + rise from .98 (dialogs) |
| `.ds-enter--slide` | fade + 24px from the side, 350ms, emphasized (sheets, a drawer coming back) |
| `.ds-enter--swap` | fade + 4px: content replacing a placeholder or another view |
| `.ds-enter--delayed` | fade after `--ds-delay-loader` (loaders) |
| `.ds-enter--pop` | fade + scale from `--ds-scale-small` (a badge or counter that appears) |
| `.ds-enter--fill-x` / `--fill-y` | fade + a bar or column growing from zero to its own `scaleX` / `scaleY` (the element sets `transform` and `transform-origin`), 600ms on the standard curve: meters and charts, first render only |
| `.ds-leave` | one-shot exit: fade, 200ms, accelerating, starts at once |
| `.ds-leave--sink` / `--scale` / `--slide` | exit with 8px down / scale to .98 / 12px sideways |
| `.ds-stagger` | its children fade in one after the other (`--ds-i` x 30ms) |
| `.ds-reveal` | fade-through with the smallest rise, for freshly loaded content |
| `.ds-collapsible` | on `<details>`: animates the height where supported |
| `.ds-view--leaving` | quick fade-out of a view's children before a swap |

Per-element settings: `--ds-motion-distance` (travel of lift, grow, shift, sink, slide, roll), `--ds-motion-scale`
(start of pop-in), `--ds-draw-length` (start of a drawn stroke), `--ds-enter-keyframes`, `--ds-enter-duration`,
`--ds-enter-easing`, `--ds-enter-delay`, `--ds-leave-keyframes`, `--ds-leave-duration`, `--ds-scan-from`,
`--ds-scan-to`, `--ds-ripple-opacity`, `--ds-ripple-scale`.

## Keyframes

Entrances define only `from` (the element animates to its own styles), exits only `to`.

| Name | Movement | Use |
|---|---|---|
| `ds-fade-in` / `ds-fade-out` | opacity | scrims, loaders, every entrance's fade |
| `ds-lift-in` | rise (`--ds-motion-distance`, default 8px) | snackbars, swapped content; with `ds-fade-in` |
| `ds-grow-in` | rise + `--ds-scale-enter` | dialogs, tooltips (with distance 0) |
| `ds-shift-in` | from the side (default 24px) | side sheets |
| `ds-pop-in` | scale from `--ds-scale-small` | badges, counters |
| `ds-draw` | stroke offset (glyphs with `pathLength="1"`, e.g. `check`) | a check after success |
| `ds-fill-x` / `ds-fill-y` | from `scaleX(0)` / `scaleY(0)` to the element's own transform | bars and columns filling on first render |
| `ds-roll-in` / `ds-roll-out` | one line up into / out of its slot | a status line that changes |
| `ds-sink-out` / `ds-scale-out` / `ds-slide-out` | fade + down / smaller / sideways | exits |
| `ds-spin`, `ds-pulse`, `ds-indeterminate` | loops | spinner, skeleton, indeterminate progress |
| `ds-scan` | a band from `--ds-scan-from` to `--ds-scan-to` | media being processed |
| `ds-ripple` | a ring that widens and fades once | behind a confirmation |

```css
.my-panel {
  animation:
    ds-fade-in var(--ds-dur-medium) var(--ds-ease-in-out) backwards,
    ds-lift-in var(--ds-dur-medium) var(--ds-ease-out) backwards;
}
```

## DS.motion (js/motion.js)

Everything only toggles classes and custom properties; waiting always has a timeout (hidden or detached elements
never fire `animationend`).

| Export | |
|---|---|
| `enter(el, variant?)` | plays `.ds-enter` (+ `fade`, `scale`, `slide`, `swap`, `delayed`, `pop`, `fill-x`, `fill-y`) once, removes the classes afterwards; returns a Promise |
| `leave(el, variant?, { then })` | plays `.ds-leave` (+ `sink`, `scale`, `slide`), then `'remove'` (default), `'hide'` or `'keep'` |
| `stagger(elements, { from, max })` | numbers items for staggering (`--ds-i`, set through the CSSOM, CSP-safe); at most `STAGGER_MAX` + 1 steps |
| `STAGGER_MAX` | 5 (six steps: 0 to 5) |
| `replay(el, ...classes)` | restarts a one-shot class the element may already carry |
| `settled(el, { timeout, event, property })` | resolves on the element's own `animationend` (or `transitionend` of one property) or after the timeout |
| `LOADER_DELAY_MS` | 200, equals `--ds-delay-loader` |
| `LOADER_MIN_VISIBLE_MS` | 450: a loader that appeared stays at least this long |
| `loaderHoldMs(startedAt, now?)` | how much longer a loader inserted at `startedAt` must stay (0 if it never showed) |
| `settleLoader(startedAt, now?)` | Promise that waits for `loaderHoldMs` |
| `countUp(el, to, { format, duration, win })` | counts a key figure up from 0 (ease-out, `COUNT_UP_MS`); reduced motion shows the value at once |
| `COUNT_UP_MS` | 600, equals `--ds-dur-glide` |
| `easeOutCubic(t)` | the curve of `countUp` |
| `prefersReducedMotion(win?)` | reads the media query defensively |

```js
const startedAt = Date.now();
list.innerHTML = '<div class="ds-loading" role="status">...</div>';   // fades in after the loader delay by itself
const rows = await fetchRows();
await DS.motion.settleLoader(startedAt);
DS.dom.morphHtml(list, renderRows(rows));
DS.motion.stagger(list.children);
```

## DS.indicator (js/indicator.js)

`createIndicator(track, { active, className })` inserts one `.ds-indicator` behind the items of `track` (which gets
`.ds-has-indicator`) and returns `{ update(), destroy() }`. It measures the item matching the `active` selector
(horizontal, vertical, scrolling or wrapping tracks); the first placement and resizes jump, only a change of the
active item glides (`--ds-dur-medium`, standard curve). It writes `--ds-indicator-x`, `--ds-indicator-y`,
`--ds-indicator-w` and `--ds-indicator-h` on the indicator; `.ds-indicator--instant` turns the glide off. The
component gives it its look (`.ds-drawer__indicator`, `.ds-segmented__indicator`, or your own class).

## DS.dom (js/dom.js)

`morphHtml(target, html)` sets the content of `target` to `html` but keeps every node that is still the same, only
inserting or removing what changed, so running animations (spinners, entrances) continue. `morphChildren(target,
nodes)` does the same with detached nodes. Kept nodes are never moved; the order of the new HTML decides.
