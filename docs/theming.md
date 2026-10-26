# Theming

A theme is one stylesheet, loaded after `ds.css`, that overrides roles (layer 2) and, if needed, component hooks
(layer 3) on `.ds-theme`. It never restyles a component selector. Start from
[`themes/example.css`](../themes/example.css): it lists every role with example values.

```html
<link rel="stylesheet" href="vendor/dashboard-style/ds.css">
<link rel="stylesheet" href="css/theme.css">
```

## Rules

1. **Same element, same selector.** Write `.ds-theme { ... }` and load it after `ds.css`. Roles built from other
   tokens (every type role reads `--ds-font` and the weights; `--ds-link`, `--ds-focus` and `--ds-action-ink` read
   `--ds-primary`; `--ds-focus-ring` reads `--ds-surface`) are resolved on the element that declares them. Change
   the source token on that element and the derived roles follow; change it on a descendant and they silently keep
   the old value.
2. **Never set motion tokens** (`--ds-dur-*`, `--ds-ease-*`, `--ds-distance-*`, `--ds-scale-*`, `--ds-loop-*`,
   `--ds-delay-*`, `--ds-hold-*`, `--ds-stagger`, `--ds-time-scale`) **and the per-element motion hooks**
   (`--ds-motion-*`, `--ds-enter-*`, `--ds-leave-*`, `--ds-clip-from`, `--ds-draw-length`, `--ds-scan-*`,
   `--ds-indicator-lag`, `--ds-indicator-dur`). Motion is one fixed scheme for every product, and `DS.motion`
   reads the computed tokens, so a theme value would put CSS and script out of step.
3. **Keep contrast.** Text roles need 4.5:1 on the surfaces they sit on (`--ds-text-3` on white only), icons and
   outlines that carry meaning 3:1. The tint (`--ds-accent`) may be light; components never rely on it alone.
4. **px for sizes.** Type roles are `font` shorthands in px; keep `--ds-font-input` at 16px or more.
5. **One theme per page.** Put brand assets (logo, wordmark) and project components in your own files, reading the
   same tokens.

## Layers

`ds.css` puts every rule into `@layer ds.tokens, ds.base, ds.components, ds.motion, ds.utilities`. A theme is never
wrapped in `@layer`: an unlayered rule beats every `ds.*` layer, whatever its specificity. That is what makes a
theme on `.ds-theme` win, and also why a theme sets hooks rather than restyling component selectors: an unlayered
`.ds-btn { ... }` would override the component in every state at once.

The same goes for motion: an unlayered `transition` on `.ds-btn`, `.ds-chip__body` or `.ds-input` (or any other
component) replaces the component's whole list, and with it the focus snap (`outline-offset`), the spring back of
the press morph (`border-radius`) and the fade of a field's ring on blur. Leave component transitions alone; a
project component of your own lists its properties with the motion tokens.

## Recipes

**Brand palette.** Usually six roles are enough; `--ds-link`, `--ds-focus` and `--ds-action-ink` follow
`--ds-primary`, while `--ds-inverse-primary` (the snackbar icon on the dark inverse surface) is a light tint of the
brand colour that the theme sets itself (at least 3:1 against `--ds-inverse`).

```css
.ds-theme {
  --ds-primary: #1d4e89;
  --ds-accent: #d6e4f5;
  --ds-on-accent: #0b2440;
  --ds-inverse-primary: #a6c8ff;
  --ds-backdrop: #f2f4f7;
  --ds-link-underline: rgba(29, 78, 137, .4);
}
```

**Another typeface.** Set the family (and the label weight if the font has no 500); every role follows.

```css
.ds-theme {
  --ds-font: 'Inter', system-ui, sans-serif;
  --ds-weight-label: 600;
}
```

**Square containers, round actions.** Zero the radius scale; actions keep `--ds-radius-action`. The press shapes
follow on their own: a pressed shape is never rounder than its rest shape (`--ds-radius-action-pressed`, 12px, for
pills; `--ds-radius-card-pressed` for radio cards; checkboxes take `--ds-radius-check`).

