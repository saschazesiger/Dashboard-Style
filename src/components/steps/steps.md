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
</ol>

<!-- or a bar: the same items, the list says where the user is -->
<ol class="ds-steps ds-steps--bar" aria-label="Step 2 of 3"> ... </ol>
```

- `data-status="done"` on a finished step (the attribute of `.ds-tasks` too; never `data-state`, which `DS.overlay`
  writes) and `aria-current="step"` on the current one; the rest are upcoming.
- Marks are 24px discs: done `--ds-primary` with a check that draws itself when the step turns done in place
  (re-render with `DS.dom.morphHtml`, so the mark stays; steps rendered with done ones stay still on load), current
  `--ds-primary` with `--ds-on-primary` figures and its label in the label weight, upcoming an `--ds-outline` ring
  in `--ds-text-2`.
  Connectors are `--ds-line` hairlines, `--ds-primary` after a done step (colours on `--ds-dur-medium`). At 600px of
  the content only the current label shows; the others are still read.
- `.ds-steps--bar`: equal segments `--ds-steps-bar-height` (4px) high; done and current ones fill with `--ds-primary`
  (a clip that glides on `--ds-ease-value` over `--ds-dur-glide`), the rest is `--ds-accent`. Marks and labels are
  visually hidden; the list's `aria-label` ("Step 2 of 3") says where the user is.
- Moving between steps: `DS.motion.transition(update, { type: 'forward' })` (or `'back'`).
- Forced colours: done and current marks and segments are `Highlight`, upcoming ones `CanvasText` outlines.

