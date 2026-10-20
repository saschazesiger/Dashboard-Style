# Changelog

All notable changes. Versions follow [semver](https://semver.org): renaming or removing a token, class, hook or JS
export is a major change; adding one is a minor change.

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
