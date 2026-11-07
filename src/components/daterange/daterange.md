## Date range picker

A range of dates, typed into a field of two dates or chosen in a popover with presets ("Today", "Last 7 days", "This
month" ...) and two months side by side that preview the range under the pointer and the keys. A preset is a relative
range: saved as `last-7-days`, it is the last seven days tomorrow too.

```html
<span class="ds-field__label" id="period-label">Report period</span>
<div class="ds-picker" data-ds-daterange data-ds-value="last-7-days">
  <div class="ds-datefield" role="group" aria-labelledby="period-label">
    <button class="ds-btn ds-btn--quiet ds-btn--icon ds-datefield__toggle" type="button" aria-label="Choose dates">[icon calendarRange 20]</button>
  </div>
</div>
```

The field is a [date field](#date-field) of type `range`; `DS.daterange` adds the preset in force inside it, a quiet tag
that is also the field's description, and renders the popover: the presets, a [calendar](#calendar) in range mode
(two months on a wide screen, one on a phone) and a foot that says the range in words.

```html
<span class="ds-daterange__preset" id="ds-range-preset-1">Last 7 days</span>
<div class="ds-picker__popover" role="dialog" aria-modal="true" aria-label="Choose dates" hidden>
  <div class="ds-picker__panes">
    <div class="ds-picker__presets" role="group" aria-label="Presets">
      <button class="ds-picker__preset" type="button" data-preset="last-7-days" aria-current="true">Last 7 days</button> ...
    </div>
    <div class="ds-picker__pane"><div class="ds-calendar">...</div></div>
  </div>
  <div class="ds-picker__foot">
    <span class="ds-daterange__summary" aria-live="polite">Oct 29 – Nov 4, 2026</span>
    <span class="ds-picker__spacer"></span><button class="ds-btn ds-btn--text" type="button">Clear</button>
  </div>
</div>
```

At 480px or less (the window or the `ds-content` container) the tag steps aside, so the two dates fit a phone; the
preset stays the field's description and the current row of the list.

### Options

| Option | Attribute (`create()` option) | Effect |
|---|---|---|
| Value | `data-ds-value` (`value`) | `2026-11-01/2026-11-07`, or a preset |
| Presets | `data-ds-daterange-presets` (`presets`) | the keys offered, comma separated; empty for none. Default `today, yesterday, last-7-days, last-30-days, this-month, last-month, this-year` |
| Limits | `data-ds-daterange-min`, `data-ds-daterange-max` (`min`, `max`) | the first and last day of any range |
| Blocked days | `data-ds-daterange-disabled` (`disabled`) | days that cannot start or end a range, as the calendar's; typed or pasted as an end, the field is invalid |
| Week numbers | `data-ds-daterange-weeks` (`weeks`) | the calendar's column of week numbers |
| Form | `data-ds-daterange-name` (`name`) | a hidden input carries the range (`start/end`) |
| Size, density, shape, touch | the option classes | those of the field, the calendar and the popover; the tag follows the field's type |

The preset keys: `today`, `yesterday`, `last-<n>-days` (today and the n - 1 days before), `this-week`, `last-week`,
`this-month`, `last-month`, `this-year`, `last-year` (`this-*` from the period's start to today, `last-*` the whole
period before). Weeks start on the locale's first day. States are the field's (`aria-invalid`, `aria-disabled`,
`aria-readonly` on the `.ds-datefield`).

### Behaviour

- **Open**: the button, or Alt+ArrowDown in the field. Focus goes to the range's first day (else today).
- **Presets**: a click or Enter applies one at once and closes the popover.
- **Calendar**: the first pick starts the range, the pointer or the arrow keys preview it (`data-preview`), the second
  pick ends it in either order, puts it into the field and closes the popover; focus is back on the button. The foot
  says the range being chosen.
- **Typing** into the field changes the range too; no preset holds then.
- **Escape** closes without a change.
- **Events**: `ds:change` with `{ value, start, end, preset, valid }` on the root (`value` is the preset when one
  holds, else `start/end`).

### JS API

`js/daterange.js` (`DS.daterange`). `create(root, options)` returns the controller that `data-ds-daterange` makes,
once per root: `get()` (the preset in force, else `start/end`, `''` while none), `set(value)` (a range or a preset, no
event), `range()` (`{ start, end, preset }`, a preset resolved today), `open()`, `close()`, `on(type, fn)` and
`destroy()`. `resolve(preset, { today, locale, firstDay })` returns the `{ start, end }` a preset stands for (`null`
for none), `presetLabel(preset, { locale })` its name ("Last 7 days" through the string `lastSpan` and
`Intl.NumberFormat`, the others through `Intl.RelativeTimeFormat`).

### Accessibility

The button is named "Choose dates" (the string `chooseDates`); the presets are a group named "Presets" (`presets`),
the one in force `aria-current="true"` with the tint and the label weight. The summary is a polite live region, so the
range being chosen is heard. In the calendar the range is `aria-selected` on its days and the grid
`aria-multiselectable`.

### Forced colours

The tag keeps a `CanvasText` border; the preset in force is `SelectedItem`; the calendar's band and preview are its own.

### Motion

The popover's and the calendar's; the band and its preview change colour over `--ds-dur-fast`.

<!-- changelog -->
- Date range picker (3.0): `DS.daterange` (`create`, `resolve`, `presetLabel`), a field of two dates and a popover with
  presets, relative ranges that resolve against today and two months with a hover preview.
