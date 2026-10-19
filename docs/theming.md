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
2. **Never set motion tokens** (`--ds-dur-*`, `--ds-ease-*`, `--ds-distance-*`, `--ds-loop-*`, `--ds-stagger`,
   `--ds-delay-*`, `--ds-scale-enter`, `--ds-scale-small`). The reduced-motion switch overrides them; a theme value
   would win over it on some pages and lose on others.
3. **Keep contrast.** Text roles need 4.5:1 on the surfaces they sit on (`--ds-text-3` on white only), icons and
   outlines that carry meaning 3:1. The tint (`--ds-accent`) may be light; components never rely on it alone.
4. **px for sizes.** Type roles are `font` shorthands in px; keep `--ds-font-input` at 16px or more.
5. **One theme per page.** Put brand assets (logo, wordmark) and project components in your own files, reading the
   same tokens.

## Recipes

**Brand palette.** Usually five roles are enough; `--ds-link`, `--ds-focus` and `--ds-action-ink` follow
`--ds-primary`.

```css
.ds-theme {
  --ds-primary: #1d4e89;
  --ds-accent: #d6e4f5;
  --ds-on-accent: #0b2440;
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

**Square containers, round actions.** Zero the radius scale; actions keep `--ds-radius-action`.

```css
.ds-theme {
  --ds-radius-xs: 0; --ds-radius-sm: 0; --ds-radius-md: 0;
  --ds-radius-lg: 0; --ds-radius-xl: 0; --ds-radius-2xl: 0;
  --ds-radius-chip: 9999px;   /* chips stay pills */
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

**Embedded in someone else's page.** Put `ds-theme` on your root element instead of `<html>`, leave out `ds-base`,
and use `.ds-dialog--contained` for dialogs that should cover only your panel. Every token and rule is scoped to
`.ds-` classes, so a page without Dashboard-Style is not affected. Inside `.ds-theme` every element is
`box-sizing: border-box` (zero specificity, so your own sizing rules still win).

The host page may use Dashboard-Style itself (`<html class="ds-theme">`), possibly another version or theme. Then
both copies share their selectors, and `tokens.css` on bare `.ds-theme` would reset the host's theme to your
values. Scope what you inject to your root: rewrite `.ds-theme` to `.ds-theme.my-widget` in every stylesheet you
ship, `tokens.css` and your theme included (a build step can do it), and key any reset of your own the same way
(`.ds-theme.my-widget :where(button) { ... }`). The component rules themselves stay shared; load the same version
as the host where you can.

## Component hooks

Hooks are read by one component with a fallback. Set them on `.ds-theme` to change every instance, or on an element
(or a modifier class of your own) to change one. Where a variant sets a hook on the element itself, only an element
rule changes it: `--ds-btn-padding-start` (set before a leading icon) and `--ds-btn-quiet-color` (set by
`.ds-topbar__menu`).

| Hook | Default | Component |
|---|---|---|
| `--ds-btn-height` | 36px (`--sm`: 32px) | button |
| `--ds-btn-padding-x` | `--ds-space-4` (`--text`, `--sm`: `--ds-space-3`) | button |
| `--ds-btn-padding-start` | `= padding-x`; `--ds-space-3` before a leading icon | button |
| `--ds-btn-radius` | `--ds-radius-action` | button |
| `--ds-btn-font` | `--ds-font-label` | button |
| `--ds-btn-bg`, `--ds-btn-color`, `--ds-btn-border` | per variant | button fill, label, border colour |
| `--ds-btn-state` | `currentColor` | colour of the hover/press layer |
| `--ds-btn-state-opacity`, `--ds-btn-state-pressed-opacity` | `--ds-state-hover`, `--ds-state-pressed` | layer strength |
| `--ds-btn-hover-color`, `--ds-btn-hover-border` | the resting values | hover label and border |
| `--ds-btn-hover-shadow` | none (`--primary`: `--ds-elev-hover`) | hover elevation |
| `--ds-btn-hover-decoration` | none | e.g. `underline` for text buttons |
| `--ds-btn-icon-size` | 40px | `--icon` buttons |
| `--ds-btn-quiet-color` | `--ds-text-2` | `--quiet` label |
| `--ds-btn-disabled-bg`, `--ds-btn-disabled-border` | from `--ds-disabled-fill` | disabled container |
| `--ds-input-font` | body; input role at 600px and below | fields |
| `--ds-card-padding` | `--ds-space-6` | card padding |
| `--ds-card-padding-sm` | `--ds-space-4` | card padding at 600px and below |
| `--ds-card-padding-filled` | `--ds-space-5` | `.ds-card--filled` padding |
| `--ds-card-title-line` | 24px | line height of `.ds-card__title`; a button or switch in the header row overhangs it (set it with a type role that changes the subtitle line) |
| `--ds-tile-radius` | `--ds-radius-lg` | key-figure tile |
| `--ds-status-radius` | `--ds-radius-md` | status chip |
| `--ds-spinner-track`, `--ds-spinner-color` | `--ds-line`, `--ds-primary` | spinner |
| `--ds-dialog-width` | 400px | dialog |
| `--ds-dialog-border` | `1px solid transparent` (visible in forced colors) | dialog edge |
| `--ds-dialog-shadow` | `--ds-elev-overlay` | dialog |
| `--ds-sheet-width`, `--ds-sheet-width-wide` | 560px, 720px | side sheet |

`--ds-card-pad` is the resulting padding of each card (tables read it to bleed to the card edges); read it, do not
set it. Runtime properties (set by scripts, not themes) are documented with their components: `--ds-progress`
([progress](components.md#progress)), `--ds-toast-left`, `--ds-toast-bottom`, `--ds-toast-shift`,
`--ds-toast-shift-y`, `--ds-toast-reserve` ([snackbar](components.md#snackbar)), `--ds-i` and the indicator's
position ([motion](motion.md)), and
`--ds-drawer-icon-axis` (set by `.ds-app--drawer`, aligns the brand with the drawer icons).

## Checking a theme

Open `styleguide/index.html`, choose "Load theme file ..." and pick your CSS: every component re-renders with it.
Check text contrast with your browser's accessibility tools and look at the page with
`prefers-reduced-motion: reduce` and with forced colors emulated (DevTools, Rendering panel).