```css
.ds-theme {
  --ds-radius-xs: 0; --ds-radius-sm: 0; --ds-radius-md: 0;
  --ds-radius-lg: 0; --ds-radius-xl: 0; --ds-radius-2xl: 0;
  --ds-radius-chip: 9999px;   /* chips become pills (default: --ds-radius-sm, zeroed above) */
}
```

**Flat: hairlines instead of shadows.** Dialogs then rely on the scrim, so give them a visible edge.

```css
.ds-theme {
  --ds-elev-hover: none;
  --ds-elev-overlay: none;
  --ds-dialog-border: 1px solid var(--ds-line);
}
```

**Dim disabled buttons as a whole** instead of the neutral grey container. `initial` unsets a role, so each button
keeps its own fill and ink:

```css
.ds-theme {
  --ds-disabled-opacity: var(--ds-state-disabled);
  --ds-disabled-fill: initial;
  --ds-disabled-ink: initial;
}
```

**Denser or larger type.** Redefine the roles you need; keep line heights on the 4px grid.

```css
.ds-theme {
  --ds-font-body: var(--ds-weight-regular) 15px/22px var(--ds-font);
  --ds-font-meta: var(--ds-weight-regular) 13px/18px var(--ds-font);
}
```

**Field text.** Fields use `--ds-font-body`, and `--ds-font-input` (16px) at 600px and below, where iOS Safari would
zoom into smaller text. `--ds-input-font` forces one role everywhere:

```css
.ds-theme { --ds-input-font: var(--ds-font-body); }
```

**Embedded in someone else's page.** Put `ds-theme` on your root element instead of `<html>`, and add `ds-base` to
that root as well (`<div class="ds-theme ds-base my-widget">`): its `html` and `body` rules match only those elements,
so on a `<div>` they never reach the host page, while links (`--ds-link` and the underline tokens), `strong` and `b`
(the label weight), inline code, `::selection`, the font of form controls and the focus ring on focusable elements
apply inside your widget. Without it, links in the documented markup (a `.ds-facts` value, a link in an alert or card
text) take the browser's default link colour, and `strong` its bold. Use `.ds-dialog--contained` for dialogs that
should cover only your panel (`DS.overlay` traps focus and input only inside its positioned container, leaves the host
page's scroll alone and closes it on Escape only when the key is pressed inside that container, so the host keeps
Escape for its own dialogs and search fields). Full-window modals (a dialog without `--contained`, side sheets, the
modal drawer) still count the lock and set `body.ds-no-scroll` on the host's `<body>`, but that class becomes
`overflow: hidden` only when `<html>` carries `.ds-base`. A `.ds-base` on your widget root does not reach the host's
`<body>`, so the host page keeps scrolling behind the scrim. A widget that wants the lock adds its own unlayered rule,
such as `body.ds-no-scroll { overflow: hidden; }`, where the host agrees.

On your root, `ds-base` does not set the page's ink and body type (those rules sit on `<body>`). Cards, dialogs,
side sheets and tables set the text colour on their surfaces, but loose text elsewhere in your widget, and the type
of loose text everywhere, inherits the host page's colour and font. Give your root both, unlayered and after `ds.css`:

```css
.ds-theme.my-widget {
  font: var(--ds-font-body);
  color: var(--ds-text);
}
```

Every token and rule is scoped to
`.ds-` classes, so a page without Dashboard-Style is not affected. Inside `.ds-theme` every element is
`box-sizing: border-box` (zero specificity, so your own sizing rules still win). Overlays (dialogs, side sheets,
snackbar regions, tooltips, menus) must sit inside the `.ds-theme` element too, not at the end of the host's
`<body>`: outside it they get neither the tokens nor the motion. `DS.overlay` warns once in the console when it opens
an overlay outside `.ds-theme` (and `tooltips()` when its root has none). With `ds-base` on your root, `[hidden]`
beats everything inside the widget, as on a full page (the `!important` rule of `base.css`). Without it, the
`hidden` attribute still hides ds components inside `.ds-theme` (a zero-specificity rule in `ds.utilities`, so
`DS.motion.leave(el, v, { then: 'hide' })` works on an alert or a button), and your widget's own unlayered
`display` rules beat it.

