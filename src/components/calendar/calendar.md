## Calendar

The month grid every date picker shares, and the date engine under it: a day or a range to pick in one or two months,
inline on a page or inside a picker's popover. Everything a reader sees comes from `Intl` in the page's locale
(`DS.core.config()`): month titles, weekday heads, the first day of the week, week numbers and the full date that names
each day.

```html
<div class="ds-calendar" data-ds-calendar data-ds-value="2026-11-04" aria-label="Delivery date"></div>
<div class="ds-calendar" data-ds-calendar data-ds-calendar-mode="range" data-ds-calendar-months="2"
     data-ds-value="2026-11-01/2026-11-07"></div>
<div class="ds-calendar" data-ds-calendar data-ds-calendar-min="2026-11-03" data-ds-calendar-max="2026-12-20"
     data-ds-calendar-disabled="6,7,2026-11-12" data-ds-calendar-weeks data-ds-calendar-first-day="1"></div>
```

The element is empty in the markup; `DS.calendar` renders into it:

```html
<div class="ds-calendar__months">
  <div class="ds-calendar__month">
    <div class="ds-calendar__caption">
      <button class="ds-btn ds-btn--quiet ds-btn--icon ds-calendar__nav" type="button" aria-label="Previous month">[icon chevronLeft 20]</button>
      <span class="ds-calendar__title" id="ds-cal-1-t0" aria-live="polite">November 2026</span>
      <button class="ds-btn ds-btn--quiet ds-btn--icon ds-calendar__nav" type="button" aria-label="Next month">[icon chevronRight 20]</button>
    </div>
    <table class="ds-calendar__grid" role="grid" aria-labelledby="ds-cal-1-t0">
      <thead><tr><th class="ds-calendar__week" scope="col" abbr="week">wk</th><th scope="col" abbr="Monday">M</th> ...</tr></thead>
      <tbody><tr><th class="ds-calendar__week" scope="row" aria-label="week 45">45</th>
        <td></td>
        <td aria-selected="true"><button class="ds-calendar__day" type="button" tabindex="0" data-date="2026-11-04"
            aria-label="Wednesday, November 4, 2026" aria-current="date">4</button></td> ...
```

With two months, the first caption holds the button to the month before and the last the one to the month after; a
`.ds-calendar__spacer` stands in for a button, so each title stays centred.

### Options

| Option | Attribute (`create()` option) | Effect |
|---|---|---|
| Value | `data-ds-value` (`value`) | ISO text, `2026-11-04`; in range mode `2026-11-01/2026-11-07` |
| Mode | `data-ds-calendar-mode` (`mode`) | `single` (default) or `range` |
| Months | `data-ds-calendar-months` (`months`) | `1` (default) or `2` side by side (they wrap under each other when the room is narrow) |
| Limits | `data-ds-calendar-min`, `data-ds-calendar-max` (`min`, `max`) | the first and last day that may be picked; the month buttons stop there |
| Blocked days | `data-ds-calendar-disabled` (`disabled`) | ISO dates, ranges (`2026-12-24/2026-12-26`) and ISO weekdays (`6,7`: the weekend), comma separated; in JS also a function of the plain date |
| Week numbers | `data-ds-calendar-weeks` (`weeks`) | a column of week numbers, in the locale's numbering (ISO 8601 where the locale counts so) |
| First day | `data-ds-calendar-first-day` (`firstDay`) | `1` (Monday) ... `7` (Sunday); default the locale's |
| Show | `data-ds-calendar-show` (`show`) | the month to show first; default the value's, else today's |
| Size | `.ds-xs` ... `.ds-xl` on it or an ancestor | a day 8px per step from `--ds-calendar-cell` (40px); the type of the size |
| Density | `.ds-density-*` | a day 4px per step |
| Shape | `.ds-shape-*` | the radius of a day (round at the default, square at `.ds-shape-square`) |
| Touch | `.ds-touch` | a day at least `--ds-touch-target` |

`create()` also takes `locale` (else the page's), `onSelect(value)` (after each pick) and `silent` (no `ds:` events on
the element; a picker around it sends its own).

### Behaviour

- **Keyboard** (the grid of the WAI-ARIA date picker dialog): one tab stop, the focused day. ArrowLeft and ArrowRight move
  a day (in the writing direction), ArrowUp and ArrowDown a week, Home and End go to the start and end of the week, PageUp
  and PageDown a month, Shift+PageUp and Shift+PageDown a year, Enter or Space picks. Moving past the months on screen
  turns the page; the focus never leaves `min` and `max`.
