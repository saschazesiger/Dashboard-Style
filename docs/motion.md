# Motion

Character comes from shape and colour, not movement. Motion should only be noticed as calm and fluid: short
distances, Material curves and a gentle spring for movement that floats. All timing lives in tokens
([tokens.md](tokens.md#motion)), all keyframes in `src/motion.css`. Motion is the same on every device.

## Rules

1. Animate only `transform`, `translate`, `scale`, `opacity`, colours, `box-shadow`, `clip-path` and registered
   custom properties. Named exceptions: `rotate` for spinners, loaders, disclosure chevrons and icon swaps;
   `border-radius` for the press morph; `outline-offset` for the focus snap (a transition, never a keyframe);
   `stroke-dashoffset` for drawn strokes (`ds-draw`); `mask-position` for the travelling progress wave; the
   `width` of the chip check slot; the height of `.ds-collapsible` (only where `interpolate-size` exists), of
   validation messages and of expandable rows. Discrete properties (`visibility`, `display`) only flip as a 0ms
   step or with `allow-discrete`. Never `transition: all`, never `font-weight`. The sliding indicator still moves
   its `width` and `height` until 1.2.0. `test/css.test.js` allows each exception once its feature lands.
2. Effects never overshoot, movement floats:
   - entering opacity runs on the standard curve (`--ds-ease-in-out`), leaving opacity accelerates
     (`--ds-ease-in`);
   - values (progress, figures, chart bars) run on `--ds-ease-value`;
   - movement that floats (`translate`, `scale`, `clip-path`) runs on the spring `--ds-ease-spatial`;
   - small exits move on `--ds-ease-in`, large surfaces (sheets, drawers) on `--ds-ease-exit`;
   - sizes that push layout (heights, the chip width) run on `--ds-ease-out` and never overshoot.

   So an entrance is two animations, a fade plus a movement, and an exit is `ds-fade-out` plus a movement-only
   keyframe. The shell's scrim close (a fade on `--ds-ease-in`) and `.ds-view--leaving` (the outgoing half of a
   fade-through, `--ds-dur-instant` on `--ds-ease-in`) are the reference examples of a leaving effect.
3. Exits take 0.3-0.8 of their entrance, measured on the longest track: 250 to 150ms, 350 to 200ms. Popups may
   exit in `--ds-dur-instant`.
4. Distances 4-12px, 24px for side sheets, the full width for sheets that cover the screen. Scales: .98 for
   content and dialogs, .95 for popups, .9 for tooltips, .6 for small markers; `ds-ripple` widens to 1.6.
   Rotation only for spinners, loaders, disclosure chevrons and icon swaps. Nothing scales on press except the
   switch handle.
5. Hover never moves anything: state layer, colour and the documented shadow only, inside
   `@media (hover: hover)`; touch shows the end state on press.
6. Durations follow the ladder micro (50ms) to glide (600ms) in [tokens.md](tokens.md#motion). The spring is
   normalised to its settle time, so its duration picks the size: `--ds-dur-medium` for small controls, menus and
   popups, `--ds-dur-slow` for dialogs, FLIP and the indicator, `--ds-dur-long` for sheets, the drawer and
   container transforms.
7. Stagger 30ms, at most six steps, only on the first render of a view.
8. **Updated data never animates**: polling, typing, filtering, sorting, saving all update in place. Table rows and
   figures in tables never animate.
9. Loaders appear only after `--ds-delay-loader` (200ms) and then stay at least 450ms.
10. Never re-render an element that is animating (a spinner, an entering card): update the nodes that changed
    (`morphHtml`), or the animation restarts and the page flickers.
11. Focus rings appear instantly, never animated.

For slow motion, the styleguide and the tests set the registered
`--ds-time-scale` (`?speed=0.1` multiplies every duration and delay by 10); pages never set it.

## Utilities (CSS)

| Class | Effect |
|---|---|
| `.ds-enter` | one-shot entrance: fade + 8px rise, 250ms; the fade on the standard curve, the movement on the spring (`--ds-ease-spatial`); plays once, also on an element with its own loop |
| `.ds-enter--fade` | fade only |
| `.ds-enter--scale` | fade + rise from .98 (dialogs) |
| `.ds-enter--slide` | fade + 24px from the side, 350ms, on the spring (sheets, a drawer coming back) |
| `.ds-enter--swap` | fade + 4px: content replacing a placeholder or another view |
| `.ds-enter--delayed` | fade after `--ds-delay-loader` (loaders) |
| `.ds-enter--pop` | fade + scale from `--ds-scale-small` (a badge or counter that appears) |
| `.ds-enter--fill-x` / `--fill-y` | fade + a bar or column growing from zero to its own `scaleX` / `scaleY` (the element sets `transform` and `transform-origin`), 600ms on the value curve (`--ds-ease-value`, never overshoots): meters and charts, first render only |
| `.ds-leave` | one-shot exit: fade, 150ms, accelerating (`--ds-leave-easing`, default `--ds-ease-in`), starts at once |
| `.ds-leave--sink` / `--scale` / `--slide` | `ds-fade-out` plus 8px down (150ms) / smaller to .98 (200ms) / 12px sideways (200ms) |
| `.ds-leave--pop` | `ds-fade-out` plus a scale to `--ds-scale-small`, 150ms (a badge or counter that goes) |
| `.ds-stagger` | its children fade in and rise 4px one after the other (`--ds-i` x 30ms); where `sibling-index()` exists, CSS-only lists number themselves |
| `.ds-reveal` | fade-through with the smallest rise, for freshly loaded content |
| `.ds-collapsible` | on `<details>`: animates the height where supported |
| `.ds-view--leaving` | quick fade-out of a view's children before a swap |

The utilities sit in the `ds.utilities` layer, so they beat a component's own animation; unlayered project
animations beat the utilities. Loaders are the exception for `.ds-stagger` and `.ds-reveal`: a `.ds-skeleton`,
`.ds-loading`, `.ds-boot` or `.ds-spinner` placed directly in `.ds-stagger` (or given `.ds-reveal`) keeps its own
loader delay and loop, so skeleton placeholders in a staggered grid never flash and a spinner keeps turning.
`.ds-enter` and `.ds-leave` still replace a loader's animation.

Per-element settings, registered in `src/motion.css` with `inherits: false`: they take tokens only, are set on the
animating element and never reach its descendants: `--ds-motion-distance` (travel of lift, grow, shift, roll, drop,
shrink), `--ds-motion-scale` (start of grow and pop-in, end of shrink and pop-out), `--ds-motion-origin` (where a
popup grows from), `--ds-clip-from` (the hidden end of `ds-clip-in` / `ds-clip-out`), `--ds-draw-length` (start of
a drawn stroke), `--ds-enter-keyframes`, `--ds-enter-duration`, `--ds-enter-easing`, `--ds-enter-delay`,
`--ds-leave-keyframes`, `--ds-leave-duration`, `--ds-leave-easing` and `--ds-i` (the stagger step, an integer).
Unregistered (they inherit): `--ds-scan-from`, `--ds-scan-to`, `--ds-ripple-opacity`, `--ds-ripple-scale`.

## Keyframes

Entrances define only `from` (the element animates to its own styles), exits only `to`; `ds-clip-in` and
`ds-clip-out` name both ends, because `clip-path` does not interpolate to `none`. Movement keyframes animate the
individual `translate` and `scale` properties, so they compose with an element's own or inline `transform` (a
placed tooltip, a bar's `scaleX()`). Exits are movement-only and always pair with `ds-fade-out`.

| Name | Movement | Use |
|---|---|---|
| `ds-fade-in` / `ds-fade-out` | opacity | scrims, loaders, every entrance's and every exit's fade |
| `ds-lift-in` | `translate`: rise (`--ds-motion-distance`, default 8px) | snackbars, swapped content; with `ds-fade-in` |
| `ds-grow-in` | `translate` + `scale`: rise from `--ds-motion-scale` (default `--ds-scale-enter`) | dialogs, tooltips (with distance 0) |
| `ds-shift-in` | `translate`: from the side (default 24px) | side sheets |
| `ds-pop-in` | `scale` from `--ds-motion-scale` (default `--ds-scale-small`) | badges, counters |
| `ds-drop-out` | `translate`: down (default 8px) | small exits; with `ds-fade-out` |
| `ds-shrink-out` | `translate` + `scale`: down (default 4px) to `--ds-motion-scale` (default `--ds-scale-enter`) | dialogs, cards leaving |
| `ds-shift-out` | `translate`: sideways (default 12px) | side sheets, drawers leaving |
| `ds-pop-out` | `scale` to `--ds-motion-scale` (default `--ds-scale-small`) | badges, counters leaving |
| `ds-clip-in` / `ds-clip-out` | `clip-path` from / to `--ds-clip-from` (default: closed towards the top edge), open `--ds-space-4` beyond the box so the shadow shows | a popup revealed from its trigger edge |
| `ds-draw` | `stroke-dashoffset` from `--ds-draw-length` (default 1): the glyph carries `pathLength="1"` (e.g. `check`) and the element sets `stroke-dasharray: 1` | a check after success |
| `ds-fill-x` / `ds-fill-y` | `scale: 0 1` / `scale: 1 0`, multiplying the element's own `scaleX()` / `scaleY()` | bars and columns filling on first render |
| `ds-roll-in` / `ds-roll-out` | `translate`: one line up into / out of its slot | a status line that changes |
| `ds-press-ripple` | `scale` from 0 (its fade is a separate track) | the pointer ripple of an action (`DS.ripple`) |
| `ds-ripple` | a ring that widens (`scale` to `--ds-ripple-scale`, 1.6) and fades once | behind a confirmation |
| `ds-sink-out` / `ds-scale-out` / `ds-slide-out` | fade + down / smaller / sideways in one keyframe | **deprecated** (removed in 2.0): use `ds-fade-out` with `ds-drop-out` / `ds-shrink-out` / `ds-shift-out` |
| `ds-spin`, `ds-pulse`, `ds-indeterminate` | loops | spinner, skeleton, indeterminate progress |
| `ds-scan` | `translate`: a band from `--ds-scan-from` to `--ds-scan-to` | media being processed |

```css
.my-panel {
  animation:
    ds-fade-in var(--ds-dur-medium) var(--ds-ease-in-out) backwards,
    ds-lift-in var(--ds-dur-medium) var(--ds-ease-spatial) backwards;
}

.my-panel--closing {
  animation:
    ds-fade-out var(--ds-dur-fast) var(--ds-ease-in) forwards,
    ds-drop-out var(--ds-dur-fast) var(--ds-ease-in) forwards;
}
```

## DS.motion (js/motion.js)

Everything only toggles classes and custom properties; waiting always has a timeout (hidden or detached elements
never fire `animationend`).

| Export | |
|---|---|
| `enter(el, variant?)` | plays `.ds-enter` (+ `fade`, `scale`, `slide`, `swap`, `delayed`, `pop`, `fill-x`, `fill-y`) once, removes the classes afterwards; returns a Promise |
| `leave(el, variant?, { then })` | plays `.ds-leave` (+ `sink`, `scale`, `slide`, `pop`), then `'remove'` (default), `'hide'` or `'keep'` |
| `stagger(elements, { from, max })` | numbers items for staggering (`--ds-i`, set through the CSSOM, CSP-safe); at most `STAGGER_MAX` + 1 steps |
| `STAGGER_MAX` | 5 (six steps: 0 to 5) |
| `replay(el, ...classes)` | restarts a one-shot class the element may already carry |
| `settled(el, { timeout, event, property })` | resolves on the element's own `animationend` (or `transitionend` of one property) or after the timeout (default 1000ms times `--ds-time-scale`) |
| `LOADER_DELAY_MS` | 200, equals `--ds-delay-loader` |
| `LOADER_MIN_VISIBLE_MS` | 450: a loader that appeared stays at least this long |
| `loaderHoldMs(startedAt, now?)` | how much longer a loader inserted at `startedAt` must stay (0 if it never showed) |
| `settleLoader(startedAt, now?)` | Promise that waits for `loaderHoldMs` |
| `countUp(el, to, { format, duration, win })` | counts a key figure up from 0 (ease-out, `COUNT_UP_MS`); without animation frames or for 0 it shows the value at once |
| `COUNT_UP_MS` | 600, equals `--ds-dur-glide` |
| `easeOutCubic(t)` | the curve of `countUp` |

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
