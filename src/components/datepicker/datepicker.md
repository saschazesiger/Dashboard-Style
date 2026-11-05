## Date picker

One date, or a date and a time: typed into a segmented date field, or chosen in a calendar in a popover (the WAI-ARIA
date picker dialog). With type `datetime` the field takes the time as well, the popover a list of times beside the
calendar, and the field can name the zone of its wall time.

```html
<span class="ds-field__label" id="due-label">Due date</span>
<div class="ds-picker" data-ds-datepicker data-ds-value="2026-11-07">
  <div class="ds-datefield" role="group" aria-labelledby="due-label">
    <button class="ds-btn ds-btn--quiet ds-btn--icon ds-datefield__toggle" type="button" aria-label="Choose date">[icon calendar 20]</button>
  </div>
</div>

<div class="ds-picker" data-ds-datepicker data-ds-datepicker-type="datetime" data-ds-datepicker-zone="UTC"
     data-ds-datepicker-hour-cycle="h23" data-ds-value="2026-11-07T02:30">...</div>
```

The field is a [date field](#date-field); `DS.datepicker` renders the popover inside the root: a
[calendar](#calendar), for a date and time a `.ds-datepicker__times` pane with a [list of times](#time-picker) beside
it, and a foot with "Today" (or "Now") and "Clear":

```html
<div class="ds-picker__popover" role="dialog" aria-modal="true" aria-label="Choose date" hidden>
  <div class="ds-picker__panes">
    <div class="ds-picker__pane"><div class="ds-calendar">...</div></div>
    <div class="ds-picker__pane ds-picker__pane--scroll ds-datepicker__times"><div class="ds-timepicker__list">...</div></div>
  </div>
  <div class="ds-picker__foot">
    <button class="ds-btn ds-btn--text" type="button">Today</button><span class="ds-picker__spacer"></span>
    <button class="ds-btn ds-btn--text" type="button">Clear</button>
  </div>
</div>
```

The list of times is as tall as the calendar beside it and scrolls inside; on a phone (600px or less) it goes under the
calendar.

### Options

| Option | Attribute (`create()` option) | Effect |
|---|---|---|
| Type | `data-ds-datepicker-type` (`type`) | `date` (default) or `datetime` |
| Value | `data-ds-value` (`value`) | `2026-11-04`, or `2026-11-04T09:30` (a wall time) |
| Limits | `data-ds-datepicker-min`, `data-ds-datepicker-max` (`min`, `max`) | ISO text of the type; the calendar stops there and the field is invalid outside |
| Blocked days | `data-ds-datepicker-disabled` (`disabled`) | dates, ranges and weekdays, as the calendar's (`6,7` is the weekend) |
| Week numbers | `data-ds-datepicker-weeks` (`weeks`) | the calendar's column of week numbers |
| Zone | `data-ds-datepicker-zone` (`zone`) | a date and time's zone, `local` or an IANA name: its offset at the field's end |
| Step | `data-ds-datepicker-step` (`step`) | minutes between the listed times, default 30 |
| Hour cycle | `data-ds-datepicker-hour-cycle` (`hourCycle`) | `h12` or `h23`; default the locale's |
| Form | `data-ds-datepicker-name` (`name`) | a hidden input carries the value |
| Size, density, shape, touch | the option classes | those of the field, the calendar and the popover, each computed in its own component; the date picker adds none |

`create()` also takes `locale` (else the page's). States are the field's: `aria-invalid`, `aria-disabled` (the button
too) and `aria-readonly` (the calendar shows the value, nothing changes it, the foot is hidden) on the `.ds-datefield`.

### Behaviour

- **Open**: the button, or Alt+ArrowDown in the field. Focus goes to the chosen day (else today, within min and max).
- **Calendar**: its keys (arrows a day or a week, Home and End the week's ends, PageUp and PageDown a month, with Shift
  a year); Enter, Space or a click picks the day, puts it into the field and closes the popover; focus is back on the
  button. A date and time picks the day (the popover stays, focus goes to the list) and then the time (it closes).
- **Foot**: "Today" (a date) or "Now" (a date and time) picks that at once; it is `aria-disabled` when today is
  blocked. "Clear" empties the field.
- **Escape** closes without a change.
- **Events**: `ds:change` with `{ value, valid }` on the root, whether the value was typed or picked (the field inside
  sends none of its own).

### JS API

`js/datepicker.js` (`DS.datepicker`). `create(root, options)` returns the controller that `data-ds-datepicker` makes,
once per root: `get()`, `set(value)` (no event), `instant()` (the value as a `Date`, a datetime's wall time in its
zone), `open()`, `close()`, `on(type, fn)` (`change`, `open`, `close`) and `destroy()`.

### Accessibility

The button is named "Choose date" (the string `chooseDate`, or its own `aria-label`) and says `aria-haspopup="dialog"`
and `aria-expanded`; the popover is a modal dialog with that name. "Today" and "Now" come from
`Intl.RelativeTimeFormat` in the locale, "Clear" from the string `clear`. The calendar and the field are accessible
as described in their sections.

### Forced colours

The parts' own: the field's border and focused part, the calendar's `SelectedItem` days, the list's chosen row, the
popover's edge.

### Motion

The popover grows from the button (the picker's); a turned month slides in from its side (the calendar's).

<!-- changelog -->
- Date picker (3.0): `DS.datepicker` (`create`), a date or date-time field with a calendar (and a list of times) in a
  popover: min, max, blocked days, week numbers, today, clear, the zone of a wall time, all in the locale through
  `Intl`.
