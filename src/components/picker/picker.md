## Picker popover

The popover the date and time pickers open from their button: a small modal dialog (the WAI-ARIA date picker dialog)
that grows from the button, keeps Tab inside, and closes on Escape, a choice or a press outside. A page may use it for a
panel of its own: presets beside a pane, a foot with actions.

```html
<div class="ds-picker" data-ds-picker>
  <button class="ds-btn" type="button" data-ds-picker-toggle>Status: Any</button>
  <div class="ds-picker__popover" aria-labelledby="status-title" hidden>
    <div class="ds-picker__panes">
      <div class="ds-picker__presets" role="group" aria-labelledby="status-title">
        <p class="ds-picker__heading" id="status-title">Show devices that are</p>
        <button class="ds-picker__preset" type="button" aria-current="true">Any status<span class="ds-picker__meta">128</span></button>
        <button class="ds-picker__preset" type="button">Online<span class="ds-picker__meta">96</span></button>
        <button class="ds-picker__preset" type="button" aria-disabled="true">Retired<span class="ds-picker__meta">5</span></button>
      </div>
      <div class="ds-picker__pane">...</div>
    </div>
    <div class="ds-picker__foot">
      <button class="ds-btn ds-btn--text" type="button">Reset</button>
      <span class="ds-picker__spacer"></span>
      <button class="ds-btn ds-btn--filled" type="button">Done</button>
    </div>
  </div>
</div>
```

`DS.picker` gives the panel `role="dialog"` and `aria-modal="true"` (a panel with a role of its own keeps it), and the
button `aria-haspopup="dialog"`, `aria-controls` and `aria-expanded`.

| Part | What |
|---|---|
| `.ds-picker` | the root: the field or button and its popover; inline, `.ds-picker--block` takes the whole width |
| `.ds-picker__popover` | the panel; `hidden` while closed, `data-state` (`open`, `closed`) and `data-placement="top"` written by the system |
| `.ds-picker__panes` | panes side by side (stacked at 600px or less) |
| `.ds-picker__pane` | one pane (a calendar, a list); `.ds-picker__pane--scroll` scrolls within `--ds-picker-pane-height` |
| `.ds-picker__presets` | a column of `.ds-picker__preset` row buttons (a wrapping row at 600px or less); the one in force has `aria-current="true"`: the tint and the label weight |
| `.ds-picker__heading` | a small heading over a group |
| `.ds-picker__meta` | secondary text at a preset's end (a count, a range) |
| `.ds-picker__foot` | the actions under the panes; `.ds-picker__spacer` pushes what follows to the end |

### Options

| Option | Classes | Where it applies |
|---|---|---|
| Size | `.ds-xs` ... `.ds-xl` | a preset row 8px per step from `--ds-picker-preset-height` (40px), the type of the size; the content follows its own components |
| Density | `.ds-density-*` | a preset row 4px per step; the popover's padding 2px per step |
| Shape | `.ds-shape-*` | multiplies the popover's radius and a preset's (the pill at the default, square at `.ds-shape-square`) |
| Touch | `.ds-touch` | a preset at least `--ds-touch-target` high |
| Tone | none | |

### Behaviour

- **Open**: a click on the button (`data-ds-picker-toggle`, or `.ds-picker__toggle`), or Alt+ArrowDown in the root (a
  field around the button). Focus moves into the panel: what the picker names (the chosen day of a calendar), else
  `[autofocus]`, else the first tabbable element.
- **Inside**: Tab and Shift+Tab cycle through the panel.
- **Close**: Escape (the top layer only, after the page's own handlers) and focus is back on the button; a choice (the
  pickers close after a pick); a press outside, which leaves focus where the press put it. Through `DS.overlay`: the
  stack, the Escape order, the focus return, `ds:open` and `ds:close` (with its `reason`) on the panel, bubbling.
- **Placement**: fixed and, where the engine has popovers, in the top layer (`popover="manual"`), so no scrolling,
  clipping or transformed box cuts it off: below the root from its start edge (towards its end edge when there is no
  room), above it when it does not fit below and there is more room there (`data-placement="top"`), never taller
  than the room on its side (it scrolls inside), 8px from the window's edges. `DS.position.place()` writes its
  coordinates, `--ds-picker-x` and `--ds-picker-y` (runtime properties, never set them), and follows the button
  through scrolling and resizing while it is open.

### JS API

`js/picker.js` (`DS.picker`). `create(root, options)` returns the controller that `data-ds-picker` makes, once per root:
`get()` (true while open), `set(open)`, `open()`, `close(reason)`, `place()` (again, after the content changed size),
`on(type, fn)` (`open`, `close`) and `destroy()`. Options: `toggle`, `panel` (made when there is none), `anchor` (what
it is placed at, default the root), `label` (the panel's name when it has none), `focus()` (what takes focus on open),
`onOpen()` and `onClose(reason)`. `open(root)` and `close(root, { reason })` work on a root's controller.

### Accessibility

A modal dialog named by its label (`aria-label` or `aria-labelledby`); the button says `aria-haspopup="dialog"` and
`aria-expanded`. Presets are buttons; the one in force is `aria-current="true"` and bolder, so not by colour alone; a
preset that cannot apply is `aria-disabled="true"` and stays focusable.

### Forced colours

The popover keeps an edge (its transparent outline becomes visible); the preset in force is `SelectedItem` /
`SelectedItemText` with a `CanvasText` ring when focused; a blocked preset is `GrayText`.

### Hooks

`--ds-picker-padding`, `--ds-picker-radius`, `--ds-picker-pane-height`, `--ds-picker-preset-height`
([theming.md](theming.md#component-hooks)).

### Motion

As a menu: it fades in over `--ds-dur-fast` while its clip opens from the button's edge (`--ds-clip-from`) and it grows
from `--ds-scale-popup` at the button (`--ds-motion-origin`), both over `--ds-dur-medium` on the spring; it leaves with
a fade over `--ds-dur-instant`. Transitions keyed on `data-state`, so a picker closed mid-way turns back from where it
is; shown by hand (no `data-state`) it plays `ds-fade-in` and `ds-clip-in` once. A preset presses as every action
(`--ds-dur-micro`, the ripple, the press morph).
