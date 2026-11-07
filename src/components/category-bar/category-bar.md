## Category bar

The parts of a whole on one bar, with a legend that names each part and its figure: tickets by status, storage by
kind, a budget spent per team. A segmented meter of unequal parts.

```html
<figure class="ds-category-bar">
  <figcaption class="ds-category-bar__head">
    <span class="ds-category-bar__label">Tickets by status</span>
    <span class="ds-category-bar__total">240</span>
  </figcaption>
  <div class="ds-category-bar__track" role="img"
       aria-label="Open 120 (50%), in progress 72 (30%), closed 48 (20%); target 80% handled">
    <span class="ds-category-bar__part" style="--ds-share: .5"></span>
    <span class="ds-category-bar__part ds-category-bar__part--s2" style="--ds-share: .3"></span>
    <span class="ds-category-bar__part ds-category-bar__part--s3" style="--ds-share: .2"></span>
    <span class="ds-category-bar__marker" style="--ds-share: .8"></span>
  </div>
  <ul class="ds-legend" aria-hidden="true">
    <li><span class="ds-legend__key"></span>Open <span class="ds-category-bar__value">120</span></li>
    <li><span class="ds-legend__key ds-legend__key--s2"></span>In progress <span class="ds-category-bar__value">72</span></li>
    <li><span class="ds-legend__key ds-legend__key--s3"></span>Closed <span class="ds-category-bar__value">48</span></li>
  </ul>
</figure>
```

Each part is as wide as its `--ds-share` of the whole (0 ... 1, set by the page). The parts are 2px apart, so two
close colours stay apart. The legend is the chart's [`.ds-legend`](#charts): give each key the series or the tone
of its part.

| Part or variant | Class | What |
|---|---|---|
| Bar | `.ds-category-bar` | a `<figure>`: the head, the track, the legend |
| Head | `.ds-category-bar__head` | a `<figcaption>`: `.ds-category-bar__label` and `.ds-category-bar__total` on one line |
| Track | `.ds-category-bar__track` | `role="img"` with a label that names every part and its figure |
| Part | `.ds-category-bar__part` | a part of `--ds-share` of the whole; `.ds-category-bar__part--s2`, `.ds-category-bar__part--s3`, `.ds-category-bar__part--s4` the series colours, or a `.ds-tone-*` on the part |
| Marker | `.ds-category-bar__marker` | a mark across the bar at its own share: a target, a limit |
| Figure | `.ds-category-bar__value` | a figure in a legend entry, tabular |
| Rest | `.ds-category-bar--rest` | shares that add up to less than 1 leave the track showing: a budget not spent yet |

Leave out a part of no share: it would still take a gap.

### Options

On the bar or any ancestor, except the tone; each is computed in this component's own rules ([options.md](options.md)).

| Option | Classes | Applies to | Effect |
|---|---|---|---|
| Size | `.ds-xs` ... `.ds-xl` | the track | 2px per step (4px to 12px; 8px at md); the legend keys follow their own steps |
| Density | `.ds-density-*` | the bar | the gap between head, track and legend 1px per step |
| Shape | `.ds-shape-*` | the track's ends, the marker | times `--ds-shape`, never above half the track |
| Tone | `.ds-tone-*` | a part itself; an inherited tone is ignored | neutral, warning and error the chart roles, the others the tone |
| Touch | | | not read: nothing here is a target |

**Status never by colour alone.** Every part is named in the legend and in the track's label; a tone on a part
(errors, warnings) is named there in words too.

### Accessibility

The track is `role="img"` with an `aria-label` that names every part with its figure and share, and the marker in
words; the legend repeats it for the eye and is `aria-hidden="true"`. Or the other way round: the track
`aria-hidden="true"` and the legend read as a list. One of the two, never both. Nothing takes focus.

### Forced colours

The parts are `CanvasText`, series 2 to 4 hatched as their legend keys (45, 135 and 90 degrees), with `Canvas` gaps
and a `CanvasText` edge round the track; the marker is `CanvasText` with a `Canvas` hairline. Printed, the parts keep
their colours.

### Hooks

`--ds-category-bar-height`, `--ds-category-bar-gap`: see [theming.md](theming.md).

**Motion:** the shares glide on `--ds-ease-value` over `--ds-dur-glide` (the widths follow); the first render fills
from zero with `.ds-enter--fill` on the parts; the legend's figures count with `DS.motion.countUp()`.
