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
   validation messages and of expandable rows; the `min-height` of a `flip()` container that shrinks once its
   removed items left (on `--ds-ease-out`). Discrete properties (`visibility`, `display`) only flip as a 0ms
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
7. Stagger 30ms, at most six steps, only on the first render of a view (`DS.motion.staggerOnce`).
8. **Data changes glide**: values from the shown value (`countUp`, bars on `--ds-ease-value`), reorders through
   `DS.motion.flip` (user actions at once, live data held while a mouse or pen is over the list or a row has focus,
   at most 2s, 50 rows); refreshes never replay an entrance. Figures in table cells update without counting.
9. Loaders appear only after `--ds-delay-loader` (200ms) and then stay at least `--ds-hold-loader` (450ms):
   `DS.motion.settleLoader` waits for both.
10. Re-render with `DS.dom.morphHtml` (keyed, in place), never `innerHTML`: an animating element (a spinner, an
    entering card) keeps its animation, a field its focus, and only the nodes that changed change.
11. Focus rings are solid from the first frame: only their offset moves, snapping from offset + width (4px) to the
    offset (2px) in `--ds-dur-fast` (a transition, never a keyframe, so it never takes over an element's
    `animation`); their colour and width never animate. Fields show their inset ring at once.

For slow motion, the styleguide and the tests set the registered
`--ds-time-scale` (`?speed=0.1` multiplies every duration and delay by 10); pages never set it.

## Press, focus and state

