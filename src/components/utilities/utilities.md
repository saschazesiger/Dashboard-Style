## Utilities

The shared helper classes: text, the press model for an element of your own, actions on demand, keys and dividers.

| Class | Effect |
|---|---|
| `.ds-sr` | visually hidden, read by screen readers |
| `.ds-muted` | quieter body text, tabular figures (`p.ds-muted` keeps the reading measure) |
| `.ds-meta` | meta line, 12px, tabular figures; a leading 16px icon (`[icon clock 16]Synced 09:12`) sits on its text line, `--ds-space-1` before the text |
| `.ds-stale` | dims content until its replacement arrives (filter applied, request running), after `--ds-delay-loader`, so an answer within 200ms never dims; removing it is instant. Set `aria-busy="true"` on the container while it is stale |
| `.ds-num` | right-aligned tabular figures |
| `.ds-center` | centred text |
| `.ds-nowrap` | keeps a value and its unit together |
| `.ds-no-scroll` | on `<body>` while a modal layer is open (with `.ds-base`); `DS.overlay` sets it, reference-counted |
| `.ds-pressable` | the press model of the system on an element of your own (below) |
| `.ds-hover-actions` | actions that show on demand: with their row's or card's hover, focus, selection or open menu (below) |
| `.ds-kbd` | a key: `<kbd class="ds-kbd">Ctrl</kbd>` |
| `.ds-divider` | a hairline: `<hr class="ds-divider">`, `--inset`, `--vertical`, `--label` (below) |
| `.ds-icon--fillable`, `.ds-icon--filled` | an icon that fills when its control is on, or always ([icons.md](icons.md#glyphs)) |
| `.ds-touch` | every target at least `--ds-touch-target` (48px), on `.ds-theme` or a container ([theming.md](theming.md#touch-screens)) |

| Option | Applies to | Effect |
|---|---|---|
| `.ds-touch` | `.ds-pressable`, `.ds-hover-actions` | a pressable element is at least `--ds-touch-target` high; actions on demand always show |
| `.ds-shape-*` | `.ds-pressable`, `.ds-kbd` | multiplies the radius (`--ds-shape`) |
| Size, density, tone | not read | these classes have no height or meaning of their own; a pressable element's padding is the project's |

Root classes: `.ds-theme` (tokens; required), `.ds-base` (page base, optional).

`.ds-muted` has no margin (like `.ds-meta`): space it with the layout around it (a card's rhythm, a stack's gap).

Under `.ds-base`, `hidden` always hides (the page base holds it with `!important`, whatever `display` a component or
the page sets); never add a `[hidden]` rule of your own.

### A pressable element of your own

A project component that acts on a press (a row, a tile of its own) takes the system's press model instead of a
hand-built one:

```html
<div class="x-row ds-pressable" role="button" tabindex="0">Printer on floor 2</div>
<div class="x-panel ds-pressable ds-pressable--lg ds-pressable--inset" role="button" tabindex="0">...</div>
```

- A state layer in `currentColor` (hook `--ds-pressable-layer`): hover `--ds-state-hover` (`--lg`:
  `--ds-state-hover-lg`, for large surfaces), press `--ds-state-pressed` in `--ds-dur-micro`, keyboard focus
  `--ds-state-focus` at once with the ring. The ring rests at offset + width and snaps to `--ds-focus-offset`;
  `--inset` rests at 0 and snaps inward (`-1 * --ds-focus-width`), for elements in a container that clips.
- A ripple host: with `DS.ripple.attach()` the ripple brings the press. No morph: pills are `.ds-btn`.
- Disabled, `aria-disabled="true"` and `aria-busy="true"` show no hover or press layer and no ripple and take the
  `not-allowed` cursor; `aria-disabled` keeps its focus layer. Forced colours: no layer, the ring stays.
- The radius: `--ds-pressable-radius` (`--ds-radius-sm`), times `--ds-shape`. Under `.ds-touch` it is at least
  `--ds-touch-target` high. Add the role, `tabindex` and the key handling yourself (Enter and Space press it).

### Actions on demand

```html
<tr>
  <td>LAPTOP-0042</td>
  <td class="ds-num"><span class="ds-hover-actions"><button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm" type="button" aria-label="Edit LAPTOP-0042">[icon pencil 18]</button></span></td>
</tr>
```

`.ds-hover-actions` fades in on `--ds-dur-fast` while its host (the nearest `tr`, `li`, `.ds-card`,
`.ds-drawer__row` or `.ds-hover-host` around it) is hovered (devices that hover), holds the focus, is current
(`aria-current`) or selected (`aria-selected="true"`, `.ds-table__row--selected`) or carries `data-ds-shown` (set by
the page), or while the actions themselves hold an open menu (`aria-expanded="true"`) or carry `data-ds-shown`, and
fades out faster (`--ds-dur-instant`). Only the nearest host counts: in a table inside a card, hovering the card's
title or focusing its search field shows no row's actions, and hovering a row shows that row's. On touch screens (`hover: none`) and
under `.ds-touch` it always shows. It changes opacity only: the buttons stay in the tab order and are read, and
hover moves nothing. Name each button with its row ("Edit LAPTOP-0042").

### Dividers

```html
<hr class="ds-divider">
<hr class="ds-divider ds-divider--inset">
<span class="ds-divider ds-divider--vertical" role="separator" aria-orientation="vertical"></span>
<div class="ds-divider ds-divider--label" role="separator"><span>Today</span></div>
<div class="ds-divider ds-divider--label ds-divider--start" role="separator"><span>Earlier</span></div>
<div class="ds-divider ds-divider--vertical ds-divider--label" role="separator" aria-orientation="vertical"><span>or</span></div>
```

| Class | Effect |
|---|---|
| `.ds-divider` | a hairline across, in `--ds-divider-color` (`--ds-line`), with no margin: space it with the layout around it |
| `.ds-divider--inset` | starts at `--ds-space-4` (a list's text column); upright, it stops `--ds-space-2` short of the row's top and bottom |
| `.ds-divider--vertical` | upright between the items of a row (a flex or grid row: it takes the row's height, at least `1em`) |
| `.ds-divider--label` | hairlines on both sides of a caption in the meta font and `--ds-text-2` ("Today", "or") |
| `.ds-divider--start`, `.ds-divider--end` (with `--label`) | the caption near that end, after a short lead hairline (`--ds-space-4`) |
| `.ds-divider--vertical.ds-divider--label` | upright around a caption: "or" between two columns (sign in with a passkey or a password) |

- Names: a divider that separates content is `role="separator"` (an `<hr>` is one by itself); an upright one adds
  `aria-orientation="vertical"`. A purely visual one in a toolbar may be `aria-hidden="true"` instead. The caption is
  its text, read once.
- Options: `--inset` is the only spacing; size, density, shape and tone are not read (a hairline has no height or
  meaning).
- They are borders, so they stay in forced colours (`CanvasText`).

### Keys

`<kbd class="ds-kbd">K</kbd>`: a key in the code font in a hairline box (`--ds-kbd-border`, `--ds-kbd-bg`), at least
`--ds-space-5` wide. For a shortcut write each key in its own `kbd` (`<kbd class="ds-kbd">Ctrl</kbd> <kbd
class="ds-kbd">K</kbd>`).

Hooks: `--ds-pressable-radius`, `--ds-pressable-layer`, `--ds-kbd-border`, `--ds-kbd-bg`, `--ds-divider-color`
([theming.md](theming.md#component-hooks)). Forced colours: `.ds-pressable` shows no layer and keeps its ring; dividers
and keys are borders, so they stay.

**Motion:** `.ds-stale`: the "Loading bar" row of [Feedback](motion.md#feedback) in motion.md.

<!-- changelog -->
- Added: `.ds-divider--start` and `.ds-divider--end` (a caption near one end), the upright divider around a caption
  (`.ds-divider--vertical.ds-divider--label`), the upright inset divider, and the hook `--ds-divider-color`.
