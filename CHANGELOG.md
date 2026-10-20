# Changelog

All notable changes. Versions follow [semver](https://semver.org): renaming or removing a token, class, hook or JS
export is a major change; adding one is a minor change.

## 1.3.0

Motion 2, the overlays: a new `DS.overlay` module opens and closes dialogs, side sheets, the modal drawer, menus and
the combobox list (native `<dialog>` with `showModal()` first, the div markup as fallback), shows snackbars and
tooltips. Every overlay is interruptible: its motion runs on transitions keyed on `data-state`, so a close taken back
continues from where it is. Side sheets slide their full width on the spring, popups and tooltips grow out of their
trigger, snackbars stack. New `.ds-menu` and `.ds-presence`. Additive: no class, token, hook or export was removed or
renamed, and no migration is required. Screenshots of the overlays change (see "Changed").

### Added

- `DS.overlay` (`js/overlay.js`, `window.DS.overlay`): `open(el, { opener })`, `close(el)`, `lockScroll()`,
  `unlockScroll()`, `toast(region, content, { kind, persistent, timeout, closeLabel })` and `tooltips(root)`, plus the
  fallback constants `TOAST_MS` (4000), `TOAST_MAX_MS` (10000), `TOAST_LIMIT` (3), `TOOLTIP_DELAY_MS` (500),
  `TOOLTIP_SKIP_MS` (300) and `TOOLTIP_HIDE_MS` (100). Focus moves in at once (`autofocus` first) and is back on the
  opener as soon as the close starts; the div markup makes the page inert, a native dialog uses `showModal()`; only the
  box or panel is inert during the exit, so the backdrop keeps catching clicks; Escape closes only the top layer (one
  document listener in the bubble phase, after the page's own handlers: a widget inside that calls `preventDefault()`
  keeps the overlay open; a native `cancel` plays the exit); closing a dialog, sheet or the drawer closes the menus
  and lists open inside it; overlays over each other compose (the div trap follows the stack, so a dialog from a div
  sheet or from the modal drawer takes input while the overlay under it stays inert, and a menu, dialog or sheet (div
  or native) opened over a native dialog or sheet moves inside it while it shows, so a native dialog leaving a native
  sheet stays above its panel and a click on its scrim never closes the sheet); `[data-close]` closes; a press on a
  leaving backdrop or the drawer's scrim keeps focus on the opener; the scroll lock
  is reference-counted and
  keeps the room of a scrollbar it removes (`scrollbar-gutter`, else `padding-right`); a modal drawer acts only at 900px
  and below and handles the breakpoint by itself; an overlay outside `.ds-theme` logs one warning. Docs: motion.md,
  "DS.overlay".
- Native markup for the dialog and the side sheet: `<dialog class="ds-dialog">` and `<dialog class="ds-sheet">` with the
  same inner tree as the div markup (UA box reset, transparent `::backdrop`, hidden while closed). Driven by hand
  (`showModal()`, `close()`), they play the same transitions where `@starting-style` and `allow-discrete` exist.
- `.ds-menu` (`menu.css`): `.ds-menu__item` (48px rows with icon, state layer, inset ring and ripple; a ripple host),
  `.ds-menu__label`, `.ds-menu__check` (the check of a `menuitemcheckbox`), `.ds-menu__divider`; `DS.overlay` places
  it, moves focus with the arrows, Home and End and closes on Escape, Tab, an item and a pointerdown outside.
- `.ds-presence` (`motion.css`, `ds.utilities`): a project element toggled with `hidden`, as a `[popover]` or as a
  `<dialog>` of its own fades in and grows on the spring, leaves faster, and a toggle mid-way continues from where it
  is (progressive; elsewhere an instant toggle).
- `.ds-dialog--nested` (set by `DS.overlay` for a dialog over another modal) with the role `--ds-scrim-nested`
  (`rgba(0, 0, 0, .16)`) and the hook `--ds-dialog-scrim` (default `--ds-scrim`).
- Tooltip delays (layer 1, time-scaled): `--ds-delay-tooltip` (500ms), `--ds-delay-tooltip-skip` (300ms, the warm-up
  along a toolbar) and `--ds-delay-tooltip-hide` (100ms, the grace that lets the pointer cross onto the tooltip).
- Runtime placement properties: `--ds-tooltip-x` / `--ds-tooltip-y` on `.ds-tooltip` and `--ds-menu-x` / `--ds-menu-y`
  on `.ds-menu`, written where CSS anchor positioning is missing. Where popover and anchor positioning exist, menus,
  the combobox list and the tooltip open as `popover="manual"` in the top layer (`data-anchored`), so a scrolling
  dialog or sheet never clips them.
- Snackbars: `kind: 'info'` (`.ds-toast--info`), a stack of at most three, two `.ds-sr` live regions that `toast()`
  adds (polite, assertive for errors), and the regions move into an open dialog or side sheet (in a sheet they glide
  with the panel's edge, `data-follow`), so a message shown meanwhile is above its scrim, announced and usable (also
  through the exit: they glide back inside the leaving overlay and return to the page once it ended); the div trap
  and the modal drawer never make the regions or their announcers inert.
- Tooltips (`tooltips(root)`): one tooltip per root, delay, warm-up, swap in place, hoverable and dismissable
  (WCAG 1.4.13), `aria-describedby` only when the tip adds to the trigger's name, re-placed on scroll and resize,
  `data-placement` on the side it really sits on (anchored: read again after a swap);
  like the snackbar regions, the div trap and the modal drawer never make it inert, so a trigger inside them shows
  a tooltip that is hoverable and heard.

### Changed

- **Side sheet** (D16): the panel is opaque throughout and slides its full width in from the edge on the spatial
  spring over `--ds-dur-long` while the scrim fades; it leaves back to the edge in `--ds-dur-base` on `--ds-ease-exit`
  without a fade (was a 24px slide with a fade over `--ds-dur-slow`). At 600px and below it rises from the bottom on
  `--ds-ease-out` (as tall as the screen, a spring would carry its head past the top edge) and falls back down. A
  48px strip of its background past the outer edge covers the spring's overshoot.
- **Dialog**: the box fades over `--ds-dur-fast` while it grows from `--ds-scale-enter` and rises `--ds-distance-sm`
  on the spring over `--ds-dur-slow`, from an origin towards its opener; the exit mirrors it in `--ds-dur-base`
  (opacity on `--ds-ease-in-out`, movement on `--ds-ease-exit`). The keyframe path (div markup by hand) leaves with
  `ds-fade-out` plus `ds-shrink-out`. At 600px and below the box decelerates instead of springing.
- **Tooltip**: fades in and grows from `--ds-scale-tooltip` at the side of its trigger (was around its centre; no
  rise), springing to full size over `--ds-dur-medium`, and leaves with a fade only in `--ds-dur-instant`; a
  `transform` placement still composes.
- **Popups**: the combobox list (and the new menu) fades in while its `clip-path` opens from the trigger's edge and it
  grows from `--ds-scale-popup` at the trigger, on the spring over `--ds-dur-medium`; the shadow is there from the
  first frame (the clip keeps `--ds-space-6` of room on the other edges; `originFrom()` writes `--ds-clip-from` with
  that room, and `ds-clip-in` / `ds-clip-out` open to `--ds-space-6` beyond the box). It leaves with a fade only in
  `--ds-dur-instant`. It opens below its trigger when it fits, else on the side with more room (`data-placement="top"`
  above), and never taller than the room on that side (it scrolls inside), so it never covers its trigger or the
  field being typed into.
- **Combobox chevron**: follows `aria-expanded` on the field and turns 180deg on the spring with the list.
- **Combobox active option**: its layer fades in over `--ds-dur-micro` and goes at once (no trail on a held arrow
  key, no separate hover layer).
- **Snackbars**: the rise runs on the spring; insertions and removals glide through `DS.motion.flip()`, so the other
  messages never jump; the timer grows with the text length and pauses on hover, focus and a hidden tab.
- **Forced colours**: the combobox list and the menu keep their edge (a transparent outline, no `CanvasText` outline
  of their own), and the chosen option shows `SelectedItem` / `SelectedItemText`.

### Fixed

- Focus is on the opener in the same task as Escape, Cancel or a backdrop click, and nothing behind an exiting
  overlay is clickable through it.
- Reopening a dialog or sheet mid-close continues from its current opacity and scale in every engine (no jump to
  full opacity, no restarted entrance).
- Tabbing between tooltip triggers keeps the tooltip and swaps it in place; moving onto the icon inside a trigger
  keeps it.
- Closing a focused snackbar never drops focus to `<body>`; five messages in a row never show more than three.
- The scroll lock no longer shifts a body-scrolling page sideways.
- A combobox at the bottom of a dialog is no longer clipped where popover and anchor positioning exist (elsewhere
  its list flips above). In a short window the list (and a menu) fits the room on its side instead of covering the
  field (or its trigger), and every option stays reachable.
- `DS.motion.flip()`: a removed item keeps its measured size while it fades out of flow (a `max-width: 100%` item of
  a shrink-wrapped container collapsed before).

### Deprecated (removed in 2.0)

- The snackbar region `<div class="ds-toasts" role="status" aria-live="polite">` with `role="alert"` on errors: use the
  region without role (`toast()` announces through its own live regions).
- The manual `--ds-toast-shift` / `--ds-toast-shift-y` recipe for moving snackbars into a side sheet (`toast()` follows
  the sheet by itself), and closing snackbars with `setTimeout(..., 4000)`.
- `data-open` on `.ds-combo`: `aria-expanded="true"` on the field turns the chevron.

## 1.2.0

Motion 2, the navigation: the sliding indicator stretches toward its target and lands on the spring, follows its
items by itself and survives `morphHtml`; the drawer comes back on the x axis, the modal drawer opens on the spring
and closes accelerating without a gap at the screen edge; labels change colour with the pill; the segmented switch
can keep its width; the top bar tints on scroll and the view keeps a stable scrollbar gutter. Additive: no class,
token, hook or export was removed or renamed. Screenshots of the frame change (see "Changed").

### Added

- `DS.indicator.createIndicator(track, { active, className, observe })`: the new `observe` option (default `true`)
  makes the pill follow `aria-current`, `aria-pressed`, `aria-selected` and `aria-checked` and added or removed
  items by itself; `update()` stays (needed only with `observe: false`). `DS.indicator.OVERSHOOT` (0.05) exports
  the overshoot share of a glide.
- `.ds-drawer--instant`: no slide and no scrim fade while the window crosses 900px (the page sets it for two frames
  on the `matchMedia` change; snippet in docs/components.md, App frame).
- `data-label` on `.ds-segmented__option` (its text again): the option keeps the width of its heavier current
  weight, so the switch never changes width. Such an option lays out its content in a column (for its text, or one
  wrapper); options without it are unchanged.
- Hooks: `--ds-topbar-scrolled-bg` (default `--ds-surface-high`), `--ds-view-scrollbar-gutter` (default `stable`),
  `--ds-indicator-radius` (the pill's corners) and `--ds-indicator-lag` (how long the trailing edge waits, default
  `--ds-dur-micro`; a motion hook, themes never set it).
- The top bar tints to a surface container colour while the view is scrolled (`data-scrolled`), with the panel's
  hairline, over `--ds-dur-fast`. Filled toolbar fields in it (`.ds-input--filled`, `.ds-search`) step up to
  `--ds-surface-highest` meanwhile, so they keep their container on the tint.

### Changed

- **The indicator** is drawn by `clip-path` on a box and moved by `translate` (never by animating `width`,
  `height` or `transform`): a glide stretches toward the target (the leading edge leads, the trailing edge follows
  `--ds-indicator-lag` later on `--ds-ease-in-out`, so the pill is never shorter than its item), lands on the
  spatial spring (the leading edge passes the target by at most 5 % of the travel) and
  takes `--ds-dur-medium` for a neighbour up to `--ds-dur-slow` for long jumps (`travelDuration()`, written as
  `--ds-indicator-dur` on the track). A new target mid-glide continues from where the pill is; the first placement
  and a resize jump. `--ds-indicator-x/-y/-w/-h` describe the box, which is the union of two items during a glide.
  An empty state contracts the pill to its centre and an item after it grows from there (an item that comes back
  while the pill still contracts turns it from where it is). Own indicator classes
  keep working: their `border-radius` is read at rest and copied into `--ds-indicator-radius`.
- `DS.motion.enter(drawer)` slides the drawer in from the left on the x axis (the same keyframes, duration and
  curves as `enter(drawer, 'slide')`); it rose from below before.
- **Modal drawer**: opens on the spring over `--ds-dur-long` (was `--ds-dur-slow` on the emphasized curve), the
  scrim fades in over `--ds-dur-medium`; closes over `--ds-dur-base` on `--ds-ease-exit` (was `--ds-ease-in`). A
  bleed of its own background on its left covers the spring's overshoot.
- Drawer and segmented labels change colour on the pill's timing (`--ds-indicator-dur`), so the new label turns
  `--ds-on-accent` while its pill arrives; their weight still switches at once. Without the indicator script, and
  in the modal drawer, tint and label change in one frame (the colour transition exists only under
  `.ds-has-indicator`).
- `.ds-btn[aria-pressed="true"]` inside `.ds-has-indicator` (a track of toggles with a sliding indicator) drops its
  own tint and border, so the pill alone paints the selection and no second highlight appears in place while it
  travels; the labels change colour on `--ds-indicator-dur`. Toggles outside a track are unchanged.
- `.ds-view` keeps a stable scrollbar gutter, so a classic scrollbar that appears never shifts the content; set
  `--ds-view-scrollbar-gutter: auto` for the old behaviour (overlay scrollbars and Safari before 18.2 are
  unaffected).

### Fixed

- The indicator follows item size and position changes (a badge or a wrap in an earlier item, a group expanding
  above, the active label growing) and fonts that load late; `destroy()` stops late callbacks and leaves no
  observer, listener or frame behind.
- No drawer slide when the window crosses 900px (with the documented snippet).
- The styleguide's nav no longer walks the pill through every section on a click (the scroll-spy pattern is in
  docs/components.md, App frame).

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
