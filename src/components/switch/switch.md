## Switch

Turns one setting on or off and shows its state in more than the handle: the state word beside it, and the name.

```html
<label class="ds-switch">
  <input type="checkbox" role="switch" name="sync" checked>
  <span class="ds-switch__track" aria-hidden="true"></span>
  <span class="ds-switch__label">Nightly sync</span>
  <span class="ds-switch__state" aria-hidden="true"><span class="ds-switch__on">On</span><span class="ds-switch__off">Off</span></span>
</label>
```

**Options** ([options.md](options.md)): classes on the switch or any ancestor; the nearest wins.

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Variant | `.ds-switch--icons`, `.ds-switch--locked` | the switch | a glyph on the handle for each state; a value set elsewhere |
| Size | `.ds-xs`, `.ds-sm`, `.ds-md`, `.ds-lg`, `.ds-xl` | the switch or a group | the track 24, 28, 32, 36, 40px high (4px per step, width 13 : 8; handle, travel and icon follow), the row and the halo 8px per step, the name's type role |
| Density | `.ds-density-comfortable`, `-compact`, `-dense`, `-tight` | any container | 4px less row per step (a list row too, and 2px less padding); the track, the halo and the type stay |
| Shape | `.ds-shape-square`, `-soft`, `-default`, `-round` | any container or the theme | the radius of the track and the handle times 0, .5, 1, 1.5, at most half their height: the pill at the default; the halo stays round |
| Touch | `.ds-touch` | the theme or a container | a row and a halo of at least `--ds-touch-target` (48px) |
| State | `checked`, `disabled`, `aria-disabled="true"`, `aria-busy="true"` | the input | on and off, blocked, waiting |

With both words (`.ds-switch__on`, `.ds-switch__off`) the CSS shows the right one and crossfades them; a single word
(`<span class="ds-switch__state" aria-hidden="true">On</span>`) still works, and then the page updates it when the
switch flips (screen readers announce the switch state themselves). Toggle in place; never re-render the switch to
change it.

The handle glides and grows on the spatial spring (also when a script sets `checked`), grows to 28px (at md) while
pressed,
and a halo around it (`--ds-switch-halo`, 40px) shows hover, press and keyboard focus; the switch has no ripple.
Disabled: the neutral track (`--ds-switch-disabled-track`) and handle (`--ds-switch-disabled-handle`), no hover, halo
or grow, the `not-allowed` cursor and the quieter label. An `aria-disabled="true"` switch input is blocked by
`DS.motion.guard()` (a click on the switch or its label never flips it; no page guard needed). `.ds-switch__label` has no styles of its own; add `.ds-sr` to it when a card
title next to the switch already names the setting. A tooltip on a switch (why it is blocked) goes on its input:
`<input type="checkbox" role="switch" aria-disabled="true" data-tip="Managed by your organisation">`.

The input covers the track, so it is the hit target: put a `data-tip` on the input, not on the label or the track.
The switch row is at least `--ds-switch-height` (40px, with the size and density steps) tall. In forced colours a focused checked switch rings in
`CanvasText`.

### Blocked with a reason

`aria-disabled="true"` on the input looks like `disabled` (no hover, halo or grow, the `not-allowed` cursor, the
quieter label; forced colours `GrayText`) and acts like it (the click, Space and a label click are blocked; no page
guard needed), but the switch stays focusable with its ring and focus halo, so a tooltip can say why:

```html
<label class="ds-switch">
  <input type="checkbox" role="switch" name="backup" aria-disabled="true" data-tip="Needs an admin">
  <span class="ds-switch__track" aria-hidden="true"></span>
  <span class="ds-switch__label">Cloud backup</span>
</label>
```

### Locked

A value another system sets (a device policy, a directory): `.ds-switch--locked` with `aria-disabled="true"`, the lock
glyph as the track's last child and the reason in words:

```html
<label class="ds-switch ds-switch--locked">
  <input type="checkbox" role="switch" checked aria-disabled="true" aria-describedby="sync-why">
  <span class="ds-switch__track" aria-hidden="true">[icon lock 16 ds-switch__icon]</span>
  <span class="ds-switch__label">Nightly sync</span>
  <small class="ds-switch__hint" id="sync-why">Set by the device policy</small>
</label>
```

It keeps its on and off looks at full strength; the off handle grows to 24px so the lock fits. The lock rides the
handle (`--ds-dur-medium` on the spring), in `--ds-surface-highest` on the off handle and `--ds-primary` on the on
handle, and fades in on `--ds-dur-fast` and out on `--ds-dur-instant` when the lock comes or goes. The reason in words
is required (a hint, or the tooltip). Forced colours: the normal on and off colours, the lock in `Canvas` or
`Highlight`. "Locked" always means a value set elsewhere; a value that is waiting is busy, not locked.

