## Tasks

The steps of a job (2.0): an import, a setup, a migration, each step pending, running, done or failed.

```html
<div class="ds-tasks__head"><h3 class="ds-card__title">Set up LAPTOP-0042</h3><p class="ds-meta">2 of 4</p></div>
<ol class="ds-tasks" aria-label="Steps">
  <li class="ds-tasks__item" data-status="done"><span class="ds-tasks__mark">[icon checkCircle 20]</span><span class="ds-tasks__text">Copy the image<span class="ds-sr">: done</span></span></li>
  <li class="ds-tasks__item" data-status="failed"><span class="ds-tasks__mark">[icon alertCircle 20]</span><span class="ds-tasks__text">Join the domain: failed, the server did not answer</span></li>
  <li class="ds-tasks__item" data-status="running"><span class="ds-tasks__mark"><span class="ds-spinner ds-spinner--sm"></span></span><span class="ds-tasks__text">Install updates<span class="ds-sr">: running</span></span></li>
  <li class="ds-tasks__item" data-status="pending"><span class="ds-tasks__mark"></span><span class="ds-tasks__text">Restart<span class="ds-sr">: waiting</span></span></li>
</ol>
```

- `data-status` on each `.ds-tasks__item` (set by the page): `pending` a ring in `--ds-outline`, `running` the small
  spinner and the label weight, `done` the check in a circle in `--ds-success` (its tick draws itself when the step turns done in place) and
  the text in `--ds-text-2`, `failed` the alert circle in `--ds-error` with the word in the text. The status is in
  the shape of the mark and the weight of the text, never in colour alone; put it into the text for screen readers
  too (a `.ds-sr` word) and keep the count of `.ds-tasks__head` in step.
- Re-render the list with `DS.dom.morphHtml` (the mark's glyph changes with the status). In forced colours the marks
  take `CanvasText`.

**Motion:** the "Tasks" row of [Feedback](motion.md#feedback) in motion.md.

