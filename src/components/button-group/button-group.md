## Button group

Related actions or toggles joined into one pill outline: zoom out, fit, zoom in; the views of a list; the two targets of
a [split button](#split-button).

```html
<div class="ds-btn-group" role="group" aria-label="Zoom">
  <button class="ds-btn" type="button">[icon minimize 16]Out</button>
  <button class="ds-btn" type="button">Fit</button>
  <button class="ds-btn" type="button">[icon plus 16]In</button>
</div>

<div class="ds-btn-group" role="group" aria-label="Device">                         <!-- icon buttons -->
  <button class="ds-btn ds-btn--icon" type="button" aria-label="Restart" data-tip="Restart">[icon refresh 20]</button>
  <button class="ds-btn ds-btn--icon" type="button" aria-label="Lock" data-tip="Lock">[icon lock 20]</button>
  <button class="ds-btn ds-btn--icon" type="button" aria-label="Locate" data-tip="Locate">[icon mapPin 20]</button>
</div>

<div class="ds-btn-group ds-btn-group--block" role="group" aria-label="Period">     <!-- the whole line, a phone -->
  <button class="ds-btn ds-btn--tonal" type="button"><span class="ds-btn__label">Day</span></button>
  <button class="ds-btn ds-btn--tonal" type="button"><span class="ds-btn__label">Week</span></button>
  <button class="ds-btn ds-btn--tonal" type="button"><span class="ds-btn__label">Month</span></button>
</div>
```

The first and the last button make the ends of the pill (`--ds-btn-group-radius`, at most half the height, times
`--ds-shape`, D11); the inner corners are square and neighbours share one border line. In a `--filled` or `--tonal` group
a hairline in the label colour (`--ds-state-disabled`, 38%, into the fill) parts the buttons. Another element inside
the group (the menu of a split button) does not count as an end. Toggles: put `.ds-btn-group` on a [toggle group](#toggle-button-and-toggle-group)
(`data-ds-toggle-group`): the button that is on takes the tint inside the group's outline (an outlined toggle keeps the line colour, so the
pill stays one line all round) and its border lies over its neighbours'.

### Options

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Look | `.ds-btn`, `--filled`, `--tonal` on every button | the buttons | one look per group: outlined (default), filled or tonal; icon buttons (`--icon`) or labelled ones |
| Full width | `.ds-btn-group--block` | the group | fills its line, the buttons share it equally; a label in `.ds-btn__label` ends in an ellipsis when the line is too narrow; icon buttons keep their size |
| Size | `.ds-xs` ... `.ds-xl` | the group or any ancestor | the buttons' height, padding and type; the pill of the ends follows the height |
| Density | `.ds-density-*` | any container | the buttons' height (4px per step) |
| Shape | `.ds-shape-*` | any container or the theme | the outer corners and their press times `--ds-shape`: square, soft, the pill, round |
| Touch | `.ds-touch` | the theme or a container | every button at least `--ds-touch-target` high |

No tone: a group of actions has no status.

### Accessibility

- A `role="group"` with an `aria-label` that names what the buttons share ("Zoom"). Every button is a tab stop of its
  own (a toolbar of many controls is a [priority action bar](#priority-action-bar) or a toggle group in a
  `role="toolbar"`, one tab stop). Icon buttons need `aria-label` and a `data-tip` with the same words.
- Focus: the ring of the focused button lies over its neighbours (`--ds-z-pinned`); a hovered, pressed or pressed-on
  button raises its border (`--ds-z-raised`).
- Forced colours: the system button colours; the shared lines stay `ButtonBorder`, a toggle that is on `Highlight` /
  `HighlightText` ([Button](#button)).

### Hooks

`--ds-btn-group-radius` (the outer corners), `--ds-btn-group-divider` (the line between two buttons). The buttons read
the button hooks; the group computes the pill of its ends from `--ds-btn-height`, `--ds-btn-height-exact` and
`--ds-btn-icon-size` with the button's formula.

**Motion:** the press morphs the outer corners of the pressed button (`--ds-btn-radius-pressed` times `--ds-shape`, in
`--ds-dur-micro`) and springs them back on `--ds-ease-spatial`; the inner corners stay square. The state layer, the
ripple and the colour fades are the buttons' own. Nothing moves.

<!-- changelog -->
- Button group (3.0): `.ds-btn-group` (one pill outline: outer corners the pill times `--ds-shape`, shared borders, a
  divider in filled and tonal groups, the press morph on the outer corners) and `.ds-btn-group--block`; hooks
  `--ds-btn-group-radius` and `--ds-btn-group-divider`.
