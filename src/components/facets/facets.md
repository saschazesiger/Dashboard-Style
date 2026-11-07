## Facet filter panel

The filters of a list in a panel beside it: one facet per field, each option with its count, a search inside a long
facet, ranges, the applied filters as chips with "Clear all". Where the layout cannot hold the panel beside the list
it folds behind a "Filters" button that opens it in a [side sheet](#side-sheet) (from the bottom on phones). For a few
filters above the list, use the [filter bar](#filter-bar).

```html
<div class="ds-facets-layout">
  <section class="ds-facets" role="complementary" data-ds-facets data-ds-facets-sheet="#facets-sheet" aria-labelledby="facets-title">
    <div class="ds-facets__head">
      <h2 class="ds-facets__title" id="facets-title">Filters</h2>
      <button class="ds-btn ds-btn--text ds-facets__clear" type="button">Clear all</button>
    </div>
    <div class="ds-facets__applied" hidden>
      <div class="ds-chips ds-facets__chips" role="group" aria-label="Applied filters"></div>
    </div>
    <fieldset class="ds-facet">
      <legend class="ds-facet__title">Status</legend>
      <div class="ds-facet__options">
        <label class="ds-check"><input type="checkbox" name="status" value="online"><span>Online</span><span class="ds-check__count">24</span></label>
        <label class="ds-check"><input type="checkbox" name="status" value="offline"><span>Offline</span><span class="ds-check__count">3</span></label>
      </div>
    </fieldset>
    <fieldset class="ds-facet" data-ds-facet-limit="4">
      <legend class="ds-facet__title">Owner</legend>
      <div class="ds-search ds-facet__search">[icon search 20]
        <input class="ds-input" type="search" aria-label="Search owners" placeholder="Search owners"></div>
      <div class="ds-facet__options"> ... </div>
      <p class="ds-facet__empty" hidden></p>
      <button class="ds-btn ds-btn--text ds-facet__more" type="button" hidden></button>
    </fieldset>
    <fieldset class="ds-facet">
      <legend class="ds-facet__title">Last seen</legend>
      <div class="ds-facet__options">
        <label class="ds-check"><input type="radio" name="seen" value="" checked><span>Any time</span></label>
        <label class="ds-check"><input type="radio" name="seen" value="24h"><span>Last 24 hours</span></label>
      </div>
    </fieldset>
    <fieldset class="ds-facet" data-ds-filter-label="Storage">
      <legend class="ds-facet__title">Storage (GB)</legend>
      <div class="ds-facet__range">
        <div class="ds-field"><label class="ds-field__label" for="storage-min">Min</label>
          <input class="ds-input" id="storage-min" type="number" inputmode="numeric" name="storage" data-ds-filter-bound="min"></div>
        <span class="ds-facet__dash" aria-hidden="true">–</span>
        <div class="ds-field"><label class="ds-field__label" for="storage-max">Max</label>
          <input class="ds-input" id="storage-max" type="number" inputmode="numeric" name="storage" data-ds-filter-bound="max"></div>
      </div>
    </fieldset>
  </section>
  <div class="ds-facets-layout__main">
    <button class="ds-btn ds-facets__toggle" type="button" aria-haspopup="dialog">[icon filter 20]Filters<span class="ds-badge ds-facets__badge" hidden></span></button>
    <div class="ds-facets__applied" hidden>                    <!-- optional: the applied chips while folded -->
      <div class="ds-chips ds-facets__chips" role="group" aria-label="Applied filters"></div>
      <button class="ds-btn ds-btn--text ds-facets__clear" type="button">Clear all</button>
    </div>
    <p class="ds-facets__count">27 results</p>
    ... the list ...
  </div>
</div>

<dialog class="ds-sheet" id="facets-sheet" aria-labelledby="facets-sheet-title">
  <div class="ds-sheet__backdrop" data-ds-close></div>
  <section class="ds-sheet__panel">
    <div class="ds-sheet__head"><h2 class="ds-sheet__title" id="facets-sheet-title">Filters</h2>
      <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Close" data-ds-close>[icon close 20]</button></div>
    <div class="ds-sheet__body" tabindex="0"></div>
    <div class="ds-sheet__foot">
      <button class="ds-btn ds-btn--filled ds-facets__results" type="button" data-ds-close>Show 27 results</button>
    </div>
  </section>
</dialog>
```

### Options

| Option | Classes, attributes | Where it applies | Effect |
|---|---|---|---|
| Sheet | `data-ds-facets-sheet` (a selector) | `.ds-facets` | the side sheet the folded panel opens in |
| Zero counts | `data-ds-facets-zero` `disable` (default), `hide`, `show` | `.ds-facets` | an option counted 0 that is not checked is disabled, hidden or left as it is |
| Limit | `data-ds-facet-limit="n"` | a `.ds-facet` | its first n options and every checked one show; `.ds-facet__more` shows the rest |
| Scroll | `.ds-facet--scroll` | a `.ds-facet` | its options scroll on their own after `--ds-facet-max-height` (264px) |
| Search | `.ds-facet__search` with an unnamed field | a `.ds-facet` | shows the options whose label holds the text; `.ds-facet__empty` says when none does |
| Range | `data-ds-filter-bound` `min`, `max` in `.ds-facet__range` | two fields of one name | one filter `[min, max]` and one chip ("Storage: 256 to 1,024") |
| Label of a filter | `data-ds-filter-label` | a control or any ancestor | the name on its chips; default the facet's legend |
| Chip | `data-ds-filter-chip` `off`, `value` | a control or any ancestor | no chip, or the value alone |
| Size, shape, touch | `.ds-xs` ... `.ds-xl`, `.ds-shape-*`, `.ds-touch` | the layout, the panel or any ancestor | reach the rows, fields, buttons and chips, which compute them; the gaps step 4px per size step |
| Density | `.ds-density-*` | the layout, the panel or any ancestor | the gaps, 2px per step, and the rows' heights (4px per step) |
| Widths | `--ds-facets-width`, `--ds-facets-main-min`, `--ds-facets-gap` | the layout | the panel (280px), the least share of the list (50%), the gap (24px) |

There is no tone: a filter shows no meaning of its own. The titles keep the label role, counts and the count the meta
role. A checked option's label takes the label weight, so the choice shows by more than its check.

### Behaviour

`js/facets.js` (`data-ds-facets`, or `DS.facets.create(el, options)`) reads the named controls with the
[filter bar's](#filter-bar) rules and runs its engine (`DS.filterbar.filters()`):

- **Filters and changes.** Checkboxes, radios (a radio of `value=""` is "Any": no filter), selects, fields and ranges
  give `{ status: ['online'], storage: ['', '512'] }`. A change sends `ds:filter` (`{ filters, name, reason }`) on the
  panel; the page filters, re-renders its list, and writes the counts with `counts()` and the total with `count()`.
- **Applied chips and Clear all.** `.ds-facets__chips` gets an input chip per applied value ("Status: Online"); a chip
  removes its value and the focus moves to the next chip, else the one before, else the first filter.
  `.ds-facets__clear` empties every filter; it is `aria-disabled="true"` while nothing is applied, and
  `.ds-facets__applied` hides. Removals are announced ("Removed Status: Online", "Filters cleared"). A second
  `.ds-facets__applied` in `.ds-facets-layout__main` (optional, with its chips and Clear all) shows only while the
  layout is folded, so on a phone the applied filters stay in sight and removable without opening the sheet; when its
  last chip goes the focus moves to the toggle.
- **Result count.** `count(27)` writes "27 results" in `.ds-facets__count` (in the main part, or in the panel without a
  layout) and "Show 27 results" on `.ds-facets__results` at once. After a change by the user the count is announced
  once the changes pause (`--ds-delay-tooltip`), through the page's announcer, which also speaks while the panel sits
  in the modal sheet; the first count and `set()` stay quiet. `.ds-facets__count` is no live region of its own.
- **Counts.** `counts({ status: { online: 24, offline: 0 } })` writes each option's `.ds-check__count` in the locale.
  An option counted 0 that is not checked is disabled (or hidden, with `data-ds-facets-zero="hide"`), never while it has
  the focus; a checked one stays, so it can be unchecked.
- **Limit.** With `data-ds-facet-limit="4"` the first four options show, with every checked one, and
  `.ds-facet__more` says "Show all 12" (`aria-expanded="false"`); then "Show fewer". The focus stays on the button.
- **Search inside a facet.** Typing in the unnamed field of `.ds-facet__search` shows the options whose label holds the
  text (case and accents aside), whatever the limit; `.ds-facet__empty` says "No match for “x”". Once typing pauses
  (`--ds-delay-tooltip`) the number of matches is announced ("3 matches"). Escape empties the search first (a sheet
  around it stays open), then closes the sheet.
- **Folding.** In a `.ds-facets-layout` a `ResizeObserver` writes `data-folded` on the layout when the panel would wrap
  above `.ds-facets-layout__main`: the panel hides and `.ds-facets__toggle` shows, its `.ds-facets__badge` counting the
  applied filters ("Filters 2 applied" to a screen reader). The toggle opens the sheet with the panel moved into its
  body (`DS.filterbar.fold()`: the panel keeps its values, search and focus; its own title hides, as the sheet has
  one) and moves it back once the sheet closed. `.ds-facets__results` in the sheet's foot shows the count ("Show 27
  results") and closes it. Without the script nothing folds: the panel wraps above the list.

### JS API

```js
const panel = DS.facets.create(el);                       // the controller data-ds-facets makes
panel.get();                                              // { status: ['online'], storage: ['', '512'] }
panel.set({ owner: ['ada'] });                            // the controls follow; sends nothing
panel.clear();                                            // every filter, silent (panel.clear('status=online'): one chip)
panel.counts({ status: { online: 24, offline: 3 } });     // the counts of the options
panel.count(27);                                          // "27 results", "Show 27 results"
panel.open();                                             // the panel in its sheet now
panel.on('change', ({ filters }) => render(filters));
panel.update();                                           // after the page added or removed options

DS.facets.visible(options, { query, limit, expanded, zero });   // which options show: { shown, matches, total, more }
DS.facets.foldText('Ádá  Lovelace');                             // 'ada lovelace': the text a facet search compares
```

`DS.facets.create(el, options)` returns the controller (`get()`, `set(filters)`, `clear(key)`, `counts(map)`,
`count(value, forms)`, `open()`, `on('change', fn)`, `update()`, `destroy()`); `options.sheet` and `options.zero` stand
for the attributes. `DS.facets.visible(options, state)` and `DS.facets.foldText(text)` are its rules as pure
functions.

### Accessibility

- **Names and roles.** The panel is a `<section role="complementary">` (a complementary landmark, as an `<aside>`
  would be) named by its title. Each facet is a `<fieldset>` named by its `<legend>`, so a screen reader says "Status,
  group" before its options; every option is a native checkbox or radio with its label (the count is part of the name:
  "Online 24"). The facet search has an `aria-label`. The chips are buttons in a named group ("Remove filter Status:
  Online"). The count is announced by the system (no `aria-live` on `.ds-facets__count`).
- **Keyboard.** Tab walks the search, the options (radios: one stop, arrows choose), "Show all" and the fields; Space
  checks. In the sheet focus starts on the first control, Tab stays inside, Escape closes it (after emptying a facet
  search) and focus returns to "Filters".
- **Announcements.** Removals and Clear all; the matches of a facet search; the page's count after a change, once
  changes pause (also from the sheet).
- **Strings.** `facetShowAll`, `facetShowFewer`, `facetNoMatch`, `facetMatchesOne`, `facetMatchesOther`, and the filter
  bar's `removeFilter`, `filterRemoved`, `filtersCleared`, `filtersApplied`, `filterChip`, `resultsOne`,
  `resultsOther`, `showResults`, `rangeMin`, `rangeMax`, `rangeBetween` (`DS.core.config()`).

### Forced colours

The rows, fields, buttons and chips keep their own forced-colours models; the hairlines between facets are borders,
drawn in the system's text colour. A checked option keeps its check and its label weight.

### Hooks

| Hook | Default | What |
|---|---|---|
| `--ds-facets-width` | 280px | the panel beside the list |
| `--ds-facets-main-min` | 50% | the least share of the row the list keeps; the panel folds when both do not fit |
| `--ds-facets-gap` | `--ds-space-6` | the gap between the panel and the list at md, comfortable: 4px per size step, 2px per density step |
| `--ds-facet-max-height` | 264px | where the options of a `.ds-facet--scroll` facet scroll |

**Motion:** none of its own. Options show and hide at once; the chips are input chips; the sheet plays the side sheet's
motion; the list's change is the page's `DS.motion.flip()`.

<!-- changelog
- Facet filter panel (`DS.facets`, `.ds-facets-layout`, `__main`, `.ds-facets`, `__head`, `__title`, `__clear`,
  `__applied`, `__chips`, `__toggle`, `__badge`, `__count`, `__results`, `.ds-facet`, `--scroll`, `__title`,
  `__options`, `__search`, `__empty`, `__more`, `__range`, `__dash`, `data-folded`, `data-ds-facets-sheet`,
  `data-ds-facets-zero`, `data-ds-facet-limit`, hooks `--ds-facets-width`, `--ds-facets-main-min`, `--ds-facets-gap`,
  `--ds-facet-max-height`): facets with counts, a search inside long facets, a limit with "Show all", ranges, applied
  chips with Clear all, a side sheet when the layout is narrow; `counts()`, `count()`, `open()`, `visible()`,
  `foldText()`; a second applied row in the main part while folded; the count announced once changes pause. Strings `facetShowAll`, `facetShowFewer`, `facetNoMatch`, `facetMatchesOne`, `facetMatchesOther`.
- Filter bar: a radio of `value=""` is "Any" (no filter), and the one checked again once its filter is empty.
-->
