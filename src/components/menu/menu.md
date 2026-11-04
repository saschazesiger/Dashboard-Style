## Menu

Actions for one item, or the overflow of a toolbar, opened from a button:

```html
<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="More actions"
        aria-haspopup="menu" aria-expanded="false" aria-controls="row-menu">[icon moreVertical 20]</button>
<div class="ds-menu" role="menu" id="row-menu" aria-label="Actions" hidden>
  <button class="ds-menu__item" role="menuitem" type="button">[icon pencil 20]<span class="ds-menu__label">Edit</span></button>
  <button class="ds-menu__item" role="menuitem" type="button">[icon copy 20]<span class="ds-menu__label">Duplicate</span></button>
  <button class="ds-menu__item" role="menuitemcheckbox" type="button" aria-checked="true">
    [icon check 20 ds-menu__check]<span class="ds-menu__label">Pinned</span></button>
  <div class="ds-menu__divider" role="separator"></div>
  <button class="ds-menu__item" role="menuitem" type="button" aria-disabled="true">[icon trash 20]<span class="ds-menu__label">Delete</span></button>
</div>
```

Declaratively (3.0): `data-ds-open="#row-menu"` on the trigger toggles the menu on a click and opens it from ArrowDown
(the first item) and ArrowUp (the last). By hand, what it does is:

```js
trigger.addEventListener('click', (event) => {
  if (event.detail > 1) return;                    // the second click of a double click toggles nothing
  if (trigger.getAttribute('aria-expanded') === 'true') DS.overlay.close(menu);
  else DS.overlay.open(menu, { opener: trigger });
});
trigger.addEventListener('keydown', (event) => {
  // ArrowDown opens on the first item, ArrowUp on the last.
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
  event.preventDefault();
  DS.overlay.open(menu, { opener: trigger });
});
```

### Options

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Size | `.ds-xs` ... `.ds-xl` | the menu or any ancestor | a row's height, 8px per step from 48px; the type (`--ds-size-font`, the body role by default) |
| Density | `.ds-density-*` | the menu or any ancestor | a row's height, 4px per step; the menu's block padding, 2px per step. A row's side padding is room for its icon and label and stays |
| Touch | `.ds-touch` | the menu or any ancestor | a row is at least `--ds-touch-target` high, whatever the size and density |
| Shape | `.ds-shape-*` | the menu or any ancestor | multiplies the menu's radius; a row is square |
| Danger | `.ds-menu__item--danger` | one item | the error ink (`--ds-menu-danger-color`) on its label and icon, for an action that destroys; the label names the consequence, so the colour is never alone |

### Items

```html
<div class="ds-menu" role="menu" id="more" aria-label="More actions" data-ds-menu-checks hidden>
  <button class="ds-menu__item" role="menuitem" type="button" aria-keyshortcuts="Control+E">[icon archive 20]
    <span class="ds-menu__content">
      <span class="ds-menu__label">Archive</span>
      <span class="ds-menu__description">Hide it from every list.</span>
    </span>
    <span class="ds-menu__shortcut">Ctrl E</span></button>
  <button class="ds-menu__item ds-menu__item--danger" role="menuitem" type="button">[icon trash 20]<span class="ds-menu__label">Delete device</span></button>
</div>
```

