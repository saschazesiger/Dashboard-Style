# Proposal: the wheel and the shimmer

**Status:** proposed, not scheduled. Additive (two utility classes, a `DS.motion` export, two keyframes, hooks and
two colour roles), so it fits a 2.x minor release and follows "Making a change" in [AGENTS.md](../AGENTS.md).

A project asked for a live status line that says what is running right now (a job's current step, an assistant's
"Thinking" / "Running npm test" / "Writing") and that feels alive without a spinner or a bar. It built the two
pieces below as project components, written as Dashboard-Style components are, so they can move here as they are.
The project's implementation is the reference: the classes there carry the project's prefix, and its design notes
link to this file. This plan names no project (`test/repo.test.js`); everything it needs is in it.

Both are meant to stay in the background: a line that changes should be noticed, not watched. The two pieces are
independent: a wheel can roll lines without a shimmer, and a shimmer can run on any text.

## What is missing

| Need | Today | Why that is not enough |
|---|---|---|
| A status line whose text changes often, readable at every step, quiet enough to stay in the background | `DS.motion.roll()` on a `.ds-swap`: the old line rolls up a whole line and out, the new one rolls up from below on the spring | `roll()` needs the imperative call: a line drawn by `DS.dom.morphHtml()` changes its text in place and never rolls. Its two lines run on different curves (the exit accelerating, the entrance on the spring, half a `--ds-dur-fast` later), so they read as one line leaving and another arriving, not as one replacing the other, and the spring draws the eye on a line that changes every few seconds |
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
| Glide | `translateY(0)` to `translateY(calc(-1 * var(--ds-wheel-travel)))` | `translateY(var(--ds-wheel-travel))` to `translateY(0)` |
| Curve | `--ds-dur-slow`, `--ds-ease-in-out`, the same for both lines and starting together: one strip | |
| Fade | to 0 on the slide's curve, `--ds-ease-in-out` | from 0 on the slide's curve, `--ds-ease-in-out` |

- **The new line pushes the old one out.** `--ds-wheel-travel` is 100%, a line's own height: the two lines stand one
  line apart and move as one strip, like the drum of a counter. The old line leaves through the slot's soft top
  edge, the new one comes up through the soft bottom edge; they never lie on each other. A version that faded the
  old line in place first and brought the new one after it read as "gone, then something else", not as "replaced".
- **Each fade runs on its line's slide.** A line is only as visible as it is inside the slot: its opacity follows how
  far it has come in or gone out, so the fade and the glide share the curve and the timing. A first version faded
  the new line in on `--ds-ease-out` while it slid on `--ds-ease-in-out`: the fade ran ahead of the slide, and a line
  that was still half below the slot's edge already showed nearly opaque, cut in two by the edge.
- **Only translate and opacity.** A first version turned the lines round a drum (`rotateX` with a perspective) and
  blurred them as they turned away. In Chromium the text of a 3D-transformed or filtered layer is drawn soft while
  it moves and turns sharp only once it rests, and the filter repaints every frame: the new line came in blurry,
  seemed larger, and snapped sharp at the end. A glide keeps the text as sharp in motion as at rest.
- **Quiet on purpose.** No spring and no overshoot: the strip decelerates into place on the standard curve. The line
  is background information, so its change should be noticed, not watched.
- The slot is one grid cell (like `.ds-swap`) with a soft edge (like `.ds-swap--fade`): `--ds-wheel-fade` of room
  above and below, given back by a negative margin, and a static vertical mask. Nothing in the mask animates. Each
  line is as wide as its text (`justify-self: start`, capped at the slot). The edge is `--ds-space-3`: wide enough
  that a line fades on its way out rather than being cut.
- **Hold.** Every line is shown for at least `--ds-hold-status` from the start of its roll. A change during the hold
  waits (its line hidden in the delay phase of its entrance, `fill: backwards`; the old line's exit waits as
  long); a later change takes the waiting line's place, and the waiting line goes at once without ever showing. A
  quick run of changes therefore rolls once, to the last, never flickers. A line that has not shown yet holds
  nothing: the line that replaces it takes its time instead of waiting out a new hold, so the slot is never left
  empty (the first version left it empty for most of a hold when a line was replaced before it came in).
