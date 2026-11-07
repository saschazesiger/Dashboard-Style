## Combobox

A searchable list under a field: the page filters and chooses, `DS.overlay` opens and closes it.

```html
<div class="ds-combo">
  <input class="ds-input ds-combo__input" role="combobox" aria-expanded="false" aria-controls="model-list"
         aria-autocomplete="list" aria-activedescendant="model-2" value="lat">
  <button class="ds-combo__toggle" type="button" tabindex="-1" aria-label="Show all">[icon chevronDown 20]</button>
  <div class="ds-combo__popup" hidden>
    <ul class="ds-combo__list" id="model-list" role="listbox">
      <li class="ds-combo__option" id="model-1" role="option" aria-selected="false">
        <span class="ds-combo__name">Laptop 13</span><span class="ds-combo__meta">13", 2022</span></li>
      <li class="ds-combo__option" id="model-2" role="option" aria-selected="true" data-active>
        <span class="ds-combo__name">Laptop 14</span><span class="ds-combo__meta">14", 2023</span></li>
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

**Groups and descriptions**: the WAI grouped listbox. The list is then a `<div>`, each group a `<ul>` whose first item
is a `.ds-combo__heading` (caption type, `role="presentation"`, named by the group's `aria-labelledby`). A
`.ds-combo__description` is a longer line under the name that wraps, where `.ds-combo__meta` stays on one line and ends
in an ellipsis. A heading never takes `data-active`, so the page's keys walk `.ds-combo__option` as ever. Filter by
setting `hidden` on the options: a group with no option left goes by itself, with its heading and its line, and the
line never stands above the first group that still shows.

```html
<div class="ds-combo__list" id="type-list" role="listbox">
  <ul class="ds-combo__group" role="group" aria-labelledby="type-laptops">
    <li class="ds-combo__heading" id="type-laptops" role="presentation">Laptops</li>
    <li class="ds-combo__option" id="type-1" role="option" aria-selected="false">
      <span class="ds-combo__name">Laptop 14</span>
      <span class="ds-combo__description">For most desks: light, with a full day of battery.</span></li>
  </ul>
  <ul class="ds-combo__group" role="group" aria-labelledby="type-desktops"> ... </ul>
</div>
```

**Clearable**: a `.ds-combo__clear` before the toggle. The page empties the field and sets `hidden` on the button while
there is nothing to clear; the field keeps room for it only while it shows. Unlike the toggle it stays in the tab
order, so it has the ring (and the press, the ripple and the morph of the toggle). Cancel its `mousedown` too, and give
focus back to the field after a click.

```html
<button class="ds-combo__clear" type="button" aria-label="Clear model" hidden>[icon close 20]</button>
```

**Creatable**: a last option `.ds-combo__option--create`, an icon and the words in the action ink. The page shows it
when no option matches the text exactly, and creates the value.

```html
<li class="ds-combo__option ds-combo__option--create" id="model-new" role="option" aria-selected="false">[icon plus 20]
  <span class="ds-combo__name">Create "Laptop 15"</span></li>
```

**Several values** (`.ds-combo--multi`, with `aria-multiselectable="true"` on the list): the `.ds-combo` draws the field
box and holds the chosen values as input chips ([Chips](#chips)) before the typing field, which wraps under them. Empty,
the box is the field's height at every step; the chips make it grow, and the toggle stays on its first line. The box
shows hover, focus, error, disabled and read-only for the field inside it.
Choosing leaves the list open; adding, removing and Backspace in the empty field are the page's script, and so is a press
on an empty part of the box, which only the page can send to the field:

```html
<div class="ds-combo ds-combo--multi">
  <button class="ds-chip ds-chip--input" type="button"><span class="ds-chip__body"><span class="ds-chip__label"><span class="ds-sr">Remove </span>Laptop 14</span>[icon close 18 ds-chip__trailing]</span></button>
  <input class="ds-input ds-combo__input" role="combobox" aria-expanded="false" aria-controls="order-list" aria-autocomplete="list">
  <button class="ds-combo__toggle" type="button" tabindex="-1" aria-label="Show all">[icon chevronDown 20]</button>
  <div class="ds-combo__popup" hidden><ul class="ds-combo__list" id="order-list" role="listbox" aria-multiselectable="true"> ... </ul></div>
