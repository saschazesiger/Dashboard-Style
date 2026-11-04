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
   `--ds-primary`; `--ds-focus-ring` reads `--ds-surface`; the derived mixes `--ds-primary-hover`,
   `--ds-primary-pressed`, `--ds-link-underline`, `--ds-fill-round`, `--ds-disabled-fill` and `--ds-disabled-ink`
   read `--ds-primary`, `--ds-link` and `--ds-text`; `--ds-surface-overlay` and `--ds-surface-popover` read
   `--ds-surface`) are resolved on the element that declares them. Change
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

**Brand palette.** Usually four roles are enough; `--ds-link`, `--ds-focus`, `--ds-action-ink`,
`--ds-primary-hover`, `--ds-primary-pressed` and `--ds-link-underline` follow `--ds-primary`, while
`--ds-inverse-primary` (the snackbar icon on the dark inverse surface) is a light tint of the brand colour that the
theme sets itself (at least 3:1 against `--ds-inverse`). Add `--ds-backdrop` for a tinted page.

```css
.ds-theme {
  --ds-primary: #1d4e89;
  --ds-accent: #d6e4f5;
  --ds-on-accent: #0b2440;
  --ds-inverse-primary: #a6c8ff;
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
.ds-theme.my-widget :where(button, h1, h2, h3, h4, h5, h6, p, small, strong, code, pre, blockquote, hr, mark, img, ul, ol, li, dl, dt, dd, a, section, header, nav, main, fieldset, legend, details, summary, dialog, input, select, textarea, label, table, caption, th, td, kbd, output, figure, figcaption, time) {
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

A touch screen or a kiosk needs bigger targets. `.ds-touch` on `.ds-theme` (or on any container) sets
`--ds-target-min` to `--ds-touch-target` (48px), the smallest block size of every control on the options model
(buttons, an icon button as wide; fields, input groups, `.ds-check` rows, halos, cards, switches, sliders and chips;
tabs, drawer rows and the segmented switch; combobox options, menu rows, the close button of a snackbar, a disclosure's
summary, an interactive card, `.ds-pressable`; [options.md](options.md#touch)), whatever its size and density, as a
minimum over the height it computes, so a size step above the target stays and a theme's own height keeps its meaning.
Fields take the
input role (`--ds-input-font: var(--ds-font-input)`, 16px, so iOS does not zoom), the top bar's `.ds-brand` link is at
least `--ds-touch-target` wide and tall, and `.ds-hover-actions` always show. It is never automatic: a laptop with a touch screen keeps the dense layout unless the page opts in, for example
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

<!-- generated: hooks (scripts/build.mjs; do not edit) -->
| Hook | Default | Component |
|---|---|---|
| `--ds-swap-fade` | `--ds-space-2` | the soft edge of a `.ds-swap--fade` slot ([motion](motion.md#utilities-css)) |
| `--ds-pressable-radius` | `--ds-radius-sm` | `.ds-pressable`, the press model on a project element |
| `--ds-pressable-layer` | `currentColor` | the colour of the state layer of `.ds-pressable` |
| `--ds-kbd-border`, `--ds-kbd-bg` | `--ds-line-2`, `--ds-surface` | `.ds-kbd`: the box of a key |
| `--ds-scroll-fade` | `--ds-space-8` (card table wrappers: `--ds-card-pad`) | the length of the edge fades of `.ds-scroll-x`, `.ds-scroll-y`, the table wrappers and the cut edges of menus, combobox lists and drawer lists (2.1); `0px` turns every fade off |
| `--ds-scroll-reel-item` | `min(80%, 280px)` | the width of each child of `.ds-scroll-x--reel` |
| `--ds-scroll-reel-gap` | `--ds-space-4` | the gap of `.ds-scroll-x--reel`: the base, 2px less per density step |
| `--ds-scroll-max-height` | none | the height from which `.ds-scroll-y` scrolls |
| `--ds-spinner-size` | 16px | a spinner at md, before the size step |
| `--ds-spinner-determinate-size` | 40px | `.ds-spinner--determinate` at md, before the size step |
| `--ds-spinner-track`, `--ds-spinner-color` | none (`--ink`: a faint ring of the text colour; `--determinate`: `--ds-accent`), `--ds-primary` (`--ink`: `currentColor`) | spinner: the track behind the arc, the arc |
| `--ds-spinner-width` | 2px (`--determinate`: `--ds-spinner-determinate-width`) | the spinner's ring width (instead of `border-width`) |
| `--ds-spinner-determinate-width` | a tenth of its size (4px at md) | the ring width of `.ds-spinner--determinate` |
| `--ds-loader-size`, `--ds-loader-color` | 48px, `--ds-primary` | the shape loader's container at md, before the size step, and its shape ([shape loader](components.md#shape-loader)) |
| `--ds-loader-sm-size` | 24px | `.ds-loader--sm`, both **deprecated**: `.ds-sm` |
| `--ds-btn-height` | 40px | button: the base height (size md, comfortable density) that size and density steps apply to ([options.md](options.md)); other components read it to line up with a button |
| `--ds-btn-height-exact` | unset | button: a fixed height that ignores size and density (never the touch minimum) |
| `--ds-btn-padding-x` | `--ds-space-4` (`--text`, `--ghost`, `--sm`: `--ds-space-3`) | button: the base side padding, 4px more or less per size step |
| `--ds-btn-padding-start` | `= padding-x`; before a leading icon `--ds-space-3` (4px more per size above md, never more than the end padding) | button |
| `--ds-btn-radius` | `--ds-radius-action` | button (at most half the height, times `--ds-shape`) |
| `--ds-btn-radius-pressed` | `--ds-radius-action-pressed` | button while pressed (times `--ds-shape`; never rounder than the rest radius) |
| `--ds-btn-font` | `--ds-size-font` of the size class, else `--ds-font-label` | button |
| `--ds-btn-bg`, `--ds-btn-color`, `--ds-btn-border` | per variant | button fill, label, border colour |
| `--ds-btn-shadow` | none (`--elevated`: `--ds-elev-1`) | resting elevation |
| `--ds-btn-state` | `currentColor` | colour of the hover/press layer |
| `--ds-btn-state-opacity`, `--ds-btn-state-focus-opacity`, `--ds-btn-state-pressed-opacity` | `--ds-state-hover`, `--ds-state-focus`, `--ds-state-pressed` (`--disc`: 1) | layer strength on hover, keyboard focus, press |
| `--ds-btn-hover-color`, `--ds-btn-hover-border` | the resting values | hover label and border |
| `--ds-btn-hover-shadow` | the resting shadow (`--filled`: `--ds-elev-hover`, `--elevated`: `--ds-elev-2`) | hover elevation |
| `--ds-btn-hover-decoration` | none | e.g. `underline` for text buttons |
| `--ds-btn-icon-size` | 40px | `--icon` buttons: the base size, 8px more or less per size step |
| `--ds-btn-sm-height` | 32px | the fixed height of the deprecated `.ds-btn--sm` (density does not change it) |
| `--ds-btn-sm-icon-size` | 32px | the fixed size of the deprecated `.ds-btn--sm.ds-btn--icon`; a `.ds-drawer__row` item keeps that much room for its action |
| `--ds-btn-quiet-color` | `--ds-text-2` | `--quiet` label |
| `--ds-btn-disabled-bg`, `--ds-btn-disabled-border` | from `--ds-disabled-fill` | disabled container |
| `--ds-skeleton-radius` | `--ds-radius-action` (the heading line and a field: `--ds-radius-sm`; a media bone: `--ds-radius-card`) | the bones of a skeleton, times `--ds-shape` ([loading](components.md#loading)) |
| `--ds-skeleton-media-ratio` | 16 / 9 | the aspect ratio of `.ds-skeleton__media` |
| `--ds-disclosure-height` | 40px | a `.ds-disclosure` summary: the base height (size md, comfortable density) the size and density steps apply to; its rest radius is at most half of it |
| `--ds-disclosure-row-height` | 48px | a `.ds-disclosure--row` summary: the base height |
| `--ds-disclosure-radius` | `--ds-radius-action` | the plain summary (at most half the height, times `--ds-shape`) |
| `--ds-disclosure-radius-pressed` | `--ds-radius-action-pressed` | the plain summary while pressed (times `--ds-shape`; never rounder than at rest) |
| `--ds-disclosure-font` | `--ds-size-font` of the size class, else `--ds-font-label` | the summary |
| `--ds-disclosure-row-padding` | `--ds-space-4` | the side padding of a row and its body: the base, 2px less per density step |
| `--ds-disclosure-row-padding-exact` | unset | a fixed side padding that ignores density; a card sets it to `--ds-card-pad` so its rows run to its edges |
| `--ds-timeline-indent` | `--ds-space-8` | how far `.ds-timeline` entries sit from the start edge (the rail and its markers live in it), 4px per size step |
| `--ds-timeline-padding` | `--ds-space-3` (`--activity`: `--ds-space-2`) | an entry's block padding, 2px per density step |
| `--ds-timeline-dot-size`, `--ds-timeline-dot-color` | 10px, `--ds-primary` | the dot of a timeline entry (2px per size step) |
| `--ds-timeline-muted-color` | `--ds-outline` | the ring of a `.ds-timeline__item--muted` entry, around its dot or its marker |
| `--ds-timeline-line-width`, `--ds-timeline-line-color` | 2px, `--ds-line` | the rail (and the width of a muted ring) |
| `--ds-timeline-divider-color` | `--ds-line` | the hairline between entries |
| `--ds-timeline-marker-size` | 24px | the disc of `.ds-timeline__marker`, 4px per size step; the rail runs through its centre |
| `--ds-timeline-head-line` | 24px | the head line of an entry, on which its dot is centred (the height of a status chip), 4px per size step above md |
| `--ds-timeline-comment-bg` | `--ds-surface-low` | the box of a `.ds-timeline__item--comment` entry's text |
| `--ds-timeline-comment-radius` | `--ds-radius-card` | the box of a `.ds-timeline__item--comment` entry's text (times `--ds-shape`) |
| `--ds-tasks-gap` | `--ds-space-2` | the space between the steps of a `.ds-tasks` list, 2px per size step and per density step |
| `--ds-status-height` | 24px | a status chip's height at md, before size |
| `--ds-status-radius` | `--ds-radius-md`, or half the height of a taller chip | status chip |
| `--ds-tag-bg`, `--ds-tag-color` | `--ds-accent`, `--ds-on-accent` (a tone: its container pair; neutral `--ds-surface-high`, `--ds-text`) | a tag (`.ds-tag`) |
| `--ds-tag-height` | 24px | a tag's height at md, before size (its radius is half of it) |
| `--ds-status-spinner-width` | 2px | the ring width of the spinner in a running status chip |
| `--ds-alert-bg`, `--ds-alert-color` | `--ds-surface-low`, `--ds-text` | the neutral alert (kinds set them from their own hooks) |
| `--ds-alert-icon` | `--ds-primary` | the neutral alert's icon and edge colour |
| `--ds-alert-edge` | 0 | the width of an alert's leading edge (`4px`: an edge in the icon colour) |
| `--ds-alert-radius` | `--ds-radius-card` | an alert's corners, times `--ds-shape` |
| `--ds-alert-padding-block`, `--ds-alert-padding-inline` | 12px, 16px (`--section`: 16px, 20px) | an alert's padding at md, before size and density |
| `--ds-alert-success-bg`, `--ds-alert-success-color`, `--ds-alert-success-icon` | `--ds-success-container`, `--ds-on-success-container`, `--ds-success` | an alert in `.ds-tone-success` |
| `--ds-alert-warning-bg`, `--ds-alert-warning-color`, `--ds-alert-warning-icon` | `--ds-warning-surface`, `--ds-text`, `--ds-warning` | an alert in `.ds-tone-warning` |
| `--ds-alert-error-bg`, `--ds-alert-error-color`, `--ds-alert-error-icon` | `--ds-error-container`, `--ds-on-error-container`, `--ds-error` | an alert in `.ds-tone-error` (its buttons take `--ds-alert-error-color`) |
| `--ds-alert-text-basis` | 256px | the narrowest text of an alert with `.ds-alert__actions` before the actions wrap |
| `--ds-switch-halo` | 40px | the halo around the switch handle: the base, 8px per size step |
| `--ds-switch-track-height` | 32px | the track: the base height, 4px per size step; the width (13 : 8), the handle, its travel and the icon follow |
| `--ds-switch-height` | 40px | the smallest height of a switch row: the base that size and density steps apply to |
| `--ds-switch-font` | the size's role, else `--ds-font-label` | the name of a switch |
| `--ds-switch-list-row-height` | 56px | the smallest row of a `.ds-switch-list`: the base that size and density steps apply to |
| `--ds-switch-disabled-track`, `--ds-switch-disabled-handle` | `--ds-disabled-fill`, `--ds-disabled-ink` | disabled switch track (and border) and off handle |
| `--ds-slider-halo` | 40px | the halo around the slider handle (hover, press, focus), and the slider's height: the base that size and density steps apply to |
| `--ds-slider-thumb-size` | 20px | the slider handle: the base, 4px per size step |
| `--ds-slider-track-height` | 4px | the slider track: the base, 1px per size step |
| `--ds-progress-height` | 4px | linear progress: the track's thickness at md, before the size step |
| `--ds-progress-bar` | `--ds-primary` (a tone: `--ds-tone`) | linear progress: the bar, over any tone |
| `--ds-progress-gap` | 4px | linear progress: the gap between the bar and the remaining track |
| `--ds-progress-track`, `--ds-progress-stop` | `--ds-accent`, `--ds-primary` (a tone: `--ds-tone-container`, `--ds-tone`) | linear progress: the remaining track, the stop dot at its end |
| `--ds-meter-height` | 4px | `.ds-meter`: the base height, 1px per size step (its rest radius is half of it) |
| `--ds-meter-track`, `--ds-meter-color` | `--ds-chart-track`, `--ds-chart-1` (tones: `--ds-tone`, or `--ds-chart-neutral`, `--ds-chart-warning`, `--ds-chart-error`) | `.ds-meter`: the track, the fill |
| `--ds-columns-height` | 120px | the plot of `.ds-columns` at size md, comfortable density: 24px per size step, 12px per density step (`--mini`: 32px) |
| `--ds-columns-radius` | `--ds-radius-xs` | the rounded data end of a column (times `--ds-shape`) |
| `--ds-columns-group-min` | 56px | the least width of a group of `.ds-columns--grouped` |
| `--ds-chart-color` | `--ds-chart-1` (series and tone modifiers set it) | the colour of a column or a legend key |
| `--ds-legend-key-size` | 12px | the key of a `.ds-legend` entry, 2px per size step |
| `--ds-chart-forced-ink` | `CanvasText` | the fills of columns and legend keys in forced colours; a component that lays them on a system fill of its own sets it |
| `--ds-tile-radius` | `--ds-radius-lg` | key-figure tile (times `--ds-shape`) |
| `--ds-tile-radius-pressed` | `--ds-radius-md` | a clickable tile while pressed (times `--ds-shape`; never rounder than the rest radius) |
| `--ds-tile-padding` | `--ds-space-5`, on a phone `--ds-space-4` | a tile's padding (the head 4px less), 2px per density step |
| `--ds-tile-min-width` | 176px | the narrowest tile of a `.ds-tiles` row (fewer per row below it; one per row on a phone, 128px keeps two down to a 360px phone) |
| `--ds-tiles-columns` | 4 | the most tiles per row (`.ds-tiles--3`: three) |
| `--ds-tile-value-line` | 11/9 of `--ds-size-display` (44px) | the line height of `.ds-tile__value` at the md size; a size step scales it with the value |
| `--ds-tile-trend-color` | `--ds-chart-1` | `.ds-tile__trend`: the `currentColor` of a project's sparkline |
| `--ds-tile-selected-bg` | `--ds-accent` | a selected tile (`aria-pressed`, `aria-checked`, `aria-selected`) |
| `--ds-list-item-height` | 56px | a `.ds-list` row: the base height (size md, comfortable density) that size and density steps apply to |
| `--ds-list-padding` | `--ds-space-4` | the side padding of a `.ds-list` row, 2px per density step |
| `--ds-list-padding-y` | `--ds-space-3` | the block padding of a `.ds-list` row, 4px per size step, 2px per density step |
| `--ds-list-radius` | `--ds-radius-card` | the corners of a `.ds-list` (times `--ds-shape`) |
| `--ds-list-title-font` | `--ds-size-font` of the size class, else `--ds-font-label` | `.ds-list__title` |
| `--ds-list-media-size` | 40px | `.ds-list__media`, 4px per size step |
| `--ds-list-media-radius` | `--ds-radius-sm` | `.ds-list__media` (times `--ds-shape`, at most half its size; `--round`: `--ds-radius-action`) |
| `--ds-list-text-min` | 12rem | the width below which a row's trailing parts (status, actions, chevron) drop to a second line |
| `--ds-list-current-bg` | `--ds-accent` | the current row of a `.ds-list` (`aria-current`) |
| `--ds-list-group-bg` | `--ds-surface` | the opaque fill of a sticky `.ds-list__group` row |
| `--ds-list-group-top` | 0px | where a `.ds-list__group` row sticks (the height of a sticky page head above it) |
| `--ds-kv-list-padding` | `--ds-space-3` | the block padding of a `.ds-kv-list` row and of `.ds-facts--rows`, 4px per size step, 2px per density step |
| `--ds-facts-label-width` | 36% | the label column of `.ds-facts--rows` |
| `--ds-card-padding` | `--ds-space-6` | card padding: the base, 2px less per density step |
| `--ds-card-padding-sm` | `--ds-space-4` | card padding at 600px and below |
| `--ds-card-padding-filled` | `--ds-space-5` | `.ds-card--filled` padding |
| `--ds-card-radius` | `--ds-radius-card` | card radius, times `--ds-shape` |
| `--ds-card-radius-pressed` | `--ds-radius-card-pressed` | an interactive card while pressed (times `--ds-shape`; never rounder than at rest) |
| `--ds-card-bg` | `--ds-surface` | the fill of `.ds-card` and `.ds-card--outlined` |
| `--ds-card-border` | `--ds-line` | the hairline of a card and of `.ds-card__section` |
| `--ds-card-filled-bg` | `--ds-surface-low` | the fill of `.ds-card--filled` |
| `--ds-card-title-line` | 24px | line height of `.ds-card__title`; a button, switch or chip in the header row overhangs it, a status chip, badge or tag sits on it (set it with a type role that changes the subtitle line) |
| `--ds-card-hover-shadow` | none (`--elevated`: its own shadow) | `.ds-card--interactive` on hover, not when blocked (a theme may set `var(--ds-elev-hover)`); never a lift |
| `--ds-card-selected-bg` | `--ds-accent` | a selected interactive card |
| `--ds-selected-ring` | `--ds-primary` | the inset ring of a selected tile or card |
| `--ds-card-shadow` | `--ds-elev-1` | `.ds-card--elevated` |
| `--ds-card-check-size` | `--ds-space-5` | the round mark of `.ds-card--selectable` |
| `--ds-card-media-size` | 160px | `.ds-card__media` in the row of `.ds-card--horizontal` |
| `--ds-card-body-min` | 240px | the room `.ds-card__body` asks for before a horizontal card wraps |
| `--ds-prose-gap` | `--ds-space-2` (`--compact`: `--ds-space-1`) | the gap between blocks of `.ds-prose`: the base, 1px less per density step |
| `--ds-prose-font` | `--ds-font-reading` (`--dense`, `--compact`: `--ds-font-body`) | the text of `.ds-prose` |
| `--ds-prose-strong-weight` | `--ds-weight-label` | `strong` and `b` in `.ds-prose` |
| `--ds-prose-radius` | `--ds-radius-card` | quotes and callouts (times `--ds-shape`) |
| `--ds-code-block-radius` | `--ds-radius-card` | `.ds-code-block` and a `pre` in prose (times `--ds-shape`) |
| `--ds-empty-disc-size` | 48px (`--page` 72px, `--inline` 32px) | the disc of `.ds-empty__disc` at md ([empty state](components.md#empty-state)); the ring of `.ds-empty--done` follows, the glyph keeps its markup's size |
| `--ds-empty-disc-bg`, `--ds-empty-disc-color` | `--ds-accent`, `--ds-on-accent-icon` (a cause or tone: its pair) | the disc's fill and glyph, over any cause or tone |
| `--ds-empty-padding` | 32px (`--page`: 96px, twice this hook or 48px) | an empty state's block padding at md, before size and density (`--inline` has its own, 12px) |
| `--ds-empty-media-size` | 120px (`--page`: 160px, `--inline`: 32px) | the height of `.ds-empty__media`, the slot for a picture |
| `--ds-menu-item-height` | 48px | menu item (and action sheet row) at size md and the comfortable density |
| `--ds-menu-font` | `--ds-size-font`, else `--ds-font-body` | the items' type |
| `--ds-menu-padding` | `--ds-space-2` | the menu's block padding at the comfortable density |
| `--ds-menu-radius` | `--ds-radius-xs` | the menu's radius at the default shape |
| `--ds-menu-danger-color` | `--ds-error` | the ink of `.ds-menu__item--danger` |
| `--ds-chip-height` | 32px | a chip: the base height (size md, comfortable density) that size and density steps apply to ([options.md](options.md)) |
| `--ds-chip-padding-x` | `--ds-space-4` | a chip: the base side padding, 4px per size step; next to a check, icon or glyph 8px less |
| `--ds-chip-radius` | `--ds-radius-chip` | a chip (at most half the height, times `--ds-shape`) |
| `--ds-chip-font` | the size's role, else `--ds-font-chip` | the label of a chip |
| `--ds-chip-check-size` | 18px | the check of a selected chip (and the room it opens), its icon and trailing glyph: the base, 2px per size step |
| `--ds-chip-disabled-border`, `--ds-chip-disabled-bg` | `--ds-disabled-fill` | disabled chip outline, and the container of a disabled selected chip (label and check take `--ds-disabled-ink`) |
| `--ds-chip-input-bg`, `--ds-chip-input-color`, `--ds-chip-input-border` | `--ds-accent`, `--ds-on-accent`, `--ds-accent` | an input chip (`.ds-chip--input`): fill, ink, edge |
| `--ds-chip-max-width` | 240px | the widest body of an action or input chip; its label ends in an ellipsis |
| `--ds-badge-size` | 20px | a count badge (`.ds-badge`): height and smallest width at md |
| `--ds-badge-dot-size` | 8px | `.ds-badge--dot` at md |
| `--ds-badge-radius` | `--ds-radius-action` (never above half the size) | a count badge's corners |
| `--ds-badge-bg`, `--ds-badge-color` | `--ds-accent`, `--ds-on-accent` (tones: their container pair; a dot: `--ds-primary`, a tone's full colour; on a tinted host `--ds-primary`, `--ds-on-primary`) | a badge's fill and figure |
| `--ds-sheet-width`, `--ds-sheet-width-wide` | 560px, 720px | side sheet |
| `--ds-sheet-foot-border` | `1px solid var(--ds-line)` | the hairline above `.ds-sheet__foot` |
| `--ds-sheet-padding` | `--ds-space-6` | the side padding of head, body and foot at the comfortable density |
| `--ds-sheet-head-height` | 64px | `.ds-sheet__head` at the comfortable density |
| `--ds-sheet-radius` | `--ds-radius-dialog` | the panel's leading corners at the default shape |
| `--ds-dialog-width` | 400px | dialog |
| `--ds-dialog-width-sm` | 320px | `.ds-dialog--sm` |
| `--ds-dialog-width-lg` | 560px | `.ds-dialog--lg` |
| `--ds-dialog-width-xl` | 720px | `.ds-dialog--xl` |
| `--ds-dialog-width-wide` | 560px | **deprecated** name of `--ds-dialog-width-lg`, read after it |
| `--ds-dialog-padding` | `--ds-space-6` | the box's padding at the comfortable density |
| `--ds-dialog-radius` | `--ds-radius-dialog` | the box's radius at the default shape |
| `--ds-dialog-head-height` | 56px | `.ds-dialog__head` at the comfortable density |
| `--ds-dialog-border` | `1px solid transparent` (visible in forced colors) | dialog edge |
| `--ds-dialog-shadow` | `--ds-elev-overlay` | dialog |
| `--ds-dialog-scrim` | `--ds-scrim` | the dialog's backdrop; `.ds-dialog--nested` sets it to `--ds-scrim-nested` |
| `--ds-dialog-height` | auto (capped by the window) | the dialog box; a fixed height keeps a box with a filtered list from jumping |
| `--ds-dialog-full-radius` | 0px | the box of a full-screen dialog (`.ds-dialog--full`, `--full-narrow`) |
| `--ds-table-row-hover` | `currentColor` at `--ds-state-hover-lg` (`color-mix()`) | the row hover layer on the cells; a fixed colour where `color-mix(currentColor)` misbehaves |
| `--ds-table-row-selected` | `--ds-accent` | a selected table row (`.ds-table__row--selected`, a checked checkbox in a cell) |
| `--ds-table-head-height` | 48px | table header cells: the base (size md, comfortable density) that size and density steps apply to ([options.md](options.md)); the block padding follows |
| `--ds-table-row-height` | 52px | table body cells: the base (size md, comfortable density) that size and density steps apply to ([options.md](options.md)); the block padding follows |
| `--ds-table-dense-row-height` | 40px | the fixed height of the cells of `.ds-table--dense` (deprecated, with the class) |
| `--ds-table-padding` | `--ds-space-4` | the side padding of table cells and of an open detail: the base that density steps apply to (2px per step); on phones (600px) three quarters of it, below 360px half |
| `--ds-table-zebra` | `--ds-surface-low` | the even rows of `.ds-table--zebra` |
| `--ds-table-sticky-bg` | `--ds-surface` | the opaque base of sticky rows and pinned columns, and the background of `.ds-table-wrap--fill` |
| `--ds-table-max-height` | none | the most height of a wrapper around `.ds-table--sticky-head` or `.ds-table--sticky-foot`: set it, so the rows scroll under the sticky ones |
| `--ds-table-cell-max-width` | 280px | where a cell of `.ds-table-wrap--fill` is cut with an ellipsis |
| `--ds-table-fill-min-height` | 240px | the least height of `.ds-table-wrap--fill` (a short window scrolls the view instead) |
| `--ds-table-fill-max-height` | none | the most height of `.ds-table-wrap--fill` |
| `--ds-selection-bar-height` | 48px | the least height of `.ds-selection-bar`: the base that size and density steps apply to |
| `--ds-pagination-current-bg` | `--ds-accent` | the fill of the current `.ds-pagination__page` |
| `--ds-pagination-current-color` | `--ds-on-accent` | the figure of the current `.ds-pagination__page` |
| `--ds-pagination-jump-width` | 72px | the number field of `.ds-pagination__jump` |
| `--ds-input-font` | the size's role, else body; input role at 600px and below | fields: the type role of the text (its weight comes from `--ds-input-weight`) |
| `--ds-input-weight` | `--ds-weight-regular` | the weight of field text, also in the roles of the sizes |
| `--ds-check-size` | 18px | the drawn checkbox and radio (`.ds-check`, `.ds-checkbox`, `.ds-radio-input`, radio cards, table checkboxes): the base, 2px per size step |
| `--ds-check-target` | 40px | their halo (hover, press, focus) across: the base, 8px per size step and 4px per density step |
| `--ds-input-height` | 40px | fields: the base height (size md, comfortable density) of `.ds-input`, the search pill, input groups and a growing textarea, which size and density steps apply to ([options.md](options.md)); the combobox toggle lines up with it |
| `--ds-input-padding-x` | `--ds-space-3` | fields and input groups: the base side padding, 4px more or less per size step |
| `--ds-check-height` | 40px | a `.ds-check` row: the base height that size and density steps apply to (one line of its label; a longer label wraps and the box stays beside its first line) |
| `--ds-check-sm-height` | 32px | the deprecated `.ds-check--sm`: its fixed height |
| `--ds-radio-padding` | `--ds-space-4` | radio and checkbox cards: the base padding, 2px less per density step |
| `--ds-input-bg`, `--ds-input-border`, `--ds-input-radius` | `--ds-surface`, `--ds-outline`, `--ds-radius-field` | the outlined field and the input group at rest (fill, 1px border colour, corners; the filled field's top corners) |
| `--ds-input-focus-color` | `--ds-primary` | the field's ring, the label tint while it has the focus, the filled field's bottom line, the input group and composer rings |
| `--ds-input-grow-max` | 50vh | the tallest a `.ds-input--grow` textarea grows before it scrolls |
| `--ds-field-error-color`, `--ds-field-warning-color`, `--ds-field-success-color` | `--ds-on-error-container`, `--ds-on-warning-container`, `--ds-text-2` | the text of an error, a warning and a success hint (their icons stay `--ds-error`, `--ds-warning`, `--ds-success`) |
| `--ds-field-changed-color` | `--ds-primary` | the dot after the label of a `.ds-field--changed` (keep 3:1 on the surface) |
| `--ds-form-rows-control-max` | 480px | the widest control in `.ds-form--rows` |
| `--ds-check-list-max-height` | 264px | `.ds-check-list` scrolls on its own beyond it (`none`: every row shows) |
| `--ds-form-actions-bleed` | `--ds-content-pad-x` (in a `.ds-card`: `--ds-card-pad`) | how far a `.ds-form-actions--sticky` bar bleeds on a phone: set it on a padded container of the page's own to its inline padding (it inherits) |
| `--ds-composer-radius` | `--ds-radius-2xl` | the shell of `.ds-composer` |
| `--ds-composer-max-height` | 220px | the tallest the composer's textarea grows before it scrolls |
| `--ds-dropzone-border` | `1px dashed var(--ds-outline)` | the border of a `.ds-dropzone` ([file upload](components.md#file-upload)) |
| `--ds-dropzone-padding` | `--ds-space-6` | `.ds-dropzone`: the block padding at comfortable density, 2px less per density step (the inline padding stays `--ds-space-5`) |
| `--ds-dropzone-radius` | `--ds-radius-card` | `.ds-dropzone`, times `--ds-shape` |
| `--ds-file-button-height` | 32px | the browser's button in `.ds-input[type="file"]`: the base height that size and density steps apply to |
| `--ds-combo-option-height` | 48px | combobox option: the base height (size md, comfortable density) that size and density steps apply to; a least height, its text may need more |
| `--ds-combo-radius` | `--ds-radius-xs` | the corners of the combobox list, times `--ds-shape` |
| `--ds-tooltip-radius` | `--ds-radius-xs` | the tooltip's radius at the default shape |
| `--ds-stack-gap`, `--ds-stack-gap-page` | `--ds-space-4`, `--ds-space-5` | `.ds-stack`; a stack directly in the page and `.ds-stack--page` |
| `--ds-page-head-text-basis` | 320px | the room the page head's title and lead take before the actions wrap under them |
| `--ds-page-head-title-line` | 32px | the title line the page head's actions centre on (set it with a theme that changes `--ds-font-headline`) |
| `--ds-breadcrumbs-item-max` | 240px | a breadcrumb item before its ellipsis |
| `--ds-breadcrumbs-font` | the size's role, `--ds-font-label` | the type of the breadcrumbs |
| `--ds-auth-width` | 400px | the card of `.ds-auth` |
| `--ds-drawer-item-height` | 48px | drawer item at size md and comfortable (8px per size step, 4px per density step; its rest radius is half of what it computes to, so the press morph runs its whole way) |
| `--ds-topbar-scrolled-bg` | `--ds-surface-high` | top bar while the view is scrolled (`data-scrolled`); `transparent` keeps a flat bar |
| `--ds-view-scrollbar-gutter` | `stable` | the view's scrollbar gutter: `stable both-edges` (symmetric) or `auto` (no reserved room) |
| `--ds-segmented-padding-x` | `--ds-space-4` | the inline padding of a segmented option (narrow switches) |
| `--ds-topbar-search-max` | 720px | the widest `.ds-topbar__search` |
| `--ds-account-text-max` | 240px | the name and email beside the avatar in `.ds-account--capsule` |
| `--ds-avatar-size` | 32px | `.ds-avatar` and the account's avatar at size md (8px per size step) |
| `--ds-drawer-font` | the size's role, `--ds-font-body` | the type of a drawer item (always at the regular weight; the current item takes the label weight) and of a group toggle (in the label weight) |
| `--ds-drawer-indent` | `--ds-space-8` | one level of a nested drawer group |
| `--ds-segmented-height` | 32px | the segmented track at size md and comfortable (8px per size step, 4px per density step) |
| `--ds-segmented-font` | the size's role, `--ds-font-body` | the type of a segmented option (always at the regular weight; the current option takes the label weight) |
| `--ds-tabs-height` | 48px | a tab at size md and comfortable (8px per size step, 4px per density step; the state layer is a pill `--ds-space-1` inside it; a contained tab gives up the tray's padding) |
| `--ds-tabs-padding-x` | `--ds-space-4` | a tab's side padding at size md (4px per size step) |
| `--ds-tabs-font` | the size's role, `--ds-font-label` | the type of a tab (always at the regular weight; the selected tab takes the label weight) |
| `--ds-tabs-indicator-height`, `--ds-tabs-indicator-color` | 3px, `--ds-primary` | the bar of the selected tab, under it (at its end in a vertical row) |
| `--ds-tabs-contained-bg` | `--ds-surface-high` | the tray of `.ds-tabs--contained` |
| `--ds-steps-bar-height` | 4px | the segments of `.ds-steps--bar` |
| `--ds-steps-mark-size` | `--ds-space-6` | a step's mark at size md (4px per size step) |
| `--ds-steps-font` | the size's role, `--ds-font-body` | the type of a step (always at the regular weight; the current label takes the label weight) |
| `--ds-steps-gap` | `--ds-space-5` | the room between the steps of `.ds-steps--vertical` (2px per density step) |
| `--ds-toast-action-color` | `--ds-inverse-primary` | a text button in a snackbar (`.ds-toast__action`, Undo) |
| `--ds-toast-close-size` | 36px | the close button of a snackbar |
| `--ds-toast-radius` | `--ds-radius-sm` | a snackbar's radius at the default shape |
| `--ds-savebar-offset` | `--ds-space-4` | save bar: distance from the view's bottom edge |
| `--ds-savebar-inset` | the page pad (`--ds-content-pad-x`) | save bar: distance from the view's sides (the bar is at most `--ds-content-max` wide) |
| `--ds-savebar-min-height` | 56px | save bar: the base of its least height (size md, comfortable density) |
| `--ds-savebar-radius` | `--ds-radius-card` | save bar, times `--ds-shape` |
| `--ds-savebar-bg`, `--ds-savebar-shadow` | `--ds-surface-popover`, `--ds-elev-overlay` | save bar surface and elevation |
| `--ds-savebar-bleed` | `--ds-content-pad-x` | `.ds-savebar--inline`: how far the bar runs beyond its form on both sides; set it to the inline padding of a container of the page's own |
| `--ds-savebar-room` | its least height at the largest size, `--ds-space-8`, `--ds-space-2` and the safe area | `.ds-savebar--inline`: the room its scroller and the snackbars keep clear of it; set it for a bar taller than two rows |
| `--ds-ripple-color` | `currentColor` | the pointer ripple of every action ([ripple](components.md#ripple)) |
<!-- /generated: hooks -->

`--ds-card-pad` is the resulting padding of each card (tables read it to bleed to the card edges); read it, do not
set it. Runtime properties (set by scripts, not themes) are documented with their components: `--ds-progress`
([progress](components.md#progress)), `--ds-share` ([charts](components.md#charts)), `--ds-toast-left`, `--ds-toast-bottom` (set by the page), `--ds-toast-lift`,
`--ds-toast-shift`, `--ds-toast-shift-y` (written by `DS.overlay` only), `--ds-toast-reserve` (written by `toast()`,
or by the page with `reserve: false`), `--ds-keyboard-inset` (written by `DS.dom.followViewport()`)
([snackbar](components.md#snackbar)), `--ds-savebar-height` ([save bar](components.md#save-bar)), `--ds-tooltip-x`, `--ds-tooltip-y`
([tooltip](components.md#tooltip)), `--ds-menu-x`, `--ds-menu-y` ([menu](components.md#menu)), `--ds-i`, the indicator's box
(`--ds-indicator-x`, `--ds-indicator-y`, `--ds-indicator-w`, `--ds-indicator-h`), its clip edges (`--ds-indicator-t`,
`--ds-indicator-r`, `--ds-indicator-b`, `--ds-indicator-l`) and its travel time on the track (`--ds-indicator-dur`)
([motion](motion.md#dsindicator-jsindicatorjs)), and `--ds-drawer-icon-axis` (set by `.ds-app--drawer`, aligns the
brand with the drawer icons). The pill's corners, `--ds-indicator-radius`, belong to the indicator's class (the
drawer's sets half the item height); the property does not inherit, so set it on that class, never on `.ds-theme`.
`--ds-indicator-lag` is a motion hook: themes never set it.

## Dark, compact and contrast

Three themes ship in `dist/themes/`. Load them after `ds.css` and after your own theme, each for the condition it
serves; they set roles and hooks on `.ds-theme` like any theme, never motion tokens.

| File | What it sets | Load it |
|---|---|---|
| `themes/dark.css` | every colour role that does not follow another role, in the Material 3 dark tones (backdrop `#131314`, surface `#1e1f20`, primary `#a8c7fa`), the floating surfaces a tone above the page (`--ds-surface-overlay`, `--ds-surface-popover`), lighter chart series (`--ds-chart-2` to `--ds-chart-4`), `--ds-color-scheme: dark` and shadows on black | `media="(prefers-color-scheme: dark)"`, or by the user's choice |
| `themes/compact.css` | 13/18 UI text and the dense density (`--ds-density: -2`: buttons, fields and the segmented switch 32px, chips 24px; tabs, drawer rows, menu rows and table rows 40px) with `--ds-table-row-height` 48px, `--ds-table-padding` 20px (so 16px beside the text) and `--ds-segmented-height` 40px, the hooks it needs for that; under `@media (pointer: coarse)` the default density, heights and padding come back, and field text keeps 16px on phones | for desktop consoles; touch density is `.ds-touch` (opt-in, never automatic) |
| `themes/contrast.css` | `--ds-text-2` as the text colour, a stronger `--ds-text-3`, hairlines at the outline colour, darker outlines and field borders, 3px focus rings, solid link underlines, a stronger tint; mixed from your text and surface roles, so it works on any palette, dark included | `media="(prefers-contrast: more)"` |

