# Plan: Motion 2 (Dashboard-Style 1.0)

Working plan for the motion overhaul and the code review that came with it. It was worked out with the owner on
2026-10-19 from a full audit of the repository (six area audits, each finding checked by a second reviewer, 203
findings plus 46 that the reviewers added). Every finding is assigned to a phase or dropped with a reason:
[motion-2/coverage.md](motion-2/coverage.md).

This file is the **authority**: decisions, the canonical spec (names, values, APIs) and the phase order. The task lists
live in one file per phase ([P0](motion-2/P0.md) ... [P8](motion-2/P8.md)). Where a phase file and this file disagree,
this file wins; fix the phase file.

> The plan sits outside `docs/` on purpose: `test/repo.test.js` counts every `docs/**/*.md` as documentation, and a
> plan that names future tokens and exports would satisfy those tests in advance.

## Goal

Motion that feels crafted and current (Material 3 Expressive: physical springs, choreography, origin-aware popups,
shape morph, View Transitions) and never gets in the way of work: fast, interruptible, nothing that blocks input or
makes the user wait, nothing that moves under the pointer by surprise. Alongside it, every bug the audit found is
fixed and the tests learn to prove motion in real browsers.

## Decisions (owner, 2026-10-19)

| # | Topic | Decision |
|---|---|---|
| D1 | Character | Physical **springs for spatial movement** (things that move or scale freely: indicator, switch handle, sheets, drawer, dialogs, menus, FLIP) with a slight overshoot (2-4 %). **Effects** (opacity, colour) never overshoot. One fixed scheme; themes never set motion tokens. |
| D2 | Tempo | Today's durations stay roughly; the rhythm is refined by size and distance (micro step for tiny feedback, long step only for large surfaces and container transforms, travel-dependent durations capped). |
| D3 | Browser baseline | **Safari 16.4, Chrome/Edge 111, Firefox 128 ESR** (D28). Newer features only as refinements, named under "Progressive:". |
| D4 | Compatibility | A major version is allowed (1.0.0, migration section). Work goes **directly to `main`**, phase by phase, in technical order; every commit passes `npm run check` and the browser tests locally before it is pushed. The nightly template stays as it is. |
| D5 | Scope | All components. New: View Transitions, FLIP for lists, pointer-origin ripple, scroll-driven effects. |
| D6 | Press | **Ripple** from the pointer on every action **and shape morph**: pills become squarer while pressed and spring back; also clickable tiles and cards, the switch handle (it may grow while pressed), segmented options and drawer items. Automatic: the morph is pure CSS; the ripple needs one `DS.ripple.attach(root)`; without JS the state layer stays. |
| D7 | Data motion | User actions, **filtering and sorting (also while typing)** and **live data** glide (FLIP), interrupted and retargeted, with a row cap. Guard: while a mouse or pen is over the list or a row has focus, a reorder caused by live data waits (values update at once) until the pointer leaves, at most 2 s; user actions glide at once. |
| D8 | Reduced motion | **Ignored and removed.** The same motion on every device: the media-query switch, `.ds-motion-full`, `prefersReducedMotion()` and their docs and tests go. |
| D9 | Cascade | `@layer ds.*`, so unlayered project CSS always wins; specificity tricks go. |
| D10 | Loaders | **M3 Expressive is the default**: a shape-morphing loader, wavy linear and circular progress, the spinner as the growing and shrinking arc, two-segment indeterminate bar, the 2024 progress look (gap and stop dot). |
| D11 | Skeletons | One synchronised, calm diagonal wave across the whole surface. |
| D12 | Styleguide | A Motion Lab: global slow motion, curve and spring plots, replay per demo, rapid-toggle and interruption tests, a motion page with every choreography, duration ladder. Details are up to the implementer. |
| D13 | Verification | Playwright as a devDependency; browser tests in Chromium, Firefox and WebKit in CI. The `node --test` unit tests stay dependency-free. |
| D14 | Hover | Nothing moves on hover (no lift, no scale); state layer and, where documented, shadow only. |
| D15 | Views | M3 patterns by relationship: fade-through between top-level destinations, shared axis X for forward and back, container transform from a card or row into its detail. SPA helper and an opt-in MPA stylesheet; top bar and drawer stay still; the indicator glides across page loads. |
| D16 | Side sheet | An opaque panel slides the full width from the edge on the spatial spring (no panel fade), the scrim fades; on phones it rises from the bottom. The exit mirrors it, faster and accelerating. |
| D17 | Popups | Menus, combobox lists and tooltips grow out of their trigger: a clip-path reveal from the trigger edge plus a slight scale from an origin at the trigger; tooltips fade and scale from the anchor. CSS anchor positioning where available. Tooltips meet WCAG 1.4.13 and warm up along toolbars. |
| D18 | Overlay API | Native `<dialog>` with `showModal()` plus `DS.overlay` for dialog, sheet and modal drawer: interruptible, inert during the exit, focus back to the opener at once, an Escape stack, a counted scroll lock. The div markup keeps working. |
| D19 | Snackbars | A stack of at most three with FLIP; timers pause on hover, focus and a hidden tab. A fourth message replaces the **oldest non-persistent** one; if all three are persistent, it waits in a queue (D32). |
| D20 | Indicator | Directional stretch (the leading edge leads, the trailing edge follows) and a spring landing; duration grows with distance (capped); moved by transform or clip-path, not width and height; observes its items; survives `morphHtml`. |
| D21 | Interruption | Every motion continues from its current state with the curve of the new direction: overlays, tooltips, `enter()`/`leave()`, indicator, FLIP. Never a jump to full opacity, never a restart from zero, never a reversed entrance. |
| D22 | Chips | The width change on select glides, the check draws in, neighbours glide along (also across a wrap, via FLIP); reverse on deselect. |
| D23 | Checkbox, radio | Custom-drawn with `appearance: none` on the native input (no wrapper): the check draws in, the indeterminate dash morphs, the radio dot grows, hover and press halo, ripple; everywhere including tables; forced colours with system colours. |
| D24 | Focus | The ring is solid from the first frame, then snaps from a 4px to the 2px offset within 150 ms; plus a focus state layer. |
| D25 | Micro moments | Success check on buttons after a save (spinner and label crossfade without a width jump); icon swaps (copy to check, play to pause) as crossfade plus scale; disclosure chevrons rotate 180° with the expansion; validation messages fade in while their room opens smoothly. |
| D26 | New parts | Clickable card (`.ds-card--interactive`), selectable table rows (bulk selection), expandable table rows, a menu component (`.ds-menu`). |
| D27 | Language | All repository content stays English and project-neutral. |
| D28 | Engines | Firefox 128 ESR (so `@property` is baseline) and Chrome/Edge 111. |
| D29 | Layout sizes | Sizes that push layout (chip width, validation message room, expandable rows, `.ds-collapsible`) never overshoot: they open on `--ds-ease-out` and close on `--ds-ease-out` or `--ds-ease-in`, never on a curve that overshoots. Springs with overshoot only for movement that floats (translate, scale, clip-path). |
| D30 | VT fallback | Without View Transitions the new view fades through (`.ds-enter--swap`), without a shared element. |
| D31 | Release | **P1 and P2 ship together as 1.0.0**: every break and every behaviour change in one release with one migration section. Every 1.x after it is additive. |
| D32 | Snackbar queue | See D19. |
| D33 | Top bar | On scroll the top bar tints to a surface container colour and shows its hairline, scroll-driven where supported. |
| D34 | Block loaders | `.ds-boot` and `.ds-loading` show the shape-morphing loader; inline spots keep the arc spinner. |
| D35 | Plan | This overview plus one file per phase and a coverage table. |

