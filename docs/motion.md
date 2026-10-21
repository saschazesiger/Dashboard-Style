# Motion

Character comes from shape and colour, not movement. Motion should only be noticed as calm and fluid: short
distances, Material curves and a gentle spring for movement that floats. All timing lives in tokens
([tokens.md](tokens.md#motion)), all keyframes in `src/motion.css`. Motion is the same on every device.

## Rules

1. Animate only `transform`, `translate`, `scale`, `opacity`, colours, `box-shadow`, `clip-path` and registered
   custom properties. Named exceptions: `rotate` for spinners, loaders, disclosure chevrons, the table sort arrow
   and icon swaps;
   `border-radius` for the press morph; `outline-offset` for the focus snap (a transition, never a keyframe);
   `stroke-dashoffset` for drawn strokes (`ds-draw`); `mask-position` for the travelling progress wave; the
   `width` of the chip check slot; the height of `.ds-collapsible` (only where `interpolate-size` exists), of
   validation messages and of expandable table rows (`grid-template-rows`); the `min-height` of a `flip()` container that shrinks once its
   removed items left (on `--ds-ease-out`). Discrete properties (`visibility`, `display`) only flip as a 0ms
   step or with `allow-discrete`. Never `transition: all`, never `font-weight`. `test/css.test.js` allows each
   exception once its feature lands.
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
4. Distances 4-12px, 24px for a panel that slides in by hand (`.ds-enter--slide`). Side sheets and the modal drawer
   slide their full width (`--ds-distance-sheet`; on phones the side sheet rises from the bottom). Scales: .98 for
   content and dialogs (`--ds-scale-enter`), .95 for popups (`--ds-scale-popup`: menus, the combobox list), .9 for
   tooltips (`--ds-scale-tooltip`), each from an origin at its trigger (`originFrom()`), .6 for small markers;
   `ds-ripple` widens to 1.6.
   Rotation only for spinners, loaders, disclosure chevrons, the table sort arrow and icon swaps. Nothing scales on
   press except the
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
   `DS.motion.settleLoader` waits for both. The shape loader (`.ds-loader`) is the block loader (`.ds-boot`,
   `.ds-loading`, a section or sheet that waits), the arc spinner (`.ds-spinner`) the inline one (buttons, chips,
   status chips, table cells); both wait the same delay, and a loader inside a block that waits has no delay of its
   own, so delays never stack.
10. Re-render with `DS.dom.morphHtml` (keyed, in place), never `innerHTML`: an animating element (a spinner, an
    entering card) keeps its animation, a field its focus, and only the nodes that changed change.
11. Focus rings are solid from the first frame: only their offset moves, snapping from offset + width (4px) to the
    offset (2px) in `--ds-dur-fast` (a transition, never a keyframe, so it never takes over an element's
    `animation`); their colour and width never animate. Fields show their inset ring at once.

Choosing: one-shot content (a card that appears once, a row that goes) uses `.ds-enter` / `.ds-leave` or
`DS.motion.enter()` / `leave()`. Layers that are toggled again and again or live in the top layer use `DS.overlay`
(dialogs, side sheets, the modal drawer, menus, the combobox list, tooltips, snackbars) or, for a project element of
their own, `.ds-presence`. Never both on one element: the keyframes of `.ds-enter` would take over the transitions
that let a toggle turn back from where it is.

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

## Data motion

Data that changes, by a user action or by itself (polling, a push), glides where that helps to follow it and
changes at once where motion would only slow the reading. One rule for stale content, empty states, alerts, status
chips, tiles and tables; their file headers point here.

| | |
|---|---|
| **Glides** | order, through `DS.motion.flip` (sort, filter, live reorder, alerts that come and go); values: progress (`--ds-progress` on `--ds-ease-value`) and figures (`countUp` from the shown value, over `--ds-dur-glide`); status colour and icon (`.ds-status`, `--ds-dur-medium`) |
| **Changes at once** | text values (a label, a note, a figure in a table cell), and the removal of `.ds-stale`, so fresh values show without a fade |
| **Never per keystroke or per poll** | `.ds-reveal` and `.ds-enter--swap`: they are only for content that replaces a placeholder (a skeleton, a loader, another view) |

Render with `DS.dom.morphHtml` and key list items with `data-ds-key`: kept nodes are patched in place, so class
changes transition, running loops continue, focus stays, and `flip()` sees which item moved.

A live list (polling): values update at once; while a mouse or pen is over the list or an item has focus, the
reorder waits (at most 2s), so nothing moves under the pointer.

```js
DS.motion.flip(list, (options) => DS.dom.morphHtml(list, renderItems(items), options), { live: true });
```

Filtering while typing and sorting a table: user actions glide at once; a call during a glide continues from where
each item is. Rows are keyed; a removed row goes at once while the rows below glide up (a table row cannot leave
out of flow), entering rows fade in, and above 50 moving rows the update has no motion.

```js
search.addEventListener('input', () => {
  DS.motion.flip(tbody, (options) => DS.dom.morphHtml(tbody, renderRows(filter(rows, search.value)), options), { items: 'tr' });
});
sortButton.addEventListener('click', () => {
  DS.motion.flip(tbody, (options) => DS.dom.morphHtml(tbody, renderRows(sort(rows, key)), options), { items: 'tr' });
});
```

Alerts that come and go: `flip()` covers both, for a user action and live data alike, in any flex or grid gap and
without animating a height. A direct child that `mutate` removes fades out in place, out of flow, while the others
glide up on the spring; a new one fades in.

```js
DS.motion.flip(stack, () => alert.remove());        // dismiss
DS.motion.flip(stack, () => stack.prepend(alert));  // insert
```

A refresh with a loading bar: `.ds-stale` on the content (it dims only after `--ds-delay-loader`, so a fast answer
never dims) and `aria-busy="true"` on its container; the bar fades in after the same delay.

```js
const startedAt = Date.now();
content.classList.add('ds-stale');
content.setAttribute('aria-busy', 'true');
content.before(loadbar);
const rows = await fetchRows();
await DS.motion.settleLoader(startedAt, { element: loadbar });   // a bar that showed stays --ds-hold-loader
DS.motion.leave(loadbar);
DS.dom.morphHtml(content, renderRows(rows));
content.classList.remove('ds-stale');                             // at once
content.removeAttribute('aria-busy');
```

A tile with its bar: set both in the same task and they land on the same frame; the note changes at once.

```js
DS.motion.countUp(value, synced);
bar.style.setProperty('--ds-progress', String(synced / total));
```

Empty states: replacing a skeleton, `.ds-reveal`; the result of a filter, search or live update, the rows leave
through `flip()`, then `DS.motion.enter(empty, 'fade')` (no rise); the filter cleared, `DS.motion.leave(empty)`
while the rows enter through `flip()`; the user deleted the last item, the disc pops in with
`DS.motion.enter(disc, 'pop')`.

## Utilities (CSS)

| Class | Effect |
|---|---|
| `.ds-enter` | one-shot entrance: fade + 8px rise, 250ms; the fade on the standard curve, the movement on the spring (`--ds-ease-spatial`); plays once, also on an element with its own loop |
| `.ds-enter--fade` | fade only |
| `.ds-enter--scale` | fade + rise from .98 (dialogs) |
| `.ds-enter--slide` | fade + 24px from the side (`--ds-motion-distance`, default from the right), 350ms, on the spring (sheets). A drawer coming back: `DS.motion.enter(drawer)` slides it in from the left with the same keyframes, duration and curves (`.ds-drawer.ds-enter`), so it equals `enter(drawer, 'slide')` |
| `.ds-enter--swap` | fade + 4px: content replacing a placeholder or another view |
| `.ds-enter--delayed` | fade after `--ds-delay-loader` (loaders) |
| `.ds-enter--pop` | fade + scale from `--ds-scale-small` (a badge or counter that appears) |
| `.ds-enter--fill-x` / `--fill-y` | fade + a bar or column growing from zero to its own `scaleX` / `scaleY` (the element sets `transform` and `transform-origin`), 600ms on the value curve (`--ds-ease-value`, never overshoots): meters and charts, first render only |
| `.ds-leave` | one-shot exit: fade, 150ms, accelerating (`--ds-leave-easing`, default `--ds-ease-in`), starts at once |
| `.ds-leave--sink` / `--scale` / `--slide` | `ds-fade-out` plus 8px down (150ms) / smaller to .98 (200ms) / 12px sideways (200ms) |
| `.ds-leave--pop` | `ds-fade-out` plus a scale to `--ds-scale-small`, 150ms (a badge or counter that goes) |
| `.ds-stagger` | its children fade in and rise 4px one after the other (`--ds-i` x 30ms); where `sibling-index()` exists, CSS-only lists number themselves |
| `.ds-reveal` | fade-through with the smallest rise, for freshly loaded content |
| `.ds-collapsible` | on `<details>`: the content opens over `--ds-dur-medium` on `--ds-ease-out` (its height pushes what follows, so it never overshoots) while it fades in, and closes faster, accelerating (`--ds-dur-base` on `--ds-ease-in`, the fade in `--ds-dur-fast`). Its clip reaches out by `--ds-space-3` (`overflow-clip-margin`, 12px: the focus ring at its snap start plus about `--ds-space-1`), so the ring of a control flush with the content edge is never cut; larger shadows (`--ds-elev-2`/`-3`) may still be cut a little. Progressive: `interpolate-size`, `::details-content`, `transition-behavior: allow-discrete`, `overflow-clip-margin`; elsewhere it opens and closes at once, and where `overflow-clip-margin` is missing the content's own padding should equal that ring room. Add a `.ds-chevron` to the summary: it turns with the expansion, and the summary drops its native marker |
| `.ds-chevron` | a disclosure chevron: turns 180deg on the spring (`--ds-dur-medium`, `rotate`) in the summary of an open `<details>` or under `aria-expanded="true"` (a table row's `.ds-table__toggle`); `.ds-errors__chevron` turns the same way |
| `.ds-presence` | a project element toggled with `hidden`, as a `[popover]` or as a `<dialog>` without `DS.overlay`: fades in (`--ds-dur-fast`) and grows from `--ds-motion-scale` (default `--ds-scale-popup`) on the spring (`--ds-dur-medium`), its clip opening from `--ds-clip-from` when set (`originFrom()`); leaves in `--ds-dur-fast`, accelerating; `display` and `overlay` step with `allow-discrete`, so it stays rendered (and in the top layer) through its exit. Transitions, so a toggle mid-way continues from where it is. Progressive: `@starting-style`, `allow-discrete`, `:popover-open`; elsewhere an instant toggle |
| `.ds-view--leaving` | quick fade-out of a view's children before a swap (`--ds-dur-instant`, accelerating). The swap sequence without a helper: add it, `await DS.motion.settled(view.firstElementChild, { event: 'transitionend', property: 'opacity' })`, return if a newer swap started meanwhile (a counter), replace the content, then in the same task remove the class and `DS.motion.enter(newContent, 'swap')`, so the new view never shows at full opacity for a frame ([App frame](components.md#app-frame)) |
| `.ds-swap` | a slot whose children share one grid cell (`inline-grid`, clipped), so outgoing and incoming content cross without a width jump; `DS.motion.roll()` and `crossfade()` make it |
| `.ds-icon-swap` | two icons in one cell, `.ds-icon-swap__a` and `.ds-icon-swap__b`: `data-swap="b"` (or, without `data-swap`, an ancestor with `aria-pressed="true"`) shows b. The incoming icon fades in (`--ds-dur-fast`) and springs up from `--ds-scale-small` (`--ds-dur-medium`), a `pathLength="1"` glyph in b draws itself (`stroke-dashoffset`, `--ds-ease-out`); the outgoing one only fades (`--ds-dur-instant`, accelerating). Transitions: nothing plays on the first render, a rapid toggle turns back from where it is. A crossfade with a scale, not a path morph; `crossfade(el, icon, { kind: 'icon' })` makes it |

The utilities sit in the `ds.utilities` layer, so they beat a component's own animation; unlayered project
animations beat the utilities. Loaders are the exception for `.ds-stagger` and `.ds-reveal`: a `.ds-skeleton`,
`.ds-loading`, `.ds-boot`, `.ds-loader` or `.ds-spinner` placed directly in `.ds-stagger` (or given `.ds-reveal`) keeps its own
loader delay and loop, so skeleton placeholders in a staggered grid never flash and a spinner keeps turning.
`.ds-enter` and `.ds-leave` still replace a loader's animation, except that `.ds-leave` on a `.ds-loadbar` or a
`.ds-skeleton` keeps its loop running (the segments and the wave move on while the exit fades them out).

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
placed tooltip, a bar's `scaleX()`). Exits are movement-only and always pair with `ds-fade-out`, with one exception: the
opaque side sheet panel slides its full width (`--ds-distance-sheet`) off the screen without a fade. Loops run on a
`--ds-loop-*` token, `linear` (the shape loader's morph steps on the spring), and name all their stops; `scripts/motion-curves.mjs` generates the stops of
`ds-spinner-arc`, `ds-loader-morph`, `ds-progress-head`, `ds-progress-tail` and `ds-skeleton-wave` (with their curves
baked in) between `generated:` markers in `motion.css`, which are never edited by hand.

| Name | Movement | Use |
|---|---|---|
| `ds-fade-in` / `ds-fade-out` | opacity | scrims, loaders, every entrance's and every exit's fade |
| `ds-lift-in` | `translate`: rise (`--ds-motion-distance`, default 8px) | snackbars, swapped content; with `ds-fade-in` |
| `ds-grow-in` | `translate` + `scale`: rise from `--ds-motion-scale` (default `--ds-scale-enter`) | dialogs, tooltips (with distance 0) |
| `ds-shift-in` | `translate`: from the side (default 24px) | side sheets (their full width, `--ds-distance-sheet`) |
| `ds-pop-in` | `scale` from `--ds-motion-scale` (default `--ds-scale-small`) | badges, counters |
| `ds-drop-out` | `translate`: down (default 8px) | small exits; with `ds-fade-out` |
| `ds-shrink-out` | `translate` + `scale`: down (default 4px) to `--ds-motion-scale` (default `--ds-scale-enter`) | dialogs, cards leaving |
| `ds-shift-out` | `translate`: sideways (default 12px) | side sheets (full width, no fade), drawers leaving |
| `ds-pop-out` | `scale` to `--ds-motion-scale` (default `--ds-scale-small`) | badges, counters leaving |
| `ds-clip-in` / `ds-clip-out` | `clip-path` from / to `--ds-clip-from` (default: closed towards the top edge), open `--ds-space-6` beyond the box (the resting clip of the popups) so the shadow shows | a popup revealed from its trigger edge: the combobox list and the menu shown by hand (`DS.overlay` uses transitions) |
| `ds-draw` | `stroke-dashoffset` from `--ds-draw-length` (default 1): the glyph carries `pathLength="1"` (e.g. `check`) and the element sets `stroke-dasharray: 1` | a check after success |
| `ds-fill-x` / `ds-fill-y` | `scale: 0 1` / `scale: 1 0`, multiplying the element's own `scaleX()` / `scaleY()` | bars and columns filling on first render |
| `ds-roll-in` / `ds-roll-out` | `translate`: one line up into / out of its slot | a status line that changes |
| `ds-press-ripple` | `scale` from 0 (its fade is a separate track) | the pointer ripple of an action (`DS.ripple`) |
| `ds-ripple` | a ring that widens (`scale` to `--ds-ripple-scale`, 1.6) and fades once | behind a confirmation |
| `ds-sink-out` / `ds-scale-out` / `ds-slide-out` | fade + down / smaller / sideways in one keyframe | **deprecated** (removed in 2.0): use `ds-fade-out` with `ds-drop-out` / `ds-shrink-out` / `ds-shift-out` |
| `ds-spin` | `transform: rotate(360deg)`, a loop | one turn of the spinner (`--ds-loop-spin`) |
| `ds-spinner-arc` | `--ds-spinner-arc` (sweep 10deg → 270deg → 10deg) and `--ds-spinner-start` (advancing 270deg per cycle), generated; a loop of four cycles | the M3 arc of the spinner, with `ds-spin` (`--ds-loop-arc`, linear) |
| `ds-loader-morph` | `clip-path`: the 7 M3 shapes as 64-vertex `polygon()`s at k/7, generated; a loop | the shape loader, on `--ds-ease-spatial` over `--ds-loop-loader` (every step lands with the spring) |
| `ds-loader-turn` | `rotate` to `1turn`, a loop | the shape loader turning while it morphs (`--ds-loop-loader`, linear) |
| `ds-progress-head` / `ds-progress-tail` | `--ds-progress-head-1`, `--ds-progress-head-2` / `--ds-progress-tail-1`, `--ds-progress-tail-2` (0% → 100%, each on its M3 curve and window), generated; a loop | two-segment indeterminate progress (`--ds-loop-indeterminate`, linear) |
| `ds-progress-wave` | `mask-position` by one `--ds-progress-wave-length`, a loop | the travelling wave of determinate progress (`--ds-loop-wave`, linear) |
| `ds-skeleton-wave` | `--ds-skeleton-x` (a sine in-out sweep from -150vw to 50vw over 60% of the loop, then a rest), generated; a loop | the one diagonal wave across a skeleton surface (`--ds-loop-skeleton`, linear) |
| `ds-pulse` | opacity dims to `--ds-state-pulse` and comes back, a loop | **deprecated** (removed in 2.0): skeletons run `ds-skeleton-wave` |
| `ds-indeterminate` | `transform`: a segment across the track, a loop | **deprecated** (removed in 2.0): indeterminate progress runs `ds-progress-head` and `ds-progress-tail` |
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
| `originFrom(trigger, panel)` | where a popup grows from: writes `--ds-motion-origin` (the trigger's centre projected onto the panel, clamped, in px) and `--ds-clip-from` (the panel closed towards the trigger, with its radius; the other three edges `--ds-space-6` beyond the box, like a popup's resting clip) on the panel; `trigger` is an element or a `{ x, y }` point (a context menu). Call it once the panel is laid out. Returns `{ origin, side }`, `side` being where the panel lies: `'bottom'`, `'top'`, `'right'` or `'left'` |
| `roll(el, text)` | a status line that changes: `el` becomes a `.ds-swap` slot, the old line rolls up and out (`ds-fade-out`, `ds-roll-out`, `--ds-dur-fast`, accelerating), the new one rolls in from below (`ds-fade-in`, `ds-roll-in` on the spring, `--ds-dur-medium`). A roll during a roll continues from where each line is; only the last text stays. Returns a Promise |
| `crossfade(el, next, { kind })` | `kind: 'text'` (the default): swaps the content of `el` (a `.ds-swap` slot) for `next` (a node or a string): the new content fades in over `--ds-dur-fast`, the old one fades out over `--ds-dur-instant` and is removed; no movement, no width measuring. Safe to call again mid-swap. `kind: 'icon'` (1.1): `el` becomes a `.ds-icon-swap` (its current content is face a), `next` (an element such as `DS.icons.iconElement(...)`, or the markup of `DS.icons.icon(...)`) goes into the hidden face unless it already holds that icon, and `data-swap` flips to it; the CSS transitions do the motion. Pass an element where a policy forbids parsing markup. Any other kind throws a `TypeError`. Returns a Promise that resolves when the swap settled |
| `flip(container, mutate, { items, live, max, hold })` | glides reordered items (FLIP): measures the items (`items` selector, default the element children; never `data-ds-keep` or leaving nodes), calls `mutate({ holdOrder, onInsert, onRemove })` (pass it to `DS.dom.morphHtml` as its options; a `mutate` that changes the DOM itself works too, see below), measures again and moves each item from its old place on `translate` (`composite: 'add'`) on the spring for `travelDuration()`. While they glide, the moving items paint above the others, the farthest travel on top, so an item never passes under the items it crosses (inline `z-index` from `--ds-z-raised`, `position: relative` where the item is static, `isolation: isolate` on the container so no rank reaches past it; all restored when the glide ends). A call during a glide continues from where each item is, so a typing filter may call it per keystroke. Inserted items fade in, removed items fade out of flow where they were while the others close the gap (table rows go at once); this also holds for plain DOM calls in `mutate`: a direct child it removed goes back in, out of flow, for its exit, and an item that is new afterwards fades in (unless it runs an entrance of its own), so `flip(stack, () => alert.remove())` and `flip(stack, () => stack.prepend(alert))` need nothing else ([Data motion](#data-motion)); meanwhile the container keeps its height (an inline `min-height`, restored afterwards; a grid also gets `align-content: start`, so its rows never stretch into the held height), then glides down to its new height on `--ds-ease-out`, so what follows the list never jumps and leaving items stay inside it. Items outside the viewport before and after jump; above `max` (50) moving items the update lands without motion. `live: true`: while a mouse or pen is over the container or focus is in an item, values update at once (`holdOrder: true`) and the reorder waits until the pointer or focus leaves, at most `hold` (2000) ms; touch never holds; a call without `live` (a user's sort) runs the held reorder at once. Returns a Promise of this call's motion |

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

`createIndicator(track, { active, className, observe })` inserts one `.ds-indicator` behind the items of `track`
(which gets `.ds-has-indicator`) and returns `{ update(), destroy() }`. It measures the item matching the `active`
selector in the track's scroll coordinates (horizontal, vertical, scrolling or wrapping tracks). The component gives
it its look (`.ds-drawer__indicator`, `.ds-segmented__indicator`, or your own class). A track of `.ds-btn` toggles
(`active: '[aria-pressed="true"]'`) works as it is: inside `.ds-has-indicator` a pressed button drops its own tint
and border, so only the pill paints the selection (give your class `--ds-accent`, the tint's colour), and the labels
change colour on `--ds-indicator-dur`. Forced colors keep the button's selection colours.

- **Options.** `active`: the selector of the active item. `className`: the indicator's own class. `observe`
  (default `true`): the indicator follows the track by itself; `observe: false` turns the `MutationObserver` off,
  and the page calls `update()` after it changed the active item.
- **What it observes.** `aria-current`, `aria-pressed`, `aria-selected` and `aria-checked` anywhere in the track and
  items added or removed (never `class`; its own span and `data-ds-keep` nodes such as ripples are ignored); the size
  of the track, of each element child of the track and of the active item (a badge or a wrap in an earlier item, a
  group expanding above, the active label growing); web fonts that load late (`fonts.ready` and `loadingdone`).
  Changes are batched into one animation frame; a resize places the pill within the resize callback, so it never
  trails its item. `update()` stays and is harmless when the observer already moved the pill.
- **Drawing.** The pill is drawn by `clip-path` on a box, never by animating `width` or `height`. The box is
  `--ds-indicator-x`, `--ds-indicator-y` (moved by `translate`), `--ds-indicator-w` and `--ds-indicator-h`; the
  painted pill is the box minus the insets `--ds-indicator-t`, `--ds-indicator-r`, `--ds-indicator-b` and
  `--ds-indicator-l` (registered lengths), rounded by `--ds-indicator-radius`. At rest the box is the active item and
  the insets are 0px: a plain rounded pill.
- **Stretch and landing.** A change of the active item glides: the box becomes the union of the pill it leaves and
  the item it goes to (`data-glide`), widened where an edge travels outward by an overshoot margin
  (`OVERSHOOT` × the edge's travel + 1px, so the spring's pass beyond the target is never cut off; inside a track
  that clips or scrolls the box stays within the scroll area), and the edges move to the target on
  `--ds-ease-spatial`. The edge on the far side waits `--ds-indicator-lag` (default `--ds-dur-micro`; a motion hook
  that themes never set): `data-dir` (`left`, `right`, `up`, `down`) names the travel, so the leading edge leads, the
  trailing edge follows, and the pill lands with the spring's overshoot (at most 5 % of the travel). The trailing
  edge runs on `--ds-ease-in-out` instead of the spring (through `--ds-indicator-ease-t/-r/-b/-l`, the curve of
  each edge, component internal): it never passes its target, so the pill is never shorter than its item and never
  slides past it. Once every edge
  has landed, the box collapses to the item again (no visual change).
- **Duration from distance.** `travelDuration(track, distance)` between the centres: `--ds-dur-medium` for a neighbour,
  up to `--ds-dur-slow` for long jumps. It is written as `--ds-indicator-dur` (in ms, `--ds-time-scale` included) on
  the **track**, where the item labels read it too, so a label changes colour while its pill arrives.
- **Retargeting.** A placement while the edges still run (a second click, a resize mid-glide) continues from the pill
  as it is painted now to the new target, without a jump; a placement on the same running target keeps gliding. The
  first placement and a resize with nothing running jump (`.ds-indicator--instant`, the edges without transition;
  a press morph of the radius and a fade still run).
- **Appear and disappear.** When the active item goes away the pill contracts to its centre and fades in
  `--ds-dur-fast`, accelerating (`data-empty`). An active item after that grows from its centre over
  `--ds-dur-medium` on the spring while it fades in; one that comes while the pill still contracts glides it on
  from where it is painted, and the fade turns back from its current opacity. On page load the first placement jumps.
- **Radius.** A component sets `--ds-indicator-radius` (the drawer: half the item height, squarer under a pressed
  active item). A project class that only sets `border-radius` keeps working: at rest, when `--ds-indicator-radius`
  computes to 0px, the computed `border-top-left-radius` (capped at half the item's smaller side) is copied into it
  inline. During a glide the box has no radius of its own.
- **Morphs.** The span carries `data-ds-keep`, so `DS.dom.morphHtml` never removes it and the observers keep working
  after a morph of the track (a change of the active item in the new markup glides by itself). A foreign re-render
  that dropped the span anyway gets it back at the next placement (it jumps there once).
- **`destroy()`** is final: it disconnects both observers, cancels the pending frame, removes the fonts listener, the
  span, `.ds-has-indicator` and the track's `--ds-indicator-dur`; late callbacks do nothing.

| Export | |
|---|---|
| `createIndicator(track, { active, className, observe })` | see above; returns `{ update(), destroy() }` |
| `OVERSHOOT` | 0.05: the largest pass of an edge beyond its target, as a share of its travel (the peak contract of `--ds-ease-spatial`); the overshoot margin of the glide box |

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
  elsewhere `insertBefore`, and a moved node that held the focus gets it back with its selection. `insertBefore`
  makes the node new to the style engine, so it carries `data-ds-moving` (transitions off in its subtree, from
  `motion.css`) until one style flush at the end of the call: an `@starting-style` entrance inside it (a status
  icon, an error message's room) never plays again on a sort. The attribute is runtime state; never set it.

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

## DS.overlay (js/overlay.js)

`open(el, { opener })` and `close(el)` drive every floating layer the same way: the dialog and the side sheet (a
native `<dialog class="ds-dialog | ds-sheet">` opened with `showModal()`, or the div markup), the modal drawer
(`.ds-drawer`) and the popups (`.ds-menu`, `.ds-combo__popup`). The overlay must sit inside the `.ds-theme` element;
`open()` warns once per page otherwise. Both return a Promise: `open()` resolves when the entrance has settled,
`close()` once the overlay is hidden again. Every overlay is interruptible: its motion runs on CSS transitions keyed
on `data-state` (never keyframes while `data-state` is set), so an `open()` during the exit, or a `close()` during
the entrance, turns the motion back from its current value in every engine, with the curve of the new direction.

| Export | |
|---|---|
| `open(el, { opener })` | shows `el` and moves focus into it at once; `opener` (default: the focused element) gets focus back on close |
| `close(el)` | plays the exit and hides `el`; a second call during the exit returns the same promise |
| `lockScroll()` / `unlockScroll()` | the reference-counted scroll lock that the modal kinds take; a page may take it for a layer of its own |
| `toast(region, content, { kind, persistent, timeout, closeLabel })` | shows a snackbar in a `.ds-toasts` region; returns `{ el, close(), closed }` (below) |
| `tooltips(root = document)` | tooltips for every `[data-tip]` in `root`; returns `{ destroy() }` (below) |
| `TOAST_MS`, `TOAST_MAX_MS`, `TOAST_LIMIT` | snackbar fallbacks: 4000ms, at most 10000ms, at most 3 at once |
| `TOOLTIP_DELAY_MS`, `TOOLTIP_SKIP_MS`, `TOOLTIP_HIDE_MS` | tooltip fallbacks: 500, 300 and 100ms |

The constants are fallbacks only (outside a `.ds-theme`): JS timing comes from the computed tokens through
`motionDuration()`, so `--ds-time-scale` slows the overlays' JS and CSS together.

`open()`, in order:

1. hides any visible tooltip;
2. takes back a close in progress (a generation token: the pending close promise resolves without acting, and the
   motion reverses from where it is by flipping `data-state`); an overlay that is already open stays as it is;
3. records the opener;
4. modal kinds (dialog, sheet, drawer) take the scroll lock; every overlay joins the Escape stack. A dialog opened
   while another modal is open gets `.ds-dialog--nested`;
5. shows it: native `showModal()`, which traps focus and makes the page inert; div markup drops `hidden` (or
   `.ds-dialog--hidden`) and sets `inert` on every sibling of the overlay and of each of its ancestors up to `<body>`,
   `.ds-scrim`, the `.ds-toasts` regions, their announcers and the tooltips of `tooltips()` excepted. The inert
   follows the stack: an element a trap took stays usable while it holds an overlay opened above that trap (a dialog
   from a div sheet or from the modal drawer, which the lower trap took as a sibling, takes input; the sheet under it
   stays inert), and overlays over each other close in any order. A dialog or sheet takes the snackbar regions of its
   theme in first (below). Over an open native dialog or sheet, which makes everything outside it inert (top-layer
   popovers included), a menu, a dialog or a sheet (div or native) moves inside that native one before it shows and
   goes back to its place once its close settled; a combobox list stays with its field. A native dialog needs it for
   its exit: `close()` takes it out of the top layer at once, which would make it inert under the sheet below and
   draw it under that sheet's panel; inside the sheet it stays above the panel and its scrim keeps catching clicks;
6. sets `data-state="closed"` (already before step 5, so a native dialog never meets the rules for dialogs driven by
   hand), flushes style, writes the origin (`originFrom(opener, box)` for dialogs and popups) and
   sets `data-state="open"`: the entrance runs on the transitions keyed on `data-state` in every engine;
7. moves focus: `[autofocus]` inside, else the first focusable element (a menu: its first enabled item; a combobox
   keeps focus in its input);
8. popups set `aria-expanded="true"` on the opener.

`close()`, the same for the dialog, the sheet and the modal drawer: the trap goes first (native `dialog.close()` at
once plus `.ds-dialog--closing` / `.ds-sheet--closing`, which keep it displayed and stacked outside the top layer;
div markup gets its page back), focus is on the opener in the same frame (an opener that is gone: the nearest
`tabindex="-1"` landmark, never `<body>`), only the box or panel turns `inert` (the backdrop keeps swallowing clicks,
so nothing reaches the page through the exit; a press on it, or on the modal drawer's scrim, has its `mousedown`
prevented while the overlay closes, so the second click of a double click leaves focus on the opener), `data-state="closed"` plays the exit, and once it settled the overlay
is hidden (`hidden`, or the native dialog drops `--closing`), loses `.ds-dialog--nested`, releases the lock and
leaves the stack, all in one task. Closing a dialog, sheet or the drawer first closes the menus and combobox lists
open inside it (or opened from a trigger inside it) and hides the tooltip, so no popup outlives its overlay. Popups
return focus to their opener only for Escape or when focus was inside them, never for a click outside, and set
`aria-expanded="false"`.

Popups: a menu or a combobox list is placed before it enters, at rest size, and grows from its trigger:
`originFrom(opener, popup)` writes `--ds-motion-origin` and `--ds-clip-from` (closed at the trigger's edge, the other
edges `--ds-space-6` beyond the box like the resting clip, so only one edge moves). With `showPopover` and CSS anchor
positioning (and `anchor-size()` for a combobox list) it opens as `popover="manual"` in the top layer with
`data-anchored`: its anchor (the trigger; for a combobox the `.ds-combo` field) gets an inline `anchor-name`
(`--ds-anchor-<n>`, removed on close unless it had one) and the popup `position-anchor`, so no scrolling box clips
it. Elsewhere a menu is placed by `--ds-menu-x` / `--ds-menu-y` (below the trigger from its start edge, towards the
start edge without room, 8px from the window's edges, following scroll and resize within a frame) and a combobox list
stays absolute under its field. Either way a popup opens below its trigger when it fits there, else on the side with
more room (`data-placement="top"` above; for a combobox list the room is the window's narrowed by every box around
the field that clips its overflow), and it is never taller than the room on that side: anchored, the CSS caps it to
its `position-area`; placed by the script, an inline `max-height` (removed on close). The list or the menu scrolls
inside, so it never covers its trigger or the field being typed into. A menu focuses its first enabled item (the last when an ArrowUp keydown opened it), moves focus with ArrowUp,
ArrowDown, Home and End (wrapping) and closes a task after an item's `click` (its handlers run first; disabled
items close nothing). On close the popup leaves the top layer once its fade ended.

Escape stack: one `keydown` listener on the document in the bubble phase (installed by the first `open()`) closes
only the topmost overlay that is not already closing, and only when no tooltip took the key. A widget inside the
overlay that handles Escape itself (an inline edit, a picker) runs first: when it calls `preventDefault()`, the
overlay stays open, as with a plain `<dialog>`. The listener calls `preventDefault()` itself (which also keeps a
native dialog from its own `cancel`) but does not stop the event. A native dialog's `cancel` is turned into
`close()`, so Escape plays its exit. A click on `[data-close]` inside an overlay closes it (ignored while it
closes). A menu also closes on Tab (focus returns to its trigger and Tab moves on from there) and on a
`pointerdown` outside the menu and its trigger.

Scroll lock: `lockScroll()` / `unlockScroll()` count; `body.ds-no-scroll` (with `.ds-base`) toggles only on the
0 to 1 and 1 to 0 steps, and an unbalanced unlock never goes below 0. When the lock removes a classic scrollbar of
the page, its room stays: `scrollbar-gutter: stable` on `<html>` where supported, else a `padding-right` on
`<body>`. In the app frame, where `.ds-view` scrolls, nothing is reserved.

Modal drawer: `open(drawer, { opener })` acts only while `(max-width: 900px)` matches (wider, it resolves at once).
It sets `data-drawer-open` on `.ds-app` and `aria-expanded` on the menu button, focuses the drawer, makes its
siblings inert (not `.ds-scrim`, nor the snackbar regions, their announcers and the tooltips), takes the lock, joins the Escape stack and closes on a click on the scrim.
`close(drawer)` returns focus to the menu button at once. From the first `open(drawer)` or `close(drawer)` on, a
window crossing 900px sets `.ds-drawer--instant` for two frames, and a window that widens closes a stale open state
without motion; the breakpoint recipe of the App frame may stay (both together do no harm). Without the helper, the
CSS and the page recipe keep working.

Snackbars: `toast(region, content, options)` takes a `.ds-toast` element or builds one from a string (`kind`
`'success'`, `'error'` or `'info'` picks the icon and the modifier; a message that stays gets a close button) and
returns `{ el, close(), closed }`; `closed` resolves once the message is gone (also when it never showed). Every
insertion and removal runs inside `DS.motion.flip(region, ...)`: the messages on screen glide on `--ds-ease-spatial`
while a new one rises in (`--ds-dur-medium`) or a closed one fades out in place (`--ds-dur-fast`, out of flow) and the
gap closes. At most `TOAST_LIMIT` (3) show; a further one replaces the oldest message that would close by itself, or
waits in a queue (first in, first out) behind three that stay. A message closes after `timeout` ms, by default
`min(TOAST_MAX_MS, TOAST_MS + 50ms × max(0, characters − 40))`, multiplied by the computed `--ds-time-scale`; errors,
`persistent: true` and messages with another button or a link never close by themselves. The timers pause while a
pointer is over a message (`pointerover` / `pointerout`, checked against the region), while focus is in the region
and while `document.hidden`, and resume with the time left. A focused message that leaves first hands focus to the
next message's close button, else to the element focused before focus entered the region, else to the view
(`tabindex="-1"`); never `<body>`. The text is announced through two `.ds-sr` live regions that `toast()` adds next to
the region (polite; assertive for errors): cleared, then written on the next frame, so the same text is announced
again. A region with `role` or `aria-live` (the deprecated markup) announces by itself and gets none. `open()` of a
dialog or sheet moves every `.ds-toasts` region of its theme, with its announcers, into the overlay (`moveBefore`
where it exists), before the div trap makes the page inert: a message shown while it is open sits above its scrim,
in the top layer of a native one, announced and usable. In a dialog the region keeps its place (`--ds-toast-left`
holds the left edge it had). In a sheet `--ds-toast-left` becomes the panel's resting left edge plus `--ds-space-6`;
the messages glide there through the region's own `translate` transition (`--ds-toast-shift` set, flushed, cleared)
timed by `data-follow="enter"` (`--ds-dur-long`, `--ds-ease-spatial`); `close(sheet)` brings the region back with
`data-follow="exit"` (`--ds-dur-base`, `--ds-ease-exit`). Nothing glides where the place does not change (phones, a
dialog). Overlays over each other nest: each gives the regions back to the one it took them from.

Tooltips: `tooltips(root)` installs one set of delegated listeners for the `[data-tip]` triggers in `root` and creates
one `.ds-tooltip` inside the `.ds-theme` around it (a tooltip of a trigger inside a dialog or sheet moves into that
overlay while it shows, so it is never under the top layer; the div trap and the modal drawer never make it inert,
so it stays hoverable and heard). It shows after `--ds-delay-tooltip` for a
mouse or pen resting on a trigger (`pointerover` / `pointerout` with a `relatedTarget` check, so the trigger's own
icon changes nothing; touch never) and at once on `focusin` with `:focus-visible`. While one is visible, or within
`--ds-delay-tooltip-skip` of the last hide, the next trigger shows at once: a visible tooltip swaps text and place
in place (a fade under way turns back from its current opacity), a hidden one opens with `data-warm` and only fades
in. It hides after `--ds-delay-tooltip-hide`, unless the pointer crossed onto it or the trigger keeps keyboard
focus; Escape hides it (with `preventDefault()` and `stopPropagation()`, only when one was visible), as do any
`pointerdown`, `open()` and a trigger that scrolls out of view. Timing reads the tokens through `motionDuration()`,
so `--ds-time-scale` stretches the delays too. Motion runs on the `data-state` transitions of tooltip.css; the origin
comes from `originFrom(trigger, tip)`. Placement: with `showPopover` and CSS anchor positioning the tooltip is a
`popover="manual"` with `data-anchored`, the trigger gets an inline `anchor-name` (`--ds-anchor-<n>`, removed again
unless it had one) and the tooltip `position-anchor`, and `data-placement` follows the side the engine chose (read
again two frames after a show or swap: Chromium lays a swap out with the scroll offset of the previous anchor's
scrolling box until the next rendering); elsewhere a capture-phase scroll listener and `resize`
re-place it within one frame through `--ds-tooltip-x` / `--ds-tooltip-y`, flipped above (`data-placement="top"`) and
clamped 8px from the viewport edges.
