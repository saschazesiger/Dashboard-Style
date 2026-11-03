## Switch

```html
<label class="ds-switch">
  <input type="checkbox" role="switch" name="sync" checked>
  <span class="ds-switch__track" aria-hidden="true"></span>
  <span class="ds-switch__label">Nightly sync</span>
  <span class="ds-switch__state" aria-hidden="true"><span class="ds-switch__on">On</span><span class="ds-switch__off">Off</span></span>
</label>
```

With both words (`.ds-switch__on`, `.ds-switch__off`) the CSS shows the right one and crossfades them; a single word
(`<span class="ds-switch__state" aria-hidden="true">On</span>`) still works, and then the page updates it when the
switch flips (screen readers announce the switch state themselves). Toggle in place; never re-render the switch to
change it.

The handle glides and grows on the spatial spring (also when a script sets `checked`), grows to 28px while pressed,
and a halo around it (`--ds-switch-halo`, 40px) shows hover, press and keyboard focus; the switch has no ripple.
Disabled: the neutral track (`--ds-switch-disabled-track`) and handle (`--ds-switch-disabled-handle`), no hover, halo
or grow, the `not-allowed` cursor and the quieter label. An `aria-disabled="true"` switch input is blocked by
`DS.motion.guard()` (a click on the switch or its label never flips it; no page guard needed). `.ds-switch__label` has no styles of its own; add `.ds-sr` to it when a card
title next to the switch already names the setting. A tooltip on a switch (why it is blocked) goes on its input:
`<input type="checkbox" role="switch" aria-disabled="true" data-tip="Managed by your organisation">`.

The input covers the track, so it is the hit target: put a `data-tip` on the input, not on the label or the track.
The switch row is at least `--ds-switch-height` (40px) tall. In forced colours a focused checked switch rings in
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

**Motion:** the switch rows of [Controls](motion.md#controls) in motion.md.