## Canonical spec

The area plans used different names for the same thing. These are binding; phase files use them.

### Baseline and cascade

- Engines: Safari 16.4, Chrome/Edge 111, Firefox 128. Directly allowed: `:focus-visible`, `:has()`, `inset`, container
  queries, `color-mix()`, `svh`/`dvh`, `<dialog>`, `inert`, `@layer`, `@property`, individual `translate`/`scale`/
  `rotate`, CSS nesting is **still not used** (readability, and Safari 16.4 lacks it). JS: ES2022 (destructuring,
  class fields, `??=`, `at()`), sibling `import`s inside `src/js/` (the build bundles them).
- Progressive only (feature query, "Progressive:" note, fallback named): `linear()`, `@starting-style`,
  `transition-behavior: allow-discrete`, `popover`, anchor positioning, View Transitions, scroll-driven animations,
  `interpolate-size`, `::details-content`, `overflow-clip-margin`, `sibling-index()`, `moveBefore()`.
- Layers, declared once at the top of `ds.css` and tested to be the same string everywhere:
  `@layer ds.tokens, ds.base, ds.components, ds.motion, ds.utilities;`
  `@keyframes` sit in `ds.motion`; `.ds-enter`, `.ds-leave`, `.ds-stagger`, `.ds-reveal`, `.ds-collapsible`, `.ds-swap`
  sit in `ds.utilities`, so a utility beats a component's own animation without specificity tricks (`.ds-enter.ds-enter`
  goes). `@property` and `@font-face` stay at top level.
