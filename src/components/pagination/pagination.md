## Pagination

Moves through the pages of a long table or list: the footer of a table whose records come in pages.

```html
<section class="ds-card">
  <div class="ds-table-wrap"><table class="ds-table">...</table></div>
  <nav class="ds-pagination" aria-label="Pages of devices">
    <div class="ds-pagination__size">
      <label class="ds-pagination__label" for="pp">Rows per page</label>
      <select class="ds-input ds-input--filled" id="pp"><option>25</option><option selected>50</option><option>100</option></select>
    </div>
    <p class="ds-pagination__range" aria-live="polite">1–50 of 1,234</p>
    <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="First page" aria-disabled="true" data-tip="First page">[icon chevronFirst 20]</button>
    <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Previous page" aria-disabled="true" data-tip="Previous page">[icon chevronLeft 20]</button>
    <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Next page" data-tip="Next page">[icon chevronRight 20]</button>
    <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Last page" data-tip="Last page">[icon chevronLast 20]</button>
  </nav>
</section>
```

Simple: previous and next, the page beside them.

```html
<nav class="ds-pagination ds-pagination--simple" aria-label="Pages of tickets">
  <p class="ds-pagination__range" aria-live="polite">Page 3 of 12</p>
  <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Previous page" data-tip="Previous page">[icon chevronLeft 20]</button>
  <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Next page" data-tip="Next page">[icon chevronRight 20]</button>
</nav>
```

Numbered: the range at the start, the pages at the end, with a field to jump to a page.

```html
<nav class="ds-pagination ds-pagination--numbered" aria-label="Pages of devices">
  <p class="ds-pagination__range" aria-live="polite">301–350 of 1,234</p>
  <div class="ds-pagination__jump">
    <label class="ds-pagination__label" for="jump">Go to page</label>
    <input class="ds-input" id="jump" type="number" inputmode="numeric" min="1" max="25" value="7">
  </div>
  <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Previous page">[icon chevronLeft 20]</button>
  <ol class="ds-pagination__pages">
    <li><button class="ds-btn ds-btn--quiet ds-pagination__page" type="button" aria-label="Page 1">1</button></li>
    <li class="ds-pagination__gap" aria-hidden="true">…</li>
    <li><button class="ds-btn ds-btn--quiet ds-pagination__page" type="button" aria-label="Page 6">6</button></li>
    <li><button class="ds-btn ds-btn--quiet ds-pagination__page" type="button" aria-label="Page 7" aria-current="page">7</button></li>
    <li><button class="ds-btn ds-btn--quiet ds-pagination__page" type="button" aria-label="Page 8">8</button></li>
    <li class="ds-pagination__gap" aria-hidden="true">…</li>
    <li><button class="ds-btn ds-btn--quiet ds-pagination__page" type="button" aria-label="Page 25">25</button></li>
  </ol>
  <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Next page">[icon chevronRight 20]</button>
</nav>
```

Cursor: keyset paging, where the total is unknown. No numbers; the labels say which way.

```html
<nav class="ds-pagination ds-pagination--cursor" aria-label="Pages of the audit log">
  <button class="ds-btn ds-btn--quiet" type="button" aria-disabled="true">[icon chevronLeft 16] Newer</button>
  <button class="ds-btn ds-btn--quiet" type="button">Older [icon chevronRight 16]</button>
</nav>
```

### Options

| Option | Classes | Where | What it does |
|---|---|---|---|
| Variant | none, `.ds-pagination--simple`, `.ds-pagination--numbered`, `.ds-pagination--cursor` | the bar | how its parts are placed; the parts combine, so leave out what a variant has no use for |
| Rows per page | `.ds-pagination__size` | a part | a select and its `.ds-pagination__label` |
| Jump to page | `.ds-pagination__jump` | a part | a number field and its label, `--ds-pagination-jump-width` wide |
| Range | `.ds-pagination__range` | a part | "1–50 of 1,234" or "Page 3 of 12": `--ds-font-meta`, tabular figures |
| Pages | `.ds-pagination__pages`, `.ds-pagination__page`, `.ds-pagination__gap` | parts | the numbered pages, `aria-current="page"` on the current one, a gap for those left out |
| Size, density, shape, touch | `.ds-xs` ... `.ds-xl`, `.ds-density-*`, `.ds-shape-*`, `.ds-touch` | the bar or any ancestor | reach its `.ds-btn` and `.ds-input` controls, which compute them; a page button is at least as wide as high and the gap lines up. Density also takes 2px per step of the bar's padding under a table. The range and labels keep their type |

There is no tone: a page shows no meaning of its own.

### Behaviour the page adds

- The page holds the page number and renders the bar: `aria-current` on the current page, the range text, which pages
  show. A controller is planned as `DS.pagination`; until then this is the page's own script.
- A button that leads nowhere (first and previous on the first page) takes `aria-disabled="true"`, not `disabled`:
  a focused "Next" that turns blocked on the last page keeps the focus, the click is blocked, and its tooltip still
  names it.
- A page change dims the rows (`.ds-stale` and the loading bar) while the page loads, then renders them with
  `DS.motion.flip(tbody, (o) => DS.dom.morphHtml(tbody, rows, o), { items: 'tr' })`: every key is new, so the old rows go
  at once and the new ones fade in; the range text changes at once.
- After the `.ds-table-wrap` of a card it sits right under the table with a hairline and runs to the card's edges. When
  the content area is at most 600px wide the size and jump fields drop and the range leads. A numbered bar then gives
  the range its own line and shows only the current page between previous and next, so the three stay together (the
  other page buttons are out of the tab order until the area widens). Hidden in print.

### Accessibility

- **Names and roles.** A `<nav>` with its own `aria-label` ("Pages of devices"). Every icon button has an `aria-label`,
  every page button says "Page 7", `aria-current="page"` marks the current one, and a gap is `aria-hidden`. The range is
  `aria-live="polite"`, so a page change is announced.
- **Keyboard.** Tab goes through the fields and buttons in order; Enter or Space presses a button, also a link
  (`<a class="ds-btn ds-pagination__page" href="?page=7">`). A blocked button stays focusable and does nothing.

### Forced colours

The current page is a choice in a set: `SelectedItem` and `SelectedItemText`, with a `CanvasText` ring when focused.

### Hooks

| Hook | Default | What |
|---|---|---|
| `--ds-pagination-current-bg` | `--ds-accent` | the fill of the current page |
| `--ds-pagination-current-color` | `--ds-on-accent` | its figure |
| `--ds-pagination-jump-width` | 72px | the jump field |

**Motion:** a page change in [Data motion](motion.md#data-motion) in motion.md.

<!-- changelog -->
- Pagination: the variants `.ds-pagination--simple` (now with a rule of its own), `.ds-pagination--numbered` and
  `.ds-pagination--cursor`, the parts `.ds-pagination__pages`, `.ds-pagination__page`, `.ds-pagination__gap` and
  `.ds-pagination__jump`, the hooks `--ds-pagination-current-bg`, `--ds-pagination-current-color` and
  `--ds-pagination-jump-width`. Its fields' width comes from a grid column, not from a rule against `.ds-input`. A
  numbered bar in a narrow content area keeps previous, the current page and next on one line.
