# Proposal: the wheel and the shimmer

**Status:** proposed, not scheduled. Additive (two utility classes, a `DS.motion` export, two keyframes, hooks and
two colour roles), so it fits a 2.x minor release and follows "Making a change" in [AGENTS.md](../AGENTS.md).

A project asked for a live status line that says what is running right now (a job's current step, an assistant's
"Thinking" / "Running npm test" / "Writing") and that feels alive without a spinner or a bar. It built the two
pieces below as project components, written as Dashboard-Style components are, so they can move here as they are.
The project's implementation is the reference: the classes there carry the project's prefix, and its design notes
link to this file. This plan names no project (`test/repo.test.js`); everything it needs is in it.

The two pieces are independent: a wheel can roll lines without a shimmer, and a shimmer can run on any text.

## What is missing

| Need | Today | Why that is not enough |
|---|---|---|
| A status line whose text changes often, readable at every step | `DS.motion.roll()` on a `.ds-swap`: the old line slides up and out, the new one slides up from below | A flat slide reads as "replaced". The request was a turn, like the face of a wheel or a slot machine drum: the old line tilts away over the top, the new one tilts up into place, and lines that blur and fade as they turn away. `roll()` also needs the imperative call; a line drawn by `DS.dom.morphHtml()` changes its text in place and never rolls |
| "Something is at work" on the text itself | A spinner, the shape loader, an indeterminate bar | All three add an element beside the text. The look asked for is the one of current AI assistants: a soft white wave that travels over the words, left to right, a pass and a pause, and nothing else on the line moves |

## The wheel

### Markup

```html
<span class="ds-wheel">
  <span class="ds-wheel__line" data-ds-key="Thinking">Thinking</span>
</span>
```

Every line is keyed by what it says. Drawn with `DS.dom.morphHtml()` and the wheel's hooks, a new text is a new key,
so the morph inserts a new line and removes the old one, and the hooks turn them. The same key with other children
(a figure that ticks inside the line) is patched in place and does not roll.

```js
DS.dom.morphHtml(container, markup, DS.motion.wheelHooks);          // or merged with flip()'s or a page's own hooks
DS.motion.wheel(slot, 'Running npm test');                           // without a morph: a line of its own, rolled in
```

### Look and choreography

| | Old line | New line |
|---|---|---|
| Turn | `rotateX(0)` to `rotateX(var(--ds-wheel-angle))`, `--ds-dur-slow`, `--ds-ease-spatial` | `rotateX(calc(-1 * var(--ds-wheel-angle)))` to `rotateX(0)`, the same duration and curve: one rotation of one drum |
| Fade | to 0 over `--ds-dur-base`, `--ds-ease-in` (gone before it is edge on) | from 0 over `--ds-dur-medium`, `--ds-ease-in-out` |
| Blur | to `--ds-wheel-blur` | from `--ds-wheel-blur` |

- Both lines turn round one axis behind the text: `transform-origin: 50% 50% calc(-1 * var(--ds-wheel-depth))`, so a
  positive angle carries a line up and away, a negative one brings it from below.
- Each line has its own `perspective(calc(var(--ds-wheel-depth) * 12))` in its transform and its own width
  (`justify-self: start`), so a short line in a wide slot turns straight instead of leaning towards the slot's
  middle (a `perspective` on the slot did that).
- The slot is one grid cell (like `.ds-swap`) with a soft edge (like `.ds-swap--fade`): `--ds-wheel-fade` of room
  above and below, given back by a negative margin, and a static vertical mask. Nothing in the mask animates.
- **Hold.** Every line is shown for at least `--ds-hold-status` from the start of its turn. A change during the hold
  waits (its line hidden in the delay phase of its entrance, `fill: backwards`; the old line's exit waits as
  long); a later change takes the waiting line's place, and the waiting line goes at once without ever showing. A
  quick run of changes therefore rolls once, to the last, never flickers.
- **Interruption.** A line removed during its own entrance turns out from where it is (its computed transform,
  filter and opacity), never from the start. A line removed before its entrance began goes at once. The line that
  goes and the line that comes in one change (one morph, one task) share the turn's delay.
- **First render.** A slot that is new shows its line at once; only a line inserted into a slot that was already
  there rolls.
- **Accessibility.** The leaving line is `aria-hidden` and `inert` (the morph's pending removal, or the export's own).
  The slot is no live region of its own; a page that wants the changes announced puts the slot in one and keeps it
  quiet (`aria-live="polite"`), and keeps ticking figures out of it.

### Reference implementation

CSS (a utility in `src/motion.css`, `ds.utilities`, next to `.ds-swap`):

