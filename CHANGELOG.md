# Changelog

All notable changes. Versions follow [semver](https://semver.org): renaming or removing a token, class, hook or JS
export is a major change; adding one is a minor change.

## 1.1.0

Motion 2, the controls: every action presses with a layer in `--ds-dur-micro`, a ripple and a shape morph; every
focus ring is solid from the first frame and snaps to its offset, with a focus layer; buttons get busy and success
faces without a width jump and icon swaps; chips, the switch and drawn checkboxes and radios move on the shared
timing; fields and disabled states follow one model. Additive: no class, token, hook or export was removed or
renamed. Screenshots of pressed, focused and disabled controls change (see "Changed").

### Added

- Button faces: `.ds-btn__faces` with `.ds-btn__face`, `.ds-btn__face--busy` and `.ds-btn__face--done` stack every
  label in one cell, so a button never changes width; `.ds-btn--done` shows the success face (its `pathLength="1"`
  check draws itself) and blocks the button like `aria-busy`.
- `DS.motion.busy(button, work, { done })`: `aria-busy` at once, the busy face only after `--ds-delay-loader`, kept
  for the loader minimum once shown, then `.ds-btn--done` for `--ds-hold-success`; a failure clears at once and
  rethrows; a second call while busy returns the running promise.
- `.ds-icon-swap` (`.ds-icon-swap__a`, `.ds-icon-swap__b`, `data-swap` or an `aria-pressed="true"` ancestor) and
  the `'icon'` kind of `DS.motion.crossfade()`: the incoming icon fades in and springs up from `--ds-scale-small`, a
  drawn glyph draws itself, the outgoing one fades.
- Switch state words: `.ds-switch__state` may hold both `.ds-switch__on` and `.ds-switch__off`; the CSS shows the
  right one and crossfades them (the single-word markup still works).
- `.ds-checkbox` and `.ds-radio-input`: a drawn checkbox or radio anywhere (a table column, a list item).
- Tokens: `--ds-state-focus` (.10, the focus layer), `--ds-hold-success` (600ms); roles `--ds-radius-check` (2px),
  `--ds-radius-action-pressed` (12px) and `--ds-radius-card-pressed` (`= --ds-radius-sm`).
- Hooks: `--ds-btn-radius-pressed`, `--ds-btn-state-focus-opacity`, `--ds-chip-height`, `--ds-chip-check-size`,
  `--ds-chip-disabled-border`, `--ds-chip-disabled-bg`, `--ds-switch-halo`, `--ds-switch-disabled-track`,
  `--ds-switch-disabled-handle`, `--ds-check-size`, `--ds-check-target`, `--ds-drawer-item-height`.
- Ripple hosts: `.ds-radio` (radio cards, also when their input is pressed), `.ds-combo__toggle` and
  `.ds-errors summary`; `DS.ripple.RIPPLE_HOSTS` exports the host selector. `DS.ripple.attach()` also glides chips
  that a toggle moves to another line (FLIP, each chip on an opaque backing in the colour behind the row:
  `data-ds-glide`, `--ds-chips-backdrop`; the toggled chip opens with its neighbour by `clip-path` and its label
  glides, so the two never overlap), and plays the check slot from where it is on a rapid toggle.
- `.ds-pressed` (the press `DS.ripple` holds) now counts as a press on every host: chips, segmented options, drawer
  items, tiles, table sort buttons, radio cards, the combobox toggle and the errors summary; a static
  `.ds-pressed` shows a held press.

### Changed

- **Press morph**: buttons (`.ds-btn`, also `--icon` and `--disc`), drawer items (and the pill under the active
  one) and the combobox toggle turn squarer while pressed (`--ds-radius-action-pressed`, in `--ds-dur-micro`) and
  spring back on release (`--ds-ease-spatial`, `--ds-dur-medium`); radio cards go to `--ds-radius-card-pressed`;
  segmented options morph the clip of their state layer. The rest radius of a pill is now `min(radius, half the
  height)` instead of 9999px (the same look; the morph interpolates over its whole run). Disabled, `aria-disabled`,
  busy and done controls neither morph nor show a press.
- **Micro press-in**: every press layer comes in `--ds-dur-micro` instead of `--ds-dur-instant`.
- **Focus**: every ring is solid from the first frame and snaps from offset + width to its offset
  (`outline-offset`, `--ds-dur-fast`; inset rings of segmented options, drawer items and `.ds-parts` links from the
  edge inward), with a focus layer (`--ds-state-focus`) under it on buttons, chips, segmented options, drawer items,
  tiles, table sort buttons and the errors summary. Drawer items now have a ring of their own; `.ds-link-btn` and
  `.ds-errors summary` show theirs without `.ds-base`; `.ds-parts` no longer clips the rings of its links.
- **Checkboxes and radios are drawn** on the native input (`appearance: none`, no wrapper) instead of
  `accent-color`, in `.ds-check`, `.ds-table` (not the hidden input of a switch or chip in a cell), radio cards and
  the new classes: the check wipes in from its short
  arm, the indeterminate dash and the check morph into each other, the radio dot springs, and a 40px halo shows
  hover (also on the `.ds-check` row), press and focus (on touch screens a tap grows it from the centre). In a table
  cell the box now centres on the text (`vertical-align: middle`). Forced colours use system colours.
- **Chips**: the check keeps its room in the layout; selecting grows its slot (`width`, `--ds-ease-out`, the
  neighbours follow) and draws the check; deselecting reverses it.
- **Switch**: the handle is one 28px box moved and scaled on the spring (`translate`, `scale`; never above 1), grows
  to its full size while pressed, and a halo (`--ds-switch-halo`) follows it for hover, press and focus.
- **One disabled model**: chips and the switch now take the button's neutral Material look
  (`--ds-disabled-fill`, `--ds-disabled-ink`; a dimming theme keeps their own colours), show no hover, press,
  ripple or halo and take the `not-allowed` cursor; buttons, chips, the switch and the inputs fade into the
  disabled look on `--ds-dur-fast`.
- **Fields**: on blur border, inner ring and text fade back together (the ring never fades as half a ring); the
  label takes the primary colour with the ring and keeps the error ink on an invalid field; an error message fades
  in and, where `interpolate-size` exists, its room opens from 0 when it appears while focus is in its form or
  field (a message already in the markup only fades, so nothing shifts on load).
- `.ds-link-btn`: a press darkens its underline. `.ds-errors summary`: a state layer, the ripple and a 4px padding
  that hangs into the space around it. `.ds-combo__toggle`: a state layer, the ripple and the press morph.
- The `check` glyph is drawn from its short arm (`M4 12l5 5L20 6`, `pathLength="1"`); the tick of `checkCircle`
  can draw itself too. Same shape; only `ds-draw` and drawn checks change direction.
- A project `transition` on `.ds-btn`, `.ds-chip__body` or `.ds-input` (unlayered, so it wins) replaces the
  component's list, and with it the focus snap, the spring back of the morph and the ring's fade: set hooks
  instead (docs/theming.md, "Layers").

### Fixed

- `DS.ripple`: a chip or radio card whose input is disabled by a disabled `<fieldset>` (such as
  `<fieldset class="ds-chips" disabled>`) no longer gets a ripple or `.ds-pressed`; only an input's own `disabled`
  attribute counted before.

### Deprecated (removed in 2.0)

- `.ds-btn__swap` (one face that the page swaps): use `.ds-btn__faces` and `DS.motion.busy()`.

## 1.0.0

Motion 2, the foundation and the engine: a newer browser floor, cascade layers, one motion scheme on every device, a
spatial spring, a rebuilt keyframe catalogue, and a `DS.motion` that reads its timing from the tokens, continues
interrupted motion from where it is and glides data (FLIP, figures that count from what they show). `DS.dom.morphHtml`
patches in place, and the new `DS.ripple` grows a ripple from the pointer. Breaking; read the migration notes.

### Migration

- **Browser floor**: Safari 16.4, Chrome/Edge 111, Firefox 128. Older browsers are no longer supported.
- **`@layer`**: every stylesheet puts its rules into `ds.tokens`, `ds.base`, `ds.components`, `ds.motion` or
  `ds.utilities`, so unlayered project CSS now beats every component, whatever its specificity. Move resets
  (normalize, `button { font: inherit }`, framework preflights) into a layer declared before ds: `@layer reset;`
  first (or `@layer reset, ds, app;`), then load `ds.css`. Drop the `!important` and doubled selectors written
  against ds. A layered `!important` (`[hidden]` with `.ds-base`, `.ds-sr`, `.ds-num`, `.ds-center`) beats a
  project's unlayered `!important`. Never wrap a theme in `@layer`: unlayered, it wins over every `ds.*` layer.
- **Reduced motion is removed**: the `prefers-reduced-motion` switch in `tokens.css`, `.ds-motion-full` (harmless if
  left) and `DS.motion.prefersReducedMotion()` (a call now throws: delete it). Motion is the same on every device.
  A project that needs a reduced mode implements it itself.
- **Motion hooks no longer inherit** (`--ds-motion-*`, `--ds-enter-*`, `--ds-leave-*`, `--ds-clip-from`,
  `--ds-draw-length`, `--ds-i`): set them on the animating element.
- **Duration-like tokens are `calc()` expressions** (`calc(250ms * var(--ds-time-scale, 1))`): read them with
  `DS.motion`, not `parseInt`.
- **Movement keyframes animate `translate` and `scale`**, so they compose with an element's `transform`. A project
  rule that sets `translate` or `scale` on an animating element is overridden while the animation runs.
- **Exits are movement-only**: pair `ds-drop-out`, `ds-shrink-out` and `ds-shift-out` with `ds-fade-out`.
  `ds-sink-out`, `ds-scale-out` and `ds-slide-out` are deprecated (still fade + move).
- `.ds-enter.ds-enter` and `.ds-leave.ds-leave` are single classes; the `ds.utilities` layer makes them win.
- Never put `.ds-enter` on a looping element (a spinner) in static markup: the entrance now plays once and ends,
  and it replaces the loop while the class stays. Wrap the spinner (`<span class="ds-enter ds-enter--delayed">`)
  or use `.ds-loading`.
- **Motion character**: spatial movement floats on a spring (`--ds-ease-spatial`, a 2.8 % overshoot that settles),
  exits accelerate on the new exit curves (`--ds-ease-in`, `--ds-ease-exit` for large surfaces), and `--ds-ease` is
  deprecated (use `--ds-ease-emphasized`). Screenshots and timings of animated states change.

Behaviour of the JS exports (`DS.dom`, `DS.motion`):

- **`morphHtml` patches in place.** A node of the same tag (and key) is kept and its attributes are synced, where
  0.1.0 replaced any node whose attributes changed. Listeners on kept nodes therefore stay: bind them once
  (delegate to a container), or mark a subtree `data-ds-replace`, or pass `{ replace: true }` to get fresh nodes
  as before. Key list rows with `data-ds-key` (or `id`) so a reorder moves them. Nodes marked `data-ds-keep` are
  never touched; the focused element is never replaced and keeps its value and caret.
- **`leave()` moves focus and sets `inert`.** Focus inside the leaving element goes to `focus` (new option), else
  the element that had focus when `enter()` ran, else the closest `tabindex="-1"` ancestor, before the element turns
  `inert` for its exit: it takes no clicks or focus while it leaves. `then: 'hide'` clears `inert` again;
  `then: 'keep'` leaves it invisible and inert until `enter()` or the new `cancel()`. While `leave()` is
  removing an element (`then: 'remove'`) it carries `data-ds-leaving`, so `morphHtml` skips it instead of patching
  it into the next item; `enter()` and `cancel()` take the mark back.
- **`enter()` clears `hidden`** (and an `inert` that `leave()` set): drop the `el.hidden = false` before it.
- **A later call wins.** `enter()`, `leave()` and `cancel()` keep one state per element: a call made while
  another motion runs continues from the current state (no restart, no reversed entrance), and the earlier call's
  promise resolves without acting (a superseded `leave()` never removes or hides). Both remove every `ds-enter*` and
  `ds-leave*` variant class, not only their own.
- **`settled()` resolves when nothing runs** (on the next frame) instead of after its 1000ms timeout, and otherwise
  when the element's own finite animations finish or are cancelled; its ceiling comes from their timing. Transitions
  count only with `transitions: true` (or `event: 'transitionend'`); pseudo-elements and loops never count. Code
  that relied on the fixed wait waits for the motion it starts.
- **`countUp` counts from the shown value** (0 on the first call) on `--ds-ease-value` over `--ds-dur-glide`, up or
  down, instead of from 0 on an ease-out each time; the same value again changes nothing, a new call takes over the
  running count, a count down to 0 animates too, and it returns `{ cancel, finished }` (was `undefined`). Pass
  `from` to start elsewhere. While it counts the element is `aria-busy` and keeps its width.
- Timing comes from the computed tokens: `settleLoader` takes `{ element }` to read `--ds-delay-loader` (or
  `--ds-delay-boot` inside `.ds-boot`) and `--ds-hold-loader` time-scaled; the exported constants stay as the
  fallbacks outside a `.ds-theme`.

### Changed

- `.ds-leave` takes 150ms (`--ds-dur-fast`), `.ds-leave--scale` and `--slide` 200ms; the variants run
  `ds-fade-out` plus a movement-only exit.
- `.ds-enter`, `.ds-enter--slide`, `.ds-reveal` and `.ds-stagger` move on the spatial spring (`--ds-ease-spatial`);
  the fades stay on the standard curve. `.ds-enter` plays once, also on an element with its own loop.
- `.ds-stagger` children rise 4px as they fade in. A loader (`.ds-skeleton`, `.ds-loading`, `.ds-boot`,
  `.ds-spinner`) placed directly in `.ds-stagger` or given `.ds-reveal` keeps its own loader delay and loop.
- `.ds-enter--fill-x` / `--fill-y` grow on `--ds-ease-value`.
- `.ds-enter--pop` springs in too: its scale settles about 1% past full size.
- A tooltip placed with an inline `transform` no longer flies in from the page origin (the keyframes no longer
  replace its `transform`). Place tooltips with `top`/`left`: a `transform` placement still drifts in by
  (1 - scale) × offset unless the script also sets `transform-origin: calc(50% + Xpx) calc(50% + Ypx)`.
- The disc of `.ds-btn--disc` only fades (no scale on hover or press); the arrow of `.ds-card__link` no longer
  leans on hover.
- A closing dialog's or side sheet's backdrop catches clicks during the exit; the dialog box fades and drops, the
  sheet panel fades and shifts away on `--ds-ease-exit`.
- The `hidden` attribute hides `.ds-dialog`, `.ds-sheet` and `.ds-combo__popup` without `.ds-base`.
- Focus rings sit on `:focus-visible` (no `:focus` fallback rules).
- `icon()` escapes `className`.
- `ds.js` loaded twice keeps the first copy as `window.DS`; every copy is in `DashboardStyle.versions`.
- The styleguide's `?speed=<factor>` sets `--ds-time-scale`; `DS.motion` reads every duration from the computed
  tokens, so JS and CSS slow down together.
- `DS.motion.enter()` / `leave()`: interruptible (an interrupted motion continues from its current opacity,
  `translate`, `scale` and `clip-path` on the new direction's curve, for the share of the duration left, through
  `el.animate()`, without inline style; a value the new motion has no track for, such as the lift of an entrance
  under the fade-only `leave()`, glides to its rest instead of snapping), one state per element, focus and `inert` handling, `hidden` cleared (see
  the migration notes).
- `DS.motion.settled()` watches the element's own animations (`getAnimations()`) with a derived ceiling; new
  options `names`, `transitions` and `subtree`.
- `DS.motion.countUp()` counts from the shown value on the curve and time of progress bars, on a clock animation of
  the element (id `ds-count`) that starts in the same frame as a CSS transition, so a figure and its bar land
  together; one count per element; tabular figures; returns `{ cancel, finished }`.
- `DS.motion.replay()` restarts with a style flush instead of a layout read (works on SVG).
- `DS.dom.morphHtml()` patches in place, keyed (`data-ds-key`, then `id`), moves with `moveBefore` where it exists,
  keeps focus, caret and the runtime classes and properties DS writes, looks ahead at most 8 siblings.
- `DS.indicator`: the indicator span carries `data-ds-keep` and comes back if a re-render dropped it.

### Added

- Tokens: `--ds-dur-micro` (50ms), `--ds-dur-long` (450ms), `--ds-ease-exit`, `--ds-ease-spatial` (a spring,
  peak about 1.028, `linear()` with the `--ds-ease-out` fallback), `--ds-ease-value`, `--ds-scale-popup` (.95),
  `--ds-scale-tooltip` (.9), and the registered `--ds-time-scale` (slow motion for the styleguide and tests only).
- Keyframes: `ds-drop-out`, `ds-shrink-out`, `ds-shift-out`, `ds-pop-out`, `ds-clip-in`, `ds-clip-out`,
  `ds-press-ripple`.
- `.ds-leave--pop` (`leave(el, 'pop')`) and the `--ds-leave-easing` hook.
- Where `sibling-index()` exists, `.ds-stagger` numbers its children without `stagger()`.
- Modules in `src/js` may import from an earlier module (`scripts/build.mjs` bundles them).
- `DS.motion`: `motionDuration`, `motionEasing`, `MOTION_FALLBACKS`, `travelDuration`, `cancel`, `enterAll`,
  `staggerOnce`, `flip` (FLIP for lists: retargets mid-flight, moving items paint above the ones they cross, removed items fade out of flow inside the list, which
  keeps its height meanwhile and then glides to the new one, a cap of 50 moving items, a live guard that holds reorders under a mouse or pen or focus for at most 2s), `originFrom`, `roll` and
  `crossfade` (kind `'text'`); `leave()` takes `focus`; `loaderHoldMs()` and `settleLoader()` take `delay` and
  `minVisible`, `settleLoader()` also `element`; `countUp()` takes `from`.
- `DS.dom.morphHtml()` / `morphChildren()` options `replace`, `holdOrder`, `onInsert` and `onRemove` (a returned
  Promise keeps the node as a pending removal); the attributes `data-ds-key`, `data-ds-keep` and `data-ds-replace`.
- `DS.ripple` (`js/ripple.js`, `window.DS.ripple`): `attach(root)` gives every action a ripple from the pointer
  (Enter and Space: from the centre) and returns `{ detach }`; it also adds the passive `touchstart` listener iOS
  needs for `:active`. `components/ripple.css`: `.ds-ripples`, `.ds-press-ripple`, `.ds-press-ripple--out`,
  `.ds-pressed`, `data-ds-ripple` (`="off"` opts out) and the hook `--ds-ripple-color`.
- `.ds-swap`: a slot whose old and new content cross in one grid cell (`roll()`, `crossfade()`).
- `--ds-hold-loader` (450ms): how long a loader that showed stays at least (`LOADER_MIN_VISIBLE_MS`).
- The Playwright `fallback` project: Chromium as an engine on the browser floor, so the fallback paths are tested.
- `scripts/motion-curves.mjs` generates the sampled curves (`npm run check` verifies them).

### Deprecated (removed in 2.0)

- `--ds-ease` (use `--ds-ease-emphasized`), `--ds-spinner-sm-track`.
- `DS.motion.easeOutCubic`, no longer used (`countUp` runs on `--ds-ease-value`).
- `ds-sink-out`, `ds-scale-out`, `ds-slide-out` (use `ds-fade-out` with `ds-drop-out`, `ds-shrink-out`,
  `ds-shift-out`).

## 0.1.0

First release.

- Tokens in three layers on `.ds-theme`: scales (motion, spacing, state layers, z), roles (neutral default palette,
  type roles, radii, elevation, focus, links, layout) and component hooks. One reduced-motion switch,
  `.ds-motion-full` opt-out.
- Motion: keyframes and the `.ds-enter`, `.ds-leave`, `.ds-stagger`, `.ds-reveal`, `.ds-collapsible` utilities;
  `.ds-enter--pop` for badges that appear; `ds-fill-x` / `ds-fill-y` with `.ds-enter--fill-x` / `--fill-y` for bars
  and columns that fill on first render.
- Opt-in page base (`.ds-base`).
- Components: button (variants, toggle, busy, focusable `aria-disabled`), spinner, sliding indicator, loading (boot,
  loading line, skeleton, loading bar), card, tiles (also clickable), lists and facts, empty state, status chip,
  alert, table (sortable headers, dense rows), form (fields, read-only, select, date, search, filters, action bar,
  checkbox, radio cards), chips, switch, combobox, progress, side sheet, dialog, snackbar, tooltip, app frame (top
  bar, navigation drawer, segmented switch, account, content panel, print styles), page layout, utilities.
- JS (ES modules and the classic `dist/ds.js`): `motion`, `indicator`, `dom` (morph), `icons` (82 outline glyphs,
  `icon()`, `iconElement()`).
- Google Sans (OFL 1.1) with `fonts.css`; theme template `themes/example.css`; living styleguide.
- `scripts/vendor.sh` and `scripts/vendor.ps1` for checksummed copies of the latest `main` (or any branch, tag or
  commit), recording the exact commit; `templates/update-dashboard-style.yml`, a nightly GitHub Actions workflow
  that vendors `main` when it changed, verifies, commits and starts the project's build.
- Focus rings sit on `:focus` and come off with a separate `:focus:not(:focus-visible)` rule, so browsers without
  `:focus-visible` (Safari 14.1 to 15.3) keep them; no selector list mixes `:focus-visible` or `:has()` with other
  selectors (a test enforces both).
- Drawer items may be `<button>`s; `<textarea class="ds-input">` and `<fieldset class="ds-field">` with
  `<legend class="ds-field__label">` are styled; the snackbar takes `--ds-toast-bottom` and `--ds-toast-shift-y`.
- The loading bar stays visible in forced colors; the print reset of `.ds-content` and `.ds-page` comes after
  their screen rules (a test checks every print rule).
- Docs: `img-src data:` in a strict CSP (the field glyphs are data URIs), and how an embedded widget scopes its
  theme when the host page uses Dashboard-Style too.
