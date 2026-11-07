## Transfer list

Two lists side by side, the available options and the chosen ones, with buttons that move the marked options across:
the permissions of a role, the devices of a group. Each side is a [Listbox](#listbox) of several values with an
optional filter. For a short set a [Choice list](#choice-list) is quicker; to pick in a popover use the
[Select panel](#select-panel).

```html
<div class="ds-transfer" data-ds-transfer>
  <div class="ds-transfer__side" data-ds-transfer-side="source">
    <span class="ds-transfer__title" id="avail">Available</span>
    <input class="ds-input ds-transfer__search" type="search" aria-label="Filter available" placeholder="Filter">
    <div class="ds-listbox ds-transfer__list" role="listbox" aria-multiselectable="true" aria-labelledby="avail">
      <div class="ds-listbox__option" role="option" aria-selected="false" data-value="read">
        <span class="ds-listbox__check" aria-hidden="true">[icon check 16]</span><span class="ds-listbox__name">Read devices</span>
      </div>
    </div>
  </div>
  <div class="ds-transfer__actions" role="group" aria-label="Move">
    <button class="ds-btn ds-btn--outlined ds-btn--icon" type="button" data-ds-transfer-add aria-label="Add the marked" data-tip="Add the marked">[icon arrowRight 20]</button>
    <button class="ds-btn ds-btn--outlined ds-btn--icon" type="button" data-ds-transfer-remove aria-label="Remove the marked" data-tip="Remove the marked">[icon arrowLeft 20]</button>
  </div>
  <div class="ds-transfer__side" data-ds-transfer-side="target">
    <span class="ds-transfer__title" id="chosen">Chosen</span>
    <div class="ds-listbox ds-transfer__list" role="listbox" aria-multiselectable="true" aria-labelledby="chosen"></div>
  </div>
</div>
```

```js
const role = DS.transfer.create(el, { items: permissions, value: ['read'] });  // or DS.get(el) of data-ds-transfer
role.get();                         // ['read', 'restart']: the target, in the order they came
role.set(['read']);                 // from the page: no event
role.move(['restart']);             // as the add button: announced, ds:change; move(values, false) goes back
role.on('change', ({ value }) => save(value));
```

`DS.transfer.create(el, options)` returns the controller that `data-ds-transfer` makes (`DS.get(el)` finds it):
`get()`, `set(value)`, `move(values, toTarget)`, `on('change', fn)` and `destroy()`.

- **Marking** is each list's own choice (`DS.listbox`: Space, Shift with an arrow, Ctrl+A, a press, a Shift-press).
- **Moving.** `data-ds-transfer-add` moves the source's marked options to the end of the target, `data-ds-transfer-remove`
  the target's back to the source, in their first order. Enter in a list moves its marked options, else the active one,
  and leaves the focus in that list; a double-click moves the option under the pointer. A button is disabled while its
  side has nothing marked; moved options stay marked on their new side, so a move back is one press. Each move is
  announced ("Moved 3 to Chosen", the side's `.ds-transfer__title`) and sends `ds:change` (`{ value }`). A blocked
  option (`disabled`) stays where it is.
- **Data.** The options of both lists' markup (the value is the target's), or `items` (as `DS.listbox`) and `value`; a
  long side is windowed (`DS.virtual` through `DS.listbox`, `virtual`). `DS.transfer.move(from, to, moving, all)` is the
  arithmetic of a move.
- **Filter.** A `.ds-transfer__search` in a side filters its list (`DS.listbox.fuzzy`, the letters marked).

The controller: `get()`, `set(value)`, `on('change', fn)`, `move(values, toTarget)`, `lists` (`{ source, target }`, the
engines) and `destroy()`.

**Layout.** Both lists take one height (`--ds-transfer-list-height`, 264px), the buttons between them. Where the
transfer is 560px wide or less (a container query on itself) the sides stack and the buttons stand in a row between
them, their arrows a quarter turned.

**Options** ([options.md](options.md)): the lists are listboxes and the buttons icon buttons, which compute size,
density, shape and touch themselves; the transfer adds only gaps. No tone.

**Keyboard and names.** Tab: the filter, the list, the buttons, the other side. Name each list by its title
(`aria-labelledby`), each button by its action (and a `data-tip`), the button row with `role="group"`.

**Forced colours.** The lists are the listbox's; the buttons the button's.

**Hooks:** `--ds-transfer-list-height` (264px) ([theming.md](theming.md#component-hooks)).

**Motion:** none of its own: the options change sides at once, as a listbox renders new data; the check boxes are the
listbox's.