```html
<link rel="stylesheet" href="vendor/dashboard-style/ds.css">
<link rel="stylesheet" href="css/theme.css">
<link rel="stylesheet" href="vendor/dashboard-style/themes/dark.css" media="(prefers-color-scheme: dark)" id="ds-dark">
<link rel="stylesheet" href="vendor/dashboard-style/themes/contrast.css" media="(prefers-contrast: more)">
```

A user's choice of appearance (light, dark or the system's) sets the dark link's `media` before the first paint, in an
inline script right after the links:

```html
<script>
  (function () {
    var choice = null;
    try { choice = localStorage.getItem('appearance'); } catch (e) { /* storage blocked: follow the system */ }
    var link = document.getElementById('ds-dark');
    link.media = choice === 'dark' ? 'all' : choice === 'light' ? 'not all' : '(prefers-color-scheme: dark)';
  })();
</script>
```

The dark theme replaces the brand colours with the system's own dark tones. A brand that needs a dark mode copies
`themes/dark.css` into its own `theme-dark.css`, changes `--ds-primary`, `--ds-on-primary`, `--ds-accent` and
`--ds-on-accent` (and the inverse primary), and checks the pairs (below). A project role of its own that carries a
colour (`--<prefix>-*`) needs its dark value there too. Status keeps its words and icons in every theme; the
contrast theme never relies on colour alone either.