- **Interruption.** A line removed during its own entrance glides out from where it is (its computed transform and
  opacity), never from the start. A line removed before its entrance began (one that waited out a hold) goes at
  once. The line that goes and
  the line that comes in one change (one morph, one task) share the roll's delay.
- **First render.** A slot that is new shows its line at once; only a line inserted into a slot that was already
  there rolls.
- **Accessibility.** The leaving line is `aria-hidden` and `inert` (the morph's pending removal, or the export's own).
  The slot is no live region of its own; a page that wants the changes announced puts the slot in one and keeps it
  quiet (`aria-live="polite"`), and keeps ticking figures out of it.

### Reference implementation

CSS (a utility in `src/motion.css`, `ds.utilities`, next to `.ds-swap`):

```css
.ds-wheel {
  --ds-wheel-travel: 100%;
  display: inline-grid;
  grid-template-columns: minmax(0, 1fr);
  min-width: 0;
  padding-block: var(--ds-wheel-fade, var(--ds-space-3));
  margin-block: calc(-1 * var(--ds-wheel-fade, var(--ds-space-3)));
  -webkit-mask-image: linear-gradient(to bottom, transparent, #000 var(--ds-wheel-fade, var(--ds-space-3)), #000 calc(100% - var(--ds-wheel-fade, var(--ds-space-3))), transparent);
  mask-image: linear-gradient(to bottom, transparent, #000 var(--ds-wheel-fade, var(--ds-space-3)), #000 calc(100% - var(--ds-wheel-fade, var(--ds-space-3))), transparent);
}

.ds-wheel > * {
  grid-area: 1 / 1;
  justify-self: start;
  min-width: 0;
  max-width: 100%;
}
```