### With icons

```html
<label class="ds-switch ds-switch--icons">
  <input type="checkbox" role="switch" name="sync" checked>
  <span class="ds-switch__track" aria-hidden="true">[icon close 16 ds-switch__icon ds-switch__icon--off][icon check 16 ds-switch__icon ds-switch__icon--on]</span>
  <span class="ds-switch__label">Nightly sync</span>
</label>
```

One glyph per state on the handle: both handles are 24px at md (as under a lock), the glyphs ride the handle on the
spring and crossfade (in on `--ds-dur-fast`, out on `--ds-dur-instant`). The icons repeat the state; they replace
neither the name nor the role.

### Busy

While the page waits for the answer to a change, it sets `aria-busy="true"` together with `aria-disabled="true"` on the
input, and clears both when the answer arrives (and sets `checked` back if the change failed, with a message):

```html
<label class="ds-switch">
  <input type="checkbox" role="switch" name="sync" checked aria-busy="true" aria-disabled="true">
  <span class="ds-switch__track" aria-hidden="true"><span class="ds-spinner ds-switch__spinner"></span></span>
  <span class="ds-switch__label">Nightly sync</span>
</label>
```

`DS.motion.guard()` blocks it through `aria-disabled` (click, Space, a label click), and it stays focusable, so the
focus does not get lost. On and off keep full strength, there is no hover, halo or grow, the cursor says `progress`,
and the handle (24px) holds the spinner, which shows only after `--ds-delay-loader`, so a fast answer shows nothing.
Keep the spinner in the track at all times, for every switch that can wait: hidden, it does not paint. With
`.ds-switch--icons` it replaces the glyph while busy. "Busy" means waiting; a value set elsewhere is locked.

### Hint and extras

`small.ds-switch__hint` is a line under the name (the meta type, `--ds-text-2`); `span.ds-switch__meta` holds
non-interactive extras before the state word (a count, a tag); the name wraps long words. The hint sits directly under
the name, and the two centre together on the track. Name the input with
`aria-labelledby` (the label's id) and describe it with `aria-describedby` (the hint's id), so the extras stay out of
its name.

### Switch list

Many settings, each a switch:

```html
<div class="ds-switch-list">
  <label class="ds-switch">
    <input type="checkbox" role="switch" name="mail" checked aria-labelledby="mail-name" aria-describedby="mail-hint">
    <span class="ds-switch__track" aria-hidden="true"></span>
    <span class="ds-switch__label" id="mail-name">Email reports</span>
    <small class="ds-switch__hint" id="mail-hint">Every Monday at 08:00</small>
    <span class="ds-switch__meta"><span class="ds-tag ds-tag--neutral">3 recipients</span></span>
    <span class="ds-switch__state" aria-hidden="true"><span class="ds-switch__on">On</span><span class="ds-switch__off">Off</span></span>
  </label>
  ...
</div>
```

Rows sit on one grid (track, name over hint, meta, state word), at least `--ds-switch-list-row-height` (56px) tall,
with hairlines between them. The name and its hint stand together on the switch's centre line: no gap between them,
and a row without a hint (or with a name that wraps) still centres its text on the track. At 560px of list width and
below the meta wraps under the name (under the hint when there is one).

### Keyboard, names, forced colours

- Keyboard: Tab reaches the input, Space toggles it; a blocked, busy or locked switch stays in the tab order with its
  ring and ignores Space.
- Names: a checkbox with `role="switch"`, named by its label. The track and the state word are `aria-hidden`; screen
  readers announce on and off themselves. A locked switch needs its reason (`aria-describedby`, a hint or a tooltip).
- Forced colours: `Highlight` on, `CanvasText` off, `GrayText` blocked; a locked or busy switch keeps on and off; the
  icons take the track's colour on the handle; a focused checked switch rings in `CanvasText`.
- Hooks: `--ds-switch-height`, `--ds-switch-track-height`, `--ds-switch-halo`, `--ds-switch-font`,
  `--ds-switch-disabled-track`, `--ds-switch-disabled-handle`, `--ds-switch-list-row-height`
  ([theming.md](theming.md#component-hooks)).

**Motion:** the switch rows of [Controls](motion.md#controls) in motion.md; the icons and the busy handle in the Motion
Lab.

<!-- changelog -->
- Switch: on the options model: the track, row, halo and list row compute size, density, shape and touch in their own
  rule. New: `.ds-switch--icons`, `.ds-switch__icon--on`, `.ds-switch__icon--off`; busy with `aria-busy="true"` and
  `.ds-switch__spinner`; hooks `--ds-switch-track-height`, `--ds-switch-font`.

