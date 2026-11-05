## Time range

The range control of a monitoring view: a button names the range ("Last 1 hour") and opens a popover with quick
relative ranges, an absolute from and to and the ranges used recently; beside it a refresh button and an auto-refresh
interval that sends `ds:refresh`. The values are short and readable, so the range belongs in the address:
`?from=now-1h&to=now&refresh=30s`.

```html
<div class="ds-timerange" data-ds-timerange data-ds-timerange-from="now-1h" data-ds-timerange-to="now"
     data-ds-timerange-refresh="30s" data-ds-timerange-store="devices" aria-label="Time range"></div>
```

`DS.timerange` renders everything inside the element:

```html
<div class="ds-timerange" role="group" aria-label="Time range">
  <div class="ds-picker ds-timerange__range">
    <button class="ds-btn ds-timerange__trigger" type="button" aria-haspopup="dialog" aria-expanded="false">
      [icon clock 16]<span class="ds-btn__label ds-timerange__label">Last 1 hour</span>[icon chevronDown 16, .ds-timerange__chevron]
    </button>
    <div class="ds-picker__popover" role="dialog" aria-modal="true" aria-label="Time range" hidden>
      <div class="ds-picker__panes">
        <div class="ds-picker__presets ds-timerange__quick" role="group" aria-labelledby="...">
          <p class="ds-picker__heading">Quick ranges</p>
          <button class="ds-picker__preset" type="button" data-from="now-1h" data-to="now" aria-current="true">Last 1 hour</button> ...
        </div>
        <div class="ds-picker__pane ds-timerange__absolute">
          <p class="ds-picker__heading">Absolute time range</p>
          <span class="ds-timerange__field-label">From</span><div class="ds-datefield ds-datefield--block">...</div>
          <span class="ds-timerange__field-label">To</span><div class="ds-datefield ds-datefield--block">...</div>
          <p class="ds-timerange__error" role="alert"></p>
          <button class="ds-btn ds-btn--filled ds-timerange__apply" type="button">Apply</button>
          <p class="ds-picker__heading">Recently used</p>
          <div class="ds-picker__presets" role="group">...</div>
        </div>
      </div>
    </div>
  </div>
  <button class="ds-btn ds-btn--icon" type="button" aria-label="Refresh">[icon refresh 20]</button>
  <span class="ds-timerange__interval" data-on>
    <select class="ds-timerange__select" aria-label="Auto refresh"><option value="">Off</option><option value="30s">30s</option> ...</select>
    [icon chevronDown 16, .ds-timerange__chevron]
  </span>
</div>
```

### Values

| Value | Means |
|---|---|
| `now` | the moment it is read |
| `now-15m`, `now+1h` | now moved by units: `s`, `m`, `h`, `d`, `w`, `M` (months), `y` |
| `now/d`, `now-1d/d` | rounded to the start of the unit (as a "to": its end), weeks from the locale's first day; `now/d` to `now/d` is today |
| `2026-11-04`, `2026-11-04T09:00` | a wall time in the zone of the time range |
| `2026-11-04T09:00:00Z`, `...+01:00` | an instant as it stands (Apply writes absolute ranges so) |
| `1762246800000` | milliseconds since 1970 |
| refresh `5s`, `1m`, `1h` | the auto-refresh interval; `''` is off |

### Options

| Option | Attribute (`create()` option) | Effect |
|---|---|---|
| Range | `data-ds-timerange-from`, `data-ds-timerange-to` (`from`, `to`) | default `now-1h` and `now` |
| Refresh | `data-ds-timerange-refresh` (`refresh`) | the interval in force; `off` or empty for none |
| Intervals | `data-ds-timerange-intervals` (`intervals`) | the choices of the select, default `5s,10s,30s,1m,5m,15m,30m,1h` |
| Quick ranges | `data-ds-timerange-quick` (`quick`) | the "from" of each quick range (its "to" is `now`, or for a rounded one the same expression); default from `now-5m` to `now-90d`, today, yesterday, this week and this month |
| Recent ranges | `data-ds-timerange-store` (`store`) | the key under which `DS.store` remembers the last five ranges that are not quick ones (per browser, namespace `timerange`); default `recent` |
| Zone | `data-ds-timerange-zone` (`zone`) | the zone of absolute times: `local` (default) or an IANA name (`UTC`) |
| Size, density, shape, touch | the option classes | the trigger and the refresh button are buttons; the interval pill computes the same height (`--ds-btn-height`, 8px per size step, 4px per density step, at least `--ds-target-min`) and radius (the pill times `--ds-shape`) |

