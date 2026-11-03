## Charts

Meters, columns and legends (2.0), drawn from the chart roles ([tokens.md](tokens.md#chart-colours)): `--ds-chart-1` to
`--ds-chart-4` (four series in a fixed order), `--ds-chart-neutral`, `--ds-chart-track`, `--ds-chart-warning` and
`--ds-chart-error`.

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
  `--ds-meter-color` (`--ds-chart-1`). Tones `.ds-meter--neutral`, `.ds-meter--warning`, `.ds-meter--error` (always
  with words next to them). A meter with its own figure is `role="meter"` with `aria-valuenow` and `aria-valuetext`; next to a
  figure in text (`.ds-kv-list--bars`) it is `aria-hidden`.
- `.ds-columns`: a `<figure>` with a caption and an `ol.ds-columns__plot` of `.ds-columns__col`, each with
  `.ds-columns__value`, `.ds-columns__fill` and `.ds-columns__label`, `--ds-columns-height` (120px) high, the data
  end rounded by `--ds-columns-radius` (`--ds-radius-xs`). Series `.ds-columns__col--s2`, `.ds-columns__col--s3`,
  `.ds-columns__col--s4` and tones `.ds-columns__col--warning`, `.ds-columns__col--error` set `--ds-chart-color`. A column that opens its category is a `<button>` or `<a>` with the
  class inside a plain `<li>`: a state layer, an inset ring, the ripple, no morph.
- `.ds-columns--mini`: a 32px sparkline beside a figure, no labels or values, the columns `aria-hidden` and the figure
  `role="img"` with a summary; `.ds-columns__col--highlight` takes `--ds-chart-1`, the rest `--ds-chart-neutral`.
- `.ds-columns--grouped`: `.ds-columns__groups` of `.ds-columns__group` (at least `--ds-columns-group-min`, 56px,
  each), its columns 2px apart and its label under the group; `.ds-columns__group--current` lies on a band of
  `--ds-surface-low` with its label in the label weight and a `.ds-sr` word. Put it in a `.ds-scroll-x` when it may
  be wider than its card.
- `.ds-legend`: keys of `--ds-legend-key-size` (12px) in the meta font; `.ds-legend__key--s2`, `.ds-legend__key--s3`,
  `.ds-legend__key--s4`, `.ds-legend__key--neutral`, `.ds-legend__key--warning`, `.ds-legend__key--error`.
- **Colours**: the series in their fixed order, never cycled; at most four, more fold into "Other"; the tones only on
  single-series marks; text never takes a series colour. A theme that changes the roles keeps each at 3:1 on
  `--ds-surface`, `--ds-surface-low` and `--ds-chart-track`, and adjacent series apart for colour-blind readers. In
  forced colours the fills take `CanvasText`, series 2 to 4 a hatching of their own (45, 135 and 90 degrees), as do
  the legend keys.
- **Accessibility**: every chart has a text equivalent: its caption plus a table or a key-value list, or the values
  as text.
- **When to draw your own**: lines, areas, scatter plots and stacked bars are the project's, with the chart roles and
  `--ds-share`.

**Motion:** the "Charts" row of [Feedback](motion.md#feedback) in motion.md.

