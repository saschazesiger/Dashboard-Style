## Ordered choice

A multi-select whose order matters: the columns of a table, the order of fallbacks, priorities. Every option is a row
with a grip and a checkbox; the value is the checked ones in the order of the rows, and each checked row shows its
place. Rows move by drag and by keys through `DS.dnd` ([core.md](core.md#dsdnd-pointer-and-keyboard-drag)). For a
plain set use the [Choice list](#choice-list).

```html
<ol class="ds-orderedchoice" data-ds-orderedchoice data-ds-orderedchoice-max="5" aria-label="Columns">
  <li class="ds-orderedchoice__item">
    <button class="ds-btn ds-btn--quiet ds-btn--icon ds-grip" type="button" aria-label="Move Name">[icon grip 20]</button>
    <label class="ds-check"><input type="checkbox" name="column" value="name" checked><span>Name</span></label>
    <span class="ds-orderedchoice__rank"></span>
  </li>
  <li class="ds-orderedchoice__item">
    <button class="ds-btn ds-btn--quiet ds-btn--icon ds-grip" type="button" aria-label="Move Status">[icon grip 20]</button>
    <label class="ds-check"><input type="checkbox" name="column" value="status"><span>Status</span></label>
    <span class="ds-orderedchoice__rank"></span>
  </li>
</ol>
```

```js
const columns = DS.orderedchoice.create(list);  // or DS.get(list) of data-ds-orderedchoice
columns.get();                                  // ['name', 'status']: checked, in order
columns.order();                                // every value, in order
columns.set(['status', 'name']);                // checked, in this order, first (no event)
columns.move('status', 0);                      // as a drop: announced, ds:change
columns.on('change', ({ value, order }) => save(value));
```

- **Moving.** The grip drags its row (`DS.dnd`): by the pointer, or Space or Enter to lift, the arrows to move, Space to
  drop and Escape to cancel, each step announced ("Moved Status to position 1 of 6."). Alt+ArrowUp and Alt+ArrowDown on
  a row's checkbox or grip move it one place at once, Alt+Home and Alt+End to the ends; the focus stays. The rows glide
  to their places. Name each grip by its action ("Move Status").
- **Checking.** The native boxes. A checked row's label takes the label weight and its place shows at the end in a
  `.ds-orderedchoice__rank` disc (the module writes the number and, for a screen reader, "Position 2", which the box
  names through `aria-describedby`); an unchecked row shows none. The module adds the rank when a row has none.
- **Maximum** (`data-ds-orderedchoice-max`, `max`): with that many checked, the unchecked boxes are disabled and a
  `.ds-orderedchoice__status` after the list says "Up to 5 items"; a box the page disabled stays so.
- **Value.** The markup's `checked` and row order, or `value`; the boxes' `name` and `value` go with a form in the order
  of the rows. `ds:change` (`{ value, order }`) bubbles from the list after the user changed a box or the order.
  `DS.orderedchoice.arrange(order, value)` and `DS.orderedchoice.ranks(order, checked)` are the layout of `set()` and the
  places, without a DOM.

The controller: `get()`, `set(value)`, `order()`, `on('change', fn)`, `move(value, index)`, `refresh()` (the page added
or removed rows) and `destroy()`.

**Options** ([options.md](options.md)): the rows are `.ds-check` rows and the grips `.ds-btn` icon buttons, which
compute size, density and touch themselves.

| Option | Classes | Where it applies | Effect on the ordered choice |
|---|---|---|---|
| Size | `.ds-xs` ... `.ds-xl` | the list or any ancestor | the rows and grips (8px per step), the rank disc 4px per step |
| Density | `.ds-density-comfortable`, `-compact`, `-dense`, `-tight` | any container | the rows 4px less per step, their block padding 2px less (never below 0) |
| Shape | `.ds-shape-square`, `-soft`, `-default`, `-round` | any container or the theme | the radii of the box, the boxes and the rank disc |
| Touch | `.ds-touch` | the theme or a container | rows and grips at least `--ds-touch-target` (48px) |
| Tone | none | | an ordered choice shows no status of its own |

**Keyboard and names.** Tab reaches each grip and each box; the keys above move. The list is an `<ol>` with a name
(`aria-label` or `aria-labelledby`); the place is in words for a screen reader, never only a number in a disc.

**Forced colours.** The box keeps its border in `CanvasText`, the rank disc an edge; the row being moved is drag.css's
`Highlight` outline.

**Hooks:** `--ds-orderedchoice-radius` (`--ds-radius-card`) ([theming.md](theming.md#component-hooks)).

**Motion:** rows glide to their places (`DS.dnd` through `DS.motion.flip`, on `--ds-ease-spatial`); a lifted row is
raised with the dragged state layer, nothing scales; the rank disc fades in over `--ds-dur-fast` and out in
`--ds-dur-instant`.

<!-- changelog -->
- Ordered choice (3.0): `.ds-orderedchoice` with `DS.orderedchoice` (`data-ds-orderedchoice`): checked rows in an order
  of their own, moved by `DS.dnd` (pointer and keys) and by Alt with the arrows, Home and End; the place of each checked
  row in a disc and in words; a maximum; `DS.orderedchoice.arrange` and `DS.orderedchoice.ranks`.
