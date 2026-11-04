## Card

A block of related content on a surface, or a whole block that opens or picks something.

```html
<section class="ds-card">
  <div class="ds-card__row">
    <h2 class="ds-card__title">Sync</h2>
    <button class="ds-btn ds-sm" type="button">Run now</button>
  </div>
  <p class="ds-muted">Runs every night at 02:00.</p>
  <h3 class="ds-card__subtitle">Sources</h3>
  <ul class="ds-plain-list"><li>Directory</li><li>Asset database</li></ul>
  <div class="ds-card__section">
    <h3 class="ds-card__subtitle">Advanced</h3>
    <p>...</p>
  </div>
  <nav class="ds-card__links" aria-label="Related">
    <a class="ds-btn ds-btn--text ds-card__link" href="/runs">Run history [icon arrowRight 16]</a>
  </nav>
</section>

<section class="ds-card ds-card--outlined"> ... </section>   <!-- the default look, named -->
<section class="ds-card ds-card--filled"> ... </section>     <!-- quieter block inside a card or form -->
<section class="ds-card ds-card--elevated"> ... </section>   <!-- floats a little, no hairline -->
<section class="ds-card ds-card--horizontal">                <!-- media beside the body -->
  <img class="ds-card__media" src="/devices/42.jpg" alt="Printer on floor 2">
  <div class="ds-card__body"> ... </div>
</section>
<div class="ds-card__more"><button class="ds-btn" type="button">Load more</button></div>
```

| Option | Classes | Applies to | Effect |
|---|---|---|---|
| Variant | `.ds-card--outlined` (default), `--filled`, `--elevated` | the card | the look |
| Layout | `.ds-card--horizontal` | the card | media beside the body; each takes a whole line once the card is too narrow for both |
| Clickable | `.ds-card--interactive` | `<a>`, `<button>` or `<div>` with `.ds-card__action` | state layer, press morph, ripple |
| Selectable | `aria-pressed`, `aria-checked` or `aria-selected`; `.ds-card--selectable` with `.ds-card__check` | an interactive card | the selected look; the mark in the corner |
| Density | `.ds-density-*` | the card or an ancestor | 2px per step off the padding, the rhythm between children and the section's room; `--ds-card-pad` follows, so what bleeds to the edges follows too. Read on the card: a density class on a child (a dense table) leaves the gap above it alone. Type stays |
| Shape | `.ds-shape-*` | the card or an ancestor | multiplies the rest and pressed radius, the media and the mark (`--ds-shape`) |
| Touch | `.ds-touch` | the card or an ancestor | an interactive card is at least `--ds-touch-target` high |
| Size | not read | | a card has no height of its own; a size class on it reaches the controls inside |
| Tone | not read | | a card shows no meaning of its own: put a status chip or an alert in it |

`.ds-subsection` and `.ds-more` are **deprecated** aliases of `.ds-card__section` and `.ds-card__more` (their 2.x names), until 3.0 ships.

Children of a card are 16px apart; a button, switch or `.ds-chip` in `.ds-card__row` overhangs the title line so all
card titles start at the same height; a status chip, badge or tag fits the line and sits on it, so a row that wraps
keeps the card's 16px below it. Cards in `.ds-grid-2` share their height and line up their `.ds-card__links`, the tallest
card's still 16px below its content. Padding: the `--ds-card-padding*` hooks ([theming.md](theming.md#component-hooks)).

### Interactive card

A whole card that opens something (1.4):

```html
<a class="ds-card ds-card--interactive" href="/devices/42">
  <h2 class="ds-card__title">Printer on floor 2</h2>
  <p class="ds-muted">Last seen today, 09:12</p>
</a>

<button class="ds-card ds-card--interactive" type="button">
  <span class="ds-card__title">Printer on floor 2</span> ...       <!-- a button holds phrasing content only -->
</button>

<div class="ds-card ds-card--interactive">                          <!-- with other controls inside -->
  <div class="ds-card__row">
    <h2 class="ds-card__title"><a class="ds-card__action" href="/devices/42">Printer on floor 2</a></h2>
    <button class="ds-btn ds-sm" type="button">Restart</button>
  </div>
  <p class="ds-muted">Last seen today, 09:12</p>
</div>
```

- The `<a>` and `<button>` forms lose the element's own look (colour, font, underline; full width, left-aligned) and
  lay their content out as a column from the top, so cards in one grid row line up.
  In the `<div>` form the `.ds-card__action` link reads as the card's text and its `::after` stretches over the
  card; the card's other links and controls stay above it and keep working.
- A state layer in `currentColor`: hover `--ds-state-hover-lg`, press `--ds-state-pressed` in `--ds-dur-micro`
  (or the ripple, `DS.ripple.attach()`), keyboard focus `--ds-state-focus` with the ring, which is solid from the
  first frame and snaps to its offset (on the `<div>` form the card draws it through
  `:has(.ds-card__action:focus-visible)`, so the clip of a ripple never cuts it).
- The press morph: the radius goes to `--ds-radius-card-pressed` (12 to 8px) and springs back on release.
- A disabled or `aria-disabled="true"` card looks it: the one disabled model (`--ds-disabled-ink` on its text and
  its mark, `--ds-disabled-opacity` where a theme dims, faded on `--ds-dur-fast`, the cursor `not-allowed`). It shows no
  hover or press layer and no hover shadow, and does not morph; an `aria-disabled` card keeps its focus layer.
