## Slider

A value on a scale (a threshold, days of history), drawn on the native range input, so keyboard, forms and labels stay
native.

```html
<div class="ds-field">
  <label class="ds-field__label" for="keep">Keep history for</label>
  <div class="ds-field__row">
    <input class="ds-slider" id="keep" type="range" min="7" max="365" value="90" aria-describedby="keep-out">
    <output class="ds-slider__value" id="keep-out" for="keep">90 days</output>
  </div>
</div>
```

**Options** ([options.md](options.md)): classes on the slider or any ancestor; the nearest wins.

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Size | `.ds-xs`, `.ds-sm`, `.ds-md`, `.ds-lg`, `.ds-xl` | the slider or a container | 24, 32, 40, 48, 56px high with the halo (8px per step), the track 2 to 6px, the handle 12 to 28px, the value's type role |
| Density | `.ds-density-comfortable`, `-compact`, `-dense`, `-tight` | any container | 4px less height and halo per step; the handle and the track stay |
| Shape | `.ds-shape-square`, `-soft`, `-default`, `-round` | any container or the theme | the radius of the track and of the handle: round at the default, square at 0; the halo is the handle's shadow, so it follows the handle's shape |
| Touch | `.ds-touch` | the theme or a container | at least `--ds-touch-target` (48px) high, with the halo |

A 4px track in `--ds-accent` with its active part in `--ds-primary`, a 20px handle with a halo
(`--ds-slider-halo`, 40px) for hover, press and keyboard focus (like the switch: the halo is the press, no ripple,
and the handle never scales), the focus ring on the handle. Firefox draws the active part itself; elsewhere the page
sets `--ds-share` (the value's share of the range, 0 to 1) on the input when it renders and on every `input` event,
and keeps the `<output>` in step (without `--ds-share` the track shows no active part, and the slider still works):

```js
const share = () => { slider.style.setProperty('--ds-share', String((slider.value - slider.min) / (slider.max - slider.min)));
  output.value = `${slider.value} days`; };
slider.addEventListener('input', share); share();
```

- Keyboard and names: the native range input: Tab reaches it, the arrow keys step, Home and End jump, Page Up and Page
  Down take bigger steps. Name it with a `<label>`; `aria-describedby` on the `<output>` reads the value's words.
- Disabled and `aria-disabled` sliders take the disabled ink and no halo; `aria-disabled` keeps the slider in the tab
  order with its focus halo, and the action guard of `DS.motion` ([motion.md](motion.md)) holds its value: a press, a
  drag or a key moves nothing and no `input` or `change` reaches the page, so the page needs no guard of its own.
- Forced colours: the track in `ButtonText`, the handle in `Highlight` (`GrayText` when blocked), a focused handle a
  `CanvasText` ring.
- Hooks: `--ds-slider-halo`, `--ds-slider-thumb-size`, `--ds-slider-track-height`
  ([theming.md](theming.md#component-hooks)).

**Motion:** the slider row of [Controls](motion.md#controls) in motion.md.