JS (in `src/js/motion.js`; `motionDuration`, `motionEasing` are the module's own):

```js
const wheels = new WeakMap(); // slot -> { restAt, turn, last }

// A line still in the delay of its entrance has not shown.
const unseen = (line) => !!line && line.isConnected && line.getAnimations()
  .some((a) => a.playState !== 'finished' && Number(a.currentTime) <= Number(a.effect.getTiming().delay));

function wheelDelay(slot) {
  let state = wheels.get(slot);
  if (!state) wheels.set(slot, (state = { restAt: -Infinity, turn: null, last: null }));
  if (!state.turn) {
    const now = performance.now();
    state.restAt = unseen(state.last) ? Math.max(now, state.restAt)
      : Math.max(now, state.restAt + motionDuration(slot, '--ds-hold-status'));
    state.turn = { at: state.restAt };
    queueMicrotask(() => { state.turn = null; });
  }
  return Math.max(0, state.turn.at - performance.now());
}

const travelOf = (slot) => getComputedStyle(slot).getPropertyValue('--ds-wheel-travel').trim() || '100%';

// One line's part of the turn: the same glide for both lines (one strip), the opacity on the glide's own
// curve, so a line is only as visible as it is inside the slot.
function wheelGlide(line, slot, from, to, opacity, delay, fill) {
  const duration = motionDuration(slot, '--ds-dur-slow');
  const glide = line.animate([{ transform: from }, { transform: to }], {
    duration, delay, easing: motionEasing(slot, '--ds-ease-in-out'), fill,
  });
  const fade = line.animate([{ opacity: opacity[0] }, { opacity: opacity[1] }], {
    duration, delay, easing: motionEasing(slot, '--ds-ease-in-out'), fill,
  });
  return Promise.all([glide.finished, fade.finished]).then(() => {}, () => {});
}

function wheelIn(line, slot, delay) {
  wheels.get(slot).last = line;
  wheelGlide(line, slot, `translateY(${travelOf(slot)})`, 'translateY(0)', [0, 1], delay, 'backwards');
}

function wheelOut(line, slot, delay) {
  const running = line.getAnimations();
  if (unseen(line)) {
    running.forEach((a) => a.cancel());
    return null; // never showed: goes at once
  }
  const style = getComputedStyle(line);
  const from = style.transform === 'none' ? 'translateY(0)' : style.transform;
  const opacity = Number(style.opacity);
  running.forEach((a) => a.cancel());
  return wheelGlide(line, slot, from, `translateY(calc(-1 * ${travelOf(slot)}))`, [opacity, 0], delay, 'forwards');
}

const wheelOf = (line) => (line?.parentElement?.classList.contains('ds-wheel') ? line.parentElement : null);

export const wheelHooks = {
  onInsert(node) { const slot = wheelOf(node); if (slot) wheelIn(node, slot, wheelDelay(slot)); },
  onRemove(node) { const slot = wheelOf(node); return (slot && wheelOut(node, slot, wheelDelay(slot))) || undefined; },
};
```

`wheel(slot, text)` appends a `.ds-wheel__line` with the text, calls `wheelIn`, and runs `wheelOut` on the lines
before it (marked `aria-hidden` and `inert`), removing each when its promise settles; the same text again changes
nothing.

Open for the adoption: whether the export is a new `wheel()` or `roll(el, text, { quiet: true })` (then `.ds-swap`
would take the wheel's timing under a modifier, `.ds-swap--quiet`), which would also give `roll()` the morph hooks;
and whether the glides move into `motion.css` as keyframes (`ds-roll-in` / `ds-roll-out` with
`--ds-motion-distance` already come close). The reference uses `el.animate()` because the exit must start from
wherever an interrupted entrance is.

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
  text, in `--ds-shimmer-glint` (white in every theme: over dark text it reads as a faint sheen passing, over light
  text in the dark theme as a soft glint).
- A horizontal mask shows the copy only in a soft band: transparent to 32%, `--ds-shimmer-peak` at 50%, transparent
  from 68% of a tile of `--ds-shimmer-length` (480px), repeated along the line. The peak is the glint's strength at
  its crest (55%: a sheen in the background, never wiping the words out; the first version's 80% at 200px/s was
  found too busy).
- The mask tile travels one `--ds-shimmer-length` per `--ds-loop-shimmer` (4.55s, the shape loader's round, linear),
  so the band drifts at about 105px/s and a short text sees one slow pass and a pause. Nothing else animates; the
  mask is the only repaint.
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
  -webkit-mask-image: linear-gradient(90deg, transparent 0 32%, var(--ds-shimmer-peak) 50%, transparent 68% 100%);
  mask-image: linear-gradient(90deg, transparent 0 32%, var(--ds-shimmer-peak) 50%, transparent 68% 100%);
  -webkit-mask-size: var(--ds-shimmer-length, 480px) 100%;
  mask-size: var(--ds-shimmer-length, 480px) 100%;
  -webkit-mask-repeat: repeat-x;
  mask-repeat: repeat-x;
  animation: ds-shimmer var(--ds-loop-shimmer) linear infinite;
}

@keyframes ds-shimmer {
  to { -webkit-mask-position: var(--ds-shimmer-length, 480px) 0; mask-position: var(--ds-shimmer-length, 480px) 0; }
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
| `--ds-shimmer-peak` | colour role | `color-mix(in srgb, var(--ds-text) 55%, transparent)` | the mask at the crest: only its alpha counts |
| `--ds-loop-shimmer` | loop | `calc(4550ms * var(--ds-time-scale, 1))` | one tile's travel |
| `--ds-shimmer-length` | hook | `480px` | one tile: the band and the pause after it |
| `--ds-wheel-travel` | hook | `100%` | how far a line glides as it goes or comes: one line, its own height |
| `--ds-wheel-fade` | hook | `--ds-space-3` | the soft edge above and below the slot |

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
  changes in one task leave one leaving line, not two), a line replaced while it waited out a hold (the next one takes
  its time, no second hold), an interrupted entrance (the exit starts at the computed offset), one strip (both
  lines start together on the same curve, one line apart, and each fade runs on that curve), the accessible name without the copy, forced colours.
