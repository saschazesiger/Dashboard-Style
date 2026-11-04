## Timeline

The history of a record, an activity feed or a thread of comments: entries on a rail, grouped by day.

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
    <div class="ds-timeline__actions ds-sm"><button class="ds-btn ds-btn--text" type="button" aria-label="Edit the entry of 12 Oct 2026, 14:05">Edit</button></div>
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

<ol class="ds-timeline ds-timeline--activity" role="list" aria-label="Activity">
  <li class="ds-timeline__item ds-timeline__item--icon" data-ds-key="a2">
    <span class="ds-timeline__marker" aria-hidden="true">GH</span>                       <!-- or <img src="..." alt=""> or an icon -->
    <div class="ds-timeline__head">
      <p class="ds-timeline__title"><strong>Grace Hopper</strong> took LAPTOP-0051</p>
      <time class="ds-timeline__time" datetime="2026-10-12T08:47">08:47</time>
    </div>
  </li>
  <li class="ds-timeline__item ds-timeline__item--icon ds-timeline__item--muted" data-ds-key="a1">
    <span class="ds-timeline__marker" aria-hidden="true">[icon sync 16]</span>
    <div class="ds-timeline__head">
      <p class="ds-timeline__title"><strong>The nightly sync</strong> changed nothing</p>
      <time class="ds-timeline__time" datetime="2026-10-12T02:00">02:00</time>
    </div>
  </li>
</ol>

<ol class="ds-timeline" role="list" aria-label="Comments on ticket #42">
  <li class="ds-timeline__item ds-timeline__item--icon ds-timeline__item--comment">
    <span class="ds-timeline__marker" aria-hidden="true">GH</span>
    <div class="ds-timeline__head">
      <p class="ds-timeline__title">Grace Hopper</p>
      <time class="ds-timeline__time" datetime="2026-10-12T09:40">09:40</time>
    </div>
    <p class="ds-timeline__text">Can you check the battery too?</p>
    <div class="ds-timeline__actions ds-sm"><button class="ds-btn ds-btn--text" type="button" aria-label="Reply to Grace Hopper">Reply</button></div>
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
  effect; say why in words. With `--icon` the marker is a ring as well; in a feed the sentence also takes the quieter
  ink. `.ds-timeline__item--icon` with `.ds-timeline__marker`: a disc of `--ds-timeline-marker-size` (24px) on
  `--ds-surface-high` with a 16px icon instead of the dot, an avatar's initials or an image that fills it.
- `.ds-timeline--activity`: a feed. An entry is one sentence, who did what: `.ds-timeline__title` in the body font,
  `<strong>` for who, on the marker's disc; no hairlines and the entries closer together (`--ds-timeline-padding`,
  `--ds-space-2`). `.ds-timeline__time` holds the time at the end of the head line, in any timeline.
- `.ds-timeline__item--comment`: what someone wrote, apart from what happened. The entry's `.ds-timeline__text` stands
  in a box of `--ds-timeline-comment-bg` (`--ds-surface-low`) with a `--ds-line` border and corners of
  `--ds-timeline-comment-radius` (`--ds-radius-card`).
- `.ds-timeline__head` (title and a status chip, wrapping), `.ds-timeline__title` (label font), `.ds-timeline__meta`
  (meta font: the `<time>` and who; a leading 16px icon, the source say, sits on its text line, `--ds-space-1`
  before the text), `.ds-timeline__text` (keeps its line breaks, `--ds-measure` wide),
  `.ds-timeline__body` (a form in place) and `.ds-timeline__actions` (text buttons hang their padding, so their labels
  line up with the text: give the size to `.ds-timeline__actions`, as above, not to each button; name the entry in each
  button's `aria-label`).
- No motion of its own: entries come and go through `DS.motion.flip` with keyed entries (a removed entry moves focus
  to its neighbour; a live feed passes `live: true`), editing in place swaps the text and the form through
  `DS.motion.crossfade` ([motion.md](motion.md#recipes)). The dot is drawn with borders, so it stays in forced colours.

### Options

On the list or any ancestor; each is computed in the component's own rule ([options.md](options.md)).

| Option | Classes | Applies to | Effect |
|---|---|---|---|
| Variant | `.ds-timeline--activity`, `.ds-timeline__item--comment`, `--muted`, `--icon` | the list, an entry | as above |
| Size | `.ds-xs` ... `.ds-xl` | the rail's marks | the head line, the marker and the indent 4px per step, the dot 2px per step; the title takes the size's type role; not the text or the meta |
| Density | `.ds-density-*` | an entry | the block padding 2px per step (the rail follows); not the type, the marker or the dot |
| Shape | `.ds-shape-*` | the dot, the marker, the comment box | multiplies the radius (at `.ds-shape-square` a square dot) |
| Touch | `.ds-touch` | its buttons | an entry is no target; its buttons take the minimum themselves |

A status chip on the head line (`.ds-status`) carries the tone of an entry: the rail shows no meaning of its own.

### Keyboard and names

An entry is no target, so the list adds no tab stop: `Tab` reaches its buttons and links. Name the list (`aria-label`)
and the entry in each button's `aria-label`. `role="list"` keeps the list semantics in Safari. Hide the marker
(`aria-hidden`): the sentence says who. Times go into `<time datetime>`.

### Forced colours

The dot, the ring and the rail are borders, so they stay. The marker's border (transparent, or the muted ring) becomes
its edge, and the comment box keeps its border.

### Hooks

`--ds-timeline-indent`, `--ds-timeline-padding`, `--ds-timeline-dot-size`, `--ds-timeline-dot-color`,
`--ds-timeline-muted-color`, `--ds-timeline-line-width`, `--ds-timeline-line-color`, `--ds-timeline-divider-color`,
`--ds-timeline-marker-size`, `--ds-timeline-head-line`, `--ds-timeline-comment-bg`, `--ds-timeline-comment-radius`: see
[theming.md](theming.md). `.ds-timeline__actions` reads the button's `--ds-btn-padding-x` to hang by it.

**Motion:** the "Row list, timeline" row of [Feedback](motion.md#feedback) in motion.md.

<!-- changelog -->
- Timeline on the options model: size steps the rail's marks, the indent and the title, density the padding (hook
  `--ds-timeline-padding`), the shape the dot, the marker and the comment box.
- New: `.ds-timeline--activity` (a feed of sentences, with avatars in the marker), `.ds-timeline__item--comment`
  (`--ds-timeline-comment-bg`, `--ds-timeline-comment-radius`), `.ds-timeline__time`, and a muted entry with a marker.
- `.ds-timeline__actions` hangs by the button's padding at its size: put `.ds-sm` on it instead of on each button.

