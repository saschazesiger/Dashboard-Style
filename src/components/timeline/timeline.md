## Timeline

The history of a record (2.0): entries on a rail, grouped by day.

```html
<ol class="ds-timeline" role="list" aria-label="History of LAPTOP-0042">
  <li class="ds-timeline__group" role="presentation"><h3 class="ds-timeline__day">12 Oct 2026</h3></li>
  <li class="ds-timeline__item" data-ds-key="e3">
    <div class="ds-timeline__head">
      <p class="ds-timeline__title">Issued</p>
      <span class="ds-status ds-status--ok">[icon check 16]<span>Active</span></span>
    </div>
    <p class="ds-timeline__meta"><time datetime="2026-10-12T14:05">14:05</time> · Ada Lovelace</p>
    <p class="ds-timeline__text">Issued to Ada Lovelace.</p>
    <div class="ds-timeline__actions"><button class="ds-btn ds-btn--text ds-btn--sm" type="button" aria-label="Edit the entry of 12 Oct 2026, 14:05">Edit</button></div>
  </li>
  <li class="ds-timeline__item ds-timeline__item--muted" data-ds-key="e2">
    <div class="ds-timeline__head"><p class="ds-timeline__title">Return planned</p></div>
    <p class="ds-timeline__text">Cancelled: the loan was extended.</p>
  </li>
  <li class="ds-timeline__item ds-timeline__item--icon" data-ds-key="e1">
    <span class="ds-timeline__marker" aria-hidden="true">[icon user 16]</span>
    <div class="ds-timeline__head"><p class="ds-timeline__title">Owner changed</p></div>
    <p class="ds-timeline__meta">[icon sync 16]Directory sync</p>
  </li>
</ol>
```

- Each entry is indented by `--ds-timeline-indent` (`--ds-space-8`) and divided from the one before by a hairline
  (`--ds-timeline-divider-color`) from its text edge. Its dot (`--ds-timeline-dot-size`, `--ds-timeline-dot-color`)
  sits on the rail, centred on the head line (`--ds-timeline-head-line`, 24px, the height of a status chip); the rail
  (`--ds-timeline-line-width`, `--ds-timeline-line-color`) runs from dot to dot with a gap around each, through the
  day headings (`.ds-timeline__group` with `.ds-timeline__day`, no dot). `role="list"` keeps the list semantics in
  Safari; the day heading's item is `role="presentation"`.
- `.ds-timeline__item--muted`: a ring (`--ds-timeline-muted-color`, `--ds-outline`) for an entry that did not take
  effect; say why in words. `.ds-timeline__item--icon` with `.ds-timeline__marker`: a disc of
  `--ds-timeline-marker-size` (24px) on `--ds-surface-high` with a 16px icon instead of the dot (an activity feed:
  who or what did it).
- `.ds-timeline__head` (title and a status chip, wrapping), `.ds-timeline__title` (label font), `.ds-timeline__meta`
  (meta font: the `<time>` and who; a leading 16px icon, the source say, sits on its text line, `--ds-space-1`
  before the text), `.ds-timeline__text` (keeps its line breaks, `--ds-measure` wide),
  `.ds-timeline__body` (a form in place) and `.ds-timeline__actions` (text buttons hang their padding, so their labels
  line up with the text; name the entry in each button's `aria-label`).
- No motion of its own: entries come and go through `DS.motion.flip` with keyed entries (a removed entry moves focus
  to its neighbour; a live feed passes `live: true`), editing in place swaps the text and the form through
  `DS.motion.crossfade` ([motion.md](motion.md#recipes)). The dot is drawn with borders, so it stays in forced colours.

**Motion:** the "Row list, timeline" row of [Feedback](motion.md#feedback) in motion.md.