```css
.ds-wheel {
  --ds-wheel-angle: 70deg;
  --ds-wheel-depth: 0.9em;
  --ds-wheel-blur: 2px;
  display: inline-grid;
  grid-template-columns: minmax(0, 1fr);
  min-width: 0;
  padding-block: var(--ds-wheel-fade, var(--ds-space-2));
  margin-block: calc(-1 * var(--ds-wheel-fade, var(--ds-space-2)));
  -webkit-mask-image: linear-gradient(to bottom, transparent, #000 var(--ds-wheel-fade, var(--ds-space-2)), #000 calc(100% - var(--ds-wheel-fade, var(--ds-space-2))), transparent);
  mask-image: linear-gradient(to bottom, transparent, #000 var(--ds-wheel-fade, var(--ds-space-2)), #000 calc(100% - var(--ds-wheel-fade, var(--ds-space-2))), transparent);
}

.ds-wheel > * {
  grid-area: 1 / 1;
  justify-self: start;
  min-width: 0;
  max-width: 100%;
  transform-origin: 50% 50% calc(-1 * var(--ds-wheel-depth));
  backface-visibility: hidden;
}
```

JS (in `src/js/motion.js`; `motionDuration`, `motionEasing` are the module's own):

```js
const wheels = new WeakMap(); // slot -> { restAt, turn }

function wheelDelay(slot) {
  let state = wheels.get(slot);
  if (!state) wheels.set(slot, (state = { restAt: -Infinity, turn: null }));
  if (!state.turn) {
    const now = performance.now();
    state.restAt = Math.max(now, state.restAt + motionDuration(slot, '--ds-hold-status'));
    state.turn = { at: state.restAt };
    queueMicrotask(() => { state.turn = null; });
  }
  return Math.max(0, state.turn.at - performance.now());
}

function wheelLook(slot) {
  const style = getComputedStyle(slot);
  const depth = style.getPropertyValue('--ds-wheel-depth').trim() || '0.9em';
  return {
    angle: style.getPropertyValue('--ds-wheel-angle').trim() || '70deg',
    blur: style.getPropertyValue('--ds-wheel-blur').trim() || '0px',
    lens: `perspective(calc(${depth} * 12))`,
  };
}

function wheelIn(line, slot, delay) {
  const { angle, blur, lens } = wheelLook(slot);
  line.animate([
    { transform: `${lens} rotateX(calc(-1 * ${angle}))`, filter: `blur(${blur})` },
    { transform: `${lens} rotateX(0deg)`, filter: 'blur(0px)' },
  ], { duration: motionDuration(slot, '--ds-dur-slow'), delay, easing: animEasing(slot, '--ds-ease-spatial'), fill: 'backwards' });
  line.animate([{ opacity: 0 }, { opacity: 1 }], {
    duration: motionDuration(slot, '--ds-dur-medium'), delay, easing: animEasing(slot, '--ds-ease-in-out'), fill: 'backwards',
  });
}

function wheelOut(line, slot, delay) {
  const running = line.getAnimations();
  if (running.some((a) => a.playState !== 'finished' && Number(a.currentTime) <= Number(a.effect.getTiming().delay))) {
    running.forEach((a) => a.cancel());
    return null; // never showed: goes at once
  }
  const { angle, blur, lens } = wheelLook(slot);
  const style = getComputedStyle(line);
  const from = {
    transform: style.transform === 'none' ? `${lens} rotateX(0deg)` : style.transform,
    filter: style.filter === 'none' ? 'blur(0px)' : style.filter,
  };
  const opacity = Number(style.opacity);
  running.forEach((a) => a.cancel());
  const turn = line.animate([from, { transform: `${lens} rotateX(${angle})`, filter: `blur(${blur})` }], {
    duration: motionDuration(slot, '--ds-dur-slow'), delay, easing: animEasing(slot, '--ds-ease-spatial'), fill: 'forwards',
  });
  const fade = line.animate([{ opacity }, { opacity: 0 }], {
    duration: motionDuration(slot, '--ds-dur-base'), delay, easing: animEasing(slot, '--ds-ease-in'), fill: 'forwards',
  });
  return Promise.all([turn.finished, fade.finished]).then(() => {}, () => {});
}

const wheelOf = (line) => (line?.parentElement?.classList.contains('ds-wheel') ? line.parentElement : null);

export const wheelHooks = {
  onInsert(node) { const slot = wheelOf(node); if (slot) wheelIn(node, slot, wheelDelay(slot)); },
  onRemove(node) { const slot = wheelOf(node); return (slot && wheelOut(node, slot, wheelDelay(slot))) || undefined; },
};
```

`animEasing` is `motionEasing` checked once per value against `new KeyframeEffect(null, null, { easing })`, falling
back to `--ds-ease-out` where `el.animate()` rejects `linear()` (the `fallback` browser project). `wheel(slot, text)`
appends a `.ds-wheel__line` with the text, calls `wheelIn`, and runs `wheelOut` on the lines before it (marked
`aria-hidden` and `inert`), removing each when its promise settles; the same text again changes nothing.

Open for the adoption: whether the export is a new `wheel()` or `roll(el, text, { wheel: true })` (then `.ds-swap`
would take the wheel's look under a modifier, `.ds-swap--wheel`); and whether the keyframes move into `motion.css`
as `ds-wheel-in` / `ds-wheel-out` (the angle and blur as registered hooks, `--ds-motion-*` style) so the Motion Lab's
keyframe table lists them. The reference uses `el.animate()` because the exit must start from wherever an
interrupted entrance is.

## The shimmer

### Markup

```html
<span class="ds-shimmer" data-shimmer="Running npm test"><b>Running</b> npm test</span>
```

`data-shimmer` is the text as it reads (the same words and spaces). The text keeps its own colours and weights; the
wave is a copy of it on top, so it lies on the letters and is cut with the same ellipsis.

### Look

- `::after` with `content: attr(data-shimmer) / ""` (the alternative text keeps the copy out of the accessible name;
  an engine without that syntax drops the declaration and shows the text without a wave), absolutely over the
  text, in `--ds-shimmer-glint` (white in every theme: over dark text it reads as light passing, over light text in
  the dark theme as a brighter glint).
- A horizontal mask shows the copy only in a soft band: transparent to 38%, `--ds-shimmer-peak` at 50%, transparent
  from 62% of a tile of `--ds-shimmer-length` (400px), repeated along the line. The peak is the glint's strength at
  its crest (80%: light passes over the words, never wipes them out).
- The mask tile travels one `--ds-shimmer-length` per `--ds-loop-shimmer` (2s, linear), so the band moves at a calm
  200px/s and a short text sees one pass and a pause. Nothing else animates; the mask is the only repaint.
- Forced colours: the copy is left out (`content: none`).

### Reference implementation

```css
.ds-shimmer {
  position: relative;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.ds-shimmer::after {
  content: attr(data-shimmer) / "";
  position: absolute;
  inset: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--ds-shimmer-glint);
  pointer-events: none;
  -webkit-mask-image: linear-gradient(90deg, transparent 0 38%, var(--ds-shimmer-peak) 50%, transparent 62% 100%);
  mask-image: linear-gradient(90deg, transparent 0 38%, var(--ds-shimmer-peak) 50%, transparent 62% 100%);
  -webkit-mask-size: var(--ds-shimmer-length, 400px) 100%;
  mask-size: var(--ds-shimmer-length, 400px) 100%;
  -webkit-mask-repeat: repeat-x;
  mask-repeat: repeat-x;
  animation: ds-shimmer var(--ds-loop-shimmer) linear infinite;
}

@keyframes ds-shimmer {
  to { -webkit-mask-position: var(--ds-shimmer-length, 400px) 0; mask-position: var(--ds-shimmer-length, 400px) 0; }
}

@media (forced-colors: active) {
  .ds-shimmer::after { content: none; }
}
```

The project, which may not write keyframes of its own, runs the same travel on `ds-progress-wave` with
`--ds-progress-wave-length` set to the tile on the `::after`; a keyframe of its own here makes that coupling to the
progress bar go away.

## Tokens and hooks

| Name | Kind | Default | What |
|---|---|---|---|
| `--ds-shimmer-glint` | colour role | `#fff` (light and dark) | the wave |
| `--ds-shimmer-peak` | colour role | `color-mix(in srgb, var(--ds-text) 80%, transparent)` | the mask at the crest: only its alpha counts |
| `--ds-loop-shimmer` | loop | `calc(2s * var(--ds-time-scale, 1))` | one tile's travel |
| `--ds-shimmer-length` | hook | `400px` | one tile: the band and the pause after it |
| `--ds-wheel-angle` | hook | `70deg` | how far a line turns as it goes or comes |
| `--ds-wheel-depth` | hook | `0.9em` | the drum's axis behind the text (and, times 12, each line's perspective) |
| `--ds-wheel-blur` | hook | `2px` | how soft a turned-away line is |
| `--ds-wheel-fade` | hook | `--ds-space-2` | the soft edge above and below the slot |

`--ds-wheel-depth` is not called a radius on purpose: `check-project.mjs` reads any property with "radius" in its
name as a corner radius.

## Adoption checklist

- `src/motion.css`: `.ds-wheel`, `.ds-shimmer` (utilities), `@keyframes ds-shimmer` (and the wheel keyframes if they
  move to CSS); a row each in the keyframe and utility tables of `docs/motion.md`, a choreography row under
  Feedback.
- `src/js/motion.js`: `wheelHooks`, `wheel()`; `src/types/js/motion.d.ts`; the JS table of `docs/motion.md`.
- `src/tokens.css`: `--ds-loop-shimmer` with the other loops; the two colour roles after the palette marker, in
  `themes/example.css`, `themes/dark.css` (glint stays white) and `themes/contrast.css` (glint off or the text
  colour).
- `docs/components.md`: the markup above, and a "live status line" row in "Which component for which need".
- Motion Lab: a wheel demo (Replay, a rapid run of changes that rolls once, a change during a turn) and a shimmer
  demo at every speed of the speed select; `styleguide/lab.js` `shows` lists `ds-shimmer`, `.ds-wheel`,
  `.ds-shimmer`, `wheelHooks`, `wheel`.
- Tests: the hold (a change 200ms after a roll waits `--ds-hold-status` minus 200ms), the never-shown line (two
  changes in one task leave one leaving line, not two), an interrupted entrance (the exit starts at the computed
  angle), the accessible name without the copy, forced colours.