- Nothing moves on hover, no lift and no scale. A theme may add a shadow on hover with `--ds-card-hover-shadow`
  (default none, an elevated card keeps its own; for example `var(--ds-elev-hover)`), in over `--ds-dur-medium`, out
  over `--ds-dur-base`.
- In forced colours every interactive card keeps a visible edge (`.ds-card--filled` included) and the focus ring; a
  blocked card turns `GrayText`, selected or not.

### Selectable card

Pick one of a few cards (a plan, a template): the card is a toggle. Put `aria-pressed` (or `aria-checked` in a
`role="radiogroup"`, `aria-selected` in a listbox) on a `<button>` card, or on the `.ds-card__action` of the `<div>`
form, which may be a `<button>` too (it loses its own look):

```html
<div class="ds-grid-2" role="group" aria-label="Plan">
  <button class="ds-card ds-card--interactive" type="button" aria-pressed="true">
    <span class="ds-card__title">[icon check 20]Standard</span>
    <span class="ds-muted">Daily sync, 30 days of history</span>
  </button>
  <div class="ds-card ds-card--interactive">
    <h2 class="ds-card__title"><button class="ds-card__action" type="button" aria-pressed="false">Extended</button></h2>
    <p class="ds-muted">Hourly sync, a year of history</p>
    <a class="ds-link--quiet" href="/plans">Compare plans</a>
  </div>
  <button class="ds-card ds-card--interactive ds-card--selectable" type="button" aria-pressed="false">   <!-- brings its check -->
    <span class="ds-card__title">Archive</span>
    <span class="ds-muted">Monthly sync, kept for ten years</span>
    <span class="ds-card__check" aria-hidden="true">[icon check 16]</span>
  </button>
</div>
```

- Selected, the card takes `--ds-card-selected-bg` (`--ds-accent`) with `--ds-on-accent` ink and a static inset ring
  (a border of `--ds-focus-width` in `--ds-selected-ring`, `--ds-primary`, on the card's own `::after`), so the
  focus ring stays free and both read at once (a border survives forced colours; a `box-shadow` ring does not). The
  colours change on `--ds-dur-fast`, the ring shows at once. Add a check or the label weight: never the tint alone.
  Forced colours: `Highlight` / `HighlightText`.
- `.ds-card--selectable` brings the check: `.ds-card__check`, the card's last child, is an empty round mark in the
  corner at rest and a filled check when selected (`--ds-card-check-size`, `--ds-space-5`), on the title's line; the
  card keeps its content clear of it and the pointer goes through it. It is `aria-hidden`: the state is the
  attribute.
- The page toggles the attribute: the system only draws it. Keyboard: Tab reaches each card, Enter and Space press it;
  the `<div>` form's other links and controls stay in the tab order.
- `.ds-card--elevated`: a card that floats a little (`--ds-card-shadow`, `--ds-elev-1`) instead of the hairline; in
  forced colours its edge comes back.
- `.ds-card__title` wraps long words and lines up a leading icon (`[icon ... 20]` first) with its words.
- `.ds-card__links` hangs only text buttons and `.ds-card__link` into the card's margin; an outlined button there keeps
  its place.
- `.ds-card--horizontal`: `.ds-card__media` (an `<img>`, or an element on `--ds-surface-high` that centres an icon; a
  radius of `--ds-radius-sm` times the shape) takes `--ds-card-media-size` (160px), `.ds-card__body` the rest, and both
  take a whole line once the card has less room than `--ds-card-media-size` + `--ds-card-body-min` (240px) + the gap: no
  query, the card itself decides, wherever it stands. `.ds-card__body` keeps the card's rhythm, by the same rules as the
  card's own children; a `<button>` card uses `<span>`s, which stack. Clickable and selectable combine with it.
- Print: a short card is never split across pages.
- Rows of a [disclosure list](#disclosure) run to the card's edges: this stylesheet pulls the list out by
  `--ds-card-pad` and sets `--ds-disclosure-row-padding-exact` on it, so the rows' text lines up with the card's.

Accessibility: a card is a `<section>` with its own heading, or an `<a>` or `<button>` with one name
(the `<div>` form's name is its `.ds-card__action`). Forced colours: `.ds-card--filled` (when interactive) and
`.ds-card--elevated` keep a `CanvasText` edge; a selected card `Highlight` / `HighlightText`, its media too, with a
`CanvasText` ring when focused and a check in `Highlight` on `HighlightText`; a disabled or `aria-disabled` card
`GrayText` on `Canvas`, its media too, and when selected a check in `Canvas` on `GrayText`; the empty mark a `CanvasText`
ring.

Hooks: `--ds-card-padding`, `--ds-card-padding-sm`, `--ds-card-padding-filled`, `--ds-card-radius`,
`--ds-card-radius-pressed`, `--ds-card-bg`, `--ds-card-border`, `--ds-card-filled-bg`, `--ds-card-title-line`,
`--ds-card-hover-shadow`, `--ds-card-shadow`, `--ds-card-selected-bg`, `--ds-selected-ring`, `--ds-card-check-size`,
`--ds-card-media-size`, `--ds-card-body-min` ([theming.md](theming.md#component-hooks)). `--ds-card-pad` is the
resulting padding: read it, never set it.

**Motion:** the press morph of [Controls](motion.md#controls) (`.ds-card--interactive`) and the "Alert, tile, card" row of [Feedback](motion.md#feedback). The mark's colours run on `--ds-dur-fast` with the card's.
