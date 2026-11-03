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

**Motion:** the "Menu" row of [Overlays](motion.md#overlays) in motion.md.