`.ds-menu__content` holds `.ds-menu__label` and a `.ds-menu__description` under it (meta type, wrapping; part of the
item's name, or point `aria-describedby` at it). `.ds-menu__shortcut` is the shortcut slot at the item's end (meta type,
tabular; say it to a screen reader with `aria-keyshortcuts`). `data-ds-menu-checks` on the menu: the system flips its
check items, a `menuitemcheckbox` toggles and a `menuitemradio` takes the one check of its group, once the item's own
handlers ran, and sends `ds:change` (`detail: { item, checked }`). Without it your click handler flips `aria-checked`,
as in 2.x.

### Behaviour

- **Keyboard and focus** (`DS.overlay`, [motion.md](motion.md#dsoverlay-jsoverlayjs)): opening focuses the first
  enabled item (the last one when an ArrowUp keydown opened it); ArrowUp, ArrowDown, Home and End move focus, wrapping;
  Escape closes and focuses the trigger; Tab closes and moves on from the trigger. Activating an item (a click, Enter
  or Space) closes the menu once the item's own `click` handlers ran; focus goes back to the trigger unless a handler
  moved it (a dialog it opened). A `pointerdown` outside the menu and its trigger closes it without moving focus.
  `aria-expanded` on the trigger follows.
- **Items.** `.ds-menu__item` is a 48px row: an icon (`--ds-text-2`) and `.ds-menu__label` (one line, ellipsis), a
  state layer for hover, press and focus, an inset focus ring and the ripple. `role="menuitemcheckbox"` with
  `aria-checked`: the check (`.ds-menu__check` on its icon) shows only when checked and keeps its room otherwise, so
  the labels line up; your click handler flips `aria-checked`. `aria-disabled="true"` keeps an item focusable (its name
  is read) with the disabled ink, no hover, no press and no ripple; `DS.overlay` ignores its clicks, and
  `DS.motion.guard()` keeps them from your handlers too (no page guard needed).
  `.ds-menu__divider` separates groups. `.ds-menu__meta` at an item's end holds a shortcut (`.ds-kbd`) or the word "On" /
  "Off" of a `menuitemcheckbox` (meta type, tabular). `--ds-menu-item-height` (48px) sets the row height.
- **Groups and radio items.** A `<div role="group" aria-labelledby>` with a `.ds-menu__heading` (caption type, not
  focusable: the arrow keys pass it by) holds `role="menuitemradio"` items; the check shows on the one with
  `aria-checked="true"` (your click handler moves it):

  ```html
  <div role="group" aria-labelledby="sort-h">
    <p class="ds-menu__heading" id="sort-h">Sort by</p>
    <button class="ds-menu__item" role="menuitemradio" type="button" aria-checked="true">[icon check 20 ds-menu__check]<span class="ds-menu__label">Name</span></button>
    <button class="ds-menu__item" role="menuitemradio" type="button" aria-checked="false">[icon check 20 ds-menu__check]<span class="ds-menu__label">Last seen</span></button>
  </div>
  <button class="ds-menu__item" role="menuitem" type="button">[icon copy 20]<span class="ds-menu__label">Copy link</span><span class="ds-menu__meta">Ctrl C</span></button>
  ```

- **Type-ahead.** A printable key moves focus to the next item whose label starts with the letters typed so far;
  they reset after `--ds-delay-tooltip` (`DS.overlay`).
- **Placement.** Below the trigger from its start edge, flipped towards the start edge when there is no room; above
  the trigger when it does not fit below and there is more room above; 112px to 280px wide, and never taller than the
  room on its side (it scrolls inside), so it never covers its trigger. Where popover and CSS anchor positioning
  exist the menu is a `popover="manual"` in the top layer, anchored to the trigger (`data-anchored`); elsewhere
  `DS.overlay` writes `--ds-menu-x` and `--ds-menu-y` (`position: fixed`, plus an inline `max-height` when it is
  capped), sets `data-placement="top"` above and follows scrolling and resizing.
- **Cut edges.** A menu capped by the room on its side scrolls, and each edge with more to show fades into the menu's
  surface: a sticky shade in `--ds-surface-popover`, `--ds-scroll-fade` long (`0px` turns it off), above the items
  and never in the way of the pointer (the menu is its own surface, so a mask would cut its shadow). Where scroll
  timelines exist it follows the menu's scroll; elsewhere `DS.overlay.open()` attaches
  `DS.dom.scrollEdges(menu, { axis: 'block' })` while the menu is open. Focus moved by the keys lands clear of the
  shades. Forced colours drop them.
- **Inside a dialog or sheet.** A native dialog or sheet opened with `showModal()` makes everything outside it inert,
  top-layer popovers included. A menu used from inside one goes inside it in the markup; a menu that sits elsewhere
  (at the end of the `.ds-theme`, as above) is moved into the open native dialog or sheet by `DS.overlay.open()` and
  put back once it closed.
- **Motion.** As the combobox list: it fades in while its clip opens from the trigger's edge and it grows from
  `--ds-scale-popup` at the trigger on the spatial spring, and leaves with a quick fade; a menu closed mid-way turns
  back from where it is. Shown by hand (dropping `hidden` without `DS.overlay`) it reveals itself once.
- The menu sits inside the `.ds-theme` element, like every overlay. Forced colours keep its edge.

### Names and forced colours

- Names and roles: the trigger has `aria-haspopup="menu"`, `aria-expanded` (kept in step) and `aria-controls`; the menu
  `role="menu"` and a name; its rows `role="menuitem"`, `menuitemcheckbox` or `menuitemradio` with `aria-checked`; a
  group `role="group"` with `aria-labelledby` its heading.
- Forced colours: the transparent outline becomes its edge, the focused item keeps its ring, a blocked item is
  `GrayText`, the edge shades go; a danger item keeps the system's text, its label says what it does.

### Hooks

`--ds-menu-item-height`, `--ds-menu-font`, `--ds-menu-padding`, `--ds-menu-radius`, `--ds-menu-danger-color`
([theming.md](theming.md#component-hooks)). `data-ds-menu` marks a menu that `DS.get(el, 'menu')` serves.

**JS API.** `js/menu.js` (`DS.menu`): `open(el, options)` and `close(el, options)` are `DS.overlay.open()` and `close()`; `create(el)` returns the controller that `data-ds-menu` makes (`get()`, `set(value, options)`, `on(type, fn)`, `destroy()`).

**Motion:** the "Menu" row of [Overlays](motion.md#overlays) in motion.md.

<!-- changelog -->
- Menu (3.0): behaviour in `js/menu.js` (`DS.menu`). `.ds-menu__content`, `.ds-menu__description`, `.ds-menu__shortcut`,
  `.ds-menu__item--danger`, `data-ds-menu-checks`. Size, density, touch and shape on the rows and the menu; the default
  row stays 48px. Placement in `js/position.js`. `data-ds-open` toggles a menu and opens it from its arrow keys.