Or generate both schemes from one seed: the [theme generator](theme-generator.md) (`tools/theme.mjs`) writes light,
dark and contrast themes that pass every pair, and eight generated presets ship in `themes/presets/`.

## Checking a theme

The copy checks a theme file without network or dependencies (Node 18 or later):

```sh
node vendor/dashboard-style/tools/check-theme.mjs css/theme.css
node vendor/dashboard-style/tools/check-theme.mjs css/theme-dark.css --with vendor/dashboard-style/themes/dark.css
```

It prints one line per finding, `<file>:<line> <error|warning|info> <rule> <message>`, and exits 1 on an error. The
files are read as loaded after `ds.css`, in the order given; `--with` files load after them (a shipped theme your
theme is used with) and count for the contrast pairs.

| Rule | Level | What |
|---|---|---|
| `unknown` | error | a `--ds-*` name that is not a token of the copy (`tokens.json`): a typo or a name of another version |
| `motion` | error | a motion token or motion hook (rule 2) |
| `root` | error | a rule on `:root` (tokens live on `.ds-theme`) |
| `layer` | error | `@layer` (a theme stays unlayered) |
| `important` | error | `!important` |
| `input-font` | error | `--ds-font-input` under 16px (a warning for `--ds-input-font`) |
| `removed` | error | a name `deprecations.json` lists as removed, with its replacement |
| `deprecated` | warning | a deprecated name, with its replacement |
| `not-themeable` | warning | a scale, runtime or internal property (`tokens.json` says which) |
| `contrast` | warning | a text pair under 4.5:1, a checkbox, icon, outline or chart mark pair under 3:1 (rule 3); `var()`, hex, `rgb()`, `color-mix(in srgb, ...)` and `light-dark()` (in each scheme, below) are resolved, any other form is reported as `info`, "not checked" |
| `restyle` | warning | a component selector with a property that is not a custom property |

