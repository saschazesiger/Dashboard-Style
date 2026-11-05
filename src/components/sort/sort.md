## Sort control

The field and the direction of a list or a set of cards, outside a table (a [table](#table) sorts in its header). The
direction is said in the field's own words ("A to Z", "Newest first"), never by the arrow alone.

Inline: a label, a select of the fields and an order button.

```html
<div class="ds-sort" data-ds-sort role="group" aria-label="Sort devices">
  <label class="ds-sort__label" for="sort-field">Sort by</label>
  <select class="ds-input ds-sort__field" id="sort-field">
    <option value="name" data-ds-sort-type="text">Name</option>
    <option value="seen" data-ds-sort-type="date" data-ds-sort-default="descending" selected>Last seen</option>
    <option value="storage" data-ds-sort-type="number">Storage</option>
  </select>
  <button class="ds-btn ds-btn--quiet ds-sort__order" type="button">[icon arrowUp 20 ds-sort__arrow]<span class="ds-sr">Order: </span>
    <span class="ds-sort__words"><span class="ds-sort__word">Oldest first</span><span class="ds-sort__word">Newest first</span></span></button>
</div>
```

Menu (`.ds-sort--menu`): one button that names the field and points the direction, and a [menu](#menu) of the fields
and the two directions. It fits a toolbar or a phone.

```html
<div class="ds-sort ds-sort--menu" data-ds-sort data-ds-value="name">
  <button class="ds-btn ds-sort__trigger" type="button" aria-haspopup="menu" aria-expanded="false" data-ds-open="#sort-menu">
    [icon sort 20]<span class="ds-sr">Sort by </span><span class="ds-sort__value">Name</span><span class="ds-sr">, </span>
    <span class="ds-sort__words ds-sr"><span class="ds-sort__word">A to Z</span><span class="ds-sort__word">Z to A</span></span>
    [icon arrowUp 20 ds-sort__arrow]</button>
  <div class="ds-menu" id="sort-menu" role="menu" aria-label="Sort" hidden>
    <div role="group" aria-labelledby="sort-by">
      <p class="ds-menu__heading" id="sort-by">Sort by</p>
      <button class="ds-menu__item" role="menuitemradio" aria-checked="true" type="button" data-ds-sort-field="name" data-ds-sort-type="text">
        [icon check 20 ds-menu__check]<span class="ds-menu__label">Name</span></button>
      <button class="ds-menu__item" role="menuitemradio" aria-checked="false" type="button" data-ds-sort-field="seen" data-ds-sort-type="date" data-ds-sort-default="descending">
        [icon check 20 ds-menu__check]<span class="ds-menu__label">Last seen</span></button>
    </div>
    <div class="ds-menu__divider" role="separator"></div>
    <div role="group" aria-labelledby="sort-order">
      <p class="ds-menu__heading" id="sort-order">Order</p>
      <button class="ds-menu__item" role="menuitemradio" aria-checked="true" type="button" data-ds-sort-direction="ascending">
        [icon check 20 ds-menu__check]<span class="ds-menu__label">A to Z</span></button>
      <button class="ds-menu__item" role="menuitemradio" aria-checked="false" type="button" data-ds-sort-direction="descending">
        [icon check 20 ds-menu__check]<span class="ds-menu__label">Z to A</span></button>
    </div>
  </div>
</div>
```

### Options

| Option | Classes, attributes | Where it applies | Effect |
|---|---|---|---|
| Look | none (inline), `.ds-sort--menu` | `.ds-sort` | a select and an order button, or one button with a menu |
| Field type | `data-ds-sort-type` `text`, `number`, `date` | an option or a field item | the words of the two directions: "A to Z", "Lowest first", "Oldest first"; without one "Ascending" and "Descending" |
| Own words | `data-ds-sort-asc`, `data-ds-sort-desc` | an option or a field item | the field's own words ("Smallest first") |
| Start direction | `data-ds-sort-default` `ascending`, `descending` | an option or a field item | the direction a change to this field starts in (dates: newest first); without it the direction stays |
| First state | `data-ds-value` (`name`, `-name`) | `.ds-sort` | else the selected option or checked items, ascending |
| Size, density, shape, touch | `.ds-xs` ... `.ds-xl`, `.ds-density-*`, `.ds-shape-*`, `.ds-touch` | `.ds-sort` or any ancestor | reach the select and the buttons, which compute them; the gap steps 4px per size step. The label keeps its role |
| Field width | `--ds-sort-field-width` | `.ds-sort` | the select's least width (160px) |

There is no tone: a sort shows no meaning of its own. The inline look wraps at its gap; in a content area of at most
480px its visible label goes (it still names the select).

### Behaviour

The system (`js/sort.js`, `data-ds-sort`) keeps the markup in step: `data-state="ascending"` or `"descending"` on
`.ds-sort`, the words of every `.ds-sort__words` (two `.ds-sort__word` stacked in one cell, so the order button keeps its
width; only the current one shows), the field's name in `.ds-sort__value`, and `aria-checked` and the direction words of
the menu items. The order button flips the direction; the select and the field items change the field, which starts in
its `data-ds-sort-default` direction. The page sorts: it listens for `ds:sort` and re-renders its list with
`DS.dom.morphHtml` inside `DS.motion.flip()` (keyed rows glide to their places).

### JS API

```js
const sort = DS.sort.create(el);           // the controller data-ds-sort makes
sort.get();                                 // { field: 'seen', direction: 'descending' }
sort.set('-name');                          // or { field: 'name', direction: 'descending' }; tells nothing
sort.on('change', ({ field, direction, label, words }) => render());
el.addEventListener('ds:sort', (event) => render(event.detail));
DS.sort.parse('-seen');                     // { field: 'seen', direction: 'descending' }
DS.sort.stringify({ field: 'seen', direction: 'descending' });   // '-seen'
```

`DS.sort.create(el)` returns the controller (`get()`, `set(value)`, `on('change', fn)`, `update()` after the fields
changed, `destroy()`); `DS.sort.parse(text)` reads `name`, `-name`, `+name`, `name:asc` and `name:desc`, and
`DS.sort.stringify(state)` writes what it reads (the form [saved views](#saved-views) put into the address). A change by
the user sends `ds:sort` with `{ field, direction, label, words }` on `.ds-sort`; `set()` from the page sends nothing.

### Accessibility

- **Names and roles.** The inline look is a `role="group"` with a name; the select is named by its label (kept for
  screen readers when it hides at narrow widths). The order button is named by its words ("Order: Newest first"):
  a button whose name says the order now, not a toggle. The menu trigger says the field and the order ("Sort by Name,
  A to Z"); the menu items are `menuitemradio` in two named groups.
- **Keyboard.** Tab reaches the select and the order button; the select's own keys choose a field; Enter or Space on
  the order button flips the order. The menu: ArrowDown or Enter opens it, the arrows, Home, End and type-ahead move,
  Enter or Space chooses and closes, Escape closes ([Menu](#menu)).
- **Announcements.** A change by the user is spoken politely: "Sorted by Last seen, Newest first" (the string
  `sortAnnounce`).
- **Strings.** `sortAscending`, `sortDescending`, `sortAscendingText`, `sortDescendingText`, `sortAscendingNumber`,
  `sortDescendingNumber`, `sortAscendingDate`, `sortDescendingDate` and `sortAnnounce` of `DS.core.config()`.

### Forced colours

The arrow and the words are text in the system colours; the select and buttons keep theirs. Nothing of its own.

### Hooks

| Hook | Default | What |
|---|---|---|
| `--ds-sort-field-width` | 160px | the least width of the inline field select |

**Motion:** the arrow turns 180deg on the spring (`--ds-dur-medium`, `--ds-ease-spatial`) when the direction changes,
as the table's sort arrow; the words change at once. The list's reorder is the page's `DS.motion.flip()`.

<!-- changelog
- Sort control (`DS.sort`, `.ds-sort`, `.ds-sort--menu`, `.ds-sort__field`, `.ds-sort__label`, `.ds-sort__order`,
  `.ds-sort__trigger`, `.ds-sort__value`, `.ds-sort__words`, `.ds-sort__word`, `.ds-sort__arrow`, hook
  `--ds-sort-field-width`): the field and direction of a list or cards outside a table, inline or as a menu, with the
  direction in the field's words, `ds:sort`, an announcement, and `parse()` / `stringify()` for addresses. Strings
  `sortAscending`, `sortDescending`, `sortAscendingText`, `sortDescendingText`, `sortAscendingNumber`,
  `sortDescendingNumber`, `sortAscendingDate`, `sortDescendingDate`, `sortAnnounce`.
-->
