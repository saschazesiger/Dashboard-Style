## Split button

One pill with two targets: the main action, and a menu of related actions or of the action's variants (save, or save
as a draft; merge, or squash and merge).

```html
<!-- The action and related actions -->
<div class="ds-btn-group ds-split-btn" role="group" aria-label="Save" data-ds-splitbutton>
  <button class="ds-btn ds-btn--filled ds-split-btn__action" type="button"><span class="ds-split-btn__label">Save</span></button>
  <button class="ds-btn ds-btn--filled ds-split-btn__toggle" type="button" aria-label="More save options"
          aria-haspopup="menu" aria-expanded="false" aria-controls="save-menu">[icon chevronDown 20 ds-chevron]</button>
</div>
<div class="ds-menu" id="save-menu" role="menu" aria-label="Save options" hidden>
  <button class="ds-menu__item" role="menuitem" type="button">[icon fileText 20]<span class="ds-menu__label">Save as draft</span></button>
  <button class="ds-menu__item" role="menuitem" type="button">[icon duplicate 20]<span class="ds-menu__label">Save as a copy</span></button>
</div>

<!-- A choice: the menu picks the action's variant -->
<div class="ds-btn-group ds-split-btn" role="group" aria-label="Merge" data-ds-splitbutton>
  <button class="ds-btn ds-btn--filled ds-split-btn__action" type="button" value="merge">
    <span class="ds-split-btn__label">Merge</span></button>
  <button class="ds-btn ds-btn--filled ds-split-btn__toggle" type="button" aria-haspopup="menu" aria-expanded="false"
          aria-controls="merge-menu">[icon chevronDown 20 ds-chevron]</button>
</div>
<div class="ds-menu" id="merge-menu" role="menu" aria-label="Merge method" data-ds-menu-checks hidden>
  <button class="ds-menu__item" role="menuitemradio" type="button" aria-checked="true" value="merge">
    [icon check 20 ds-menu__check]<span class="ds-menu__label">Merge</span></button>
  <button class="ds-menu__item" role="menuitemradio" type="button" aria-checked="false" value="squash">
    [icon check 20 ds-menu__check]<span class="ds-menu__label">Squash and merge</span></button>
</div>
```

| Class | What |
|---|---|
| `.ds-split-btn` | the group, with `.ds-btn-group` ([Button group](#button-group): the pill's ends, square inner corners, the divider) and `role="group"` |
| `.ds-split-btn__action` | the action: a `.ds-btn`; its click is the page's |
| `.ds-split-btn__label` | the action's words; a choice writes the chosen label here; an ellipsis when it is too narrow |
| `.ds-split-btn__toggle` | the menu half: a `.ds-btn` with the chevron only (20px, `.ds-chevron` turns it while open), 8px of side padding at md (2px per size step), at least `--ds-target-min` wide |

Both buttons take the same look: `--filled` for the main action of its area (one per area), `--tonal`, or outlined.
Put the menu right after the group (or name it with the toggle's `aria-controls`).

### Options

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Look | `--filled`, `--tonal` or none, on both buttons | the buttons | the fill; a hairline divider parts the targets of a filled or tonal pill |
| Size | `.ds-xs` ... `.ds-xl` | the group or any ancestor | height, padding, type; the toggle's side padding steps 2px per size |
| Density | `.ds-density-*` | any container | the height |
| Shape | `.ds-shape-*` | any container or the theme | the pill's ends and their press times `--ds-shape` |
| Touch | `.ds-touch` | the theme or a container | the height, and the toggle at least as wide as the touch target |

No tone: a destructive action never hides in a split button.

### Behaviour: `data-ds-splitbutton`

On the group. The toggle becomes a [menu button](#menu-button) (`DS.menubutton`): it opens and closes the menu through
`DS.overlay`, under the toggle, and fills in `aria-haspopup`, `aria-expanded` and `aria-controls`. A toggle without
`aria-label` gets one from the strings: "More options for Save" (`moreOptionsFor`, `DS.config({ strings })`).

A choice: when the menu holds `menuitemradio` items, the checked one is the action's variant: its label shows in
`.ds-split-btn__label`, its value (the item's `value`, else `data-value`, else its label) goes to the action's `value`
attribute, so the action's click handler reads `event.currentTarget.value`. A user's pick sends `ds:change`
(`{ value, item }`) on the group and does not run the action. `data-ds-value` on the group is the start.

### JS API

```js
const merge = DS.splitbutton.create(group, { value: 'squash' });   // the controller data-ds-splitbutton makes
merge.get();                      // 'squash'
merge.set('merge');               // from the page: no event
merge.on('change', ({ value }) => remember(value));
merge.open();  merge.close();     // the menu
merge.action;  merge.toggle;  merge.menu;
DS.splitbutton.partsOf(group);    // { action, toggle, menu }
```

`DS.splitbutton.create(group, options)` returns the controller, one per group: on a group the attribute set up it
returns that controller (`value` through `set()`); `DS.splitbutton.partsOf(group)` finds the parts as the module does.

### Accessibility

- Two tab stops: the action, then the toggle. The action is a plain button (Enter, Space). The toggle is an APG menu
  button: Enter, Space or ArrowDown open the menu on its first item, ArrowUp on its last, Escape closes it and focus
  returns to the toggle, Tab closes it and moves on.
- Names: the group's `aria-label` names the pair; the toggle's name says what it opens ("More save options"), never
  just "More". A choice's action reads the chosen label.
- The checked variant is `aria-checked` with a check in the menu, never the colour alone.
- Forced colours: the buttons' system colours, the divider `ButtonBorder`.

### Hooks

None of its own: the buttons read the button hooks, the pill reads `--ds-btn-group-radius` and
`--ds-btn-group-divider`.

**Motion:** each half presses on its own: the state layer, the ripple and the morph of its outer corners (the button
group's). The menu grows out of the toggle ([Menu](#menu)) while the chevron turns over `--ds-dur-medium` on the spring.