The other direction needs a guard of yours. `ds.css` sits in `@layer ds.*`, so the host page's unlayered CSS beats
your widget's components, whatever its specificity: element rules such as `button { ... }`, `h2 { ... }`,
`p { ... }` and `dialog { ... }` from a reboot, a normalize or the host's own styles can square your pills, change
fonts and title sizes, float a legend, mark a summary, pad a section card and frame a native
`<dialog class="ds-dialog">`. Hand those elements back to the ds layers with an unlayered rule, loaded after `ds.css`
and keyed to your root like the tokens. The list holds every element the documented component markup uses (`svg`
stays out: icons keep their own attributes):

```css
.ds-theme.my-widget :where(button, h1, h2, h3, h4, h5, h6, p, small, strong, code, ul, ol, li, dl, dt, dd, a, section, header, nav, main, fieldset, legend, details, summary, dialog, input, select, textarea, label, table, caption, th, td, hr, kbd, output) {
  all: revert-layer;
}
```

`all` leaves custom properties alone, so tokens and hooks keep working, and `revert-layer` is on the browser floor.
The guard weighs (0,2,0): your widget's own unlayered rules on those elements must weigh more (`.my-widget .x-row p`),
or narrow the guard to ds elements with `:where([class^="ds-"], [class*=" ds-"])`. Host rules that weigh more than
the guard (`#app p`, `.content .toolbar button`) or carry `!important` still win; a shadow root or an `<iframe>` is the
isolation that always holds.

In a shadow root, load `ds.css` inside it and keep the `.ds-theme` element (and every overlay) inside it too;
`DS.dom`, `DS.motion` and `DS.overlay` read the focus of the shadow tree, and `DS.overlay.tooltips(shadowRoot)` and
`DS.ripple.attach(shadowRoot)` take the shadow root itself. `@property` rules apply only in document-level
stylesheets, so also link `css/properties.css` in the host document: it only registers the `--ds-*` custom
properties and styles nothing. Without it the indicator, progress, spinner and skeleton step instead of gliding, and
the per-element motion hooks inherit into descendants. Fonts work the same way: Chromium and Firefox ignore
`@font-face` inside a shadow root, so link `fonts/fonts.css` in the host document as well (and put any `@font-face`
of your theme there). Otherwise those engines render the widget in the fallback font (Roboto, Segoe UI or the
system UI font) while the computed `font-family` still reads Google Sans. The trap of a div dialog, side sheet or
modal drawer in the shadow root crosses it through the host: the host page around the widget is inert while one is
open, as with `showModal()` (1.6.2; a `.ds-dialog--contained` stays within its container).

Stacking: prefer the native `<dialog>` markup for dialogs and side sheets in a widget. `showModal()` puts them in the
top layer, above everything the host page paints, and while one is open `DS.overlay` moves the snackbar regions into
it, so messages are in the top layer too. The div markup, `.ds-dialog--contained`, menus and tooltips placed by the
script and the `.ds-toasts` region stack in the host's stacking context at `--ds-z-popover` to `--ds-z-toast` (40 to
60): a fixed or sticky host layer with a higher `z-index` (a sticky header, a chat bubble) paints over them. The trap
of a div dialog or sheet makes such a layer inert, so it takes no clicks, but it can still hide a title or a close
button. Where that matters, give your widget root (or ask the host to give its layer) a `z-index` that keeps the
widget above, or use the native markup.

A host ancestor with `transform`, `filter`, `perspective`, `will-change: transform` or `contain: layout` / `paint`
(an animated card, an off-canvas panel) becomes the box that `position: fixed` layers fill. Inside it, full-window
div dialogs and side sheets, their scrims, the modal drawer and the `.ds-toasts` region cover or pin to that box,
not the window. Use the native `<dialog>` markup there (the top layer ignores the ancestor), or a host that does not
transform your widget's ancestors. Menus and tooltips are placed right either way: anchored in the top layer, or by
the script, which writes their coordinates in that box's terms (1.6.1).