- `!important` only on an allowlist (tested): `base.css` `[hidden]`, the `.ds-sr` rules, the alignment utilities,
  the forced-colours `svg` colour in `shell.css`.

### Motion tokens

| Token | Value | Use |
|---|---|---|
| `--ds-dur-micro` | 50ms | press-in of layers and radius, tiny ticks |
| `--ds-dur-instant` | 100ms | pressed state, popup exits |
| `--ds-dur-fast` | 150ms | colour, small exits, focus snap |
| `--ds-dur-base` | 200ms | toggles, exits of panels and dialogs |
| `--ds-dur-medium` | 250ms | small spatial movement (handle, chip, check), menu entrances |
| `--ds-dur-slow` | 350ms | dialogs, FLIP, indicator cap |
| `--ds-dur-long` | 450ms | sheets, modal drawer, container transform; never routine UI |
| `--ds-dur-glide` | 600ms | values that travel (progress, `countUp`) |
| `--ds-ease-in-out` | `cubic-bezier(.2, 0, 0, 1)` | M3 standard: effects (opacity, colour), on-screen changes |
| `--ds-ease-out` | `cubic-bezier(.05, .7, .1, 1)` | emphasized decelerate: entering movement fallback, layout-pushing sizes (D29) |
| `--ds-ease-in` | `cubic-bezier(.3, 0, 1, 1)` | standard accelerate: small exits |
| `--ds-ease-exit` | `cubic-bezier(.3, 0, .8, .15)` | emphasized accelerate: large surfaces leaving (movement only) |
| `--ds-ease-emphasized` | unchanged (`linear()` path, cubic fallback) | movement that starts and ends on screen |
| `--ds-ease-spatial` | spring, ζ = 0.75, peak about 1.028, sampled into `linear()`; fallback `--ds-ease-out` | every spatial movement that floats (D1) |
| `--ds-ease-value` | `var(--ds-ease-in-out)` | progress bars and `countUp`, so figures and bars land together |
| `--ds-ease` | deprecated alias of `--ds-ease-emphasized` | (removed in 2.0) |
| `--ds-time-scale` | registered, `inherits: true`, `initial-value: 1`, never declared | multiplies every duration **and** delay; for the Motion Lab and tests only (a test forbids setting it in `src/components/` and `themes/`) |

- The spring is normalised to its settle time, so one curve serves every size: small controls take
  `--ds-dur-medium`, menus and popups `--ds-dur-medium` (so their `--ds-dur-instant` exit stays in the ratio band), dialogs, FLIP and the indicator `--ds-dur-slow`, sheets, drawer and container transforms
  `--ds-dur-long`. There are no `--ds-dur-spatial-*` or `--ds-dur-spring-*` tokens.
- The overshoot percentage is the contract, not ζ: spatial curves peak at most 1.05 and settle; effects curves stay
  within [0, 1] and are monotonic (tested). All sampled curves come from one generator,
  `scripts/motion-curves.mjs`, whose `--check` mode is part of `npm run check`.
- Distances unchanged (`--ds-distance-sm/md/lg/xl/sheet`); scales: `--ds-scale-enter` .98 (dialogs, cards),
  `--ds-scale-popup` .95 (menus, combobox list), `--ds-scale-tooltip` .9, `--ds-scale-small` .6 (badges, pop).
- Press shape roles (layer 2, themeable): `--ds-radius-action-pressed` (12px), `--ds-radius-card-pressed`
  (`var(--ds-radius-sm)`, 8px: cards and radio cards go 12 to 8px); tiles go 16 to 12px through their hook
  `--ds-tile-radius-pressed` (fallback `var(--ds-radius-md)`).
- Holds and delays (layer 1, in the time-scale form): `--ds-hold-loader` 450ms (P2, minimum visible time of a
  loader), `--ds-hold-success` 600ms (P3, success face of a busy button), `--ds-delay-tooltip` 500ms,
  `--ds-delay-tooltip-skip` 300ms and `--ds-delay-tooltip-hide` 100ms (P5).
- Exit to entrance ratio, measured on the longest track per component: 0.3 to 0.8 (tested); popups may exit in
  `--ds-dur-instant`.