`create()` also takes `locale` (else the page's). Tone: none.

### Behaviour

- **Open**: the trigger (Enter, Space, a click, or Alt+ArrowDown). Focus goes to the quick range in force, else the
  "From" field.
- **Popover**: Tab cycles through the quick ranges, the two fields, Apply and the recent ranges; a range applies on
  Enter or a click and closes the popover; focus is back on the trigger. Apply takes the two fields (date and time,
  typed part by part): an unfinished field is marked invalid and takes the focus; a "from" not before the "to" is
  refused with the reason under the fields (`.ds-timerange__error`, an alert with an icon and the string
  `rangeOrder`). Escape closes without a change.
- **Refresh**: the button sends `ds:refresh` at once; an interval sends it on the page's one clock
  (`DS.format.clock`), asleep while the tab is hidden. While an interval runs the pill takes the tint (`data-on`) and
  says the interval, so not by colour alone.
- **Announcements**: a new range is said through `DS.a11y.announce()` ("Last 6 hours").
- **Events** on the root: `ds:change` with `{ from, to, start, end, label, query }` when the range or the interval
  changes (`refresh` too, for the interval); `ds:refresh` with `{ from, to, start, end, reason }` whenever the page
  should load again: `change` (a new range), `manual` (the button), `interval` (the clock). `start` and `end` are ISO
  instants resolved at that moment.

### JS API

`js/timerange.js` (`DS.timerange`). `create(root, options)` returns the controller that `data-ds-timerange` makes,
once per root: `get()` (`{ from, to, refresh }`), `set(value)` (`{ from, to, refresh }` or a "from" alone; no event),
`resolve()` (the instants now), `query()`, `refresh()` (sends `ds:refresh`, reason `manual`), `open()`, `close()`,
`on(type, fn)` (`change`, `refresh`) and `destroy()`.

| Export | What |
|---|---|
| `parse(value, { now, roundUp, timeZone, firstDay })` | the `Date` a value stands for, `null` for none |
| `resolve({ from, to }, options)` | `{ start, end }` at `now`; a rounded "to" ends with its unit |
| `label({ from, to }, { locale, now, timeZone })` | the range for people: "Last 15 minutes" (`lastSpan` and `Intl.NumberFormat`), "Today", "Yesterday", "This week" (`Intl.RelativeTimeFormat`), else the two instants (`formatRange`) |
| `query({ from, to, refresh })` | `from=now-1h&to=now&refresh=30s`, through `URLSearchParams` |
| `spanMs(span)` | the milliseconds of `30s`, `5m`, `1h`, `1d`, `1w`; 0 for none |

### Accessibility

The root is a `role="group"` named "Time range" (the string `timeRange`, or its own label). The trigger says
`aria-haspopup="dialog"` and `aria-expanded`; the popover is a modal dialog; the quick and recent ranges are groups of
buttons named by their headings ("Quick ranges", "Recently used"), the one in force `aria-current="true"`. The two
fields are named "From" and "To"; the error is the "To" field's description. The refresh button is named "Refresh",
the select "Auto refresh" with "Off" as its first choice. Strings: `timeRange`, `absoluteRange`, `rangeFrom`,
`rangeTo`, `apply`, `recentRanges`, `quickRanges`, `refresh`, `autoRefresh`, `off`, `lastSpan`, `rangeOrder`.

### Forced colours

The interval pill keeps its border (`ButtonBorder`) and the system's select colours, `Highlight` / `HighlightText`
while on; the popover and its presets are the picker's.

### Hooks

It reads `--ds-btn-height` for the pill, so it lines up with the buttons beside it.

### Motion

The popover's; the chevron of the trigger turns with it (`aria-expanded`, `rotate` on the spring, a named exception of
disclosure chevrons); the interval pill's tint over `--ds-dur-fast`.

<!-- changelog -->
- Time range (3.0): `.ds-timerange` and `DS.timerange` (`create`, `parse`, `resolve`, `label`, `query`, `spanMs`),
  the range control of a monitoring view: quick relative ranges, absolute from and to, recent ranges remembered through
  `DS.store`, an auto-refresh interval that sends `ds:refresh`, URL-friendly values.
