## Date field

A date, a time, a date and a time, or a range of dates, typed part by part in the order, separators and hour cycle of
the page's locale (the WAI-ARIA spinbutton pattern, one spinbutton per part). It draws the box of a text field and
reads the input's hooks, so a theme that styles fields styles it too. The date, time and range pickers put their
button at its end.

```html
<span class="ds-field__label" id="due-label">Due date</span>
<div class="ds-datefield" role="group" aria-labelledby="due-label" data-ds-datefield data-ds-value="2026-11-04"></div>

<div class="ds-datefield" role="group" aria-labelledby="window-label" data-ds-datefield
     data-ds-datefield-type="datetime" data-ds-datefield-zone="local" data-ds-value="2026-11-04T22:00"></div>

<div class="ds-datefield ds-datefield--filled" role="group" aria-labelledby="loan-label" data-ds-datefield
     data-ds-datefield-type="range" data-ds-datefield-min="2026-01-01" data-ds-datefield-name="loan"></div>
```

The element holds at most a `.ds-datefield__leading` icon and the button of a picker; `DS.datefield` renders the rest:

```html
<span class="ds-datefield__input">
  <span class="ds-datefield__segment" role="spinbutton" contenteditable="true" inputmode="numeric" aria-label="month"
        aria-valuemin="1" aria-valuemax="12" aria-valuenow="11" aria-valuetext="11 – November">11</span>
  <span class="ds-datefield__literal" aria-hidden="true">/</span> ...
</span>
<span class="ds-datefield__zone" id="ds-field-1-zone" data-tip="Central European Standard Time">GMT+1</span>
<input type="hidden" name="loan" value="2026-11-02/2026-11-13">
```

A range has two `.ds-datefield__group` (`role="group"`, named by the strings `rangeStart` and `rangeEnd`) with a
`.ds-datefield__literal.ds-datefield__between` between them. An empty part shows the first letter of its name ("mm",
"dd", "yyyy") and carries `data-placeholder`.

### Options

| Option | Attribute (`create()` option) | Effect |
|---|---|---|
| Type | `data-ds-datefield-type` (`type`) | `date` (default), `time`, `datetime`, `range` |
| Value | `data-ds-value` (`value`) | ISO text of the type: `2026-11-04`, `09:30` (`09:30:15` with seconds), `2026-11-04T09:30` (a wall time), `2026-11-01/2026-11-07` |
| Limits | `data-ds-datefield-min`, `data-ds-datefield-max` (`min`, `max`) | ISO text of the type; outside them the field is invalid |
| Seconds | `data-ds-datefield-seconds` (`seconds`) | a part for the seconds |
| Hour cycle | `data-ds-datefield-hour-cycle` (`hourCycle`) | `h12` or `h23`; default the locale's |
| Zone | `data-ds-datefield-zone` (`zone`) | a datetime's zone, `local` or an IANA name (`UTC`): its offset shows at the end (`.ds-datefield__zone`), its long name is the field's description and tooltip, and `instant()` reads the wall time in it |
| Form | `data-ds-datefield-name` (`name`) | a hidden input of that name carries the value |
| Variant | `.ds-datefield--outlined` (default), `.ds-datefield--filled` | the outlined box, or the tonal fill (also inside a `.ds-field--filled`) |
| Width | `.ds-datefield--block` | the whole width of its container |
| Size | `.ds-xs` ... `.ds-xl` | 8px of height per step from `--ds-input-height` (40px), 4px of side padding per step, the type of the size |
| Density | `.ds-density-*` | 4px of height per step; type and side padding stay |
| Shape | `.ds-shape-*` | multiplies the box's radius and a part's |
| Touch | `.ds-touch` | at least `--ds-touch-target` high |

`create()` also takes `locale` (else the page's), `invalid` (the page's own verdict: `aria-invalid` holds whatever the
value, as for a range checked across two fields) and `silent` (no `ds:` events on the element; a picker around it
sends its own). On a phone (600px or less) the type is `--ds-font-input` (16px), so iOS does not zoom.

### States

