## Filter bar

A search and inline filters above a list, the applied filters as chips with "Clear all", and a result count. When the
bar is too narrow for its filters, they fold behind a "Filters" button that opens them in a [side sheet](#side-sheet).
For many filters with counts beside the list, use the [facet filter panel](#facet-filter-panel).

```html
<div class="ds-filterbar" data-ds-filterbar data-ds-filterbar-sheet="#filters-sheet" role="search" aria-label="Filter devices">
  <div class="ds-filterbar__row">
    <div class="ds-search ds-filterbar__search">[icon search 20]
      <input class="ds-input" type="search" name="q" aria-label="Search devices" placeholder="Search devices"></div>
    <div class="ds-filterbar__filters">
      <div class="ds-field"><label class="ds-field__label" for="f-status">Status</label>
        <select class="ds-input" id="f-status" name="status"><option value="">Any</option><option value="online">Online</option><option value="offline">Offline</option></select></div>
      <div class="ds-field"><label class="ds-field__label" for="f-kind">Type</label>
        <select class="ds-input" id="f-kind" name="kind"><option value="">Any</option><option value="laptop">Laptop</option></select></div>
      <div class="ds-filterbar__range" role="group" aria-label="Storage in GB" data-ds-filter-label="Storage">
        <div class="ds-field"><label class="ds-field__label" for="f-from">Storage from</label>
          <input class="ds-input" id="f-from" type="number" inputmode="numeric" min="0" name="storage" data-ds-filter-bound="min"></div>
        <div class="ds-field"><label class="ds-field__label" for="f-to">to</label>
          <input class="ds-input" id="f-to" type="number" inputmode="numeric" min="0" name="storage" data-ds-filter-bound="max"></div>
      </div>
      <label class="ds-check"><input type="checkbox" name="mine" value="yes"><span>Only mine</span></label>
    </div>
    <button class="ds-btn ds-filterbar__more" type="button" aria-haspopup="dialog">[icon filter 20]Filters<span class="ds-badge ds-filterbar__badge" hidden></span></button>
    <p class="ds-filterbar__count">48 results</p>
  </div>
  <div class="ds-filterbar__applied" hidden>
    <div class="ds-chips ds-filterbar__chips" role="group" aria-label="Applied filters"></div>
    <button class="ds-btn ds-btn--text ds-filterbar__clear" type="button">Clear all</button>
  </div>
</div>

<dialog class="ds-sheet" id="filters-sheet" aria-labelledby="filters-title">
  <div class="ds-sheet__backdrop" data-ds-close></div>
  <section class="ds-sheet__panel">
    <div class="ds-sheet__head"><h2 class="ds-sheet__title" id="filters-title">Filters</h2>
      <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Close" data-ds-close>[icon close 20]</button></div>
    <div class="ds-sheet__body" tabindex="0"></div>
    <div class="ds-sheet__foot">
      <button class="ds-btn ds-btn--text ds-filterbar__clear" type="button">Clear all</button>
      <button class="ds-btn ds-btn--filled ds-filterbar__results" type="button" data-ds-close>Show 48 results</button>
    </div>
  </section>
</dialog>
```

### Options

| Option | Classes, attributes | Where it applies | Effect |
|---|---|---|---|
| Sheet | `data-ds-filterbar-sheet` (a selector) | `.ds-filterbar` | the side sheet the folded filters open in; without one the filters wrap instead of folding |
| Label of a filter | `data-ds-filter-label` | a control or any ancestor in the bar | the name on its chips; default the fieldset's legend (checkboxes, radios, a range) or the field's label |
| Chip | `data-ds-filter-chip` `off`, `value` | a control or any ancestor | no chip, or the value alone ("Online"); a search field has none by default |
| Range | `data-ds-filter-bound` `min`, `max`; `.ds-filterbar__range` around them | two fields of one name | one filter `[min, max]` and one chip ("Storage: 256 to 1,024"); the part sets the two fields side by side, `--ds-filterbar-range-width` (96px) each, sharing the row in the sheet |
| Size, shape, touch | `.ds-xs` ... `.ds-xl`, `.ds-shape-*`, `.ds-touch` | the bar or any ancestor | reach the search, fields, buttons and chips, which compute them; the gaps step 4px per size step |
| Density | `.ds-density-*` | the bar or any ancestor | the gaps, 2px per step, and the controls' heights |
| Widths | `--ds-filterbar-search-min`, `--ds-filterbar-field-width`, `--ds-filterbar-range-width`, `--ds-filterbar-gap` | the bar | the search's least width (200px), an inline field (160px), a field of a range (96px), the gap (12px) |

There is no tone: a filter shows no meaning of its own. The count keeps the meta role.

### Behaviour

`js/filterbar.js` (`data-ds-filterbar`, or `DS.filterbar.create(el, options)`):

- **Filters** are the named form controls in the bar: checkboxes, radios, selects, text, search, number and date
  fields. Each is a list of strings: the checked values, the selected options, a field's text; two fields of one name
  with `data-ds-filter-bound="min"` and `"max"` are a range, `[min, max]` (`''` for an open end). Empty filters are
  left out: `{ q: ['fan'], status: ['online'], storage: ['256', ''] }`.
- **Changes.** Typing in a text field (every input), and a change of the others, sends `ds:filter`
  (`{ filters, name, reason }`) on the bar once the filters changed. The page filters and re-renders its list with
  `DS.dom.morphHtml` inside `DS.motion.flip()`, then writes the count with `count()`: it shows at once ("48 results",
  "Show 48 results"), and after a change by the user it is announced once the changes pause (`--ds-delay-tooltip`, so
  typing in the search says it once), through the page's announcer, which also speaks while the filters sit in the
  modal sheet. The first count and `set()` stay quiet.
- **Applied chips.** `.ds-filterbar__chips` gets an input chip per applied value ("Status: Online"; owned markup,
  keyed). A chip removes its value, `.ds-filterbar__clear` every filter but the search text; both dispatch `input` and
  `change` on the controls they changed (so the page's own listeners hear it), send one `ds:filter` and are announced
  ("Removed Status: Online", "Filters cleared"). The focus goes to the next chip, else the one before, else the search.
  `.ds-filterbar__applied` hides while nothing is applied (`hidden`, written); a Clear all button in the sheet takes
  `aria-disabled="true"` then.
- **Folding.** A `ResizeObserver` checks whether the search (at least `--ds-filterbar-search-min`), the filters and the
  count fit in one row. When they do not, `data-folded` on the bar hides the filters and shows `.ds-filterbar__more`,
  whose `.ds-filterbar__badge` counts the applied filters among them ("Filters 2 applied" to a screen reader). It opens
  the sheet with the filters moved into its `.ds-sheet__body` (`DS.filterbar.fold()`; they keep their values and
  state, and the filters in the sheet stack full width), and moves them back once the sheet closed. `.ds-filterbar__results`
  in the sheet's foot shows the count ("Show 48 results") and closes it. When the bar is wide enough again it unfolds.
  Without the script nothing folds: the row wraps.

### JS API

```js
const bar = DS.filterbar.create(el);              // the controller data-ds-filterbar makes
bar.get();                                         // { q: ['fan'], status: ['online'] }
bar.set({ status: ['offline'] });                  // the controls follow; sends nothing
bar.clear();                                       // as Clear all, silent (bar.clear('status=online'): one chip)
bar.count(48);                                     // "48 results", "Show 48 results"
bar.count(1, { one: '{count} device', other: '{count} devices' });
bar.fold();                                        // fold and open the sheet now
bar.on('change', ({ filters, name, reason }) => render(filters));

DS.filterbar.read(form);                           // the filters of any container's named controls
DS.filterbar.write(form, { status: ['online'] });  // sets them; returns the controls that changed
DS.filterbar.applied(form);                        // [{ key, name, value, label, text, chip }]
DS.filterbar.fold(part, sheet, { opener });        // opens the sheet with `part` in its body, back after it closed
```

`DS.filterbar.create(el, options)` returns the controller (`get()`, `set(filters)`, `clear(key)`, `count(value, forms)`,
`fold()`, `on('change', fn)`, `update()`, `destroy()`); `options.sheet` is the sheet (a selector or an element).
`DS.filterbar.read(root)`, `DS.filterbar.write(root, filters)` and `DS.filterbar.applied(root)` are the bar's rules for
any container. `DS.filterbar.fold(part, sheet, options)` opens a sheet with a part of the page in its body (`options.into`:
another element of the sheet) and puts it back when the sheet has closed (`options.back` runs then).
`DS.filterbar.filters(el, options)` is the engine of the chips, Clear all and the count on any container (`chips`,
`clear`, `applied`, `count`, `results` and `home` selectors, matched in the element and in the roots `extra()` returns;
`fallback()` takes the focus when `home` finds nothing), which the [facet filter panel](#facet-filter-panel) builds on;
its handle adds `count(value, forms)` and `watch(root, signal)` (chips and Clear all in a root outside the element).
`destroy()` with the filters in the sheet moves them back and closes it.

### Accessibility

- **Names and roles.** The bar is `role="search"` with a name ("Filter devices"); every field has its label (a visible
  `.ds-field__label`, or `aria-label` on the search). The chips are buttons in a named `role="group"`; each says what it
  does ("Remove filter Status: Online"). The count is announced by the system after a change (no `aria-live` on
  `.ds-filterbar__count`: the page around a modal sheet is inert, and a live region there would be silent).
- **Keyboard.** Tab goes through the search, the filters (or the "Filters" button), the chips and Clear all; each
  control keeps its own keys. Enter or Space on a chip removes it and the focus stays in the row. In the sheet focus
  starts on the first filter, Tab stays inside, Escape closes it and focus returns to "Filters".
- **Announcements.** "Removed Status: Online", "Filters cleared" (polite); the page's count follows once the changes
  pause, from the bar and from the sheet.
- **Strings.** `removeFilter`, `filterRemoved`, `filtersCleared`, `filtersApplied`, `filterChip`, `resultsOne`,
  `resultsOther`, `showResults`, `rangeMin`, `rangeMax` and `rangeBetween` of `DS.core.config()`.

### Forced colours

The chips (input chips), fields and buttons keep their own forced-colours models; the bar adds no colour of its own.

### Hooks

| Hook | Default | What |
|---|---|---|
| `--ds-filterbar-gap` | `--ds-space-3` | the gaps at md, comfortable: 4px per size step, 2px per density step |
| `--ds-filterbar-search-min` | 200px | the search's least width; the filters fold when it would not fit beside them |
| `--ds-filterbar-field-width` | 160px | an inline filter field |
| `--ds-filterbar-range-width` | 96px | each field of a `.ds-filterbar__range` in the row (they share the row in the sheet) |

**Motion:** none of its own. Folding and unfolding change the row at once; the chips come and go at once (input chips);
the sheet plays the side sheet's motion; the list's change is the page's `DS.motion.flip()`.