The controls (1.1) share one timing. Press feedback is the state layer, the ripple
([DS.ripple](#dsripple-jsripplejs)) and the shape morph: pills turn squarer while pressed
(`--ds-radius-action-pressed`, radio cards `--ds-radius-card-pressed`) and spring back on release; nothing scales
except the switch handle. Disabled, `aria-disabled` and busy controls neither morph nor show a press.

| Moment | Duration | Curve |
|---|---|---|
| press-in of the state layer and the radius | `--ds-dur-micro` | layer `--ds-ease-in-out`, radius `--ds-ease-out` |
| radius release (the morph springs back) | `--ds-dur-medium` | `--ds-ease-spatial` |
| state layer release, colours | `--ds-dur-fast` | `--ds-ease-in-out` |
| focus snap (`outline-offset`), with the focus layer (`--ds-state-focus`) at once | `--ds-dur-fast` | `--ds-ease-out` |
| switch handle travel and size, radio dot, icon-swap scale | `--ds-dur-medium` | `--ds-ease-spatial` |
| switch handle press grow (to its full 28px, never above) | `--ds-dur-instant` | `--ds-ease-out` |
| chip check slot `width` (a size that pushes layout) | `--ds-dur-medium` | `--ds-ease-out` |
| drawn marks in (chip and button checks: `stroke-dashoffset`; checkbox: a clip wipe) | `--ds-dur-medium` after `--ds-dur-micro` | `--ds-ease-out` |
| marks out, leaving faces and words | `--ds-dur-fast` or `--ds-dur-instant` | `--ds-ease-in` |
| disabled look (colours and opacity) | `--ds-dur-fast` | `--ds-ease-in-out` |

What leaves takes 0.4-0.67 of what enters: the chip check, the checkbox mark and the radio dot 250 to 150ms, the
button faces and the switch words 150 to 100ms, the icon swap 250 to 100ms (tested). Everything here is a
transition, so a control rendered in its end state (a chip rendered selected, a box rendered checked) stays still
on load, and a rapid toggle turns back from where it is.

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
| `.ds-swap` | a slot whose children share one grid cell (`inline-grid`, clipped), so outgoing and incoming content cross without a width jump; `DS.motion.roll()` and `crossfade()` make it |
| `.ds-icon-swap` | two icons in one cell, `.ds-icon-swap__a` and `.ds-icon-swap__b`: `data-swap="b"` (or, without `data-swap`, an ancestor with `aria-pressed="true"`) shows b. The incoming icon fades in (`--ds-dur-fast`) and springs up from `--ds-scale-small` (`--ds-dur-medium`), a `pathLength="1"` glyph in b draws itself (`stroke-dashoffset`, `--ds-ease-out`); the outgoing one only fades (`--ds-dur-instant`, accelerating). Transitions: nothing plays on the first render, a rapid toggle turns back from where it is. A crossfade with a scale, not a path morph; `crossfade(el, icon, { kind: 'icon' })` makes it |

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

Timing comes from the computed tokens (`--ds-time-scale` slows JS and CSS together); interrupted motion continues
from its current state through the Web Animations API; waits resolve when the element's own finite animations
finish, with a ceiling derived from them.

`enter()`, `leave()` and `cancel()` keep one state per element: a later call supersedes an earlier one, whose
promise then resolves without acting (no rejection, so `.then()` chains still run). When an element is still
moving (an entrance half played, an exit that holds its end), the next call does not restart or reverse it: it
reads the computed `opacity`, `translate`, `scale` and `clip-path`, cancels the running animation and plays each
track of the new one from there (`el.animate()`, id `ds-handoff`), on the new direction's curve, for the share of
the duration still to go (at least `--ds-dur-micro`), without a delay and without writing inline style. A value
that was moving but has no track in the new motion (the lift of an entrance under the fade-only default `leave()`,
the drop of `leave('sink')` under `enter('fade')`) glides to its rest value the same way, on the new direction's
movement curve (the spring for an entrance without one); nothing snaps.

| Export | |
|---|---|
| `enter(el, variant?)` | plays `.ds-enter` (+ `fade`, `scale`, `slide`, `swap`, `delayed`, `pop`, `fill-x`, `fill-y`) once, removes every `ds-enter*` / `ds-leave*` class afterwards; clears `hidden` and `inert` first and records the focused element outside `el` as its opener; returns a Promise |
| `leave(el, variant?, { then, focus })` | plays `.ds-leave` (+ `sink`, `scale`, `slide`, `pop`). Focus inside `el` first moves to `focus` (an element or a function returning one), else the opener, else the closest `tabindex="-1"` ancestor, else it is dropped; then `el` is `inert` for the exit. `then`: `'remove'` (default; meanwhile `el` carries `data-ds-leaving`, a pending removal that `DS.dom.morphHtml` and `flip()` skip, taken back by `enter()` or `cancel()`), `'hide'` (sets `hidden`, clears `inert` and the classes) or `'keep'` (stays in the DOM, invisible and inert, until `enter()` continues from there or `cancel()`) |
| `cancel(el)` | calls off what `enter()` / `leave()` started: no continuation runs, the classes and handoffs go, the `inert` that `leave()` set is cleared; the element shows its rest state at once |
| `enterAll(elements, variant?, { stagger, max, visibleOnly })` | `enter()` for many elements in batches (one style flush, one read of the rects): staggered by `--ds-i` (`stagger: true`, at most `max` = `STAGGER_MAX`), items entirely outside the viewport show at rest (`visibleOnly: true`), items still moving continue without a step; each batch removes the `--ds-i` it wrote once everything settled, and a later `enter()` or `enterAll()` on an item drops it at once (a page's own `stagger()` steps stay) |
| `staggerOnce(container, { variant, max })` | the first-render stagger: `enterAll()` on the children in view (default variant `swap`, the 4px rise of `.ds-stagger`); marks the container `data-ds-staggered`, so later calls resolve at once without motion; leaves no classes or `--ds-i` behind |
| `stagger(elements, { from, max })` | numbers items for staggering (`--ds-i`, read by `.ds-enter` and `.ds-stagger > *`, set through the CSSOM, CSP-safe); at most `STAGGER_MAX` + 1 steps |
| `STAGGER_MAX` | 5 (six steps: 0 to 5) |
| `replay(el, ...classes)` | restarts a one-shot class the element may already carry (a style flush, no layout; works on SVG) |
| `settled(el, { names, property, transitions, subtree, timeout, event })` | resolves when the element's own finite animations finish or are cancelled: the CSS animations in `names` (all without it), `ds-handoff` animations, CSS transitions only with `transitions: true` (of `property` if given; `event: 'transitionend'` waits for transitions only); never pseudo-elements or loops; `subtree: true` includes descendants. Call it right after the class change. With nothing running it resolves on the next frame; the ceiling is `timeout`, else the end of the longest animation it waits for plus 100ms |
| `motionDuration(el, token)` | a duration token as computed on `el`, in ms, `--ds-time-scale` included; `MOTION_FALLBACKS[token]` outside a `.ds-theme` |
| `motionEasing(el, token)` | an easing token as computed on `el` (`cubic-bezier()` or `linear()`); the cubic of `MOTION_FALLBACKS` outside a `.ds-theme` |
| `travelDuration(el, px)` | the travel rule of FLIP and the indicator: `--ds-dur-medium` plus up to `--ds-dur-slow` by distance (all of it at 480px) |
| `MOTION_FALLBACKS` | frozen fallbacks by token name: the ms of every `--ds-dur-*`, `--ds-delay-*` and `--ds-hold-*`, the cubic of every `--ds-ease-*` (the spring falls back to `--ds-ease-out`); tested against `tokens.css` |
| `LOADER_DELAY_MS` | 200, equals `--ds-delay-loader` |
| `LOADER_MIN_VISIBLE_MS` | 450: a loader that appeared stays at least this long |
| `loaderHoldMs(startedAt, now?, { delay, minVisible })` | how much longer a loader inserted at `startedAt` must stay (0 if it never showed); `delay` and `minVisible` default to `LOADER_DELAY_MS` and `LOADER_MIN_VISIBLE_MS` |
| `settleLoader(startedAt, nowOrOptions?, { element, delay, minVisible })` | Promise that waits for `loaderHoldMs`; with `element` (the loader) the times come from its computed tokens, time-scaled: the delay from `--ds-delay-boot` when it is or sits in a `.ds-boot`, else `--ds-delay-loader`, the minimum from `--ds-hold-loader`. The second argument may be `now` or the options |
| `busy(button, work, { done })` | runs `work` (a function, called at once, or a promise) while the button shows it works, through the faces of [components.md](components.md#button): `aria-busy="true"` at once (the busy face shows after `--ds-delay-loader`, so fast work changes nothing); a busy face that showed stays for the loader minimum (the `settleLoader()` path); on success `aria-busy` goes and, unless `done: false`, `.ds-btn--done` shows the success face for `--ds-hold-success`; on failure `aria-busy` goes at once and the error is rethrown. A call while busy returns the running promise without starting `work` again; a call during the success face takes it off first. Times are computed tokens (`--ds-time-scale` applies). Returns a Promise of the work's result, once the button is no longer busy. Announcing the result stays the page's job (`aria-live`) (1.1) |
| `countUp(el, to, { from, format, duration, win })` | counts a key figure from the value it shows (0 on the first call, or `from`) to `to`, up or down, on `--ds-ease-value` over `--ds-dur-glide` (`COUNT_UP_MS` outside a theme), on a clock animation of the element (id `ds-count`, no keyframes) that starts in the same frame as a CSS transition set with it, so a figure and its progress bar land together (and pausing or seeking the page's animations holds the figure). A new call takes over from the shown value (one count per element); the same value changes nothing. While it counts the element is `aria-busy`, keeps the width of its wider string and shows tabular figures (kept). `duration: 0`, a non-finite value or no animation frames show the value at once; a disconnected element gets the final value. Returns `{ cancel, finished }`: `cancel()` writes the final value, `finished` resolves once it is written (or a later call took over) |
| `COUNT_UP_MS` | 600, equals `--ds-dur-glide` |
| `easeOutCubic(t)` | **deprecated** (removed in 2.0), no longer used: `countUp` runs on `--ds-ease-value` |
| `originFrom(trigger, panel)` | where a popup grows from: writes `--ds-motion-origin` (the trigger's centre projected onto the panel, clamped, in px) and `--ds-clip-from` (the panel closed towards the trigger, with its radius) on the panel; `trigger` is an element or a `{ x, y }` point (a context menu). Call it once the panel is laid out. Returns `{ origin, side }`, `side` being where the panel lies: `'bottom'`, `'top'`, `'right'` or `'left'` |
| `roll(el, text)` | a status line that changes: `el` becomes a `.ds-swap` slot, the old line rolls up and out (`ds-fade-out`, `ds-roll-out`, `--ds-dur-fast`, accelerating), the new one rolls in from below (`ds-fade-in`, `ds-roll-in` on the spring, `--ds-dur-medium`). A roll during a roll continues from where each line is; only the last text stays. Returns a Promise |
| `crossfade(el, next, { kind })` | `kind: 'text'` (the default): swaps the content of `el` (a `.ds-swap` slot) for `next` (a node or a string): the new content fades in over `--ds-dur-fast`, the old one fades out over `--ds-dur-instant` and is removed; no movement, no width measuring. Safe to call again mid-swap. `kind: 'icon'` (1.1): `el` becomes a `.ds-icon-swap` (its current content is face a), `next` (an element such as `DS.icons.iconElement(...)`, or the markup of `DS.icons.icon(...)`) goes into the hidden face unless it already holds that icon, and `data-swap` flips to it; the CSS transitions do the motion. Pass an element where a policy forbids parsing markup. Any other kind throws a `TypeError`. Returns a Promise that resolves when the swap settled |
| `flip(container, mutate, { items, live, max, hold })` | glides reordered items (FLIP): measures the items (`items` selector, default the element children; never `data-ds-keep` or leaving nodes), calls `mutate({ holdOrder, onInsert, onRemove })` (pass it to `DS.dom.morphHtml` as its options), measures again and moves each item from its old place on `translate` (`composite: 'add'`) on the spring for `travelDuration()`. While they glide, the moving items paint above the others, the farthest travel on top, so an item never passes under the items it crosses (inline `z-index` from `--ds-z-raised`, `position: relative` where the item is static, `isolation: isolate` on the container so no rank reaches past it; all restored when the glide ends). A call during a glide continues from where each item is, so a typing filter may call it per keystroke. Inserted items fade in, removed items fade out of flow where they were while the others close the gap (table rows go at once); meanwhile the container keeps its height (an inline `min-height`, restored afterwards), then glides down to its new height on `--ds-ease-out`, so what follows the list never jumps and leaving items stay inside it. Items outside the viewport before and after jump; above `max` (50) moving items the update lands without motion. `live: true`: while a mouse or pen is over the container or focus is in an item, values update at once (`holdOrder: true`) and the reorder waits until the pointer or focus leaves, at most `hold` (2000) ms; touch never holds; a call without `live` (a user's sort) runs the held reorder at once. Returns a Promise of this call's motion |

First load: the loader, then the content, staggered once.

```js
const startedAt = Date.now();
DS.dom.morphHtml(list, '<div class="ds-loading" role="status">...</div>');   // fades in after the loader delay by itself
const rows = await fetchRows();
await DS.motion.settleLoader(startedAt, { element: list.firstElementChild });  // never half-faded, never a flash
DS.dom.morphHtml(list, renderRows(rows));
DS.motion.staggerOnce(list);              // the rows in view enter one after the other; never again
```

App start: the boot screen waits for `--ds-delay-boot` (400ms) before it shows, so a fast start shows nothing; once
shown it stays `--ds-hold-loader`. `settleLoader` reads both from the element.

```js
const startedAt = Date.now() - performance.now();              // the .ds-boot is in the page's HTML from the start
const boot = document.querySelector('.ds-boot');
const data = await loadEverything();
await DS.motion.settleLoader(startedAt, { element: boot });     // --ds-delay-boot inside a .ds-boot
DS.dom.morphHtml(main, renderApp(data));
DS.motion.leave(boot);                                          // fades out, then is removed
DS.motion.staggerOnce(main);
```

Refreshes never replay an entrance: values update in place, figures count from what they show, rows that moved glide.

```js
DS.motion.flip(list, (options) => DS.dom.morphHtml(list, renderRows(rows), options));          // a user's sort or filter
DS.motion.flip(list, (options) => DS.dom.morphHtml(list, renderRows(rows), options), { live: true });  // polling
DS.motion.countUp(total, rows.length);
```

## DS.indicator (js/indicator.js)

`createIndicator(track, { active, className })` inserts one `.ds-indicator` behind the items of `track` (which gets
`.ds-has-indicator`) and returns `{ update(), destroy() }`. It measures the item matching the `active` selector
(horizontal, vertical, scrolling or wrapping tracks); the first placement and resizes jump, only a change of the
active item glides (`--ds-dur-medium`, standard curve). It writes `--ds-indicator-x`, `--ds-indicator-y`,
`--ds-indicator-w` and `--ds-indicator-h` on the indicator; `.ds-indicator--instant` turns the glide off. The
component gives it its look (`.ds-drawer__indicator`, `.ds-segmented__indicator`, or your own class). Tracks may
be morphed: the span carries `data-ds-keep`, so `DS.dom.morphHtml` never removes it; a foreign re-render that
dropped it anyway gets it back at the next placement (without a glide). Call `update()` after a morph that moved
the active item.

## DS.dom (js/dom.js)

`morphHtml(target, html, { replace, holdOrder, onInsert, onRemove })` sets the content of `target` to `html` by
patching the nodes that are there, so running animations (spinners, entrances) continue, transitions run (a status
class, a new `--ds-progress`) and focus stays. `morphChildren(target, nodes, options)` does the same with detached
nodes.

- A node of the same tag (and the same key, or both without one) is kept: its attributes are synced and its children
  patched; text changes in place. Listeners on kept nodes stay, so bind them once (or see `data-ds-replace`).
- Keys: `data-ds-key`, else `id`. A keyed node is found among all old siblings and moved to its place; two
  different keys never morph into each other. Unkeyed nodes match by position, with a look-ahead of 8 siblings for an
  identical node. Key list rows, so a reorder moves them instead of rewriting each one.
- Runtime state survives a patch: the classes DS adds (`ds-enter*`, `ds-leave*`, `ds-has-indicator`, `ds-pressed`,
  `ds-ripples`), the custom properties it writes (`--ds-i`, `--ds-indicator-*`, `--ds-ripple-*`,
  `--ds-motion-origin`, `--ds-clip-from`), `data-ds-staggered`, and the `inert` of an element that carries a
  `ds-leave*` class (an exit in progress, or one kept with `then: 'keep'`).
- Focus: the focused element and its ancestors are always patched, never replaced; a focused field keeps its value,
  caret and IME composition (only unfocused controls take `value`, `checked` and `selected` from changed
  attributes).
- `data-ds-keep` nodes (the indicator, ripples) are never matched, moved or removed. `data-ds-replace` on a node (old
  or new markup) or `{ replace: true }` for the whole call brings back replacement when a node's shell differs.
- `onInsert(node)` runs after a new element went in; `onRemove(node)` may return a Promise, and the node then stays
  as a pending removal (`inert`, `aria-hidden`, `data-ds-leaving`, skipped by later morphs) until it settles. An
  element that `DS.motion.leave()` is removing carries `data-ds-leaving` too, so a re-render during its exit patches
  the next item instead of turning the leaving node into it.
  `holdOrder: true` patches the matched children of `target` in place and leaves moves, inserts and removals for a
  later call. `DS.motion.flip()` passes all four; hand its object straight on.
- Progressive: keyed moves use `moveBefore` where it exists (the node keeps its animations, focus and iframe state);
  elsewhere `insertBefore`, and a moved node that held the focus gets it back with its selection.

## DS.ripple (js/ripple.js)

`attach(root = document)` gives every action inside `root` the pointer ripple and returns `{ detach }`; a second
call for the same root returns the same handle. It adds `.ds-ripples` to the root element (`<html>` for
`document`) and listens there once (delegated): `pointerdown` with the primary button grows a ripple from the
pointer, Enter or Space on a focused host one from the centre. Hosts, skips, the runtime properties
(`--ds-ripple-x`, `--ds-ripple-y`, `--ds-ripple-r`), `.ds-pressed` and the markup:
[components.md](components.md#ripple). `RIPPLE_HOSTS` is the selector of the default hosts (1.1). The ripple's timing comes from the tokens (`--ds-dur-instant` minimum press,
read through `motionDuration()`). `attach()` also adds a passive `touchstart` listener, which makes iOS Safari apply
`:active`; `detach()` removes the listeners and the class, ripples already shown finish.

Chips (1.1): `attach()` also listens for `change` on `.ds-chip__input` in a `.ds-chips` row, the one call that
wires control motion. A toggle that keeps every chip on its line plays the check slot's `width` from where it is
(`el.animate()` on `::after` with the slot's CSS timing, so the neighbours follow the reflow and a rapid toggle
continues from the current width); a toggle that moves a chip to another line lets the slot land at once and glides
the chips to their new places with `flip()` (on the spring); meanwhile the row carries `data-ds-glide` and
`--ds-chips-backdrop` (the background colour of its nearest painted ancestor), which gives every chip an opaque
backing, so crossing chips never show through each other. The toggled chip keeps pace on the timing of the next
chip on its line: a body that grew opens from its old width with that chip's glide (`clip-path`) and its label glides
from where it was (`translate`), so the two never overlap; a body that shrank cannot paint its old width, so only
its label glides back. A script that sets `checked` fires no `change`:
then the CSS alone runs, and a chip that wraps jumps to its new line.
