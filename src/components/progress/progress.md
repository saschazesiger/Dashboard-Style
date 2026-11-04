## Progress

Shows how far a known or unknown amount of work has come.

```html
<div class="ds-progress" style="--ds-progress: .4">
  <div class="ds-progress__track" role="progressbar" aria-label="Import" aria-valuemin="0" aria-valuemax="100" aria-valuenow="40">
    <div class="ds-progress__bar"></div>
  </div>
  <p class="ds-progress__label">40%</p>
  <p class="ds-progress__detail">812 of 2,030 rows</p>
</div>
```

`--ds-progress` (0 to 1) sets the share (set it with `el.style.setProperty`, which a strict CSP allows). It is a
registered number that glides on `--ds-ease-value` over `--ds-dur-glide`: the bar, the remaining track and a
nested `.ds-spinner--determinate` land together, and on the same frame as a `DS.motion.countUp()` figure set in the
same task. The bar is cut at the share (a clip, never a scale), so its round cap keeps its shape at any share.

**Options** ([options.md](options.md)): classes on the progress or any ancestor, except the tone.

| Option | Classes | Where it applies | Effect on the progress |
|---|---|---|---|
| Variant | `--flat`, `--indeterminate`, `--waiting` | the progress | below |
| Label | `.ds-progress--label-above`, `.ds-progress--label-end`; none: under the track | the progress | where `.ds-progress__label` sits: over the track, or at its end in one row. `.ds-progress__detail` stays under the track |
| Size | `.ds-xs` ... `.ds-xl` | the progress or a group | the track's thickness, 2px per step (1, 2, 4, 6, 8px); the wave's height follows, its wavelength stays; type stays |
| Density | `.ds-density-*` | any container | the label's distance from the track, 2px per step (4px under `themes/compact.css`) |
| Shape | `.ds-shape-*` | any container or the theme | the ends of the bar and the track times 0, .5, 1, 1.5, at most half the height; the stop dot stays a dot |
| Tone | `.ds-tone-*` | the progress itself; an inherited tone is ignored | the bar and the stop dot in the tone, the remaining track in its container; the label says what it means ("Disk almost full"), never the colour alone |
| Touch | | | not read: progress is no target |

```html
<div class="ds-progress ds-progress--label-end ds-tone-warning ds-lg" style="--ds-progress: .92">
  <div class="ds-progress__track" role="progressbar" aria-label="Disk" aria-valuemin="0" aria-valuemax="100" aria-valuenow="92"><div class="ds-progress__bar"></div></div>
  <p class="ds-progress__label">92%, almost full</p>
</div>
```

- **The 2024 look** (the default): the bar ends at the share, a gap (`--ds-progress-gap`, 4px) follows, then the
  remaining track (`--ds-progress-track`, `--ds-accent`) with a stop dot at its end (`--ds-progress-stop`,
  `--ds-primary`). The bar (`--ds-progress-bar`, `--ds-primary`) is wavy and its wave travels; at `aria-valuenow="100"`
  (with the documented `aria-valuemax="100"`) the wave stops and the flat bar fades in. `--ds-progress-height` (4px) is
  the md base of the track.
- **`.ds-progress--flat`**: the classic look, no gap, no dot, no wave. Use it in dense table cells: the wave reaches
  3px above and below the 4px track, and an ancestor with `overflow: hidden` closer than that clips it.
- **`.ds-progress--indeterminate`**: two segments run across the track (the M3 choreography). When the modifier
  drops, set the first share in the same task: the segments stop and fade out, the bar fades in and grows from 0 to
  its share (it never sweeps across or shrinks from 100%). A share set earlier, while indeterminate, simply
  appears at that share.
- **`.ds-progress--waiting`** hides the track and keeps the labels. The track keeps its height, so the label stays put
  when the wait ends, and fades in over `--ds-dur-fast`.
- **Accessibility**: while `--indeterminate` or `--waiting` is on, the share is unknown: remove `aria-valuenow` and
  set `aria-valuetext` ("Preparing", "Waiting"). With the first share, set `aria-valuenow` again and remove
  `aria-valuetext`. `DS.dom.progress(el, share, { valueText, waiting })` (2.0,
  [motion.md](motion.md#dsdom-jsdomjs)) does all of it in one call, on a `.ds-progress`, a determinate spinner or a
  meter; set the share there or in the template, not both:

```js
DS.dom.progress(progress, null, { valueText: 'Preparing' });   // --indeterminate, no aria-valuenow
DS.dom.progress(progress, 0.3);                                  // the bar grows to 30%, aria-valuenow="30"
DS.motion.countUp(label, 30, { format: (value) => `${Math.round(value)}%` });   // lands on the same frame
```

**Keyboard.** None: progress is no stop of its own. **Forced colours.** The bar, its segments and the stop dot paint
`Highlight`, the remaining track `GrayText`, and the track keeps a `CanvasText` edge, in any tone; the label carries the
meaning. Print: the bar keeps its colours, so the share shows on paper.

**Motion:** the "Progress" row of [Feedback](motion.md#feedback) in motion.md.
