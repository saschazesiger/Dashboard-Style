## Steps

Where the user is in a form of a few steps. Steps are not buttons: going back is a link or a button of the page.

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
```

**Options** ([options.md](options.md)): classes on the list or any ancestor; the nearest wins.

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Variant | row (default), `--vertical`, `--bar` | the list | the layout |
| Size | `.ds-xs`, `.ds-sm`, `.ds-md`, `.ds-lg`, `.ds-xl` | the list or a group | a mark of 16 to 32px (`--ds-steps-mark-size`, 4px per step), the size's type role (`--ds-steps-font`) at the regular weight (the current label alone takes the label weight) |
| Density | `.ds-density-*` | any container | 2px per step off the room between the steps of a column (`--ds-steps-gap`); the row and the marks stay |
| Shape | `.ds-shape-*` | any container or the theme | multiplies the radius of the marks and the segments |
| Touch | none | | a step is no target; a link in one is the page's |
| Tone | none | | a step's status is `data-status`, with its icon and word |

- `data-status` on a step (the attribute of `.ds-tasks` too; never `data-state`, which `DS.overlay` writes):
  `done` a finished step, `error` a step that needs attention (the error colours, an icon in the mark and a word: a
  `.ds-steps__hint`, or a `.ds-sr` one), `optional` an upcoming step the user may skip (a dashed ring and the word).
  `aria-current="step"` on the current one; the rest are upcoming. An error outranks the current look.
- `.ds-steps__hint`: a line of the meta role beside the label (under it in a column), in `--ds-error` on an error step.
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
- Moving between steps: `DS.motion.transition(update, { type: 'forward' })` (or `'back'`).
- Keyboard and names: steps are not tab stops; the page's own links and buttons are. An `<ol>` with an `aria-label`,
  `aria-current="step"` on the current one, a `.ds-sr` ", done" on a done one; a hint is read with its step.
- Forced colours: done and current marks and segments are `Highlight`, upcoming ones `CanvasText` outlines, an error
  mark its icon on a `CanvasText` ring, an error segment a `CanvasText` fill, the connectors `CanvasText` (`Highlight` after a done step).
- Hooks: [theming.md](theming.md#component-hooks).

**Motion:** the "Steps" row of [Navigation](motion.md#navigation) in motion.md.

<!-- changelog -->
- Fixed: the connectors of a row keep their line under forced colours.
- Steps (3.0): on the options model (size on the mark and the type, density on a column's room, shape on the radius).
  Added `.ds-steps--vertical`, `data-status="error"` and `"optional"`, `.ds-steps__hint`, and the hooks
  `--ds-steps-mark-size`, `--ds-steps-font`, `--ds-steps-gap`.

