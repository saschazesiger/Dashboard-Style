## Bar list

Ranked rows of a label and a figure, each on a bar as long as its share of the largest value: tickets per device
type, top pages, errors per service. A few categories at a glance, where a chart would be too much.

```html
<ol class="ds-bar-list" aria-label="Open tickets per device type">
  <li class="ds-bar-list__item" style="--ds-share: 1">
    <span class="ds-bar-list__label">[icon printer 16]<span>Printers</span></span>
    <span class="ds-bar-list__value">412</span>
  </li>
  <li class="ds-bar-list__item" style="--ds-share: .42">
    <a class="ds-bar-list__label" href="/tickets?type=laptop"><span>Laptops</span></a>
    <span class="ds-bar-list__value">173</span>
  </li>
  <li class="ds-bar-list__item ds-tone-error" style="--ds-share: .12">
    <span class="ds-bar-list__label">[icon alert 16]<span>Routers, 3 failing</span></span>
    <span class="ds-bar-list__value">49</span>
  </li>
</ol>
```

The page sorts the rows and sets each row's `--ds-share` (0 ... 1, the value over the largest one) with
`style.setProperty('--ds-share', ...)`. The bar sits behind the label and is clipped at the share, so its corners
keep their shape. A label that does not fit ends in an ellipsis on its bar, and the figure is never cut. A row
that opens something holds an `<a class="ds-bar-list__label">`: the link takes focus, not the row.

| Part or variant | Class | What |
|---|---|---|
| List | `.ds-bar-list` | an `<ol>` (ranked) or `<ul>` with a name; a grid, so every figure lines up at the end |
| Row | `.ds-bar-list__item` | the bar behind the label, the figure after it; `--ds-share` is the bar's length |
| Label | `.ds-bar-list__label` | an optional 16px icon and the words (in a `<span>`), or a link |
| Figure | `.ds-bar-list__value` | tabular figures, never cut |
| Plain | `.ds-bar-list--plain` | the bars in the track colour, for a list where a tint would be loud |

### Options

On the list or any ancestor, except the tone; each is computed in this component's own rules ([options.md](options.md)).

| Option | Classes | Applies to | Effect |
|---|---|---|---|
| Size | `.ds-xs` ... `.ds-xl` | a row | 8px of height per step (16px to 48px; 32px at md) |
| Density | `.ds-density-*` | a row, the list | 4px of height per step, the gap between rows 1px per step |
| Shape | `.ds-shape-*` | the bar | its corners times `--ds-shape`, never above half the row |
| Tone | `.ds-tone-*` | the row itself; an inherited tone is ignored | the bar takes the tone's container, the label its ink |
| Touch | `.ds-touch` | a row with a link | at least `--ds-target-min` high |

**Status never by colour alone.** A tone marks a row that stands out, and its words say why ("Routers, 3 failing",
an icon): the tint adds nothing of its own.

### Accessibility

A list with a name (`aria-label`, or `aria-labelledby` its heading). Each row reads its label and its figure; the bar
is a background and says nothing. A unit or a context the figure needs ("173 tickets") goes into the words, or as a
`.ds-sr` span. Only a link in a label takes focus, with the inset ring.

### Forced colours

Each bar becomes an outline of `CanvasText` that ends, closed, at its share, the text `CanvasText`, so the lengths
still compare.
Printed, the bars keep their colours.

### Hooks

`--ds-bar-list-height`, `--ds-bar-list-bar`, `--ds-bar-list-ink`: see [theming.md](theming.md).

**Motion:** a new share glides on `--ds-ease-value` over `--ds-dur-glide`; the first render fills from zero with
`.ds-enter--fill` (`DS.motion.enterAll(rows, 'fill')`); a figure counts with `DS.motion.countUp()`; reorders go through
`DS.motion.flip()` (the "Data motion" rules of [motion.md](motion.md#data-motion)).
