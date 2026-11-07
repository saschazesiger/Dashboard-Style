## Steps

Where the user is in a form of a few steps, or a record in the stages of a pipeline. A step is no button unless it holds
a `.ds-steps__link`: then the user may go to it.

```html
<ol class="ds-steps" aria-label="Report a problem">
  <li class="ds-steps__step" data-status="done">
    <span class="ds-steps__mark">[icon check 16, its path with pathLength="1"]</span>
    <span class="ds-steps__label">Device<span class="ds-sr">, done</span></span>
  </li>
  <li class="ds-steps__step" aria-current="step"><span class="ds-steps__mark">2</span><span class="ds-steps__label">Problem</span></li>
  <li class="ds-steps__step"><span class="ds-steps__mark">3</span><span class="ds-steps__label">Contact</span></li>
  <li class="ds-steps__step" data-status="optional">
    <span class="ds-steps__mark">4</span>
    <span class="ds-steps__label">Photos</span><span class="ds-steps__hint">Optional</span>
  </li>
</ol>

<!-- needs attention: an icon and a word -->
<li class="ds-steps__step" data-status="error">
  <span class="ds-steps__mark">[icon alertCircle 16]</span>
  <span class="ds-steps__label">Contact</span><span class="ds-steps__hint">Add a phone number</span>
</li>

<!-- or a column: the same items -->
<ol class="ds-steps ds-steps--vertical" aria-label="Report a problem"> ... </ol>

<!-- or a bar: the same items, the list says where the user is -->
<ol class="ds-steps ds-steps--bar" aria-label="Step 2 of 3"> ... </ol>

<!-- or a stage path: the same items as chevrons -->
<ol class="ds-steps ds-steps--path" aria-label="Ticket stages"> ... </ol>

<!-- clickable: the mark and the label in a button (or a link), which carries aria-current -->
<ol class="ds-steps" aria-label="Report a problem" data-ds-steps>
  <li class="ds-steps__step" data-status="done">
    <button class="ds-steps__link" type="button"><span class="ds-steps__mark">[icon check 16]</span><span class="ds-steps__label">Device<span class="ds-sr">, done</span></span></button>
  </li>
  <li class="ds-steps__step">
    <button class="ds-steps__link" type="button" aria-current="step"><span class="ds-steps__mark">2</span><span class="ds-steps__label">Problem</span></button>
  </li>
  <li class="ds-steps__step"><span class="ds-steps__mark">3</span><span class="ds-steps__label">Contact</span></li>
</ol>
```

**Options** ([options.md](options.md)): classes on the list or any ancestor; the nearest wins.

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Variant | row (default), `--vertical`, `--bar`, `--path` | the list | the layout |
| Size | `.ds-xs`, `.ds-sm`, `.ds-md`, `.ds-lg`, `.ds-xl` | the list or a group | a mark of 16 to 32px (`--ds-steps-mark-size`, 4px per step), the size's type role (`--ds-steps-font`) at the regular weight (the current label alone takes the label weight) |
| Density | `.ds-density-*` | any container | 2px per step off the room between the steps of a column (`--ds-steps-gap`); a stage 4px per step; the row and the marks stay |
| Shape | `.ds-shape-*` | any container or the theme | multiplies the radius of the marks, the segments, the ends of a path and a link's state layer (at rest and pressed) |
| Touch | `.ds-touch` | the theme or a container | a `.ds-steps__link` and a stage are at least `--ds-touch-target` high; a plain step is no target |
| Tone | none | | a step's status is `data-status`, with its icon and word |

- `data-status` on a step (the attribute of `.ds-tasks` too; never `data-state`, which `DS.overlay` writes):
  `done` a finished step, `error` a step that needs attention (the error colours, an icon in the mark and a word: a
  `.ds-steps__hint`, or a `.ds-sr` one), `optional` an upcoming step the user may skip (a dashed ring and the word).
  `aria-current="step"` on the current one; the rest are upcoming. An error outranks the current look.
- `.ds-steps__hint`: a line of the meta role beside the label (under it in a column), in `--ds-error` on an error step.
  Short of room in a row it truncates with an ellipsis, before any label does; the whole hint is still read. For long
  hints, use the column.