- Motion hooks do not inherit: `--ds-motion-distance`, `--ds-motion-scale`, `--ds-motion-origin`, `--ds-clip-from`,
  `--ds-draw-length`, `--ds-i`, `--ds-enter-*`, `--ds-leave-*` are registered with `inherits: false`.

### What may animate

`transform`, `translate`, `scale`, `opacity`, colours, `box-shadow`, `clip-path`, registered custom properties, plus
these named exceptions (tested by an allowlist): `rotate` for spinners, loaders, disclosure chevrons and icon swaps;
`border-radius` for the press morph; `outline-offset` for the focus snap (a transition, never a keyframe, so it cannot
take over an element's `animation`); `stroke-dashoffset` for drawn checks; `mask-position` for the travelling progress wave;
`width` of the chip check slot; height of `.ds-collapsible`, the validation message room and expandable rows
(`grid-template-rows`, or `height` through `interpolate-size`; opening on `--ds-ease-out`, closing on `--ds-ease-out`
or the accelerating `--ds-ease-in`, never a spring); the `min-height` of a `flip()` container shrinking
after its removed items left (WAAPI, on `--ds-ease-out`, D29). Never `transition: all`, never `font-weight`.

Hover never moves anything (D14). Nothing scales on press except the switch handle (D6); the press feedback is ripple,
layer and morph.

### Keyframes

- Movement keyframes use the individual `translate` and `scale` properties, so they compose with a page's inline
  `transform` (tooltip, indicator, FLIP) and can be snapshotted on interruption.
- Exits are movement-only and always paired with `ds-fade-out` (tested over every `animation` list in `src/`); the
  combined `ds-sink-out`, `ds-scale-out`, `ds-slide-out` stay as deprecated aliases.
- Movement-only exits: `ds-drop-out` (down), `ds-shrink-out` (smaller), `ds-shift-out` (sideways); the side sheet's
  full-width slide is the one named exemption from the fade pairing (D16: an opaque panel).
- New: `ds-press-ripple` (pointer ripple; the existing `ds-ripple` stays the confirmation ring), `ds-pop-out`,
  `ds-progress-wave` (the wave of determinate wavy progress travels one wavelength per loop),
  `ds-clip-in` / `ds-clip-out` (popup reveal from `--ds-clip-from`), `ds-skeleton-wave`, `ds-spinner-arc`,
  `ds-loader-morph` and `ds-loader-turn`, `ds-progress-head` and `ds-progress-tail` (two-segment indeterminate).
- `ds-draw`, `ds-scan`, `ds-roll-in/out` and `ds-ripple` are kept (now used by P3, P6 and the Motion Lab); nothing
  is pruned.

### JS API (1.0.0 unless noted)

| Export | Signature and contract |
|---|---|
| `DS.motion.enter` / `leave` | `enter(el, variant?)`, `leave(el, variant?, { then, focus })`; a per-element generation token, so a later call supersedes an earlier one (its promise resolves without acting); `enter` clears `hidden`; `leave` moves focus to `focus` (or the opener) if focus is inside, sets `inert` during the exit; both continue from the current state (D21). |
| `enterAll` / `staggerOnce` | batched entrances (one style flush), first-render stagger that cleans up its classes and `--ds-i`. |
| `settled(el, opts)` | waits for the element's own `getAnimations()` of the given names (`Promise.allSettled` of `finished`), ignores infinite loops and unrelated transitions, ceiling from the computed duration and delay; resolves on the next frame when nothing runs. |
| `replay` | style flush instead of layout; works on SVG. |
| `motionDuration(el, token)` | computed token in ms, including `--ds-time-scale`; falls back to the exported constants outside a `.ds-theme`. |
| `travelDuration(el, px)` | one function for FLIP and the indicator: from `--ds-dur-medium` up to `--ds-dur-slow` by distance. |
| `flip(container, mutate, { items, live, max = 50, hold = 2000 })` | measure, `mutate({ holdOrder })`, play `translate` to rest on `--ds-ease-spatial`; retargets mid-flight; removed items fade in place out of flow; above `max` items it updates without motion; `live: true` applies the pointer and focus guard (D7; mouse and pen only, touch never holds). |
| `originFrom(trigger, panel)` | returns `{ origin, side }` and writes `--ds-motion-origin` and `--ds-clip-from` on the panel. |
| `countUp(el, to, { from, format })` | counts from the shown value (first call from 0) on `--ds-ease-value` over `--ds-dur-glide`; cancels a running count; `aria-busy` while counting; tabular figures; returns `{ cancel, finished }`. |
| `roll(el, text)`, `crossfade(el, next, { kind })`, `busy(button, work, { done })` | rolling status line; `.ds-swap` / `.ds-icon-swap` crossfades; busy and success faces (CSS faces, no width measuring). `crossfade` kind `'text'` in P2; kind `'icon'` and `busy()` in **P3 (1.1.0)**, because they need P3's button faces. |
| `cancel(el)`, `motionEasing(el, token)`, `MOTION_FALLBACKS` | stop a helper-driven motion at its current state; the computed curve of a token (cubic fallback where `linear()` cannot be parsed); the constant fallbacks outside a `.ds-theme`. |
| `transition(update, { type, from })` | `type`: `'fade-through'`, `'forward'`, `'back'`, `'container'`; View Transitions where available (only with `html.ds-theme`), `.ds-enter--swap` otherwise (D30); `skipTransition()` when one is already running. P7. |
| `DS.dom.morphHtml(target, html, { replace })` | patches attributes in place, keys on `data-ds-key` then `id`, keeps focus, caret and IME, keeps a track's `.ds-indicator`, `data-ds-replace` on a subtree or `{ replace: true }` restores replacement; insert and remove hooks for FLIP. |
| `DS.ripple.attach(root)` | delegated pointer ripple on every action host; returns `{ detach }`; only inside positioned hosts (`ripple.css` gives hosts `position: relative; overflow: clip`). |
| `DS.overlay` | `open(el, { opener })`, `close(el)`, `tooltips(root)`, `toast(region, content, opts)`; native `<dialog>` first, div markup as fallback; documented in `docs/motion.md`. P5 (the module skeleton and `lockScroll` arrive in P5; P4 keeps the page recipe). |
| `DS.indicator.createIndicator` | stretch and spring (P4); observes the active item and the track; `update()` stays; a `name` option gives the view-transition name `ds-indicator-<name>` (P7). |
| removed | `prefersReducedMotion` (D8); `COUNT_UP_MS` and `LOADER_DELAY_MS` stay as fallbacks. |

Interruption (D21) uses one mechanism: read the current computed values, cancel the running CSS animation, then
`el.animate([current, target], { duration, easing })` with the curve of the new direction (an unparseable `linear()`
falls back to its cubic). The P0 capability spike confirms it in all three engines before P2 builds on it.

## Phases

Each phase ends with `npm run check`, the browser tests in all three engines, the screenshot review and a push to
`main`. P1 and P2 are committed separately but pushed together.

| Phase | Content | Version |
|---|---|---|
| [P0](motion-2/P0.md) | Tooling and safety net: Playwright, browser harness, helpers, capability spike, baselines, known bugs as `test.fail` | none (dist unchanged) |
| [P1](motion-2/P1.md) | Foundation: baseline, `@layer`, reduced motion removed, rules rewritten, token system, curve generator, non-inheriting hooks, keyframe catalogue | 1.0.0 (with P2) |
| [P2](motion-2/P2.md) | Motion engine: `DS.motion`, `DS.dom`, `DS.ripple`, interruption, FLIP | 1.0.0 (with P1) |
| [P3](motion-2/P3.md) | Controls: press morph and ripple, focus snap, buttons, chips, switch, checkbox and radio, fields, disabled states | 1.1.0 |
| [P4](motion-2/P4.md) | Navigation: indicator, drawer, modal drawer, segmented, top bar (there is no rail component; none is added) | 1.2.0 |
| [P5](motion-2/P5.md) | Overlays: `<dialog>` and `DS.overlay`, side sheet, `.ds-menu`, combobox, tooltip, snackbar stack | 1.3.0 |
| [P6](motion-2/P6.md) | Feedback and data: Expressive loaders, skeleton wave, progress, status, tables, cards, tiles, alerts, collapsible | 1.4.0 |
| [P7](motion-2/P7.md) | View Transitions (SPA and MPA) and scroll-driven effects | 1.5.0 |
| [P8](motion-2/P8.md) | Motion Lab, docs completion, final review in all engines | 1.6.0 |

### Definition of done (every phase)

1. `src/` → docs → styleguide demo → unit tests → browser tests → CHANGELOG → version → `npm run build` →
   `npm run check` → `npm run test:browser` (Chromium, Firefox, WebKit, plus the `fallback` project from P2 on).
2. Every `test.fail` marker of a bug this phase fixes is turned into a passing test.
3. Screenshots and, for motion, a short video of every changed demo at `?speed=0.1`, compared with the P0 baseline.
4. AGENTS.md, `docs/rules.md` and the component header comments match the code.
5. The phase file's coverage ids are all done or moved explicitly (update [coverage.md](motion-2/coverage.md)).

## Verification

- `test/browser/` with `@playwright/test`; one helper module `test/browser/helpers/motion.js` (timelines from
  `getAnimations()`, seek-based curve sampling, rAF sampling with tolerances only for interruption, `expectContinuous`,
  peak and settle checks, `press()`, keyboard focus).
- Mid-animation screenshots pause all animations and seek `currentTime`; `animations: 'disabled'` only for settled
  shots.
- Known bugs as `test.fail(condition)` per engine (a `fixme` never runs and proves nothing).
- Projects: `chromium`, `firefox`, `webkit`, and from P2 on `fallback`: Chromium with every progressive block stripped
  from `ds.css`, `linear()` replaced by its cubic fallback, and `startViewTransition`, `showPopover` and anchor
  positioning removed, so the fallback paths are proven too.
- Positive check for D8: `emulateMedia({ reducedMotion: 'reduce' })` produces the same timelines.
- Locally: the browsers are in the Playwright cache; pin `@playwright/test` to the release that matches them (P0).
  CI uses the official Playwright container of the same version, so screenshots match.

## 1.0.0 migration (outline; full text in CHANGELOG with P2)

- Browser floor: Safari 16.4, Chrome/Edge 111, Firefox 128.
- `@layer`: project CSS without layers now beats every component. Resets (`button { font: inherit }`, normalize,
  utility-framework preflights) must go into a layer declared before ds: `@layer reset;` first, then load `ds.css`.
  Projects that declare their own layers list `ds` where it belongs.
- Reduced motion: removed. `.ds-motion-full` and `prefersReducedMotion()` are gone; remove them from project code.
- Behaviour: `morphHtml` patches in place (listeners survive: bind once, or mark a subtree `data-ds-replace`);
  `leave()` moves focus and sets `inert`; `enter()` clears `hidden`; `settled()` resolves when nothing runs.
- Motion: springs on spatial movement, new exit curves, movement-only exit keyframes (old names kept as aliases),
  `--ds-ease` deprecated.

## Risks and fallbacks

| Item | Risk | Fallback |
|---|---|---|
| Spring on clip-path edges (indicator) | an overshoot past the box edge is clipped and invisible | the union box carries an overshoot margin on the travel axis |
| Interruption via `animate()` | engine differences | P0 spike; cubic fallback for `linear()`; old restart behaviour only as last resort |
| `appearance: none` checkbox | Firefox pseudo rendering, clipping in table wrappers | P0 spike; halo via `box-shadow` on the 18px input |
| Skeleton wave with `background-attachment: fixed` | ignored on iOS, desyncs inside transformed parents | time-synchronous wave as documented fallback; start after the container's entrance |
| Polygon loader morph | paint cost | a few loaders per view; inline spots use the arc spinner |
| `<dialog>` leaving the top layer | z-order during the exit outside Chromium | `--closing` keeps `position: fixed` and `--ds-z-dialog` |
| Popover and anchor positioning | partial support | JS placement, proven in the `fallback` project |
| View Transitions | block input, snapshot the host page | only with `html.ds-theme`, short durations, `skipTransition()` |
| Scroll-driven animations | not in Firefox; the `animation` shorthand resets the timeline | static fallback; ordering test |
| FLIP and ripple on `<tr>` | WebKit and Firefox quirks | P0 spike; rows FLIP even if they get no ripple |
| `@layer` | project resets win | migration note, reset fixture in the P0 baseline |
| Edge-anchored overshoot | a gap at the screen edge | bleed on sheet, modal drawer and phone snackbars; phone dialogs without scale overshoot |
| Live data FLIP | a row moves as the user aims at it | the pointer and focus guard (D7), cap of 50 rows |

## Rules that change in AGENTS.md (P1)

- Safari 14 bullet → the D3/D28 baseline and the progressive list above.
- New bullet: the layer order and the `!important` allowlist.
- "Tokens on `.ds-theme`" stays; `@property` registrations are the documented exception at top level.
- Motion bullet → the animate list above, springs only for floating spatial movement, effects within [0, 1], exit
  ratio, no hover movement, no scale on press except the switch handle.
- The reduced-motion bullet is deleted.
- State layers bullet → plus ripple, press morph and the focus snap (ring solid from frame 1).
- JS → ES2022 with sibling imports.
- Commands → `npm run test:browser` and the curve generator; "Making a change" gains the browser test step.
