## Choice list

Several of a set of options as checkboxes, with what a long set needs: a "select all" box that shows all, none or
some, a count, a filter, columns and a box that scrolls on its own. The rows are the [Form](#form)'s `.ds-check` rows,
native checkboxes, so forms, labels and the keyboard stay native. For a short set a plain `.ds-check` list is enough;
for a set in a popover use the [Select panel](#select-panel).

```html
<fieldset class="ds-field">
  <legend class="ds-field__label">Sites</legend>
  <div class="ds-choices ds-choices--columns ds-choices--scroll" data-ds-choices>
    <div class="ds-choices__tools">
      <input class="ds-input ds-choices__search" type="search" aria-label="Filter sites" placeholder="Filter">
      <label class="ds-check"><input type="checkbox" data-ds-choices-all><span>Select all</span></label>
      <span class="ds-choices__count"></span>
    </div>
    <div class="ds-choices__list" role="group" aria-label="Sites">
      <label class="ds-check"><input type="checkbox" name="site" value="north" checked><span>North building</span></label>
      <label class="ds-check"><input type="checkbox" name="site" value="lab"><span>Lab</span></label>
    </div>
    <p class="ds-choices__empty" role="status" hidden>No sites match.</p>
  </div>
</fieldset>
```

| Variant | What |
|---|---|
| `.ds-choices--columns` | the rows flow into columns of at least `--ds-choices-column-width` (180px), at most `--ds-choices-columns` (4), row by row, so the Tab order follows the eye; one column where there is no room for two |
| `.ds-choices--scroll` | the list is an outlined box that scrolls on its own beyond `--ds-choices-max-height` (264px, about six rows); its cut edges fade (`DS.dom.scrollEdges()` writes `data-ds-edges`, `data-ds-overflow-start` and `data-ds-overflow-end`) |

The parts are optional: a list alone gets the checked rows' weight and `ds:change`; add the tools a set needs.

- **Select all** (`input[data-ds-choices-all]`, anywhere in the `.ds-choices`): acts on the rows that show and are not
  blocked. All of them checked turns them off, else on. It is checked when all of them are, indeterminate when some are,
  disabled when none can change. Each box it changes sends its own `input` and `change`, then the list one `ds:change`;
  the new count is announced. Name it for what it does ("Select all", "All sites").
- **Count** (`.ds-choices__count`): "3 selected" or "All selected", empty with none (the strings `selectedCount` and
  `allSelected`).
- **Filter** (`.ds-choices__search`, a search field): the rows that do not match `DS.listbox.fuzzy()` (words in any
  order, letters in order, case and accents aside) are `hidden`, the matched letters marked in a `.ds-choices__match`
  (weight and a line, never colour alone). `.ds-choices__empty` shows when none match (the module makes one that says
  "No results" when the markup has none). Escape in a filled filter clears it and goes no further.
- A checked row's label takes the label weight, so the choice shows by more than the box.

```js
const sites = DS.choices.create(el);     // or DS.get(el) of data-ds-choices
sites.get();                             // ['north']
sites.set(['north', 'lab']);             // from the page: no event
sites.filter('lab');                     // returns how many rows show
sites.on('change', ({ value }) => save(value));
DS.choices.summary(boxes);               // 'all', 'none' or 'some' of { checked, disabled }
```

The controller: `get()`, `set(value)`, `on('change', fn)`, `filter(text)`, `refresh()` (the page added or removed rows)
and `destroy()`. `ds:change` (`{ value }`) bubbles from the `.ds-choices` when the user changed a box. `DS.choices.create`
takes `value` (the checked values to start with) and `count: false` (leave the count to the page).

**Options** ([options.md](options.md)): the rows are `.ds-check` rows, which compute size, density and touch
themselves.

| Option | Classes | Where it applies | Effect on the choice list |
|---|---|---|---|
| Size | `.ds-xs` ... `.ds-xl` | the list or any ancestor | the rows (8px per step) and their type, as every `.ds-check` |
| Density | `.ds-density-comfortable`, `-compact`, `-dense`, `-tight` | any container | the rows 4px less per step; the scrolling box's padding 2px less |
| Shape | `.ds-shape-square`, `-soft`, `-default`, `-round` | any container or the theme | the boxes' and the scrolling box's radius |
| Touch | `.ds-touch` | the theme or a container | every row at least `--ds-touch-target` (48px) |
| Tone | none | | a choice list shows no status of its own |

**Keyboard and names.** Native checkboxes: Tab reaches each box (row by row in columns), Space toggles. Put the list in a
`fieldset.ds-field` with its legend, or give `.ds-choices__list` `role="group"` and a name; label the filter
(`aria-label` or a `<label>`). A blocked row: `disabled` or `aria-disabled="true"` on its box (form.css), left out of
"select all".

**Forced colours.** The boxes are form.css's; the scrolling box keeps its border in `CanvasText`; the marks keep their
line.

**Hooks:** `--ds-choices-column-width` (180px), `--ds-choices-columns` (4), `--ds-choices-max-height` (264px) and
`--ds-scroll-fade` ([theming.md](theming.md#component-hooks)).

**Motion:** the boxes' own (form.css: the check wipes in, the dash of "some" grows from the centre); the scrolling
box's fades glide over `--ds-dur-fast`.

<!-- changelog -->
- Choice list (3.0): `.ds-choices` with `DS.choices` (`data-ds-choices`): "select all" with the indeterminate state, a
  count, a fuzzy filter that marks its letters, columns (`.ds-choices--columns`) and a scrolling box
  (`.ds-choices--scroll`) for long sets; `DS.choices.summary`.
