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

The motion scales (the duration ladder `--ds-dur-micro` to `--ds-dur-glide`, the curves `--ds-ease-*` with the
spring `--ds-ease-spatial`, distances, scales, the stagger step, the delays and holds of loaders, success faces,
status lines (`--ds-hold-status`) and tooltips, the loops `--ds-loop-*` and `--ds-time-scale`) are documented with the rules that use them, in
[motion.md](motion.md#tokens): the ladder with each step's use, the curve table, the spring's contract and
`travelDuration()`. They are layer 1 like every scale here: the same in every theme, and themes never set them.

Every duration, delay, loop and the stagger step is written as `calc(<value> * var(--ds-time-scale, 1))`: read them
through `DS.motion` (or let the engine resolve the `calc()`), not with `parseInt`.

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

### Progress waves

Written by `scripts/motion-curves.mjs` (between the `generated: progress-masks` markers of `tokens.css`; never by hand).

| Token | Value | Use |
|---|---|---|
| `--ds-progress-wave-length` | 40px | the wavelength of wavy progress: the width of one mask tile, and how far `ds-progress-wave` moves it per loop |
| `--ds-progress-wave` | an SVG mask | one wavelength of a 4px sine stroke, ±3px, in a 40 x 10px tile (repeated along the bar) |
| `--ds-progress-ring-wave` | an SVG mask | a closed wavy ring (7 waves of ±1.6px, 4px stroke) for the 40px determinate spinner |

Short bars and arcs are flat, as in M3 Expressive (a piece shorter than a wavelength would be a loose hook of the
sine): the wave and the flat fill cross-fade on the gliding share. Not generated, and the same in every theme.

| Token | Value | Use |
|---|---|---|
| `--ds-progress-wave-start` | .06 | the share up to which linear and circular progress are flat |
| `--ds-progress-wave-ramp` | .05 | the share over which the wave then fades in (fully wavy from 11%) |

### Spacing and layers

| Token | Value |
|---|---|
| `--ds-space-1`, `--ds-space-2`, `--ds-space-3`, `--ds-space-4`, `--ds-space-5`, `--ds-space-6`, `--ds-space-7`, `--ds-space-8`, `--ds-space-10`, `--ds-space-12` | 4, 8, 12, 16, 20, 24, 28, 32, 40, 48px (4px grid) |
| `--ds-z-raised` | 1 (sticky table parts, loading bar; the base of the items `DS.motion.flip()` raises while they glide) |
| `--ds-z-sticky` | 20 (top bar, scroll edge) |
| `--ds-z-popover` | 40 (menus (`.ds-menu`), the combobox list and other listboxes, a dialog contained in a panel) |
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
| `--ds-skeleton-highlight` | `var(--ds-surface-high)` | the band of the skeleton wave that passes over the bones |
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
| `--ds-scrim-nested` | `rgba(0,0,0,.16)` | behind a dialog over another open modal (`.ds-dialog--nested`): about 43% together instead of 54% |
| `--ds-fill-round` | `rgba(31,31,31,.08)` | disc of `.ds-btn--disc` |
| `--ds-code-bg` | `= --ds-surface-low` | inline code (`.ds-base`) |
| `--ds-chart-1`, `--ds-chart-2`, `--ds-chart-3`, `--ds-chart-4` | `= --ds-primary`, `#c76a00`, `#00897b`, `#9334e6` | the four chart series, in this order ([Chart colours](#chart-colours)) |
| `--ds-chart-track` | `= --ds-surface-high` | the track of a meter |
| `--ds-chart-neutral` | `= --ds-outline` | the rest of a highlighted series (`.ds-columns--mini`), a neutral meter or key |
| `--ds-chart-warning`, `--ds-chart-error` | `= --ds-warning`, `= --ds-error` | the tones of single-series marks |
| `--ds-disabled-opacity` | 1 | opacity of every disabled control (buttons, chips, the switch, checkboxes and radios) |
| `--ds-disabled-fill` / `--ds-disabled-ink` | `rgba(31,31,31,.12)` / `.38` | container or outline, and ink (label, check, handle, box) of every disabled control: buttons, chips, the switch, checkboxes and radios |

All text roles pass WCAG AA (4.5:1) on the surfaces they are meant for; the tests check the pairs. The tint is too
light to carry a state alone: a selection always adds a check, a weight or an aria attribute.

### Chart colours

The roles of [Charts](components.md#charts): four series in a fixed order (`--ds-chart-1` first), never cycled; at
most four in one chart, more fold into "Other". `--ds-chart-neutral` draws what is not highlighted, the tones
(`--ds-chart-warning`, `--ds-chart-error`) only single-series marks, always with words. Text never takes a series
colour. Every series, the neutral and the tones reach 3:1 on `--ds-surface`, `--ds-surface-low` and
`--ds-chart-track` (WCAG 1.4.11; the tests check it), and the four series are distinct. A theme that changes them
checks the same and keeps adjacent series apart for colour-blind readers (lightness as well as hue).

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
| `--ds-elev-hover` | `= --ds-elev-1` | hover of filled buttons; clickable cards when a theme sets `--ds-card-hover-shadow` to it |
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
| `--ds-touch-target` | 48px | the smallest target under `.ds-touch` (every target hook, [theming.md](theming.md#touch-screens)) |

## 3. Hooks and runtime properties

Component hooks are listed in [theming.md](theming.md#component-hooks). Component-internal (set by the component, not a
hook): `--ds-btn-half`, half a button's height (`--ds-btn-height`, or `--ds-btn-icon-size` on `--icon`), the
largest radius a pill shows, so the press morph interpolates over its whole run instead of from 9999px;
`--ds-indicator-ease-t`, `--ds-indicator-ease-r`, `--ds-indicator-ease-b`, `--ds-indicator-ease-l`, the curve of each
clip edge of the sliding indicator (its `data-dir` rules put the trailing edge on `--ds-ease-in-out`). Resulting
properties (read them, never set them; set the spacing tokens instead): `--ds-content-pad-top` and
`--ds-content-pad-x`, the top and side padding of `.ds-content` at the current width (`--ds-space-6` and
`--ds-space-8`, at 720px and below `--ds-space-5` and `--ds-space-4`), which the loading bar reads to reach the panel
edges. Properties set at runtime (by `js/` or by the
page) are listed with their component in [components.md](components.md) and [motion.md](motion.md): `--ds-i`,
`--ds-indicator-x`, `--ds-indicator-y`, `--ds-indicator-w`, `--ds-indicator-h` (the indicator's box), `--ds-indicator-t`,
`--ds-indicator-r`, `--ds-indicator-b`, `--ds-indicator-l` (its clip edges), `--ds-indicator-radius` (its corners, copied
from a project class's `border-radius` when no class sets it), `--ds-indicator-dur` (the travel time, on the track),
`--ds-progress`, `--ds-toast-left`, `--ds-toast-bottom`, `--ds-toast-shift`, `--ds-toast-shift-y`, `--ds-toast-reserve`,
`--ds-toast-lift` (a snackbar region's rise above a sheet's foot, the drawer's foot or a save bar, written by `DS.overlay` only;
`--ds-toast-shift` and `--ds-toast-shift-y` too; `--ds-toast-reserve` is set by `toast()`, or by the page with `reserve: false`),
`--ds-keyboard-inset` (the on-screen keyboard's height, written on `<html>` by `DS.dom.followViewport()`; the snackbars rise by it),
`--ds-savebar-height` (the save bar's height on its `.ds-view`, written by `DS.overlay.savebar()`),
`--ds-tooltip-x`, `--ds-tooltip-y` (the tooltip's place, written by `DS.overlay.tooltips()` where anchor positioning is missing),
`--ds-menu-x`, `--ds-menu-y` (a menu's place, written by `DS.overlay.open()` where anchor positioning is missing),
`--ds-chips-backdrop`, `--ds-flip-backdrop` (the colour behind a chip row or a `DS.motion.flip()` container while its items
glide: their opaque backing),
and the per-element motion settings `--ds-motion-distance`, `--ds-motion-scale`, `--ds-motion-origin`, `--ds-clip-from`,
`--ds-draw-length`, `--ds-enter-*`, `--ds-leave-*`, `--ds-scan-*`, `--ds-indicator-lag`, and the ripple's place and size
`--ds-ripple-x`, `--ds-ripple-y`, `--ds-ripple-r` (themes never set these; `--ds-ripple-color` is a theme hook,
[theming.md](theming.md)).

Registered runtime properties of the loading indicators (top-level `@property` rules in `tokens.css`, so they
interpolate). The page sets `--ds-progress` (`<number>`, the share 0 to 1; it inherits, so every part of a progress
indicator reads the same value as it glides). The loop keyframes animate the others: `--ds-progress-head-1`,
`--ds-progress-head-2`, `--ds-progress-tail-1`, `--ds-progress-tail-2` (`<percentage>`, inheriting: the edges of the two
indeterminate segments, animated on the track and read by its pseudo-elements), `--ds-spinner-arc` and
`--ds-spinner-start` (`<angle>`, not inheriting: the sweep and the start of the spinner's arc, 10deg and 0deg at rest)
and `--ds-skeleton-x` (`<length>`, inheriting: the position of the skeleton wave, animated on the surface and read by
every bone; a surface rests at -150vw, off screen, so an exit or entrance that replaces the wave shows no band).
Themes never set them.

The share of a chart mark, `--ds-share` (`<number>`, 0 to 1, inheriting, top-level `@property` in `tokens.css`), is set
by the page on a `.ds-meter` or a `.ds-columns__col`; its fill is clipped at it, and it glides on `--ds-ease-value`
over `--ds-dur-glide` (`ds-fill-share` runs it from 0 on the first render). Themes never set it.
