## Duration input

A length of time typed the way people write it ("1h 30m", "90 min", "1:30", "1.5h", "2 days 4 hours") and kept as ISO
8601 (`PT1H30M`). Once the field is left it shows the value in the locale's short form; the arrow keys step it.

```html
<span class="ds-field__label" id="timeout-label">Session timeout</span>
<input class="ds-input ds-duration" type="text" aria-labelledby="timeout-label" data-ds-duration
       data-ds-value="PT1H30M" data-ds-duration-step="15m" data-ds-duration-min="5m" data-ds-duration-max="1d">
```

The box is the text field of the [form](#form)'s `.ds-input`: its look, states, hooks and options. `DS.duration` makes it a
`spinbutton` and, with a name, adds a hidden input with the ISO value after it.

### Options

| Option | Attribute (`create()` option) | Effect |
|---|---|---|
| Value | `data-ds-value` (`value`) | text, ISO 8601 or (in JS) ms |
| Step | `data-ds-duration-step` (`step`) | what ArrowUp and ArrowDown add and take, as a duration (`15m`); default a minute; PageUp and PageDown take ten |
| Limits | `data-ds-duration-min`, `data-ds-duration-max` (`min`, `max`) | durations; outside them the field is invalid, the keys stop there, Home and End go there |
| Bare numbers | `data-ds-duration-unit` (`unit`) | what a number without a unit counts: `d`, `h`, `m` (default), `s` |
| Rounding | `data-ds-duration-smallest` (`smallest`) | the unit the value rounds to: `day`, `hour`, `minute`, `second` (default) |
| Form | `data-ds-duration-name` (`name`) | a hidden input of that name carries the ISO value |
| Size, density, shape, touch | the option classes | the text field's, computed in its own rule |

`create()` also takes `locale` (else the page's). It reads: a number with a unit each, in any order, with or without
spaces, the locale's unit words (through `Intl`: "h", "hr", "hours", "Std.", "Stunden") and the English ones (`w`,
`d`, `h`, `m`, `s`, `ms` and their words), joined by spaces, commas or the locale's "and"; a bare number after a unit
counts the next smaller one ("1h 30"); a clock (`1:30`, `1:30:15`); ISO 8601 (`P1DT2H30M`); decimals with a point or a
comma.

### Behaviour

- **Keys** (the WAI-ARIA spinbutton): ArrowUp and ArrowDown add and take a step, PageUp and PageDown ten, Home and End
  go to min and max when they are set; never below zero. Enter writes the value back.
- **Writing back**: on leaving the field, Enter or a step, the text becomes the locale's narrow form ("1h 30m", "1 Std.,
  30 Min."). Text that does not read stays as typed, and the field turns `aria-invalid`; so does a value outside min and
  max. Typing a readable value clears the error at once; the error is never set mid-word.
- **Events**: `ds:change` with `{ value, ms, text, valid }` once the value changed (`value` is ISO 8601, `''` while
  empty or unreadable).
- **Locale**: `DS.core.config({ locale })` writes the value again in the new locale's words (`ds:config`).

### JS API

`js/duration.js` (`DS.duration`). `create(el, options)` returns the controller that `data-ds-duration` makes, once per
element: `get()` (ISO 8601), `ms()`, `set(value, { emit })`, `valid()`, `update(options)`, `on(type, fn)` and
`destroy()`. `parse(text, { unit, locale })` returns the milliseconds of a text (`null` when nothing in it reads),
`iso(ms)` the ISO 8601 text (`PT0S` for zero), `format(ms, { style, smallest, locale })` the words through
`DS.format.duration` (`narrow` by default, `short`, `long`).

### Accessibility

A `spinbutton` named by its label, with `aria-valuemin` and `aria-valuemax` (seconds), `aria-valuenow` (seconds) and
`aria-valuetext` in long words ("1 hour, 30 minutes"), so a step is heard as a sentence. Give the format in a hint
under the field ("For example 1h 30m"), and the reason of an error in a `.ds-field__hint--error` with its icon.

### Forced colours

The text field's: its border, `Highlight` when focused.

<!-- changelog -->
- Duration input (3.0, tier 2): `.ds-duration` and `DS.duration` (`create`, `parse`, `iso`, `format`), a text field
  that reads "1h 30m", "90 min", "1:30" and ISO 8601 in the locale's words, steps with the arrow keys, keeps ISO 8601.
