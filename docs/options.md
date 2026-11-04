# Options

Size, density, shape, tone and touch are classes you put on a component or on any element around it
(`src/core/options.css`, part of every bundle). They nest: a class on a region applies to everything inside it, and a
class nearer the component wins. A theme sets the defaults.

```html
<section class="ds-card ds-density-dense">                 <!-- a dense region -->
  <div class="ds-card__row">
    <h2 class="ds-card__title">Devices</h2>
    <button class="ds-btn ds-sm" type="button">Refresh</button>   <!-- small, and dense: 24px -->
  </div>
</section>
<div class="ds-shape-square">…square buttons…</div>
<button class="ds-btn ds-btn--filled ds-tone-error" type="button">Delete 3 devices</button>   <!-- confirm dialogs only -->
<html class="ds-theme ds-touch">…every control at least 48px…</html>
```

Which component reads which option is in its section of [components.md](components.md) (its options table). In 3.0
the [button](components.md#button) reads all of them; the other components follow as they are ported, and keep their
2.x hooks until then.

## How it works

Each class sets only custom properties, which inherit:

| Class | Sets |
|---|---|
| `.ds-xs`, `.ds-sm`, `.ds-md`, `.ds-lg`, `.ds-xl` | `--ds-size-step` -2, -1, 0, 1, 2; `--ds-size-font` `--ds-font-caption`, `--ds-font-chip`, `--ds-font-label`, `--ds-font-subtitle`, `--ds-font-subtitle` |
| `.ds-density-comfortable`, `-compact`, `-dense`, `-tight` | `--ds-density` 0, -1, -2, -3 |
| `.ds-shape-square`, `-soft`, `-default`, `-round` | `--ds-shape` 0, .5, 1, 1.5 |
| `.ds-tone-neutral`, `-primary`, `-info`, `-success`, `-warning`, `-error` | `--ds-tone`, `--ds-on-tone`, `--ds-tone-container`, `--ds-on-tone-container` |
| `.ds-touch` | `--ds-target-min: var(--ds-touch-target)` |

The defaults (`--ds-size-step: 0`, `--ds-density: 0`, `--ds-shape: 1`, `--ds-target-min: 0px`) sit on `.ds-theme`
([tokens.md](tokens.md#options)). No role is computed from them on `.ds-theme`: a role resolves its `var()` where it
is declared, so a nested `.ds-density-dense` would change nothing. A component computes its sizes in its own rule
instead, from the values that reach it:

```css
.ds-btn {
  --_h: var(--ds-btn-height-exact, calc(var(--ds-btn-height, 40px) + var(--ds-size-step, 0) * 8px + var(--ds-density, 0) * 4px));
  --_box: max(var(--ds-target-min, 0px), var(--_h));
  --_half: calc(var(--_box) / 2);
  --_radius: min(calc(min(var(--ds-btn-radius, var(--ds-radius-action)), var(--_half)) * var(--ds-shape, 1)), var(--_half));
  min-height: var(--_box);
  border-radius: var(--_radius);
  font: var(--ds-btn-font, var(--ds-size-font, var(--ds-font-label)));
}
```

- A hook that a theme or an element sets (`--ds-btn-height: 44px`) is the base value; size and density still apply
  on top of it. An exact hook (`--ds-btn-height-exact`) fixes the value and ignores both.
- `--_h`, `--_box`, `--_radius` and the like are private (`--_<x>`): they exist only in the component's own rules,
  are never documented as an API and never set from outside.
- The option classes sit in the `ds.utilities` layer, so on one element they beat a component's own default and the
  theme defaults (a toolbar that is dense by default, given `.ds-density-comfortable`, is comfortable). An unlayered
  theme still wins on the elements it matches: when a theme sets an option (`themes/compact.css` sets the density on
  `.ds-theme`), put a region's own class on the region, not on the theme root.
- A nested `.ds-theme` starts from the defaults again, like every token.

## Size

`.ds-xs` to `.ds-xl` on a control or a group of them (`<div class="ds-toolbar ds-sm">`). Controls (button, field, chip,
select, segmented, tabs) and rows (list, table, menu item) step 8px of height per size; padding 4px. Type changes
with size only, through `--ds-size-font`: a control reads `font: var(--ds-<name>-font, var(--ds-size-font,
var(--ds-font-label)))`. The button: 24, 32, 40, 48 and 56px; an icon button the same, square.

## Density

`.ds-density-comfortable` (0, the default), `-compact` (-1), `-dense` (-2) and `-tight` (-3) on any container. Each
step takes 4px off the height of controls and rows; type stays. The button keeps its side padding (density is about
rows, not about room for the label), and an icon button keeps its size (a target with no label: make it smaller with
a size class). `themes/compact.css` is the dense density plus 13/18 UI type, and gives the default density back under
a coarse pointer.

## Shape

`--ds-shape` multiplies every radius of a component on the options model: `.ds-shape-square` (0), `-soft` (.5),
`-default` (1), `-round` (1.5), on a container or the theme. Actions follow it too (D11): the rest radius of a pill is
`min(radius, half the height)` times the shape, never above half the height, so the default keeps the pill, soft gives
rounded corners and square gives square buttons. The pressed radius (`--ds-radius-action-pressed`) is multiplied as
well and is never rounder than the rest radius, so the press morph keeps its proportion.

## Tone

`.ds-tone-neutral`, `-primary`, `-info`, `-success`, `-warning` and `-error` set four colours from the roles:

| Tone | `--ds-tone` | `--ds-on-tone` | `--ds-tone-container` | `--ds-on-tone-container` |
|---|---|---|---|---|
| neutral | `--ds-text-2` | `--ds-surface` | `--ds-surface-high` | `--ds-text` |
| primary | `--ds-primary` | `--ds-on-primary` | `--ds-primary-container` | `--ds-on-primary-container` |
| info | `--ds-info` | `--ds-on-info` | `--ds-info-container` | `--ds-on-info-container` |
| success | `--ds-success` | `--ds-on-success` | `--ds-success-container` | `--ds-on-success-container` |
| warning | `--ds-warning` | `--ds-on-warning` | `--ds-warning-container` | `--ds-on-warning-container` |
| error | `--ds-error` | `--ds-on-error` | `--ds-error-container` | `--ds-on-error-container` |

Every text pair passes AA (4.5:1) in the default palette, the dark theme and the contrast theme, and every tone ink
3:1 on the surface (tested, and checked for every generated theme). Tones apply where a component shows meaning:
badge, status, alert, banner, chip, progress, meter, and on a button only as a filled error button that confirms a
destructive action (the confirm dialog and the type-to-confirm pattern; D10). A tone always comes with an icon or a
word: status is never told by colour alone. A component reads the tone set on its own element where an inherited one
would mislead (a filled button inside an error alert stays filled).

## Touch

`.ds-touch` on `.ds-theme` or a container sets `--ds-target-min` to `--ds-touch-target` (48px). A control on the
options model takes `max(var(--ds-target-min, 0px), <its computed height>)`, so touch wins over size and density;
an icon button is as wide. The components not on the model yet take the touch target from their 2.x hooks, which
`.ds-touch` still sets ([theming.md](theming.md#touch-screens)). Touch is never automatic: opt in when a pointer is
coarse.

## Type scale

The type ramp is theme-level: the `--ds-font-*` roles and `--ds-font` are set on `.ds-theme` and resolve there, so
they do not nest. A region changes a control's type through its size class (`--ds-size-font`), never by rescaling the
roles; a theme rescales the whole ramp by setting the roles (as `themes/compact.css` does at 13/18).
