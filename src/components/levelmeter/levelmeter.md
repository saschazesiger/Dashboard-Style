## Level meter

The live level of a microphone (or any signal) as a bar, with a peak mark that holds and falls, and a word when it is
too loud. For a microphone check before a call, a recording, a voice note.

```html
<div class="ds-levelmeter" data-ds-levelmeter>
  <span class="ds-levelmeter__label" id="mic-label">Microphone</span>
  <div class="ds-levelmeter__track" role="meter" aria-labelledby="mic-label"
       aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
    <span class="ds-levelmeter__fill"></span>
    <span class="ds-levelmeter__peak"></span>
  </div>
  <span class="ds-levelmeter__note" aria-live="polite"></span>
</div>
```

```js
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const context = new AudioContext();
const analyser = context.createAnalyser();
context.createMediaStreamSource(stream).connect(analyser);
const meter = DS.levelmeter.create(el, { analyser });     // or DS.core.get(el, 'levelmeter').listen(analyser)
```

| Part | What |
|---|---|
| `.ds-levelmeter__label` | the name, above the track |
| `.ds-levelmeter__track` | the meter (`role="meter"`), the track in `--ds-levelmeter-track` (`--ds-accent`); the script writes `aria-valuenow` (0 to 100) and `aria-valuetext` ("-18 dB", `levelmeterValue`) at most once per `--ds-hold-status` |
| `.ds-levelmeter__fill` | the level, scaled from the start of the track by `--ds-levelmeter-level` (0 to 1, the script's, every frame), in `--ds-levelmeter-fill` (`--ds-primary`) |
| `.ds-levelmeter__peak` | the highest recent level (`--ds-levelmeter-peak`): it holds `--ds-hold-status`, then falls; `hidden` while nothing was heard |
| `.ds-levelmeter__note` | a word for the state: "Too loud" (`levelmeterLoud`) while the level clips; `aria-live="polite"` says it |

| Variant | Class | Look |
|---|---|---|
| Bar | | one bar |
| Segmented | `.ds-levelmeter--segmented` | the track cut into segments of `--ds-levelmeter-segment` (6px) with a 2px gap |
| Vertical | `.ds-levelmeter--vertical` | upright, the level grows upwards over `--ds-levelmeter-length` (96px) |

**States.** `data-state="loud"` (the script's, on `.ds-levelmeter`) while the signal clips, a sample peak at -1 dBFS
or above, and for `--ds-hold-status` after: the fill and the peak in `--ds-error`, and the note says it in words. `aria-disabled="true"` on the
track (the page's: a muted microphone) shows the disabled model and no level; say "Muted" in the label or the note.

**The level.** `DS.levelmeter.level(samples)` is the RMS of a block of samples in dBFS, mapped from -60 dB (0) to 0 dB (1),
so speech sits in the middle of the track and silence at its start; `decibels(value)` maps back. The meter rises at once and
falls over `--ds-dur-glide` per full scale; the peak holds `--ds-hold-status`, then falls the same way. Clipping is decided
on the sample peak (`DS.levelmeter.peak(samples)`, the largest |x|), not on the RMS: a full-scale sine reads -3 dB on the
bar and clipped speech far less, but their peaks reach -1 dBFS (about 0.891). A page with its own level (a server's value, a
recorder's) calls `set(value, { peak })` instead; without `peak` the level itself decides (loud from -1 dBFS on the meter's
scale). The meter runs left to right in either writing direction, like its scale.

| Export | What |
|---|---|
| `DS.levelmeter.create(el, { analyser, floor })` | the controller of a meter: `get()` (`{ level, peak, loud }`), `set(value, { peak })`, `listen(analyser)` (returns a function that lets go), `on('change')` (`{ loud }`, also `ds:change` on `.ds-levelmeter`, only when the loud state changes), `destroy()` |
| `DS.levelmeter.level(samples, { floor })` | the level (0 to 1) of a block of samples (floats from -1 to 1, `getFloatTimeDomainData()`) |
| `DS.levelmeter.peak(samples)` | the sample peak (0 to 1) of a block of samples; from about 0.891 (-1 dBFS) the meter is loud |
| `DS.levelmeter.decibels(value, { floor })` | the dBFS of a level, rounded; `-Infinity` at 0 |

The loop runs only while an analyser is attached or the bar still falls, and stops on `destroy()`. Stopping the
microphone (`track.stop()` of the stream) is the page's.

**Options** ([options.md](options.md)):

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Size | `.ds-xs` ... `.ds-xl` | the meter or any ancestor | the thickness 2px per step (2 to 10px around the 6px md, `--ds-levelmeter-height`) |
| Shape | `.ds-shape-*` | any container | the ends of the track times `--ds-shape`: round at the default, square at 0 |
| Density | `.ds-density-*` | any container | the label's and the note's distance from the track, 2px per step |
| Tone | `.ds-tone-*` | on `.ds-levelmeter` itself | the fill in `--ds-tone`, the track in `--ds-tone-container`; loud still wins |
| Touch | | | not read: a meter is no target |

**Accessibility.** `role="meter"` with a name (the label) and the value in words ("-18 dB"), updated a few times a second at
most, so a screen reader reads it when asked and is never flooded. "Too loud" is a word in a polite live region; the red is
never alone. A muted microphone is `aria-disabled="true"` plus a word.

**Forced colours.** The track keeps a `CanvasText` outline on `Canvas`, the level is `Highlight`, the peak `CanvasText`;
loud stays a word.

**Motion.** The level is live data and moves every frame without a transition: the meter's ballistics (rise at once, fall over
`--ds-dur-glide` per full scale, the peak's hold of `--ds-hold-status`). The loud colour comes and goes on `--ds-dur-fast`.

Hooks: `--ds-levelmeter-height`, `--ds-levelmeter-fill`, `--ds-levelmeter-track`, `--ds-levelmeter-segment`,
`--ds-levelmeter-length` ([theming.md](theming.md#component-hooks)).