The host page may use Dashboard-Style itself (`<html class="ds-theme">`), possibly another version or theme. Then
both copies share their selectors, and `tokens.css` on bare `.ds-theme` would reset the host's theme to your
values. Scope what you inject to your root: rewrite `.ds-theme` to `.ds-theme.my-widget` in every stylesheet you
ship, `tokens.css` and your theme included (a build step can do it), and key any reset of your own the same way
(`.ds-theme.my-widget :where(button) { ... }`). The component rules themselves stay shared; load the same version
as the host where you can. A dialog or side sheet of the host leaves your widget's `.ds-toasts` region in your
widget (it moves only the regions of its own theme; 1.6.2), and yours leaves the host's alone.

Overlays of the two copies (1.6.1 and later on both sides) share what the page has only once: Escape closes the
topmost layer whichever copy opened it, the scroll lock holds until the last modal of either copy closes, anchor
names and tooltip ids never repeat, and a trigger inside both copies' tooltip roots is served once (by the
innermost root). A copy before 1.6.1 keeps its own count of these: there, avoid overlays of both copies open at
once.

## Touch screens

A touch screen or a kiosk needs bigger targets. `.ds-touch` on `.ds-theme` (or on any container) sets every target
hook to `--ds-touch-target` (48px): `--ds-btn-height`, `--ds-btn-sm-height`, `--ds-btn-icon-size`,
`--ds-btn-sm-icon-size`, `--ds-input-height`, `--ds-check-height`, `--ds-check-target`, `--ds-switch-height`,
`--ds-switch-halo`, `--ds-chip-height`, `--ds-combo-option-height`, `--ds-menu-item-height`,
`--ds-drawer-item-height`, `--ds-toast-close-size`, `--ds-tabs-height` and `--ds-disclosure-height`; fields take the
input role (`--ds-input-font: var(--ds-font-input)`, 16px, so iOS does not zoom), and `.ds-hover-actions` always
show. It is never automatic: a laptop with a touch screen keeps the dense layout unless the page opts in, for example
when any pointer is coarse:

```js
const coarse = matchMedia('(any-pointer: coarse)');
const touch = () => document.documentElement.classList.toggle('ds-touch', coarse.matches);
touch();
coarse.addEventListener('change', touch);
```

A theme value on the same element wins over `.ds-touch` (themes are unlayered): set `--ds-touch-target` to change
the size, not each hook.

## Component hooks

Hooks are read by one component with a fallback. Set them on `.ds-theme` to change every instance, or on an element
(or a modifier class of your own) to change one. Where a variant sets a hook on the element itself, only an element
rule changes it: `--ds-btn-padding-start` (set before a leading icon) and `--ds-btn-quiet-color` (set by
`.ds-topbar__menu`).

