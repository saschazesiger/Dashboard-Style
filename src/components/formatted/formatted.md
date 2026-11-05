## Formatted values and relative time

Figures and times in the page's locale, through `Intl`: a number, a count in short form, a percentage, an amount of
money, a size in bytes, a length of time, and a time relative to now that keeps itself current. Where the text rounds
the value, the exact value shows in a tooltip.

```html
<span data-ds-format="bytes" data-ds-value="1536"></span>                         <!-- 1.5 kB (tip: 1,536 bytes) -->
<span data-ds-format="compact">1284902</span>                                     <!-- 1.3M (tip: 1,284,902) -->
<span data-ds-format="currency" data-ds-format-currency="EUR">1234.5</span>       <!-- €1,234.50 -->
<span data-ds-format="percent" data-ds-format-signed>0.042</span>                 <!-- +4.2% -->
<span data-ds-format="duration" data-ds-format-style="clock">3725000</span>       <!-- 1:02:05 -->
<span data-ds-format="number" data-ds-format-digits="1">1234.56</span>            <!-- 1,234.6 -->

<time data-ds-time datetime="2026-11-04T09:00:00Z">Nov 4, 09:00</time>          <!-- 3 minutes ago (tip: Nov 4, 2026, 9:00 AM) -->
```

**The raw value** is `data-ds-value`, else the element's own text when the behaviour starts, so a page that renders
the raw figure on the server keeps working without script. A re-render with `DS.dom.morphHtml` that writes a new
raw figure (in the text or `data-ds-value`) is formatted before paint. `DS.init()` finds both attributes.

| Attribute | Values | What |
|---|---|---|
| `data-ds-format` | `number` (default), `compact`, `percent`, `currency`, `bytes`, `duration` | the kind; a percentage is a share (0.42 is 42%), a duration is in ms |
| `data-ds-value` | a number | the raw value; without it, the text |
| `data-ds-format-currency` | an ISO 4217 code | the currency (default `USD`) |
| `data-ds-format-digits` | 0 ... 20 | the most fraction digits |
| `data-ds-format-base` | `1024` | binary sizes (KiB, MiB) for `bytes` |
| `data-ds-format-style` | `short`, `long`, `narrow`, `clock`; `long` | a duration's style; a compact count's (`1.3 million`) |
| `data-ds-format-signed` | (present) | a sign on gains too: deltas |
| `data-ds-format-tip` | `off` | no tooltip with the exact value |

**Relative time** is `data-ds-time` of the core ([core.md](core.md#relative-time-data-ds-time)): the date comes from
`data-ds-time`, else `datetime`; the text ("3 minutes ago", "yesterday") ticks on one shared clock for the whole page,
which waits as long as the soonest change allows and sleeps while the page is hidden; the absolute date goes into the
tooltip. Its options are `data-ds-time-style`, `-numeric`, `-smallest`, `-largest` and `-tip="off"`.

The locale is `DS.config({ locale })`'s, else the `lang` of `<html>`; a new locale rewrites every value and time at
once. A value or time with a tooltip of its own (`data-tip` written by the page) keeps it.

`.ds-value--plain` drops the dotted underline that marks a value with a tip (a column full of them); the tip still
shows. Both take tabular figures and never break inside.

### JS API

- `DS.formatted.create(el, options)`: the controller the attribute path makes, with `options` (`kind`, `value`,
  `currency`, `digits`, `base`, `style`, `signed`, `tip`, `locale`) before the attributes. `get()` gives
  `{ value, text }`, `set(value)` writes a new raw value (and `data-ds-value`, when the element has it) and emits
  `ds:change`, `on('change', fn)`, `update()`, `destroy()`.
- `DS.formatted.text(value, options)`: the text alone (`''` for what is no number).
- `DS.formatted.exact(value, options)`: the exact value of the tip, or `''` where the text is exact already.
- Relative time: `DS.format.time(el, options)` and `DS.format.relative(value, options)` ([core.md](core.md)).

### Options

None read: a value takes the type of where it stands, and never a tone. Its meaning is in its words or its column.

### Accessibility

The text is read. The exact value or the absolute date is the tooltip's description, shown on hover and on keyboard
focus; where it matters to a keyboard user (a single figure in a page head), give the element `tabindex="0"`. A table
full of times needs no stops: the column head says what they are.

### Forced colours

The dotted underline takes the text colour.

**Motion:** none. A figure that should count to its new value goes through `DS.motion.countUp()` with
`format: (v) => DS.formatted.text(v, options)` instead.

<!-- changelog -->
- Formatted value (new, `formatted`): `data-ds-format` (`number`, `compact`, `percent`, `currency`, `bytes`,
  `duration`) with `data-ds-value` and `data-ds-format-*` options, the exact value in a tooltip; `DS.formatted.create`,
  `text`, `exact`; `.ds-value--plain`. Relative time (`data-ds-time` of the core) documented beside it, with its
  dotted underline and tabular figures.
