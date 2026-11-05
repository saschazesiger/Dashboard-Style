## Charts

`DS.chart` draws dependency-free SVG charts from a table or a spec: line, area and stacked area (time series with
gaps), column and bar (grouped, stacked, horizontal, 100%), combo (columns and a line on two axes), sparkline (line,
area, bar), donut, pie and ring, gauge and bar gauge. Below it, the CSS-only marks of 2.x stay: meters, columns and
legends. Everything draws from the chart roles ([tokens.md](tokens.md#chart-colours)): `--ds-chart-1` to
`--ds-chart-4` (four series in a fixed order), `--ds-chart-neutral`, `--ds-chart-track`, `--ds-chart-warning` and
`--ds-chart-error`.

### DS.chart

A `<figure class="ds-chart">` with `data-ds-chart`: either a type, and the data is the page's `<table>` inside (the
chart's text equivalent as well), or the whole spec as JSON. `DS.init()` finds it; `DS.chart.create(el, spec)` does the
same from a script and returns the same controller.

```html
<figure class="ds-chart" data-ds-chart="line">
  <figcaption>Requests per hour</figcaption>
  <table class="ds-table">
    <thead><tr><th>Hour</th><th>Requests</th><th data-ds-chart-mark="area">Errors</th></tr></thead>
    <tbody>
      <tr><th><time datetime="2026-11-04T09:00">09:00</time></th><td>420</td><td>3</td></tr>
      <tr><th><time datetime="2026-11-04T10:00">10:00</time></th><td>–</td><td></td></tr>   <!-- a gap -->
    </tbody>
  </table>
</figure>

<figure class="ds-chart" data-ds-chart='{"type":"column","stack":"normal","labels":["Mon","Tue","Wed"],
  "series":[{"name":"Opened","values":[12,9,14]},{"name":"Closed","values":[8,11,10]}]}'>
  <figcaption>Tickets per day</figcaption>
</figure>
```

```js
const chart = DS.chart.create(el, { type: 'area', labels, series, stack: 'normal', curve: 'monotone' });
chart.set({ labels: next, series: nextSeries });   // the lines morph, the bars glide, the figures count
chart.toggle('Errors');                            // hides or shows a series (never the last one)
chart.view('table');                               // the table in place of the plot
chart.on('select', ({ index, series, key, label }) => openDetail(key));
```

**The table.** The header row names the x axis and the series; each body row is one point, its first cell the x (a
`<time datetime>`, `data-value` or the text: a date, a number or a category), an empty cell or a dash a gap. A header
cell may carry `data-ds-chart-mark` (`line`, `area`, `column`), `data-ds-chart-axis` (`end`) and `data-ds-chart-tone`.
The module watches the table: a page that re-renders its rows (with `DS.dom.morphHtml`) updates the chart, which
morphs to the new data. `DS.chart.parse(table)` gives the spec it reads.

**The spec** (the JSON of `data-ds-chart`, the second argument of `create()`, also through `data-ds-config`):

| Key | Values | What |
|---|---|---|
| `type` | `line`, `area`, `column`, `bar`, `combo`, `sparkline`, `donut`, `pie`, `ring`, `gauge`, `bargauge` | the chart; `bar` is horizontal |
| `labels` | dates (ISO text, `Date`), numbers or categories | the x of each point: all dates make a time axis (ticks on whole hours, days, Mondays, months, in the page's locale), all numbers a linear one, anything else categories |
| `series` | `[{ name, values, mark, axis, tone, visible }]` | one per series, in their fixed colour order; `null`, a blank or a dash is a gap; `mark` `line`, `area` or `column` mixes marks; `axis: 'end'` puts it on the second axis; `tone` a single-series meaning (with its name) |
| `stack` | `true` / `'normal'`, `'percent'` | stacks columns with columns and lines or areas with each other, per axis; `percent` to 100% |
| `curve` | `linear`, `monotone`, `step` | the path of lines and areas; `monotone` never overshoots a point |
| `markers` | `'auto'`, `true`, `false` | a marker on every point (auto: where points are 24px apart or more); a lone point between gaps always shows one |
| `patterns` | `true` | series 2 to 4 of bars, slices and stacked areas hatched, as in forced colours (`.ds-chart--patterns`) |
| `x` | `{ type, label, format }` | `type` `time`, `linear`, `band` overrides the guess; `format` Intl options of the tooltip and the table |
| `y`, `y2` | `{ type: 'log', min, max, label, zero, format }` | the value axes (`y2`: a combo's line); `zero: false` lets a line chart's axis leave out zero; `label` titles the axis |
| `format` | `'bytes'`, `'percent'`, Intl.NumberFormat options | the values in the tooltip, the table, the centre figure (`DS.format`) |
| `thresholds` | `[{ value }]` or `[{ from, to }]`, with `label`, `tone`, `axis` | a dashed line at a value, or a band of values, with its word |
| `annotations` | `[{ at }]` or `[{ from, to }]`, with `label`, `tone` | the same along x (a deploy, an incident window) |
| `min`, `max`, `zones` | numbers; `[{ to, tone, label }]` | a gauge's, ring's or bar gauge's scale and its zones; the zone's word goes with the value |
| `value`, `name` | a number, text | a gauge's one value, instead of `series` |
| `legend`, `table`, `tooltip` | `false` | leave them out (a sparkline has none by default; `tooltip: true` gives it one) |
| `label`, `title` | text | the words under a donut's, ring's or gauge's figure; the chart's name where the figure has no caption |

The module writes its parts after the caption, each `data-ds-keep` (so `DS.dom.morphHtml` of the figure keeps them):
`.ds-chart__tools` with the table toggle, `.ds-chart__legend` of `.ds-chart__key` toggles (`.ds-chart__swatch` with
`.ds-chart__swatch-line`, `.ds-chart__swatch-marker` or `.ds-chart__swatch-fill`, `.ds-chart__key-name`,
`.ds-chart__key-value` for a slice's share), `.ds-chart__frame` (the tab stop) with `svg.ds-chart__svg` and its
layers, `.ds-chart__centre` (`.ds-chart__figure`, `.ds-chart__caption`), the tooltip `.ds-chart__tip`
(`.ds-chart__tip-title`, `.ds-chart__tip-row`, `.ds-chart__tip-key`, `.ds-chart__tip-key-bar`, `.ds-chart__tip-gap`,
`.ds-chart__tip-value`, `.ds-chart__tip-name`), the hidden `.ds-chart__hint` and `.ds-chart__probe` (the lengths the
stylesheet computes from the options, read back), the bar gauge's `.ds-chart__rows` (`.ds-chart__row`,
`.ds-chart__row-head`, `.ds-chart__row-label`, `.ds-chart__row-status`, `.ds-chart__row-value`,
`.ds-chart__row-bar`), and for a JSON chart `.ds-chart__table` (with `.ds-chart__table-caption`). The plot's marks:
`.ds-chart__gridline`, `.ds-chart__baseline`, `.ds-chart__tick` (`.ds-chart__tick--category`),
`.ds-chart__axis-title`, `.ds-chart__band` (`.ds-chart__band--on`: the hovered category), `.ds-chart__cursor`
(`.ds-chart__cursor--on`: the crosshair), `.ds-chart__bar` (`.ds-chart__bar--down` below zero, `.ds-chart__bar--inner`
inside a stack, square, `.ds-chart__bar--on` resting on another, with the seam), `.ds-chart__line`,
`.ds-chart__area`, `.ds-chart__marker`, `.ds-chart__dot` (the cursor's point), `.ds-chart__track`,
`.ds-chart__slice` (`.ds-chart__slice--active`), `.ds-chart__lines`, `.ds-chart__value-arc`, `.ds-chart__zone-arc`,
`.ds-chart__rule`, `.ds-chart__zone`, `.ds-chart__rule-label`, and the hatchings (`.ds-chart__pattern-ground`,
`.ds-chart__pattern-ink`). A series part carries `.ds-chart__series` and `.ds-chart__series--s2`,
`.ds-chart__series--s3`, `.ds-chart__series--s4` or `.ds-chart__series--other` (the neutral: the fifth series and
later, and a donut's "Other" slice), or its tone; `.ds-chart__series--dim` while the keyboard picks another. The
figure gets `data-state` (`chart` or `table`, written) and the modifiers of its spec: `.ds-chart--line` and the other
types (`.ds-chart--bar`, `.ds-chart--sparkline`, `.ds-chart--donut`, `.ds-chart--pie`, `.ds-chart--ring`,
`.ds-chart--gauge`, `.ds-chart--bargauge` are styled), `.ds-chart--stacked`, `.ds-chart--patterns`, and `.ds-chart--empty` when no series has a value: the frame then
shows "No data" (`.ds-chart__empty`) instead of empty axes, and is named so. The module writes
`--ds-share` and `--ds-chart-from` on each bar (registered numbers: the bar is clipped between them, so it glides),
`--ds-chart-pattern-2`, `--ds-chart-pattern-3` and `--ds-chart-pattern-4` on the SVG (its hatchings), and `--ds-chart-cx`, `--ds-chart-cy` and
`--ds-chart-hole` on the centre figure; never set them.

**Series apart without colour.** Lines of series 2 to 4 are dashed (`--ds-chart-dash-2` to `--ds-chart-dash-4`; a
theme may set `none`), every series has its marker shape (circle, square, triangle, diamond) in the plot, the legend
and the tooltip, a legend is there from two series on, and the table holds every value. `patterns: true` hatches the
fills of series 2 to 4 at 45, 135 and 90 degrees, as forced colours always do. At most four series take colours; more
take the neutral, and a donut folds its fifth slice and later into "Other". Text never takes a series colour.

**Combo.** Columns and a line; with `y2` the line reads the second axis at the end. Two scales invite a false reading
of where the marks cross: label both axes (`y.label`, `y2.label`) and prefer two charts where the measures do not
belong together.

**Gauge and bar gauge.** A gauge is a 240° arc from `min` to `max` (default 0 to 100) with its value as a figure in
the middle; `zones` (`[{ to: 70, tone: 'success', label: 'Normal' }, { to: 90, tone: 'warning', label: 'High' }, ...]`)
draw a thin band outside the arc, colour the value arc by the zone it is in and put the zone's word under the figure.
A bar gauge (`bargauge`) is one labelled meter per label, the zone's word next to the value.

**Ring.** One ring per series (at most four), its first value of `max` (default 100), the first series' value in the
middle. **Donut and pie** show one series, a slice per label, each slice's share in the legend.

### Options

| Option | Classes | Applies to | Effect |
|---|---|---|---|
| Size | `.ds-xs` ... `.ds-xl` | `.ds-chart` | the plot 40px per step (radial and gauge 24px), the widest bar 4px, the marker 2px, the legend keys 4px of height; a sparkline stays 32px |
| Density | `.ds-density-*` | `.ds-chart` | the plot 16px per step (radial and gauge 8px), the gaps between the parts and the legend keys |
| Shape | `.ds-shape-*` | `.ds-chart` | the radius of a bar's data end, the legend keys (pills at the default), the tooltip, a bar gauge's meters |
| Touch | `.ds-touch` | `.ds-chart__key` | every legend key at least `--ds-touch-target` high |
| Tone | `tone` of a series, a threshold, a zone | the mark | `neutral`, `warning` and `error` take their chart roles, the others the tone; always with the series' or zone's name |
| Width | (container) | `.ds-chart` | under 480px of chart width the plot is 3/4 as high and category ticks take the caption font; from 480px a donut's, pie's or ring's legend stands beside it as a column with the shares |

### Behaviour and keyboard

- **Cursor.** Pointing at the plot snaps a crosshair to the nearest x (columns: the category's band), with a dot on
  each line and the tooltip: the x, then each visible series' value with its key, a stacked chart's total. A column
  or a slice is its own target. Touch shows it on a tap.
- **Keyboard** (the plot is one tab stop, `role="img"` with the chart's name and a hint): `←` `→` move along the points
  (a horizontal bar chart and a donut also `↑` `↓`), `↑` `↓` go through the series at that point and back to all of
  them, `Home` and `End` go to the ends, `Page Up` and `Page Down` jump a tenth, `Enter` emits `ds:select`, `Escape`
  hides the cursor (and keeps an overlay around the chart open). Each move shows the crosshair and the tooltip and is
  announced ("09:00: Requests 420, Errors 3", `DS.a11y.announce`).
- **Legend.** Each key is a toggle button (`aria-pressed`): it hides or shows its series (a slice of a donut), which
  is announced ("Errors hidden"); the last visible series stays. A hidden key is hollow with its name struck through.
- **Table view.** The toggle (`aria-pressed`, "Show as table") shows the table in place of the plot and the legend; the
  table is there for screen readers all along (visually hidden while the chart shows).
- **Gauge**: `role="meter"` with `aria-valuenow` and `aria-valuetext` (the value and the zone's word); each bar of a
  bar gauge the same. **Sparkline**: `role="img"` named by a summary ("Requests: from 120 to 340, lowest 98, highest
  360"); with `tooltip: true` it is a tab stop as well.
- **Responsive.** The chart lays out at the size of its frame and again when that changes (a `ResizeObserver`):
  ticks thin out to what fits, labels never overlap, a label at an edge moves in.
- **Events** (bubbling, on the figure; the controller's `on()` gets the same detail): `ds:change` `{ spec }` after
  `set()`, `ds:toggle` `{ series, name, visible }`, `ds:view` `{ view }`, `ds:point` `{ index, series, key, label }`
  when the cursor moves to another point, `ds:select` the same on a click or `Enter`.

### JS API

- `DS.chart.create(el, spec)`: draws the chart; returns the controller: `get()` (the spec with each series'
  visibility), `set(spec)` (merged over the current one), `on(type, fn)`, `toggle(series, visible)`, `view(mode)`,
  `focus(index, series)`, `update()` (reads the attributes and the table again), `destroy()`. On the attribute path
  `DS.core.get(el, 'chart')` returns it.
- The engine, pure functions a page may use for a chart of its own: `DS.chart.scale(type, domain, range, options)`
  (`linear`, `log`, `time`, `band`: `map`, `invert`, `ticks`, `bandwidth`), `DS.chart.ticks(min, max, count)` (round
  steps of 1, 2 or 5), `DS.chart.timeTicks(min, max, count)` (whole seconds to years of local time),
  `DS.chart.path(points, { curve, area })` (SVG path data with gaps; areas close along their `y0`),
  `DS.chart.stack(series, { offset })` (`[lo, hi]` per value, negatives downwards, `percent`),
  `DS.chart.nearest(positions, value)` (hit testing), `DS.chart.parse(table)` and
  `DS.chart.layout(spec, width, height, metrics)` (where everything goes, without a DOM).

### Accessibility

Every chart keeps its text equivalent: the page's table, or the one the module writes from JSON, read by screen
readers while the chart shows and shown by the table view. The plot is named by the caption (or `title`, or the
figure's `aria-label`) and says how to move; each step is announced with its values. Status is never by colour alone:
zones and tones come with their word, hidden series with a hollow key and a struck name, series with their dash and
marker.

### Forced colours

Lines, markers and fills take `CanvasText`, series 2 to 4 keep their dashes and their fills a hatching of their own
(45, 135 and 90 degrees); gridlines and the crosshair `GrayText`, the hovered band `Highlight`; the tooltip and a
gauge's track get a `CanvasText` edge, the active slice a `Highlight` one; a shown legend key is `Highlight` /
`HighlightText` (an on/off toggle), a hidden one plain `CanvasText` with its name struck through.

### Hooks

`--ds-chart-height` (240px), `--ds-chart-radial-height` (200px), `--ds-chart-gauge-height` (160px),
`--ds-chart-spark-height` (32px), `--ds-chart-bar` (24px), `--ds-chart-radius` (`--ds-radius-xs`), `--ds-chart-stroke`
(2px), `--ds-chart-marker` (8px), `--ds-chart-grid` (`--ds-line`), `--ds-chart-area-opacity` (`--ds-state-dragged`),
`--ds-chart-stack-opacity` (`--ds-state-stale`), `--ds-chart-dash-2`, `--ds-chart-dash-3`, `--ds-chart-dash-4`: see
[theming.md](theming.md).

### Motion

A line or area morphs its path (`d`) to new data: the named exception of D14, on `--ds-ease-value` over
`--ds-dur-glide`, points matched by their x so a sliding time window slides; an interrupted morph continues from the
frame it shows, and a point that is new grows out of the line drawn so far. Bars are value bars (`--ds-share` and
`--ds-chart-from` glide on the same curve and time, so bars and lines land together); the first render fills them from
zero (`DS.motion.enterAll(bars, 'fill')`) and draws the lines up from the baseline. Slices, rings and a gauge's arc
morph their angles the same way, and the figures count (`DS.motion.countUp`). The morph's clock is an animation
without keyframes on the SVG named `ds-chart-morph`, so `DS.motion.settled(el, { subtree: true, names:
['ds-chart-morph'] })` waits for it. The
crosshair, the hover band and the tooltip fade in on `--ds-dur-fast` and out on `--ds-dur-instant`; nothing moves on
hover.

### Meters, columns and legends (CSS only)

```html
<span class="ds-meter" role="meter" aria-label="Disk" aria-valuemin="0" aria-valuemax="100" aria-valuenow="78" aria-valuetext="78% used"></span>

<figure class="ds-columns">
  <figcaption class="ds-sr">Devices that checked in, per day</figcaption>
  <ol class="ds-columns__plot">
    <li class="ds-columns__col">
      <span class="ds-columns__value">42</span>
      <span class="ds-columns__fill" aria-hidden="true"></span>
      <span class="ds-columns__label">Mon</span>
    </li>
    <li><button class="ds-columns__col ds-columns__col--s2" type="button" aria-label="Tuesday: 38 devices"> ... </button></li>
  </ol>
</figure>

<figure class="ds-columns ds-columns--mini" role="img" aria-label="Tickets per day, last 14 days: highest 12 today">
  <ol class="ds-columns__plot" aria-hidden="true"><li class="ds-columns__col"><span class="ds-columns__fill"></span></li> ... <li class="ds-columns__col ds-columns__col--highlight"><span class="ds-columns__fill"></span></li></ol>
</figure>

<figure class="ds-columns ds-columns--grouped">
  <figcaption class="ds-sr">Tickets opened and closed per week</figcaption>
  <div class="ds-scroll-x" tabindex="0" role="group" aria-label="Tickets per week">
    <ol class="ds-columns__groups">
      <li class="ds-columns__group">
        <ol class="ds-columns__plot">
          <li class="ds-columns__col"><span class="ds-columns__fill" aria-hidden="true"></span><span class="ds-sr">Opened: 12</span></li>
          <li class="ds-columns__col ds-columns__col--s2"><span class="ds-columns__fill" aria-hidden="true"></span><span class="ds-sr">Closed: 9</span></li>
        </ol>
        <span class="ds-columns__label">W41</span>
      </li>
      <li class="ds-columns__group ds-columns__group--current"> ... <span class="ds-columns__label">W42<span class="ds-sr">, this week</span></span></li>
    </ol>
  </div>
</figure>

<ul class="ds-legend">
  <li><span class="ds-legend__key"></span>Opened</li>
  <li><span class="ds-legend__key ds-legend__key--s2"></span>Closed</li>
</ul>
```

- **The share**: `--ds-share` (0 to 1, a registered number) on each mark (the meter, each column), set with
  `el.style.setProperty('--ds-share', share)` (a strict CSP allows it) or `DS.dom.progress()`. The fill is clipped at
  the share, never scaled, so its round data end keeps its shape at any value; a new value glides there on
  `--ds-ease-value` over `--ds-dur-glide`, and a column's value rides on the top of its fill. It is not
  `--ds-progress`, which drives the whole progress choreography. On the first render the marks fill from zero:
  `DS.motion.enterAll(marks, 'fill', { stagger: false })` (`.ds-enter--fill`); later values transition.
- `.ds-meter`: a bar `--ds-meter-height` (4px) high on `--ds-meter-track` (`--ds-chart-track`), the fill in
  `--ds-meter-color` (`--ds-chart-1`). A tone on the meter itself (`.ds-tone-warning` ...; always with words next to
  it): `neutral`, `warning` and `error` take their chart roles, the others the tone. A meter with its own figure is `role="meter"` with `aria-valuenow` and `aria-valuetext`; next to a
  figure in text (`.ds-kv-list--bars`) it is `aria-hidden`.
- `.ds-columns`: a `<figure>` with a caption and an `ol.ds-columns__plot` of `.ds-columns__col`, each with
  `.ds-columns__value`, `.ds-columns__fill` and `.ds-columns__label`, `--ds-columns-height` (120px) high, the data
  end rounded by `--ds-columns-radius` (`--ds-radius-xs`). Series `.ds-columns__col--s2`, `.ds-columns__col--s3`,
  `.ds-columns__col--s4` and a tone on the column itself (`.ds-tone-warning` ...) set `--ds-chart-color`. A column that opens its category is a `<button>` or `<a>` with the
  class inside a plain `<li>`: a state layer, an inset ring, the ripple, no morph.
- `.ds-columns--mini`: a 32px sparkline beside a figure, no labels or values, the columns `aria-hidden` and the figure
  `role="img"` with a summary; `.ds-columns__col--highlight` takes `--ds-chart-1`, the rest `--ds-chart-neutral`.
  Inside a clickable [tile](#tiles) its parts are `<span>`s.
- `.ds-columns--grouped`: `.ds-columns__groups` of `.ds-columns__group` (at least `--ds-columns-group-min`, 56px,
  each), its columns 2px apart and its label under the group; `.ds-columns__group--current` lies on a band of
  `--ds-surface-low` with its label in the label weight and a `.ds-sr` word. Put it in a `.ds-scroll-x` when it may
  be wider than its card.
- `.ds-legend`: keys of `--ds-legend-key-size` (12px) in the meta font; `.ds-legend__key--s2`, `.ds-legend__key--s3`,
  `.ds-legend__key--s4`, or a tone on the key itself.
- `.ds-meter--neutral`, `.ds-meter--warning`, `.ds-meter--error`, `.ds-columns__col--warning`,
  `.ds-columns__col--error`, `.ds-legend__key--neutral`, `.ds-legend__key--warning` and `.ds-legend__key--error` are
  **deprecated** (3.0, removed when 3.0 ships): `.ds-tone-neutral`, `.ds-tone-warning`, `.ds-tone-error`, the same
  colours.
- **Colours**: the series in their fixed order, never cycled; at most four, more fold into "Other"; the tones only on
  single-series marks; text never takes a series colour. A theme that changes the roles keeps each at 3:1 on
  `--ds-surface`, `--ds-surface-low` and `--ds-chart-track`, and adjacent series apart for colour-blind readers. In
  forced colours the fills take `CanvasText` (`--ds-chart-forced-ink` where a component lays them on a system fill of
  its own), series 2 to 4 a hatching of their own (45, 135 and 90 degrees), as do the legend keys.
- **Accessibility**: every chart has a text equivalent: its caption plus a table or a key-value list, or the values
  as text.
- **When to draw your own**: scatter plots, heatmaps and the like are the project's for now, with the chart roles and
  `--ds-share`; lines, areas and stacked bars are `DS.chart`.

#### Options of the marks

On the mark or any ancestor; each is computed in the component's own rule ([options.md](options.md)).

| Option | Classes | Applies to | Effect |
|---|---|---|---|
| Size | `.ds-xs` ... `.ds-xl` | `.ds-meter` | 1px of height per step (2 to 6px) |
| | | `.ds-columns` | the plot 24px per step (72 to 168px); not `--mini`, 32px, which lines up with a figure |
| | | `.ds-legend__key` | 2px per step |
| Density | `.ds-density-*` | `.ds-columns` | the plot 12px per step; not a meter, which is thin already |
| Shape | `.ds-shape-*` | `.ds-meter`, a column's data end, `.ds-legend__key` | multiplies the radius (of a meter: half its height, times the shape, at most half its height) |
| Touch | `.ds-touch` | a column that opens | at least `--ds-touch-target` high; its width comes from the chart's |
| Tone | `.ds-tone-*` | `.ds-meter`, `.ds-columns__col`, `.ds-legend__key` | the fill, from the class on the mark itself; always with words next to it. It beats a `--ds-meter-color` of the theme, as the meaning goes first |

The type stays the meta font at every size.

#### Keyboard and names of the marks

Only a column that opens takes focus: `Tab` reaches it, `Enter` follows or presses it, `Space` presses a button, and its
`aria-label` says the category and the value ("Tuesday: 38 devices"). A `.ds-scroll-x` around grouped columns is a tab
stop of its own when nothing inside takes focus. A meter with its own figure is `role="meter"` with a name,
`aria-valuenow` and `aria-valuetext`.

#### Hooks of the marks

`--ds-meter-height`, `--ds-meter-track`, `--ds-meter-color`, `--ds-columns-height`, `--ds-columns-radius`,
`--ds-columns-group-min`, `--ds-chart-color`, `--ds-legend-key-size`, `--ds-chart-forced-ink`: see
[theming.md](theming.md).

**Motion:** the "Charts" row of [Feedback](motion.md#feedback) in motion.md.

<!-- changelog -->
<!--
- Added: `DS.chart` (`chart.js`), dependency-free SVG charts on `.ds-chart`: line, area and stacked area (time series
  with gaps), column and bar (grouped, stacked, horizontal, 100%), combo with two axes, sparkline, donut, pie, ring,
  gauge and bar gauge, from a `<table>` or JSON in `data-ds-chart`, or `DS.chart.create(el, spec)`. A cursor with a
  crosshair and a tooltip, a legend that toggles series, keyboard navigation along the points with announcements, a
  table view, thresholds and annotations, container-driven layout, dashes, markers and hatchings that tell series
  apart without colour; lines and areas morph to new data (D14), bars glide, figures count. The engine is exported:
  `scale`, `ticks`, `timeTicks`, `path`, `stack`, `nearest`, `parse`, `layout`.
- Added: hooks `--ds-chart-height`, `--ds-chart-radial-height`, `--ds-chart-gauge-height`, `--ds-chart-spark-height`,
  `--ds-chart-bar`, `--ds-chart-radius`, `--ds-chart-stroke`, `--ds-chart-marker`, `--ds-chart-grid`,
  `--ds-chart-area-opacity`, `--ds-chart-stack-opacity`, `--ds-chart-dash-2` to `--ds-chart-dash-4`; strings
  `chartTableView`, `chartKeys`, `chartKeysSlices`, `chartPoint`, `chartSummary`, `chartTotal`, `chartOther`,
  `chartShown`, `chartHidden`, `chartEmpty`.
-->