| Hook | Default | Component |
|---|---|---|
| `--ds-btn-height` | 36px (`--sm`: `--ds-btn-sm-height`) | button |
| `--ds-btn-padding-x` | `--ds-space-4` (`--text`, `--sm`: `--ds-space-3`) | button |
| `--ds-btn-padding-start` | `= padding-x`; `--ds-space-3` before a leading icon | button |
| `--ds-btn-radius` | `--ds-radius-action` | button |
| `--ds-btn-radius-pressed` | `--ds-radius-action-pressed` | button while pressed (never rounder than `--ds-btn-radius`) |
| `--ds-btn-font` | `--ds-font-label` | button |
| `--ds-btn-bg`, `--ds-btn-color`, `--ds-btn-border` | per variant | button fill, label, border colour |
| `--ds-btn-state` | `currentColor` | colour of the hover/press layer |
| `--ds-btn-state-opacity`, `--ds-btn-state-focus-opacity`, `--ds-btn-state-pressed-opacity` | `--ds-state-hover`, `--ds-state-focus`, `--ds-state-pressed` (`--disc`: 1) | layer strength on hover, keyboard focus, press |
| `--ds-btn-hover-color`, `--ds-btn-hover-border` | the resting values | hover label and border |
| `--ds-btn-hover-shadow` | none (`--primary`: `--ds-elev-hover`) | hover elevation |
| `--ds-btn-hover-decoration` | none | e.g. `underline` for text buttons |
| `--ds-btn-icon-size` | 40px | `--icon` buttons |
| `--ds-btn-sm-height` | 32px | `.ds-btn--sm` (it sets `--ds-btn-height` from it) |
| `--ds-btn-sm-icon-size` | 32px | `.ds-btn--sm.ds-btn--icon` (it sets `--ds-btn-icon-size` from it) |
| `--ds-btn-quiet-color` | `--ds-text-2` | `--quiet` label |
| `--ds-btn-disabled-bg`, `--ds-btn-disabled-border` | from `--ds-disabled-fill` | disabled container |
| `--ds-input-font` | body; input role at 600px and below | fields |
| `--ds-check-size` | 18px | the drawn checkbox and radio (`.ds-check`, `.ds-checkbox`, `.ds-radio-input`, radio cards, table checkboxes) |
| `--ds-check-target` | 40px | their halo (hover, press, focus) across |
| `--ds-input-height` | 40px | the minimum height of fields (`.ds-input`, the search pill), input groups and a growing textarea; the combobox toggle is that size and the field keeps room for it |
| `--ds-check-height` | 40px | a `.ds-check` row (one line of its label; a longer label wraps and the box stays beside its first line) |
| `--ds-input-bg`, `--ds-input-border`, `--ds-input-radius` | `--ds-surface`, `--ds-outline`, `--ds-radius-field` | the outlined field and the input group at rest (fill, 1px border colour, corners; the filled field's top corners) |
| `--ds-input-focus-color` | `--ds-primary` | the field's ring, the label tint while it has the focus, the filled field's bottom line, the input group and composer rings |
| `--ds-input-grow-max` | 50vh | the tallest a `.ds-input--grow` textarea grows before it scrolls |
| `--ds-field-error-color`, `--ds-field-success-color` | `--ds-on-error-container`, `--ds-text-2` | the text of an error and a success hint (their icons stay `--ds-error`, `--ds-success`) |
| `--ds-field-changed-color` | `--ds-primary` | the dot after the label of a `.ds-field--changed` (keep 3:1 on the surface) |
| `--ds-form-rows-control-max` | 480px | the widest control in `.ds-form--rows` |
| `--ds-check-list-max-height` | 264px | `.ds-check-list` scrolls on its own beyond it (`none`: every row shows) |
| `--ds-composer-radius` | `--ds-radius-2xl` | the shell of `.ds-composer` |
| `--ds-composer-max-height` | 220px | the tallest the composer's textarea grows before it scrolls |
| `--ds-slider-halo` | 40px | the halo around the slider handle (hover, press, focus), and the slider's height |
| `--ds-chip-height` | 32px | filter chip |
| `--ds-chip-check-size` | 18px | the check of a selected chip (and the room it opens) |
| `--ds-chip-disabled-border`, `--ds-chip-disabled-bg` | `--ds-disabled-fill` | disabled chip outline, and the container of a disabled selected chip (label and check take `--ds-disabled-ink`) |
| `--ds-chip-input-bg`, `--ds-chip-input-color`, `--ds-chip-input-border` | `--ds-accent`, `--ds-on-accent`, `--ds-accent` | an input chip (`.ds-chip--input`): fill, ink, edge |
| `--ds-chip-max-width` | 240px | the widest body of an action or input chip; its label ends in an ellipsis |
| `--ds-switch-halo` | 40px | the halo around the switch handle |
| `--ds-switch-height` | 40px | the smallest height of a switch row |
| `--ds-switch-list-row-height` | 56px | the smallest row of a `.ds-switch-list` |
| `--ds-switch-disabled-track`, `--ds-switch-disabled-handle` | `--ds-disabled-fill`, `--ds-disabled-ink` | disabled switch track (and border) and off handle |
| `--ds-drawer-item-height` | 48px | drawer item (its rest radius is half of it, so the press morph runs its whole way) |
| `--ds-topbar-scrolled-bg` | `--ds-surface-high` | top bar while the view is scrolled (`data-scrolled`); `transparent` keeps a flat bar |
| `--ds-view-scrollbar-gutter` | `stable` | the view's scrollbar gutter: `stable both-edges` (symmetric) or `auto` (no reserved room) |
| `--ds-card-padding` | `--ds-space-6` | card padding |
| `--ds-card-padding-sm` | `--ds-space-4` | card padding at 600px and below |
| `--ds-card-padding-filled` | `--ds-space-5` | `.ds-card--filled` padding |
| `--ds-card-title-line` | 24px | line height of `.ds-card__title`; a button or switch in the header row overhangs it (set it with a type role that changes the subtitle line) |
| `--ds-card-hover-shadow` | none | `.ds-card--interactive` on hover (a theme may set `var(--ds-elev-hover)`); never a lift |
| `--ds-tile-radius` | `--ds-radius-lg` | key-figure tile |
| `--ds-tile-radius-pressed` | `--ds-radius-md` | a clickable tile while pressed (never rounder than `--ds-tile-radius`) |
| `--ds-tile-min-width` | 176px | the narrowest tile of a `.ds-tiles` row (fewer per row below it) |
| `--ds-tiles-columns` | 4 | the most tiles per row (`.ds-tiles--3`: three) |
| `--ds-tile-selected-bg` | `--ds-accent` | a selected tile (`aria-pressed`, `aria-checked`, `aria-selected`) |
| `--ds-card-selected-bg` | `--ds-accent` | a selected interactive card |
| `--ds-selected-ring` | `--ds-primary` | the inset ring of a selected tile or card |
| `--ds-card-shadow` | `--ds-elev-1` | `.ds-card--elevated` |
| `--ds-table-row-hover` | `currentColor` at `--ds-state-hover-lg` (`color-mix()`) | the row hover layer on the cells; a fixed colour where `color-mix(currentColor)` misbehaves |
| `--ds-table-row-selected` | `--ds-accent` | a selected table row (`.ds-table__row--selected`, a checked checkbox in a cell) |
| `--ds-ripple-color` | `currentColor` | the pointer ripple of every action ([ripple](components.md#ripple)) |
| `--ds-pressable-radius` | `--ds-radius-sm` | `.ds-pressable`, the press model on a project element |
| `--ds-pressable-layer` | `currentColor` | the colour of the state layer of `.ds-pressable` |
| `--ds-kbd-border`, `--ds-kbd-bg` | `--ds-line-2`, `--ds-surface` | `.ds-kbd`: the box of a key |
| `--ds-status-radius` | `--ds-radius-md` | status chip |
| `--ds-alert-bg`, `--ds-alert-color` | `--ds-surface-low`, `--ds-text` | the neutral alert (kinds set them from their own hooks) |
| `--ds-alert-icon` | `--ds-primary` | the neutral alert's icon and edge colour |
| `--ds-alert-edge` | 0 | the width of an alert's leading edge (`4px`: an edge in the icon colour) |
| `--ds-alert-success-bg`, `--ds-alert-success-color`, `--ds-alert-success-icon` | `--ds-success-container`, `--ds-on-success-container`, `--ds-success` | `.ds-alert--success` |
| `--ds-alert-warning-bg`, `--ds-alert-warning-color`, `--ds-alert-warning-icon` | `--ds-warning-surface`, `--ds-text`, `--ds-warning` | `.ds-alert--warning` |
| `--ds-alert-error-bg`, `--ds-alert-error-color`, `--ds-alert-error-icon` | `--ds-error-container`, `--ds-on-error-container`, `--ds-error` | `.ds-alert--error` (its buttons take `--ds-alert-error-color`) |
| `--ds-alert-text-basis` | 256px | the narrowest text of an alert with `.ds-alert__actions` before the actions wrap |
| `--ds-tag-bg`, `--ds-tag-color` | `--ds-accent`, `--ds-on-accent` (`--neutral`: `--ds-surface-high`, `--ds-text`) | a tag (`.ds-tag`) |
| `--ds-tag-height` | 24px | a tag's height (its radius is half of it) |
| `--ds-badge-size` | 20px | a count badge (`.ds-badge`): height and smallest width |
| `--ds-badge-radius` | `--ds-radius-action` (never above half the size) | a count badge's corners |
| `--ds-badge-bg`, `--ds-badge-color` | `--ds-accent`, `--ds-on-accent` (tones: their container pair; on a tinted host `--ds-primary`, `--ds-on-primary`) | a count badge's fill and figure |
| `--ds-spinner-track`, `--ds-spinner-color` | none (`--sm`: a faint ring of the text colour; `--determinate`: `--ds-accent`), `--ds-primary` (`--sm`: `currentColor`) | spinner: the track behind the arc, the arc |
| `--ds-spinner-width` | 2px (`--determinate`: `--ds-spinner-determinate-width`) | the spinner's ring width (instead of `border-width`) |
| `--ds-spinner-determinate-width` | 4px | the ring width of `.ds-spinner--determinate` |
| `--ds-status-spinner-width` | 2px | the ring width of the spinner in a running status chip |
| `--ds-loader-size`, `--ds-loader-color` | 48px (`--sm`: `--ds-loader-sm-size`), `--ds-primary` | the shape loader's container and its shape ([loading](components.md#loading)) |
| `--ds-loader-sm-size` | 24px | `.ds-loader--sm` |
| `--ds-progress-gap` | 4px | linear progress: the gap between the bar and the remaining track |
| `--ds-progress-track`, `--ds-progress-stop` | `--ds-accent`, `--ds-primary` | linear progress: the remaining track, the stop dot at its end |
| `--ds-skeleton-radius` | `--ds-radius-action` (the heading line: `--ds-radius-sm`) | skeleton lines ([loading](components.md#loading)) |
| `--ds-swap-fade` | `--ds-space-2` | the soft edge of a `.ds-swap--fade` slot ([motion](motion.md#utilities-css)) |
| `--ds-dropzone-border` | `1px dashed var(--ds-outline)` | the border of a `.ds-dropzone` ([file upload](components.md#file-upload)) |
| `--ds-dialog-width` | 400px | dialog |
| `--ds-dialog-border` | `1px solid transparent` (visible in forced colors) | dialog edge |
| `--ds-dialog-shadow` | `--ds-elev-overlay` | dialog |
| `--ds-dialog-scrim` | `--ds-scrim` | the dialog's backdrop; `.ds-dialog--nested` sets it to `--ds-scrim-nested` |
| `--ds-sheet-width`, `--ds-sheet-width-wide` | 560px, 720px | side sheet |
| `--ds-dialog-width-wide` | 560px | `.ds-dialog--wide` |
| `--ds-dialog-height` | auto (capped by the window) | the dialog box; a fixed height keeps a box with a filtered list from jumping |
| `--ds-dialog-full-radius` | 0 | the box of a full-screen dialog (`.ds-dialog--full`, `--full-narrow`) |
| `--ds-sheet-foot-border` | `1px solid var(--ds-line)` | the hairline above `.ds-sheet__foot` |
| `--ds-menu-item-height` | 48px | menu item (and action sheet row) |
| `--ds-combo-option-height` | 48px | the least height of a combobox option |

`--ds-card-pad` is the resulting padding of each card (tables read it to bleed to the card edges); read it, do not
set it. Runtime properties (set by scripts, not themes) are documented with their components: `--ds-progress`
([progress](components.md#progress)), `--ds-toast-left`, `--ds-toast-bottom`, `--ds-toast-shift`,
`--ds-toast-shift-y`, `--ds-toast-reserve` ([snackbar](components.md#snackbar)), `--ds-tooltip-x`, `--ds-tooltip-y`
([tooltip](components.md#tooltip)), `--ds-menu-x`, `--ds-menu-y` ([menu](components.md#menu)), `--ds-i`, the indicator's box
(`--ds-indicator-x`, `--ds-indicator-y`, `--ds-indicator-w`, `--ds-indicator-h`), its clip edges (`--ds-indicator-t`,
`--ds-indicator-r`, `--ds-indicator-b`, `--ds-indicator-l`) and its travel time on the track (`--ds-indicator-dur`)
([motion](motion.md#dsindicator-jsindicatorjs)), and `--ds-drawer-icon-axis` (set by `.ds-app--drawer`, aligns the
brand with the drawer icons). The pill's corners, `--ds-indicator-radius`, belong to the indicator's class (the
drawer's sets half the item height); the property does not inherit, so set it on that class, never on `.ds-theme`.
`--ds-indicator-lag` is a motion hook: themes never set it.

## Checking a theme

Open `styleguide/index.html`, choose "Load theme file ..." and pick your CSS: every component re-renders with it.
Check text contrast with your browser's accessibility tools and look at the page with forced colors emulated
(DevTools, Rendering panel).
