## Pagination

```html
<section class="ds-card">
  <div class="ds-table-wrap"><table class="ds-table">...</table></div>
  <nav class="ds-pagination" aria-label="Pages of devices">        <!-- ds-pagination--simple: previous and next only -->
    <div class="ds-pagination__size">
      <label class="ds-pagination__label" for="pp">Rows per page</label>
      <select class="ds-input ds-input--filled" id="pp"><option>25</option><option selected>50</option><option>100</option></select>
    </div>
    <p class="ds-pagination__range" aria-live="polite">1–50 of 128</p>
    <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="First page" aria-disabled="true" data-tip="First page">[icon chevronFirst 20]</button>
    <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Previous page" aria-disabled="true" data-tip="Previous page">[icon chevronLeft 20]</button>
    <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Next page" data-tip="Next page">[icon chevronRight 20]</button>
    <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Last page" data-tip="Last page">[icon chevronLast 20]</button>
  </nav>
</section>
```

- The footer of a table whose records come in pages: rows per page, the range shown (`--ds-font-meta`, tabular
  figures) and the buttons, end-aligned. After the `.ds-table-wrap` of a card it sits right under the table with a
  hairline and runs to the card's edges. When the content area is at most 600px wide the size field drops and the
  range leads. No numbered pages (a project that needs them builds them from `.ds-btn`s).
- A button that leads nowhere (first and previous on the first page) takes `aria-disabled="true"`, not `disabled`:
  a focused "Next" that turns blocked on the last page keeps the focus, the click is blocked, and its tooltip still
  names it. `.ds-pagination--simple` leaves out first and last.
- The page holds the page number. A page change dims the rows (`.ds-stale` and the loading bar) while the page
  loads, then renders them with `DS.motion.flip(tbody, (o) => DS.dom.morphHtml(tbody, rows, o), { items: 'tr' })`:
  every key is new, so the old rows go at once and the new ones fade in; the range text changes at once. Hidden in
  print.

**Motion:** a page change in [Data motion](motion.md#data-motion) in motion.md.

