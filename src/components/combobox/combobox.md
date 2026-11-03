## Combobox

```html
<div class="ds-combo">
  <input class="ds-input ds-combo__input" role="combobox" aria-expanded="false" aria-controls="model-list"
         aria-autocomplete="list" aria-activedescendant="model-2" value="lat">
  <button class="ds-combo__toggle" type="button" tabindex="-1" aria-label="Show all">[icon chevronDown 20]</button>
  <div class="ds-combo__popup" hidden>
    <ul class="ds-combo__list" id="model-list" role="listbox">
      <li class="ds-combo__option" id="model-1" role="option" aria-selected="false">
        <span class="ds-combo__name">Latitude 5430</span><span class="ds-combo__meta">14", 2022</span></li>
      <li class="ds-combo__option" id="model-2" role="option" aria-selected="true" data-active>
        <span class="ds-combo__name">Latitude 7440</span><span class="ds-combo__meta">14", 2023</span></li>
    </ul>
    <p class="ds-combo__status" role="status">2 of 38</p>
  </div>
</div>
```

```js
DS.overlay.open(popup, { opener: input });   // shows the list; aria-expanded="true" on the field
DS.overlay.close(popup);                     // Escape closes it too; focus stays in the field
```

`data-active` marks the keyboard or pointer option (its layer fades in over `--ds-dur-micro` and goes at once, so a
held arrow key leaves no trail), `aria-selected="true"` the chosen one (the tint and the label weight; in forced
colours `SelectedItem`, and while it is also the active one a `CanvasText` ring inside). `aria-expanded="true"` on the field turns the chevron 180deg on the spatial spring;
`DS.overlay` sets it.

- **Open and close** with `DS.overlay` ([motion.md](motion.md#dsoverlay-jsoverlayjs)). The page filters and chooses:
  filtering never re-creates or re-hides the list, and when nothing matches the list keeps showing with the status
  line (`.ds-combo__list` `hidden`, the status says "No match") instead of closing. Closing on blur and on a choice
  is the page's script (`DS.overlay.close(popup)`). Keep the field focused while an option is pressed by cancelling
  `mousedown` on the list (and the toggle) and choose on `click`, never by cancelling `pointerdown`: in WebKit that
  swallows the click of a tap, so a tap on an option would choose nothing.
- **Motion.** The list grows out of the field: it fades in (`--ds-dur-fast`) while its clip opens from the field's
  edge and it grows from `--ds-scale-popup` at the field, both on the spatial spring (`--ds-dur-medium`); the shadow
  is there from the first frame. It leaves with a fade only (`--ds-dur-instant`). The motion runs on transitions
  keyed on `data-state`, so a list closed mid-way turns back from where it is. A page that only drops `hidden`
  (no `DS.overlay`) gets the same reveal once, as keyframes.
- **Placement.** Below the field when the list fits there, else on the side with more room (`data-placement="top"`
  above), and never taller than the room on that side: the list scrolls inside while the status line stays, so it
  never covers the field being typed into, even in a short window. Where popover and CSS anchor positioning exist, the
  list opens as a `popover="manual"` in the top layer, anchored to the field and as wide as it (`data-anchored`), so a
  scrolling dialog or sheet never clips it. Elsewhere it stays absolute under the field, its room counted in the
  window narrowed by every box around the field that clips (a dialog's box, a sheet's body), with an inline
  `max-height` while it is open. There such a box still clips the list, so keep a combobox off the very end of a
  dialog.
- **Cut edges.** A list longer than its room scrolls, and each edge with more to show fades over `--ds-scroll-fade`
  (default `--ds-space-8`; `0px` on the theme turns it off), a mask on the registered numbers of the
  [Horizontal scroller](#horizontal-scroller) turned to the block axis. Where scroll timelines exist the fades follow
  the list's own scroll; elsewhere `DS.overlay.open()` attaches `DS.dom.scrollEdges(list, { axis: 'block' })` while
  the list is open (its `data-ds-overflow-start` and `-end`), so the page adds nothing. The active option, scrolled
  into view, lands clear of the fades (`scroll-padding-block`).

**Select-only** (`.ds-combo--select`, pick one of a few rich options without typing): the field is a
`<button class="ds-input ds-combo__input" type="button" role="combobox" aria-haspopup="listbox">` that shows the
choice in `.ds-combo__value` and an optional `.ds-combo__meta` in one row (start-aligned, ellipsis). Options may hold
any content (a `.ds-progress` on the chosen option keeps a visible track on the tint).

```html
<label class="ds-field__label" id="plan-label">Plan</label>
<div class="ds-combo ds-combo--select">
  <button class="ds-input ds-combo__input" type="button" role="combobox" aria-haspopup="listbox" aria-expanded="false"
          aria-controls="plan-list" aria-labelledby="plan-label plan-value">
    <span class="ds-combo__value" id="plan-value">Standard</span><span class="ds-combo__meta">4 devices</span>
  </button>
  <button class="ds-combo__toggle" type="button" tabindex="-1" aria-label="Show plans">[icon chevronDown 20]</button>
  <div class="ds-combo__popup" hidden>
    <ul class="ds-combo__list" id="plan-list" role="listbox" aria-labelledby="plan-label"> ... options ... </ul>
  </div>
</div>
```

The keys are the page's script, as the WAI select-only pattern says: Enter, Space, ArrowDown and ArrowUp open the
list on the chosen option; the arrows move `data-active` (and `aria-activedescendant` on the button), Home and End go
to the ends, Enter or Space chooses and closes, Escape closes, a printable key moves to the next option that starts
with the typed letters. Focus stays on the button.

`aria-disabled="true"` on an option draws it in the disabled ink with no active layer (skip it in your keys).
Without a `.ds-combo__toggle` the field keeps only its own end padding. The field reads `--ds-input-height` (40px),
the toggle is that size; options are at least `--ds-combo-option-height` (48px) tall.

The toggle is a round 40px target with a state layer (hover, press in `--ds-dur-micro`), the ripple and the press
morph of every pill; it stays `tabindex="-1"` (the field opens the list from the keyboard), so it has no ring.
Options get no ripple: pressing one selects it and closes the list, and the state layer is the feedback.

**Motion:** the "Combobox list" row of [Overlays](motion.md#overlays) in motion.md.