- **Invalid**: outside `min` and `max`, a day the month does not have, a range that ends before it starts, or a value
  left half typed: the script sets `aria-invalid="true"` on the group and its parts, which draws the error border. Show
  the reason under the field (`.ds-field__hint.ds-field__hint--error` with its icon, linked by `aria-describedby`), so the colour is never alone.
- **Disabled**: `aria-disabled="true"` on the group: the disabled look, no part takes focus.
- **Read-only**: `aria-readonly="true"`: the read-only look; the parts take focus and are read, nothing changes.

### Behaviour

- **Keyboard** (each part): ArrowUp and ArrowDown step it, wrapping (an empty part starts from now); PageUp and PageDown
  take a bigger step (10 years, 3 months, a week, 3 hours, 15 minutes); Home and End go to its least and greatest
  value; digits type it and move on once no further digit fits (`1` waits for a second digit in a month, `4` does
  not); a separator (`/`, `.`, `-`, `:`, space) moves on; Backspace and Delete clear it, and on an empty part go back;
  ArrowLeft and ArrowRight move between parts in the writing direction. A day period takes the first letter of its
  words (`a`, `p`). A two-digit year becomes this century's (or the last one's, beyond twenty years ahead).
- **Pointer**: a press on the box outside the parts, or on the label, focuses the first empty part.
- **Paste**: a whole value (ISO text, or the digits in the field's order) fills every part.
- **Phones**: each part is `contenteditable` with `inputmode="numeric"`, so the number pad opens; the script writes
  every character itself, so nothing else can be typed.
- **Events**: `ds:change` with `{ value, valid }` on the field whenever the value changes, also to `''` while a part
  is cleared.
- **Locale**: `DS.core.config({ locale })` lays the parts out again at once (`ds:config`).

### JS API

`js/datefield.js` (`DS.datefield`). `create(el, options)` returns the controller that `data-ds-datefield` makes, once
per element: `get()` (ISO text, `''` while a part is missing), `set(value, { emit })` (no event unless `emit: true`),
`valid()`, `instant()` (the value as a `Date`: a datetime's wall time in its zone, a date's local midnight),
`focus(key)` (a part: `day`, `end.month`; else the first empty one), `update(options)`, `on(type, fn)` and `destroy()`.

| Export | What |
|---|---|
| `hourCycle(locale, wanted)` | `'h12'` or `'h23'` for a locale (`h11` and `h24` fold into them); `wanted` overrides it |
| `layout(type, locale, { hourCycle, seconds })` | the parts in the locale's order: `{ type }` per part, `{ type: 'literal', value }` between them |
| `zoneName(timeZone, { locale, at })` | `{ id, short, long }`: the offset ("GMT+1") and the long name of a zone |
| `toInstant(value, timeZone)` | the `Date` of a wall time in a zone; a time that a change of clocks skips moves forward with it |
| `typeDigit({ min, max, typed, digit, size })` | one digit typed into a part: `{ value, typed, done }` |

### Accessibility

The field is a `role="group"` named by its label (`aria-labelledby`); each part is a `spinbutton` named by its field
name from `Intl.DisplayNames` ("month", "Monat"), with `aria-valuemin`, `aria-valuemax`, `aria-valuenow` and an
`aria-valuetext` that says the month's name or "Empty" (the string `empty`). The separators are `aria-hidden`. A
range's two groups are named "Start" and "End". The zone's long name is the field's description.

### Forced colours

The box keeps its border (`CanvasText`, `Highlight` when focused); the focused part is `Highlight` / `HighlightText`; a
placeholder and a disabled field are `GrayText`.

### Hooks

The input's: `--ds-input-height`, `--ds-input-radius`, `--ds-input-padding-x`, `--ds-input-border`, `--ds-input-bg`,
`--ds-input-font`, `--ds-input-weight`, `--ds-input-focus-color` ([theming.md](theming.md#component-hooks)).

### Motion

Border, fill and ink change over `--ds-dur-fast`; the focus ring and the focused part show at once, as on every field.

<!-- changelog -->
- Date field (3.0): `.ds-datefield` and `DS.datefield`, a date, time, date-time or range typed part by part in the
  locale's order and hour cycle (`create`, `hourCycle`, `layout`, `zoneName`, `toInstant`, `typeDigit`), with min and
  max, paste, a hidden input for forms and the zone of a wall time.