</div>
```

```js
combo.addEventListener('mousedown', (event) => {
  if (event.target === combo) { event.preventDefault(); input.focus(); }
});
```

**States.** Nothing found: `hidden` on `.ds-combo__list` and the words in the status line; the list stays open. Loading:
a `.ds-spinner` before the words in the status line and `aria-busy="true"` on the list. Error: `aria-invalid="true"` on
the field, with a `.ds-field__hint--error`. `aria-disabled="true"` on an option draws it in the disabled ink with no
active layer (skip it in your keys). `disabled` on the field takes its toggle with it (the disabled ink, no pointer)
and removes its clear button, from the tab order too. In `.ds-combo--multi` the chips lose the pointer, but CSS cannot
block their keys: the page sets `disabled` on each chip as well. A disabled select-only button takes its value and meta
into the disabled ink. An option both chosen and blocked keeps its tint and weight in the disabled ink. Without a `.ds-combo__toggle` the field keeps only its
own end padding.

**Behaviour by the system** (`data-ds-combobox`, `DS.combobox`). The same markup; with the attribute the system does what
the page's script did above, on the list engine of the [Listbox](#listbox). Without it a combobox stays the page's, as
in 2.x.

```html
<div class="ds-combo" data-ds-combobox data-ds-combobox-creatable>
  <input class="ds-input ds-combo__input" id="model" role="combobox" aria-expanded="false" aria-controls="model-list" aria-autocomplete="list">
  <button class="ds-combo__clear" type="button" aria-label="Clear model" hidden>[icon close 20]</button>
  <button class="ds-combo__toggle" type="button" tabindex="-1" aria-label="Show all">[icon chevronDown 20]</button>
  <div class="ds-combo__popup" hidden>
    <ul class="ds-combo__list" id="model-list" role="listbox">
      <li class="ds-combo__option" role="option" aria-selected="false" data-value="l14"><span class="ds-combo__name">Laptop 14</span></li>
    </ul>
    <p class="ds-combo__status" role="status"></p>
  </div>
