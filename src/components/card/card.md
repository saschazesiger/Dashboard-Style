## Card

```html
<section class="ds-card">
  <div class="ds-card__row">
    <h2 class="ds-card__title">Sync</h2>
    <button class="ds-btn ds-sm" type="button">Run now</button>
  </div>
  <p class="ds-muted">Runs every night at 02:00.</p>
  <h3 class="ds-card__subtitle">Sources</h3>
  <ul class="ds-plain-list"><li>Directory</li><li>Asset database</li></ul>
  <div class="ds-subsection">
    <h3 class="ds-card__subtitle">Advanced</h3>
    <p>...</p>
  </div>
  <nav class="ds-card__links" aria-label="Related">
    <a class="ds-btn ds-btn--text ds-card__link" href="/runs">Run history [icon arrowRight 16]</a>
  </nav>
</section>

<section class="ds-card ds-card--filled"> ... </section>   <!-- quieter block inside a card or form -->
<div class="ds-more"><button class="ds-btn" type="button">Load more</button></div>
```

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
- A disabled or `aria-disabled="true"` card shows no hover or press layer and does not morph; an `aria-disabled` card
  keeps its focus layer.
- Nothing moves on hover, no lift and no scale. A theme may add a shadow on hover with `--ds-card-hover-shadow`
  (default none; for example `var(--ds-elev-hover)`), in over `--ds-dur-medium`, out over `--ds-dur-base`.
- In forced colours every interactive card keeps a visible edge (`.ds-card--filled` included) and the focus ring; an
  `aria-disabled` card turns `GrayText`.

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
</div>
```

- Selected, the card takes `--ds-card-selected-bg` (`--ds-accent`) with `--ds-on-accent` ink and a static inset ring
  (a border of `--ds-focus-width` in `--ds-selected-ring`, `--ds-primary`, on the card's own `::after`), so the
  focus ring stays free and both read at once (a border survives forced colours; a `box-shadow` ring does not). The
  colours change on `--ds-dur-fast`, the ring shows at once. Add a check or the label weight: never the tint alone.
  Forced colours: `Highlight` / `HighlightText`.
- `.ds-card--elevated`: a card that floats a little (`--ds-card-shadow`, `--ds-elev-1`) instead of the hairline; in
  forced colours its edge comes back.
- `.ds-card__title` wraps long words and lines up a leading icon (`[icon ... 20]` first) with its words.
- `.ds-card__links` hangs only text buttons and `.ds-card__link` into the card's margin; an outlined button there keeps
  its place.
- Print: a short card is never split across pages.

**Motion:** the press morph of [Controls](motion.md#controls) (`.ds-card--interactive`) and the "Alert, tile, card" row of [Feedback](motion.md#feedback).

