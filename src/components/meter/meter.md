## Meter variants

A share of a known whole (disk used, a quota, a score, a load) beyond the thin [`.ds-meter`](#charts): a segmented bar,
threshold marks, a ring, a gauge and a bar gauge. Each is a `role="meter"` that says its value in words.

```html
<!-- linear, with a threshold mark (the limit at 80%) -->
<span class="ds-meter" role="meter" aria-label="Disk" aria-valuemin="0" aria-valuemax="100" aria-valuenow="62"
      aria-valuetext="62% used, limit 80%" style="--ds-share: .62">
  <span class="ds-meter__threshold" style="--ds-share: .8" aria-hidden="true"></span>
</span>

<!-- segmented: a score in steps -->
<span class="ds-meter ds-meter--segmented ds-tone-success" role="meter" aria-label="Password strength"
      aria-valuemin="0" aria-valuemax="5" aria-valuenow="4" aria-valuetext="Strong" style="--ds-share: .8"></span>

<!-- ring, and a gauge (an arc of 240 degrees) -->
<div class="ds-gauge" role="meter" aria-label="Storage" aria-valuemin="0" aria-valuemax="100" aria-valuenow="72"
     aria-valuetext="72% used" style="--ds-share: .72">
  <span class="ds-gauge__value" aria-hidden="true">72%</span>
  <span class="ds-gauge__label" aria-hidden="true">Storage</span>
</div>
<div class="ds-gauge ds-gauge--arc ds-tone-warning" role="meter" aria-label="CPU" aria-valuemin="0" aria-valuemax="100"
     aria-valuenow="86" aria-valuetext="86%, high: above the 80% limit" style="--ds-share: .86">
  <span class="ds-gauge__threshold" style="--ds-share: .8" aria-hidden="true"></span>
  <span class="ds-gauge__value" aria-hidden="true">86%</span>
  <span class="ds-gauge__label" aria-hidden="true">CPU</span>
</div>

<!-- bar gauge: cells, zones from 70% (warning) and 90% (error) -->
<div class="ds-bar-gauge" role="meter" aria-labelledby="mem-label" aria-valuemin="0" aria-valuemax="100"
     aria-valuenow="84" aria-valuetext="84%, high" style="--ds-share: .84; --ds-bar-gauge-warning: .7; --ds-bar-gauge-error: .9">
  <span class="ds-bar-gauge__label" id="mem-label">Memory</span>
  <span class="ds-bar-gauge__value" aria-hidden="true">84%</span>
  <span class="ds-bar-gauge__track" aria-hidden="true"></span>
  <span class="ds-bar-gauge__note" aria-hidden="true">[icon alert 16]High</span>
</div>
```

| Variant | Class | What it shows |
|---|---|---|
| Linear | [`.ds-meter`](#charts) | a thin bar; the default |
| Segmented | `.ds-meter--segmented` on a `.ds-meter` | the bar in `--ds-meter-segments` (5) equal parts, `--ds-meter-segment-gap` (2px) apart: a score in steps. Set a share that ends on a part (`4 / 5`) |
| Threshold | `.ds-meter__threshold` in a `.ds-meter`, `.ds-gauge__threshold` in a `.ds-gauge` | a mark across the track at its own `--ds-share` (a limit, a target), in `--ds-meter-threshold` (`--ds-text`) with a hairline of the surface, so it reads on the fill and on the track. Not in a segmented meter, whose gaps would cut it |
| Ring | `.ds-gauge` | a full ring with the figure (`.ds-gauge__value`) and a label (`.ds-gauge__label`) inside |
| Gauge | `.ds-gauge.ds-gauge--arc` | an arc of 240 degrees, open at the bottom, with round ends |
| Bar gauge | `.ds-bar-gauge` | a label and the figure on one row, a thick track of `--ds-bar-gauge-cells` (20) cells under them, an optional `.ds-bar-gauge__note` (an icon and a word) below. The cells past `--ds-bar-gauge-warning` and `--ds-bar-gauge-error` (shares set on the element with the data; default none) take the warning and error colours, lit up to the share and faint beyond it, so the zones show on the track as well |

The share is the registered `--ds-share` (0 ... 1) that every chart mark reads, set on the meter with
`style.setProperty('--ds-share', ...)` (a strict CSP allows it). A new share glides there on `--ds-ease-value` over
`--ds-dur-glide`, and the figure goes through `DS.motion.countUp()` in the same task, so both land on the same frame.
The first render fills from zero: `DS.motion.enterAll(meters, 'fill', { stagger: false })` (`.ds-enter--fill`). A
threshold mark keeps its own share and never moves with the value.

**Status never by colour alone.** A tone or a zone colour says nothing by itself: `aria-valuetext` says the state in
words ("86%, high: above the 80% limit"), and a gauge or bar gauge shows the figure and, where the state matters, a
word (`.ds-bar-gauge__note` with an icon, or the label). The page decides when a value is high and sets the tone.

### Options

On the meter or any ancestor, except the tone; each is computed in this component's own rules ([options.md](options.md)).

| Option | Classes | Applies to | Effect |
|---|---|---|---|
| Size | `.ds-xs` ... `.ds-xl` | `.ds-gauge`, `.ds-bar-gauge`, `.ds-meter--segmented` | a gauge 16px per step (64 to 128px) and its ring 2px per step (4 to 12px), its figure with it; a bar gauge's track 2px per step (8 to 16px); a segmented meter 1px per step, as `.ds-meter` |
| Density | `.ds-density-*` | `.ds-bar-gauge` | the gap between its rows 1px per step, and between bar gauges in a column 2px per step; the gauges keep their size |
| Shape | `.ds-shape-*` | the threshold marks | their ends times `--ds-shape`; a ring and an arc stay round, a bar gauge's cells stay square |
| Tone | `.ds-tone-*` | the meter itself; an inherited tone is ignored | a gauge's fill: primary, info and success the tone, neutral, warning and error the chart roles; a bar gauge's first zone (primary, info, success, neutral) |
| Touch | | | not read: nothing here is a target |

### Accessibility

Each meter is `role="meter"` with `aria-valuemin`, `aria-valuemax`, `aria-valuenow` and an `aria-valuetext` in words,
and a name (`aria-label`, or `aria-labelledby` the bar gauge's label). The figure, the label inside a gauge, the
marks and the note are `aria-hidden`: the meter says them. None of them takes focus.

### Forced colours

The fill is `CanvasText` and the track `Canvas` with a `CanvasText` edge (a gauge: `CanvasText` on `GrayText`); the
threshold marks are `CanvasText` with a `Canvas` hairline. A bar gauge's warning zone is hatched at 45 degrees and its
error zone at 135 degrees, so the zones stay apart without colour. Printed, the fills keep their colours.

### Hooks

`--ds-meter-segments`, `--ds-meter-segment-gap`, `--ds-meter-threshold`, `--ds-gauge-size`, `--ds-gauge-thickness`,
`--ds-gauge-color`, `--ds-gauge-track`, `--ds-bar-gauge-height`, `--ds-bar-gauge-cells`, `--ds-bar-gauge-warning`,
`--ds-bar-gauge-error`: see [theming.md](theming.md). The last two are data, set on the element next to its share.

**Motion:** the share glides on `--ds-ease-value` over `--ds-dur-glide` (the "Data motion" rules of
[motion.md](motion.md#data-motion)); the first render fills with `.ds-enter--fill`.

<!-- changelog -->
- Meter variants (new, `meter`): `.ds-meter--segmented` and `.ds-meter__threshold` on the chart meter, the ring and
  gauge `.ds-gauge` (`--arc`, `__value`, `__label`, `__threshold`) and the bar gauge `.ds-bar-gauge` with warning and
  error zones, all on `--ds-share`.
