# Tokens

All tokens are custom properties on `.ds-theme` (never `:root`), defined in `src/tokens.css`. Three layers:

| Layer | What | Who sets it |
|---|---|---|
| 1. Scales | motion, spacing, state layers, layers (z) | nobody: the same in every theme |
| 2. Roles | palette, type, radii, elevation, focus, links, layout | the default theme in `tokens.css`; a project theme overrides them |
| 3. Hooks | `--ds-btn-*`, `--ds-card-pad`, ... | read by one component with a fallback; set by a theme or on an element ([theming.md](theming.md#component-hooks)) |

Components read roles and hooks only, never a colour, radius, font, shadow, duration or curve literal (the tests
enforce it), so a theme reaches every value.

## 1. Scales

### Motion

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
| `--ds-ease-in-out` | `cubic-bezier(.2, 0, 0, 1)` | M3 standard: effects (opacity, colour), on-screen changes |
| `--ds-ease-out` | `cubic-bezier(.05, .7, .1, 1)` | M3 emphasized decelerate: the spring's fallback, sizes that push layout (never overshoot) |
| `--ds-ease-in` | `cubic-bezier(.3, 0, 1, 1)` | M3 standard accelerate: small exits, leaving fades |
| `--ds-ease-exit` | `cubic-bezier(.3, 0, .8, .15)` | M3 emphasized accelerate: large surfaces leaving (movement only) |
| `--ds-ease-emphasized` | `cubic-bezier(.2, 0, 0, 1)`; the exact M3 path as `linear()` where supported | movement that starts and ends on screen |
| `--ds-ease-spatial` | a spring (damping ratio 0.75, peak about 1.028, settles) as `linear()` where supported; `var(--ds-ease-out)` elsewhere | every spatial movement that floats: translate, scale, clip-path |
| `--ds-ease-value` | `var(--ds-ease-in-out)` | progress bars and `countUp()`, so figures and bars land together |
| `--ds-ease` | `var(--ds-ease-emphasized)` | **deprecated** (removed in 2.0): use `--ds-ease-emphasized` |
| `--ds-distance-sm`, `--ds-distance-md`, `--ds-distance-lg`, `--ds-distance-xl` | 4, 8, 12, 24px | travel of entering things (swap, default, sheet exit, sheet entry) |
| `--ds-distance-sheet` | 100% | a sheet that covers the screen (modal drawer) |
| `--ds-scale-enter` | .98 | start scale of content and dialogs |
| `--ds-scale-popup` | .95 | start scale of menus and the combobox list |
| `--ds-scale-tooltip` | .9 | start scale of tooltips |
| `--ds-scale-small` | .6 | start scale of small markers (badges, `ds-pop-in`) |
| `--ds-stagger` | 30ms | step between staggered items (at most six) |
| `--ds-delay-loader` | 200ms | loading indicators wait this long (`LOADER_DELAY_MS`) |
| `--ds-delay-boot` | 400ms | the app start screen waits this long |
| `--ds-hold-loader` | 450ms | a loader that showed stays at least this long (`LOADER_MIN_VISIBLE_MS`, `settleLoader()`) |
| `--ds-hold-success` | 600ms | how long a button shows its success face (`.ds-btn--done`, `DS.motion.busy()`) |
| `--ds-loop-spin`, `--ds-loop-spin-fast` | 1s, .8s | spinner / spinner in a status chip |
| `--ds-loop-indeterminate`, `--ds-loop-pulse` | 2s, 2s | indeterminate progress / skeleton pulse |
| `--ds-time-scale` | 1 (registered with `@property`, never declared) | slow motion: multiplies every duration, delay and loop above; set only by the styleguide and the tests, on the `.ds-theme` element or above |

Every duration, delay, loop and the stagger step is written as `calc(<value> * var(--ds-time-scale, 1))`, for example
`calc(250ms * var(--ds-time-scale, 1))`: read them through `DS.motion` (or let the engine resolve the `calc()`), not with `parseInt`. The spring of
`--ds-ease-spatial` is normalised to its settle time, so one curve serves every size: small controls, menus and popups
take `--ds-dur-medium`, dialogs, FLIP and the indicator `--ds-dur-slow`, sheets, the drawer and container transforms
`--ds-dur-long`. The overshoot (at most 5%) is the contract. `scripts/motion-curves.mjs` writes both `linear()` values
(`node scripts/motion-curves.mjs`; `--check` runs in `npm run check`). Themes never set motion tokens: motion is one
scheme for every product, and `DS.motion` reads the computed tokens.

Motion is the same on every device (no media-query switch), and loops always run at their token speed.
The per-element motion hooks (`--ds-motion-*`, `--ds-enter-*`, `--ds-leave-*`, `--ds-clip-from`, `--ds-draw-length`,
`--ds-i`) are registered with `inherits: false` and take these tokens only. Details: [motion.md](motion.md).

### State layers

| Token | Value | Use |
|---|---|---|
| `--ds-state-hover` | .08 | hover layer on controls |
| `--ds-state-hover-lg` | .06 | hover on large targets (rows, navigation items) |
| `--ds-state-focus` | .10 | keyboard focus: the layer under the ring, at once with it (a press stays on top) |
| `--ds-state-pressed` | .10 | pressed |
| `--ds-state-dragged` | .16 | dragged |
| `--ds-state-disabled` | .38 | disabled controls in a dimming theme (`--ds-disabled-opacity: var(--ds-state-disabled)`); the fallback of `--ds-disabled-opacity` |
| `--ds-state-stale` | .55 | `.ds-stale`: content about to be replaced |

### Spacing and layers

| Token | Value |
|---|---|
| `--ds-space-1`, `--ds-space-2`, `--ds-space-3`, `--ds-space-4`, `--ds-space-5`, `--ds-space-6`, `--ds-space-7`, `--ds-space-8`, `--ds-space-10`, `--ds-space-12` | 4, 8, 12, 16, 20, 24, 28, 32, 40, 48px (4px grid) |
| `--ds-z-raised` | 1 (sticky table parts, loading bar; the base of the items `DS.motion.flip()` raises while they glide) |
| `--ds-z-sticky` | 20 (top bar, scroll edge) |
| `--ds-z-popover` | 40 (menus, listboxes, a dialog contained in a panel) |
| `--ds-z-drawer` | 50 (side sheet, modal drawer) |
| `--ds-z-dialog` | drawer + 1 (dialogs, above an open sheet) |
| `--ds-z-toast` | 60 (snackbar, tooltip, skip link) |

## 2. Roles (the default theme)

### Colour

| Token | Default | Use |
|---|---|---|
| `--ds-backdrop` | `#f0f4f9` | page behind the panels, top bar, drawer |
| `--ds-surface` | `#ffffff` | panels, cards, dialogs, tables |
| `--ds-surface-low` | `#f8fafd` | tiles, filled cards, code, read-only fields, neutral alerts |
| `--ds-surface-high` | `#e9eef6` | filled fields (search, toolbar select), neutral chips |
| `--ds-surface-highest` | `#dde3ea` | tracks (switch), skeleton lines, hovered filled fields |
| `--ds-text` | `#1f1f1f` | text, values, titles |
| `--ds-text-2` | `#444746` | labels, leads, meta, inactive icons; on any surface |
| `--ds-text-3` | `#747775` | placeholders; **on white only** (4.5:1) |
| `--ds-line` | `#dde3ea` | passive hairlines: cards, dividers, rows |
| `--ds-line-2` | `#c4c7c5` | outlines of controls: outlined buttons, chips |
| `--ds-outline` | `#747775` | field borders, checkboxes, switch |
| `--ds-primary` / `--ds-on-primary` | `#0b57d0` / `#ffffff` | strongest action, focus, switch on, progress, links |
| `--ds-primary-hover` / `--ds-primary-pressed` | `#1f64d4` / `#094ab1` | reference values for controls that cannot lay a state layer |
| `--ds-accent` / `--ds-on-accent` | `#d3e3fd` / `#041e49` | the one tint: active navigation, selected chip, tonal button, tracks, selection |
| `--ds-on-accent-icon` | `= --ds-on-accent` | icons on the tint (empty-state disc) |
| `--ds-action-ink` | `= --ds-primary` | label of outlined and text buttons |
| `--ds-error`, `--ds-error-container`, `--ds-on-error-container` | `#b3261e`, `#f9dedc`, `#8c1d18` | errors: icon, container, text on it |
| `--ds-success`, `--ds-success-container`, `--ds-on-success-container` | `#146c2e`, `#c4eed0`, `#0f5223` | success |
| `--ds-warning`, `--ds-warning-container`, `--ds-on-warning-container` | `#8f4e06`, `#feefc3`, `#8f4e06` | warning chips |
| `--ds-warning-surface` | `#fdf6e7` | full-width warning banners (quieter than the chip) |
| `--ds-inverse`, `--ds-on-inverse`, `--ds-inverse-primary` | `#303030`, `#f2f2f2`, `#a8c7fa` | snackbar, tooltip |
| `--ds-scrim` | `rgba(0,0,0,.32)` | behind dialogs, sheets, the modal drawer; never blurred |
| `--ds-fill-round` | `rgba(31,31,31,.08)` | disc of `.ds-btn--disc` |
| `--ds-code-bg` | `= --ds-surface-low` | inline code (`.ds-base`) |
| `--ds-disabled-opacity` | 1 | opacity of every disabled control (buttons, chips, the switch, checkboxes and radios) |
| `--ds-disabled-fill` / `--ds-disabled-ink` | `rgba(31,31,31,.12)` / `.38` | container or outline, and ink (label, check, handle, box) of every disabled control: buttons, chips, the switch, checkboxes and radios |
| `--ds-spinner-sm-track` | `rgba(0,0,0,.18)` | **deprecated** (removed in 2.0): small spinner's ring where `color-mix()` is missing; every baseline browser has it |

All text roles pass WCAG AA (4.5:1) on the surfaces they are meant for; the tests check the pairs. The tint is too
light to carry a state alone: a selection always adds a check, a weight or an aria attribute.

### Links and focus

| Token | Default | Use |
|---|---|---|
| `--ds-link` | `= --ds-primary` | link colour; links are always underlined |
| `--ds-link-underline` / `--ds-link-underline-hover` | `rgba(11,87,208,.4)` / `= --ds-link` | underline at rest / on hover |
| `--ds-link-underline-thickness` / `--ds-link-underline-offset` | 1px / 3px | underline geometry, the same everywhere |
| `--ds-focus` | `= --ds-primary` | colour of every focus indicator |
| `--ds-focus-width` / `--ds-focus-offset` | 2px / 2px | |
| `--ds-focus-outline` | `2px solid var(--ds-focus)` | `outline` of controls: solid from the first frame; it rests (invisible) at offset + width and snaps to the offset over `--ds-dur-fast` (inset rings: from the edge inward) |
| `--ds-focus-ring` | `0 0 0 2px surface, 0 0 0 4px focus` | `box-shadow` form for media and floating buttons |

### Radii

| Token | Default | Use |
|---|---|---|
| `--ds-radius-xs`, `--ds-radius-sm`, `--ds-radius-md`, `--ds-radius-lg`, `--ds-radius-xl`, `--ds-radius-2xl` | 4, 8, 12, 16, 20, 28px | the scale: tooltip, code (xs); toast, skeleton heading (sm); status chip (md); tile (lg) |
| `--ds-radius-action` | 9999px | every action: buttons, navigation pills, search, switch |
| `--ds-radius-action-pressed` | 12px | an action while pressed (the press morph; it springs back on release); never rounder than the rest radius |
| `--ds-radius-panel` | `= xl` | the content panel |
| `--ds-radius-card` | `= md` | cards, alerts, radio cards |
| `--ds-radius-card-pressed` | `= sm` | radio cards while pressed (the press morph; never rounder than `--ds-radius-card`) |
| `--ds-radius-dialog` | `= lg` | dialogs, side sheet, modal drawer |
| `--ds-radius-chip` | `= sm` | filter chips |
| `--ds-radius-field` | `= sm` | fields |
| `--ds-radius-check` | 2px | the drawn box of a checkbox (radios are round) |

### Type

Roles are `font` shorthands (size, line height, weight, family in one declaration). The shorthand resets
`font-variant-numeric`, so figures set `tabular-nums` after it. Sizes in px, tracking 0, no uppercase eyebrows.

| Token | Default | Use |
|---|---|---|
| `--ds-font` | `'Google Sans', Roboto, 'Segoe UI', system-ui, sans-serif` | family |
| `--ds-font-mono` | `ui-monospace, SFMono-Regular, Menlo, Consolas, ...` | code |
| `--ds-weight-regular` / `--ds-weight-title` / `--ds-weight-label` | 400 / 400 / 500 | text / headings (never bold) / labels, buttons, emphasis |
| `--ds-size-display` | 36px | size of the display role, for components that cap it |
| `--ds-font-headline` | 400 24/32 | page title |
| `--ds-font-title` | 400 22/28 | dialog, sheet and section titles, product name |
| `--ds-font-subtitle` | 500 16/24 | card titles, empty-state title |
| `--ds-font-reading` | 400 16/24 | running text meant to be read |
| `--ds-font-input` | `= reading` | field text on phones (16px stops the iOS zoom) |
| `--ds-font-body` | 400 14/20 | default UI text, fields |
| `--ds-font-dense` | 400 14/20 | table cells |
| `--ds-font-label` | 500 14/20 | buttons, labels, navigation, column heads |
| `--ds-font-chip` | 500 14/20 | chips |
| `--ds-font-meta` | 400 12/16 | hints, timestamps, tooltips |
| `--ds-font-caption` | 500 12/16 | status chips, field labels, counters |
| `--ds-font-display` | 400 36/44 | key figures (tabular) |
| `--ds-font-code` | 400 13/20 mono | code blocks |

### Elevation

Only floating layers cast shadows; hierarchy comes from hairlines, tonal surfaces and space.

| Token | Default | Use |
|---|---|---|
| `--ds-elev-1`, `--ds-elev-2`, `--ds-elev-3` | Material levels 1-3 | the scale |
| `--ds-elev-hover` | `= --ds-elev-1` | hover of filled buttons |
| `--ds-elev-popover` | `= --ds-elev-2` | menus, listboxes, the skip link |
| `--ds-elev-overlay` | `= --ds-elev-3` | dialogs, side sheets, the modal drawer, snackbars |

### Layout

| Token | Default | Use |
|---|---|---|
| `--ds-topbar-height` | 64px | top app bar, modal drawer head |
| `--ds-drawer-width` | 256px | navigation drawer |
| `--ds-content-max` | 1280px | widest page content |
| `--ds-measure` | 76ch | reading measure of leads and notes |
| `--ds-toast-room` | 64px | room at a page's end for a two-line snackbar |

## 3. Hooks and runtime properties

Component hooks are listed in [theming.md](theming.md#component-hooks). Component-internal (set by the component, not a
hook): `--ds-btn-half`, half a button's height (`--ds-btn-height`, or `--ds-btn-icon-size` on `--icon`), the
largest radius a pill shows, so the press morph interpolates over its whole run instead of from 9999px. Properties set at runtime (by `js/` or by the
page) are listed with their component in [components.md](components.md) and [motion.md](motion.md): `--ds-i`,
`--ds-indicator-x`, `--ds-indicator-y`, `--ds-indicator-w`, `--ds-indicator-h`, `--ds-progress`, `--ds-toast-left`,
`--ds-toast-bottom`, `--ds-toast-shift`, `--ds-toast-shift-y`, `--ds-toast-reserve`, and the per-element motion settings `--ds-motion-distance`,
`--ds-motion-scale`, `--ds-draw-length`, `--ds-enter-*`, `--ds-leave-*`, `--ds-scan-*`, `--ds-ripple-*`.
