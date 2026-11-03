## Chips

```html
<fieldset class="ds-chips">
  <legend class="ds-sr">Status</legend>
  <label class="ds-chip">
    <input class="ds-chip__input" type="checkbox" name="status" value="active" checked>
    <span class="ds-chip__body">[icon check 18 ds-chip__check]<span>Active</span></span>
  </label>
  <label class="ds-chip">
    <input class="ds-chip__input" type="checkbox" name="status" value="stored">
    <span class="ds-chip__body">[icon check 18 ds-chip__check]<span>In storage</span></span>
  </label>
  <span class="ds-chips__divider" aria-hidden="true"></span>
  <label class="ds-chip"><input class="ds-chip__input" type="radio" name="age" value="old"><span class="ds-chip__body">[icon check 18 ds-chip__check]<span>Older than 4 years</span></span></label>
</fieldset>
```

The native input stays in the form and the tab order; a selected chip shows the tint and the check.

- Selecting opens the room of the check: an empty slot before the label grows to `--ds-chip-check-size` on
  `--ds-ease-out` (a layout size never overshoots) and the chips after it on the line follow; the check draws itself
  from its short arm. Deselecting reverses it (the check leaves first). Radio chips trade the selection at once, so a
  pair keeps its width. A chip rendered selected does not animate.
- When a toggle moves chips to another line, they glide there (FLIP) on pages that call `DS.ripple.attach(root)`;
  without it, or when a script sets `checked`, the chips jump to the new line. A script that toggles a chip and
  wants the glide dispatches the event in the same task: `input.checked = next; input.dispatchEvent(new
  Event('change', { bubbles: true }))`. During the glide the row carries
  `data-ds-glide` and every `.ds-chip` an opaque backing in the colour behind the row (`--ds-chips-backdrop`, written
  by the script; `--ds-surface` without one), so a chip that crosses another never shows it through its body.
- Press: the state layer in `--ds-dur-micro` and the ripple. Chips are not pills, so they do not morph. Keyboard
  focus: the ring, solid from the first frame, snaps to its offset, with the focus layer.
- An `aria-disabled="true"` chip input is blocked by `DS.motion.guard()`: a click on the chip never changes it (no
  page guard needed).
- Disabled chips (`disabled` on the input or its `<fieldset>`) show no hover, press or ripple and the `not-allowed` cursor, and take
  the button's disabled model: the outline (selected: the container) in `--ds-disabled-fill`, label and check in
  `--ds-disabled-ink`, fading on `--ds-dur-fast`. A theme that dims instead (`--ds-disabled-opacity`) keeps the
  chip's own colours. Forced colours: GrayText. `aria-disabled="true"` on the input looks the same and is blocked
  the same (no page guard needed); it keeps its focus layer, so a tooltip can say why.
- Hooks: `--ds-chip-height` (32px), `--ds-chip-check-size` (18px), `--ds-chip-disabled-border`,
  `--ds-chip-disabled-bg` (the container of a disabled selected chip), `--ds-chip-input-bg`, `--ds-chip-input-color`,
  `--ds-chip-input-border` (input chips), `--ds-chip-max-width` (240px, button chips).

### Action and input chips

Chips that act at once are buttons in a `role="group"` row: an active filter that removes itself (`.ds-chip--input`),
a suggestion (an action chip):

```html
<div class="ds-chips" role="group" aria-label="Active filters">
  <button class="ds-chip ds-chip--input" type="button" data-tip="Building C, second floor">
    <span class="ds-chip__body"><span class="ds-chip__label"><span class="ds-sr">Remove filter </span>Building C, second floor</span>[icon close 18 ds-chip__trailing]</span></button>
  <button class="ds-chip" type="button"><span class="ds-chip__body">[icon user 18 ds-chip__icon]<span class="ds-chip__label">Only my devices</span></span></button>
  <button class="ds-btn ds-btn--text ds-btn--sm" type="button">Clear filters</button>
</div>

<div class="ds-chips ds-chips--wrap" role="group" aria-label="Suggestions">
  <button class="ds-chip" type="button"><span class="ds-chip__body"><span class="ds-chip__label">Show the devices that were not seen this month</span></span></button>
</div>
```

- The button's own look is reset; the body carries every visual. There is no check slot: the padding is 16px, 8px next
  to a leading `.ds-chip__icon` or a trailing `.ds-chip__trailing` (both `--ds-chip-check-size`). The label ends in
  an ellipsis once the body reaches `--ds-chip-max-width` (240px): put the full text in `data-tip`.
- `.ds-chip--input` takes the tint (`--ds-chip-input-bg`, `--ds-chip-input-color`, `--ds-chip-input-border`, from
  `--ds-accent` and `--ds-on-accent`) and the whole chip removes its value; name the action for screen readers
  ("Remove filter"). Forced colours keep a real edge.
- `.ds-chips--wrap` on the row lets long labels wrap inside the chip; a one-line chip keeps the 32px height and the
  corners stay soft (`min(--ds-radius-chip, half the height)`).
- States as for filter chips: hover, the focus ring (on the chip, snapping), the press in `--ds-dur-micro` with the
  ripple, the disabled model; no morph (chips are not pills).
- A chip that stays on or off is a filter chip (a checkbox), never a button chip with `aria-pressed`.
- Removing a chip: `DS.motion.flip(row, () => chip.remove())`; the chips after it glide into its place and focus moves
  to the neighbouring chip of the same kind, the next one, else the one before it (never to "Clear filters" while a
  chip is left; 2.1). When the last chip goes, remove "Clear filters" in the same mutate and pass
  `refocus: () => searchField`. "Clear filters" moves focus to the search field. A row whose chips all went
  (`.ds-chips:empty`) takes no room.

**Motion:** the chip rows of [Controls](motion.md#controls) in motion.md.