Every rule whose selector names `.ds-theme` sets roles: plain `.ds-theme` (or `.ds-theme.my-widget`) is the base, and
every other selector (`.ds-theme[data-accent="teal"]`) or `@media` block is a variant, checked over the base and,
with `--with`, over the base with those files; a variant warns only when it fails in each, so the dark tone of an
accent (`.ds-theme[data-dark][data-accent="teal"]`) passes over the dark theme and the light tone over the base. The
pairs are those of the repository's own tests (`tools/theme-rules.mjs`), so a theme that passes keeps what the default
palette keeps.

A theme for both schemes in one file writes its colour roles as `light-dark(<light>, <dark>)` (the generated presets
do, [theme-generator.md](theme-generator.md)). The check then takes every pair in each scheme the theme shows: those
its `--ds-color-scheme` names (`light dark`: both; a variant that pins `--ds-color-scheme: dark`, such as
`.ds-theme[data-ds-scheme="dark"]`, dark only), and a finding names its scheme: `--ds-text on --ds-surface (dark)`.

In the browser, open `styleguide/index.html#/colour`, choose "Load theme file ..." and pick your CSS: every component
re-renders with it, and the "Theme check" card of the Colour page lists the same contrast pairs as the browser
computes them (exactly, `color-mix()` included, and a `light-dark()` theme in each scheme it shows), the field text size, and the motion tokens, `:root`, `@layer` and
`!important` of the loaded file; each row with an icon and a word. Look at the page with forced colors emulated too
(DevTools, Rendering panel).
