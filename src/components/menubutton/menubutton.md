## Menu button

A button that opens a [menu](#menu), with a chevron that turns while it is open. With a menu of radio items it is a
choice ("Sort: Name") and shows what was chosen.

```html
<!-- Actions -->
<button class="ds-btn ds-menu-btn" type="button" aria-haspopup="menu" aria-expanded="false"
        aria-controls="export-menu" data-ds-menubutton="#export-menu">
  [icon download 16]Export[icon chevronDown 16 ds-chevron ds-menu-btn__chevron]
</button>
<div class="ds-menu" id="export-menu" role="menu" aria-label="Export" hidden>
  <button class="ds-menu__item" role="menuitem" type="button">[icon fileSpreadsheet 20]<span class="ds-menu__label">CSV</span></button>
  <button class="ds-menu__item" role="menuitem" type="button">[icon fileJson 20]<span class="ds-menu__label">JSON</span></button>
</div>

<!-- A choice: the button shows the checked radio -->
<button class="ds-btn ds-btn--quiet ds-menu-btn" type="button" aria-haspopup="menu" aria-expanded="false"
        aria-controls="sort-menu" data-ds-menubutton="#sort-menu">
  Sort: <span class="ds-menu-btn__value">Name</span>[icon chevronDown 16 ds-chevron ds-menu-btn__chevron]
</button>
<div class="ds-menu" id="sort-menu" role="menu" aria-label="Sort by" data-ds-menu-checks hidden>
  <button class="ds-menu__item" role="menuitemradio" type="button" aria-checked="true" value="name">
    [icon check 20 ds-menu__check]<span class="ds-menu__label">Name</span></button>
  <button class="ds-menu__item" role="menuitemradio" type="button" aria-checked="false" value="seen">
    [icon check 20 ds-menu__check]<span class="ds-menu__label">Last seen</span></button>
</div>

<!-- Icon only: no chevron, no class of its own -->
<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="More actions" data-tip="More actions"
        aria-haspopup="menu" aria-expanded="false" aria-controls="row-menu" data-ds-menubutton="#row-menu">[icon moreVertical 20]</button>
```

| Class | What |
|---|---|
| `.ds-menu-btn` | with `.ds-btn` in any look: the end padding before a chevron pulls in like a leading icon's (12px at md, 4px more per size above, never more than the side padding) |
| `.ds-menu-btn__value` | the chosen label of a choice: one line, an ellipsis when the button is narrower than its words |
| `.ds-menu-btn__chevron` | the chevron at the end, with `.ds-chevron` (motion.css), which turns it while `aria-expanded="true"` |

A menu trigger does not take the pressed tint while its menu is open ([Button](#button)): the turned chevron and
`aria-expanded` say it.

### Options

The button's: size (height, padding, type; the chevron's end padding steps with it), density (height), shape (the pill
and its press), touch (the minimum), any look. The menu's own options apply to the menu ([Menu](#menu)). No tone.

### Behaviour: `data-ds-menubutton`

`data-ds-menubutton` names the menu: a selector or an id; empty, the button's `aria-controls`, else the `.ds-menu` right
after the button. The module opens and closes it through `DS.overlay` with the button as its opener, and fills in what
the markup lacks: `aria-haspopup="menu"`, `aria-expanded`, `aria-controls` (and an id on the menu), and
`data-ds-menu-checks` on a menu of radio items. Write them in the markup as well: a re-render with `DS.dom.morphHtml`
keeps only what its template has.

| Attribute | On | Effect |
|---|---|---|
| `data-ds-menubutton` | the button | the menu it opens (see above) |
| `data-ds-value` | the button | the start of a choice: the radio with that value is checked |

A choice: the checked `menuitemradio` is the value (its `value` attribute, else `data-value`, else its label);
`.ds-menu-btn__value` shows its label. A user's pick sends `ds:change` (`{ value, item }`) on the button, after the menu
flipped the radio. A button that also has `data-ds-open` leaves opening to the overlay's trigger (the same keys).

### JS API

```js
const sort = DS.menubutton.create(button, { menu, value: 'name' });   // the controller data-ds-menubutton makes
sort.get();                         // 'name' (null without radio items)
sort.set('seen');                   // checks that radio and shows its label; no event
sort.on('change', ({ value, item }) => load({ sort: value }));
sort.open();  sort.close();         // the same as DS.menubutton.open(button), DS.menubutton.close(button)
DS.menubutton.open(button);         // DS.overlay.open(menu, { opener: button })
DS.menubutton.close(button);
DS.menubutton.menuOf(button);       // the menu a button names
DS.menubutton.itemValue(item);      // an item's value
```

`DS.menubutton.create(button, { menu, value, label })` takes a `label` element to show the chosen label in (default
`.ds-menu-btn__value`); the [split button](#split-button) points it at its action.
`DS.menubutton.open(button)` and `DS.menubutton.close(button)` open and close a button's menu through `DS.overlay` (the
button is the opener); `DS.menubutton.menuOf(button)` finds the menu a button names (the attribute's selector or id,
else `aria-controls`, else the `.ds-menu` right after it) and `DS.menubutton.itemValue(item)` reads an item's value
(its `value` attribute, else `data-value`, else its label).

### Accessibility

- The APG menu button: a `<button>` with `aria-haspopup="menu"`, `aria-expanded` and `aria-controls`. Enter, Space and a
  click open the menu on its first item and close it again; ArrowDown opens it on the first item, ArrowUp on the last.
  Inside the menu its keys are [DS.menu](#menu)'s: the arrows, Home, End, type-ahead; Escape closes it and focus
  returns to the button, Tab closes it and moves on. A second click of a double click does nothing.
- Its name is its words ("Sort: Name" reads as the chosen value); an icon-only menu button needs `aria-label` and a
  `data-tip` with the same words.
- The checked radio of a choice is its `aria-checked`, and a check in the menu; never the colour alone.
- Forced colours: the button's system colours; the chevron is `currentColor`.

### Hooks

The button's; `--ds-btn-padding-x` sets the side padding the chevron's end padding never exceeds.

**Motion:** the menu grows out of the button and leaves with a fade ([Menu](#menu)); the chevron turns over
`--ds-dur-medium` on the spring (`.ds-chevron`, a named exception of the rotate rule) and turns back from where it is
when the menu closes mid-way.
