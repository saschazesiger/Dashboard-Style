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
.ds-theme.my-widget :where(button, h1, h2, h3, h4, h5, h6, p, small, strong, code, pre, blockquote, hr, mark, img, ul, ol, li, dl, dt, dd, a, article, section, header, footer, nav, main, fieldset, legend, details, summary, dialog, input, select, textarea, label, table, caption, th, td, kbd, sup, output, figure, figcaption, time, selectedcontent) {
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
| `--ds-cluster-gap` | `--ds-space-2` | the gap of `.ds-cluster`, 2px less per density step |
| `--ds-split-gap`, `--ds-switcher-gap`, `--ds-grid-gap` | `--ds-space-4` | the gaps of `.ds-split`, `.ds-switcher` and `.ds-grid`, 2px less per density step |
| `--ds-split-side` | `18rem` | the width of `.ds-split__side` while it sits beside the main column |
| `--ds-split-min` | `50%` | the narrowest `.ds-split__main` beside the side; narrower, the two stack |
| `--ds-switcher-at` | `30rem` | the width of `.ds-switcher` under which its parts stack |
| `--ds-measure-max` | `--ds-measure` (`--wide`: `--ds-content-max`) | the widest `.ds-measure` |
| `--ds-measure-pad` | `0px` | the side padding of `.ds-measure`, outside its width |
| `--ds-cover-min` | `100%` | the least height of `.ds-cover` (`--screen`: `100dvh`) |
| `--ds-cover-pad` | `--ds-space-4` | the padding of `.ds-cover` |
| `--ds-frame-ratio` | `16 / 9` | the aspect ratio of `.ds-frame` without a ratio modifier |
| `--ds-frame-radius` | `--ds-radius-md` | the corner radius of `.ds-frame`, times `--ds-shape` |
| `--ds-grid-min` | `16rem` | the narrowest column of `.ds-grid` (never wider than the grid) |
| `--ds-pressable-radius` | `--ds-radius-sm` | `.ds-pressable`, the press model on a project element |
| `--ds-pressable-layer` | `currentColor` | the colour of the state layer of `.ds-pressable` |
| `--ds-kbd-border`, `--ds-kbd-bg` | `--ds-line-2`, `--ds-surface` | `.ds-kbd`: the box of a key |
| `--ds-divider-color` | `--ds-line` | the hairlines of `.ds-divider` (across, upright and around a caption) |
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
| `--ds-chart-height` | 240px | the plot of a line, area, column, bar or combo `.ds-chart` at size md, comfortable density: 40px per size step, 16px per density step; 3/4 of it under 480px of chart width |
| `--ds-chart-radial-height` | 200px | the plot of a donut, pie or ring: 24px per size step, 8px per density step |
| `--ds-chart-gauge-height` | 160px | the plot of a gauge: 24px per size step, 8px per density step |
| `--ds-chart-spark-height` | 32px | a sparkline (it lines up with a figure; no size or density) |
| `--ds-chart-bar` | 24px | the widest bar of a column or bar chart, 4px per size step (a narrow band gives less) |
| `--ds-chart-radius` | `--ds-radius-xs` | the rounded data end of a bar (times `--ds-shape`); the frame's focus ring |
| `--ds-chart-stroke` | 2px | the line of a line, area or sparkline |
| `--ds-chart-marker` | 8px | a point's marker (circle, square, triangle, diamond by series), 2px per size step |
| `--ds-chart-grid` | `--ds-line` | the gridlines |
| `--ds-chart-area-opacity` | `--ds-state-dragged` | the wash of an area under its line |
| `--ds-chart-stack-opacity` | `--ds-state-stale` | the fill of a stacked area |
| `--ds-chart-dash-2` | `8px 4px` | the dash of the line of series 2 (`none`: solid) |
| `--ds-chart-dash-3` | `2px 4px` | the dash of the line of series 3 |
| `--ds-chart-dash-4` | `12px 4px 2px 4px` | the dash of the line of series 4 |
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
| `--ds-list-selected-bg` | `--ds-accent` | a row of a `.ds-list` whose `.ds-list__check` is checked |
| `--ds-list-max-height` | 24rem | the height past which a `.ds-list--scroll` scrolls its rows inside its border |
| `--ds-facts-radius` | `--ds-radius-card` | the corners of `.ds-facts--bordered` (times `--ds-shape`) |
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
| `--ds-sheet-docked-width` | 400px | a docked panel (`.ds-sheet__panel--push`, `--inspector`); the whole width of its layout at 480px and below |
| `--ds-sheet-docked-border` | `1px solid var(--ds-line)` | the hairline between a docked panel and the content beside it |
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
| `--ds-dialog-modeless-inset` | `--ds-space-4` (`--ds-space-2` at 600px and below) | the gap of a non-modal box (`.ds-dialog__box--modeless`) to the window's edges |
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
| `--ds-input-focus-color` | `--ds-primary` | the field's ring, the label tint while it has the focus, the filled field's bottom line and the input group ring (the composer reads it too) |
| `--ds-input-grow-max` | 50vh | the tallest a `.ds-input--grow` textarea grows before it scrolls |
| `--ds-field-error-color`, `--ds-field-warning-color`, `--ds-field-success-color` | `--ds-on-error-container`, `--ds-on-warning-container`, `--ds-text-2` | the text of an error, a warning and a success hint (their icons stay `--ds-error`, `--ds-warning`, `--ds-success`) |
| `--ds-field-changed-color` | `--ds-primary` | the dot after the label of a `.ds-field--changed` (keep 3:1 on the surface) |
| `--ds-form-rows-control-max` | 480px | the widest control in `.ds-form--rows` |
| `--ds-check-list-max-height` | 264px | `.ds-check-list` scrolls on its own beyond it (`none`: every row shows) |
| `--ds-form-actions-bleed` | `--ds-content-pad-x` (in a `.ds-card`: `--ds-card-pad`) | how far a `.ds-form-actions--sticky` bar bleeds on a phone: set it on a padded container of the page's own to its inline padding (it inherits) |
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
| `--ds-page-head-top` | 0px | where a sticky page head (`.ds-page-head--sticky`) stops below the top of its scroller (the height of a bar that sticks above it) |
| `--ds-page-head-bg` | `--ds-backdrop` | the ground under a sticky page head, so the content scrolls away under it |
| `--ds-breadcrumbs-item-max` | 240px | a breadcrumb item before its ellipsis |
| `--ds-breadcrumbs-font` | the size's role, `--ds-font-label` | the type of the breadcrumbs |
| `--ds-auth-width` | 400px | the card of `.ds-auth` |
| `--ds-drawer-item-height` | 48px | drawer item at size md and comfortable (8px per size step, 4px per density step; its rest radius is half of what it computes to, so the press morph runs its whole way) |
| `--ds-topbar-scrolled-bg` | `--ds-surface-high` | top bar while the view is scrolled (`data-scrolled`); `transparent` keeps a flat bar |
| `--ds-view-scrollbar-gutter` | `stable` | the view's scrollbar gutter: `stable both-edges` (symmetric) or `auto` (no reserved room) |
| `--ds-segmented-padding-x` | `--ds-space-4` | the inline padding of a segmented option (narrow switches) |
| `--ds-topbar-search-max` | 720px | the widest `.ds-topbar__search` |
| `--ds-account-text-max` | 240px | the name and email beside the avatar in `.ds-account--capsule` |
| `--ds-account-menu-width` | 280px | the account menu (`.ds-account__menu`), at most the window less `--ds-space-2` on each side |
| `--ds-launcher-columns` | 3 | the apps in a row of the launcher (`.ds-launcher`) |
| `--ds-launcher-app-width` | 96px | one column of the launcher: its width is the columns times this, at most the window's |
| `--ds-launcher-app-height` | 88px | a launcher app at size md and comfortable (8px per size step, 4px per density step) |
| `--ds-launcher-icon-size` | 40px | the disc of a launcher app's icon at size md (8px per size step) |
| `--ds-launcher-font` | the size's role, `--ds-font-body` | a launcher app's label (always at the regular weight; the current app takes the label weight) |
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
| `--ds-steps-path-height` | 40px | a stage of `.ds-steps--path` at size md and comfortable (8px per size step, 4px per density step) |
| `--ds-toast-action-color` | `--ds-inverse-primary` | a text button in a snackbar (`.ds-toast__action`, Undo) |
| `--ds-toast-close-size` | 36px | the close button of a snackbar |
| `--ds-toast-radius` | `--ds-radius-sm` | a snackbar's radius at the default shape |
| `--ds-toast-stack-width` | 400px | a stacking snackbar region (`.ds-toasts--stack`): its width above phones |
| `--ds-savebar-offset` | `--ds-space-4` | save bar: distance from the view's bottom edge |
| `--ds-savebar-inset` | the page pad (`--ds-content-pad-x`) | save bar: distance from the view's sides (the bar is at most `--ds-content-max` wide) |
| `--ds-savebar-min-height` | 56px | save bar: the base of its least height (size md, comfortable density) |
| `--ds-savebar-radius` | `--ds-radius-card` | save bar, times `--ds-shape` |
| `--ds-savebar-bg`, `--ds-savebar-shadow` | `--ds-surface-popover`, `--ds-elev-overlay` | save bar surface and elevation |
| `--ds-savebar-bleed` | `--ds-content-pad-x` | `.ds-savebar--inline`: how far the bar runs beyond its form on both sides; set it to the inline padding of a container of the page's own |
| `--ds-savebar-room` | its least height at the largest size, `--ds-space-8`, `--ds-space-2` and the safe area | `.ds-savebar--inline`: the room its scroller and the snackbars keep clear of it; set it for a bar taller than two rows |
| `--ds-calendar-cell` | 40px | a day of the calendar at size md and the comfortable density: 8px per size step, 4px per density step on top |
| `--ds-calendar-font` | `--ds-size-font`, else `--ds-font-body` | the type of the days |
| `--ds-calendar-today` | `--ds-primary` | the ring and ink of today |
| `--ds-calendar-selected-bg` | `--ds-primary` | the fill of the chosen day and of the ends of a range |
| `--ds-calendar-selected-color` | `--ds-on-primary` | the ink on that fill |
| `--ds-calendar-range-bg` | `--ds-accent` | the band of a range (its preview mixes it at `--ds-state-pressed`) |
| `--ds-loadmore-padding` | `--ds-space-4` | the block padding of `.ds-loadmore` (and the side padding of `--inline`) at the comfortable density; 2px per density step |
| `--ds-loadmore-error-color` | `--ds-error` | the status of a load that failed (with the alert icon and the words) |
| `--ds-popover-width` | 360px | the widest a popover gets (it is as wide as its content up to this) |
| `--ds-popover-tip-width` | 320px | the widest a `.ds-popover--tip` help card gets |
| `--ds-popover-padding` | `--ds-space-4` | the padding of a popover's parts at the comfortable density |
| `--ds-popover-tip-padding` | `--ds-space-3` | the padding of a `.ds-popover--tip` help card's parts at the comfortable density |
| `--ds-popover-radius` | `--ds-radius-md` | the popover's radius at the default shape |
| `--ds-splitpane-size` | 50% | split pane: the start size of a pane, any length or a percentage of the split pane (on the pane; registered, does not inherit; DS.splitpane writes it as the pane moves) |
| `--ds-splitpane-min` | 0px | split pane: the smallest size of a pane (on the pane; registered, does not inherit) |
| `--ds-splitpane-max` | 100% | split pane: the largest size of a pane (on the pane; registered, does not inherit) |
| `--ds-splitpane-height` | 100% | split pane: its height (a length where the parent grows with its content) |
| `--ds-splitpane-line` | `--ds-line` | split pane: the divider's hairline |
| `--ds-splitpane-grip` | `--ds-outline` | split pane: the grip on the divider |
| `--ds-splitpane-hit` | 12px | split pane: the width of the divider's hit area, over both panes' edges (`.ds-touch`: at least half the touch target) |
| `--ds-splitpane-radius` | `--ds-radius-card` | `.ds-splitpane--outlined`: the frame's radius, times `--ds-shape` |
| `--ds-splitpane-padding` | `--ds-space-4` | `.ds-splitpane__body`: the padding, 2px less per density step |
| `--ds-upload-tile` | 144px | `.ds-upload__grid`: a preview tile's least width at md (16px per size step, never under 96px) |
| `--ds-upload-radius` | `--ds-radius-card` | a preview tile of `.ds-upload__grid`, times `--ds-shape` |
| `--ds-upload-gap` | `--ds-space-3` | `.ds-upload`: the room between the zone, the error line and the files (2px per density step) |
| `--ds-kveditor-key-width` | 2fr | `.ds-kveditor`: the key's share of a row beside the value's 3fr |
| `--ds-kveditor-gap` | `--ds-space-2` | `.ds-kveditor`: the room between the rows and inside a row (2px per density step) |
| `--ds-listdetail-height` | 100% | list-detail layout: its height (a length where the parent grows with its content) |
| `--ds-listdetail-list-width` | 320px | list-detail layout: the list column beside the detail |
| `--ds-listdetail-detail-min` | 400px | list-detail layout: the narrowest the detail gets beside another column; the list and the detail fold to one column below the list's width plus this |
| `--ds-listdetail-sub-width` | 360px | list-detail layout: the sub-detail column beside the detail |
| `--ds-listdetail-line` | `--ds-line` | list-detail layout: the hairlines between the columns and under a head |
| `--ds-listdetail-radius` | `--ds-radius-card` | `.ds-listdetail--outlined`: the frame's radius, times `--ds-shape` |
| `--ds-listdetail-head-height` | 56px | `.ds-listdetail__head` at the comfortable density, 4px less per step (`.ds-touch`: at least the touch target) |
| `--ds-listdetail-padding` | `--ds-space-4` | `.ds-listdetail__head` (its sides) and `.ds-listdetail__body`: the padding, 2px less per density step |
| `--ds-sort-field-width` | 160px | the least width of the field select of an inline sort control |
| `--ds-clamp-lines` | `2` | the number of lines `.ds-clamp` shows before its ellipsis |
| `--ds-toggletip-size` | 24px | the info button at size md (an icon-only control: it steps with size only) |
| `--ds-dashpanel-padding` | `--ds-space-4` | dashboard panel: the padding, 2px less per density step |
| `--ds-dashpanel-radius` | `--ds-radius-card` | dashboard panel: the corners, times `--ds-shape` |
| `--ds-dashpanel-bg` | `--ds-surface` | dashboard panel: the fill |
| `--ds-dashpanel-border` | `--ds-line` | dashboard panel: the hairline |
| `--ds-dashpanel-filled-bg` | `--ds-surface-low` | `.ds-dashpanel--filled`: the fill |
| `--ds-dashpanel-shadow` | `--ds-elev-1` | `.ds-dashpanel--elevated`: the elevation |
| `--ds-dashpanel-head-height` | 56px | `.ds-dashpanel__head` at the comfortable density, 4px less per step (`.ds-touch`: at least the touch target) |
| `--ds-dashpanel-body-min` | 160px | `.ds-dashpanel__body`: the smallest height, so a state that replaces the content keeps its place |
| `--ds-filterbar-gap` | `--ds-space-3` | the gaps of a filter bar at size md and the comfortable density: 4px per size step, 2px per density step |
| `--ds-filterbar-search-min` | 200px | the least width of the bar's search; the filters fold when the row cannot hold it beside them |
| `--ds-filterbar-field-width` | 160px | the width of an inline filter field in the bar (full width in the sheet) |
| `--ds-filterbar-range-width` | 96px | the width of each of the two fields of a `.ds-filterbar__range` in the bar (they share the row in the sheet) |
| `--ds-picker-padding` | `--ds-space-3` | the picker popover's padding at the comfortable density (2px per density step) |
| `--ds-picker-radius` | `--ds-radius-lg` | the picker popover's radius at the default shape |
| `--ds-picker-pane-height` | 320px | the height of a scrolling pane of a picker (a list of times) |
| `--ds-picker-preset-height` | 40px | a preset row of a picker at size md and the comfortable density |
| `--ds-wizard-gap` | `--ds-space-6` | `.ds-wizard`: the room between the steps, the panel and the actions (2px per density step) |
| `--ds-wizard-panel-gap` | `--ds-space-4` | `.ds-wizard__panel`: the room between the parts of a step (2px per density step) |
| `--ds-facets-width` | 280px | the width of a facet panel beside its list (it grows to the row when it wraps) |
| `--ds-facets-main-min` | 50% | the least share of the row the list beside a facet panel keeps; the panel folds behind its Filters button when both do not fit |
| `--ds-facets-gap` | `--ds-space-6` | the gap between a facet panel and its list at size md and the comfortable density: 4px per size step, 2px per density step |
| `--ds-facet-max-height` | 264px | the height after which the options of a `.ds-facet--scroll` facet scroll |
| `--ds-sticky-offset` | `0px` | the distance of a `.ds-sticky` box from its scroller's edge (a top bar's height above a scrolling page) |
| `--ds-sticky-bg` | `--ds-surface` | the opaque fill of a `.ds-sticky` box (`--side`: none) |
| `--ds-sticky-line` | `--ds-line` | the hairline of the raised edge of a `.ds-sticky` box |
| `--ds-sticky-shadow` | `--ds-elev-1` | the shadow of the raised edge of a `.ds-sticky` box |
| `--ds-timepicker-option-height` | 40px | a row of the list of times at size md and the comfortable density |
| `--ds-print-page-width` | `210mm` | the width of the `.ds-print-page` sheet on screen (an A4 sheet) |
| `--ds-print-page-pad` | `--ds-space-10` (compact: `--ds-space-5`) | the margin of the `.ds-print-page` sheet on screen (paper keeps the browser's page margins) |
| `--ds-views-name-max` | 240px | the widest the name of the current view gets on its trigger before it ends in an ellipsis |
| `--ds-datagrid-indent` | `--ds-space-6` | the indent of one level of tree rows in a `.ds-datagrid` |
| `--ds-datagrid-group-bg` | `--ds-surface-low` | the head row of a row group in a `.ds-datagrid` |
| `--ds-link-font` | `--ds-size-font` of the size class, else `--ds-font-label` | the type of a standalone link (`.ds-link--standalone`); an inline link takes the type of its text |
| `--ds-toggle-group-gap` | `--ds-space-2` | toggle group: the gap between its toggles at the comfortable density (2px less per density step) |
| `--ds-btn-group-radius` | `--ds-radius-action` | button group: the outer corners (at most half the height, times `--ds-shape`); the inner corners are square |
| `--ds-btn-group-divider` | the buttons' border; filled or tonal: the label colour at `--ds-state-disabled` (38%) in the fill | button group: the line between two buttons |
| `--ds-copy-font` | `--ds-font-code` | copy: the type of `.ds-copy__value` |
| `--ds-copy-field-bg` | `--ds-surface-low` | copy: the fill of `.ds-copy--field`, the read-only field look |
| `--ds-priority-bar-gap` | `--ds-space-1` | priority action bar: the gap between its actions at the comfortable density (1px less per density step) |
| `--ds-priority-bar-menu-width` | 200px | priority action bar: the least width of its More menu |
| `--ds-listbox-option-height` | 40px | listbox option: the base height (size md, comfortable density) that size and density steps apply to; a least height, its text may need more |
| `--ds-listbox-max-height` | 264px | the listbox box's height before it scrolls (about six options); `none` shows every option |
| `--ds-listbox-radius` | `--ds-radius-field` | the corners of the listbox box, times `--ds-shape` |
| `--ds-number-step-size` | 32px | a number input's stepper buttons: the base (size md, comfortable density), 8px per size step and 4px per density step, never under the touch minimum |
| `--ds-tree-row-height` | 40px | a `.ds-tree` row: the base height (size md, comfortable density) that size and density steps apply to |
| `--ds-tree-padding` | `--ds-space-2` | the side padding of a tree row, 2px per density step |
| `--ds-tree-indent` | 20px | how far each level of a tree sits in, 4px per size step |
| `--ds-tree-toggle-size` | 24px | the chevron's box at the start of a folder's row (a leaf keeps its room), 4px per size step |
| `--ds-tree-radius` | `--ds-radius-sm` | the corners of a tree row (times `--ds-shape`) |
| `--ds-tree-selected-bg` | `--ds-accent` | the chosen row of a tree (`aria-selected="true"`) |
| `--ds-tree-guide` | `--ds-line` | the hairline that runs down a folder's children, below its chevron |
| `--ds-tree-drop-color` | `--ds-primary` | the line or frame that marks where a dragged item would drop |
| `--ds-choices-column-width` | 180px | choice list in columns: the least width of a column |
| `--ds-choices-columns` | 4 | choice list in columns: the most columns |
| `--ds-choices-max-height` | 264px | the scrolling choice list's height before it scrolls (about six rows) |
| `--ds-jsonview-row-height` | 32px | a `.ds-jsonview` row: the base height (size md, comfortable density) of its tree rows |
| `--ds-jsonview-indent` | 16px | how far each level of a `.ds-jsonview` sits in, 4px per size step |
| `--ds-jsonview-max-height` | none | the height past which the rows of a `.ds-jsonview` scroll inside it |
| `--ds-jsonview-radius` | `--ds-radius-card` | the corners of a `.ds-jsonview` (times `--ds-shape`) |
| `--ds-jsonview-key` | `--ds-text` | a key of a `.ds-jsonview` row |
| `--ds-jsonview-string` | `--ds-on-success-container` | a string value (in quotes) |
| `--ds-jsonview-number` | `--ds-on-info-container` | a number value |
| `--ds-jsonview-boolean` | `--ds-on-warning-container` | `true` and `false` |
| `--ds-jsonview-null` | `--ds-text-2` | `null` (in italics) |
| `--ds-jsonview-mark-bg` | `--ds-warning-container` | a search hit (`.ds-jsonview__mark`) |
| `--ds-password-meter-width` | 240px | a password's strength meter: the widest its four bars grow |
| `--ds-password-bar-height` | 4px | a password's strength meter: the height of a bar |
| `--ds-auditlog-field-width` | 10rem | the field column of a `.ds-auditlog__diff` |
| `--ds-auditlog-old-bg` | `--ds-error-container` | the old value of a change (`.ds-auditlog__old`, struck through) |
| `--ds-auditlog-new-bg` | `--ds-success-container` | the new value of a change (`.ds-auditlog__new`, underlined) |
| `--ds-auditlog-diff-radius` | `--ds-radius-sm` | the corners of a `.ds-auditlog__diff` (times `--ds-shape`) |
| `--ds-otp-cell-width` | 40px | a code field's cell: its width at size md, 8px per size step, never under the touch minimum |
| `--ds-otp-gap` | 8px | a code field: the gap between its cells, 2px less per density step |
| `--ds-otp-font` | var(--ds-font-subtitle) | a code field: the character in a cell (keep it at 16px or more: phones zoom into smaller field text) |
| `--ds-selectpanel-width` | 320px | the select panel's width (at most the viewport's less 16px) |
| `--ds-selectpanel-list-max-height` | 320px | the select panel's list before it scrolls inside the panel |
| `--ds-selectpanel-radius` | `--ds-radius-xs` | the corners of the select panel, times `--ds-shape` |
| `--ds-inlineedit-field-min` | 12rem | an inline edit: the narrowest its field gets before Save and Cancel wrap under it |
| `--ds-orderedchoice-radius` | `--ds-radius-card` | the corners of the ordered choice's box, times `--ds-shape` |
| `--ds-transfer-list-height` | 264px | the height of both lists of a transfer list |
| `--ds-search-clear-size` | 32px | a search field's clear button: the base (size md, comfortable density), 8px per size step and 4px per density step, never under the touch minimum |
| `--ds-meter-segments` | 5 | `.ds-meter--segmented`: how many equal parts |
| `--ds-meter-segment-gap` | 2px | `.ds-meter--segmented`: the gap between two parts |
| `--ds-meter-threshold` | `--ds-text` | a threshold mark across a meter or a gauge (`.ds-meter__threshold`, `.ds-gauge__threshold`) |
| `--ds-gauge-size` | 96px | `.ds-gauge`: the width and height at md, 16px per size step |
| `--ds-gauge-thickness` | 8px | `.ds-gauge`: the ring's width at md, 2px per size step |
| `--ds-gauge-color` | `--ds-chart-1` (tones: `--ds-tone`, or `--ds-chart-neutral`, `--ds-chart-warning`, `--ds-chart-error`) | `.ds-gauge`: the fill |
| `--ds-gauge-track` | `--ds-chart-track` | `.ds-gauge`: the ring behind the fill |
| `--ds-bar-gauge-height` | 12px | `.ds-bar-gauge__track` at md, 2px per size step |
| `--ds-bar-gauge-cells` | 20 | `.ds-bar-gauge__track`: how many cells |
| `--ds-bar-gauge-warning` | none (1) | `.ds-bar-gauge`: the share where the warning zone starts, set on the element with the data |
| `--ds-bar-gauge-error` | none (1) | `.ds-bar-gauge`: the share where the error zone starts, set on the element with the data |
| `--ds-bar-list-height` | 32px | a `.ds-bar-list` row at md, comfortable (8px per size step, 4px per density step) |
| `--ds-bar-list-bar` | `--ds-accent` (`--plain`: `--ds-chart-track`; a tone: its container) | the bar behind a row's label |
| `--ds-bar-list-ink` | `--ds-text` (a tone: its on-container colour) | a row's label on its bar |
| `--ds-category-bar-height` | 8px | `.ds-category-bar__track` at md (2px per size step) |
| `--ds-category-bar-gap` | 2px | the gap between two parts of a category bar |
| `--ds-lozenge-height` | 28px | a state label (`.ds-lozenge`) at md (4px per size step) |
| `--ds-lozenge-radius` | `--ds-radius-action` (never above half the height) | a state label's corners (times `--ds-shape`) |
| `--ds-result-disc-size` | 80px | a result page's disc at md (8px per size step) |
| `--ds-result-media-size` | 200px | the height of a picture in a result page (`.ds-result__media`) |
| `--ds-result-padding` | `--ds-space-12` | a result page's block padding at md, comfortable (8px per size step, 4px per density step) |
| `--ds-truncate-lines` | 2 | `.ds-truncate--lines`: how many lines before the end is cut |
| `--ds-expandable-lines` | 3 | `.ds-expandable`: how many lines show while it is closed |
| `--ds-hit-bg` | `--ds-warning-container` | a search hit (`.ds-hit`) |
| `--ds-hit-color` | `--ds-on-warning-container` | the text of a search hit |
| `--ds-tracker-height` | 32px | the row of `.ds-tracker__cells` at md (4px per size step) |
| `--ds-tracker-gap` | 2px | the gap between two cells of a tracker (1px at most in a row under 480px) |
| `--ds-label-group-gap` | `--ds-space-1` | the gap between the tags of a label group and its "+N" button |
| `--ds-image-ratio` | unset | the shape of `.ds-image__frame` (`16 / 9`); unset: the picture's own, or the modifier's |
| `--ds-image-radius` | `--ds-radius-sm` | the corners of `.ds-image__frame`, times `--ds-shape` |
| `--ds-image-bg` | `--ds-surface-high` | the tint behind a picture: while it loads, around a fitted one, under the fallback |
| `--ds-composer-radius` | `--ds-radius-2xl` | the shell of `.ds-composer`, times `--ds-shape` |
| `--ds-composer-max-height` | 220px | the tallest the composer's textarea grows before it scrolls |
| `--ds-composer-bg` | `--ds-surface-high` | the composer's fill at rest (`--ds-surface` while focus is inside) |
| `--ds-composer-chip-height` | 40px | an attachment chip of the composer at md, comfortable (8px per size step, 4px per density step) |
| `--ds-composer-chip-max-width` | 200px | the widest name of an attachment chip before its ellipsis |
| `--ds-composer-palette-width` | 320px | the command and mention palette (never wider than the window) |
| `--ds-composer-palette-radius` | `--ds-radius-xs` | the palette's corners, times `--ds-shape` |
| `--ds-composer-option-height` | 40px | a palette row at md, comfortable (8px per size step, 4px per density step) |
| `--ds-message-avatar-size` | 32px | the round avatar slot at md (8px per size step) |
| `--ds-message-gap` | `--ds-space-2` | the room between a message's head, content, note and footer (2px less per density step) |
| `--ds-message-user-bg` | `--ds-surface-high` | the bubble of the user's own message |
| `--ds-message-user-color` | `--ds-text` | the text in the user's bubble |
| `--ds-message-user-max` | 80% | the widest the user's bubble grows, of the message's width |
| `--ds-message-radius` | `--ds-radius-xl` | the user's bubble (the tool frame takes half), times `--ds-shape` |
| `--ds-message-tool-bg` | `--ds-surface-low` | the frame of a tool result |
| `--ds-transcript-max-width` | 768px | the widest the column of messages grows; it stays centred |
| `--ds-transcript-gap` | 24px | the room between messages and days (4px less per density step) |
| `--ds-transcript-pad` | `--ds-space-4` | the padding around the column of messages (2px less per density step) |
| `--ds-suggestions-gap` | `--ds-space-2` | the room between suggestion chips (2px less per density step) |
| `--ds-ailabel-height` | 24px | the label at md (4px per size step, 2px less per density step) |
| `--ds-ailabel-bg` | `--ds-primary-container` | the tonal label's fill |
| `--ds-ailabel-color` | `--ds-on-primary-container` | the tonal label's icon and word |
| `--ds-ailabel-tip-width` | 320px | the widest the explainer grows (never wider than the window) |
| `--ds-tearsheet-width` | 1200px | tearsheet: the box, never wider than the window less `--ds-space-8` on each side |
| `--ds-tearsheet-width-narrow` | 640px | `.ds-tearsheet--narrow` |
| `--ds-tearsheet-gap` | `--ds-space-12` | tearsheet: the room above the box (none at 600px and below) |
| `--ds-tearsheet-padding` | `--ds-space-6` | tearsheet: the padding of head, rail, body and foot at the comfortable density |
| `--ds-tearsheet-rail-width` | 256px | tearsheet: the step rail at the start of the main area |
| `--ds-tearsheet-radius` | `--ds-radius-dialog` | tearsheet: the box's top corners at the default shape |
| `--ds-loadingoverlay-veil` | the surface at `--ds-state-stale` | loading overlay: the veil over the region's content (`.ds-loadingoverlay--opaque`: the plain surface) |
| `--ds-loadingoverlay-radius` | `--ds-radius-card` | loading overlay: the box's radius at the default shape |
| `--ds-loadingoverlay-padding` | `--ds-space-5` | loading overlay: the box's padding at the comfortable density |
| `--ds-loadingoverlay-spinner-size` | 32px | loading overlay: the spinner in the box at md (`--ds-spinner-size` there) |
| `--ds-lightbox-bg` | `--ds-inverse` in the light scheme, `--ds-backdrop` in the dark one | lightbox: the viewer's canvas (dark in both schemes) |
| `--ds-lightbox-ink` | `--ds-on-inverse` in the light scheme, `--ds-text` in the dark one | lightbox: the viewer's text, icons and the current thumbnail's ring |
| `--ds-lightbox-thumb-size` | 56px (48px at 600px and below) | lightbox: a thumbnail in the viewer's row, at least the touch target under `.ds-touch` |
| `--ds-lightbox-item-size` | 120px | lightbox: the smallest column of the gallery (`.ds-lightbox__gallery`) |
| `--ds-lightbox-radius` | `--ds-radius-sm` | lightbox: the gallery's items and the thumbnails at the default shape |
| `--ds-bottomsheet-width` | 640px | bottom sheet: the panel at most, centred on a wider screen |
| `--ds-bottomsheet-gap` | `--ds-space-12` | bottom sheet: the room above the panel at its full height |
| `--ds-bottomsheet-radius` | `--ds-radius-dialog` | bottom sheet: the panel's top corners at the default shape |
| `--ds-code-keyword` | `--ds-primary` (the role requested: light #8430ce, dark #d7aefb) | the colour of keywords on `--ds-code-bg`; a role once the integrator moves it into tokens.css |
| `--ds-code-string` | `--ds-success` (the role requested: light #146c2e, dark #81c995) | the colour of strings and regular expressions on `--ds-code-bg`; a role once the integrator moves it into tokens.css |
| `--ds-code-number` | `--ds-warning` (the role requested: light #9c4300, dark #ffb683) | the colour of numbers and constants (`true`, `null`, a hex colour) on `--ds-code-bg`; a role once the integrator moves it into tokens.css |
| `--ds-code-comment` | `--ds-text-2` (the role requested: light #5f6368, dark #9aa0a6) | the colour of comments on `--ds-code-bg`; a role once the integrator moves it into tokens.css |
| `--ds-code-function` | `--ds-info` (the role requested: light #0b57d0, dark #a8c7fa) | the colour of calls, definitions, a command, a tag name on `--ds-code-bg`; a role once the integrator moves it into tokens.css |
| `--ds-code-type` | `--ds-on-info-container` (the role requested: light #00696b, dark #5cd5d5) | the colour of classes, built-in types, a CSS class or id selector on `--ds-code-bg`; a role once the integrator moves it into tokens.css |
| `--ds-code-property` | `--ds-on-error-container` (the role requested: light #a3195b, dark #ffb0cd) | the colour of keys, CSS properties, attributes, options, variables on `--ds-code-bg`; a role once the integrator moves it into tokens.css |
| `--ds-code-meta` | `--ds-text-2` (the role requested: light #4c5a92, dark #bac3ff) | the colour of decorators, a doctype, a shell prompt, diff headers on `--ds-code-bg`; a role once the integrator moves it into tokens.css |
| `--ds-code-inserted` | `--ds-success` (the role requested: light #146c2e, dark #6dd58c) | the colour of the `+` lines of a diff (a code block tints them with it) on `--ds-code-bg`; a role once the integrator moves it into tokens.css |
| `--ds-code-deleted` | `--ds-error` (the role requested: light #b3261e, dark #f2b8b5) | the colour of the `-` lines of a diff (a code block tints them with it) on `--ds-code-bg`; a role once the integrator moves it into tokens.css |
| `--ds-code-block-radius` | `--ds-radius-card` | `.ds-code-block`, a `pre` in prose and the `.ds-code` frame (times `--ds-shape`) |
| `--ds-toc-height` | 32px | a link of the column at size md and comfortable (8px per size step, 4px per density step) |
| `--ds-toc-bar-height` | 48px | a link of `.ds-toc--bar` at size md and comfortable, as high as a tab |
| `--ds-toc-padding-x` | `--ds-space-3` | a link's side padding at size md (4px per size step; a bar's link `--ds-space-1` more) |
| `--ds-toc-font` | the size's role, `--ds-font-label` | the type of a link (always at the regular weight; the current one takes the label weight) |
| `--ds-toc-indicator-width`, `--ds-toc-indicator-color` | 3px, `--ds-primary` | the bar of the current link: on the column's line, under the link in a bar |
| `--ds-toc-top` | `--ds-space-4` | where a sticky column stops below the top of its scroller |
| `--ds-toc-bg` | `--ds-backdrop` | the ground under a sticky bar, so the content scrolls away under it |
| `--ds-backtop-offset` | `--ds-space-6` | the room between the back-to-top button and the bottom and end edges of its scroller or the window |
| `--ds-diff-bg` | `--ds-code-bg` | the ground of a file's lines and of the source before the script runs |
| `--ds-diff-add-bg` | `--ds-success-container` mixed 45% into the ground | an added line |
| `--ds-diff-del-bg` | `--ds-error-container` mixed 45% into the ground | a removed line |
| `--ds-diff-add-word` | `--ds-success-container` with 16% of `--ds-on-success-container` | a word that changed in an added line |
| `--ds-diff-del-word` | `--ds-error-container` with 16% of `--ds-on-error-container` | a word that changed in a removed line |
| `--ds-diff-hunk-bg` | `--ds-info-container` mixed 45% into the ground | a hunk header row (`@@ -1,5 +1,6 @@`) |
| `--ds-diff-radius` | `--ds-radius-card` | a file block's corners at the default shape |
| `--ds-diff-font` | `--ds-font-code` | the lines and the file names |
| `--ds-diff-sticky-top` | 0px | where a file header sticks: the height of a fixed bar above the view |
| `--ds-diff-split-min` | 720px | the width of the view from which `data-ds-diff-view` `auto` shows the split view (px, rem or em) |
| `--ds-logview-height` | 400px | log viewer: the height of the view (the bar and the lines) |
| `--ds-logview-bg` | `--ds-code-bg` | log viewer: the ground of the lines |
| `--ds-logview-radius` | `--ds-radius-card` | log viewer: the frame's corners at the default shape |
| `--ds-logview-font` | `--ds-font-code` | log viewer: the lines |
| `--ds-logview-error-bg` | `--ds-error-container` at 45% | log viewer: a fatal or error line (and the lines that continue it) |
| `--ds-logview-warn-bg` | `--ds-warning-container` at 45% | log viewer: a warning line |
| `--ds-logview-match` | `--ds-warning-container` | log viewer: a search match |
| `--ds-logview-match-current` | `--ds-warning` | log viewer: the current search match |
| `--ds-logview-black` | `--ds-text-2` | log viewer: ANSI black (30, 90; a background at 20%) |
| `--ds-logview-red` | `--ds-error` | log viewer: ANSI red (31, 91) |
| `--ds-logview-green` | `--ds-success` | log viewer: ANSI green (32, 92) |
| `--ds-logview-yellow` | `--ds-warning` | log viewer: ANSI yellow (33, 93) |
| `--ds-logview-blue` | `--ds-primary` | log viewer: ANSI blue (34, 94) |
| `--ds-logview-magenta` | `--ds-error` and `--ds-primary` half and half | log viewer: ANSI magenta (35, 95) |
| `--ds-logview-cyan` | `--ds-info` and `--ds-success` half and half | log viewer: ANSI cyan (36, 96) |
| `--ds-logview-white` | `--ds-text` | log viewer: ANSI white (37, 97) |
| `--ds-object-gap` | `--ds-space-5` | the room between the parts of an object page (the head, the bar of anchors, the sections) |
| `--ds-terminal-height` | 360px | terminal frame: the height of the screen (not with `--fill`) |
| `--ds-terminal-bg` | `--ds-code-bg` | terminal frame: the ground of the screen, and the emulator's background (`DS.terminal.theme`) |
| `--ds-terminal-fg` | `--ds-text` | terminal frame: the text of the screen, and the emulator's foreground |
| `--ds-terminal-cursor` | `--ds-primary` | terminal frame: the caret and the emulator's cursor |
| `--ds-terminal-selection` | `--ds-primary-container` | terminal frame: selected text on the screen |
| `--ds-terminal-radius` | `--ds-radius-card` | terminal frame: the frame's corners at the default shape |
| `--ds-terminal-font` | `--ds-font-code` | terminal frame: the title and plain output on the screen |
| `--ds-terminal-black` | `--ds-text-2` | terminal frame: ANSI black (and bright black) |
| `--ds-terminal-red` | `--ds-error` | terminal frame: ANSI red |
| `--ds-terminal-green` | `--ds-success` | terminal frame: ANSI green |
| `--ds-terminal-yellow` | `--ds-warning` | terminal frame: ANSI yellow |
| `--ds-terminal-blue` | `--ds-primary` | terminal frame: ANSI blue |
| `--ds-terminal-magenta` | `--ds-error` and `--ds-primary` half and half | terminal frame: ANSI magenta |
| `--ds-terminal-cyan` | `--ds-info` and `--ds-success` half and half | terminal frame: ANSI cyan |
| `--ds-terminal-white` | `--ds-text` | terminal frame: ANSI white |
| `--ds-shimmer-glint` | a `light-dark()` of `--ds-surface` and `--ds-on-primary-container` (requested as a colour role: white in light and dark, the text in the contrast theme) | `.ds-shimmer`: the colour of the wave, the copy of the text on top |
| `--ds-shimmer-peak` | `color-mix(in srgb, var(--ds-text) 55%, transparent)` (requested as a colour role) | `.ds-shimmer`: the mask at the crest of the band; only its alpha counts (the glint's strength) |
| `--ds-shimmer-length` | 480px | `.ds-shimmer`: one tile of the wave, the band and the pause after it; it travels one length per `--ds-loop-shimmer` |
| `--ds-wheel-fade` | `--ds-space-3` | `.ds-wheel`: the soft edge above and below the slot, given back by a negative margin |
| `--ds-wheel-travel` | 100% | `.ds-wheel`: how far a line glides as it goes or comes (one line, its own height) |
| `--ds-thinking-font` | `--ds-size-font`, else `--ds-font-label` | `.ds-thinking__step`: the type of the step |
| `--ds-thinking-gap` | `--ds-space-2` | `.ds-thinking`: the room between its parts, the base the density applies to (2px per step) |
| `--ds-thinking-icon-color` | `--ds-primary` | `.ds-thinking__icon` |
| `--ds-toolcall-height` | 40px | `.ds-toolcall`: the summary's base height (size md, comfortable density), handed to the disclosure row |
| `--ds-toolcall-radius` | `--ds-radius-card` | `.ds-toolcall`: the frame's corners, times `--ds-shape` |
| `--ds-toolcall-code-max-height` | 240px | `.ds-toolcall__code`: the height past which input and output scroll |
| `--ds-toolcall-code-bg` | `--ds-surface-low` | `.ds-toolcall__code`: the fill of input and output |
| `--ds-reasoning-max-height` | 320px | `.ds-reasoning__text`: the height past which the thoughts scroll |
| `--ds-reasoning-rail` | `--ds-line` | `.ds-reasoning__text`: the rail at the thoughts' start |
| `--ds-cite-size` | 18px | `.ds-cite`, `.ds-cite-list__number`: the marker's height at md (2px per size step) |
| `--ds-cite-bg` | `--ds-surface-high` | `.ds-cite`, `.ds-cite-list__number`: the marker's fill |
| `--ds-cite-card-width` | 320px | `.ds-cite__card`: its widest |
| `--ds-cite-card-radius` | `--ds-radius-card` | `.ds-cite__card`: its corners, times `--ds-shape` |
| `--ds-plan-padding` | `--ds-space-4` | `.ds-plan`: the padding at the default density (2px per density step) |
| `--ds-plan-radius` | `--ds-radius-card` | `.ds-plan`: the frame's corners, times `--ds-shape` |
| `--ds-plan-bg` | `--ds-surface` | `.ds-plan`: the fill |
| `--ds-plan-border` | `--ds-line` | `.ds-plan`: the frame |
| `--ds-question-padding` | `--ds-space-4` | `.ds-question`: the padding at the default density (2px per density step) |
| `--ds-question-radius` | `--ds-radius-card` | `.ds-question`: the frame's corners, times `--ds-shape` |
| `--ds-question-bg` | `--ds-surface` | `.ds-question`: the fill |
| `--ds-question-border` | `--ds-line` | `.ds-question`: the frame |
| `--ds-usage-gap` | `--ds-space-2` | `.ds-usage`: the room between its parts, the base the density applies to (2px per step) |
| `--ds-usage-inline-meter` | 160px | `.ds-usage--inline`: the meter's widest |
| `--ds-presence-dot-size` | 10px | a presence dot at md, 2px more or less per size step |
| `--ds-presence-ground` | `--ds-surface` | the hollow of the away, busy and offline dots: the ground they lie on |
| `--ds-presence-online` | `--ds-success` | the online dot (a filled disc) |
| `--ds-presence-away` | `--ds-warning` | the away dot (a ring, its lower half filled) |
| `--ds-presence-busy` | `--ds-error` | the busy dot (a filled disc with a bar across) |
| `--ds-presence-offline` | `--ds-outline` | the offline dot (an empty ring) |
| `--ds-avatar-size` | 32px | an avatar (and the account's avatar of the app frame) at size md, 8px more or less per size step |
| `--ds-avatar-bg`, `--ds-avatar-color` | `--ds-accent`, `--ds-on-accent` (`.ds-avatar-group__more`: `--ds-surface-high`, `--ds-text`) | an avatar without a hue: its fill and its initials or icon |
| `--ds-avatar-font` | `--ds-size-font` of the size class, else `--ds-font-label` | the initials |
| `--ds-avatar-square-radius` | `--ds-radius-sm` | `.ds-avatar--square` (at most a quarter of the side, times `--ds-shape`) |
| `--ds-avatar-edge-color` | `--ds-surface` | the edge ring between stacked avatars, around a status dot, a badge and the activity ring: the ground the avatar lies on |
| `--ds-avatar-ring-color` | `--ds-primary` (a `.ds-tone-*` class on the avatar: the tone) | the activity ring of `.ds-avatar--ring` |
| `--ds-persona-gap` | `--ds-space-3` | between a persona's avatar and its lines at md, 2px more or less per size step |
| `--ds-persona-name-font` | the size's role, `--ds-font-label` | a persona's name |
| `--ds-persona-role-font` | `--ds-font-meta` | a persona's role and status lines |
| `--ds-media-min` | 128px | the narrowest column of `.ds-media-grid` at md, 32px more or less per size step |
| `--ds-media-gap` | `--ds-space-4` | the gap of `.ds-media-grid` at the comfortable density, 4px less per density step |
| `--ds-media-radius` | `--ds-radius-card` | a media card's corners, times `--ds-shape` |
| `--ds-media-border` | `--ds-line` | a media card's edge |
| `--ds-media-bg` | `--ds-surface` | a media card's fill |
| `--ds-media-ratio` | 4 / 3 | the picture of a media card (`--square` 1 / 1, `--wide` 16 / 9) |
| `--ds-media-selected-bg` | `--ds-accent` | a selected media card's fill (its checkbox checked) |
| `--ds-levelmeter-height` | 6px | a level meter's thickness at md, 2px more or less per size step |
| `--ds-levelmeter-fill` | `--ds-primary` (a tone on `.ds-levelmeter`: `--ds-tone`; loud: `--ds-error`) | the level and the peak mark |
| `--ds-levelmeter-track` | `--ds-accent` (a tone: `--ds-tone-container`) | the empty track |
| `--ds-levelmeter-segment` | 6px | one segment of `.ds-levelmeter--segmented` (the gap is 2px) |
| `--ds-levelmeter-length` | 96px | the height of `.ds-levelmeter--vertical` |
| `--ds-command-width` | 640px | the command palette's box |
| `--ds-command-top` | min(12vh, 96px) | the room above the command palette's box |
| `--ds-command-height` | 480px | the command palette's box at most |
| `--ds-command-search-height` | 56px | the command palette's search row at md and the comfortable density |
| `--ds-command-item-height` | 48px | a command palette option at md and the comfortable density |
| `--ds-command-item-radius` | `--ds-radius-sm` | a command palette option's radius at the default shape |
| `--ds-shortcuts-column` | 240px | a column of the shortcut sheet at least |
| `--ds-notifications-icon-size` | 40px | a notification's icon disc at md |
| `--ds-notifications-item-padding` | 12px | a notification row's block padding at md and the comfortable density |
| `--ds-notifications-dot-size` | 8px | the unread dot of a notification |
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