- Marks are 24px discs: done `--ds-primary` with a check that draws itself when the step turns done in place
  (re-render with `DS.dom.morphHtml`, so the mark stays; steps rendered with done ones stay still on load), current
  `--ds-primary` with `--ds-on-primary` figures and its label in the label weight, upcoming an `--ds-outline` ring
  in `--ds-text-2`.
  Connectors are `--ds-line` hairlines, `--ds-primary` after a done step (colours on `--ds-dur-medium`). At 600px of
  the content only the current label shows; the others are still read.
- `.ds-steps--vertical`: a column for long or wordy sequences. The connector runs from mark to mark, in `--ds-primary`
  after a done step; labels and hints wrap, and all of them stay at every width. `--ds-steps-gap` (`--ds-space-5`) is the
  room between steps.
- `.ds-steps--bar`: equal segments `--ds-steps-bar-height` (4px) high; done and current ones fill with `--ds-primary`
  (a clip that glides on `--ds-ease-value` over `--ds-dur-glide`), an error segment with `--ds-error`, the rest is
  `--ds-accent`. Marks, labels and hints are visually hidden; the list's `aria-label` ("Step 2 of 3") says where the user
  is.
- `.ds-steps__link`: a step the user may go to, a `<button>` or an `<a href>` around its mark and label. Its state
  layer is a pill around both that reaches past them without moving them, at least `--ds-target-min` high; it turns
  squarer while pressed (`--ds-radius-action-pressed` times the shape, back on the spring) and ripples
  (`DS.ripple.attach()`); the ring sits outside and snaps in. `aria-current="step"` goes on the link (the stylesheet
  reads it there or on the step). `aria-disabled="true"` blocks one (the disabled model). Upcoming steps the user may
  not reach yet get no link.
- `.ds-steps--path`: a stage path, the stages of a pipeline as chevrons that nest, `--ds-steps-path-height` (40px)
  high: upcoming on `--ds-surface-high`, done `--ds-primary-container` with its check, current `--ds-primary` with its
  label in the label weight, error `--ds-error` with its icon. Number marks and hints are read, not shown; a link fills
  its chevron, its ring inside. At 600px of the content only the current label shows.
- Moving between steps: `DS.motion.transition(update, { type: 'forward' })` (or `'back'`).
- Keyboard and names: plain steps are not tab stops; a `.ds-steps__link` is (Tab, Enter or Space). An `<ol>` with an
  `aria-label`, `aria-current="step"` on the current one, a `.ds-sr` ", done" on a done one; a hint is read with its
  step.

### Behaviour: `data-ds-steps`

`data-ds-steps` on the list (`DS.init()` finds it; `DS.steps.create(list)` is the imperative path, with the same
controller):

- A press on a step's button sends `ds:change` on the list (`{ index, step, previous }`, cancelable: a step that must
  validate first); unless cancelled, that step becomes the current one (`aria-current="step"` on its link, or on the
  step without one) and a screen reader hears "Step 2 of 4: Problem" (the string `stepOf`). An `<a href>` navigates as
  links do: `ds:change` tells, the next page marks its own step. A blocked link does nothing.
- The page keeps `data-status` (done, error, optional): what each step is, it knows; re-render with `DS.dom.morphHtml`
  so a check draws itself.

The controller (`DS.get(list, 'steps')`, or what `create()` returns): `get()` (the 0-based index of the current step, or
-1), `set(index)` (moves the current step and announces it, without `ds:change`), `on('change', fn)` (after every move,
a press or `set()`; returns the unsubscribe) and `destroy()`. `DS.steps.position(index, total, label)` is what a step
announces. `aria-current` is owned state (`DS.dom.morphHtml` keeps it).
- Forced colours: done and current marks and segments are `Highlight`, upcoming ones `CanvasText` outlines, an error
  mark its icon on a `CanvasText` ring, an error segment a `CanvasText` fill, the connectors `CanvasText` (`Highlight`
  after a done step). A stage path: the current stage `Highlight`, the others `Canvas` with their words, checks and
  icons.
- Hooks: [theming.md](theming.md#component-hooks).

**Motion:** the "Steps" row of [Navigation](motion.md#navigation) in motion.md. A stage's fill and ink change on
`--ds-dur-medium`; a link's press is the state layer's morph and the ripple.
