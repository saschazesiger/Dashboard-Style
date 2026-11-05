## Wheel

A live status line that says what is running right now ("Thinking", "Running npm test", "Writing"), readable at every
step and quiet enough to stay in the background: a new line pushes the old one out, like the drum of a counter. Put
a `.ds-shimmer` on the line for "something is at work".

```html
<span class="ds-wheel">
  <span class="ds-wheel__line" data-ds-key="Thinking">Thinking</span>
</span>

<!-- or: the module draws the lines, a change of the attribute rolls -->
<span class="ds-wheel" data-ds-wheel="Thinking" data-ds-wheel-shimmer></span>
```

Two ways to draw the lines, never both on one slot:

- **The page renders them** and re-renders with `DS.dom.morphHtml(container, markup, DS.wheel.hooks)`. Key each line by
  what it says (`data-ds-key`): a new text is a new key, so the morph inserts a line and removes the old one, and the
  hooks turn them. The same key with other children (a figure that ticks inside the line) is patched in place and does
  not roll. Merge the hooks with `DS.motion.flip()`'s or the page's own where both are needed.
- **The module renders them**: `data-ds-wheel` holds the text (`DS.init()` finds it, and a change of the attribute
  rolls), or `DS.wheel.roll(slot, text)` and `DS.wheel.create(slot, options)` from a script. Its lines carry
  `data-ds-keep`, so a re-render around the slot keeps them: render the slot empty and change only the attribute.
  `data-ds-wheel-shimmer` (or `shimmer: true`) makes every new line a `.ds-shimmer`.

```js
DS.dom.morphHtml(status, `<span class="ds-wheel"><span class="ds-wheel__line" data-ds-key="${esc(step)}">${esc(step)}</span></span>`, DS.wheel.hooks);
DS.wheel.roll(slot, 'Running npm test', { shimmer: true });   // a line of its own; resolves when it rests
const line = DS.wheel.create(slot, { text: 'Thinking', shimmer: true });   // or DS.core.get(slot, 'wheel')
line.set('Writing');                                          // rolls; ds:change { text } on the slot
line.get();                                                   // 'Writing'
line.on('change', ({ text }) => {});
DS.wheel.turnAt(restAt, now, hold, shown);                    // the hold's arithmetic (the ms a turn starts at)
```

| Export | What |
|---|---|
| `hooks` | `{ onInsert, onRemove }` for `DS.dom.morphHtml()`: a line inserted into a `.ds-wheel` rolls in, one removed rolls out (kept as a pending removal until then); other nodes are left to the morph |
| `roll(slot, text, { shimmer })` | rolls the slot to a line of its own with `text`; an empty slot shows it at once; the same text again changes nothing (`shimmer` switches the current line's shimmer). Returns a promise that resolves when the new line rests |
| `create(slot, { text, shimmer })` | the controller (below) of a slot the module draws; its first text shows at once |
| `turnAt(restAt, now, hold, shown)` | when the next turn starts: after the hold of the line that showed last, at once for the first turn, and at its own time when the last line never showed |

The controller: `get()` (the text), `set(text, { shimmer })` (rolls), `on('change', fn)` (returns the unsubscribe) and
`destroy()`; `ds:change` with `{ text }` bubbles from the slot after a `set()` that changed the text.

**Options.** None of its own: it takes the type, colour and line height of where it sits (a status row, a summary), so
size and density reach it through its host; shape and tone have nothing to act on. Each line is as wide as its text,
capped at the slot, and cut with an ellipsis.

**Accessibility.** The leaving line is `aria-hidden` and `inert` (the morph's pending removal, or the module's own).
The slot is no live region of its own: a page that wants the changes announced puts the slot in one
(`aria-live="polite"`) and keeps ticking figures (an elapsed time, a count) out of it, so only a new step is spoken.

**Forced colours.** Nothing of its own: the soft edge is a mask, a shape, so it stays.

**Hooks.** `--ds-wheel-travel` (100%: how far a line glides, one line, its own height), `--ds-wheel-fade`
(`--ds-space-3`: the soft edge above and below the slot, given back by a negative margin)
([theming.md](theming.md#component-hooks)).

**Motion.** Both lines glide together, one `--ds-wheel-travel` apart, on `--ds-dur-slow` and `--ds-ease-in-out`: the
old line up and out through the slot's soft top edge, the new one up from below through the bottom edge. Each line's
opacity runs on its glide's curve, so a line is only as visible as it is inside the slot. Only translate and opacity:
on the standard curve, never 3D and never a blur, so the text stays as sharp in motion as at rest.

- **Hold.** Every line shows for at least `--ds-hold-status` from the start of its roll. A change during the hold
  waits (its line hidden in the delay of its entrance; the old line's exit waits as long); a later change takes the
  waiting line's place, and the waiting line goes at once without ever showing. A quick run of changes rolls once, to
  the last, and never flickers. A line that has not shown holds nothing: the line that replaces it takes its time.
- **Interruption.** A line removed during its own entrance glides out from where it is (its computed transform and
  opacity), held there through any delay; when its exit waits out a hold that outlasts the entrance, the entrance
  first runs to its end, so the line never jumps. The line that goes and the line that comes in one task share the turn's delay.
- **First render.** A slot that is new shows its line at once; only a line inserted into a slot that was already there
  rolls.

<!-- changelog -->
- Wheel (`.ds-wheel`, `DS.wheel`): a live status line whose new line pushes the old one out, with a hold so a quick run
  of changes rolls once; morph hooks (`DS.wheel.hooks`), `DS.wheel.roll()`, `DS.wheel.create()` and `data-ds-wheel`.
  Hooks `--ds-wheel-travel`, `--ds-wheel-fade`. The reference implementation of plans/wheel-and-shimmer.md, as a
  component module (`DS.wheel.hooks` and `DS.wheel.roll` stand for the plan's `DS.motion.wheelHooks` and
  `DS.motion.wheel`).
