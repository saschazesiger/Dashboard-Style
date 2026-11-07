## Number input

A number, an amount or a quantity with a unit, typed in the page's locale or stepped: `DS.number` turns an input
group of [Form](#form) into a WAI-ARIA spinbutton with stepper buttons, limits, a step, and a currency or unit
written where the locale writes it.

```html
<div class="ds-field">
  <label class="ds-field__label" for="quota">Quota (GB)</label>
  <div class="ds-input-group ds-number" data-ds-number data-ds-number-min="0" data-ds-number-max="500" data-ds-number-step="5">
    <input class="ds-input" id="quota" type="text" inputmode="numeric" autocomplete="off" value="50" aria-describedby="quota-hint">
    <span class="ds-input-group__suffix" aria-hidden="true">GB</span>
    <span class="ds-input-group__trailing ds-number__steps">
      <button class="ds-btn ds-btn--quiet ds-btn--icon ds-number__step ds-number__down" type="button" tabindex="-1" aria-label="Decrease">[icon minimize 18]</button>
      <button class="ds-btn ds-btn--quiet ds-btn--icon ds-number__step ds-number__up" type="button" tabindex="-1" aria-label="Increase">[icon plus 18]</button>
    </span>
    <input type="hidden" name="quota" value="50">
  </div>
  <small class="ds-field__hint" id="quota-hint">0 to 500, in steps of 5.</small>
</div>

<!-- an amount: the symbol goes where the locale writes it -->
<div class="ds-input-group ds-number" data-ds-number data-ds-number-currency="EUR" data-ds-number-min="0">
  <span class="ds-input-group__prefix" aria-hidden="true"></span>
  <input class="ds-input" id="price" type="text" inputmode="decimal" autocomplete="off" value="19.9">
  <span class="ds-input-group__suffix" aria-hidden="true"></span>
  <input type="hidden" name="price" value="19.9">
</div>

<!-- a quantity: minus first, plus last, the figure centred -->
<div class="ds-input-group ds-number ds-number--split" data-ds-number data-ds-number-min="1" data-ds-number-max="20">
  <input class="ds-input" id="seats" type="text" inputmode="numeric" autocomplete="off" value="3">
  <button class="ds-btn ds-btn--quiet ds-btn--icon ds-number__step ds-number__down" type="button" tabindex="-1" aria-label="Fewer seats">[icon minimize 18]</button>
  <button class="ds-btn ds-btn--quiet ds-btn--icon ds-number__step ds-number__up" type="button" tabindex="-1" aria-label="More seats">[icon plus 18]</button>
</div>
```

The field is a text field (`type="text"`, `inputmode="decimal"` or `"numeric"`), not `type="number"`: only text can
show `1.234,5` in German, and the wheel never changes it. The value a form posts is the plain one of the hidden input
(`1234.5`); a plain first value goes there or into `data-ds-value` on the group, else the field's `value` is read in
the locale.

**Options** ([options.md](options.md)): the option classes on the group or any ancestor, the behaviour's options as
attributes on the group (or as `DS.number.create()`'s options).

| Option | Classes, attributes | Where it applies | Effect |
|---|---|---|---|
| Variant | `.ds-number--split` | the group | the minus at the start, the plus at the end, the figure centred (a quantity); default: both steppers at the end, in `.ds-number__steps` |
| Size | `.ds-xs` ... `.ds-xl` | the group or a form | the field 24 to 56px (8px per step); the steppers 8px less than the field |
| Density | `.ds-density-*` | any container | 4px per step, field and steppers |
| Shape | `.ds-shape-*` | any container or the theme | the field's corners; the steppers are actions (a pill at the default, square at 0) |
| Touch | `.ds-touch` | the theme or a container | field and steppers at least `--ds-touch-target` (48px) |
| Limits | `data-ds-number-min`, `-max` | the group | typed values are kept within them; Home and End go to them; a stepper is off at its end |
| Step | `data-ds-number-step` (default 1), `-page` (default ten steps) | the group | the arrows and the steppers take one step, PageUp and PageDown a page; typed values are rounded to a step the page gave, counted from the minimum (the default step moves only the keys and the steppers) |
| Format | `data-ds-number-decimals`, `-grouping="off"` | the group | fraction digits shown (default the step's, or the currency's: 2 for EUR, 0 for JPY); no thousands separators |
| Currency, unit | `data-ds-number-currency="EUR"`, `data-ds-number-unit="gigabyte"` | the group, with an empty `.ds-input-group__prefix` and `__suffix` | the symbol in the prefix or the suffix, where the locale writes it (`€` before the figure in English, after it in German); an Intl unit (`gigabyte`, `kilogram`, `percent` ...) its short form; another unit as written |

There is no tone: the field shows its state through `aria-invalid="true"` and a hint in words, as every field.

**Behaviour.** `DS.init()` finds `data-ds-number`; a change of an option attribute applies at once.

- **Typing** is free while the field has the focus. Enter and blur commit: the text is read in the locale (its digits,
  its separators, a full stop as the decimal where the locale has no other use for it, a minus sign, a unit or symbol
  typed along), kept within the limits, rounded to a given step (else to the decimals) and written back formatted (`1234.5` becomes `1,234.5`).
  Text that is no number goes back to the last value; empty text empties it.
- **Keys** (the [APG spinbutton](https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/)): ArrowUp and ArrowDown step,
  PageUp and PageDown take a page, Home and End go to the minimum and the maximum (where there are none, they move the
  caret). A step goes on from the typed text; from a value off the step grid the first step lands on it (7 with a step
  of 5: 5 or 10).
- **Steppers** step once per press and repeat while held (after `--ds-delay-tooltip`, then every `--ds-dur-instant`);
  a mouse or a pen steps on the press, a finger on its lift (or when the hold repeats), so a scroll that starts on a
  stepper changes nothing; they keep the focus where it is, so a phone's keyboard does not open, and are `disabled` at their end and while the
  field is disabled or read-only. They are out of the tab order (`tabindex="-1"`): the keys do the same from the field.
  The value they reach is announced once they stop.
- **Events**: every change dispatches `input` and `change` on the field (a page's dirty tracking hears a step as a
  typed change) and `ds:change` with `{ value, text }` on the group. A form `reset` restores the field's default value.
- **Locale**: `DS.core.config({ locale })` rewrites the figure and the affixes at once.

**JS API.** `DS.number.create(el, options)` drives a group from the page and returns the controller the attribute
path makes (`DS.core.get(el, 'number')`):

```js
const quota = DS.number.create(group, { min: 0, max: 500, step: 5, unit: 'gigabyte' });
quota.set(120);            // or a text in the locale: quota.set('1.234,5')
quota.step(-1);            // 115
quota.get();               // 115, or null when empty
quota.on('change', ({ value, text }) => save(value));
DS.number.parse('1.234,5', { locale: 'de' });   // 1234.5 (null for empty text, NaN for no number)
DS.number.format(1234.5, { decimals: 2 });      // '1,234.50'
DS.number.clamp(13, { min: 0, max: 12, step: 5 });   // 10
DS.number.symbols('de');   // { group: '.', decimal: ',', digits: ['0', ..., '9'] }
```

The controller: `get()`, `set(value)`, `step(count)`, `on('change', fn)`, `update()` and `destroy()`.
`DS.number.parse`, `DS.number.format`, `DS.number.clamp` and `DS.number.symbols` are the pure functions behind it.

**Accessibility.** The field takes `role="spinbutton"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax` and
`aria-valuetext` (`50 gigabytes`, `19.90 euros`; owned state, so `DS.dom.morphHtml` keeps them). Its `<label>` names
it; put the unit in the label too when it is no Intl unit. The steppers need a name (`aria-label`: "Fewer seats";
default the strings `decrease` and `increase`) and point at the field (`aria-controls`, written). Say the limits in the
hint ("0 to 500"): a value out of range is corrected, not refused, so tell people why it changed.

**Forced colours.** The field keeps the system edge of every input group and a `Highlight` outline while focused;
the steppers are buttons in the system colours, `GrayText` while disabled.

**Hooks:** `--ds-number-step-size` (32px: the steppers at md, comfortable; 8px per size step, 4px per density step),
and the field's hooks of [Form](#form) ([theming.md](theming.md#component-hooks)).

**Motion:** none of its own. A value changes at once, never glides; the steppers press as buttons.

<!-- changelog
- Number input (`DS.number`, `.ds-number`, `.ds-number--split`, `.ds-number__step`, `.ds-number__steps`,
  `.ds-number__down`, `.ds-number__up`, hook `--ds-number-step-size`): a spinbutton on an input group with steppers,
  min, max, step and page, locale parsing and formatting through `DS.format`, currency and unit affixes from Intl,
  a hidden input with the plain value. Strings `decrease`, `increase`.
-->