</div>
```

```js
const people = DS.combobox.create(el, {
  source: (query, { signal }) => fetch(`/api/people?q=${encodeURIComponent(query)}`, { signal }).then((r) => r.json()),
});
people.on('change', ({ value, item }) => save(value));
DS.combobox.open(el);  DS.combobox.close(el);   // DS.overlay on its popup
```

- **Filter.** Without `items` or a `source` the system works on the markup itself (the value is `data-value`, else the
  name's text): it sets `hidden` on the options that do not match, so each option keeps its content (a `.ds-progress`,
  an icon), its id and its place, and groups with no match go with their heading. `items` (as `DS.listbox`) are rendered
  instead, best first. As the field changes the list keeps what matches `DS.listbox.fuzzy()`: every word of the text, in
  any order, as a substring or as its letters in order ("lp 16" finds "Laptop 16"), case and accents aside. The matched
  letters are marked in a `.ds-combo__match` (the label weight and an underline, not colour alone). The chevron shows
  every option while the field shows the choice; typed text stays a filter.
- **A search elsewhere** (`source(query, { signal })`, a Promise of items): asked once the typing paused for
  `--ds-delay-loader` (`debounce` or `data-ds-combobox-debounce` in ms instead) and from `minLength` letters on
  (`data-ds-combobox-min`, default 1; with 0, opening the list asks for the empty field at once). While it runs the
  status line shows a spinner and "Loading" and the list `aria-busy="true"`; a newer query aborts the older one through
  `signal`; the results keep their order and show the matched letters; a failure says "That did not work. Try again.".
  `ds:search` (`{ query }`, cancelable) comes first. Choosing asks nothing: the field shows the choice, not a query.
- **Nothing found.** The list part hides and the status line says "No results"; the list stays open. Otherwise the status
  line counts the results ("3 results").
- **Creatable** (`data-ds-combobox-creatable`, `creatable`): while no option has the typed name, a last option
  `.ds-combo__option--create` says "Create “Tower 9”" (the markup's own, or one the system adds at the end of the list).
  Choosing it sends `ds:create` (`{ text }`, cancelable: the text stays typed), adds the value (with markup, a new option
  before the create one) and chooses it.
- **Clearable**: a `.ds-combo__clear` shows while the field has text or a value; it empties both and gives the focus
  back to the field.
- **Several values** (`.ds-combo--multi`): each chosen value becomes an input chip before the field (`Remove` and its
  name for a screen reader); choosing leaves the list open and empties the field; a press on a chip, or Backspace in the
  empty field, removes one. "Added Laptop 14" and "Removed Laptop 14" are announced.
- **Select-only** (`.ds-combo--select`): Enter, Space, ArrowDown and ArrowUp open the list on the chosen option, Home
  and End open it on the first or the last one, letters jump to a name, Enter or Space chooses, Tab chooses the active
  option and moves on (the WAI select-only pattern); the button shows the value and its meta. No status line.
- **Long lists**: `items` and the results of a source are windowed from `DS.listbox.VIRTUAL_FROM` on (`virtual`,
  `data-ds-combobox-virtual`). The markup's options are the page's and stay as they are: pass a long list as `items`.
- **Value.** One value, or a list with several. A single field that loses the focus shows the chosen name again; an
  emptied field chooses nothing. `data-ds-value` (a value, or a JSON list) or `value` sets the first one, else the options
  marked `aria-selected="true"`; `data-ds-combobox-name` (`name`) writes hidden inputs for a form.

The controller: `get()`, `set(value)` (no event), `on('change' | 'create' | 'search', fn)`, `setItems(items)`, `open()`,
`close()`, `list` (the engine, `DS.listbox`'s controller) and `destroy()`. `ds:change` (`{ value, item }`) bubbles from
the `.ds-combo` when the user chose. `item` is the chosen option's item (with markup: `{ value, label, description, meta, group, disabled }`).
`DS.combobox.create(el, options)` makes it, `DS.combobox.open(el)` and
`DS.combobox.close(el)` open and close the list through `DS.overlay`. Keys: as above (the WAI combobox), plus Alt+ArrowDown
opens without moving, Alt+ArrowUp closes, PageDown and PageUp move ten options, Tab closes without choosing (select-only:
chooses the active option first).

**Options** ([options.md](options.md)): classes on the `.ds-combo` or any ancestor; the nearest wins.

| Option | Classes | Where it applies | Effect on the combobox |
|---|---|---|---|
| Variant | `--select` (select-only), `--multi` (several values); `.ds-combo__option--create` | the `.ds-combo`; the option | what the field holds |
| Size | `.ds-xs`, `.ds-sm`, `.ds-md`, `.ds-lg`, `.ds-xl` | the `.ds-combo` or a group | the field and its toggle 24 to 56px (8px per step), an option 32 to 64px, the name's type role (`xs` caption, `sm` chip, `md` body, `lg` and `xl` subtitle; regular weight, the chosen one the label's) |
| Density | `.ds-density-comfortable`, `-compact`, `-dense`, `-tight` | any container | the field, its toggle and an option 4px less per step, the block padding of options and the status line 2px less per step; side padding and type stay. The toggle lives in the field, so unlike an icon button it follows the density |
| Shape | `.ds-shape-square`, `-soft`, `-default`, `-round` | any container or the theme | the list's radius and the rest and pressed radius of the toggle and clear button, times 0, .5, 1, 1.5 |
| Touch | `.ds-touch` | the theme or a container | field, toggle, clear button and options at least `--ds-touch-target` (48px), whatever the size and the density |
| Tone | none | | a combobox shows no status of its own; the invalid look is the field's |

Put a size on the `.ds-combo`, not on the input: the field, the toggle and the room between them come from one height.
An option's height is a least height: a name with a description takes what its text needs.

The toggle is a round target as tall as the field with a state layer (hover, press in `--ds-dur-micro`), the ripple and
the press morph of every pill; it stays `tabindex="-1"` (the field opens the list from the keyboard), so it has no ring.
Options get no ripple: pressing one selects it and closes the list, and the state layer is the feedback.

**Keyboard and names.** The keys are the page's script, as the WAI combobox pattern says: ArrowDown and ArrowUp open the
list and move `data-active` and `aria-activedescendant` through the options (past headings and blocked options), Enter
chooses, Escape closes (`DS.overlay` handles it, after the page's own handlers). When the list closes, on Escape, on blur
or by a choice, the page clears `data-active` and `aria-activedescendant`, so the field never names an option in a hidden
list. Focus stays in the field. The field
needs a label; a group its `aria-labelledby`; the toggle and the clear button an `aria-label`. The status line is
`role="status"`, so a count or "No match" is announced.

**Forced colours.** The list keeps an edge (its transparent outline). The chosen option is `SelectedItem` /
`SelectedItemText`, the active one has a `Highlight` outline (`CanvasText` on the chosen one), a blocked one `GrayText` (chosen too: on
`Canvas` with a `GrayText` outline).
The box of several values keeps its border, with a 2px `Highlight` outline while focused (as a single field has) and
`GrayText` when disabled, with the toggle of a disabled field.

**Hooks:** `--ds-input-height` (the base of the field and its toggle, 40px; the field's other hooks apply to the box of
several values too: `--ds-input-border`, `--ds-input-bg`, `--ds-input-radius`, `--ds-input-focus-color`),
`--ds-combo-option-height` (the base of an option, 48px), `--ds-combo-radius` (the list, `--ds-radius-xs`),
`--ds-scroll-fade` ([theming.md](theming.md#component-hooks)). The attributes `data-active` (the page's),
`data-state`, `data-placement`, `data-anchored`, `data-ds-overflow-start` and `data-ds-overflow-end` (`DS.overlay`'s)
and `data-ds-ripple` (off for a part: [Ripple](#ripple)) are described above.

**Motion:** the "Combobox list" row of [Overlays](motion.md#overlays) in motion.md.

<!-- changelog -->
- Combobox: `data-ds-combobox` and `DS.combobox` (`create`, `open`, `close`): the behaviour by the system on the same
  markup, through the list engine of `DS.listbox`: fuzzy filter with scoring and `.ds-combo__match`, an async `source`
  with debounce, abort and a loading state, creatable (`ds:create`), clearable, several values with chips, nothing
  found, windowed long lists, select-only keys. A page's own script keeps working without the attribute.
- Combobox: `--ds-scroll-edge-start` and `--ds-scroll-edge-end` are registered once in `tokens.css` (no longer in
  `scroller.css`), so the list's cut edges fade when `combobox.css` is linked without `scroller.css`.
