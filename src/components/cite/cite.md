## Sources and citations

Where a generated answer's facts come from: numbered markers in the text that open a card with their source (on
hover, like a hover card, and on a press), and the list of every source under the answer.

```html
<p>Eleven laptops leave warranty before March<button class="ds-cite" type="button" aria-controls="src-1-card"
   aria-label="Source 1: Warranty register 2026" data-ds-cite>1</button>.</p>

<div class="ds-cite__card" id="src-1-card" popover="manual" hidden>
  <p class="ds-cite__source"><img class="ds-cite__icon" src="/favicon.png" alt="">example.com</p>
  <a class="ds-cite__title" href="https://example.com/warranty">Warranty register 2026</a>
  <p class="ds-cite__snippet">The warranty of LAPTOP-0042 ends on 28 February 2027 ...</p>
</div>

<ol class="ds-cite-list" aria-label="Sources">
  <li class="ds-cite-list__item">
    <span class="ds-cite-list__number">1</span>
    <span class="ds-cite-list__body"><a class="ds-cite__title" href="https://example.com/warranty">Warranty register 2026</a>
      <span class="ds-cite__source">example.com</span></span>
  </li>
</ol>
```

| Part | What |
|---|---|
| `.ds-cite` | the marker: a `<button>` with the number, right after the words it backs (no space before it). Its name says the source (`aria-label="Source 1: Warranty register 2026"`), `aria-controls` names its card. A small pill in the caption type on `--ds-cite-bg`, a little raised; its hit area reaches at least 24px (`--ds-target-min` under `.ds-touch`) without moving the line. Open, it turns `--ds-accent` |
| `.ds-cite__card` | the card: `popover="manual"` and `hidden` in the markup (the module writes `popover` when missing). Several markers may share one card |
| `.ds-cite__source` | the site, in the meta type, with an optional `.ds-cite__icon` (a 16px favicon with `alt=""`, or a glyph) |
| `.ds-cite__title` | the link to the source, in the label type |
| `.ds-cite__snippet` | optional: the quoted passage, three lines at most |
| `.ds-cite-list` | the sources in order: `.ds-cite-list__item` with a `.ds-cite-list__number` (the marker's pill) and a `.ds-cite-list__body` (the title and the source) |

**Behaviour** (`data-ds-cite`, `DS.init()`). The card is a popup of `DS.overlay`: in the top layer, on the Escape
stack, `aria-expanded` on its marker, growing from the marker. It is placed under the marker, above it without room
(`DS.position.place()`, writing `--ds-cite-x` and `--ds-cite-y`), and placed again on scroll and resize while it is
open.

- **Pointer.** Resting on the marker for `--ds-delay-tooltip` opens the card; it stays while the pointer is on the
  marker or the card and closes `--ds-delay-tooltip-hide` after it left both, so the pointer can cross to the card
  (WCAG 1.4.13). A press opens it pinned: it stays until a press outside, Escape, or another press on the marker.
- **Keyboard.** Enter or Space opens it pinned and moves focus to its first link; Escape closes it and focus returns
  to the marker; Tab past the card's end closes it and moves on from the marker (Shift+Tab from its first link lands on
  the marker). Nothing opens on focus alone: the marker's name says the source.
- **Touch.** A tap is a press.

```js
const marker = DS.cite.create(button);   // or DS.core.get(button, 'cite')
marker.set(true);                        // opens its card, pinned; set(false) closes it
marker.get();                            // whether its card is open
marker.on('change', ({ open }) => {});   // also ds:change with { open } on the marker
DS.cite.cardOf(button);                  // the card its aria-controls names, or null
```

Exports: `DS.cite.create(marker)` (the controller) and `DS.cite.cardOf(marker)` (the card its `aria-controls` names).

**Options.**

| Option | Classes | Effect |
|---|---|---|
| Size | `.ds-xs` ... `.ds-xl` | the marker and the list's numbers, 2px per step (18px at md); their type stays the caption |
| Density | `.ds-density-*` | the room between the list's rows, 2px per step |
| Shape | `.ds-shape-*` | the corners of the marker (a pill at the default) and the card |
| Touch | `.ds-touch` | the marker's hit area is `--ds-target-min` |
| Tone | | not read: a source shows no meaning |

**Accessibility.** The marker is a button with `aria-expanded` (the disclosure pattern) and the source in its name;
the card holds a real link, reached by Enter or Space, so nothing needs hover. Like a text link, the marker has no
ripple and no press morph; it has the state layer and the focus ring.

**Forced colours.** The marker and the numbers keep a `CanvasText` edge (open: `Highlight` with `HighlightText`, the
toggle model), the card its transparent outline as its edge.

**Hooks.** `--ds-cite-size` (18px), `--ds-cite-bg` (`--ds-surface-high`), `--ds-cite-card-width` (320px),
`--ds-cite-card-radius` (`--ds-radius-card`) ([theming.md](theming.md#component-hooks)).

**Motion.** The card enters and leaves as the popups do (transitions keyed on `data-state`, so a close mid-way turns
back from where it is): it fades in on `--ds-dur-fast` and grows from `--ds-scale-popup` at the marker on the spring
over `--ds-dur-medium`, and fades out in `--ds-dur-instant`. The marker's layers fade on `--ds-dur-fast`.

<!-- changelog -->
- Sources and citations (`.ds-cite`, `.ds-cite__card`, `.ds-cite-list`, `DS.cite`, `data-ds-cite`): numbered markers
  that open a source card on hover (WCAG 1.4.13: hoverable, dismissible) and on a press (focus moves into it), through
  `DS.overlay` in the top layer, placed by `DS.position`; and the list of sources.