- **Blocked days** (`aria-disabled="true"`) stay focusable, so their name is read, take the disabled ink and no press, and
  are never picked.
- **Range.** The first pick starts the range (`ds:input`, `{ start, end: '' }`); the pointer and the focus preview it
  (`data-preview` on the cells: `start`, `middle`, `end`); the second pick ends it in either order. The committed range is
  `data-range` on its cells, every cell of it `aria-selected="true"`, and the grid `aria-multiselectable="true"`.
- **Today** is `aria-current="date"`: a ring in the action colour (`--ds-calendar-today`).
- **Events** on the element: `ds:change` with `{ value }` (single) or `{ value, start, end }` (range) after a pick,
  `ds:input` when a range starts.
- **Locale.** Another locale through `DS.core.config({ locale })` renders it again at once (`ds:config`).

### JS API

`js/calendar.js` (`DS.calendar`). `create(el, options)` returns the controller that `data-ds-calendar` makes, once per
element: `get()` (ISO text, `''` while none; a range `start/end`), `set(value)` (no event; shows its month),
`show(date)` (shows the month of a date and makes it the tab stop), `focus(date)`, `view()` (`{ start, months, focus }`),
`update(options)`, `on(type, fn)` and `destroy()`.

The engine, for the other pickers and for pages, on plain dates `{ year, month, day }` (month 1-12) computed in UTC day
numbers, so no daylight saving change moves a day:

| Export | What |
|---|---|
| `parse(value)` | a plain date from ISO text (a date-time keeps its date), a `Date` (its local date) or a plain date; `null` for anything else or a day that does not exist |
| `iso(date)` | the ISO text, `''` for none |
| `today({ timeZone, now })` | today's plain date, locally or in a zone |
| `add(date, { years, months, days })` | moved in that order; a month step keeps the day where the month has it (January 31 plus a month is February 28) |
| `compare(a, b)` | negative before, 0 the same day, positive after |
| `daysIn(year, month)` | the days of a month |
| `weekInfo(locale, { firstDay })` | `{ firstDay, minimalDays }` of a locale: `Intl.Locale` week info, else a table of regions (CLDR) |
| `weekNumber(date, info)` | the week of the year in that numbering (default ISO 8601) |
| `grid(year, month, firstDay)` | six whole weeks of plain dates around a month |
| `available(date, { min, max, disabled })` | whether a day may be picked |
| `label(date, options)` | a plain date for people (default the full date), `Intl.DateTimeFormat` options plus `locale` |
| `rangeLabel(start, end, options)` | a range for people through `formatRange` ("Nov 1 – 7, 2026") |

### Accessibility

The grid is a `table` with `role="grid"`, named by its month title; the weekday heads carry the full name in `abbr`;
each day is a button named by its full date, with `aria-current="date"` for today and `aria-disabled` for a blocked day;
a picked day's cell is `aria-selected="true"`, and since the focus sits on the button, not on the cell, the button's
name ends on the string `selected` as well ("Wednesday, November 4, 2026, selected"). The month title is a polite live
region, so a turned page is heard; the month buttons keep the focus while they turn the page (a blocked one hands it to
the focused day). The two month buttons are named by the strings `previousMonth` and `nextMonth`
([install.md](install.md#language-and-locale)).
Status is never colour alone: every state is an attribute, today has a ring, a picked day a fill.

### Forced colours

A picked day and the band of a range are `SelectedItem` / `SelectedItemText`; the ends of a range carry a `CanvasText`
ring inside the fill; the preview a dashed edge; today keeps its ring (a border); a blocked day is `GrayText`; a focused
picked day has a `CanvasText` ring.

### Hooks

`--ds-calendar-cell`, `--ds-calendar-font`, `--ds-calendar-today`, `--ds-calendar-selected-bg`,
`--ds-calendar-selected-color`, `--ds-calendar-range-bg` ([theming.md](theming.md#component-hooks)).

### Motion

A turned page slides in from its side: `DS.motion.enter(month, 'slide')` (`ds-fade-in` and `ds-shift-in` on the spring),
its `--ds-motion-distance` set from `data-turn` (`next`, `back`; mirrored right to left). The band and the fills change
colour over `--ds-dur-fast`; a day presses as every action (`--ds-dur-micro`, the ripple, the press morph).
