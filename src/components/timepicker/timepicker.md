## Time picker

A time of day: typed into a segmented time field or chosen from a list of times in a popover, in the hour cycle of the
page's locale (12 or 24 hours) unless the markup names one.

```html
<span class="ds-field__label" id="backup-label">Daily backup at</span>
<div class="ds-picker" data-ds-timepicker data-ds-value="02:30" data-ds-timepicker-step="30">
  <div class="ds-datefield" role="group" aria-labelledby="backup-label">
    <button class="ds-btn ds-btn--quiet ds-btn--icon ds-datefield__toggle" type="button" aria-label="Choose time">[icon clock 20]</button>
  </div>
</div>
```

The field is a [date field](#date-field) of type `time`; `DS.timepicker` renders it and the popover inside the root:

```html
<div class="ds-picker__popover ds-timepicker__popover" role="dialog" aria-modal="true" aria-label="Choose time" hidden>
  <div class="ds-picker__pane ds-picker__pane--scroll">
    <div class="ds-timepicker__list" role="listbox" tabindex="0" aria-label="Choose time" aria-activedescendant="ds-times-1-5">
      <div class="ds-timepicker__option" role="option" id="ds-times-1-5" data-value="02:30" aria-selected="true" data-active>2:30 AM</div> ...
    </div>
  </div>
</div>
```

### Options

| Option | Attribute (`create()` option) | Effect |
|---|---|---|
| Value | `data-ds-value` (`value`) | `HH:mm` (`HH:mm:ss` with seconds), 24-hour |
| Step | `data-ds-timepicker-step` (`step`) | minutes between the listed times, default 30; any minute can be typed |
| Limits | `data-ds-timepicker-min`, `data-ds-timepicker-max` (`min`, `max`) | the list starts and ends there; a typed time outside them is invalid |
| Hour cycle | `data-ds-timepicker-hour-cycle` (`hourCycle`) | `h12` or `h23`; default the locale's (the field and the list alike) |
| Seconds | `data-ds-timepicker-seconds` (`seconds`) | a part for the seconds; a time from the list has `:00` |
| Form | `data-ds-timepicker-name` (`name`) | a hidden input carries the value |
| Size | `.ds-xs` ... `.ds-xl` | the field's; a row of the list 8px per step from `--ds-timepicker-option-height` (40px), the type of the size |
| Density | `.ds-density-*` | the field's; a row 4px per step |
| Shape | `.ds-shape-*` | the field's and the popover's; multiplies a row's radius |
| Touch | `.ds-touch` | a row at least `--ds-touch-target` high |

States are the field's: `aria-invalid`, `aria-disabled` (the button too, `disabled`) and `aria-readonly` on the
`.ds-datefield`.

### Behaviour

- **Field**: the keys of the [date field](#date-field) (the arrows step the hour, the minute and the day period, `a`
  and `p` set it); Alt+ArrowDown opens the list.
- **List** (the WAI-ARIA listbox pattern, focus on the list, `aria-activedescendant` on the active option): opening
  shows the chosen time in the middle (else the one nearest to now); ArrowUp and ArrowDown move, Home and End go to the
  ends, PageUp and PageDown move an hour, digits jump to the first time that starts with them; Enter, Space or a click
  picks the time, puts it into the field and closes the popover; focus is back on the button. Escape closes without a
  change.
- **Events**: `ds:change` with `{ value, valid }` on the root, whether the time was typed or picked (the field inside
  sends none of its own).

### JS API

`js/timepicker.js` (`DS.timepicker`). `create(root, options)` returns the controller that `data-ds-timepicker` makes,
once per root: `get()`, `set(value)` (no event), `open()`, `close()`, `on(type, fn)` (`change`, `open`, `close`) and
`destroy()`. `list(el, options)` makes the list alone (the date-time picker's pane, or a page's own), with
`get()`, `set()`, `update()`, `focus()`, `reveal()` and `destroy()`, and `onSelect(value)` among its options.
`times({ step, min, max })` lists the times of a day as `HH:mm`.

### Accessibility

The popover is a modal dialog named "Choose time" (the string `chooseTime`, or the button's `aria-label`); the list a
`listbox` with the same name, each time an `option` whose text is the time in the locale's words; the chosen one is
`aria-selected="true"`. The chosen row has the tint and the label weight, so it is not told by colour alone.

### Forced colours

The chosen row is `SelectedItem` / `SelectedItemText`; the active row carries a `Highlight` ring (`CanvasText` on the
chosen one).

### Hooks

`--ds-timepicker-option-height` ([theming.md](theming.md#component-hooks)); the field's and the popover's.

### Motion

The popover's (it grows from the button). The active row's layer comes in over `--ds-dur-micro` and goes at once, so a
held arrow key leaves no trail. A row picks and closes the popover, so it takes no ripple; its layer is the feedback.

<!-- changelog -->
- Time picker (3.0): `DS.timepicker` (`create`, `list`, `times`), a segmented time field and a list of times in a
  popover, in the locale's hour cycle, with step, min, max and seconds.
