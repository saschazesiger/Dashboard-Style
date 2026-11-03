## Progress

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

- **The 2024 look** (the default): the bar ends at the share, a gap (`--ds-progress-gap`, 4px) follows, then the
  remaining track (`--ds-progress-track`, `--ds-accent`) with a stop dot at its end (`--ds-progress-stop`,
  `--ds-primary`). The bar is wavy and its wave travels; at `aria-valuenow="100"` (with the documented
  `aria-valuemax="100"`) the wave stops and the flat bar fades in.
- **`.ds-progress--flat`**: the classic look, no gap, no dot, no wave. Use it in dense table cells: the wave reaches
  3px above and below the 4px track, and an ancestor with `overflow: hidden` closer than that clips it.
- **`.ds-progress--indeterminate`**: two segments run across the track (the M3 choreography). When the modifier
  drops, set the first share in the same task: the segments stop and fade out, the bar fades in and grows from 0 to
  its share (it never sweeps across or shrinks from 100%). A share set earlier, while indeterminate, simply
  appears at that share.
- **`.ds-progress--waiting`** hides the track and keeps the labels. The track keeps its 4px, so the label stays put
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

**Motion:** the "Progress" row of [Feedback](motion.md#feedback) in motion.md.

