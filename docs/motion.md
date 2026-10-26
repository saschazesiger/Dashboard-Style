# Motion

Character comes from shape and colour, not movement. Motion should only be noticed as calm and fluid: short
distances, Material curves and a gentle spring for movement that floats. All timing lives in tokens
([Tokens](#tokens)), all keyframes in `src/motion.css`. Motion is the same on every device.

This page is the one reference for motion: the principles, the tokens, the numbered rules (each with the test that
holds it), the choreography of every component, interruption, the keyframes and utilities, the JS modules, recipes,
View Transitions, scroll-driven effects and the progressive features with their fallbacks. To see all of it play,
open the Motion Lab, `styleguide/motion.html` (it works from disk): it plots every curve as the browser plays it,
lines up the durations, and replays every choreography with rapid toggles and reversals. Its speed select in the top
bar (or `?speed=0.1` in the address) slows everything down tenfold. Identifiers such as (D1) name the design
decisions in [plans/motion-2.md](../plans/motion-2.md), which gives the reasoning behind each rule.

Contents: [Principles](#principles) · [Tokens](#tokens) · [Rules](#rules) · [Choreography](#choreography) ·
[Interruption](#interruption) · [Keyframes](#keyframes) · [Utilities](#utilities-css) · [JS](#js) ·
[Recipes](#recipes) · [View transitions](#view-transitions) · [Scroll-driven effects](#scroll-driven-effects) ·
[Progressive features](#progressive-features)

## Principles

1. **Springs for floating spatial movement only (D1).** Things that move or scale freely (the indicator, the switch
   handle, sheets, the drawer, dialogs, menus, FLIP) land on the spring `--ds-ease-spatial`, with a slight
   overshoot of 2 to 5%. One fixed scheme: themes never set motion tokens.
2. **Effects never overshoot.** Opacity, colour and values run on Material curves that stay within [0, 1] and never
   turn back.
3. **Sizes that push layout land on `--ds-ease-out` (D29).** The chip width, a validation message's room,
   expandable rows and `.ds-collapsible` never overshoot: a spring there would push the page twice. Opening lands on
   `--ds-ease-out`; closing may accelerate on `--ds-ease-in`, which also stays within [0, 1].
4. **Hover never moves anything (D14).** A state layer, a colour and, where documented, a shadow; no lift, no scale.
5. **A press is a ripple, a layer and a shape (D6).** The ripple grows from the pointer, the state layer comes in at
   once, pills turn squarer and spring back. Nothing scales on press except the switch handle.
6. **Interruption continues from the current state (D21).** Every motion turns back or retargets from where it is,
   on the curve of the new direction: never a jump to the end, never a restart from zero, never a reversed
   entrance.
7. **Data glides, with the live guard (D7).** Values count from what they show, reorders glide (FLIP); a reorder
   caused by live data waits while a mouse or pen is over the list or a row has focus. Refreshes never replay an
   entrance.
8. **The same motion on every device (D8).** No media-query switch: what plays is short, calm and never blocks
   input, so it suits everyone. Loaders always run at their token speed.

## Tokens

Every duration, delay, loop and the stagger step is written as `calc(<value> * var(--ds-time-scale, 1))`, for example
`calc(250ms * var(--ds-time-scale, 1))`: read them through `DS.motion` (or let the engine resolve the `calc()`), not
with `parseInt`. Themes never set motion tokens: motion is one scheme for every product, and `DS.motion` reads the
computed tokens.

### Durations

The ladder, from tiny feedback to values that travel. A duration picks the size of what moves, never its importance.

| Token | Value | Use |
|---|---|---|
| `--ds-dur-micro` | 50ms | press-in of layers and radius, tiny ticks |
| `--ds-dur-instant` | 100ms | pressed state, popup exits |
| `--ds-dur-fast` | 150ms | colour, small exits (the default `.ds-leave`), focus snap |
| `--ds-dur-base` | 200ms | toggles, exits of panels and dialogs |
| `--ds-dur-medium` | 250ms | content entrances, small spatial movement (handle, chip, check), menu entrances |
| `--ds-dur-slow` | 350ms | dialogs, FLIP, the indicator cap |
| `--ds-dur-long` | 450ms | sheets, modal drawer, container transform; never routine UI |
| `--ds-dur-glide` | 600ms | values that travel: progress, `countUp()` |

### Curves

| Token | Value | Use |
|---|---|---|
| `--ds-ease-in-out` | `cubic-bezier(.2, 0, 0, 1)` | M3 standard: effects (opacity, colour), on-screen changes |
| `--ds-ease-out` | `cubic-bezier(.05, .7, .1, 1)` | M3 emphasized decelerate: the spring's fallback, sizes that push layout (never overshoot) |
| `--ds-ease-in` | `cubic-bezier(.3, 0, 1, 1)` | M3 standard accelerate: small exits and small leaving fades (overlay layers fade out on `--ds-ease-in-out`, see [Overlays](#overlays)) |
| `--ds-ease-exit` | `cubic-bezier(.3, 0, .8, .15)` | M3 emphasized accelerate: large surfaces leaving (movement only) |
| `--ds-ease-emphasized` | `cubic-bezier(.2, 0, 0, 1)`; the exact M3 path as `linear()` where supported | movement that starts and ends on screen |
| `--ds-ease-spatial` | a spring (damping ratio 0.75, peak about 1.028, settles) as `linear()` where supported; `var(--ds-ease-out)` elsewhere | every spatial movement that floats: translate, scale, clip-path |
| `--ds-ease-value` | `var(--ds-ease-in-out)` | progress bars and `countUp()`, so figures and bars land together |

### The spring

`--ds-ease-spatial` is a damped spring (damping ratio 0.75) sampled into `linear()`. The contract is the overshoot,
not the damping: it peaks at most 1.05 (about 1.028 today) and settles on 1; effects curves stay within [0, 1] and
never decrease (both tested, in `test/tokens.test.js` and in every engine by the Motion Lab's curve plots). The
spring is normalised to its settle time, so one curve serves every size and the duration picks it: small controls,
menus and popups take `--ds-dur-medium`, dialogs, FLIP and the indicator `--ds-dur-slow`, sheets, the drawer and
container transforms `--ds-dur-long`. `scripts/motion-curves.mjs` generates both `linear()` values of
`src/tokens.css` (the spring and the exact emphasized path) and the stops of the generated loops
(`node scripts/motion-curves.mjs`; its `--check` mode runs in `npm run check`). Where `linear()` is missing the
spring falls back to `--ds-ease-out`, which lands without overshoot.

### Travel

`DS.motion.travelDuration(el, px)` is the one rule for movement whose length varies (FLIP and the indicator):
`--ds-dur-medium` for a neighbour, growing with the distance up to `--ds-dur-slow` at 480px and beyond, so a long
jump takes longer but never drags.

### Distances, scales and timing

| Token | Value | Use |
|---|---|---|
| `--ds-distance-sm`, `--ds-distance-md`, `--ds-distance-lg`, `--ds-distance-xl` | 4, 8, 12, 24px | travel of entering things (swap, default, a sideways exit by hand, a sideways entry: `.ds-enter--slide`, the docked drawer, the shared axis of view transitions) |
| `--ds-distance-sheet` | 100% | side sheet and modal drawer (full width; the side sheet on phones: full height, from the bottom) |
| `--ds-scale-enter` | .98 | start scale of content and dialogs |
| `--ds-scale-popup` | .95 | start scale of menus and the combobox list |
| `--ds-scale-tooltip` | .9 | start scale of tooltips |
| `--ds-scale-small` | .6 | start scale of small markers (badges, `ds-pop-in`) |
| `--ds-stagger` | 30ms | step between staggered items (at most six) |
| `--ds-delay-loader` | 200ms | loading indicators wait this long (`LOADER_DELAY_MS`) |
| `--ds-delay-boot` | 400ms | the app start screen waits this long |
| `--ds-hold-loader` | 450ms | a loader that showed stays at least this long (`LOADER_MIN_VISIBLE_MS`, `settleLoader()`) |
| `--ds-hold-success` | 600ms | how long a button shows its success face (`.ds-btn--done`, `DS.motion.busy()`) |
| `--ds-hold-status` | 900ms | a status line that rolls with `hold` stays at least this long before the next one rolls in (`DS.motion.roll(el, text, { hold: true })`, 2.0) |
| `--ds-delay-tooltip` | 500ms | a tooltip shows after the pointer rested this long on its trigger (`TOOLTIP_DELAY_MS`, `DS.overlay.tooltips()`) |
| `--ds-delay-tooltip-skip` | 300ms | within this of the last hide, the next tooltip shows at once (warm-up along a toolbar; `TOOLTIP_SKIP_MS`) |
| `--ds-delay-tooltip-hide` | 100ms | the grace before a tooltip hides, so the pointer can cross onto it (WCAG 1.4.13; `TOOLTIP_HIDE_MS`) |
| `--ds-delay-dismiss` | 300ms | a backdrop or scrim click this soon after an overlay opened does not close it (the second click of a double click on its opener; `DISMISS_DELAY_MS`); shorter than the dialog's `--ds-dur-slow` entrance |
| `--ds-loop-spin`, `--ds-loop-spin-fast` | 1568ms, .8s | one turn of the spinner (the M3 rotation period) / of the spinner in a status chip |
| `--ds-loop-arc` | 5332ms | one loop of the spinner's arc (`ds-spinner-arc`): four 1333ms cycles of growing and shrinking, so the start comes back to where it began (4 x 270deg = 3 turns) |
| `--ds-loop-indeterminate` | 1800ms | one cycle of two-segment indeterminate progress (`ds-progress-head`, `ds-progress-tail`) |
| `--ds-loop-loader` | 4550ms | one round of the shape loader: 7 shapes x 650ms (`ds-loader-morph`, `ds-loader-turn`) |
| `--ds-loop-skeleton` | 2s | one pass of the skeleton wave (`ds-skeleton-wave`: the sweep takes the first 60%, then it rests) |
| `--ds-loop-wave` | 1.2s | one wavelength of the travelling wave of determinate progress (`ds-progress-wave`) |

The loops of the loading indicators run `linear`: `scripts/motion-curves.mjs` bakes their curves into the keyframe
stops (the loader shapes, the arc, the indeterminate segments and the skeleton wave), so they need no curve token.
The per-element motion hooks (`--ds-motion-*`, `--ds-enter-*`, `--ds-leave-*`, `--ds-clip-from`, `--ds-draw-length`,
`--ds-i`) are registered with `inherits: false` and take these tokens only ([Utilities](#utilities-css)).

### Slow motion

| Token | Value | Use |
|---|---|---|
| `--ds-time-scale` | 1 (registered with `@property`, never declared) | slow motion: multiplies every duration, delay and loop above; set only by the styleguide and the tests, on the `.ds-theme` element or above |

The styleguide's speed select and `?speed=0.1` set it inline on `<html>` (a factor of 0.1 is a time scale of 10).
CSS and JS follow together, since `DS.motion.motionDuration()` reads the computed token. Pages, themes and
components never set it (`test/tokens.test.js`).

## Rules

1. Animate only `transform`, `translate`, `scale`, `opacity`, colours, `box-shadow`, `clip-path` and registered
   custom properties. Named exceptions (`EXCEPTIONS` in `test/css.test.js`, each allowed only where it is used):
   - `rotate`: spinners, loaders, disclosure chevrons and icon swaps (the table sort arrow turns between ascending
     and descending);
   - `border-radius`: the press morph (`--ds-dur-micro` in, `--ds-dur-medium` back on the spring);
   - `outline-offset`: the focus snap (a transition, never a keyframe);
   - `stroke-dashoffset`: drawn checks (`ds-draw`, `pathLength="1"` glyphs);
   - `mask-position`: the travelling progress wave (`ds-progress-wave`; with its `-webkit-mask-position` twin for
     Chrome/Edge before 120);
   - `width`: the chip check slot;
   - `height`: `.ds-collapsible` and the validation message room (also a confirmation's, `height` through `interpolate-size`, only where
     it exists; elsewhere they show at once) and expandable rows (`grid-template-rows`). They open on
     `--ds-ease-out`; the collapsible and the rows close faster, accelerating on `--ds-ease-in`. None overshoots
     (D29);
   - `min-height`: a `flip()` container shrinking after its removed items left (WAAPI, on `--ds-ease-out`).

   Discrete properties (`visibility`, `display`) only flip as a 0ms step or with `allow-discrete`. Never
   `transition: all`, never `font-weight`. Tests: `test/css.test.js` ("allows exactly the named exceptions ...",
   which also compares this list with `EXCEPTIONS`).
2. Effects never overshoot, movement floats:
   - entering opacity runs on the standard curve (`--ds-ease-in-out`); small leaving effects accelerate on
     `--ds-ease-in` (`.ds-leave`, the snackbar, the drawer scrim, `.ds-view--leaving`, leaving marks, faces and
     words); overlay layers (scrims, dialog boxes, tooltips, menus, the combobox list) and the View Transition old
     snapshots fade out on the standard curve, so an interrupted close turns back on the same curve as the entrance
     (D21, the Overlays table);
   - values (progress, figures, chart bars) run on `--ds-ease-value`;
   - movement that floats (`translate`, `scale`, `clip-path`) runs on the spring `--ds-ease-spatial`;
   - small exits move on `--ds-ease-in`, large surfaces (sheets, drawers) on `--ds-ease-exit`;
   - sizes that push layout (heights, the chip width) run on `--ds-ease-out` and never overshoot.

   So an entrance is two animations, a fade plus a movement, and an exit is `ds-fade-out` plus a movement-only
   keyframe. The shell's scrim close (a fade on `--ds-ease-in`) and `.ds-view--leaving` (the outgoing half of a
   fade-through, `--ds-dur-instant` on `--ds-ease-in`) are the reference examples of a leaving effect. Tests:
   `test/css.test.js` ("runs the spring only on movement", "keeps effect curves within [0, 1] ...", "pairs every
   movement exit with ds-fade-out ..."), `test/tokens.test.js` (the spring's contract) and the curve plots of
   `test/browser/lab.spec.js` in every engine.
3. Exits take 0.3-0.8 of their entrance, measured on the longest track: 250 to 150ms, 350 to 200ms. Popups may
   exit in `--ds-dur-instant`. The pairs (`RATIOS` in `test/css.test.js` reads them from `src/` and compares them
   with this table; a component with an entrance and an exit needs a row):

   | Pair | Entrance | Exit |
   |---|---|---|
   | `.ds-enter` / `.ds-leave` | `--ds-dur-medium` | `--ds-dur-fast` |
   | `.ds-enter--scale` / `.ds-leave--scale` | `--ds-dur-medium` | `--ds-dur-base` |
   | `.ds-enter--slide` / `.ds-leave--slide` | `--ds-dur-slow` | `--ds-dur-base` |
   | `.ds-enter--pop` / `.ds-leave--pop` | `--ds-dur-medium` | `--ds-dur-fast` |
   | dialog (`DS.overlay`) | `--ds-dur-slow` | `--ds-dur-base` |
   | dialog (keyframes) | `--ds-dur-medium` | `--ds-dur-base` |
   | full-screen dialog (`DS.overlay`) | `--ds-dur-long` | `--ds-dur-base` |
   | action sheet (`DS.overlay`) | `--ds-dur-long` | `--ds-dur-base` |
   | side sheet (`DS.overlay`) | `--ds-dur-long` | `--ds-dur-base` |
   | side sheet (keyframes) | `--ds-dur-long` | `--ds-dur-base` |
   | modal drawer | `--ds-dur-long` | `--ds-dur-base` |
   | snackbar | `--ds-dur-medium` | `--ds-dur-fast` |
   | tooltip (`DS.overlay`) | `--ds-dur-medium` | `--ds-dur-instant` |
   | tooltip (keyframes) | `--ds-dur-fast` | `--ds-dur-instant` |
   | combobox list | `--ds-dur-medium` | `--ds-dur-instant` |
   | menu | `--ds-dur-medium` | `--ds-dur-instant` |

   "Keyframes" is the markup without `data-state`, opened by the page's own classes (`--closing`); `DS.overlay`
   sets `data-state` and plays transitions. The overlays' full timelines are in the [Overlays](#overlays) table,
   which `test/browser/lab.spec.js` compares with what every engine plays.
4. Distances 4-12px, 24px for a panel that slides in by hand (`.ds-enter--slide`). Side sheets and the modal drawer
   slide their full width (`--ds-distance-sheet`; on phones the side sheet rises from the bottom). Scales: .98 for
   content and dialogs (`--ds-scale-enter`), .95 for popups (`--ds-scale-popup`: menus, the combobox list), .9 for
   tooltips (`--ds-scale-tooltip`), each from an origin at its trigger (`originFrom()`), .6 for small markers;
   `ds-ripple` widens to 1.6. Rotation only for spinners, loaders, disclosure chevrons, the table sort arrow and icon
   swaps. Nothing scales on press except the switch handle. Tests: `test/css.test.js` ("never moves anything on
   hover and never transforms on press", "gives the per-element motion hooks token values only").
5. Hover never moves anything: state layer, colour and the documented shadow only, inside
   `@media (hover: hover)`; touch shows the end state on press. Tests: `test/css.test.js` and the hover sweep of
   `test/browser/review.spec.js` (every interactive element of both styleguide pages keeps its box on hover).
6. Durations follow the ladder micro (50ms) to glide (600ms) of [Durations](#durations). The spring is normalised
   to its settle time, so its duration picks the size: `--ds-dur-medium` for small controls, menus and popups,
   `--ds-dur-slow` for dialogs, FLIP and the indicator, `--ds-dur-long` for sheets, the drawer and container
   transforms. Tests: `test/css.test.js` ("takes durations and easings ... from tokens", "times loops with
   --ds-loop-* and one-shots with --ds-dur-*").
7. Stagger 30ms, at most six steps, only on the first render of a view (`DS.motion.staggerOnce`). Tests:
   `test/motion.test.js` (`stagger()`, `enterAll()`, `staggerOnce()`).
8. **Data changes glide**: values from the shown value (`countUp`, bars on `--ds-ease-value`), reorders through
   `DS.motion.flip` (user actions at once, live data held while a mouse or pen is over the list or a row has focus,
   at most 2s, 50 rows); refreshes never replay an entrance. Figures in table cells update without counting. Tests:
   `test/motion.test.js` (`flip()`, `countUp()`), `test/browser/flip.spec.js`, `countup.spec.js` and `data.spec.js`.
9. Loaders appear only after `--ds-delay-loader` (200ms) and then stay at least `--ds-hold-loader` (450ms):
   `DS.motion.settleLoader` waits for both. The shape loader (`.ds-loader`) is the block loader (`.ds-boot`,
   `.ds-loading`, a section or sheet that waits), the arc spinner (`.ds-spinner`) the inline one (buttons, chips,
   status chips, table cells); the shape loader and every loading block wait the delay themselves, the arc spinner
   has none of its own and waits through its container (`.ds-loading`, a busy button's face) or a
   `<span class="ds-enter ds-enter--delayed">` wrapper, and a loader inside a block that waits has no delay of its
   own, so delays never stack. Tests: `test/motion.test.js` (`loaderHoldMs()`, `settleLoader()`) and
   `test/browser/feedback.spec.js`.
10. Re-render with `DS.dom.morphHtml` (keyed, in place), never `innerHTML`: an animating element (a spinner, an
    entering card) keeps its animation, a field its focus, and only the nodes that changed change. Tests:
    `test/browser/morph.spec.js`.
11. Focus rings are solid from the first frame: only their offset moves, snapping from offset + width (4px) to the
    offset (2px) in `--ds-dur-fast` (a transition, never a keyframe, so it never takes over an element's
    `animation`); their colour and width never animate. Fields show their inset ring at once. Tests:
    `test/browser/controls.spec.js`.

Choosing: one-shot content (a card that appears once, a row that goes) uses `.ds-enter` / `.ds-leave` or
`DS.motion.enter()` / `leave()`. Layers that are toggled again and again or live in the top layer use `DS.overlay`
(dialogs, side sheets, the modal drawer, menus, the combobox list, tooltips, snackbars) or, for a project element of
their own, `.ds-presence`. Never both on one element: the keyframes of `.ds-enter` would take over the transitions
that let a toggle turn back from where it is.

For slow motion, the styleguide and the tests set the registered
`--ds-time-scale` (`?speed=0.1` multiplies every duration and delay by 10); pages never set it.

## Choreography

What plays when, per area. All values are read from `src/`; the Motion Lab replays each of them.

**A view's entrance.** The container comes first, then its content: a view's first render staggers its blocks in
at most six steps of `--ds-stagger` (`DS.motion.staggerOnce`, the 4px rise of `.ds-enter--swap` over
`--ds-dur-medium`), loaders wait `--ds-delay-loader` before they show, and the content that replaces them fades
through (`.ds-reveal`). A view reached by navigation moves as one ([Views](#views)); only its first render
staggers, never a refresh.

### Overlays

One row per layer, as `DS.overlay` plays it (transitions keyed on `data-state`). Entrance and exit name each track
as its property (a transition) or keyframe (an animation) with its duration and curve tokens; a track that only
steps back once the layer is invisible (a popup's `scale` and `clip-path`, 0ms after its fade) is left out.
`test/browser/lab.spec.js` opens and closes every row's layer in the Motion Lab and compares what each engine plays
with this table, so the table and the code are one source.

| Layer | Path | Entrance | Exit | Moves | Origin | Delays | Interrupted | Focus during the exit |
|---|---|---|---|---|---|---|---|---|
| Scrim | native and div | `opacity` `--ds-dur-medium` `--ds-ease-in-out` | `opacity` `--ds-dur-base` `--ds-ease-in-out` | fades only (`--ds-dialog-scrim`) | none | a click closes only after `--ds-delay-dismiss`, as the first click of a press that began on it | turns back from its opacity | catches clicks until the layer is hidden |
| Dialog | native and div | `opacity` `--ds-dur-fast` `--ds-ease-in-out`; `scale` `translate` `--ds-dur-slow` `--ds-ease-spatial` | `opacity` `--ds-dur-base` `--ds-ease-in-out`; `scale` `translate` `--ds-dur-base` `--ds-ease-exit` | grows from `--ds-scale-enter` and rises `--ds-distance-sm`; leaves the same way back, accelerating | `--ds-motion-origin`: the opener (`originFrom()`), else the centre | none | an `open()` during the exit (or a `close()` during the entrance) turns back from the current values on the new direction's curves | on the opener at once (D18); the box is `inert` |
| Nested dialog | native and div | `opacity` `--ds-dur-fast` `--ds-ease-in-out`; `scale` `translate` `--ds-dur-slow` `--ds-ease-spatial` | `opacity` `--ds-dur-base` `--ds-ease-in-out`; `scale` `translate` `--ds-dur-base` `--ds-ease-exit` | as the dialog, over the lighter `--ds-scrim-nested` (`.ds-dialog--nested`) | `--ds-motion-origin`: the opener inside the lower layer | none | as the dialog; overlays over each other close in any order | on its opener in the lower layer |
| Dialog on a phone | native and div | `opacity` `--ds-dur-fast` `--ds-ease-in-out`; `scale` `translate` `--ds-dur-slow` `--ds-ease-out` | `opacity` `--ds-dur-base` `--ds-ease-in-out`; `scale` `translate` `--ds-dur-base` `--ds-ease-exit` | at 600px and below a box nearly as wide as the window decelerates instead of springing, so it never passes the window's edge | `--ds-motion-origin`: the opener | none | as the dialog | as the dialog |
| Full-screen dialog | native and div | `opacity` `--ds-dur-fast` `--ds-ease-in-out`; `translate` `--ds-dur-long` `--ds-ease-spatial` | `opacity` `--ds-dur-base` `--ds-ease-in-out`; `translate` `--ds-dur-base` `--ds-ease-exit` | `.ds-dialog--full` (and `--full-narrow` at 600px and below): the box fills the window and rises `--ds-distance-lg` on the spring with the fade, no scale; it drops back the same way, accelerating | none: it rises from below | as the scrim | an `open()` during the exit turns back from the current values | on the opener at once; the box is `inert` |
| Action sheet | native and div | `opacity` `--ds-dur-fast` `--ds-ease-in-out`; `translate` `--ds-dur-long` `--ds-ease-spatial` | `opacity` `--ds-dur-base` `--ds-ease-in-out`; `translate` `--ds-dur-base` `--ds-ease-exit` | `.ds-dialog--bottom`: the box at the bottom edge rises its full height (`--ds-distance-sheet`) on the spring with the fade, and drops back, accelerating | the bottom edge | as the scrim | as the full-screen dialog | as the full-screen dialog |
| Side sheet | native and div | `translate` `--ds-dur-long` `--ds-ease-spatial` | `translate` `--ds-dur-base` `--ds-ease-exit` | the opaque panel slides its full width (`--ds-distance-sheet`) in from the end edge, no fade; a strip of its background past its outer edge covers the overshoot | the end edge | none | turns back from where the panel is | on the opener at once; the panel is `inert` |
| Side sheet on a phone | native and div | `translate` `--ds-dur-long` `--ds-ease-out` | `translate` `--ds-dur-base` `--ds-ease-exit` | rises its full height from the bottom (as tall as the screen, so it decelerates: the spring would cut off its head) | the bottom edge | none | as the side sheet | as the side sheet |
| Modal drawer | div | `transform` `--ds-dur-long` `--ds-ease-spatial` | `transform` `--ds-dur-base` `--ds-ease-exit` | slides its full width in from the start edge below 900px; its bleed covers the overshoot; `visibility` steps after the exit | the start edge | none | turns back from where the drawer is | on the menu button at once |
| Modal drawer scrim | div | `opacity` `--ds-dur-medium` `--ds-ease-in-out` | `opacity` `--ds-dur-base` `--ds-ease-in` | fades only (`--ds-scrim`) | none | a click closes only after `--ds-delay-dismiss`, as the first click of a press that began on it | turns back from its opacity | closes the drawer on a click |
| Snackbar | div | `ds-fade-in` `--ds-dur-medium` `--ds-ease-in-out`; `ds-lift-in` `--ds-dur-medium` `--ds-ease-spatial` | `ds-fade-out` `--ds-dur-fast` `--ds-ease-in` | rises `--ds-distance-md`; a closed message fades out in place, out of flow, while the stack glides (`flip()`: `translate` on the spring for `travelDuration()`); at most three, a fourth replaces the oldest that closes by itself or waits (D19, D32) | none | closes after its timeout (time-scaled); the timers pause on hover, focus and a hidden tab; the same message again restarts it, nothing moves | a message that leaves mid-entrance continues from its current opacity (`DS.motion.leave()`) | to the next message's close button, else where focus came from, else the view |
| Tooltip | popover and div | `opacity` `--ds-dur-fast` `--ds-ease-in-out`; `scale` `--ds-dur-medium` `--ds-ease-spatial` | `opacity` `--ds-dur-instant` `--ds-ease-in-out` | grows from `--ds-scale-tooltip` at its anchor; the exit only fades | `--ds-motion-origin`: the side of the anchor | shows after `--ds-delay-tooltip` for a resting mouse or pen, at once on keyboard focus; on touch at once on a tap (an image, a blocked control) or after a long press of `--ds-delay-tooltip`; hides after `--ds-delay-tooltip-hide` (a touch tip on the next touch, a scroll or Escape) | a hide taken back turns back from its opacity; a visible tooltip swaps text and place in place | focus stays on the trigger |
| Tooltip warm-up | popover and div | `opacity` `--ds-dur-fast` `--ds-ease-in-out` | `opacity` `--ds-dur-instant` `--ds-ease-in-out` | within `--ds-delay-tooltip-skip` of the last hide the next tooltip of a toolbar shows at once and only fades in (`data-warm`) | `--ds-motion-origin`: the side of the anchor | none: it shows at once | as the tooltip | focus stays on the trigger |
| Menu | popover and div | `opacity` `--ds-dur-fast` `--ds-ease-in-out`; `scale` `clip-path` `--ds-dur-medium` `--ds-ease-spatial` | `opacity` `--ds-dur-instant` `--ds-ease-in-out` | its clip opens from the trigger's edge (`--ds-clip-from`) while it grows from `--ds-scale-popup`; opens above the trigger without room below; the exit only fades | `--ds-motion-origin`: the trigger | none | a close mid-entrance fades from where it is | back to the trigger for Escape or when focus was inside, never for a click outside |
| Combobox list | popover and div | `opacity` `--ds-dur-fast` `--ds-ease-in-out`; `scale` `clip-path` `--ds-dur-medium` `--ds-ease-spatial` | `opacity` `--ds-dur-instant` `--ds-ease-in-out` | as the menu, from the field; as wide as the field | `--ds-motion-origin`: the field | none | as the menu | focus stays in the input |

"Native and div": a `<dialog>` opened with `showModal()` and the div markup play the same transitions; "popover and
div": with `showPopover` and CSS anchor positioning the popup sits in the top layer (`data-anchored`), elsewhere the
script places it. The markup driven by hand, without `DS.overlay` (no `data-state`), plays the keyframes of rule 3's
"keyframes" rows instead. Every modal layer takes the counted scroll lock and joins the Escape stack
([DS.overlay](#dsoverlay-jsoverlayjs)).

### Controls

The controls (1.1) share one timing. Press feedback is the state layer, the ripple
([DS.ripple](#dsripple-jsripplejs)) and the shape morph: pills turn squarer while pressed
(`--ds-radius-action-pressed`, radio cards and interactive cards `--ds-radius-card-pressed`, tiles
`--ds-tile-radius-pressed`) and spring back on release; nothing scales except the switch handle. Disabled,
`aria-disabled` and busy controls neither morph nor show a press.

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
| button faces roll by `--ds-distance-sm` (`DS.motion.busy()`: the busy face after `--ds-delay-loader`, the success face for `--ds-hold-success`) | `--ds-dur-fast` in, `--ds-dur-instant` out | in: fade `--ds-ease-in-out`, rise `--ds-ease-out`; out: `--ds-ease-in` |
| validation message: fade, and its room opening while focus is in the form | fade `--ds-dur-fast`, room `--ds-dur-base` | fade `--ds-ease-in-out`, room `--ds-ease-out` |
| confirmation under a field (`.ds-field__hint--success`): as the validation message; turning from error to success replays nothing | fade `--ds-dur-fast`, room `--ds-dur-base` | fade `--ds-ease-in-out`, room `--ds-ease-out` |
| changed dot (`.ds-field--changed`): opacity only, its room always kept | `--ds-dur-fast` in, `--ds-dur-instant` out | in `--ds-ease-in-out`, out `--ds-ease-in` |
| search key (`.ds-search__key`): goes once the field has the focus or a value, comes back when it rests empty | `--ds-dur-instant` out, `--ds-dur-fast` back | `--ds-ease-in-out` |
| radio tile check (`.ds-radio__mark`): pops from `--ds-scale-small`, fades in; leaves faster | scale `--ds-dur-medium`, fade `--ds-dur-fast`; out `--ds-dur-fast` | scale `--ds-ease-spatial`, fade `--ds-ease-in-out`; out `--ds-ease-in` |
| radio tile tint with the indicator (`.ds-radios__indicator`): the pill glides, ring and check change at once | the indicator's travel | the indicator's ([Navigation](#navigation)) |
| slider handle halo (hover, press, focus); the value never glides while dragged | press `--ds-dur-micro`, release `--ds-dur-fast`, focus at once | `--ds-ease-in-out` |
| field rings of input groups, the filled field's bottom line, the composer shell: at once on focus, back on blur | `--ds-dur-fast` (blur) | `--ds-ease-in-out` |
| disabled look (colours and opacity) | `--ds-dur-fast` | `--ds-ease-in-out` |
| an input chip removed: `flip()` glides the chips after it into its place, focus goes to the neighbour | `flip()` (travel) | `--ds-ease-spatial` |
| an icon that fills when on (`.ds-icon--fillable`) | `--ds-dur-fast` | `--ds-ease-in-out` |
| actions on demand (`.ds-hover-actions`): in, out | `--ds-dur-fast`, `--ds-dur-instant` | `--ds-ease-in-out` |
| the lock of a locked switch rides its handle; it fades in, out | travel `--ds-dur-medium`; fade `--ds-dur-fast`, `--ds-dur-instant` | travel `--ds-ease-spatial`; fade `--ds-ease-in-out` |

What leaves takes 0.4-0.67 of what enters: the chip check, the checkbox mark and the radio dot 250 to 150ms, the
button faces, the switch words, the switch lock and the actions on demand 150 to 100ms, the icon swap 250 to 100ms,
the changed dot, the search key and the rail's labels 150 to 100ms, the radio tile check 250 to 150ms (tested).
Everything here is a transition, so a control rendered in its end state (a chip rendered selected, a box rendered
checked) stays still on load, and a rapid toggle turns back from where it is. A chip that wraps to another line glides there through
`flip()` (`DS.ripple.attach()` wires it); a removed validation message goes at once.

### Navigation

| Part | Motion |
|---|---|
| Indicator (`DS.indicator`) | the pill stretches towards its target: the leading edge moves on `--ds-ease-spatial`, the trailing edge follows after `--ds-indicator-lag` (`--ds-dur-micro`) on `--ds-ease-in-out`, over `travelDuration()` (`--ds-dur-medium` for a neighbour up to `--ds-dur-slow`); the labels change colour on the same `--ds-indicator-dur`; a pill that loses its item contracts and fades in `--ds-dur-fast`; the first placement jumps ([DS.indicator](#dsindicator-jsindicatorjs)) |
| Drawer, docked | stays still while views change (its pill glides live); coming back after a view without it, `DS.motion.enter(drawer)` slides it 24px in from the left with a fade (`.ds-enter--slide`: `--ds-dur-slow` on the spring); inside `transition()` the panel morphs over `--ds-dur-long` ([View transitions](#view-transitions)) |
| Modal drawer | the [Overlays](#overlays) rows "Modal drawer" and "Modal drawer scrim"; a window crossing 900px switches without motion (`.ds-drawer--instant`) |
| Segmented | the indicator's pill under the options; the label weight switches at once, `data-label` keeps the width; button options (`aria-checked`, `aria-pressed`) the same; a blocked option fades to the disabled model on `--ds-dur-fast` |
| Tabs | the bar under the selected tab is the indicator (`.ds-tabs__indicator`: it stretches and lands like the pill, over `travelDuration()`); the labels change colour on `--ds-indicator-dur`, the weight at once; the new panel enters with `.ds-enter--swap` (`DS.motion.enter(panel, 'swap')`), link tabs move by `transition({ type: 'fade-through' })`; press: the inner pill morphs (`--ds-dur-micro`, back on the spring) and ripples |
| Drawer groups | a `.ds-drawer__group` `<details>` opens and closes with the `.ds-collapsible` timing (`--ds-dur-medium` on `--ds-ease-out`, closing faster on `--ds-ease-in`), its chevron turns on the spring; the pill follows the current item across groups, contracts when its group closes (`--ds-dur-fast`) and grows back when it opens (`--ds-dur-medium`) |
| Rail | `data-drawer-collapsed`: the column switches at once (no layout animation); labels fade back in on `--ds-dur-fast` and out on `--ds-dur-instant`; the pill jumps with its item's new size |
| Banner | `.ds-banner` comes and goes through `DS.motion.flip(panel, ..., { items: ':scope > *' })`: the view glides on the spring, the banner fades in place; no height animates |
| Steps | a step turning done draws its check (`ds-draw`, `--ds-dur-medium` after `--ds-dur-micro`); marks and connectors change colour on `--ds-dur-medium`; `--bar` segments fill on `--ds-ease-value` over `--ds-dur-glide`; moving between steps: `transition({ type: 'forward' | 'back' })` |
| Top bar | still on every view change (the root snapshot); on scroll it tints to `--ds-topbar-scrolled-bg` and shows its hairline: scroll-driven (`ds-scroll-fade` over the first `--ds-space-2`) where supported, else `data-scrolled` over `--ds-dur-fast` (D33, [Scroll-driven effects](#scroll-driven-effects)) |

### Feedback

| Part | Motion |
|---|---|
| Shape loader (`.ds-loader`, in `.ds-boot` and `.ds-loading`) | fades in after `--ds-delay-loader` over `--ds-dur-medium` (`.ds-boot` after `--ds-delay-boot` over `--ds-dur-slow`), then morphs through the seven M3 shapes (`ds-loader-morph`, each step on the spring) while it turns (`ds-loader-turn`) over `--ds-loop-loader`; stays at least `--ds-hold-loader` (`settleLoader()`) |
| Arc spinner (`.ds-spinner`) | no delay of its own: it turns at once (its container delays it: `.ds-loading`, the busy face of a `.ds-btn`, or a `<span class="ds-enter ds-enter--delayed">` wrapper the page adds), `ds-spin` over `--ds-loop-spin` with the growing and shrinking arc (`ds-spinner-arc`, `--ds-loop-arc`); the determinate spinner glides its share like progress |
| Skeleton (`.ds-skeleton`) | fades in after `--ds-delay-loader`, then one calm diagonal wave crosses the whole surface (`ds-skeleton-wave` over `--ds-loop-skeleton`, after its entrance); with a loading bar, both share the delay |
| Progress (`.ds-progress`) | the share glides on `--ds-ease-value` over `--ds-dur-glide` (`--ds-progress`); the wave travels one wavelength per `--ds-loop-wave` (`ds-progress-wave`) and flattens at small shares and when complete; indeterminate: two segments (`ds-progress-head`, `ds-progress-tail` over `--ds-loop-indeterminate`), handing over to a share by fading out in `--ds-dur-fast` while the bar fades in |
| Loading bar (`.ds-loadbar`) | the indeterminate segments, flat, after `--ds-delay-loader`; `.ds-stale` dims the content only after the same delay and lifts at once |
| `countUp()` | from the shown value on `--ds-ease-value` over `--ds-dur-glide`, landing on the same frame as a bar set in the same task |
| Status chip | colour and icon glide over `--ds-dur-medium`; a new icon fades in and springs up from `--ds-scale-small` |
| Table | sort, filter and live reorder glide through `flip()`; a selected row tints over `--ds-dur-fast` (a pinned cell through its registered layer colours, the same timing); an expandable row opens its room on `--ds-ease-out` (`--ds-dur-medium`) and closes accelerating (`--ds-dur-base`); the sort arrow and the toggle chevron turn on the spring; the edge fades and the pinned column's hairline follow the scroll ([Scroll-driven effects](#scroll-driven-effects)); the selection bar and the toolbar cross in one slot (`crossfade()`: in over `--ds-dur-fast`, out over `--ds-dur-instant`) when the count goes from 0 to 1 and back, its count changes at once; a page change (`.ds-pagination`) dims the rows, then the new page fades in through `flip()` |
| Alert, tile, card | alerts come and go through `flip()`; a tile's figure counts with `countUp()`; clickable tiles and cards take the press morph; a selected tile or card tints over `--ds-dur-fast` and its ring shows at once |
| Badge (`.ds-badge`) | colours glide on `--ds-dur-fast`; a count that appears pops in (`enter(badge, 'pop')`), one that goes pops out; the number changes at once ([A count badge](#a-count-badge)) |
| Done state (`.ds-empty--done`) | the disc fades in and pops up on the spring (`ds-fade-in`, `ds-pop-in`, `--ds-dur-slow`) after `--ds-dur-base`; a ring widens and fades once behind it (`ds-ripple`) after `--ds-dur-slow`; the check draws itself (`ds-draw`, `--ds-dur-glide`, `--ds-ease-out`); only when the element is inserted or shown |
| Save bar (`.ds-savebar`, `DS.overlay.savebar()`) | the `.ds-presence` transitions: fades in over `--ds-dur-fast` and grows from `--ds-scale-enter` at its bottom edge on the spring over `--ds-dur-medium`, leaves in `--ds-dur-fast` accelerating; a toggle mid-way turns back from where it is; the snackbars glide above it and back (`--ds-toast-lift`, `data-follow`); the view's room comes and goes at once (no layout motion) |
| Row list, timeline | rows and entries come and go and reorder through `flip()` with keyed items: they glide on an opaque backing, new ones fade in over `--ds-dur-fast` (`.ds-list__item` sets `--ds-enter-duration`), a removed one fades out while the ones below close the gap and focus moves to its neighbour; live feeds pass `live: true`; the current row tints over `--ds-dur-fast`; interactive rows press with the state layer and the ripple, no morph. The timeline has no motion of its own (and is unrelated to scroll timelines) |
| Disclosure | `.ds-disclosure` opens and closes as a `.ds-collapsible` (its room on `--ds-ease-out` over `--ds-dur-medium`, closing faster on `--ds-ease-in`) while the `.ds-chevron` turns on the spring; the plain summary presses like a pill (state layer, ripple, the morph), an accordion row (`.ds-disclosure--row`) like a row (no morph) |
| Tasks | a status change swaps the mark at once (its glyph is the state); a step that turns done in place draws its tick (the mark's `stroke-dashoffset`, which the `pathLength="1"` tick inherits, from 1 to 0 over `--ds-dur-medium` after `--ds-dur-micro` on `--ds-ease-out`); a transition, so a list rendered with done steps stays still on load; the running mark is the small spinner |
| Charts | meters and columns fill from zero on the first render (`.ds-enter--fill`: `ds-fill-share` over `--ds-dur-glide` on `--ds-ease-value`, with the fade); later values glide on the same curve and time (`--ds-share`, a registered number), landing on the same frame as a `countUp()` figure set in the same task; a column's value rides on its fill; interactive columns press with the state layer and the ripple, no morph |

### Data motion

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
DS.motion.flip(stack, () => stack.prepend(alert), { live: true });  // live insert: held while pointed at
```

With `live: true`, a `mutate` without parameters (a plain DOM call) waits whole while the list is pointed at or
focused, and glides once the pointer or focus leaves (1.6.1); one that takes the options gets `holdOrder: true` and
should then leave the order alone, as `DS.dom.morphHtml` does.

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

A page change (`.ds-pagination`): the rows dim (`.ds-stale` and the loading bar, as in a refresh) while the page
loads, then render through `flip()`; every key is new, so the old rows go at once and the new ones fade in. No
count-up, no slide; the range text changes at once.

```js
content.classList.add('ds-stale');
const rows = await fetchPage(page);
DS.motion.flip(tbody, (options) => DS.dom.morphHtml(tbody, renderRows(rows), options), { items: 'tr' });
content.classList.remove('ds-stale');
range.textContent = `${first}–${last} of ${total}`;
```

A bulk selection: the toolbar and the `.ds-selection-bar` share one slot; `crossfade()` swaps them only when the count
goes from 0 to 1 and back, and the count text changes at once.

```js
if (count > 0 && !shown) DS.motion.crossfade(slot, selectionBar);
if (count === 0 && shown) DS.motion.crossfade(slot, toolbar);
countText.textContent = `${count} selected`;
```

Empty states: replacing a skeleton, `.ds-reveal`; the result of a filter, search or live update, the rows leave
through `flip()`, then `DS.motion.enter(empty, 'fade')` (no rise); the filter cleared, `DS.motion.leave(empty)`
while the rows enter through `flip()`; the user deleted the last item, the disc pops in with
`DS.motion.enter(disc, 'pop')`.

### Views

Moving from one view to another is navigation, and it has its own motion (Material 3's transition patterns, chosen
by how the two views relate, D15), played by `DS.motion.transition(update, { type, from })`
([View transitions](#view-transitions)).

| Type | When | Motion |
|---|---|---|
| `'fade-through'` (default) | between top-level destinations (the drawer, a tab of the top bar), another row in an open side sheet, a theme switch | the old view goes in `--ds-dur-instant`, accelerating; then the new one fades in and grows from `--ds-scale-enter` in place (`--ds-dur-medium`) |
| `'forward'` | a step into a sequence: the next record, the next page of a wizard | shared axis X: the old view leaves 24px to the start while the new one comes 24px from the end, travelling with its fade, both on the spring and landing together at `--ds-dur-slow`, with the fades of fade-through |
| `'back'` | the step back | the same, mirrored |
| `'container'` | from a card or row into its detail, and back | `from` grows into the element `update` returns, on the spring over `--ds-dur-long`, as one surface: the detail's image is live and opaque from the first frame, and the card's image lies on it and fades out within `--ds-dur-fast` |
| fallback (D30) | no View Transitions, or `.ds-theme` on a wrapper (an embedded widget) | the update runs at once and the new view fades through with `.ds-enter--swap` (a 4px rise over `--ds-dur-medium`), without a shared element |

The top bar stays still in every type; the docked drawer shows live, so its pill glides to the new item.

## Interruption

One mechanism (D21): read the current values, cancel the running motion, then play from there to the new target
with the curve of the new direction. Nothing jumps to its end, restarts from zero or plays an entrance in reverse.

- **CSS transitions** carry it by themselves: a transition that is turned back starts from the current value and
  takes the timing of the state it moves to. That is why every layer toggled again and again runs on transitions
  keyed on a state (`data-state` of `DS.overlay`, `aria-pressed`, `:checked`, `[open]`): the exit's curve on the way
  out, the entrance's on the way back.
- **One-shot keyframes** (`.ds-enter`, `.ds-leave`, `roll()`) cannot reverse. `DS.motion` reads the computed
  `opacity`, `translate`, `scale` and `clip-path`, cancels the CSS animation and plays each track of the new motion
  from there through `el.animate([current, target], { duration, easing })` (id `ds-handoff`), on the new
  direction's curve, for the share of the duration still to go (at least `--ds-dur-micro`). A `linear()` curve that
  the engine cannot parse in `el.animate()` falls back to its cubic.
- **Movement measured by script** (FLIP, the indicator, the chip slot) reads where each item is painted now and
  glides on from there to the new target: a second call mid-flight retargets without a jump.
- **Waits** (`settled()`, the overlay promises) resolve for the motion that ran: a later call supersedes an earlier
  one, whose promise then resolves without acting (a generation token per element).

The Motion Lab shows every reversible demo with "Rapid toggle" (five toggles 80ms apart) and "Reverse at 50%";
`test/browser/lab.spec.js` checks that rapid toggles end in the state the count implies and that a reversal is
continuous, frame by frame, in every engine.

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
| `ds-pop-in` | `scale` from `--ds-motion-scale` (default `--ds-scale-small`) | badges, counters, the disc of `.ds-empty--done` |
| `ds-drop-out` | `translate`: down (default 8px) | small exits; with `ds-fade-out` |
| `ds-shrink-out` | `translate` + `scale`: down (default 4px) to `--ds-motion-scale` (default `--ds-scale-enter`) | dialogs, cards leaving |
| `ds-shift-out` | `translate`: sideways (default 12px) | side sheets (full width, no fade), drawers leaving |
| `ds-pop-out` | `scale` to `--ds-motion-scale` (default `--ds-scale-small`) | badges, counters leaving |
| `ds-clip-in` / `ds-clip-out` | `clip-path` from / to `--ds-clip-from` (default: closed towards the top edge), open `--ds-space-6` beyond the box (the resting clip of the popups) so the shadow shows | a popup revealed from its trigger edge: the combobox list and the menu shown by hand (`DS.overlay` uses transitions) |
| `ds-draw` | `stroke-dashoffset` from `--ds-draw-length` (default 1): the glyph carries `pathLength="1"` (e.g. `check`) and the element sets `stroke-dasharray: 1` | a check after success; play it on the `<svg>` and let the path inherit the offset (the chip check does): Chromium can miss a class or state change above a `[pathLength]` selector and restyle the path late |
| `ds-fill-share` | the registered `--ds-share` from 0 to the mark's own value | chart marks (`.ds-meter`, `.ds-columns__col`) filling on first render: their fill is clipped at the share, so its round end keeps its shape (`.ds-enter--fill`) |
| `ds-fill-x` / `ds-fill-y` | `scale: 0 1` / `scale: 1 0`, multiplying the element's own `scaleX()` / `scaleY()` | bars and columns filling on first render; deprecated in 2.0 (removed in 3.0 at the earliest) with `.ds-enter--fill-x` / `--fill-y`, which still play them: a scaled bar squashes its round end, use `ds-fill-share` |
| `ds-roll-in` / `ds-roll-out` | `translate`: one line up into / out of its slot | a status line that changes (`roll()` starts the new line once the old one is half out, so they never cover each other) |
| `ds-press-ripple` | `scale` from 0 (its fade is a separate track) | the pointer ripple of an action (`DS.ripple`) |
| `ds-ripple` | a ring that widens (`scale` to `--ds-ripple-scale`, 1.6) and fades once | behind a confirmation (`.ds-empty--done`) |
| `ds-spin` | `rotate`: one turn, a loop | one turn of the spinner (`--ds-loop-spin`) |
| `ds-spinner-arc` | `--ds-spinner-arc` (sweep 10deg → 270deg → 10deg) and `--ds-spinner-start` (advancing 270deg per cycle), generated; a loop of four cycles | the M3 arc of the spinner, with `ds-spin` (`--ds-loop-arc`, linear) |
| `ds-loader-morph` | `clip-path`: the 7 M3 shapes as 64-vertex `polygon()`s at k/7, generated; a loop | the shape loader, on `--ds-ease-spatial` over `--ds-loop-loader` (every step lands with the spring) |
| `ds-loader-turn` | `rotate` to `1turn`, a loop | the shape loader turning while it morphs (`--ds-loop-loader`, linear) |
| `ds-progress-head` / `ds-progress-tail` | `--ds-progress-head-1`, `--ds-progress-head-2` / `--ds-progress-tail-1`, `--ds-progress-tail-2` (0% → 100%, each on its M3 curve and window), generated; a loop | two-segment indeterminate progress (`--ds-loop-indeterminate`, linear) |
| `ds-progress-wave` | `mask-position` (and `-webkit-mask-position`, for Chrome/Edge before 120) by one `--ds-progress-wave-length`, a loop | the travelling wave of determinate progress (`--ds-loop-wave`, linear) |
| `ds-skeleton-wave` | `--ds-skeleton-x` (a sine in-out sweep from -150vw to 50vw over 60% of the loop, then a rest), generated; a loop | the one diagonal wave across a skeleton surface (`--ds-loop-skeleton`, linear) |
| `ds-scan` | `translate`: a band from `--ds-scan-from` to `--ds-scan-to` | media being processed |
| `ds-scroll-fade` | opacity 0 → 1, both ends named; scroll-linked | the panel's hairline, the top bar's tint and a sheet head's hairline over the first `--ds-space-2` of scroll (no duration); the element's own opacity stays 0, so a scroller without overflow (an inactive timeline) shows nothing; progressive: `animation-timeline`, elsewhere `data-scrolled` |
| `ds-scroll-edge-start` / `ds-scroll-edge-end` | `--ds-scroll-edge-start` (0 → 1) / `--ds-scroll-edge-end` (1 → 0), registered numbers; scroll-linked, so both ends are named | the edge fades of a sideways scroller (`.ds-scroll-x`, the table wrappers; menus on the block axis), on its own `scroll(self inline)` timeline over `animation-range: 0 var(--ds-space-8)` and `calc(100% - var(--ds-space-8)) 100%` (no duration): the numbers scale the fade length (`--ds-scroll-fade`), so a scroller that fits fades nowhere; progressive: `animation-timeline`, elsewhere `data-ds-overflow-start` / `-end` from `DS.dom.scrollEdges()` over `--ds-dur-fast`, or the static table fade |
| `ds-edge-fade` | `--ds-table-fade-start` (0 → `--ds-card-pad` over the first 5%) and `--ds-table-fade-end` (`--ds-card-pad` → 0 over the last 5%), registered lengths; scroll-linked, so both ends are named | **deprecated** (2.0, removed in 3.0 at the earliest) and unused: the table wrappers run `ds-scroll-edge-start` and `ds-scroll-edge-end` |

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

## Utilities (CSS)

| Class | Effect |
|---|---|
| `.ds-enter` | one-shot entrance: fade + 8px rise, 250ms; the fade on the standard curve, the movement on the spring (`--ds-ease-spatial`); plays once, also on an element with its own loop |
| `.ds-enter--fade` | fade only |
| `.ds-enter--scale` | fade + rise from .98 (dialogs) |
| `.ds-enter--slide` | fade + 24px from the side (`--ds-motion-distance`, default from the right), 350ms, on the spring (a panel slid in by hand; side sheets and the modal drawer slide their full width). A drawer coming back: `DS.motion.enter(drawer)` slides it in from the left with the same keyframes, duration and curves (`.ds-drawer.ds-enter`), so it equals `enter(drawer, 'slide')` |
| `.ds-enter--swap` | fade + 4px: content replacing a placeholder or another view |
| `.ds-enter--delayed` | fade after `--ds-delay-loader` (loaders) |
| `.ds-enter--pop` | fade + scale from `--ds-scale-small` (a badge or counter that appears) |
| `.ds-enter--fill` | fade + a chart mark filling from zero to its `--ds-share` (`ds-fill-share`), 600ms on the value curve (`--ds-ease-value`, never overshoots): meters and columns, first render only (`enterAll(marks, 'fill', { stagger: false })`); later values transition on the same curve |
| `.ds-enter--fill-x` / `--fill-y` | **deprecated** in 2.0 with their keyframes `ds-fill-x` / `ds-fill-y` (removed in 3.0 at the earliest; use `.ds-enter--fill` with `--ds-share`): fade + a bar or column growing from zero to its own `scaleX` / `scaleY` (the element sets `transform` and `transform-origin`), 600ms on the value curve (`--ds-ease-value`, never overshoots): meters and charts, first render only |
| `.ds-leave` | one-shot exit: fade, 150ms, accelerating (`--ds-leave-easing`, default `--ds-ease-in`), starts at once |
| `.ds-leave--sink` / `--scale` / `--slide` | `ds-fade-out` plus 8px down (150ms) / smaller to .98 (200ms) / 12px sideways (200ms) |
| `.ds-leave--pop` | `ds-fade-out` plus a scale to `--ds-scale-small`, 150ms (a badge or counter that goes) |
| `.ds-stagger` | its children fade in and rise 4px one after the other (`--ds-i` x 30ms); where `sibling-index()` exists, CSS-only lists number themselves |
| `.ds-reveal` | fade-through with the smallest rise, for freshly loaded content |
| `.ds-reveal--scroll` | opt-in for long read-only pages (reports, overviews): `ds-fade-in` (linear) and `ds-lift-in` from `--ds-distance-md` (`--ds-ease-out`) on a `view()` timeline, over `entry 0%` to `entry calc(4 * var(--ds-space-6))`: the block is opaque once 96px of it are in view, scrolling back reverses it, a block already passed shows its end state. Never on tables, rows, forms or anything typed into or searched, and not with `.ds-enter` or `.ds-reveal` on the same element. Progressive: `animation-timeline: view()`; elsewhere, and in print, it is static and never hidden |
| `.ds-collapsible` | on `<details>`: the content opens over `--ds-dur-medium` on `--ds-ease-out` (its height pushes what follows, so it never overshoots) while it fades in, and closes faster, accelerating (`--ds-dur-base` on `--ds-ease-in`, the fade in `--ds-dur-fast`). Its clip reaches out by `--ds-space-3` (`overflow-clip-margin`, 12px: the focus ring at its snap start plus about `--ds-space-1`), so the ring of a control flush with the content edge is never cut; larger shadows (`--ds-elev-2`/`-3`) may still be cut a little. Progressive: `interpolate-size`, `::details-content`, `transition-behavior: allow-discrete`, `overflow-clip-margin`; elsewhere it opens and closes at once, and where `overflow-clip-margin` is missing the content's own padding should equal that ring room. Add a `.ds-chevron` to the summary: it turns with the expansion, and the summary drops its native marker |
| `.ds-chevron` | a disclosure chevron: turns 180deg on the spring (`--ds-dur-medium`, `rotate`) in the summary of an open `<details>` or under `aria-expanded="true"` (a table row's `.ds-table__toggle`); `.ds-errors__chevron` turns the same way |
| `.ds-presence` | a project element toggled with `hidden`, as a `[popover]` or as a `<dialog>` without `DS.overlay`: fades in (`--ds-dur-fast`) and grows from `--ds-motion-scale` (default `--ds-scale-popup`) on the spring (`--ds-dur-medium`), its clip opening from `--ds-clip-from` when set (`originFrom()`); leaves in `--ds-dur-fast`, accelerating; `display` and `overlay` step with `allow-discrete`, so it stays rendered (and in the top layer) through its exit. Transitions, so a toggle mid-way continues from where it is. Progressive: `@starting-style`, `allow-discrete`, `:popover-open`; elsewhere an instant toggle. The lists also carry the element's own state transitions (2.0: `background-color`, `color`, `border-color`, `box-shadow` on `--ds-dur-fast`, the `outline-offset` focus snap), so a pill inside keeps its hover and focus motion; put it on a wrapper, never on a `.ds-btn`, `.ds-chip` or `.ds-card` (tested) |
| `.ds-presence--keep` | presence that keeps its box (2.0): toggled by the page's `data-ds-shown`; hidden is `opacity: 0` and `visibility: hidden` (out of the tab order, nothing around it moves), shown fades in over `--ds-dur-fast` and hides in `--ds-dur-instant` (exit 0.67), `visibility` stepping at the end of the exit. Baseline everywhere (no `@starting-style` needed): a pill that shows on hover, a jump button whose room stays reserved |
| `.ds-view--leaving` | **deprecated** (since 2.0, removed in 3.0 at the earliest): use `DS.motion.transition()`. Quick fade-out of a view's children before a swap (`--ds-dur-instant`, accelerating); `DS.motion.transition()` replaces it ([View transitions](#view-transitions)). The swap sequence without a helper: add it, `await DS.motion.settled(content, { event: 'transitionend', property: 'opacity' })` on the view's content element (`.ds-content`, not the sentinel), return if a newer swap started meanwhile (a counter), replace the content, then in the same task remove the class and `DS.motion.enter(newContent, 'swap')`, so the new view never shows at full opacity for a frame ([App frame](components.md#app-frame)) |
| `.ds-theme::view-transition-*` | the motion of `DS.motion.transition()`, keyed on `data-ds-vt` on `<html>` (no keyframes of their own). Root (the top bar and everything unnamed): the browser's crossfade over `--ds-dur-fast` on `--ds-ease-in-out`. Every group: `--ds-dur-slow` on `--ds-ease-spatial`. Fade-through (`ds-view`, `ds-sheet-body`, also on page loads): old `ds-fade-out` (`--ds-dur-instant`, `--ds-ease-in`); new `ds-fade-in` (`--ds-dur-medium`, `--ds-ease-in-out`) with `ds-grow-in` from `--ds-scale-enter` in place (`--ds-dur-medium`, the spring), both after `--ds-dur-instant`. Shared axis (`forward`, `back` mirrored): the old view adds `ds-shift-out` to `-24px` (`--ds-distance-xl`, `--ds-dur-slow`), the new one comes with `ds-shift-in` from `24px` together with its fade (`--ds-dur-medium` after `--ds-dur-instant`), both on the spring, landing together. Container (`ds-container`): the group over `--ds-dur-long` on the spring, the new image live and opaque, the old one on top of it with `ds-fade-out` (`--ds-dur-fast`), both images as wide as the group, from its top, clipped to it. Snackbars (`ds-toasts`): the group at `--ds-z-toast`, only the live new image (a message that goes with the update fades out over `--ds-dur-fast`). A panel on one side only (a page load from under the modal drawer or an overlay) crossfades over `--ds-dur-fast`. The docked drawer (`ds-drawer`) shows live, so its pill glides as on a click. A view with or without the drawer (`data-drawer-hidden` toggled inside the update; `transition()` then sets `data-ds-vt-morph`): the `ds-panel` and `ds-view` groups morph over `--ds-dur-long` on the spring (the panel's surface stretched, the view's content at its natural size from the top left, cut by the group), the drawer leaves with `ds-fade-out` (`--ds-dur-fast`) and `ds-shift-out` to `-24px` (`--ds-dur-base`, `--ds-ease-exit`) or comes back with `ds-fade-in` (`--ds-dur-medium`) and `ds-shift-in` from `-24px` (`--ds-dur-long`, the spring); the page's surfaces stack above the drawer, the drawer above an indicator's group. Progressive: View Transitions, with `.ds-theme` on `<html>` |
| `.ds-swap` | a slot whose children share one grid cell (`inline-grid`, clipped), so outgoing and incoming content cross without a width jump; `DS.motion.roll()` and `crossfade()` make it |
| `.ds-swap--fade` | a soft slot edge (2.0): the slot takes `--ds-swap-fade` (default `--ds-space-2`) of room above and below, given back by a negative margin, and a static vertical mask fades it, so rolled lines appear from and leave behind soft edges; nothing in the mask animates |
| `.ds-vt-view` | a view outside the app frame (2.0: a wizard, a sign-in page): named `ds-view` only while `DS.motion.transition()` runs (`.ds-theme[data-ds-vt] .ds-vt-view`), so it plays every type like `.ds-view`; without View Transitions its first child enters with `.ds-enter--swap`. One per page, never inside `.ds-app`. Progressive: View Transitions |
| `.ds-icon-swap` | two icons in one cell, `.ds-icon-swap__a` and `.ds-icon-swap__b`: `data-swap="b"` (or, without `data-swap`, an ancestor with `aria-pressed="true"`) shows b. The incoming icon fades in (`--ds-dur-fast`) and springs up from `--ds-scale-small` (`--ds-dur-medium`), a `pathLength="1"` glyph in b draws itself (`stroke-dashoffset`, `--ds-ease-out`); the outgoing one only fades (`--ds-dur-instant`, accelerating). Transitions: nothing plays on the first render, a rapid toggle turns back from where it is. A crossfade with a scale, not a path morph; `crossfade(el, icon, { kind: 'icon' })` makes it |

The utilities sit in the `ds.utilities` layer, so they beat a component's own animation; unlayered project
animations beat the utilities. Loaders are the exception for `.ds-stagger` and `.ds-reveal`: a `.ds-skeleton`,
`.ds-loading`, `.ds-boot`, `.ds-loader` or `.ds-spinner` placed directly in `.ds-stagger` (or given `.ds-reveal`) keeps its own
animation: a skeleton, `.ds-loading`, `.ds-boot` or `.ds-loader` its loader delay (skeleton placeholders in a
staggered grid never flash), a `.ds-spinner` its loop (it has no delay of its own).
`.ds-enter` and `.ds-leave` still replace a loader's animation, except that `.ds-leave` on a `.ds-loadbar` or a
`.ds-skeleton` keeps its loop running (the segments and the wave move on while the exit fades them out).

Per-element settings, registered in `src/motion.css` with `inherits: false`: they take tokens only, are set on the
animating element and never reach its descendants: `--ds-motion-distance` (travel of lift, grow, shift, roll, drop,
shrink), `--ds-motion-scale` (start of grow and pop-in, end of shrink and pop-out), `--ds-motion-origin` (where a
popup grows from), `--ds-clip-from` (the hidden end of `ds-clip-in` / `ds-clip-out`), `--ds-draw-length` (start of
a drawn stroke), `--ds-enter-keyframes`, `--ds-enter-duration`, `--ds-enter-easing`, `--ds-enter-delay`,
`--ds-leave-keyframes`, `--ds-leave-duration`, `--ds-leave-easing` and `--ds-i` (the stagger step, an integer).
Unregistered (they inherit): `--ds-scan-from`, `--ds-scan-to`, `--ds-ripple-opacity`, `--ds-ripple-scale`.

## JS

Five modules, loaded together as `dist/ds.js` (`window.DS`) or one by one from `dist/js/` ([install.md](install.md)):
`DS.motion` (timing, entrances and exits, waits, FLIP, figures, view transitions), `DS.dom` (keyed re-renders),
`DS.indicator` (sliding pills), `DS.ripple` (press ripples) and `DS.overlay` (dialogs, sheets, the modal drawer,
popups, tooltips and snackbars); `DS.icons` is in [icons.md](icons.md). JS timing always comes from the computed
tokens, so `--ds-time-scale` slows JS and CSS together.

### DS.motion (js/motion.js)

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
| `enter(el, variant?)` | plays `.ds-enter` (+ `fade`, `scale`, `slide`, `swap`, `delayed`, `pop`, `fill`, `fill-x`, `fill-y`; the last two **deprecated**) once, removes every `ds-enter*` / `ds-leave*` class afterwards; clears `hidden` and `inert` first and records the focused element outside `el` as its opener; returns a Promise |
| `leave(el, variant?, { then, focus })` | plays `.ds-leave` (+ `sink`, `scale`, `slide`, `pop`). Focus inside `el` first moves to `focus` (an element or a function returning one), else the opener, else the closest `tabindex="-1"` ancestor, else it is dropped; then `el` is `inert` for the exit. `then`: `'remove'` (default; meanwhile `el` carries `data-ds-leaving`, a pending removal that `DS.dom.morphHtml` and `flip()` skip, taken back by `enter()` or `cancel()`), `'hide'` (sets `hidden`, which hides any ds component inside `.ds-theme`, also without `.ds-base`; clears `inert` and the classes) or `'keep'` (stays in the DOM, invisible and inert, until `enter()` continues from there or `cancel()`) |
| `cancel(el)` | calls off what `enter()` / `leave()` started: no continuation runs, the classes and handoffs go, the `inert` that `leave()` set is cleared; the element shows its rest state at once |
| `enterAll(elements, variant?, { stagger, max, visibleOnly })` | `enter()` for many elements in batches (one style flush, one read of the rects): staggered by `--ds-i` (`stagger: true`, at most `max` = `STAGGER_MAX`), items entirely outside the viewport show at rest (`visibleOnly: true`), items still moving continue without a step; each batch removes the `--ds-i` it wrote once everything settled, and a later `enter()` or `enterAll()` on an item drops it at once (a page's own `stagger()` steps stay) |
| `staggerOnce(container, { variant, max })` | the first-render stagger: `enterAll()` on the children in view, never a `data-ds-keep` helper such as the `data-scrolled` sentinel (1.6.2; default variant `swap`, the 4px rise of `.ds-stagger`); marks the container `data-ds-staggered`, so later calls resolve at once without motion; leaves no classes or `--ds-i` behind |
| `stagger(elements, { from, max })` | numbers items for staggering (`--ds-i`, read by `.ds-enter` and `.ds-stagger > *`, set through the CSSOM, CSP-safe); at most `STAGGER_MAX` + 1 steps |
| `STAGGER_MAX` | 5 (six steps: 0 to 5) |
| `replay(el, ...classes)` | restarts a one-shot class the element may already carry (a style flush, no layout; works on SVG) |
| `settled(el, { names, property, transitions, subtree, timeout, event })` | resolves when the element's own finite animations finish or are cancelled: the CSS animations in `names` (all without it), `ds-handoff` animations, CSS transitions only with `transitions: true` (of `property` if given; `event: 'transitionend'` waits for transitions only); never pseudo-elements, loops or scroll-driven animations (they follow the scroll, not time; the handoffs and `flip()` leave them be too); `subtree: true` includes descendants. Call it right after the class change. With nothing running it resolves on the next frame; the ceiling is `timeout`, else the end of the longest animation it waits for plus 100ms |
| `motionDuration(el, token)` | a duration token as computed on `el`, in ms, `--ds-time-scale` included; `MOTION_FALLBACKS[token]` outside a `.ds-theme` |
| `motionEasing(el, token)` | an easing token as computed on `el` (`cubic-bezier()` or `linear()`); the cubic of `MOTION_FALLBACKS` outside a `.ds-theme` |
| `travelDuration(el, px)` | the travel rule of FLIP and the indicator: `--ds-dur-medium` plus up to `--ds-dur-slow` by distance (all of it at 480px) |
| `MOTION_FALLBACKS` | frozen fallbacks by token name: the ms of every `--ds-dur-*`, `--ds-delay-*` and `--ds-hold-*`, the cubic of every `--ds-ease-*` (the spring falls back to `--ds-ease-out`); tested against `tokens.css` |
| `LOADER_DELAY_MS` | 200, equals `--ds-delay-loader` |
| `LOADER_MIN_VISIBLE_MS` | 450: a loader that appeared stays at least this long |
| `loaderHoldMs(startedAt, now?, { element, delay, minVisible })` | how much longer a loader inserted at `startedAt` must stay (0 if it never showed). With `element` (the loader) the times are its computed tokens, time-scaled: the delay `--ds-delay-boot` when it is or sits in a `.ds-boot`, else `--ds-delay-loader`, the minimum `--ds-hold-loader` (2.0); without it `LOADER_DELAY_MS` and `LOADER_MIN_VISIBLE_MS`; explicit `delay` and `minVisible` win |
| `settleLoader(startedAt, { now, element, delay, minVisible })` | Promise that waits for `loaderHoldMs` with the same options (`now` defaults to `Date.now()`); with `element` (the loader) the times come from its computed tokens. A number as the second argument (`now`, then the options third) is **deprecated** (2.0, removed in 3.0 at the earliest) and still works: pass `{ now }` |
| `refresh(container, load, { signal, loadbar })` | the documented refresh as one call (2.0): `container` gets `.ds-stale` and `aria-busy="true"` at once (it dims only after `--ds-delay-loader`); when it sits directly in `.ds-content` or `.ds-page` a `.ds-loadbar` goes in at the top of that parent (`loadbar: false` keeps it out); then `load()` runs. Once it settled, a bar that showed stays for `--ds-hold-loader` (`settleLoader()`), leaves (`leave()`), the stale state goes and the Promise resolves with the data: render it right after the `await`, so the old content never shows undimmed. On a rejection or an abort of `signal` it cleans up the same way and rethrows (an `AbortError` when aborted). Two refreshes of one container share the bar and the stale state until the last one settled |
| `busy(button, work, { done })` | runs `work` (a function, called at once, or a promise) while the button shows it works, through the faces of [components.md](components.md#button): `aria-busy="true"` at once (the busy face shows after `--ds-delay-loader`, so fast work changes nothing; the first call installs `guard()`, so the button is blocked for every input); a busy face that showed stays for the loader minimum (the `settleLoader()` path); on success `aria-busy` goes and, when the button has a success face (`.ds-btn__face--done`) and `done` is not `false`, `.ds-btn--done` shows it for `--ds-hold-success`; a button without one is usable at once, also with `done: true` (2.0; before, it showed nothing and stayed blocked). On failure `aria-busy` goes at once and the error is rethrown. A call while busy returns the running promise without starting `work` again; a call during the success face takes it off first. Times are computed tokens (`--ds-time-scale` applies). Returns a Promise of the work's result, once the button is no longer busy. Announcing the result stays the page's job (`aria-live`) (1.1) |
| `guard(root?)` | blocks what says it is blocked, for every input (2.0): a click, a middle click (`auxclick`), Enter or Space (they arrive as clicks), a label click (it arrives as a click on its input) and a form submission (by its `submitter`, also the default button of Enter in a field) never reach the page's listeners or their default action when the target is inside `.ds-theme` and inside a busy or done `.ds-btn` (`[aria-busy="true"]`, `.ds-btn--done`) or an `aria-disabled="true"` action (`a`, `button`, `input`, `summary` and the roles `button`, `switch`, `checkbox`, `radio`, `tab`, `option`, `menuitem`, `menuitemcheckbox`, `menuitemradio`), and not inside `[data-ds-guard="off"]` (a control that explains itself on click). Focus, hover and tooltips stay, so the reason still shows; a region with `aria-busy` (a container under a loading bar) is no action and stays usable. Capture-phase listeners on the window of `root` (default the document; a shadow root listens on itself), installed once per root and shared: `busy()` installs it on its first call; a page that blocks actions without `busy()` calls it once at start-up. Only user input is blocked, never the page's script. Returns `{ destroy() }`, which lets go of this call's hold (the last holder removes the listeners) |
| `setLabel(button, text)` | sets the label of a button without dropping what it holds (2.0): the text of its rest face (the `.ds-btn__face` that is neither `--busy` nor `--done`) on a faces button, else its own text; icons and the ripple layer stay. While `busy()` runs or the success face shows, the new label waits and shows once the button is back at rest, so the faces keep one width while they roll |
| `countUp(el, to, { from, format, duration, win })` | counts a key figure from the value it shows (the last value it wrote, or one that a re-render such as `DS.dom.morphHtml` wrote since and that reads back through `format`, 1.6.1; a figure that does not read back lands at once; 0 on the first call, or `from`) to `to`, up or down, on `--ds-ease-value` over `--ds-dur-glide` (`COUNT_UP_MS` outside a theme), on a clock animation of the element (id `ds-count`, no keyframes) that starts in the same frame as a CSS transition set with it, so a figure and its progress bar land together (and pausing or seeking the page's animations holds the figure). A new call takes over from the shown value (one count per element); the same value changes nothing. While it counts the element is `aria-busy`, keeps the width of its wider string and shows tabular figures (kept). `duration: 0`, a non-finite value or no animation frames show the value at once; a disconnected element gets the final value. Returns `{ cancel, finished }`: `cancel()` writes the final value, `finished` resolves once it is written (or a later call took over) |
| `COUNT_UP_MS` | 600, equals `--ds-dur-glide` |
| `originFrom(trigger, panel)` | where a popup grows from: writes `--ds-motion-origin` (the trigger's centre projected onto the panel, clamped, in px) and `--ds-clip-from` (the panel closed towards the trigger, with its radius; the other three edges `--ds-space-6` beyond the box, like a popup's resting clip) on the panel; `trigger` is an element or a `{ x, y }` point (a context menu). Call it once the panel is laid out. Returns `{ origin, side }`, `side` being where the panel lies: `'bottom'`, `'top'`, `'right'` or `'left'` |
| `roll(el, text, { hold })` | a status line that changes: `el` becomes a `.ds-swap` slot, the old line rolls up and out (`ds-fade-out`, `ds-roll-out`, `--ds-dur-fast`, accelerating), the new one rolls in from below (`ds-fade-in`, `ds-roll-in` on the spring, `--ds-dur-medium`) once the old one is half out (`--ds-enter-delay`: half of `--ds-dur-fast`; 1.6.2), so the two lines never cover each other. A roll during a roll continues from where each line is; only the last text stays. Returns a Promise. `hold: true` (2.0): every line stays readable: a new line waits until the current one has shown for `--ds-hold-status` (900ms), and a later text during the wait replaces the waiting one, so only the latest rolls; the Promise is the one of the roll that ran. A call without `hold` rolls at once and calls off a waiting line. Give the slot `.ds-swap--fade` for soft edges |
| `transition(update, { type, from, focus })` | moves to another view, for navigation only (never data): `type` `'fade-through'` (default, between destinations), `'forward'` / `'back'` (shared axis X) or `'container'` (`from` grows into the element `update` returns); any other type throws a `TypeError`. With View Transitions and `.ds-theme` on `<html>` the page is snapshotted while `data-ds-vt="<type>"` on `<html>` names the view, panel, docked drawer and sheet body (the top bar stays still; named indicators are lifted, the drawer shows live); a running one is skipped, every update runs in call order, and an update still pending after `--ds-dur-long` loses its motion (the page is frozen while one runs: fetch first, then swap quickly; a press meanwhile skips the motion and its click lands on the element under the pointer); a snackbar region with messages is named `ds-toasts` and stays on top. Elsewhere, or for an embedded widget, the update runs at once and the returned element (else the first child of the themed `.ds-view`) enters with `.ds-enter--swap`. Elsewhere, a `.ds-vt-view` (a view outside the app frame, 2.0) takes the place of the `.ds-view`: its first child enters. `focus` (2.0, default `false`): `true` moves focus once the update ran, when it was lost (on `<body>`, in the content that left, or in the modal drawer the update closed), to the returned element's first `h1[tabindex="-1"]`, else the view, else the element (`preventScroll`); a function `(incoming) => Element | null` chooses; focus the page put somewhere stays. Returns a Promise that resolves once the update ran and the motion ended (rejects with the update's error) (1.5) |
| `resyncScroll(root?)` | restarts the scroll-driven animations (hairlines, top bar tint, table edge fades, `.ds-reveal--scroll`) whose scroller stopped overflowing: Chromium and WebKit keep their last progress on an inactive timeline. It waits two frames (a timeline sees a new layout only a frame or two later) and only touches animations whose timeline is inactive but still has a progress; `root` (an element or the document, the default) limits it to the scrollers in and around it and the animations of its descendants. `transition()` calls it after every update; a page calls it after a change in place that may shrink a scroller ([Scroll-driven effects](#scroll-driven-effects)). Without scroll timelines it does nothing. Resolves to the number restarted (1.5) |
| `crossfade(el, next, { kind })` | `kind: 'text'` (the default): swaps the content of `el` (a `.ds-swap` slot) for `next` (a node or a string): the new content fades in over `--ds-dur-fast`, the old one fades out over `--ds-dur-instant` and is removed; no movement, no width measuring. Safe to call again mid-swap. `kind: 'icon'` (1.1): `el` becomes a `.ds-icon-swap` (its current content is face a), `next` (an element such as `DS.icons.iconElement(...)`, or the markup of `DS.icons.icon(...)`) goes into the hidden face unless it already holds that icon, and `data-swap` flips to it; the CSS transitions do the motion. Pass an element where a policy forbids parsing markup. Any other kind throws a `TypeError`. Returns a Promise that resolves when the swap settled |
| `flip(container, mutate, { items, live, max, hold, refocus })` | glides reordered items (FLIP): measures the items (`items` selector, default the element children; never `data-ds-keep` or leaving nodes), calls `mutate({ holdOrder, onInsert, onRemove })` (pass it to `DS.dom.morphHtml` as its options; a `mutate` that changes the DOM itself works too, see below), measures again and moves each item from its old place on `translate` (`composite: 'add'`) on the spring for `travelDuration()`. While they glide, the moving items paint above the others, the farthest travel on top, so an item never passes under the items it crosses (inline `z-index` from one above the higher of `--ds-z-raised` and `--ds-z-pinned` (fallback `--ds-z-raised` + 1), so controls an item lifts to `--ds-z-raised`, the checkbox and chevron of an interactive table row, and a pinned table column stay under every gliding item, and at most one below `--ds-z-sticky`, so a sticky header stays on top however many items glide (2.0); `position: relative` where the item is static, `isolation: isolate` on the container so no rank reaches past it; all restored when the glide ends). The container also carries `data-ds-glide` and `--ds-flip-backdrop` (the background colour of its nearest painted ancestor) meanwhile, so items without a background of their own get an opaque backing: table rows do (1.6.1), with the selection colour over it. A call during a glide continues from where each item is, so a typing filter may call it per keystroke. Inserted items fade in, removed items fade out of flow where they were while the others close the gap (table rows go at once); this also holds for plain DOM calls in `mutate`: a direct child it removed goes back in where it was (before the node that followed it, so `:first-child` and the like keep matching), out of flow, for its exit, and an item that is new afterwards fades in (unless it runs an entrance of its own), so `flip(stack, () => alert.remove())` and `flip(stack, () => stack.prepend(alert))` need nothing else ([Data motion](#data-motion)); meanwhile the container keeps its height (an inline `min-height`, restored afterwards; a grid also gets `align-content: start`, so its rows never stretch into the held height), then glides down to its new height on `--ds-ease-out`, so what follows the list never jumps and leaving items stay inside it. Items outside the viewport before and after jump; above `max` (50) moving items the update lands without motion. `live: true`: while a mouse or pen is over the container or focus is in an item, a `mutate` that takes the options runs at once with `holdOrder: true` (values update, nodes stay; the latest such call wins) and the reorder waits until the pointer or focus leaves, at most `hold` (2000) ms; if that `mutate` changed the items all the same (it ignored `holdOrder`), the change glides at once instead of jumping. A `mutate` without parameters (`() => stack.prepend(alert)`) cannot honour `holdOrder`: it waits whole, every such call in order, and glides on release (1.6.1). Touch never holds; a call without `live` (a user's sort) runs the held reorder at once. Returns a Promise of this call's motion. `refocus` (2.0, default `true`): when the item that held the focus goes (removed, a pending removal or leaving) and focus is lost (on `<body>`, or still inside it), focus moves to the next item that stays, in the old order, else the previous one: to its element with the same classes as the old focus (the next row's "Remove"), else the item when it is focusable, else its first visible, enabled, non-inert focusable element (`focus({ preventScroll: true })`); an element or a function returning one is the fallback when no neighbour is left, else `leave()` moves it as usual. A page that moved focus itself is left alone; `refocus: false` turns it off. It holds for the direct call, held reorders, the `live` change that glides at once and above `max` |
| `sortable(list, { items, handle, onChange, announce })` | reorders a list by drag and keyboard (2.0). A pointer drag starts on an item's `handle` (default `.ds-grip`; pointer capture on it): the item follows the pointer (an inline `translate`) and carries `data-ds-dragging` (owned; drag.css raises it and lays the dragged layer, nothing scales); whenever it crosses the middle of a neighbour, the others move through `flip()` (a move during a glide continues from where each item is), and on release it glides into its place on the spring (`travelDuration()`), its raised look leaving in `--ds-dur-instant`. On the handle ArrowUp, ArrowDown, Home and End move the item one place or to an end through `flip()`; the handle keeps the focus. After each move `onChange(order, before)` gets the items in their new and their old order, and the position is spoken through a polite `.ds-sr` region in the list's dialog or sheet, else its `.ds-theme` (never inert): `announce(index, count)` (1-based) returns the text, default `` `Moved to position ${index} of ${count}` ``; return `''` and speak it with `DS.overlay.announce()` where the page wants one announcer. `items`: a selector (default the element children). Once per list. Returns `{ destroy() }` |

### DS.dom (js/dom.js)

`morphHtml(target, html, { replace, holdOrder, onInsert, onRemove, onKeep })` sets the content of `target` to `html` by
patching the nodes that are there, so running animations (spinners, entrances) continue, transitions run (a status
class, a new `--ds-progress`) and focus stays. `morphChildren(target, nodes, options)` does the same with detached
nodes. An `<svg>` target works too (a chart or a sparkline re-rendered in place): its markup is parsed as SVG, so
kept shapes are patched and `<path/>` stays a sibling; a `<foreignObject>` target takes HTML. In a shadow
root the focused element is the shadow tree's own.

- A node of the same tag (and the same key, or both without one) is kept: its attributes are synced and its children
  patched; text changes in place. Listeners on kept nodes stay, so bind them once (or see `data-ds-replace`).
- The shell (2.0): a node whose tag and attributes equal the template's, or are equivalent to them, counts as the same
  shell and is patched, never replaced, also under `{ replace: true }` or `data-ds-replace`. Equivalent: the class
  sets are equal as sets (order aside) without the runtime and owned classes; the styles are equal declaration by
  declaration without the runtime and owned properties, and an empty or blank `style` equals none; every other
  attribute is equal without the runtime and owned ones. `stagger()`, `countUp()` and `flip()` remove a `style`
  attribute they emptied, so an element they touched equals its template again.
- Styles go through the CSSOM (2.0): a changed `style` is written as `style.cssText` (runtime and owned properties put
  back), the attribute goes once nothing is left, and the markup's style attributes travel through the parse under
  another name and are applied through the CSSOM too. A strict `style-src 'self'` without `style-src-attr` needs no
  exception and reports no violation ([install.md](install.md)).
- `onKeep(kept, template)` (2.0) runs after a kept element was patched from `template`, so a page can carry state of
  its own (a handler bound to a record, a chart instance) over to what the node now stands for without replacing it.
  Read the template's attributes: its children may have moved into the page. `DS.motion.flip()` passes its own
  `onKeep` option on with its hooks.
- Keys: `data-ds-key`, else `id`. A keyed node is found among all old siblings and moved to its place; two
  different keys never morph into each other. Unkeyed nodes match by position, with a look-ahead of 8 siblings for an
  identical node. Key list rows, so a reorder moves them instead of rewriting each one.
- Runtime state survives a patch: the classes DS adds (`ds-enter*`, `ds-leave*`, `ds-has-indicator`, `ds-pressed`,
  `ds-ripples`), the custom properties it writes (`--ds-i`, `--ds-indicator-*`, `--ds-ripple-x` / `-y` / `-r`,
  `--ds-motion-origin`, `--ds-clip-from`), `data-ds-staggered`, and the `inert` of an element that carries a
  `ds-leave*` class (an exit in progress, or one kept with `then: 'keep'`).
- So does the state a helper owns while it runs (1.6.1), as it is, present or absent; once the helper lets go, the
  next patch takes the template's value again:
  - `DS.overlay`, from `open()` until the close settled: on the overlay `data-state`, the `hidden` it dropped (a
    template that still says `hidden` does not close it), `open`, `popover`, `data-anchored`, `data-placement`, the
    `--closing`, `--nested` and `--hidden` classes, `--ds-menu-x` / `--ds-menu-y`, `max-height` and
    `position-anchor`; the `inert` of its box or panel during the exit; `aria-expanded` on its opener, `data-drawer-open` on `.ds-app`, the `anchor-name` it wrote on
    the anchor and the `inert` of what its trap took. A tooltip's `aria-describedby` on its trigger, while shown;
    `.ds-toast--shown`;
  - `busy()`: `aria-busy` while the work runs, then `.ds-btn--done` while the success face shows;
  - `countUp()`: `aria-busy`, the `min-width` and the tabular figures while it counts;
  - `roll()` and `crossfade()`: `.ds-swap` while the swap runs; the icon kind `.ds-icon-swap` and `data-swap` until
    it settled;
  - `flip()`: the inline `z-index` and `position` of the items that glide; on their container `data-ds-glide` and
    `--ds-flip-backdrop`, and the inline `position`, `isolation`, `min-height` and `align-content` it holds while
    items glide or leave, so a re-render of the card around a gliding list keeps the list's height and the leaving
    items' place;
  - the chip glide of `DS.ripple`: the row's `data-ds-glide` and `--ds-chips-backdrop`.

  So a row menu opened from a polled list stays open, focused and marked expanded through the next poll, and a busy
  Save button keeps its faces. The record sits on the element under `Symbol.for('ds.owned')`, shared by every copy of
  `ds.js` on the page; it is runtime state, never set it.
- Focus: the focused element and its ancestors are always patched, never replaced; a focused field keeps its value,
  caret and IME composition, a focused `<select>` its selected options and a focused radio the choice of its group
  (only controls outside the focused one take `value`, `checked` and `selected` from changed attributes; 1.6.2).
- `data-ds-keep` nodes (the indicator, ripples, the two announcers `DS.overlay` puts after a snackbar region and the
  tooltip of `tooltips()`; 1.6.2) are never matched, moved or removed, so a re-render of the region's parent or of
  the theme keeps them. `DS.overlay` also sets it, while they
  are away from home, on what it moves into an open dialog or sheet: the snackbar region, and
  an overlay it adopted into a native dialog (a page's own `data-ds-keep` stays). A re-render of the open dialog, or
  of the view that holds it, so never takes them out of the document. `data-ds-replace` on a node (old
  or new markup) or `{ replace: true }` for the whole call brings back replacement when a node's shell differs.
- `onInsert(node)` runs after a new element went in; `onRemove(node)` may return a Promise, and the node then stays
  as a pending removal (`inert`, `aria-hidden`, `data-ds-leaving`, skipped by later morphs) until it settles. An
  element that `DS.motion.leave()` is removing carries `data-ds-leaving` too, so a re-render during its exit patches
  the next item instead of turning the leaving node into it.
  `holdOrder: true` patches the matched children of `target` in place and leaves moves, inserts and removals for a
  later call. `DS.motion.flip()` passes all four (and `onKeep` when its options have one); hand its object straight on.
- Progressive: keyed moves use `moveBefore` where it exists (the node keeps its animations, focus and iframe state);
  elsewhere `insertBefore`, and a moved node that held the focus gets it back with its selection. `insertBefore`
  makes the node new to the style engine, so it carries `data-ds-moving` (transitions off in its subtree, from
  `motion.css`) until one style flush at the end of the call: an `@starting-style` entrance inside it (a status
  icon, an error message's room) never plays again on a sort. The attribute is runtime state; never set it.

State reporters and helpers (2.0). Each works once per element (a second call returns the same handle) and
returns `{ destroy() }` (some also `update()` or `stick()`); what it writes on elements is owned state, so a
re-render with `morphHtml` keeps it. The attributes are listed in [components.md](components.md#attributes).

| Export | |
|---|---|
| `watchScrolled(scroller, target?)` | reports whether `scroller` is scrolled away from its top as `data-scrolled` on `target` (default: the `.ds-app` of a `.ds-view`, the `.ds-sheet__panel` of a `.ds-sheet__body`, the `.ds-dialog__box` of a `.ds-dialog__body`, else the scroller): the fallback of the scroll-driven hairlines and the top bar tint, and what the filled top bar fields read. It prepends one 1px sentinel (`aria-hidden`, `data-ds-keep`, `data-ds-sentinel`; its negative margin takes back the scroller's row gap, so it takes no room) and watches it with an `IntersectionObserver` (the document scroller: the viewport), so the attribute changes twice per scroll, never per scroll event; a scroller that is not rendered (a closed sheet) reports nothing; back at the top it calls `resyncScroll(scroller)`. Returns `{ update(), destroy() }`: `update()` re-reads the gap and puts back a sentinel the page removed, `destroy()` removes the sentinel and the attribute |
| `scrollEdges(scroller, { axis })` | reports which ends of a scroller have more to scroll, for the CSS that fades or shadows them: `data-ds-edges` while watched, `data-ds-overflow-start` and `data-ds-overflow-end` (more at that end of `axis`, `'inline'` by default and direction-aware, or `'block'`), `--ds-scrollbar-height` (inline) or `--ds-scrollbar-width` (block, px, the room of the scrollbar) and `--ds-table-pin-width` (the first cell's width) when it holds a `.ds-table--pin-first`. A passive scroll listener updates once per frame, one `ResizeObserver` per window watches the scroller and its first child; when the overflow goes away it calls `resyncScroll(scroller)`. Once per scroller and axis. Returns `{ update(), destroy() }` |
| `progress(el, share, { valueText, waiting })` | sets a share and its ARIA in one call, on a `.ds-progress` (ARIA on its `.ds-progress__track[role="progressbar"]`), a `.ds-spinner` (determinate, ARIA on itself) or a `.ds-meter` (`--ds-share`; ARIA only with `role="meter"`; never indeterminate). `share` 0 to 1 (clamped, rounded to 0.001): `--indeterminate` and `--waiting` go, `--ds-progress` (a meter's `--ds-share`) is set through the CSSOM, `aria-valuenow` is the share in percent, `aria-valuetext` is `valueText` or removed. `share` `null`: `.ds-progress--indeterminate` (with `waiting: true` `--waiting`; a spinner turns), `aria-valuenow` goes and `aria-valuetext` is `valueText` ("Preparing"; a missing one warns once). In the same task, so a `countUp()` set with it lands on the same frame. Page state, not owned: render it in the template or set it with `progress()`, not both. Returns `el` |
| `roving(container, { items, orientation, wrap, activate, onActivate })` | one tab stop for a set of items (tabs, segmented buttons, toggles in a track, a toolbar, a listbox): `items` (default `[role="tab"], [role="radio"], [role="option"]`); the arrow keys along `orientation` (`'horizontal'`, `'vertical'`, or `'both'` for a grid: Up and Down go to the nearest item of the row above or below), Home and End; `wrap` (default `true`) goes round. The one `tabindex="0"` moves with the focus, the other items get `-1`; `aria-disabled` items stay reachable, `disabled` ones are skipped. `activate`: `'focus'` (default) clicks the item it moves to, so the page's click handler sets the state (or `onActivate(item)` instead), `'manual'` waits for Enter or Space (on an item that is no button), `false` only moves focus (a toolbar). Left and right swap where the computed `direction` is `rtl`. Delegated on the container, so it survives `morphHtml`. Returns `{ destroy() }` |
| `followViewport(doc?)` | the app frame follows the on-screen keyboard: writes `--ds-viewport-height` (px, the visual viewport's height) on `<html>`, sets `data-ds-keyboard` on `<html>` while the visual viewport is shorter than its tallest height at this width by more than 150px (`KEYBOARD_MIN_PX`, a private distance) and focus is in a field that types, writes `--ds-keyboard-inset` (px of the layout viewport the keyboard covers, for the snackbars) and scrolls the window back to the top when the browser panned an unzoomed page up for the keyboard. Progressive: `visualViewport` (feature-detected; without it nothing changes). Once per document. Returns `{ destroy() }` |
| `followEnd(scroller, { pill, threshold })` | a log that sticks to its end: while the scroller is at its end (within `threshold`, 1px) and its content grows (a `ResizeObserver` on its children), it stays at the end; scrolling up lets go and shows `pill` (a `.ds-presence` element in a `.ds-jump`; `hidden` is toggled) until it is back at the end. A click on the pill, or `stick()`, goes to the end: smoothly within one viewport height, else at once. Returns `{ stick(), destroy() }` |
| `autosize(textarea)` | grows a textarea with its text up to its computed `max-height` (then it scrolls), through the CSSOM; never animated. Where the textarea sizes itself (`field-sizing: content`) it does nothing. Returns `{ update(), destroy() }` (`update()` after a value set by script) |
| `dropzone(zone, { onFiles, accept, multiple, paste, target })` | files by drop, by the file dialog and (with `paste: true`) from the clipboard while focus is inside `target`, for a `.ds-dropzone` or any page drop target (a pane, a chat). It counts `dragenter` and `dragleave` on `target` (default `zone`), so `data-ds-dragover` (owned, on `zone`) stays on while a file is over a child; takes `dragover` (and the drop) only for drags that carry files; filters by `accept` (default the input's: `.csv`, `text/csv`, `image/*`), keeps one unless `multiple` (default the input's) and calls `onFiles(files, event)`. The zone's file input (`.ds-dropzone__input`) goes the same way and is reset afterwards. A disabled input takes nothing. Returns `{ destroy() }` |

### DS.indicator (js/indicator.js)

`createIndicator(track, { active, className, observe, name, reveal })` inserts one `.ds-indicator` behind the items of
`track` (which gets `.ds-has-indicator`) and returns `{ update(), destroy() }`. One per track (2.0): a second call
with the same options returns the live handle, other options destroy it and make a new one. It measures the item matching the `active`
selector in the track's scroll coordinates (horizontal, vertical, scrolling or wrapping tracks). The component gives
it its look (`.ds-drawer__indicator`, `.ds-segmented__indicator`, or your own class). A track of `.ds-btn` toggles
(`active: '[aria-pressed="true"]'`) works as it is: inside `.ds-has-indicator` a pressed button drops its own tint
and border, so only the pill paints the selection (give your class `--ds-accent`, the tint's colour), and the labels
change colour on `--ds-indicator-dur`. Forced colors keep the button's selection colours.

- **Options.** `active`: the selector of the active item. `className`: the indicator's own class. `observe`
  (default `true`): the indicator follows the track by itself; `observe: false` turns the `MutationObserver` off,
  and the page calls `update()` after it changed the active item. `name` (1.5): the pill gets the permanent
  `view-transition-name` `ds-indicator-<name>`, so it glides from the old page's item to the new page's on a page
  load with View Transitions (on the `--ds-dur-slow` spring of every group); unique per page (the drawer and a
  segmented switch take different names), and only for a pill outside the view, since a group floats above every
  snapshot. A pill that is not wholly inside its track's visible part when the page is left (`pageswap`) or
  revealed (`pagereveal`), such as the active item of a long drawer list scrolled down to a link further on, keeps no
  name for that navigation (1.6) and goes or comes with its page, so it never glides in over the top bar. So does a
  pill under something modal (1.6.1): a page left or revealed with a dialog, a side sheet or the modal drawer open,
  whose frame `view-transitions.css` leaves in the root snapshot, where a group would paint above the overlay or the
  drawer and its scrim, over the labels. Within a
  page `DS.motion.transition()` lifts the name while it runs: the docked drawer shows live and its pill glides as on
  a click, under its labels.
- **`reveal`** (2.0, default `false`): when the active item changes or the track resizes, the track scrolls itself
  (never its ancestors; smoothly, at once on the first placement) so the item is `--ds-space-2` clear of its edges,
  and a `.ds-drawer__list` gets `.ds-drawer__list--overflow` while it is taller than its view (the drawer's long
  lists, a row of tabs that scrolls sideways).
- **What it observes.** `aria-current`, `aria-pressed`, `aria-selected` and `aria-checked` anywhere in the track and
  items added or removed (never `class`; its own span and `data-ds-keep` nodes such as ripples are ignored); the size
  of the track, of each element child of the track and of the active item (a badge or a wrap in an earlier item, a
  group expanding above, the active label growing); web fonts that load late (`fonts.ready` and `loadingdone`).
  Changes are batched into one animation frame; a resize places the pill within the resize callback, so it never
  trails its item. `update()` stays and is harmless when the observer already moved the pill. The fonts listener is one
  per document and the page-transition listeners one set per window, holding the indicators weakly (2.0): a
  navigation that a re-render replaced is not kept alive by them, and a track out of the document places nothing
  until it is back. An active item inside a closed `<details>` (a collapsed drawer group) has no pill: it contracts
  as if the item were gone and grows back when the group opens.
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
  from where it is painted, and the fade turns back from its current opacity. On page load the first placement jumps,
  and the track's items take their look under the new pill at once (`createIndicator()` gives them one style flush
  without transitions): a pressed toggle's own tint or an item's colour never fades on load.
- **Radius.** A component sets `--ds-indicator-radius` (the drawer: half the item height, squarer under a pressed
  active item). A project class that only sets `border-radius` keeps working: at rest, when `--ds-indicator-radius`
  computes to 0px, the computed `border-top-left-radius` (capped at half the item's smaller side) is copied into it
  inline. During a glide the box has no radius of its own.
- **Morphs.** The span carries `data-ds-keep`, so `DS.dom.morphHtml` never removes it and the observers keep working
  after a morph of the track (a change of the active item in the new markup glides by itself). A foreign re-render
  that dropped the span anyway gets it back at the next placement (it jumps there once).
- **`destroy()`** is final: it disconnects both observers, cancels the pending frame, leaves the shared fonts and page
  listeners (the last indicator of a document or window removes them), removes the span, `.ds-has-indicator` and the
  track's `--ds-indicator-dur`; late callbacks do nothing.

| Export | |
|---|---|
| `createIndicator(track, { active, className, observe, name, reveal })` | see above; returns `{ update(), destroy() }` (the live one again for the same track and options) |
| `OVERSHOOT` | 0.05: the largest pass of an edge beyond its target, as a share of its travel (the peak contract of `--ds-ease-spatial`); the overshoot margin of the glide box |

### DS.ripple (js/ripple.js)

`attach(root = document)` gives every action inside `root` the pointer ripple and returns
`{ destroy, release, detach }`; a second call for the same root returns the same handle. It adds `.ds-ripples` to the root element (`<html>` for
`document`; for an open shadow root the `.ds-theme` inside it, else its host, see [theming.md](theming.md)) and
listens on the root once (delegated): `pointerdown` with the primary button grows a ripple from the
pointer, Enter or Space on a focused host one from the centre. Hosts, skips, the runtime properties
(`--ds-ripple-x`, `--ds-ripple-y`, `--ds-ripple-r`), `.ds-pressed` and the markup:
[components.md](components.md#ripple). `RIPPLE_HOSTS` is the selector of the default hosts (1.1). The ripple's timing comes from the tokens (`--ds-dur-instant` minimum press,
read through `motionDuration()`). `attach()` also adds a passive `touchstart` listener, which makes iOS Safari apply
`:active`; `destroy()` removes the listeners and the class, ripples already shown finish (`detach()` is its
**deprecated** alias, removed in 3.0 at the earliest).

A press ends when another element takes the pointer (2.0): an ancestor that captures it (a chip row that drags to
scroll, a sortable list's row) fires `gotpointercapture`, and the ripple fades as on release while `.ds-pressed`
goes after the usual `--ds-dur-instant` minimum. Capture by the host or an element inside it (touch captures the
pressed element by itself) keeps the press. `release(host)` ends the running press of `host` by hand (a drag library
that moves the pointer elsewhere without capturing it); without an argument it ends every press under the root, and
it does nothing when there is none. Limit: `:active`, with the flat press layer and the morph, lasts until the
pointer button goes up; only the ripple and `.ds-pressed` end early.

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
then the CSS alone runs, and a chip that wraps jumps to its new line. To glide a programmatic toggle, dispatch the
event in the same task: `input.checked = next; input.dispatchEvent(new Event('change', { bubbles: true }))`.

Pinned columns (2.0): in a `.ds-table--pin-first.ds-table--interactive` table the sticky first cell holds the row
link's stretched area, so `attach()` also listens for `click` and `auxclick` (bubble phase) and forwards a click on a
row (outside its controls, with no text selected, not `preventDefault()`ed by the page) to the row's
`.ds-table__row-link`: a plain click calls `link.click()`; Ctrl, Meta or Shift and the middle button open an
`a[href]` with `window.open(href, '_blank', 'noopener')`, and a middle `mousedown` there is `preventDefault()`ed, so
no autoscroll starts. A press on such a row ripples in two parts from one centre: the box over the row goes into the
second cell (under the pinned cell), a second box with the same circle into the pinned cell. Rows of an unpinned
table keep the single ripple.

### DS.overlay (js/overlay.js)

`open(el, { opener })` and `close(el)` drive every floating layer the same way: the dialog and the side sheet (a
native `<dialog class="ds-dialog | ds-sheet">` opened with `showModal()`, or the div markup), the modal drawer
(`.ds-drawer`) and the popups (`.ds-menu`, `.ds-combo__popup`). The overlay must sit inside the `.ds-theme` element;
`open()` warns once per page otherwise. Both return a Promise: `open()` resolves when the entrance has settled,
`close()` once the overlay is hidden again. Every overlay is interruptible: its motion runs on CSS transitions keyed
on `data-state` (never keyframes while `data-state` is set), so an `open()` during the exit, or a `close()` during
the entrance, turns the motion back from its current value in every engine, with the curve of the new direction.

| Export | |
|---|---|
| `open(el, { opener, container, returnTo })` | shows `el` and moves focus into it at once; `opener` (default: the focused element, else the control the current event came from) gets focus back on close; `returnTo()` (2.0) names where focus goes when the opener is gone (below); `container: true` (1.5) grows the opener into a dialog or sheet (below) |
| `close(el, { reason })` | plays the exit and hides `el`; a second call during the exit returns the same promise; `reason` (2.0, default `'api'`) is what the `ds-close` event says, and it closes a busy overlay too |
| `topmost(doc = document)` | (2.0) the top open layer of the page (a dialog, side sheet, the modal drawer, a menu, a combobox list, a contained dialog; whichever copy of `ds.js` from 1.6.1 on opened it), else `null`; a layer that is closing no longer counts |
| `confirm({ title, text, confirmLabel, cancelLabel, destructive, opener, onConfirm, errorText })` | (2.0) a built dialog with Cancel and a confirm button; resolves `true` or `false` (below) |
| `alert({ title, text, closeLabel, opener })` | (2.0) a built dialog with one button; resolves once it closes |
| `prompt({ title, text, label, value, confirmLabel, cancelLabel, opener, input, onConfirm, errorText })` | (2.0) a built dialog with one field; resolves the value, or `null` |
| `lockScroll(doc?)` / `unlockScroll(doc?)` | the reference-counted scroll lock of `doc` (default: the document of the page; 1.6.1) that the modal kinds take for their own document; a page may take it for a layer of its own |
| `toast(region, content, { kind, persistent, timeout, closeLabel, action, key, restart, reserve })` | shows a snackbar in a `.ds-toasts` region (`null`: `toastRegion()`); returns `{ el, close(), closed }` (below; `action`, `key`, `restart` and `reserve` 2.0) |
| `closeToasts(region = toastRegion(), { kind, key })` | closes every message on screen or waiting that matches, as one change of the stack; a Promise that resolves once they are gone (2.0) |
| `announce(text, { assertive, region })` | says `text` through the announcers of a snackbar region (default `toastRegion()`) without a message; polite, or assertive; the same text twice is said twice, empty text nothing (2.0) |
| `toastRegion(doc = document)` | the page's snackbar region: the `.ds-toasts` in the theme of the first `.ds-app`, else the first in the document, else a new one right after `.ds-app` (2.0) |
| `savebar(element, { focusTarget })` | the controller of a `.ds-savebar`: `{ element, show(), hide(), update(fn), shown, destroy() }`, one per element (below; 2.0) |
| `tooltips(root = document)` | tooltips for every `[data-tip]` in `root` (a document, an element or an open shadow root); returns `{ destroy() }` (below) |
| `TOAST_MS`, `TOAST_MAX_MS`, `TOAST_LIMIT` | snackbar fallbacks: 4000ms, at most 10000ms, at most 3 at once |
| `TOOLTIP_DELAY_MS`, `TOOLTIP_SKIP_MS`, `TOOLTIP_HIDE_MS` | tooltip fallbacks: 500, 300 and 100ms |
| `DISMISS_DELAY_MS` | (2.0) the fallback of `--ds-delay-dismiss`: 300ms |
| `DRAWER_QUERY` | (2.0) `'(max-width: 900px)'`: the width at which the drawer is modal, the media query of `shell.css` (a test keeps them equal); `matchMedia(DS.overlay.DRAWER_QUERY)` tells a page which drawer it has |

The constants are fallbacks only (outside a `.ds-theme`): JS timing comes from the computed tokens through
`motionDuration()`, so `--ds-time-scale` slows the overlays' JS and CSS together.

`open()`, in order:

1. hides any visible tooltip;
2. takes back a close in progress (a generation token: the pending close promise resolves without acting, and the
   motion reverses from where it is by flipping `data-state`); an overlay that is already open stays as it is. A
   popup (a menu, a combobox list or another popup) reopened during its exit from another `opener` (one menu shared by
   every row) opens afresh instead, placed at, growing from and marking `aria-expanded` on the new trigger (1.6.2);
3. records the opener: `options.opener`, else the focused element outside the overlay, else, with focus on `<body>`
   (Safari does not focus a clicked button), the focusable control the current event came from (2.0); with it its
   `id` and `options.returnTo`, for the close;
4. modal kinds (dialog, sheet, drawer) take the scroll lock of their document, except a `.ds-dialog--contained`
   (1.6.1); every overlay joins the Escape stack. A dialog opened while another modal is open gets
   `.ds-dialog--nested` (a contained dialog neither gets it nor counts as that other modal);
5. shows it: native `showModal()`, which traps focus and makes the page inert; div markup drops `hidden` (or
   `.ds-dialog--hidden`) and sets `inert` on every sibling of the overlay and of each of its ancestors up to `<body>`,
   across a shadow root through its host (so the div trap of a widget in a shadow root reaches the host page; 1.6.2)
   (a `.ds-dialog--contained` only up to the positioned container it covers, so the page around an embedded widget
   stays usable; 1.6.1), also on such siblings that the page adds while it is open (1.6.2),
   `.ds-scrim`, the `.ds-toasts` regions, their announcers and the tooltips of `tooltips()` excepted. The inert
   follows the stack: an element a trap took stays usable while it holds an overlay opened above that trap (a dialog
   from a div sheet or from the modal drawer, which the lower trap took as a sibling, takes input; the sheet under it
   stays inert), and overlays over each other close in any order. A dialog or sheet takes the snackbar regions of its
   theme in first (below; a region inside a nested `.ds-theme`, an embedded widget's, stays in its widget). Over an open native dialog or sheet, which makes everything outside it inert (top-layer
   popovers included), a menu, a dialog or a sheet (div or native) moves inside that native one before it shows and
   goes back to its place once its close settled; a combobox list stays with its field. A native dialog needs it for
   its exit: `close()` takes it out of the top layer at once, which would make it inert under the sheet below and
   draw it under that sheet's panel; inside the sheet it stays above the panel and its scrim keeps catching clicks;
6. sets `data-state="closed"` (already before step 5, so a native dialog never meets the rules for dialogs driven by
   hand), flushes style, writes the origin (`originFrom(opener, box)` for dialogs and popups) and
   sets `data-state="open"`: the entrance runs on the transitions keyed on `data-state` in every engine;
7. moves focus: `[autofocus]` inside, else the first focusable element (a menu: its first enabled item; a combobox
   keeps focus in its input; the modal drawer: its `[aria-current="page"]` item, 2.0, else the drawer);
8. popups set `aria-expanded="true"` on the opener; a dialog or side sheet does so only when the opener already has
   `aria-expanded` (opt-in by markup, 2.0), and `aria-expanded="false"` comes back as soon as the close starts.

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

Where focus goes on close (2.0): the opener; when it is gone or hidden inside another closed overlay, that
overlay's opener; else `returnTo()` of `open()` (called only then, in a `try`; an error goes to `reportError` and the
next step runs), when it returns a focusable element outside the overlay; else the element that now holds the
opener's `id` in its document or shadow root (a re-render with `DS.dom.morphHtml` or `replaceWith` replaced the row
button: give row buttons stable ids); else the nearest `tabindex="-1"` ancestor, else the landmark. Never `<body>`.

```js
DS.overlay.open(sheet, { opener: rowButton, returnTo: () => table.querySelector('[data-ds-key="d-42"] button') });
```

**Why it closed: `ds-close`** (2.0). Once per close, as soon as it starts (the trap released, focus back on the
opener, the box inert, `data-state="closed"`), the overlay dispatches
`new CustomEvent('ds-close', { bubbles: true, detail: { reason } })`, synchronously and not cancelable. `reason`:
`'escape'` (Escape, the native `cancel`, Android Back), `'backdrop'` (`.ds-dialog__backdrop`, `.ds-sheet__backdrop`,
the drawer's `.ds-scrim`), `'close'` (another `[data-close]`), `'item'`, `'tab'` and `'outside'` (menus), `'parent'`
(closed with the overlay around it; sent before the parent's own event), `'api'` (`close()` without a reason,
`dialog.close()`, a `<form method="dialog">`), `'removed'` (it left the document; sent on the detached element),
`'breakpoint'` (the drawer's window widened past 900px); any other string is the page's own
(`close(el, { reason: 'confirm' })`). It is not sent for a `close()` during an exit, for a refused attempt (busy,
below) or for an element that was never open.

```js
dialog.addEventListener('ds-close', (event) => { if (event.detail.reason === 'confirm') saveDraft(); });
```

**Busy: `data-ds-busy`** (2.0). While the page sets the attribute on a `.ds-dialog`, `.ds-sheet` or `.ds-drawer`, the
user's close attempts do nothing: Escape (the listener still calls `preventDefault()`, so a native dialog fires no
`cancel`; a visible tooltip still takes the key first), the native `cancel`, a `[data-close]` click, the backdrop and
the modal drawer's scrim. One guard at the top of the close, before the popups inside close, so a refused attempt
changes nothing and sends no `ds-close`. `close(el)` and the forced closes (`removed`, `breakpoint`) still close;
menus and combobox lists ignore the attribute. `DS.overlay` never writes it, and it changes nothing visible: the busy
button is the feedback ([components.md](components.md#dialog), "While its action runs"). A morph that drops the
attribute frees the overlay; Android Back can still force a native close (it follows with reason `'escape'`); never
set `closedby` on a dialog that `DS.overlay` drives; a `<form method="dialog">` submit closes natively (use
`type="button"`).

**Dismiss guard** (2.0). A backdrop or scrim click from a pointer closes only as the first click (`event.detail` 1)
of a press that began on that backdrop, and only `--ds-delay-dismiss` (300ms, time-scaled) after the open: the second
click of a double click on the opener (it lands on the backdrop that just appeared), a touch double tap and a drag
from the box that ends on the backdrop close nothing. Every `[data-close]` click with `detail > 1` is ignored.
`click()`, Enter and Space (`detail` 0) close at once. A trigger that toggles (a menu button) ignores
`event.detail > 1` itself.

`topmost()` (2.0) tells which layer would take the next Escape. Whether one overlay is open:
`el.matches('[data-state="open"]')`, or `.ds-app[data-drawer-open]` for the modal drawer. Copies of `ds.js` before
1.6.1 keep their own stack and are not seen.

Container transform (1.5, opt-in): `open(el, { opener, container: true })` on a closed dialog or side sheet runs the
open inside `DS.motion.transition(open, { type: 'container', from: opener })`, so the opener (a card, a table row)
grows into the box or panel on the spring over `--ds-dur-long` as one surface (the overlay's live image is opaque
from the first frame, the opener's fades out on top of it); the
scrim fades in with the root's crossfade, and the page under it stays still. For that open the overlay skips its own
entrance (the live image would otherwise grow twice) and is shown straight in `data-state="open"`; the open itself
(focus included) runs a frame later, inside the transition's update, and the promise resolves once the transform
finished. Meanwhile the page frame (`.ds-view`, `.ds-panel`, `.ds-drawer`) and the sheet's `.ds-sheet__body` carry
`view-transition-name: none` inline: named, they would paint above the scrim or apart from the panel. A `close()`
before the update ran cancels the open. `close()` keeps its own exit: a View Transition would freeze the page during the
close (D18). Use it only where the overlay is the opener's own detail, never by default: the page is frozen for
`--ds-dur-long` (a press skips the motion). Without View Transitions, without `.ds-theme` on `<html>`, without an opener on the page or for any
other kind, `container` is ignored and the usual entrance from the opener plays; an opener that its scroller clips
(the row of a wide table that overflows its wrapper, a card partly under the top bar) gets that entrance too, inside a short
fade-through.

```js
card.addEventListener('click', () => DS.overlay.open(detail, { opener: card, container: true }));
```

Popups: a menu or a combobox list is placed before it enters, at rest size, and grows from its trigger:
`originFrom(opener, popup)` writes `--ds-motion-origin` and `--ds-clip-from` (closed at the trigger's edge, the other
edges `--ds-space-6` beyond the box like the resting clip, so only one edge moves). With `showPopover` and CSS anchor
positioning (and `anchor-size()` for a combobox list) it opens as `popover="manual"` in the top layer with
`data-anchored`: its anchor (the trigger; for a combobox the `.ds-combo` field) gets an inline `anchor-name`
(`--ds-anchor-<n>`, never one the page set; shared with a tooltip of the same trigger and removed once neither uses
it) and the popup `position-anchor`, so no scrolling box clips
it. Elsewhere a menu is placed by `--ds-menu-x` / `--ds-menu-y` (below the trigger from its start edge, towards the
start edge without room, 8px from the window's edges, following scroll and resize within a frame) and a combobox list
stays absolute under its field. Either way a popup opens below its trigger when it fits there, else on the side with
more room (`data-placement="top"` above; for a combobox list the room is the window's narrowed by every box around
the field that clips its overflow), and it is never taller than the room on that side: anchored, the CSS caps it to
its `position-area`; placed by the script, an inline `max-height` (removed on close). The list or the menu scrolls
inside, so it never covers its trigger or the field being typed into. A menu focuses its first enabled item (the last when an ArrowUp keydown opened it), moves focus with ArrowUp,
ArrowDown, Home and End (wrapping; a `.ds-menu__heading` is no item), to the next item whose label starts with the
typed letters (type-ahead, 2.0: the letters reset after `--ds-delay-tooltip`, read through `motionDuration()`; one
letter again and again cycles through the items with it) and closes a task after an item's `click` (its handlers run
first; disabled items close nothing). The `.ds-menu__item` rows of a dialog's `.ds-dialog__list` (an action sheet)
take the same arrow keys (2.0). On close the popup leaves the top layer once its fade ended.

Escape stack: one `keydown` listener on the document in the bubble phase (installed by the first `open()`) closes
only the topmost overlay that is not already closing, and only when no tooltip took the key. A filled
`input[type="search"]` inside that overlay takes the key first (2.0): its value goes, an `input` event tells the
page's filter, and the layer stays; the next Escape (an empty search) closes it. So the order is: tooltip, filled
search, top layer. A widget inside the
overlay that handles Escape itself (an inline edit, a picker) runs first: when it calls `preventDefault()`, the
overlay stays open, as with a plain `<dialog>`. The listener calls `preventDefault()` itself (which also keeps a
native dialog from its own `cancel`) but does not stop the event. A native dialog's `cancel` is turned into
`close()`, so Escape plays its exit. When the topmost overlay is a `.ds-dialog--contained`, the key is its own only
when pressed inside the container it covers (1.6.1): Escape in the host page around an embedded widget is left alone,
so the host's own dialogs and search fields keep it. The stack is the page's, shared by every copy of `ds.js` on it
(1.6.1 and later): the topmost overlay closes whichever copy opened it. A click on `[data-close]` inside an overlay closes it (ignored
while it closes). A menu also closes on Tab (focus returns to its trigger and Tab moves on from there) and on a
`pointerdown` outside the menu and its trigger.

Scroll lock: `lockScroll(doc)` / `unlockScroll(doc)` count per document (an overlay in a same-origin iframe, driven
from the parent's `DS`, locks the iframe's page), one count for every copy of `ds.js` on that page (1.6.1); `body.ds-no-scroll` (with `.ds-base`) toggles only on the
0 to 1 and 1 to 0 steps, and an unbalanced unlock never goes below 0. When the lock removes a classic scrollbar of
the page, its room stays: `scrollbar-gutter: stable` on `<html>` where supported, else a `padding-right` on
`<body>`. In the app frame, where `.ds-view` scrolls, nothing is reserved.

Modal drawer: `open(drawer, { opener })` acts only while `(max-width: 900px)` matches (wider, it resolves at once).
It sets `data-drawer-open` on `.ds-app` and `aria-expanded` on the menu button, focuses the drawer's
`[aria-current="page"]` item (2.0; without one, the drawer), makes its
siblings inert (not `.ds-scrim`, nor the snackbar regions, their announcers and the tooltips), takes the lock, joins the Escape stack and closes on a click on the scrim.
`close(drawer)` returns focus to the menu button at once. From load on (1.6.1; before, from the first `open(drawer)` or
`close(drawer)`), a window crossing 900px sets `.ds-drawer--instant` for two frames on every `.ds-app > .ds-drawer`
of the page, and a window that widens closes a stale open state without motion: a page that drives the drawer
through `DS.overlay` needs no breakpoint snippet. The snippet of the App frame is for pages that drive the drawer by
hand; it may stay (both together do no harm). Without the helper, the CSS and the page recipe keep working.

Removed while open: an overlay that the page takes out of the document while it is open or closing (a route change,
a re-render of the region around it) is closed at once, without motion (1.6.1): its scroll lock, the inert of its
trap, `aria-expanded` on its opener, its runtime state and its Escape entry go, and the snackbar regions it took in
return to their place; focus is not moved. An overlay that `DS.overlay` moved into a native dialog or sheet (above)
and that left the document only with that host goes back to its place too, so a later `open()` shows it again (the
modal drawer's frame loses `data-drawer-open` also when only the drawer element was replaced). A `MutationObserver`,
connected only while an overlay is open, notices the removal; a `close()` of the removed element does the same at
once.

Promise dialogs (2.0): `confirm()`, `alert()` and `prompt()` build a native `dialog.ds-dialog` with DOM APIs
(no HTML strings, so a strict CSP is fine) inside the opener's `.ds-theme` (else the first one): the backdrop with
`data-close`, the title (`aria-labelledby`), the text (`aria-describedby`), for `prompt()` a `.ds-field` whose input
takes `input.type`, `autocomplete`, `inputmode` and `required`, and the actions. They open it with `open()`, remove it
once its exit settled and resolve when the close starts: `confirm()` `true` only for the confirm button,
`prompt()` the value or `null`, `alert()` nothing. `destructive: true` makes it an `alertdialog` whose first focus is
Cancel (else the confirm button, or the prompt's field). `onConfirm` (a function returning a promise) runs with
`busy(confirmButton, …, { done: false })` and `data-ds-busy` on the dialog (Cancel `aria-disabled`, the field
`readOnly`); a rejection keeps the dialog open, shows `errorText` (default "That did not work. Try again."; never the
raw message) as an error snackbar in the theme's `.ds-toasts` region (inside the open dialog, so above it) and returns
focus to the confirm button; success closes it with reason `'confirm'`. The labels default to "Confirm", "Cancel" and
"OK".

```js
if (await DS.overlay.confirm({ title: 'Archive 3 devices?', confirmLabel: 'Archive devices', opener: button })) archive();
```

Snackbars: `toast(region, content, options)` takes a `.ds-toast` element or builds one from a string (`kind`
`'success'`, `'error'` or `'info'` picks the icon and the modifier; `action: { label, onClick }` adds a
`.ds-toast__action` text button; a message that stays gets a close button, whose label is also its `data-tip`; an
element message that stays without a close button or an action gets one too) and returns `{ el, close(), closed }`;
`closed` resolves once the message is gone (also when it never showed). `region` `null` is `toastRegion()`. Every
insertion and removal runs inside `DS.motion.flip(region, ...)`: the messages on screen glide on `--ds-ease-spatial`
while a new one rises in (`--ds-dur-medium`) or a closed one fades out in place (`--ds-dur-fast`, out of flow) and the
gap closes. At most `TOAST_LIMIT` (3) show; a further one replaces the oldest message that would close by itself, or
waits in a queue (first in, first out) behind three that stay. A message closes after `timeout` ms, by default
`min(TOAST_MAX_MS, TOAST_MS + 50ms × max(0, characters − 40))`, multiplied by the computed `--ds-time-scale`; errors,
`persistent: true` and messages with an action, another button or a link never close by themselves. The timers pause
while a pointer is over a message (`pointerover` / `pointerout`, checked against the region), while focus is in the
region and while `document.hidden`, and resume with the time left. Matching (2.0): a string message without action
has the implicit key `restart:` + kind + persistent + its normalised text; a call whose key matches a message on
screen restarts it (its full timeout again, its text announced again, nothing moves) and returns that message's
handle, one that matches a waiting message returns its handle; `restart: false` drops the implicit key. An explicit
`key` replaces the matching message instead: on screen inside one `flip()` (the old one fades out in place, the new
one enters in its slot, focus inside the old one moves to the new close button), waiting in its queue slot; the old
`closed` resolves. `closeToasts(region, { kind, key })` takes every match off the screen and out of the queue in one
`updateToasts` pass. A click on the action closes the message, then calls `onClick(event, handle)` once, inside
`try` (`reportError`). Messages that stay (`reserve` is on by default for them) keep room: `data-toast-reserve` and
`--ds-toast-reserve` on the scroller of the region's layer (the `.ds-view` of its app, a hosting sheet's
`.ds-sheet__body`), `max(0, scroller bottom − top of the highest staying message)` rounded up, or on a hosting
`.ds-dialog` (the stack, its bottom offset and `--ds-space-3`) only while the box would overlap the stack; measured
after each change of the stack settled, after the region moved, and by one `ResizeObserver` on the region while
held; a focused element (or the focus origin) under the stack is brought clear with `scrollIntoView({ block:
'nearest' })`; both names are owned and go once no staying message shows (in a dialog, after its exit).
A focused message that leaves first hands focus to the
next message's close button, else to the element focused before focus entered the region, else to the view
(`tabindex="-1"`); never `<body>`. The text is announced through two `.ds-sr` live regions that `toast()` adds next to
the region (polite; assertive for errors): cleared, then written on the next frame, so the same text is announced
again; `announce(text)` writes through the same pair. A region's own `role` and `aria-live` are removed on its first
use (and owned), so the old markup is announced once, by the announcers. `open()` of a
dialog or sheet moves every `.ds-toasts` region of its theme, with its announcers, into the overlay (`moveBefore`
where it exists), before the div trap makes the page inert (a region inside a nested `.ds-theme`, an embedded
widget's, is not moved: it stays where it is, under the modal like the rest of that widget; 1.6.2): a message shown while it is open sits above its scrim,
in the top layer of a native one, announced and usable. In a dialog the region keeps its place (`--ds-toast-left`
holds the left edge it had). In a sheet `--ds-toast-left` becomes the panel's resting left edge plus `--ds-space-6`
and `--ds-toast-lift` the height of its `.ds-sheet__foot` plus `--ds-space-2`;
the messages glide there through the region's own `translate` transition (`--ds-toast-shift` and
`--ds-toast-shift-y`, from the measured `left` and `bottom`: set, flushed, cleared)
timed by `data-follow="enter"` (`--ds-dur-long`, `--ds-ease-spatial`); `close(sheet)` brings the region back with
`data-follow="exit"` (`--ds-dur-base`, `--ds-ease-exit`). Nothing glides where the place moves by less than half a
pixel on both axes (phones, a dialog). Overlays over each other nest: each gives the regions back to the one it took
them from. On the page `--ds-toast-lift` is the room above a shown save bar of the theme and, on phones while the
modal drawer is open, above its `.ds-drawer__foot` (a `MutationObserver` on `.ds-app` for `data-drawer-open`); it is
set at once when the first message of an empty stack shows, and glides when it changes under messages.

Save bar: `savebar(element, { focusTarget })` drives a `.ds-savebar__bar` (a `.ds-presence`, so its entrance and exit
are the utility's transitions). `show()` removes `hidden`, writes `--ds-savebar-height` and `data-ds-savebar` on the
`.ds-view`, lifts the regions of its theme that no overlay hosts (`--ds-toast-lift`, gliding) and scrolls the focused
element clear; `hide()` rescues focus inside the bar to `focusTarget()` (else the view), sets `inert` until the exit
`settled()`, sets `hidden`, lowers the regions, and sets `data-ds-savebar-rest` when the view was at its end (dropped
once the view scrolls the bar's room away from its end); `update(fn)` waits for a running exit. A `ResizeObserver`
re-measures while it shows. Its writes are owned. Outside `.ds-view` it warns once.

Tooltips: `tooltips(root)` installs one set of delegated listeners for the `[data-tip]` triggers in `root` and creates
one `.ds-tooltip` inside the `.ds-theme` around it (for a shadow root: the `.ds-theme` inside it; a tooltip of a trigger inside a dialog or sheet moves into that
overlay while it shows, so it is never under the top layer; the div trap and the modal drawer never make it inert,
so it stays hoverable and heard). A second call on the same root returns the first handle, and a trigger inside
nested roots (the host page's `document` and an embedded widget's root) is served by the innermost one only, so it
never shows twice or is described twice (1.6.1). It shows after `--ds-delay-tooltip` for a
mouse or pen resting on a trigger (`pointerover` / `pointerout` with a `relatedTarget` check, so the trigger's own
icon changes nothing) and at once on `focusin` with `:focus-visible`. On touch (`pointerType` `"touch"`, one capture listener per event on the document): a tap (down and up on the same trigger within 10px, `TAP_SLOP_PX`) on `[role="img"][data-tip]` or `[aria-disabled="true"][data-tip]` shows it at once on `pointerup` and a second tap hides it; a long press of `--ds-delay-tooltip` on any other trigger but `a[href]` shows it and swallows the `click` and `contextmenu` that follow (one capture listener, removed after the click or at the next `pointerdown`); `pointercancel` and a move past 10px cancel; a touch tip hides on the next `pointerdown`, any scroll and Escape, never on a timer (2.0). Whether a tip is wanted is checked on `pointerover`, `focusin` and when the delay ends (`tipWanted()`): the trigger's rendered text (text nodes whose parent has client rects, without `.ds-sr`, `[aria-hidden="true"]`, `svg` and boxes of at most 1×1px) normalised like `normalText`; a tip that differs always shows, one that equals it only while the trigger, one of its first 24 descendants or one of up to three ancestors with the same text has `overflow` other than `visible` and `scrollWidth > clientWidth + 1` or `scrollHeight > clientHeight + 1`, and then sets no `aria-describedby` (2.0). While one is visible, or within
`--ds-delay-tooltip-skip` of the last hide, the next trigger shows at once: a visible tooltip swaps text and place
in place (a fade under way turns back from its current opacity), a hidden one opens with `data-warm` and only fades
in. It hides after `--ds-delay-tooltip-hide`, unless the pointer crossed onto it or the trigger keeps keyboard
focus; Escape hides it (with `preventDefault()` and `stopPropagation()`, only when one was visible), as do any
`pointerdown`, `open()` and a trigger that scrolls out of view; a trigger removed from the document hides it at once, without the fade (a `MutationObserver` on the root, connected only while a tooltip shows; 2.0). Timing reads the tokens through `motionDuration()`,
so `--ds-time-scale` stretches the delays too. Motion runs on the `data-state` transitions of tooltip.css; the origin
comes from `originFrom(trigger, tip)`. Placement: with `showPopover` and CSS anchor positioning the tooltip is a
`popover="manual"` with `data-anchored`, the trigger gets an inline `anchor-name` (`--ds-anchor-<n>`, shared with a
menu opened from the same trigger and removed again once neither uses it,
unless it had one) and the tooltip `position-anchor`, and `data-placement` follows the side the engine chose (read
again two frames after a show or swap: Chromium lays a swap out with the scroll offset of the previous anchor's
scrolling box until the next rendering); elsewhere a capture-phase scroll listener and `resize`
re-place it within one frame through `--ds-tooltip-x` / `--ds-tooltip-y`, flipped above (`data-placement="top"`) and
clamped 8px from the viewport edges.

## Recipes

### A live list with `flip`

Polling: values update at once, rows that moved glide, and while a mouse or pen is over the list or a row has focus
the reorder waits (at most 2s). A user's sort or filter glides at once and takes a held reorder with it.

```js
let rows = [];
const render = (options) => DS.dom.morphHtml(list, renderRows(rows), options);   // items keyed with data-ds-key
setInterval(async () => {
  rows = sort(await fetchRows(), key);
  DS.motion.flip(list, render, { live: true });                                  // held while pointed at
  DS.motion.countUp(total, rows.length);                                         // counts from what it shows
}, 5000);
sortButton.addEventListener('click', () => {
  key = sortButton.value;
  rows = sort(rows, key);
  DS.motion.flip(list, render);                                                   // a user action glides at once
});
```

### Removing an item

Removing the focused item (a row's Remove, a chip's close button, an alert's dismiss) needs no focus code: `flip()`
moves focus to the same control of the next item, else of the previous one, and to the fallback when the list is
empty.

```js
removeButton.addEventListener('click', () => {
  rows = rows.filter((row) => row.id !== id);
  DS.motion.flip(list, render, { refocus: () => addButton });   // the row fades out, focus lands on the next "Remove"
});
```

### A timeline entry edited in place

The entry's text and its form share one `.ds-swap` slot: `crossfade()` swaps them without a height jump of the
slot, and the entries below follow through `flip()` (a timeline has no motion of its own; it is unrelated to
scroll timelines).

```js
// <div class="ds-swap ds-timeline__body"><p class="ds-timeline__text">...</p></div> in the entry
edit.addEventListener('click', () => {
  DS.motion.flip(timeline, () => DS.motion.crossfade(slot, formFor(entry)));
});
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  await save(entry);
  DS.motion.flip(timeline, () => DS.motion.crossfade(slot, textFor(entry)));
  edit.focus();
});
```

### Charts: the first render, then values that glide

The marks set `--ds-share`; the first render fills them from zero, later values transition on the same curve and
land with a figure counted in the same task.

```js
const marks = columns.map((column, index) => {
  column.style.setProperty('--ds-share', String(values[index] / max));
  return column;
});
DS.motion.enterAll(marks, 'fill', { stagger: false });      // first render only
// later:
meter.style.setProperty('--ds-share', String(used / total));
DS.motion.countUp(figure, used);                             // lands on the same frame as the meter
```

### A view swap with `transition`

```js
link.addEventListener('click', async (event) => {
  event.preventDefault();
  const html = await fetchView(link.href);                     // fetch first: the page is frozen while it runs
  await DS.motion.transition(() => {
    DS.dom.morphHtml(view, html, { replace: true });           // keeps the data-ds-keep sentinel
    return view.querySelector(':scope > .ds-content');         // what enters on the fallback path
  }, { type: 'fade-through' });
});
```

### An overlay opened and closed

```js
DS.ripple.attach(document);                                    // once per page
DS.overlay.tooltips(document);                                 // once per page
openButton.addEventListener('click', () => DS.overlay.open(dialog, { opener: openButton }));
// [data-close] inside the dialog and Escape close it; focus goes back to openButton at once.
saveButton.addEventListener('click', async () => {
  await DS.motion.busy(saveButton, save());                    // busy, then the success face
  await DS.overlay.close(dialog);                              // resolves once it is hidden
  DS.overlay.toast(document.querySelector('.ds-toasts'), 'Saved', { kind: 'success' });
});
```

### A loader with `settleLoader`

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

### A refresh with `refresh`

```js
const data = await DS.motion.refresh(list, () => api.load(), { signal });   // stale, loading bar, never a flash
DS.dom.morphHtml(list, renderRows(data));                                     // right after: the stale state just went
```

### A count badge

A `.ds-badge` ([components.md](components.md#badge)) pops in when a count appears and pops out when it goes; while it
shows, the number changes at once (no count-up on a badge), and a badge rendered with the page plays nothing.

```js
function showCount(badge, count) {
  const shown = !badge.hidden && badge.textContent !== '';
  badge.textContent = count ? String(count) : badge.textContent;   // the number itself: at once
  if (count && !shown) {
    badge.hidden = false;
    DS.motion.enter(badge, 'pop');                                 // ds-fade-in, ds-pop-in on the spring
  } else if (!count && shown) {
    DS.motion.leave(badge, 'pop', { then: 'hide' });              // faster, then hidden
  }
}
```

## View transitions

`DS.motion.transition(update, { type, from })` runs `update` (the swap) and plays the type of [Views](#views);
[`DS.motion`](#dsmotion-jsmotionjs) lists the signature. Within a page this is the SPA path; multi-page apps opt in
with `css/optional/view-transitions.css` (below, "Page loads").

- **Where it runs.** With View Transitions (`document.startViewTransition`) and `.ds-theme` on `<html>`. The
  pseudo-elements of a View Transition hang off the document element, so only then do they inherit the tokens, and
  only then is the snapshotted document the system's own page. The top bar stays in the root snapshot and never
  moves; the docked drawer shows live, so its pill glides to the new item as on a click. Everywhere else (an engine
  without View Transitions, or an embedded widget with `.ds-theme` on a wrapper, which must never snapshot its host
  page) the update runs at once and the returned element (else the first child of the themed `.ds-view` that is
  not `data-ds-keep` or `aria-hidden`, so never the `data-scrolled` sentinel) enters with `.ds-enter--swap`: a
  fade-through without a shared element (D30).
- **Navigation only, never data.** A destination, a drill-down, another record. A refresh, polling, typing or a
  filter changes values in place (`DS.dom.morphHtml`, [Data motion](#data-motion)) and never replays an entrance.
  No component calls `transition()`, except `DS.overlay.open` with `container: true`.
- **Fetch first, then swap quickly.** The page is frozen while a View Transition runs (it shows snapshots), so load
  the next view before the call and keep `update` a quick swap. A running transition is skipped when the next call
  comes (every update still runs, in call order), and an update that has not finished after `--ds-dur-long` loses
  its motion, so a slow render never freezes the page for long. A press meanwhile is never lost: Chromium and WebKit
  deliver it to `<html>` while the pseudo-elements are up, so `transition()` skips the motion and sends its click to
  the element under the pointer once the page is live again (the stray press and click on `<html>` stop at the
  window); stepping through records or clicking through the drawer quickly lands every click.
- **The target.** `update` may be async and may return (or resolve to) the element that holds the new content: the
  container target of `'container'` and the element that enters on the fallback path. A container transition
  without a connected `from` or without a returned element falls back to a fade-through. So does one where a
  scroller clips a part of `from` or of the target that lies in the window (a detail scrolled down to its Back
  button, a card partly under the top bar, a row of a wide table): a group escapes every clip and paints above the
  root, so the hidden part would cover the top bar or the drawer. A part outside the window does not count, so a
  detail longer than the view still grows from its card when the view starts at its top.
- **What is named.** While a transition runs, `data-ds-vt="<type>"` sits on `<html>` and names the view
  (`ds-view`), the panel (`ds-panel`), the docked drawer (`ds-drawer`) and the body of an open modal sheet
  (`ds-sheet-body`; a sheet shown inline in a page is never named), and a snackbar region with messages
  (`ds-toasts`): its group lies above the page's groups and shows only its live image, so a message stays on screen
  and still while the view changes (one region with messages per page; `transition()` lifts the name of any further
  one, since a duplicate name would skip the transition); the rules hang off
  `.ds-theme::view-transition-*` ([Utilities](#utilities-css)). Under an open dialog or side sheet (also one shown
  by hand: a native one with `showModal()`, the div markup by removing `hidden`), or the modal drawer (open or still
  leaving), the page frame keeps no names (a `.ds-dialog--contained` covers its container inside the panel, not the
  frame, and never counts): a record swap moves only the sheet's body, and a
  navigation from the modal drawer crossfades under it (close the drawer inside the update, so it is still open when
  `transition()` looks). A view with or without the drawer (`data-drawer-hidden` toggled inside the update) morphs
  the panel ([App frame](components.md#app-frame)): `transition()` sees the panel's width change and adds
  `data-ds-vt-morph` to `<html>`, and only then do the panel and the view move over `--ds-dur-long`; a plain swap
  ends within `--ds-dur-slow`.
- **Indicators.** `createIndicator(track, { ..., name })` gives the pill the permanent name
  `ds-indicator-<name>` (unique per page), so it glides across page loads; a pill scrolled out of its track's view
  on the page being left or revealed keeps no name for that navigation and goes or comes with its page. Within a
  page `transition()` lifts the name while it runs and the pill glides live, under its labels and inside its track.
- **Page loads (multi-page apps).** `css/optional/view-transitions.css`, loaded after `ds.css` with `.ds-theme` on
  `<html>`, opts every same-origin navigation in (`@view-transition`) and names the frame for good; the motion is
  the same rules. A named indicator must exist before the new page is captured: create it from a classic script
  before the first render ([install.md](install.md#multi-page-apps) shows how). For shared axis on history steps,
  set the same attribute in `pagereveal` (the snippet in the file's header):

  ```js
  addEventListener('pagereveal', (event) => {
    const activation = window.navigation?.activation;
    if (!event.viewTransition || activation?.navigationType !== 'traverse' || !activation.from) return;
    const root = document.documentElement;
    root.dataset.dsVt = activation.entry.index < activation.from.index ? 'back' : 'forward';
    event.viewTransition.finished.finally(() => { delete root.dataset.dsVt; });
  });
  ```

```js
// A destination of the drawer: fetch, then swap inside the transition.
const html = await fetchView(url);
await DS.motion.transition(() => {
  DS.dom.morphHtml(view, html, { replace: true });   // keeps the data-ds-keep sentinel
  return view.querySelector(':scope > .ds-content');
});

// A card into its detail, and back.
DS.motion.transition(() => renderDetail(id), { type: 'container', from: card });
DS.motion.transition(() => renderOverview().querySelector(`[data-ds-key="${id}"]`), { type: 'container', from: detail });
```

`transition()` replaces the manual `.ds-view--leaving` recipe ([App frame](components.md#app-frame)), which waited
for the old view to fade before the swap. A page that still swaps by hand waits on the content element,
`DS.motion.settled(view.querySelector(':scope > .ds-content'), ...)`, never `settled(view)` (the fade runs on the
view's children) and never `view.firstElementChild` (with the `data-scrolled` sentinel that is the sentinel).

## Scroll-driven effects

Where the engine has scroll-driven animations, what marks a scrolled position follows the scroll itself instead of
an attribute set by script; elsewhere the attribute (or a static look) stays. They take no duration: their progress
is the scroll position (the scroll-linked keyframes `ds-scroll-fade`, `ds-scroll-edge-start` and `ds-scroll-edge-end`,
[Keyframes](#keyframes)).

| Effect | Scroll-driven (progressive) | Fallback |
|---|---|---|
| The panel's top hairline | `ds-scroll-fade` on `scroll(nearest block)` over the first `--ds-space-2` (8px) of the view's scroll | `data-scrolled` on `.ds-app`, faded over `--ds-dur-fast` |
| The top bar's tint (`.ds-topbar::before`, `--ds-topbar-scrolled-bg`) | the same fade on the view's named timeline `--ds-view-scroll`, which `.ds-app` scopes to the bar (`timeline-scope`) | `data-scrolled` on `.ds-app` |
| A side sheet's head hairline | the same fade on the body's named timeline `--ds-sheet-scroll`, scoped on the panel | `data-scrolled` on `.ds-sheet__panel` |
| A table's edge fades | `ds-scroll-edge-start` and `ds-scroll-edge-end` on the wrapper's own `scroll(self inline)`: a fade on each side that still has columns to show | `data-ds-overflow-start` / `-end` from `DS.dom.scrollEdges()`, faded over `--ds-dur-fast`; without it the static fade at the right edge |
| A sideways strip's edge fades (`.ds-scroll-x`) | the same two keyframes on the strip's own timeline | `data-ds-overflow-start` / `-end` from `DS.dom.scrollEdges()`; without it no fade |
| The hairline at a pinned column's end (`.ds-table--pin-first`) | `ds-scroll-fade` on `scroll(nearest inline)` over the first `--ds-space-2` | `data-ds-overflow-start` on the wrapper, faded over `--ds-dur-fast` |
| `.ds-reveal--scroll` | a block of a long read-only page fades in and rises while it enters the scrollport (`view()`) | none: static, never hidden (also in print) |

- **The `data-scrolled` fallback.** Set it in every engine (filled toolbar fields read it too), from an
  `IntersectionObserver` on a 1px sentinel at the top of the scroller, so it changes twice per scroll instead of on
  every scroll event; the snippet is in the [App frame](components.md#app-frame). Where the timelines run, the
  attribute changes nothing they draw.
- **The order.** `animation-timeline` and `animation-range` come after the `animation` shorthand in the same rule:
  the shorthand resets both, so written first they would be lost. A named timeline (`--ds-view-scroll`,
  `--ds-sheet-scroll`) sits behind `@supports (timeline-scope: none)`, an anonymous one (`scroll()`, `view()`)
  behind `@supports (animation-timeline: ...)`: an engine with scroll timelines but without `timeline-scope` would
  otherwise leave the named one unresolved. `test/css.test.js` checks both.
- **At rest.** The hairlines and the tint keep their own `opacity: 0` and `ds-scroll-fade` names both ends: a
  scroller without overflow has an inactive timeline, and the animation then has no effect, so nothing shows.
- **Content that shrinks.** That holds on a fresh load. When a scrolled scroller's content shrinks until it no
  longer overflows, its timeline turns inactive, but Chromium and WebKit keep the animation's last progress: the
  top bar stays tinted, a hairline shows on a page at its top, a table that now fits keeps its left fade.
  `DS.motion.resyncScroll(root)` restarts such animations two frames later, so they rest as on a fresh load.
  `transition()` calls it after every update; call it after a change in place that may shrink a scroller (a table
  filter, hidden columns, a record swapped with `morphHtml` outside `transition()`), or from the sentinel's
  observer when the scroller is back at its top (the [App frame](components.md#app-frame) snippet does).
- **Tests and tools.** A scroll-driven animation never finishes and takes no time-based `currentTime`:
  `DS.motion.settled()`, the handoffs and `flip()` leave it out.

## Progressive features

Newer features are refinements only: the browser floor is Safari 16.4, Chrome/Edge 111 and Firefox 128, and every
feature below has a fallback there (each file's header names it under "Progressive:", in the same form; tested).
The `fallback` project of the browser tests runs every spec without them.

- `linear()` (the spring of `--ds-ease-spatial`, the exact emphasized path): without it the cubic fallbacks
  (`--ds-ease-out`, the emphasized approximation); `el.animate()` retries a `linear()` it cannot parse with the
  token's cubic.
- `@starting-style` and `transition-behavior: allow-discrete` (`.ds-presence`, a native dialog or sheet driven by
  hand, a status icon that comes in, a validation message's room): without them the element shows and hides at once
  (a dialog or sheet by hand plays its keyframes on the way in).
- `interpolate-size` and `::details-content` (`.ds-collapsible`, the validation message room): without them they
  open and close at once (the message still fades in).
- `overflow-clip-margin` (ring room at the edge of an open `.ds-collapsible`, a chip's ripple over its border):
  without it the content's own padding is the ring room, the ripple stops at the padding box.
- `sibling-index()` (CSS-only `.ds-stagger` lists number themselves): without it `DS.motion.stagger()` numbers them.
- `popover` and CSS anchor positioning (tooltips, menus and the combobox list in the top layer, anchored to their
  trigger): without them the script places them (`--ds-tooltip-x/-y`, `--ds-menu-x/-y`, the list's upward flip).
- View Transitions, same-document (`transition()`, `open(el, { container: true })`, only with `.ds-theme` on
  `<html>`): without them the new view fades through with `.ds-enter--swap`, and `container` plays the usual
  entrance.
- View Transitions across documents (`css/optional/view-transitions.css`): without them pages load as before.
- Scroll-driven animations (`animation-timeline`, `animation-range`, `timeline-scope`: the hairlines, the top bar's
  tint, a table's edge fades, `.ds-reveal--scroll`): without them `data-scrolled`, the static table fade, and a
  static, never hidden `.ds-reveal--scroll`. The edge fades of `.ds-scroll-x` and the table wrappers and a pinned
  column's hairline fall back to the `data-ds-overflow-*` attributes of `DS.dom.scrollEdges()`.
- `moveBefore` (a keyed move or a snackbar region that moves keeps its animations and focus): without it
  `insertBefore`, focus put back, and `data-ds-moving` for one style flush so no entrance replays.
- `scrollbar-gutter` (the room of a removed page scrollbar under the scroll lock): without it a `padding-right` on
  `<body>`.
- `focus({ focusVisible: false })` (a native dialog or sheet opened or closed with the pointer shows no keyboard ring
  in WebKit, which marks what `showModal()` and `close()` focus as `:focus-visible`): without it that ring stays as
  WebKit draws it.
- `view-transition-name` on a named indicator, and the `pageswap` and `pagereveal` events (they lift the name for a
  pill scrolled out of view): without View Transitions the name is ignored and the pill glides as always.
- `text-wrap` (a lead, hints, radio card descriptions, empty states and `.ds-muted` paragraphs avoid a lone last
  word): without it the text wraps as usual.
- `scrollbar-color` and `scrollbar-width` (thin, quiet scrollbars in the drawer, the panel, menus, the combobox
  list and a check list): without them the platform scrollbar shows.
- `field-sizing: content` (`.ds-input--grow` and the composer grow with their text): without it
  `DS.dom.autosize(textarea)` sets the height (never animated), and without that the field keeps its height and
  scrolls.
